import React, { useMemo, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, ReferenceLine, PieChart, Pie, Legend } from 'recharts';
import { Trade, TradeStatus, DashboardStats, DailyNote, TradeType } from '../types.ts';
import { TrendingUp, IndianRupee, Activity, Target, Zap, Share2, Calendar as CalendarIcon, PieChart as PieChartIcon, ChevronLeft, ChevronRight, X, MessageCircle, BarChart2, Book, PenLine, Save, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface DashboardProps {
  trades: Trade[];
  dailyNotes: DailyNote[];
  onSaveNote: (note: DailyNote) => void;
  theme: 'light' | 'dark';
  primaryColor: string;
}

const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6'];

const Dashboard: React.FC<DashboardProps> = ({ trades, dailyNotes, onSaveNote, theme, primaryColor }) => {
  // Calendar View State
  const [currentDateView, setCurrentDateView] = useState(new Date());
  
  // Modals
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [dayDetailModalOpen, setDayDetailModalOpen] = useState(false);
  
  // Detail View State
  const [selectedDay, setSelectedDay] = useState<{ dateStr: string, displayDate: string } | null>(null);
  const [noteContent, setNoteContent] = useState('');
  const [noteMood, setNoteMood] = useState<string>('Neutral');

  const [todaysStats, setTodaysStats] = useState<{
      stats: DashboardStats, 
      dateStr: string, 
      psychology: string,
      message: string
  } | null>(null);

  // Chart Theme Config
  const chartColors = useMemo(() => {
    const isDark = theme === 'dark';
    return {
        grid: isDark ? '#334155' : '#e2e8f0',
        text: isDark ? '#94a3b8' : '#64748b',
        tooltipBg: isDark ? '#1e293b' : '#ffffff',
        tooltipBorder: isDark ? '#334155' : '#e2e8f0',
        tooltipText: isDark ? '#e2e8f0' : '#1e293b'
    };
  }, [theme]);

  const stats: DashboardStats = useMemo(() => {
    // Filter and sort closed trades by date (and ID for deterministic order) for accurate streak calculation
    const closedTrades = trades
      .filter((t) => t.status === TradeStatus.CLOSED && t.pnl !== undefined)
      .sort((a, b) => {
          const dateDiff = new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime();
          if (dateDiff !== 0) return dateDiff;
          return a.id.localeCompare(b.id);
      });

    const totalTrades = closedTrades.length;
    const wins = closedTrades.filter((t) => (t.pnl || 0) > 0);
    const losses = closedTrades.filter((t) => (t.pnl || 0) <= 0);
    
    const totalWinPnl = wins.reduce((acc, t) => acc + (t.pnl || 0), 0);
    const totalLossPnl = Math.abs(losses.reduce((acc, t) => acc + (t.pnl || 0), 0));
    
    const netPnL = totalWinPnl - totalLossPnl;
    const winRate = totalTrades > 0 ? (wins.length / totalTrades) * 100 : 0;
    const avgWin = wins.length > 0 ? totalWinPnl / wins.length : 0;
    const avgLoss = losses.length > 0 ? totalLossPnl / losses.length : 0;
    const profitFactor = totalLossPnl > 0 ? totalWinPnl / totalLossPnl : totalWinPnl > 0 ? 999 : 0;

    // Streak Calculation
    let currentWinStreakCounter = 0;
    let maxWinStreak = 0;
    let currentStreak = 0; // Positive for Win Streak, Negative for Loss Streak

    for (const trade of closedTrades) {
      const pnl = trade.pnl || 0;
      if (pnl > 0) {
        currentWinStreakCounter++;
        maxWinStreak = Math.max(maxWinStreak, currentWinStreakCounter);
        
        if (currentStreak >= 0) {
            currentStreak++;
        } else {
            currentStreak = 1;
        }
      } else {
        currentWinStreakCounter = 0;
        
        if (currentStreak <= 0) {
            currentStreak--;
        } else {
            currentStreak = -1;
        }
      }
    }

    return {
      totalTrades,
      winRate,
      netPnL,
      avgWin,
      avgLoss,
      profitFactor,
      maxWinStreak,
      currentStreak
    };
  }, [trades]);

  const equityCurveData = useMemo(() => {
    let runningBalance = 0;
    // Sort by date ascending
    const sortedTrades = [...trades]
        .filter(t => t.status === TradeStatus.CLOSED)
        .sort((a, b) => new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime());

    return sortedTrades.map(t => {
      runningBalance += (t.pnl || 0);
      return {
        date: new Date(t.entryDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        equity: runningBalance,
        pnl: t.pnl
      };
    });
  }, [trades]);

  const monthlyChartData = useMemo(() => {
    const data: Record<string, number> = {};
    
    trades
      .filter(t => t.status === TradeStatus.CLOSED)
      .forEach(t => {
        const date = new Date(t.entryDate);
        // Key format YYYY-MM for sorting
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        data[key] = (data[key] || 0) + (t.pnl || 0);
      });

    return Object.entries(data)
      .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
      .map(([key, pnl]) => {
        const [year, month] = key.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1);
        return {
          name: date.toLocaleString('default', { month: 'short', year: '2-digit' }),
          pnl: pnl
        };
      });
  }, [trades]);

  const strategyData = useMemo(() => {
    const counts: Record<string, number> = {};
    trades.forEach(t => {
        const s = t.setup || 'Other';
        counts[s] = (counts[s] || 0) + 1;
    });
    return Object.entries(counts)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);
  }, [trades]);

  const calendarData = useMemo(() => {
    const year = currentDateView.getFullYear();
    const month = currentDateView.getMonth();
    
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 = Sun
    
    const days = [];
    
    // Padding for empty days
    for (let i = 0; i < firstDayOfWeek; i++) {
        days.push({ day: null });
    }
    
    // Actual days
    for (let i = 1; i <= daysInMonth; i++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        // Find trades for this day
        const dayTrades = trades.filter(t => t.entryDate.startsWith(dateStr) && t.status === TradeStatus.CLOSED);
        const dailyPnl = dayTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
        const hasTrades = dayTrades.length > 0;
        
        // Find Note
        const note = dailyNotes.find(n => n.date === dateStr);
        const hasNote = !!note;

        days.push({ 
            day: i, 
            dateStr, 
            pnl: dailyPnl, 
            hasTrades,
            hasNote 
        });
    }
    
    return { year, month, days, monthName: currentDateView.toLocaleString('default', { month: 'long' }) };
  }, [trades, dailyNotes, currentDateView]);

  const changeMonth = (delta: number) => {
    setCurrentDateView(prev => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
  };

  const handleDayClick = (dateStr: string) => {
    const dateObj = new Date(dateStr);
    const displayDate = dateObj.toLocaleDateString('default', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    
    // Load Note
    const existingNote = dailyNotes.find(n => n.date === dateStr);
    setNoteContent(existingNote?.content || '');
    setNoteMood(existingNote?.mood || 'Neutral');

    setSelectedDay({ dateStr, displayDate });
    setDayDetailModalOpen(true);
  };

  const saveCurrentNote = () => {
    if (selectedDay) {
        onSaveNote({
            date: selectedDay.dateStr,
            content: noteContent,
            mood: noteMood as any
        });
        setDayDetailModalOpen(false);
    }
  };

  // Helper for daily report...
  const prepareDailyStats = () => {
    const today = new Date().toISOString().split('T')[0];
    const todaysTrades = trades.filter(t => t.entryDate.startsWith(today) && t.status === TradeStatus.CLOSED);
    
    if (todaysTrades.length === 0) {
        alert("No closed trades for today to report!");
        return null;
    }

    const todayPnL = todaysTrades.reduce((acc, t) => acc + (t.pnl || 0), 0);
    const winTrades = todaysTrades.filter(t => (t.pnl || 0) > 0);
    const lossTrades = todaysTrades.filter(t => (t.pnl || 0) <= 0);

    const wins = winTrades.length;
    const losses = lossTrades.length;
    const winRate = todaysTrades.length > 0 ? (wins / todaysTrades.length) * 100 : 0;
    
    const bestWin = winTrades.length > 0 ? Math.max(...winTrades.map(t => t.pnl || 0)) : 0;
    const maxLoss = lossTrades.length > 0 ? Math.min(...lossTrades.map(t => t.pnl || 0)) : 0;

    const psychologyTags = [...new Set(todaysTrades.flatMap(t => t.notes.match(/#\w+/g) || []))].join(' ');
    
    const dateObj = new Date();
    const dateStr = `${String(dateObj.getDate()).padStart(2, '0')}/${String(dateObj.getMonth() + 1).padStart(2, '0')}/${dateObj.getFullYear()}`;

    // Stats Object for image generation
    const dailyStats: DashboardStats = {
        netPnL: todayPnL,
        totalTrades: todaysTrades.length,
        winRate,
        maxWinStreak: 0,
        currentStreak: 0,
        avgWin: bestWin,
        avgLoss: maxLoss,
        profitFactor: 0
    };

    const message = `
🌅 Daily Trade Report
📅 ${dateStr}

💰 Net P&L: ₹${todayPnL.toFixed(2)}
📊 Trades: ${todaysTrades.length} (${wins} Win / ${losses} Loss)
🎯 Win Rate: ${winRate.toFixed(0)}%

🏆 Best Win: ₹${bestWin.toFixed(2)}
⚠️ Max Loss: ₹${maxLoss.toFixed(2)}

🧘‍♂️ Psychology: ${psychologyTags || 'N/A'}

🔹 Generated by TradeMaster AI 🔹
    `.trim();

    return { stats: dailyStats, dateStr, psychology: psychologyTags, message };
  };

  const openReportModal = () => {
      const data = prepareDailyStats();
      if (data) {
          setTodaysStats(data);
          setReportModalOpen(true);
      }
  };

  const handleWhatsAppShare = () => {
    if (!todaysStats) return;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(todaysStats.message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="space-y-6 animate-fade-in transition-colors">
      <div className="flex justify-between items-center mb-2">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-200 tracking-tight">Performance Overview</h2>
          <p className="text-slate-500 text-sm">Track your progress and trading metrics.</p>
        </div>
        <button 
            onClick={openReportModal}
            className="hidden md:flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-md active:scale-95"
        >
            <Share2 size={18} />
            <span>Daily Report</span>
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-gray-200 dark:border-slate-700/60 shadow-sm relative overflow-hidden group hover:border-emerald-500/30 transition-all">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400">
               <IndianRupee size={22} />
            </div>
            {(stats.netPnL >= 0) ? 
              <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full flex items-center">+ Profitable</span> :
              <span className="text-xs font-bold text-rose-600 bg-rose-100 px-2 py-1 rounded-full flex items-center">Drawdown</span>
            }
          </div>
          <div>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Net P&L</p>
            <h3 className={`text-3xl font-bold mt-1 tracking-tight font-mono ${stats.netPnL >= 0 ? 'text-slate-900 dark:text-white' : 'text-slate-900 dark:text-white'}`}>
                <span className={stats.netPnL >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                    ₹{stats.netPnL.toLocaleString()}
                </span>
            </h3>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-gray-200 dark:border-slate-700/60 shadow-sm relative overflow-hidden group hover:border-blue-500/30 transition-all">
          <div className="flex justify-between items-start mb-4">
             <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
               <Target size={22} />
             </div>
             <span className="text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-full">{stats.totalTrades} Trades</span>
          </div>
          <div>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Win Rate</p>
            <h3 className="text-3xl font-bold mt-1 tracking-tight text-slate-900 dark:text-white">
              {stats.winRate.toFixed(1)}<span className="text-lg text-slate-400 font-normal">%</span>
            </h3>
          </div>
          {/* Mini progress bar */}
          <div className="w-full bg-gray-100 dark:bg-slate-700 h-1.5 mt-4 rounded-full overflow-hidden">
             <div className="bg-blue-500 h-full rounded-full" style={{ width: `${stats.winRate}%` }}></div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-gray-200 dark:border-slate-700/60 shadow-sm relative overflow-hidden group hover:border-amber-500/30 transition-all">
          <div className="flex justify-between items-start mb-4">
             <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400">
               <Activity size={22} />
             </div>
          </div>
          <div>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Profit Factor</p>
            <h3 className="text-3xl font-bold mt-1 tracking-tight text-slate-900 dark:text-white">
              {stats.profitFactor.toFixed(2)}
            </h3>
          </div>
          <div className="mt-3 flex items-center text-xs text-slate-500">
             <span className="text-slate-400 mr-2">Avg Win: <span className="text-emerald-500 font-semibold">₹{stats.avgWin.toFixed(0)}</span></span>
             <span className="text-slate-400">Avg Loss: <span className="text-rose-500 font-semibold">₹{stats.avgLoss.toFixed(0)}</span></span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-gray-200 dark:border-slate-700/60 shadow-sm relative overflow-hidden group hover:border-purple-500/30 transition-all">
          <div className="flex justify-between items-start mb-4">
             <div className="p-2.5 rounded-lg bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400">
               <Zap size={22} />
             </div>
             <span className={`text-xs font-bold px-2 py-1 rounded-full flex items-center ${stats.currentStreak > 0 ? 'bg-emerald-100 text-emerald-600' : stats.currentStreak < 0 ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-500'}`}>
                {stats.currentStreak > 0 ? <ArrowUpRight size={12} className="mr-1"/> : stats.currentStreak < 0 ? <ArrowDownRight size={12} className="mr-1"/> : null}
                {Math.abs(stats.currentStreak)} Streak
             </span>
          </div>
          <div>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Max Win Streak</p>
            <h3 className="text-3xl font-bold mt-1 tracking-tight text-slate-900 dark:text-white">
               {stats.maxWinStreak}
            </h3>
          </div>
        </div>
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm h-[400px] transition-colors">
          <div className="flex items-center justify-between mb-6">
             <h4 className="text-lg font-bold text-slate-900 dark:text-slate-200">Equity Curve</h4>
             <select className="text-xs bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded px-2 py-1 text-slate-600 dark:text-slate-300 outline-none">
                <option>All Time</option>
             </select>
          </div>
          <ResponsiveContainer width="100%" height="85%">
            <AreaChart data={equityCurveData}>
              <defs>
                <linearGradient id="colorEquity" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={primaryColor} stopOpacity={0.2}/>
                  <stop offset="95%" stopColor={primaryColor} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartColors.grid} />
              <XAxis 
                dataKey="date" 
                stroke={chartColors.text} 
                fontSize={11} 
                tickLine={false}
                axisLine={false}
                tickMargin={10}
              />
              <YAxis 
                stroke={chartColors.text} 
                fontSize={11} 
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => `₹${val/1000}k`}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: chartColors.tooltipBg, border: `1px solid ${chartColors.tooltipBorder}`, borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                itemStyle={{ color: chartColors.tooltipText, fontWeight: 600, fontSize: '12px' }}
                labelStyle={{ color: chartColors.text, fontSize: '11px', marginBottom: '4px' }}
                formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Equity']}
              />
              <Area type="monotone" dataKey="equity" stroke={primaryColor} strokeWidth={2.5} fillOpacity={1} fill="url(#colorEquity)" dot={false} activeDot={{ r: 6, strokeWidth: 0 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm h-[400px] transition-colors">
          <h4 className="text-lg font-bold text-slate-900 dark:text-slate-200 mb-6">Recent P&L</h4>
          <ResponsiveContainer width="100%" height="85%">
            <BarChart data={equityCurveData.slice(-10)}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} horizontal={true} vertical={false} />
              <XAxis dataKey="date" tick={{fontSize: 10, fill: chartColors.text}} axisLine={false} tickLine={false} />
              <ReferenceLine y={0} stroke={chartColors.text} />
              <Tooltip 
                cursor={{fill: chartColors.grid, opacity: 0.2}}
                contentStyle={{ backgroundColor: chartColors.tooltipBg, border: `1px solid ${chartColors.tooltipBorder}`, borderRadius: '8px' }}
                formatter={(value: number) => [`₹${value.toLocaleString()}`, 'P&L']}
                labelStyle={{ color: chartColors.text, fontSize: '11px' }}
                itemStyle={{ color: chartColors.tooltipText, fontWeight: 'bold' }}
              />
              <Bar dataKey="pnl" radius={[4, 4, 4, 4]}>
                {equityCurveData.slice(-10).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={(entry.pnl || 0) >= 0 ? '#10b981' : '#f43f5e'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Monthly P&L Chart */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm h-[350px] transition-colors">
          <div className="flex items-center space-x-2 mb-6">
            <BarChart2 className="text-primary-500 dark:text-primary-400" size={20} />
            <h4 className="text-lg font-bold text-slate-900 dark:text-slate-200">Monthly Performance</h4>
          </div>
          <ResponsiveContainer width="100%" height="80%">
            <BarChart data={monthlyChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} vertical={false} />
              <XAxis dataKey="name" stroke={chartColors.text} fontSize={12} axisLine={false} tickLine={false} />
              <YAxis stroke={chartColors.text} fontSize={12} axisLine={false} tickLine={false} />
              <Tooltip 
                cursor={{fill: chartColors.grid, opacity: 0.2}}
                contentStyle={{ backgroundColor: chartColors.tooltipBg, border: `1px solid ${chartColors.tooltipBorder}`, borderRadius: '8px' }}
                formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Net P&L']}
                labelStyle={{ color: chartColors.text }}
                itemStyle={{ color: chartColors.tooltipText, fontWeight: 'bold' }}
              />
              <ReferenceLine y={0} stroke={chartColors.text} />
              <Bar dataKey="pnl" radius={[4, 4, 4, 4]} barSize={40}>
                {monthlyChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={(entry.pnl || 0) >= 0 ? '#10b981' : '#f43f5e'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
      </div>

      {/* Strategy & Calendar Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Strategy Pie Chart */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm h-[400px] flex flex-col transition-colors">
            <div className="flex items-center space-x-2 mb-2">
                <PieChartIcon className="text-primary-500 dark:text-primary-400" size={20} />
                <h4 className="text-lg font-bold text-slate-900 dark:text-slate-200">Strategy Distribution</h4>
            </div>
            <div className="flex-1 w-full relative">
                {strategyData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={strategyData}
                                cx="50%"
                                cy="50%"
                                innerRadius={70}
                                outerRadius={100}
                                paddingAngle={4}
                                dataKey="value"
                                stroke="none"
                            >
                                {strategyData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip 
                                contentStyle={{ backgroundColor: chartColors.tooltipBg, border: `1px solid ${chartColors.tooltipBorder}`, borderRadius: '8px' }}
                                itemStyle={{ color: chartColors.tooltipText }}
                            />
                            <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ color: chartColors.text, fontSize: '12px' }} />
                        </PieChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-slate-400 dark:text-slate-500 text-sm">
                        No trade data available
                    </div>
                )}
            </div>
        </div>

        {/* Monthly P&L Calendar */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm h-[400px] overflow-hidden flex flex-col transition-colors">
             <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-2">
                    <CalendarIcon className="text-primary-500 dark:text-primary-400" size={20} />
                    <h4 className="text-lg font-bold text-slate-900 dark:text-slate-200">
                        {calendarData.monthName} {calendarData.year}
                    </h4>
                </div>
                <div className="flex space-x-1 bg-gray-100 dark:bg-slate-700 rounded-lg p-0.5">
                    <button onClick={() => changeMonth(-1)} className="p-1.5 hover:bg-white dark:hover:bg-slate-600 rounded-md text-slate-500 dark:text-slate-400 shadow-sm transition-all">
                        <ChevronLeft size={18} />
                    </button>
                    <button onClick={() => changeMonth(1)} className="p-1.5 hover:bg-white dark:hover:bg-slate-600 rounded-md text-slate-500 dark:text-slate-400 shadow-sm transition-all">
                        <ChevronRight size={18} />
                    </button>
                </div>
             </div>
             
             {/* Calendar Grid Header */}
             <div className="grid grid-cols-7 gap-2 text-center text-[10px] font-bold text-slate-400 mb-3 uppercase tracking-wider">
                <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
             </div>
             
             {/* Calendar Days */}
             <div className="grid grid-cols-7 gap-2 flex-1 auto-rows-fr">
                {calendarData.days.map((d, i) => {
                    if (d.day === null) return <div key={i} className="bg-transparent" />;
                    
                    let bgClass = "bg-slate-5 dark:bg-slate-800/30 border-slate-100 dark:border-slate-700/50 text-slate-400 dark:text-slate-600 hover:border-slate-300 dark:hover:border-slate-500 cursor-pointer";
                    let pnlText = null;
                    let amountClass = "";

                    if (d.hasTrades) {
                        if ((d.pnl || 0) > 0) {
                            bgClass = "bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-500/30 hover:border-emerald-300 cursor-pointer";
                            amountClass = "text-emerald-600 dark:text-emerald-400";
                            pnlText = `+${(d.pnl! / 1000).toFixed(1)}k`; 
                        } else if ((d.pnl || 0) < 0) {
                            bgClass = "bg-rose-50 dark:bg-rose-900/10 border-rose-200 dark:border-rose-500/30 hover:border-rose-300 cursor-pointer";
                            amountClass = "text-rose-600 dark:text-rose-400";
                            pnlText = `-${(Math.abs(d.pnl!) / 1000).toFixed(1)}k`;
                        } else {
                            bgClass = "bg-slate-100 dark:bg-slate-700 border-slate-200 dark:border-slate-600 cursor-pointer";
                            amountClass = "text-slate-600 dark:text-slate-300";
                            pnlText = "0";
                        }
                    }

                    return (
                        <div 
                            key={i} 
                            onClick={() => d.dateStr && handleDayClick(d.dateStr)}
                            className={`rounded-lg border p-1.5 flex flex-col justify-between items-center transition-all hover:-translate-y-0.5 ${bgClass} relative group`}
                        >
                            <div className="flex justify-between w-full">
                                <span className={`text-[10px] font-medium ${d.hasTrades ? 'text-slate-600 dark:text-slate-300' : ''}`}>{d.day}</span>
                                {d.hasNote && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                                )}
                            </div>
                            {d.hasTrades && (
                                <span className={`text-[10px] font-bold ${amountClass}`}>
                                    {pnlText || (Math.abs(d.pnl || 0) < 1000 ? Math.abs(d.pnl || 0) : pnlText)}
                                </span>
                            )}
                        </div>
                    );
                })}
             </div>
        </div>
      </div>

      {/* Report Modal */}
      {reportModalOpen && todaysStats && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 shadow-2xl w-full max-w-lg overflow-hidden transition-colors flex flex-col max-h-[90vh]">
                <div className="p-4 border-b border-gray-200 dark:border-slate-700 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center">
                        <Share2 size={20} className="mr-2 text-primary-500" />
                        Daily Report ({todaysStats.dateStr})
                    </h3>
                    <button onClick={() => setReportModalOpen(false)} className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
                        <X size={24} />
                    </button>
                </div>
                
                <div className="p-6 overflow-y-auto">
                    <div className="space-y-6">
                        {/* Text Report Option */}
                        <div className="bg-gray-50 dark:bg-slate-800 p-4 rounded-lg border border-gray-200 dark:border-slate-700">
                             <div className="flex justify-between items-center mb-2">
                                <h4 className="font-semibold text-slate-900 dark:text-white flex items-center">
                                    <MessageCircle size={18} className="mr-2 text-green-500" />
                                    Text Summary
                                </h4>
                             </div>
                             <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 line-clamp-2">
                                {todaysStats.message}
                             </p>
                             <button 
                                onClick={handleWhatsAppShare}
                                className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg text-sm font-medium transition-colors flex justify-center items-center shadow-lg shadow-green-600/20"
                             >
                                <Share2 size={16} className="mr-2" /> Share on WhatsApp
                             </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* Day Details / Journal Modal */}
      {dayDetailModalOpen && selectedDay && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden transition-colors">
                {/* Header */}
                <div className="p-4 border-b border-gray-200 dark:border-slate-700 flex justify-between items-center bg-gray-50 dark:bg-slate-800/50">
                    <div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center">
                            <Book size={20} className="mr-2 text-primary-500" />
                            {selectedDay.displayDate}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Daily Journal & Trade Log</p>
                    </div>
                    <button onClick={() => setDayDetailModalOpen(false)} className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
                        <X size={24} />
                    </button>
                </div>

                <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                    {/* Left: Journal Note */}
                    <div className="w-full md:w-1/3 p-6 border-b md:border-b-0 md:border-r border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-y-auto">
                        <div className="flex items-center space-x-2 mb-4">
                            <PenLine className="text-purple-500" size={18} />
                            <h4 className="font-semibold text-slate-800 dark:text-slate-200">Daily Note</h4>
                        </div>
                        
                        <div className="space-y-4 h-full flex flex-col">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Mood</label>
                                <div className="flex flex-wrap gap-2">
                                    {['Happy', 'Neutral', 'Sad', 'Frustrated', 'Disciplined'].map(m => (
                                        <button 
                                            key={m} 
                                            onClick={() => setNoteMood(m)}
                                            className={`text-xs px-2 py-1 rounded border transition-colors ${
                                                noteMood === m 
                                                ? 'bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700' 
                                                : 'bg-transparent text-slate-500 border-slate-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800'
                                            }`}
                                        >
                                            {m}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            
                            <div className="flex-1">
                                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Content</label>
                                <textarea 
                                    value={noteContent}
                                    onChange={(e) => setNoteContent(e.target.value)}
                                    placeholder="How was your trading mindset today? Market conditions?"
                                    className="w-full h-[calc(100%-2rem)] p-3 rounded-lg bg-yellow-50 dark:bg-slate-800 border border-yellow-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                                />
                            </div>

                            <button 
                                onClick={saveCurrentNote}
                                className="w-full flex items-center justify-center space-x-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-2.5 rounded-lg font-medium hover:opacity-90 transition-opacity"
                            >
                                <Save size={16} />
                                <span>Save Note</span>
                            </button>
                        </div>
                    </div>

                    {/* Right: Trade Log */}
                    <div className="w-full md:w-2/3 p-6 bg-gray-50 dark:bg-slate-900/50 overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="font-semibold text-slate-800 dark:text-slate-200">Executed Trades</h4>
                            <div className="text-xs font-mono text-slate-500">
                                P&L: <span className={`${
                                    trades.filter(t => t.entryDate.startsWith(selectedDay.dateStr) && t.status === TradeStatus.CLOSED)
                                          .reduce((sum, t) => sum + (t.pnl || 0), 0) >= 0 ? 'text-emerald-500' : 'text-rose-500'
                                } font-bold`}>
                                    ₹{trades.filter(t => t.entryDate.startsWith(selectedDay.dateStr) && t.status === TradeStatus.CLOSED)
                                          .reduce((sum, t) => sum + (t.pnl || 0), 0).toFixed(2)}
                                </span>
                            </div>
                        </div>

                        <div className="space-y-3">
                            {trades.filter(t => t.entryDate.startsWith(selectedDay.dateStr)).length === 0 ? (
                                <div className="text-center py-10 text-slate-400">
                                    <p>No trades executed on this day.</p>
                                </div>
                            ) : (
                                trades.filter(t => t.entryDate.startsWith(selectedDay.dateStr)).map(trade => (
                                    <div key={trade.id} className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-gray-200 dark:border-slate-700 shadow-sm flex justify-between items-center group hover:border-primary-500/50 transition-colors">
                                        <div>
                                            <div className="flex items-center space-x-2">
                                                <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
                                                    trade.type === TradeType.LONG 
                                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' 
                                                    : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
                                                }`}>
                                                    {trade.type}
                                                </span>
                                                <span className="font-bold text-slate-900 dark:text-white">{trade.symbol}</span>
                                            </div>
                                            <p className="text-xs text-slate-500 mt-1">{trade.setup}</p>
                                        </div>
                                        <div className="text-right">
                                            <div className={`font-mono font-bold ${
                                                trade.status === TradeStatus.OPEN 
                                                ? 'text-slate-500' 
                                                : (trade.pnl || 0) >= 0 ? 'text-emerald-500' : 'text-rose-500'
                                            }`}>
                                                {trade.status === TradeStatus.OPEN 
                                                    ? 'OPEN' 
                                                    : `₹${(trade.pnl || 0).toFixed(2)}`
                                                }
                                            </div>
                                            <div className="text-[10px] text-slate-400">
                                                {trade.quantity} Qty @ {trade.entryPrice}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
         </div>
      )}
    </div>
  );
};

export default Dashboard;