import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Trade, AppSettings, ThemeColor, User, DailyNote } from './types';
import Dashboard from './components/Dashboard';
import TradeList from './components/TradeList';
import TradeForm from './components/TradeForm';
import SettingsModal from './components/SettingsModal';
import PositionCalculator from './components/PositionCalculator';
import AuthPage from './components/AuthPage';
import { analyzeTradeWithAI } from './services/geminiService';
import { supabase, fetchTrades, fetchDailyNotes, saveTradeToDb, deleteTradeFromDb, saveDailyNoteToDb } from './services/supabaseClient';
import { LayoutDashboard, BookOpen, Plus, Activity, Bot, X, Sun, Moon, Settings, LogOut, Calculator, Wifi, WifiOff, Heart, PieChart, BarChart3 } from 'lucide-react';

// Color Palette Definitions
const THEMES: Record<ThemeColor, Record<number, string>> = {
  blue: { 50: '#eff6ff', 100: '#dbeafe', 200: '#bfdbfe', 500: '#3b82f6', 600: '#2563eb', 700: '#1d4ed8', 900: '#1e3a8a' },
  purple: { 50: '#faf5ff', 100: '#f3e8ff', 200: '#e9d5ff', 500: '#a855f7', 600: '#9333ea', 700: '#7e22ce', 900: '#581c87' },
  orange: { 50: '#fff7ed', 100: '#ffedd5', 200: '#fed7aa', 500: '#f97316', 600: '#ea580c', 700: '#c2410c', 900: '#7c2d12' },
  teal: { 50: '#f0fdfa', 100: '#ccfbf1', 200: '#99f6e4', 500: '#14b8a6', 600: '#0d9488', 700: '#0f766e', 900: '#134e4a' },
  rose: { 50: '#fff1f2', 100: '#ffe4e6', 200: '#fecdd3', 500: '#f43f5e', 600: '#e11d48', 700: '#be123c', 900: '#881337' },
};

const App: React.FC = () => {
  // Auth State
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // App State
  const [trades, setTrades] = useState<Trade[]>([]);
  const [dailyNotes, setDailyNotes] = useState<DailyNote[]>([]);
  const [view, setView] = useState<'DASHBOARD' | 'JOURNAL' | 'CALCULATOR'>('DASHBOARD');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);
  
  // Theme State
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('theme');
        return (saved === 'light' || saved === 'dark') ? saved : 'dark';
    }
    return 'dark';
  });

  // Appearance Settings
  const [settings, setSettings] = useState<AppSettings>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('appSettings');
      return saved ? JSON.parse(saved) : { themeColor: 'blue', fontFamily: 'Inter' };
    }
    return { themeColor: 'blue', fontFamily: 'Inter' };
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // AI Modal State
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Network Status Listener
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Data Loading Function
  const loadData = useCallback(async () => {
    try {
        const [fetchedTrades, fetchedNotes] = await Promise.all([
            fetchTrades(),
            fetchDailyNotes()
        ]);
        setTrades(fetchedTrades);
        setDailyNotes(fetchedNotes);
    } catch (error) {
        console.error("Error loading data:", error);
    }
  }, []);

  // 1. Auth Listener Effect
  useEffect(() => {
    // Check initial session
    const initSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser({ 
            name: session.user.user_metadata.full_name || session.user.email?.split('@')[0] || 'Trader', 
            email: session.user.email! 
          });
        }
      } catch (err) {
        console.error("Session check failed", err);
      } finally {
        setLoading(false);
      }
    };
    
    initSession();

    // Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setUser({ 
          name: session.user.user_metadata.full_name || session.user.email?.split('@')[0] || 'Trader', 
          email: session.user.email! 
        });
      } else {
        setUser(null);
        setTrades([]);
        setDailyNotes([]);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // 2. Data & Realtime Subscription Effect (Runs when user changes)
  useEffect(() => {
    if (!user) return;

    loadData();

    // Setup Realtime Subscriptions
    const tradesChannel = supabase.channel('public:trades')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trades' }, () => {
        loadData();
      })
      .subscribe();

    const notesChannel = supabase.channel('public:daily_notes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'daily_notes' }, () => {
        loadData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(tradesChannel);
      supabase.removeChannel(notesChannel);
    };
  }, [user, loadData]);

  // 4. Save Notes Handler
  const handleSaveNote = async (note: DailyNote) => {
    try {
        // Optimistic Update
        const updated = dailyNotes.filter(n => n.date !== note.date);
        updated.push(note);
        setDailyNotes(updated);
        
        await saveDailyNoteToDb(note);
    } catch (error) {
        console.error("Error saving note:", error);
        alert("Failed to save note to cloud.");
        loadData(); // Revert
    }
  };

  // Handle Theme Change
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Handle Appearance Settings
  useEffect(() => {
    localStorage.setItem('appSettings', JSON.stringify(settings));

    const palette = THEMES[settings.themeColor];
    const root = document.documentElement;
    root.style.setProperty('--color-primary-50', palette[50]);
    root.style.setProperty('--color-primary-100', palette[100]);
    root.style.setProperty('--color-primary-200', palette[200]);
    root.style.setProperty('--color-primary-500', palette[500]);
    root.style.setProperty('--color-primary-600', palette[600]);
    root.style.setProperty('--color-primary-700', palette[700]);
    root.style.setProperty('--color-primary-900', palette[900]);
    root.style.setProperty('--font-family', `'${settings.fontFamily}', sans-serif`);

  }, [settings]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const handleSaveTrade = async (trade: Trade) => {
    try {
        // Optimistic UI Update
        if (editingTrade) {
            setTrades(prev => prev.map(t => t.id === trade.id ? trade : t));
        } else {
            setTrades(prev => [trade, ...prev]);
        }
        setIsFormOpen(false);
        setEditingTrade(null);

        // DB Save
        await saveTradeToDb(trade);
    } catch (error) {
        console.error("Failed to save trade:", error);
        alert("Failed to save trade to cloud.");
        loadData(); // Revert
    }
  };

  const handleDeleteTrade = async (id: string) => {
    if (confirm('Are you sure you want to delete this trade?')) {
        try {
            // Optimistic
            setTrades(prev => prev.filter(t => t.id !== id));
            await deleteTradeFromDb(id);
        } catch (error) {
            console.error("Failed to delete trade:", error);
            alert("Failed to delete trade from cloud.");
            loadData();
        }
    }
  };

  const handleEditTrade = (trade: Trade) => {
    setEditingTrade(trade);
    setIsFormOpen(true);
  };

  const handleAnalyzeTrade = async (trade: Trade) => {
    setAiModalOpen(true);
    setIsAnalyzing(true);
    setAiAnalysis('');
    const result = await analyzeTradeWithAI(trade);
    setAiAnalysis(result);
    setIsAnalyzing(false);
  };

  // Auth Handlers (Managed by AuthPage calling onLogin via useEffect listener mostly)
  const handleLoginSuccess = (userData: User) => {
    setUser(userData);
  };

  const handleLogout = async () => {
    try {
        setLoading(true);
        await supabase.auth.signOut();
    } catch (error) {
        console.error("Error during logout:", error);
    } finally {
        setUser(null);
        setTrades([]);
        setDailyNotes([]);
        setView('DASHBOARD');
        setLoading(false);
    }
  };

  if (loading) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white">
          <div className="w-12 h-12 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin mb-4"></div>
          <p className="text-slate-400 text-sm animate-pulse">Loading TradeMaster.AI...</p>
        </div>
      );
  }

  // If no user, show Auth Page
  if (!user) {
    return <AuthPage onLogin={handleLoginSuccess} />;
  }

  // Get current primary color hex for Charts
  const currentPrimaryColor = THEMES[settings.themeColor][500];

  const renderContent = () => {
      switch(view) {
          case 'DASHBOARD':
              return (
                <Dashboard 
                  trades={trades} 
                  dailyNotes={dailyNotes}
                  onSaveNote={handleSaveNote}
                  theme={theme} 
                  primaryColor={currentPrimaryColor} 
                />
              );
          case 'JOURNAL':
              return <TradeList trades={trades} onDelete={handleDeleteTrade} onEdit={handleEditTrade} onAnalyze={handleAnalyzeTrade} />;
          case 'CALCULATOR':
              return <PositionCalculator />;
          default:
              return (
                <Dashboard 
                    trades={trades} 
                    dailyNotes={dailyNotes}
                    onSaveNote={handleSaveNote}
                    theme={theme} 
                    primaryColor={currentPrimaryColor} 
                />
              );
      }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-slate-950 text-slate-900 dark:text-slate-200 selection:bg-primary-500/30 transition-colors duration-300 flex flex-col font-sans">
      {/* Background Pattern */}
      <div className="fixed inset-0 z-[-1] pointer-events-none opacity-[0.03] dark:opacity-[0.05]" 
           style={{ backgroundImage: `radial-gradient(${theme === 'dark' ? '#ffffff' : '#000000'} 1px, transparent 1px)`, backgroundSize: '24px 24px' }}>
      </div>

      {/* Navbar */}
      <nav className="border-b border-gray-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl sticky top-0 z-30 transition-all duration-300 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3 cursor-pointer group" onClick={() => setView('DASHBOARD')}>
              <div className="bg-gradient-to-br from-primary-500 to-primary-700 p-2 rounded-xl shadow-lg shadow-primary-500/20 group-hover:scale-105 transition-transform duration-300">
                <Activity className="text-white" size={20} strokeWidth={2.5} />
              </div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 tracking-tight">
                TradeMaster<span className="text-primary-500">.AI</span>
              </span>
            </div>
            
            <div className="flex items-center space-x-2 md:space-x-4">
               {/* View Switcher (Desktop) */}
               <div className="hidden md:flex items-center space-x-1 bg-gray-100/80 dark:bg-slate-800/80 p-1.5 rounded-xl border border-gray-200 dark:border-slate-700/50">
                  <button 
                    onClick={() => setView('DASHBOARD')}
                    className={`flex items-center px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                      view === 'DASHBOARD' 
                        ? 'bg-white dark:bg-slate-700 text-primary-600 dark:text-white shadow-sm ring-1 ring-black/5 dark:ring-white/5' 
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-gray-200/50 dark:hover:bg-slate-700/50'
                    }`}
                  >
                    <BarChart3 size={18} className="mr-2" />
                    Dashboard
                  </button>
                  <button 
                    onClick={() => setView('JOURNAL')}
                    className={`flex items-center px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                      view === 'JOURNAL' 
                        ? 'bg-white dark:bg-slate-700 text-primary-600 dark:text-white shadow-sm ring-1 ring-black/5 dark:ring-white/5' 
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-gray-200/50 dark:hover:bg-slate-700/50'
                    }`}
                  >
                    <BookOpen size={18} className="mr-2" />
                    Journal
                  </button>
                  <button 
                    onClick={() => setView('CALCULATOR')}
                    className={`flex items-center px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                      view === 'CALCULATOR' 
                        ? 'bg-white dark:bg-slate-700 text-primary-600 dark:text-white shadow-sm ring-1 ring-black/5 dark:ring-white/5' 
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-gray-200/50 dark:hover:bg-slate-700/50'
                    }`}
                  >
                    <Calculator size={18} className="mr-2" />
                    Calculator
                  </button>
               </div>

              {/* Status & Theme */}
              <div className="flex items-center space-x-2 border-l border-gray-200 dark:border-slate-700 pl-4 ml-2">
                  <div title={isOnline ? "Cloud Sync Active" : "Offline Mode"} className="p-2 hidden sm:block">
                    {isOnline ? (
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                    ) : (
                        <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]"></div>
                    )}
                  </div>

                  <button 
                    onClick={toggleTheme}
                    className="p-2.5 rounded-xl text-slate-500 hover:bg-gray-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-all hover:ring-2 ring-gray-200 dark:ring-slate-700"
                    title="Toggle Theme"
                  >
                    {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                  </button>

                  <button 
                    onClick={() => setIsSettingsOpen(true)}
                    className="hidden md:block p-2.5 rounded-xl text-slate-500 hover:bg-gray-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-all hover:ring-2 ring-gray-200 dark:ring-slate-700"
                    title="Settings"
                  >
                    <Settings size={18} />
                  </button>
              </div>

              {/* User / Logout */}
              <div className="flex items-center pl-2 space-x-3">
                  <div className="hidden lg:block text-right">
                      <p className="text-xs font-bold text-slate-900 dark:text-white leading-none mb-1">{user.name}</p>
                      <p className="text-[10px] text-slate-500 font-medium">Pro Plan</p>
                  </div>
                  <button 
                    onClick={handleLogout}
                    className="p-2.5 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
                    title="Logout"
                  >
                    <LogOut size={18} />
                  </button>
              </div>

              {/* Desktop New Button */}
              <button 
                onClick={() => { setEditingTrade(null); setIsFormOpen(true); }}
                className="hidden md:flex items-center bg-slate-900 dark:bg-white hover:opacity-90 text-white dark:text-slate-900 px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-slate-900/20 transition-all active:scale-95"
              >
                <Plus size={18} className="mr-2" strokeWidth={3} />
                New Trade
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10 animate-fade-in flex-grow w-full pb-28 md:pb-10">
        {renderContent()}
      </main>

      {/* Bottom Nav (Mobile Only) */}
      <div className="fixed bottom-0 left-0 w-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-lg border-t border-gray-200 dark:border-slate-800 md:hidden z-40 px-6 py-3 flex justify-between items-center safe-area-pb shadow-[0_-5px_20px_rgba(0,0,0,0.1)]">
         <button 
            onClick={() => setView('DASHBOARD')} 
            className={`flex flex-col items-center p-2 rounded-xl transition-all ${view === 'DASHBOARD' ? 'text-primary-600 dark:text-white bg-primary-50 dark:bg-slate-800' : 'text-slate-400 dark:text-slate-500'}`}
         >
           <LayoutDashboard size={22} strokeWidth={view === 'DASHBOARD' ? 2.5 : 2} />
         </button>
         
         <button 
            onClick={() => setView('JOURNAL')} 
            className={`flex flex-col items-center p-2 rounded-xl transition-all ${view === 'JOURNAL' ? 'text-primary-600 dark:text-white bg-primary-50 dark:bg-slate-800' : 'text-slate-400 dark:text-slate-500'}`}
         >
           <BookOpen size={22} strokeWidth={view === 'JOURNAL' ? 2.5 : 2} />
         </button>

         {/* Floating Add Button in Middle */}
         <button 
           onClick={() => { setEditingTrade(null); setIsFormOpen(true); }}
           className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 p-4 rounded-full -mt-10 shadow-xl shadow-slate-900/30 border-[4px] border-white dark:border-slate-950 active:scale-90 transition-transform"
         >
           <Plus size={24} strokeWidth={3} />
         </button>

         <button 
            onClick={() => setView('CALCULATOR')} 
            className={`flex flex-col items-center p-2 rounded-xl transition-all ${view === 'CALCULATOR' ? 'text-primary-600 dark:text-white bg-primary-50 dark:bg-slate-800' : 'text-slate-400 dark:text-slate-500'}`}
         >
           <Calculator size={22} strokeWidth={view === 'CALCULATOR' ? 2.5 : 2} />
         </button>
         
         <button 
            onClick={() => setIsSettingsOpen(true)} 
            className="flex flex-col items-center p-2 rounded-xl text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
         >
           <Settings size={22} />
         </button>
      </div>

      {/* Footer */}
      <footer className="hidden md:block border-t border-gray-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center space-y-2">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1">
                &copy; {new Date().getFullYear()} TradeMaster.AI
            </p>
            <p className="text-xs text-slate-400">
                All rights reserved by DipzSpell
            </p>
        </div>
      </footer>

      {/* Trade Form Modal */}
      {isFormOpen && (
        <TradeForm 
          initialData={editingTrade} 
          onSave={handleSaveTrade} 
          onClose={() => { setIsFormOpen(false); setEditingTrade(null); }} 
        />
      )}

      {/* Appearance Settings Modal */}
      {isSettingsOpen && (
        <SettingsModal 
          settings={settings} 
          trades={trades}
          dailyNotes={dailyNotes}
          onUpdate={updateSettings} 
          onClose={() => setIsSettingsOpen(false)} 
        />
      )}

      {/* AI Analysis Modal */}
      {aiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-2xl w-full max-w-lg overflow-hidden transition-colors flex flex-col max-h-[90vh]">
            <div className="bg-gradient-to-r from-primary-600 to-indigo-600 dark:from-primary-900 dark:to-slate-900 p-5 flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm shadow-inner">
                    <Bot className="text-white" size={24} />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-white">Gemini Coach</h3>
                    <p className="text-white/70 text-xs">AI-Powered Trade Analysis</p>
                </div>
              </div>
              <button onClick={() => setAiModalOpen(false)} className="text-white/70 hover:text-white p-1 hover:bg-white/10 rounded-lg transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto">
              {isAnalyzing ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-6">
                  <div className="relative">
                     <div className="w-16 h-16 border-4 border-primary-100 dark:border-slate-800 rounded-full"></div>
                     <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
                     <Bot className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-primary-500" size={24} />
                  </div>
                  <div className="text-center">
                    <p className="text-slate-900 dark:text-white font-bold text-lg">Analyzing Trade</p>
                    <p className="text-slate-500 text-sm mt-1">Reviewing technicals & psychology...</p>
                  </div>
                </div>
              ) : (
                <div className="prose prose-sm prose-slate dark:prose-invert max-w-none">
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-xl border border-slate-100 dark:border-slate-700/50 text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line shadow-inner">
                    {aiAnalysis}
                  </div>
                </div>
              )}
            </div>
            <div className="p-4 bg-gray-50 dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 flex justify-end">
                <button 
                    onClick={() => setAiModalOpen(false)}
                    className="px-5 py-2.5 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 text-slate-700 dark:text-white border border-gray-200 dark:border-slate-600 rounded-xl transition-colors font-semibold text-sm shadow-sm"
                >
                    Close Analysis
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;