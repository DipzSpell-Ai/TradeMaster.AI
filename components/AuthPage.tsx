import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { User } from '../types';
import { 
  Activity, Mail, Lock, User as UserIcon, ArrowRight, TrendingUp, 
  BrainCircuit, BarChart2, Calculator, Calendar, ShieldCheck 
} from 'lucide-react';

interface AuthPageProps {
  onLogin: (user: User) => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Feature Slider State
  const [activeFeature, setActiveFeature] = useState(0);

  const features = [
    {
      id: 1,
      icon: <BrainCircuit size={40} className="text-purple-400" />,
      title: "AI Trading Coach",
      description: "Get instant psychological feedback & technical analysis on your trades using Gemini AI.",
      color: "bg-purple-500/10 border-purple-500/20"
    },
    {
      id: 2,
      icon: <BarChart2 size={40} className="text-blue-400" />,
      title: "Advanced Analytics",
      description: "Visualize your edge with Equity Curves, Win Rate stats, and Monthly P&L heatmaps.",
      color: "bg-blue-500/10 border-blue-500/20"
    },
    {
      id: 3,
      icon: <Calculator size={40} className="text-emerald-400" />,
      title: "Position Sizing",
      description: "Built-in Risk Calculator to determine lot sizes and protect your capital before every trade.",
      color: "bg-emerald-500/10 border-emerald-500/20"
    },
    {
      id: 4,
      icon: <Calendar size={40} className="text-amber-400" />,
      title: "Smart Journaling",
      description: "Log trades, track daily emotions, and view your performance on an interactive calendar.",
      color: "bg-amber-500/10 border-amber-500/20"
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
        setActiveFeature((prev) => (prev + 1) % features.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [features.length]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
        if (isLogin) {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: formData.email,
                password: formData.password
            });
            if (error) throw error;
            // The session change will be caught by App.tsx
        } else {
            const { data, error } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: {
                        full_name: formData.name
                    }
                }
            });
            if (error) throw error;
            setMessage('Account created! You can now log in.');
            setIsLogin(true);
        }
    } catch (err: any) {
        setError(err.message || 'An error occurred');
    } finally {
        setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
      // Redirect happens automatically
    } catch (err: any) {
      console.error("Google Login Error:", err);
      if (err.message && (err.message.includes('provider is not enabled') || err.code === 'validation_failed')) {
         setError('Google Login is currently disabled. Please use email/password.');
      } else {
         setError(err.message || 'Failed to connect with Google');
      }
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white overflow-hidden relative font-sans selection:bg-primary-500/30">
      {/* Animated Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary-600/20 rounded-full blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-[20%] right-[20%] w-[20%] h-[20%] bg-teal-600/20 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: '4s' }}></div>
      </div>

      <div className="w-full max-w-5xl h-[700px] bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-700 overflow-hidden flex relative z-10 mx-4">
        
        {/* Left Side (Form) */}
        <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center relative transition-all duration-500 overflow-y-auto scrollbar-hide">
          <div className="mb-8">
            <div className="flex items-center space-x-2 mb-3">
              <div className="bg-primary-600 p-2.5 rounded-xl shadow-lg shadow-primary-500/20">
                <Activity className="text-white" size={26} />
              </div>
              <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                TradeMaster<span className="text-primary-500">.AI</span>
              </span>
            </div>
            <h2 className="text-3xl font-bold mb-2">
              {isLogin ? 'Welcome Back' : 'Join the Elite'}
            </h2>
            <p className="text-slate-400">
              {isLogin 
                ? 'Enter your credentials to access your trading journal.' 
                : 'Start your journey to becoming a disciplined profitable trader.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div className="space-y-1 animate-fade-in-down">
                <label className="text-xs font-bold text-slate-500 uppercase ml-1 tracking-wider">Full Name</label>
                <div className="relative group">
                  <UserIcon size={18} className="absolute left-3 top-3.5 text-slate-500 group-focus-within:text-primary-500 transition-colors" />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required={!isLogin}
                    placeholder="Dipanshu Gupta"
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1 tracking-wider">Email Address</label>
              <div className="relative group">
                <Mail size={18} className="absolute left-3 top-3.5 text-slate-500 group-focus-within:text-primary-500 transition-colors" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="trader@example.com"
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1 tracking-wider">Password</label>
              <div className="relative group">
                <Lock size={18} className="absolute left-3 top-3.5 text-slate-500 group-focus-within:text-primary-500 transition-colors" />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  placeholder="••••••••"
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg text-sm font-medium animate-pulse flex items-center">
                <ShieldCheck size={16} className="mr-2" />
                {error}
              </div>
            )}

            {message && (
              <div className="p-3 bg-green-500/10 border border-green-500/20 text-green-400 rounded-lg text-sm font-medium flex items-center">
                <ShieldCheck size={16} className="mr-2" />
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-primary-600/20 flex items-center justify-center space-x-2 transition-all transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed mt-4"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>

            <div className="flex items-center my-6">
              <div className="flex-1 border-t border-slate-700"></div>
              <span className="px-3 text-[10px] text-slate-500 font-bold tracking-widest">OR CONTINUE WITH</span>
              <div className="flex-1 border-t border-slate-700"></div>
            </div>

            <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full bg-white hover:bg-gray-100 text-slate-800 font-bold py-3 rounded-xl shadow-md flex items-center justify-center space-x-3 transition-all transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
               <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
               </svg>
               <span>Google</span>
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-slate-400 text-sm">
              {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
              <button 
                onClick={() => { setIsLogin(!isLogin); setError(''); setMessage(''); }}
                className="text-primary-400 hover:text-primary-300 font-bold transition-colors"
              >
                {isLogin ? 'Sign Up' : 'Log In'}
              </button>
            </p>
          </div>
        </div>

        {/* Right Side (Feature Showcase) */}
        <div className="hidden md:flex w-1/2 bg-slate-900 relative flex-col items-center justify-center p-12 overflow-hidden border-l border-slate-700">
           {/* Background Gradients */}
           <div className="absolute inset-0 bg-gradient-to-br from-primary-900/20 to-slate-900 z-0" />
           <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/10 rounded-full blur-[80px]" />
           <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-[80px]" />

           {/* Content Container */}
           <div className="relative z-10 w-full max-w-sm flex flex-col items-center">
              <div className="text-center space-y-3 mb-12">
                  <h3 className="text-3xl font-bold text-white tracking-tight">Master Your Edge</h3>
                  <p className="text-slate-400">The complete ecosystem for professional traders.</p>
              </div>

              {/* Feature Slider */}
              <div className="w-full h-[240px] relative mb-8">
                  {features.map((feature, index) => (
                      <div 
                          key={feature.id}
                          className={`absolute inset-0 transition-all duration-700 ease-in-out transform flex flex-col items-center justify-center text-center p-6 rounded-2xl border backdrop-blur-md ${feature.color} ${
                              index === activeFeature 
                              ? 'opacity-100 translate-x-0 scale-100 z-10' 
                              : index < activeFeature 
                                  ? 'opacity-0 -translate-x-12 scale-95 z-0' 
                                  : 'opacity-0 translate-x-12 scale-95 z-0'
                          }`}
                      >
                          <div className="mb-5 p-4 bg-slate-900/80 rounded-2xl shadow-xl ring-1 ring-white/10">
                              {feature.icon}
                          </div>
                          <h4 className="text-xl font-bold text-white mb-3">{feature.title}</h4>
                          <p className="text-slate-300 text-sm leading-relaxed">{feature.description}</p>
                      </div>
                  ))}
              </div>

              {/* Pagination Dots */}
              <div className="flex justify-center space-x-2 mb-10">
                  {features.map((_, idx) => (
                      <button 
                          key={idx}
                          onClick={() => setActiveFeature(idx)}
                          className={`h-1.5 rounded-full transition-all duration-300 ${
                              idx === activeFeature ? 'w-8 bg-primary-500' : 'w-2 bg-slate-700 hover:bg-slate-600'
                          }`}
                      />
                  ))}
              </div>
              
              {/* Trust Indicators */}
              <div className="w-full grid grid-cols-2 gap-4 pt-6 border-t border-slate-700/50">
                  <div className="text-center">
                      <div className="text-xl font-bold text-white flex justify-center items-center gap-1">
                        <ShieldCheck size={16} className="text-emerald-500" />
                        <span>Secure</span>
                      </div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">Cloud Data</div>
                  </div>
                   <div className="text-center">
                      <div className="text-xl font-bold text-white flex justify-center items-center gap-1">
                        <TrendingUp size={16} className="text-primary-500" />
                        <span>Analysis</span>
                      </div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">AI Powered</div>
                  </div>
              </div>
           </div>
        </div>
      </div>

      <div className="absolute bottom-4 w-full text-center z-20">
        <p className="text-slate-600 text-xs tracking-wide">
          All rights reserved <span className="text-slate-500 font-semibold">DipzSpell 2025</span>
        </p>
      </div>
    </div>
  );
};

export default AuthPage;