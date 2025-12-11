import React, { useState, useEffect } from 'react';
import { Trade, TradeType, TradeStatus } from '../types';
import { 
  X, Save, Eraser, TrendingUp, TrendingDown, Wand2, Percent, 
  History, FileText, ShieldAlert, BrainCircuit, Check
} from 'lucide-react';

interface TradeFormProps {
  initialData?: Trade | null;
  onSave: (trade: Trade) => void;
  onClose: () => void;
}

const DRAFT_KEY = 'tradeMaster_new_trade_draft';

const INDIAN_INDICES = ["NIFTY", "BANKNIFTY", "FINNIFTY", "SENSEX", "MIDCPNIFTY"];
const COMMON_STOCKS = [
  "PBFINTECH", "RELIANCE", "HDFCBANK", "SBIN", "INFY", "TCS", 
  "TATAMOTORS", "BAJFINANCE", "ZOMATO", "ADANIENT", "ICICIBANK"
];
const OPTION_TYPES = ["CE", "PE", "FUT"];

// Configurable Lot Sizes
const LOT_SIZES: Record<string, number> = {
  "NIFTY": 75,
  "BANKNIFTY": 15,
  "FINNIFTY": 25,
  "SENSEX": 10,
  "MIDCPNIFTY": 50,
  "RELIANCE": 250,
  "HDFCBANK": 550,
  "SBIN": 1500,
  "TATAMOTORS": 1425,
  "PBFINTECH": 0 
};

const SUGGESTED_STRATEGIES = [
  "Option Buying",
  "Option Selling",
  "Futures Intraday",
  "Futures Swing",
  "Hero Zero",
  "Fibonacci",
  "EMA",
  "YouTube",
  "Randomly",
  "Price Action",
  "Support & Resistance",
  "OI Data",
  "Breakout",
  "Scalping",
  "BTST"
];

const QUICK_STRATEGIES = ["Fibonacci", "EMA", "Option Buying", "Futures Swing", "Hero Zero", "Randomly"];

const PSYCHOLOGY_TAGS = [
  "Frustrated",
  "Chill",
  "Calm",
  "Revenge",
  "FOMO",
  "Greedy",
  "Disciplined",
  "Impulsive",
  "Fearful",
  "Confident"
];

const TradeForm: React.FC<TradeFormProps> = ({ initialData, onSave, onClose }) => {
  const [formData, setFormData] = useState<Partial<Trade>>({
    symbol: '',
    type: TradeType.LONG,
    status: TradeStatus.OPEN,
    entryDate: new Date().toISOString().split('T')[0],
    expiryDate: undefined,
    entryPrice: undefined,
    quantity: undefined,
    setup: '',
    notes: '',
  });

  // Builder State
  const [builderStock, setBuilderStock] = useState('');
  const [builderStrike, setBuilderStrike] = useState('');

  // Local state for percentages
  const [slPercent, setSlPercent] = useState<string>('');
  const [tpPercent, setTpPercent] = useState<string>('');
  
  // UI State for draft restored notification
  const [draftRestored, setDraftRestored] = useState(false);

  // 1. Initialize / Restore Draft
  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      const savedDraft = localStorage.getItem(DRAFT_KEY);
      if (savedDraft) {
        try {
          const parsed = JSON.parse(savedDraft);
          setFormData(parsed.formData);
          setBuilderStock(parsed.builderStock || '');
          setBuilderStrike(parsed.builderStrike || '');
          setSlPercent(parsed.slPercent || '');
          setTpPercent(parsed.tpPercent || '');
          
          setDraftRestored(true);
          setTimeout(() => setDraftRestored(false), 3000);
        } catch (e) {
          console.error("Failed to restore draft", e);
        }
      }
    }
  }, [initialData]);

  // 2. Auto-Save Draft
  useEffect(() => {
    if (!initialData) {
        const payload = {
            formData,
            builderStock,
            builderStrike,
            slPercent,
            tpPercent
        };
        localStorage.setItem(DRAFT_KEY, JSON.stringify(payload));
    }
  }, [formData, builderStock, builderStrike, slPercent, tpPercent, initialData]);

  // Sync Percentages when Prices change
  useEffect(() => {
    if (formData.entryPrice && formData.stopLoss) {
        const diff = Math.abs(formData.stopLoss - formData.entryPrice);
        const pct = (diff / formData.entryPrice) * 100;
        setSlPercent(pct.toFixed(2));
    } else if (!formData.stopLoss) {
        setSlPercent('');
    }

    if (formData.entryPrice && formData.takeProfit) {
        const diff = Math.abs(formData.takeProfit - formData.entryPrice);
        const pct = (diff / formData.entryPrice) * 100;
        setTpPercent(pct.toFixed(2));
    } else if (!formData.takeProfit) {
        setTpPercent('');
    }
  }, [formData.entryPrice, formData.stopLoss, formData.takeProfit]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => {
      let parsedValue: string | number | undefined = value;
      if (['entryPrice', 'exitPrice', 'quantity', 'stopLoss', 'takeProfit', 'pnl'].includes(name)) {
        parsedValue = value === '' ? undefined : parseFloat(value);
      }

      const updatedData = {
        ...prev,
        [name]: parsedValue
      };

      if (['entryPrice', 'exitPrice', 'quantity', 'type'].includes(name)) {
        const entry = name === 'entryPrice' ? (parsedValue as number) : prev.entryPrice;
        const exit = name === 'exitPrice' ? (parsedValue as number) : prev.exitPrice;
        const qty = name === 'quantity' ? (parsedValue as number) : prev.quantity;
        const type = name === 'type' ? (parsedValue as TradeType) : prev.type;

        if (entry !== undefined && exit !== undefined && qty !== undefined && !isNaN(entry) && !isNaN(exit) && !isNaN(qty)) {
          const diff = exit - entry;
          const calculatedPnl = type === TradeType.LONG 
            ? diff * qty 
            : -diff * qty;
          updatedData.pnl = Number(calculatedPnl.toFixed(2));
        }
      }

      return updatedData;
    });
  };

  const handlePercentChange = (type: 'sl' | 'tp', value: string) => {
      const pct = parseFloat(value);
      if (type === 'sl') setSlPercent(value);
      if (type === 'tp') setTpPercent(value);

      if (formData.entryPrice && !isNaN(pct)) {
          const isLong = formData.type === TradeType.LONG;
          let newPrice = 0;

          if (type === 'sl') {
              if (isLong) {
                  newPrice = formData.entryPrice * (1 - pct / 100);
              } else {
                  newPrice = formData.entryPrice * (1 + pct / 100);
              }
              setFormData(prev => ({ ...prev, stopLoss: Number(newPrice.toFixed(2)) }));
          } else {
              if (isLong) {
                  newPrice = formData.entryPrice * (1 + pct / 100);
              } else {
                  newPrice = formData.entryPrice * (1 - pct / 100);
              }
              setFormData(prev => ({ ...prev, takeProfit: Number(newPrice.toFixed(2)) }));
          }
      }
  };

  const handleOptionTypeClick = (type: string) => {
    setFormData(prev => {
        // If building a symbol from stock/strike
        if (builderStock) {
             // For FUT, we usually ignore strike or append it if really needed, but mostly it's SYMBOL FUT
             if (type === 'FUT') {
                 return { ...prev, symbol: `${builderStock.toUpperCase()} FUT` };
             }
             
             // For CE/PE, we usually need a strike
             if (builderStrike) {
                 const newSymbol = `${builderStock.toUpperCase()} ${builderStrike} ${type}`;
                 return { ...prev, symbol: newSymbol };
             }
        }
        
        // Manual/Existing symbol modification logic
        let current = (prev.symbol || '').trim();
        
        // Check if last part is an option type/FUT and remove it to toggle
        const parts = current.split(' ');
        const lastPart = parts[parts.length - 1];
        if (['CE', 'PE', 'FUT'].includes(lastPart)) {
            parts.pop(); // remove old type
            current = parts.join(' ');
        }
        
        // If empty after removal (was just "CE"), just set new type
        if (!current) return { ...prev, symbol: type };
        
        return { ...prev, symbol: `${current} ${type}`.trim() };
    });
  };

  const clearPnL = () => {
    setFormData(prev => ({ ...prev, pnl: undefined }));
  };

  const calculateExpiry = (symbol: string, dateStr: string) => {
    const upperSymbol = symbol.toUpperCase();
    let targetDay = -1;

    if (upperSymbol.includes("MIDCPNIFTY")) targetDay = 1;
    else if (upperSymbol.includes("FINNIFTY")) targetDay = 2;
    else if (upperSymbol.includes("BANKNIFTY")) targetDay = 3;
    else if (upperSymbol.includes("NIFTY")) targetDay = 2;
    else if (upperSymbol.includes("SENSEX")) targetDay = 5;

    if (targetDay === -1) return undefined;

    const refDate = new Date(dateStr);
    const currentDay = refDate.getDay();
    
    let daysUntil = targetDay - currentDay;
    if (daysUntil < 0) daysUntil += 7;
    
    const expiry = new Date(refDate);
    expiry.setDate(refDate.getDate() + daysUntil);
    return expiry.toISOString().split('T')[0];
  };

  const handleIndexClick = (idx: string) => {
      setBuilderStock(idx);
      setBuilderStrike('');

      const dateRef = formData.entryDate || new Date().toISOString().split('T')[0];
      const expiry = calculateExpiry(idx, dateRef);
      const lotSize = LOT_SIZES[idx];

      setFormData(prev => ({
          ...prev, 
          symbol: idx,
          expiryDate: expiry,
          quantity: lotSize
      }));
  };

  const handleBuilderStockChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value.toUpperCase();
      setBuilderStock(val);
      if (LOT_SIZES[val]) {
          setFormData(prev => ({ ...prev, quantity: LOT_SIZES[val] }));
      }
      setFormData(prev => ({ ...prev, symbol: val }));
  };

  const handleAutoExpiry = () => {
      if (!formData.symbol) return;
      const dateRef = formData.entryDate || new Date().toISOString().split('T')[0];
      const expiry = calculateExpiry(formData.symbol, dateRef);
      if (expiry) {
          setFormData(prev => ({ ...prev, expiryDate: expiry }));
      }
  };

  const handlePsychologyTag = (tag: string) => {
    setFormData(prev => {
        const current = prev.notes || '';
        if (current.includes(`#${tag}`)) return prev;
        
        const separator = current.length > 0 && !current.endsWith(' ') ? ' ' : '';
        return { ...prev, notes: `${current}${separator}#${tag}` };
    });
  };

  const handleClose = () => {
    if (!initialData) {
        localStorage.removeItem(DRAFT_KEY);
    }
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.symbol || formData.entryPrice === undefined) return;
    
    const trade: Trade = {
      id: initialData?.id || crypto.randomUUID(),
      symbol: formData.symbol.toUpperCase(),
      type: formData.type as TradeType,
      status: formData.status as TradeStatus,
      entryDate: formData.entryDate || new Date().toISOString(),
      expiryDate: formData.expiryDate,
      entryPrice: formData.entryPrice,
      quantity: formData.quantity || 1,
      exitPrice: formData.exitPrice,
      stopLoss: formData.stopLoss,
      takeProfit: formData.takeProfit,
      pnl: formData.pnl,
      setup: formData.setup || 'General',
      notes: formData.notes || '',
      tags: formData.tags || [],
    };

    if (!initialData) {
        localStorage.removeItem(DRAFT_KEY);
    }
    
    onSave(trade);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-0 md:p-4">
      <div className="bg-white dark:bg-slate-900 md:rounded-2xl border border-gray-200 dark:border-slate-700 shadow-2xl w-full h-full md:h-auto md:max-w-3xl md:max-h-[90vh] overflow-hidden transition-colors relative flex flex-col">
        
        {/* Draft Restored Notification */}
        {draftRestored && (
            <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-20 bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-100 px-4 py-2 rounded-full text-xs font-semibold shadow-lg flex items-center animate-fade-in-down border border-primary-200 dark:border-primary-800">
                <History size={14} className="mr-2" />
                Draft restored
            </div>
        )}

        {/* Header */}
        <div className="flex justify-between items-center p-4 md:p-5 border-b border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 z-10">
          <div>
            <h2 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white">
                {initialData ? 'Edit Trade' : 'New Trade Entry'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {initialData ? `ID: ${initialData.id.slice(0, 8)}` : 'Record your execution details'}
            </p>
          </div>
          <button onClick={handleClose} className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-8 pb-24 md:pb-6 bg-gray-50/50 dark:bg-slate-950/50">
          <form id="tradeForm" onSubmit={handleSubmit} className="space-y-8">
            
            {/* Section: Trade Details */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm">
              <div className="flex items-center space-x-2 text-primary-600 dark:text-primary-400 mb-4">
                  <FileText size={18} />
                  <h3 className="font-bold text-sm uppercase tracking-wider">Instrument & Details</h3>
              </div>

              <div className="space-y-5">
                   {/* Indices & Builder */}
                  <div>
                      <div className="flex flex-wrap gap-2 mb-3">
                          {INDIAN_INDICES.map(idx => (
                              <button 
                                  key={idx} 
                                  type="button" 
                                  onClick={() => handleIndexClick(idx)}
                                  className={`text-[10px] px-3 py-1.5 rounded-lg font-bold transition-all border ${
                                      builderStock === idx 
                                      ? 'bg-slate-800 text-white border-slate-900 dark:bg-white dark:text-slate-900' 
                                      : 'bg-white hover:bg-gray-50 text-slate-600 border-gray-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-700'
                                  }`}
                              >
                                  {idx}
                              </button>
                          ))}
                      </div>

                      <div className="flex space-x-2 bg-gray-50 dark:bg-slate-800/50 p-1.5 rounded-xl border border-gray-200 dark:border-slate-700 mb-3 focus-within:ring-2 focus-within:ring-primary-500/20 focus-within:border-primary-500 transition-all">
                          <div className="flex-1 px-2">
                              <input 
                                  list="stock-suggestions"
                                  type="text" 
                                  placeholder="Stock" 
                                  value={builderStock}
                                  onChange={handleBuilderStockChange}
                                  className="w-full bg-transparent py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none uppercase font-bold"
                              />
                              <datalist id="stock-suggestions">
                                  {COMMON_STOCKS.map(s => <option key={s} value={s} />)}
                              </datalist>
                          </div>
                          <div className="w-px bg-gray-300 dark:bg-slate-700 my-1"></div>
                          <div className="flex-1 px-2">
                              <input 
                                  type="number" 
                                  placeholder="Strike" 
                                  value={builderStrike}
                                  onChange={(e) => setBuilderStrike(e.target.value)}
                                  className="w-full bg-transparent py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none font-mono appearance-none"
                              />
                          </div>
                          <div className="flex space-x-1 items-center pr-1">
                              {OPTION_TYPES.map(opt => (
                                  <button 
                                      key={opt} 
                                      type="button" 
                                      onClick={() => handleOptionTypeClick(opt)}
                                      className={`text-[10px] px-2 py-1 rounded-md font-bold transition-all ${
                                          (formData.symbol || '').includes(opt) || (opt === 'FUT' && (formData.symbol || '').includes('FUT'))
                                          ? opt === 'CE' 
                                            ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30' 
                                            : opt === 'PE'
                                            ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30'
                                            : 'bg-blue-500 text-white shadow-md shadow-blue-500/30'
                                          : 'bg-gray-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-gray-300 dark:hover:bg-slate-600'
                                      }`}
                                  >
                                      {opt}
                                  </button>
                              ))}
                          </div>
                      </div>

                      <input
                          type="text"
                          name="symbol"
                          required
                          value={formData.symbol}
                          onChange={handleChange}
                          placeholder="Symbol (e.g. NIFTY 18000 CE)"
                          className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none uppercase font-mono tracking-wide transition-all shadow-sm"
                      />
                  </div>

                  {/* Dates Row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
                      <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide ml-1">Entry Date</label>
                          <input
                              type="date"
                              name="entryDate"
                              required
                              value={formData.entryDate}
                              onChange={handleChange}
                              className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all shadow-sm"
                          />
                      </div>
                      <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide ml-1">Expiry (Opt)</label>
                          <div className="relative">
                              <input
                                  type="date"
                                  name="expiryDate"
                                  value={formData.expiryDate || ''}
                                  onChange={handleChange}
                                  className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all shadow-sm"
                              />
                              <button
                                  type="button"
                                  onClick={handleAutoExpiry}
                                  title="Auto Set Expiry"
                                  className="absolute right-2 top-2 p-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 rounded-lg transition-colors"
                              >
                                  <Wand2 size={16} />
                              </button>
                          </div>
                      </div>
                  </div>

                  {/* Side & Status Row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
                      <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide ml-1">Trade Side</label>
                          <div className="grid grid-cols-2 gap-3">
                              <button
                                  type="button"
                                  onClick={() => setFormData(p => ({...p, type: TradeType.LONG}))}
                                  className={`flex items-center justify-center py-3 rounded-xl border transition-all shadow-sm ${
                                      formData.type === TradeType.LONG 
                                      ? 'bg-emerald-600 border-emerald-500 text-white shadow-emerald-500/20 ring-1 ring-emerald-500' 
                                      : 'bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-gray-50'
                                  }`}
                              >
                                  <TrendingUp size={16} className="mr-2"/> Buy
                              </button>
                              <button
                                  type="button"
                                  onClick={() => setFormData(p => ({...p, type: TradeType.SHORT}))}
                                  className={`flex items-center justify-center py-3 rounded-xl border transition-all shadow-sm ${
                                      formData.type === TradeType.SHORT 
                                      ? 'bg-rose-600 border-rose-500 text-white shadow-rose-500/20 ring-1 ring-rose-500' 
                                      : 'bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-gray-50'
                                  }`}
                              >
                                  <TrendingDown size={16} className="mr-2"/> Sell
                              </button>
                          </div>
                      </div>

                      <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide ml-1">Status</label>
                          <select
                              name="status"
                              value={formData.status}
                              onChange={handleChange}
                              className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all shadow-sm"
                          >
                              <option value={TradeStatus.OPEN}>Open</option>
                              <option value={TradeStatus.CLOSED}>Closed</option>
                              <option value={TradeStatus.PENDING}>Pending</option>
                          </select>
                      </div>
                  </div>
              </div>
            </div>

            {/* Section: Execution & Risk */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm">
              <div className="flex items-center space-x-2 text-primary-600 dark:text-primary-400 mb-4">
                  <ShieldAlert size={18} />
                  <h3 className="font-bold text-sm uppercase tracking-wider">Execution & Risk</h3>
              </div>
              
              <div className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
                      <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase flex justify-between tracking-wide ml-1">
                              <span>Quantity</span>
                              <span className="text-[10px] text-slate-400 dark:text-slate-500">Lot Size: {formData.symbol && LOT_SIZES[formData.symbol] ? LOT_SIZES[formData.symbol] : 'N/A'}</span>
                          </label>
                          <input
                              type="number"
                              name="quantity"
                              required
                              value={formData.quantity || ''}
                              onChange={handleChange}
                              placeholder="0"
                              className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-primary-500 outline-none transition-all shadow-sm"
                          />
                      </div>
                      <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide ml-1">Entry Price</label>
                          <input
                              type="number"
                              name="entryPrice"
                              required
                              step="0.05"
                              value={formData.entryPrice || ''}
                              onChange={handleChange}
                              placeholder="0.00"
                              className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-primary-500 outline-none transition-all shadow-sm"
                          />
                      </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
                       <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase flex justify-between tracking-wide ml-1">
                              <span>Stop Loss</span>
                              <div className="flex items-center space-x-1">
                                <Percent size={10} />
                                <input 
                                    type="number"
                                    value={slPercent}
                                    onChange={(e) => handlePercentChange('sl', e.target.value)}
                                    placeholder="%"
                                    className="w-12 bg-transparent text-right text-[10px] text-slate-500 focus:text-primary-500 outline-none border-b border-dashed border-slate-300 dark:border-slate-700 focus:border-primary-500"
                                />
                              </div>
                          </label>
                          <input
                              type="number"
                              name="stopLoss"
                              step="0.05"
                              value={formData.stopLoss || ''}
                              onChange={handleChange}
                              placeholder="0.00"
                              className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 text-rose-500 font-mono focus:ring-2 focus:ring-rose-500 outline-none transition-all shadow-sm"
                          />
                      </div>
                      <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase flex justify-between tracking-wide ml-1">
                              <span>Take Profit</span>
                              <div className="flex items-center space-x-1">
                                <Percent size={10} />
                                <input 
                                    type="number"
                                    value={tpPercent}
                                    onChange={(e) => handlePercentChange('tp', e.target.value)}
                                    placeholder="%"
                                    className="w-12 bg-transparent text-right text-[10px] text-slate-500 focus:text-primary-500 outline-none border-b border-dashed border-slate-300 dark:border-slate-700 focus:border-primary-500"
                                />
                              </div>
                          </label>
                          <input
                              type="number"
                              name="takeProfit"
                              step="0.05"
                              value={formData.takeProfit || ''}
                              onChange={handleChange}
                              placeholder="0.00"
                              className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 text-emerald-500 font-mono focus:ring-2 focus:ring-emerald-500 outline-none transition-all shadow-sm"
                          />
                      </div>
                  </div>
              </div>
            </div>

            {/* Section: Outcome (If Closed) */}
            {formData.status === TradeStatus.CLOSED && (
                <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm animate-fade-in">
                    <div className="flex items-center space-x-2 text-primary-600 dark:text-primary-400 mb-4">
                        <Check size={18} />
                        <h3 className="font-bold text-sm uppercase tracking-wider">Outcome</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
                         <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide ml-1">Exit Price</label>
                            <input
                                type="number"
                                name="exitPrice"
                                step="0.05"
                                required={formData.status === TradeStatus.CLOSED}
                                value={formData.exitPrice || ''}
                                onChange={handleChange}
                                placeholder="0.00"
                                className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-primary-500 outline-none transition-all shadow-sm"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide ml-1 flex justify-between">
                                <span>Realized P&L</span>
                                <button type="button" onClick={clearPnL} className="text-[10px] text-slate-400 hover:text-rose-500 flex items-center">
                                    <Eraser size={10} className="mr-1" /> Auto-Calc
                                </button>
                            </label>
                            <input
                                type="number"
                                name="pnl"
                                step="0.05"
                                value={formData.pnl !== undefined ? formData.pnl : ''}
                                onChange={handleChange}
                                placeholder="0.00"
                                className={`w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 font-mono font-bold focus:ring-2 outline-none transition-all shadow-sm ${
                                    (formData.pnl || 0) > 0 ? 'text-emerald-500 focus:ring-emerald-500' : (formData.pnl || 0) < 0 ? 'text-rose-500 focus:ring-rose-500' : 'text-slate-900 dark:text-white focus:ring-primary-500'
                                }`}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Section: Strategy & Psychology */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm">
                <div className="flex items-center space-x-2 text-primary-600 dark:text-primary-400 mb-4">
                  <BrainCircuit size={18} />
                  <h3 className="font-bold text-sm uppercase tracking-wider">Strategy & Psychology</h3>
                </div>

                <div className="space-y-5">
                    <div className="space-y-2">
                         <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide ml-1">Setup / Strategy</label>
                         <input
                            type="text"
                            name="setup"
                            value={formData.setup}
                            onChange={handleChange}
                            list="strategies"
                            placeholder="e.g. Breakout, EMA Crossover"
                            className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all shadow-sm"
                        />
                        <datalist id="strategies">
                            {SUGGESTED_STRATEGIES.map(s => <option key={s} value={s} />)}
                        </datalist>
                        <div className="flex flex-wrap gap-2 mt-2">
                            {QUICK_STRATEGIES.map(s => (
                                <button 
                                    key={s} 
                                    type="button" 
                                    onClick={() => setFormData(p => ({...p, setup: s}))}
                                    className="text-[10px] px-2 py-1 bg-gray-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-md hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide ml-1">Notes & Psychology</label>
                        <textarea
                            name="notes"
                            value={formData.notes}
                            onChange={handleChange}
                            rows={4}
                            placeholder="Why did you take this trade? How did you feel?"
                            className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all shadow-sm resize-none"
                        />
                        <div className="flex flex-wrap gap-2 mt-1">
                            {PSYCHOLOGY_TAGS.map(tag => (
                                <button 
                                    key={tag} 
                                    type="button" 
                                    onClick={() => handlePsychologyTag(tag)}
                                    className="text-[10px] px-2 py-1 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-300 border border-purple-100 dark:border-purple-800/30 rounded-md hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors"
                                >
                                    #{tag}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="fixed bottom-0 left-0 w-full bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 p-4 md:static md:bg-transparent md:border-0 md:p-0 flex flex-col md:flex-row gap-3 z-50">
                <button
                    type="submit"
                    className="flex-1 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold py-3.5 rounded-xl shadow-lg shadow-slate-900/20 hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center space-x-2"
                >
                    <Save size={18} />
                    <span>{initialData ? 'Update Trade' : 'Save Trade'}</span>
                </button>
                 <button
                    type="button"
                    onClick={handleClose}
                    className="flex-1 md:flex-none md:w-auto bg-gray-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold py-3.5 px-6 rounded-xl hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
                >
                    Cancel
                </button>
            </div>
            
            {/* Spacer for fixed bottom on mobile */}
            <div className="h-20 md:hidden"></div>

          </form>
        </div>
      </div>
    </div>
  );
};

export default TradeForm;