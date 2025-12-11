import React, { useState, useMemo } from 'react';
import { Calculator, RefreshCw, ShieldAlert, Target, IndianRupee, AlertTriangle } from 'lucide-react';

const INDICES_LOT_SIZES: Record<string, number> = {
  "NIFTY": 75,
  "BANKNIFTY": 15,
  "FINNIFTY": 25,
  "MIDCPNIFTY": 50,
  "SENSEX": 10,
  "EQUITY": 1 // Custom quantity
};

const PositionCalculator: React.FC = () => {
  const [capital, setCapital] = useState<number>(100000);
  const [riskPercent, setRiskPercent] = useState<number>(2);
  const [entryPrice, setEntryPrice] = useState<number>(0);
  const [stopLoss, setStopLoss] = useState<number>(0);
  const [instrument, setInstrument] = useState<string>("NIFTY");

  // Calculations
  const results = useMemo(() => {
    const riskAmount = (capital * riskPercent) / 100;
    
    let slPoints = 0;
    let qty = 0;
    let lots = 0;
    let totalValue = 0;

    if (entryPrice > 0 && stopLoss > 0) {
      slPoints = Math.abs(entryPrice - stopLoss);
      if (slPoints > 0) {
        qty = Math.floor(riskAmount / slPoints);
        
        // Adjust for Lot Size
        const lotSize = INDICES_LOT_SIZES[instrument];
        if (lotSize > 1) {
            lots = Math.floor(qty / lotSize);
            qty = lots * lotSize;
        } else {
            lots = qty; // For equity
        }
        
        totalValue = qty * entryPrice;
      }
    }

    return {
      riskAmount,
      slPoints,
      qty,
      lots,
      totalValue
    };
  }, [capital, riskPercent, entryPrice, stopLoss, instrument]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
       <div className="flex items-center space-x-3 mb-6">
            <div className="bg-gradient-to-tr from-purple-600 to-blue-600 p-3 rounded-xl shadow-lg">
                <Calculator className="text-white" size={24} />
            </div>
            <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Position Size Calculator</h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Protect your capital by calculating exact quantity before entering.</p>
            </div>
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Inputs */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm transition-colors">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6 flex items-center">
                    <Target size={18} className="mr-2 text-primary-500" /> Trade Parameters
                </h3>
                
                <div className="space-y-6">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Instrument</label>
                        <div className="flex flex-wrap gap-2">
                            {Object.keys(INDICES_LOT_SIZES).map((key) => (
                                <button
                                    key={key}
                                    onClick={() => setInstrument(key)}
                                    className={`px-3 py-2 text-xs font-bold rounded-lg border transition-all ${
                                        instrument === key
                                        ? 'bg-primary-600 text-white border-primary-500 shadow-md'
                                        : 'bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-400 border-gray-200 dark:border-slate-600 hover:bg-gray-100 dark:hover:bg-slate-700'
                                    }`}
                                >
                                    {key}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Capital (₹)</label>
                            <input 
                                type="number" 
                                value={capital}
                                onChange={(e) => setCapital(parseFloat(e.target.value) || 0)}
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-lg px-4 py-3 text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-primary-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Risk (%)</label>
                            <input 
                                type="number" 
                                value={riskPercent}
                                onChange={(e) => setRiskPercent(parseFloat(e.target.value) || 0)}
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-lg px-4 py-3 text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-primary-500 outline-none"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Entry Price</label>
                            <input 
                                type="number" 
                                value={entryPrice}
                                onChange={(e) => setEntryPrice(parseFloat(e.target.value) || 0)}
                                placeholder="0.00"
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-lg px-4 py-3 text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-primary-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Stop Loss</label>
                            <input 
                                type="number" 
                                value={stopLoss}
                                onChange={(e) => setStopLoss(parseFloat(e.target.value) || 0)}
                                placeholder="0.00"
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-lg px-4 py-3 text-rose-500 font-mono focus:ring-2 focus:ring-rose-500 outline-none"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Results */}
            <div className="space-y-6">
                {/* Main Outcome Card */}
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-8 rounded-2xl shadow-xl border border-slate-700 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-32 bg-primary-500/10 rounded-full blur-3xl transform translate-x-10 -translate-y-10"></div>
                    
                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <p className="text-slate-400 text-sm font-medium uppercase tracking-wider mb-1">Max Position Size</p>
                                <h3 className="text-5xl font-bold font-mono tracking-tight text-white">
                                    {results.lots} <span className="text-2xl text-slate-400 font-sans font-normal">Lots</span>
                                </h3>
                                <p className="text-primary-400 font-mono mt-2">Qty: {results.qty}</p>
                            </div>
                            <div className="bg-white/10 p-3 rounded-lg backdrop-blur-md">
                                <ShieldAlert size={32} className="text-primary-400" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-6">
                            <div>
                                <p className="text-slate-400 text-xs uppercase mb-1">Risk Amount</p>
                                <p className="text-xl font-bold text-rose-400 font-mono">₹{results.riskAmount.toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="text-slate-400 text-xs uppercase mb-1">Capital Required</p>
                                <p className="text-xl font-bold text-emerald-400 font-mono">
                                    {results.totalValue > 0 ? `₹${(results.totalValue / 1000).toFixed(2)}k` : '₹0'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Warning / Advice */}
                <div className="bg-rose-50 dark:bg-rose-900/20 p-4 rounded-xl border border-rose-200 dark:border-rose-800 flex items-start gap-3">
                    <AlertTriangle className="text-rose-500 shrink-0 mt-0.5" size={20} />
                    <div>
                        <h4 className="font-bold text-rose-700 dark:text-rose-400 text-sm">Risk Management Rule</h4>
                        <p className="text-rose-600 dark:text-rose-300/80 text-xs mt-1">
                            Never risk more than 2% of your capital on a single trade. If the calculated lots require more capital than you have, reduce your position size or tighten your stop loss.
                        </p>
                    </div>
                </div>

                {/* Details */}
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-200 dark:border-slate-700">
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500 dark:text-slate-400">Stop Loss Points</span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white">{results.slPoints.toFixed(2)} pts</span>
                    </div>
                    {results.slPoints > 0 && (
                        <div className="mt-2 text-xs text-right text-slate-400">
                            (SL is {(results.slPoints / entryPrice * 100).toFixed(2)}% of entry)
                        </div>
                    )}
                </div>
            </div>
       </div>
    </div>
  );
};

export default PositionCalculator;
