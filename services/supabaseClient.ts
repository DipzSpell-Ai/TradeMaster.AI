import { createClient } from '@supabase/supabase-js';
import { Trade, DailyNote, TradeType, TradeStatus } from '../types.ts';

/* 
  !!! IMPORTANT !!!
  RUN THIS SQL IN YOUR SUPABASE SQL EDITOR TO CREATE TABLES:

  create table trades (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users not null,
    symbol text not null,
    type text not null,
    status text not null,
    entry_date timestamp with time zone not null,
    expiry_date date,
    entry_price numeric,
    exit_price numeric,
    quantity numeric,
    stop_loss numeric,
    take_profit numeric,
    pnl numeric,
    setup text,
    notes text,
    tags text[],
    created_at timestamp with time zone default now()
  );

  create table daily_notes (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users not null,
    date date not null,
    content text,
    mood text,
    created_at timestamp with time zone default now(),
    unique(user_id, date)
  );

  -- Enable RLS (Security)
  alter table trades enable row level security;
  alter table daily_notes enable row level security;

  create policy "Users can view own trades" on trades for select using (auth.uid() = user_id);
  create policy "Users can insert own trades" on trades for insert with check (auth.uid() = user_id);
  create policy "Users can update own trades" on trades for update using (auth.uid() = user_id);
  create policy "Users can delete own trades" on trades for delete using (auth.uid() = user_id);

  create policy "Users can view own notes" on daily_notes for select using (auth.uid() = user_id);
  create policy "Users can insert own notes" on daily_notes for insert with check (auth.uid() = user_id);
  create policy "Users can update own notes" on daily_notes for update using (auth.uid() = user_id);
*/

const SUPABASE_URL = 'https://uanoonlslakwkhzlapuk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhbm9vbmxzbGFrd2toemxhcHVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0Mzk4MDksImV4cCI6MjA4MTAxNTgwOX0.u7hQQAXERYcZdCIFWV4UG-h3cSThrZi3SPZGTLg7t7s';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- HELPER FUNCTIONS FOR MAPPING ---

export const fetchTrades = async (): Promise<Trade[]> => {
  const { data, error } = await supabase
    .from('trades')
    .select('*')
    .order('entry_date', { ascending: false });

  if (error) throw error;

  return data.map((t: any) => ({
    id: t.id,
    symbol: t.symbol,
    type: t.type as TradeType,
    status: t.status as TradeStatus,
    entryDate: t.entry_date,
    expiryDate: t.expiry_date,
    entryPrice: Number(t.entry_price),
    exitPrice: t.exit_price ? Number(t.exit_price) : undefined,
    quantity: Number(t.quantity),
    stopLoss: t.stop_loss ? Number(t.stop_loss) : undefined,
    takeProfit: t.take_profit ? Number(t.take_profit) : undefined,
    pnl: t.pnl !== null ? Number(t.pnl) : undefined,
    setup: t.setup || '',
    notes: t.notes || '',
    tags: t.tags || []
  }));
};

export const saveTradeToDb = async (trade: Trade) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("No user logged in");

  const dbTrade = {
    id: trade.id,
    user_id: user.id,
    symbol: trade.symbol,
    type: trade.type,
    status: trade.status,
    entry_date: trade.entryDate,
    entry_price: trade.entryPrice,
    quantity: trade.quantity,
    setup: trade.setup,
    notes: trade.notes,
    tags: trade.tags || [],
    
    // Handle optional fields: send NULL if undefined to allow DB to handle it gracefully
    expiry_date: trade.expiryDate || null,
    exit_price: trade.exitPrice !== undefined ? trade.exitPrice : null,
    stop_loss: trade.stopLoss !== undefined ? trade.stopLoss : null,
    take_profit: trade.takeProfit !== undefined ? trade.takeProfit : null,
    pnl: trade.pnl !== undefined ? trade.pnl : null,
  };

  const { error } = await supabase
    .from('trades')
    .upsert(dbTrade);

  if (error) throw error;
};

export const deleteTradeFromDb = async (id: string) => {
  const { error } = await supabase.from('trades').delete().eq('id', id);
  if (error) throw error;
};

export const fetchDailyNotes = async (): Promise<DailyNote[]> => {
  const { data, error } = await supabase.from('daily_notes').select('*');
  if (error) throw error;

  return data.map((n: any) => ({
    date: n.date,
    content: n.content,
    mood: n.mood
  }));
};

export const saveDailyNoteToDb = async (note: DailyNote) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("No user logged in");

  const { error } = await supabase.from('daily_notes').upsert({
    user_id: user.id,
    date: note.date,
    content: note.content,
    mood: note.mood
  }, { onConflict: 'user_id, date' });

  if (error) throw error;
};