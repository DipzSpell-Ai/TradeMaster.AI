import { createClient } from '@supabase/supabase-js';
import { Trade, DailyNote, TradeType, TradeStatus } from '../types';

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

const SUPABASE_URL = 'https://jjeqtepxmfqnbzeymbof.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpqZXF0ZXB4bWZxbmJ6ZXltYm9mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzNTQxNzgsImV4cCI6MjA4MDkzMDE3OH0.sHJvUM-WtkHlR2GR5lqwEPvS8FcN-MuFqMfFHqiV870';

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
    pnl: t.pnl ? Number(t.pnl) : undefined,
    setup: t.setup || '',
    notes: t.notes || '',
    tags: t.tags || []
  }));
};

export const saveTradeToDb = async (trade: Trade) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("No user logged in");

  const dbTrade = {
    id: trade.id, // Assuming UUID is passed, otherwise DB generates it if omitted, but for upsert we need it
    user_id: user.id,
    symbol: trade.symbol,
    type: trade.type,
    status: trade.status,
    entry_date: trade.entryDate,
    expiry_date: trade.expiryDate,
    entry_price: trade.entryPrice,
    exit_price: trade.exitPrice,
    quantity: trade.quantity,
    stop_loss: trade.stopLoss,
    take_profit: trade.takeProfit,
    pnl: trade.pnl,
    setup: trade.setup,
    notes: trade.notes,
    tags: trade.tags
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

  // We need to handle the unique constraint manually or let upsert handle it via ON CONFLICT
  // But daily_notes needs an ID for primary key if we want standard rows.
  // We used unique(user_id, date) in schema, so upsert works on conflict.
  
  const { error } = await supabase.from('daily_notes').upsert({
    user_id: user.id,
    date: note.date,
    content: note.content,
    mood: note.mood
  }, { onConflict: 'user_id, date' });

  if (error) throw error;
};
