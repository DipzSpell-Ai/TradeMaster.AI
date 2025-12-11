import React, { useRef } from 'react';
import { X, Check, Download, Upload, Database, Trash2 } from 'lucide-react';
import { AppSettings, ThemeColor, FontFamily, Trade, DailyNote } from '../types';

interface SettingsModalProps {
  settings: AppSettings;
  trades: Trade[]; // Received from parent
  dailyNotes: DailyNote[]; // Received from parent
  onUpdate: (newSettings: Partial<AppSettings>) => void;
  onClose: () => void;
}

const COLORS: { id: ThemeColor; name: string; hex: string }[] = [
  { id: 'blue', name: 'Ocean Blue', hex: '#3b82f6' },
  { id: 'purple', name: 'Royal Purple', hex: '#a855f7' },
  { id: 'orange', name: 'Sunset Amber', hex: '#f97316' },
  { id: 'teal', name: 'Teal Mint', hex: '#14b8a6' },
  { id: 'rose', name: 'Rose Red', hex: '#f43f5e' },
];

const FONTS: { id: FontFamily; name: string; class: string }[] = [
  { id: 'Inter', name: 'Modern Sans', class: 'font-sans' },
  { id: 'Playfair Display', name: 'Professional Serif', class: 'font-serif' },
  { id: 'JetBrains Mono', name: 'Technical Mono', class: 'font-mono' },
];

const SettingsModal: React.FC<SettingsModalProps> = ({ settings, trades, dailyNotes, onUpdate, onClose }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportData = () => {
    // Collect all data from Props
    const userStr = localStorage.getItem('tradeMaster_currentUser'); // We might still keep user profile in local for now or props
    const user = userStr ? JSON.parse(userStr) : { name: 'User' };
    
    const exportData = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      user: user,
      settings: settings,
      trades: trades,
      dailyNotes: dailyNotes
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `TradeMaster_Backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    // Import functionality might need to be adapted for Supabase (e.g., bulk insert), 
    // but for now we just show an alert that it needs backend support or implement manually.
    alert("Importing directly to the Cloud Database is currently disabled to prevent data corruption. Please contact support.");
    
    // Original Logic (Commented out for safety during migration)
    /*
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        // ... logic to upsert to supabase ...
      } catch (err) {
        alert("Error reading file.");
        console.error(err);
      }
    };
    reader.readAsText(file);
    */
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 shadow-2xl w-full max-w-md overflow-hidden transition-colors max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b border-gray-200 dark:border-slate-800 flex justify-between items-center">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Settings</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-8">
          {/* Color Theme */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Primary Theme Color
            </label>
            <div className="grid grid-cols-5 gap-3">
              {COLORS.map((color) => (
                <button
                  key={color.id}
                  onClick={() => onUpdate({ themeColor: color.id })}
                  className={`group relative flex flex-col items-center space-y-2 p-2 rounded-lg border-2 transition-all ${
                    settings.themeColor === color.id
                      ? 'border-slate-900 dark:border-white bg-slate-50 dark:bg-slate-800'
                      : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <div 
                    className="w-8 h-8 rounded-full shadow-sm" 
                    style={{ backgroundColor: color.hex }}
                  />
                  {settings.themeColor === color.id && (
                    <div className="absolute top-[-8px] right-[-8px] bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full p-0.5">
                      <Check size={10} strokeWidth={4} />
                    </div>
                  )}
                </button>
              ))}
            </div>
            <p className="text-xs text-center text-slate-500 dark:text-slate-400 mt-1">
              {COLORS.find(c => c.id === settings.themeColor)?.name}
            </p>
          </div>

          <hr className="border-gray-200 dark:border-slate-800" />

          {/* Typography */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Typography
            </label>
            <div className="space-y-2">
              {FONTS.map((font) => (
                <button
                  key={font.id}
                  onClick={() => onUpdate({ fontFamily: font.id })}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border transition-all ${
                    settings.fontFamily === font.id
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/10 text-primary-700 dark:text-primary-200 ring-1 ring-primary-500'
                      : 'border-gray-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-gray-300 dark:hover:border-slate-600'
                  }`}
                >
                  <span className={`text-sm ${font.class}`}>{font.name}</span>
                  {settings.fontFamily === font.id && <Check size={16} className="text-primary-500" />}
                </button>
              ))}
            </div>
          </div>

          <hr className="border-gray-200 dark:border-slate-800" />

          {/* Data Management */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2 mb-2">
                <Database size={16} className="text-slate-500" />
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Cloud Data Management
                </label>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
                <button 
                    onClick={handleExportData}
                    className="flex flex-col items-center justify-center p-4 rounded-xl border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                >
                    <Download size={24} className="text-primary-500 mb-2" />
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Backup Data</span>
                    <span className="text-[10px] text-slate-500">Download JSON</span>
                </button>
                
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex flex-col items-center justify-center p-4 rounded-xl border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors opacity-50 cursor-not-allowed"
                >
                    <Upload size={24} className="text-purple-500 mb-2" />
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Restore Data</span>
                    <span className="text-[10px] text-slate-500">Contact Support</span>
                </button>
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleImportData} 
                    accept="application/json" 
                    className="hidden" 
                />
            </div>
          </div>
        </div>

        <div className="p-4 bg-gray-50 dark:bg-slate-900/50 border-t border-gray-200 dark:border-slate-800 text-right">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;