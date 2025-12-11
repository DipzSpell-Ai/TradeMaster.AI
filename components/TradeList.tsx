import React, { useState } from 'react';
import { Trade, TradeStatus, TradeType } from '../types.ts';
import { Edit2, Trash2, BrainCircuit, ExternalLink, TrendingUp, TrendingDown, Calendar, ArrowRight, Filter } from 'lucide-react';

interface TradeListProps {
  trades: Trade[];
  onDelete: (id: string) => void;
  onEdit: (trade: Trade) => void;
  onAnalyze: (trade: Trade) => void;
}

const TradeList: React.FC<TradeListProps> = ({ trades, onDelete, onEdit, onAnalyze }) => {
  const [filter, setFilter] = useState<'ALL' | 'OPEN' | 'CLOSED'>('ALL');

  const filteredTrades = trades.filter(t => {
    if (filter === 'ALL') return true;
    return t.status === filter;
  }).sort((a, b) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime());

  // Helper to highlight CE/PE in symbols
  const renderSymbol = (symbol: string) => {
    const parts = symbol.split(' ');
    return (
        <span className="flex items-center space-x-1.5 flex-wrap">
            {parts.map((part, i) => {
                if (part === 'CE') return <span key={i} className="text-[10px] bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 px-1.5 py-0.5 rounded font-bold">CE</span>;
                if (part === 'PE') return <span key={i} className="text-[10px] bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800 px-1.5 py-0.5 rounded font-bold">PE</span>;
                if (part === 'FUT') return <span key={i} className="text-[10px] bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800 px-1.5 py-0.5 rounded font-bold">FUT</span>;
                if (['NIFTY', 'BANKNIFTY', 'FINNIFTY'].some(s => part.includes(s))) return <span key={i} className="font-bold text-slate-800 dark:text-slate-100 tracking-tight">{part}</span>;
                return <span key={i} className="text-slate-600 dark:text-slate-300">{part}</span>;
            })}
        </span>
    );
  };

  return (
    <div className="space-y-4">
       {/* Header Filter */}
       <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700/60 p-4 flex justify-between items-center shadow-sm">
           <div className="flex items-center space-x-2">
                <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg text-slate-500 dark:text-slate-400">
                    <Filter size={18} />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white">Trade History</h3>
           </div>
           
           <div className="flex space-x-1 bg-gray-100 dark:bg-slate-700 p-1 rounded-lg">
                {(['ALL', 'OPEN', 'CLOSED'] as const).map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                            filter === f 
                            ? 'bg-white dark:bg-slate-600 text-primary-600 dark:text-white shadow-sm' 
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                    >
                        {f}
                    </button>
                ))}
           </div>
       </div>

       {/* Desktop Table View */}
       <div className="hidden md:block bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
            <thead className="bg-gray-50 dark:bg-slate-900/50 text-xs uppercase font-semibold text-slate-500 dark:text-slate-400 tracking-wider">
              <tr>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Instrument</th>
                <th className="px-6 py-4">Side</th>
                <th className="px-6 py-4 text-right">Entry</th>
                <th className="px-6 py-4 text-right">Exit</th>
                <th className="px-6 py-4 text-right">P&L</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-700/50">
              {filteredTrades.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                        <div className="w-12 h-12 bg-gray-100 dark:bg-slate-700 rounded-full flex items-center justify-center mb-3">
                            <Filter size={20} className="opacity-50" />
                        </div>
                        <p>No trades found matching this filter.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTrades.map((trade) => (
                  <tr key={trade.id} className="group hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-700 dark:text-slate-300">
                      {new Date(trade.entryDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4">
                      {renderSymbol(trade.symbol)}
                      <div className="text-[10px] uppercase font-bold text-slate-400 mt-1 tracking-wider">{trade.setup}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide ${
                        trade.type === TradeType.LONG 
                          ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800' 
                          : 'bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 border border-rose-100 dark:border-rose-800'
                      }`}>
                        {trade.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-slate-700 dark:text-slate-300">
                      {trade.entryPrice}
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-slate-700 dark:text-slate-300">
                      {trade.exitPrice || '-'}
                    </td>
                    <td className="px-6 py-4 text-right">
                        {trade.pnl !== undefined ? (
                            <span className={`font-mono font-bold ${
                                trade.pnl > 0 ? 'text-emerald-600 dark:text-emerald-400' : trade.pnl < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400'
                            }`}>
                                {trade.pnl > 0 ? '+' : ''}₹{Math.abs(trade.pnl).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                        ) : '-'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {trade.status === TradeStatus.OPEN ? (
                        <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800/30">
                           <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                           <span className="text-[10px] font-bold">OPEN</span>
                        </div>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-400 px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded-full">CLOSED</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-1 opacity-60 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => onAnalyze(trade)}
                          className="p-1.5 hover:bg-purple-100 dark:hover:bg-purple-500/10 text-slate-500 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 rounded-md transition-colors"
                          title="Analyze with Gemini AI"
                        >
                          <BrainCircuit size={16} />
                        </button>
                        <button 
                          onClick={() => onEdit(trade)}
                          className="p-1.5 hover:bg-primary-100 dark:hover:bg-primary-500/10 text-slate-500 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 rounded-md transition-colors"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => onDelete(trade.id)}
                          className="p-1.5 hover:bg-rose-100 dark:hover:bg-rose-500/10 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-md transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4 pb-20">
        {filteredTrades.length === 0 ? (
          <div className="text-center py-10 text-slate-500 bg-white dark:bg-slate-800 rounded-xl border border-dashed border-gray-300 dark:border-slate-700">
            <p>No trades found.</p>
            <p className="text-xs mt-1">Add a new trade to get started.</p>
          </div>
        ) : (
          filteredTrades.map(trade => (
            <div key={trade.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm relative overflow-hidden group">
               {/* Status Stripe */}
               <div className={`absolute top-0 left-0 w-1 h-full transition-colors ${
                   trade.status === TradeStatus.OPEN ? 'bg-primary-500' : 
                   (trade.pnl || 0) > 0 ? 'bg-emerald-500' : (trade.pnl || 0) < 0 ? 'bg-rose-500' : 'bg-slate-500'
               }`}></div>

               <div className="pl-3">
                    {/* Header: Date + Status */}
                    <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center space-x-1.5 text-xs text-slate-500 font-medium">
                            <Calendar size={13} className="text-slate-400" />
                            <span>{new Date(trade.entryDate).toLocaleDateString()}</span>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${
                             trade.status === TradeStatus.OPEN 
                             ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-100 dark:border-blue-800' 
                             : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                        }`}>
                            {trade.status}
                        </span>
                    </div>

                    {/* Main: Symbol + Type */}
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <div className="font-bold text-base text-slate-900 dark:text-white flex items-center flex-wrap gap-1">
                                {renderSymbol(trade.symbol)}
                            </div>
                            <div className="text-xs font-semibold text-slate-400 mt-1 flex items-center uppercase tracking-wide">
                                <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${trade.type === TradeType.LONG ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                                {trade.setup}
                            </div>
                        </div>
                        <div className="text-right">
                             {trade.status === TradeStatus.OPEN ? (
                                 <span className="text-sm font-bold text-slate-400">---</span>
                             ) : (
                                <span className={`text-lg font-bold font-mono tracking-tight ${
                                    (trade.pnl || 0) > 0 ? 'text-emerald-600 dark:text-emerald-400' : (trade.pnl || 0) < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500'
                                }`}>
                                    {trade.pnl ? `${(trade.pnl > 0 ? '+' : (trade.pnl < 0 ? '-' : ''))}₹${Math.abs(trade.pnl).toFixed(0)}` : '-'}
                                </span>
                             )}
                        </div>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-2 gap-px bg-gray-100 dark:bg-slate-700 rounded-lg overflow-hidden mb-3 border border-gray-100 dark:border-slate-700">
                        <div className="bg-gray-50 dark:bg-slate-800/80 p-2.5">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5 tracking-wider">Entry</span>
                            <span className="font-mono text-sm text-slate-700 dark:text-slate-300 font-bold">{trade.entryPrice} <span className="text-[10px] font-normal text-slate-400">x {trade.quantity}</span></span>
                        </div>
                        <div className="bg-gray-50 dark:bg-slate-800/80 p-2.5 text-right">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5 tracking-wider">Exit</span>
                            <span className="font-mono text-sm text-slate-700 dark:text-slate-300 font-bold">{trade.exitPrice || '-'}</span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-between items-center pt-2 border-t border-gray-100 dark:border-slate-800">
                         <div className="flex space-x-3">
                            <button 
                                onClick={() => onEdit(trade)}
                                className="p-2 text-slate-400 hover:text-primary-500 bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                            >
                                <Edit2 size={16} />
                            </button>
                            <button 
                                onClick={() => onDelete(trade.id)}
                                className="p-2 text-slate-400 hover:text-rose-500 bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                            >
                                <Trash2 size={16} />
                            </button>
                         </div>
                        <button 
                            onClick={() => onAnalyze(trade)}
                            className="flex items-center space-x-1.5 text-xs font-semibold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800 px-3 py-1.5 rounded-lg active:scale-95 transition-transform"
                        >
                            <BrainCircuit size={14} />
                            <span>AI Coach</span>
                        </button>
                    </div>
               </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TradeList;