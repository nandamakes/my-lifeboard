import { supabase } from './supabaseClient';

// ---- AUTH
export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session ?? null;
}
export function onAuthChange(cb) {
  return supabase.auth.onAuthStateChange((_event, session) => cb(session));
}
export async function signInMagic(email) {
  // This will open email link; after clicking, you’ll land back on localhost:5173
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: window.location.origin }
  });
  if (error) throw error;
}
export async function signOut() {
  await supabase.auth.signOut();
}

// ---- ENTRIES (AM/PM)
export async function fetchEntriesLast30() {
  const since = new Date(Date.now() - 29*24*3600*1000);
  const yyyy = since.getFullYear();
  const mm = String(since.getMonth()+1).padStart(2,'0');
  const dd = String(since.getDate()).padStart(2,'0');
  const start = `${yyyy}-${mm}-${dd}`;

  const { data, error } = await supabase
    .from('entries')
    .select('date, period, data')
    .gte('date', start)
    .order('date', { ascending: true });

  if (error) throw error;
  return data; // array of {date, period, data}
}

export async function upsertEntry(date, period, patch) {
  const { data: user } = await supabase.auth.getUser();
  if (!user?.user) throw new Error('Not signed in');

  const row = {
    user_id: user.user.id,
    date,
    period,              // 'AM' | 'PM'
    data: patch,         // JSON blob (only fields you log)
    updated_at: new Date().toISOString()
  };

  const { error } = await supabase
    .from('entries')
    .upsert(row, { onConflict: 'user_id,date,period' });

  if (error) throw error;
}

// ---- WINS
export async function fetchWinsLast30() {
  const since = new Date(Date.now() - 29*24*3600*1000).toISOString();
  const { data, error } = await supabase
    .from('wins')
    .select('id, ts, text, tag')
    .gte('ts', since)
    .order('ts', { ascending: false });
  if (error) throw error;
  return data;
}
export async function addWin(text, tag) {
  const { data: user } = await supabase.auth.getUser();
  if (!user?.user) throw new Error('Not signed in');

  const { error } = await supabase
    .from('wins')
    .insert({ user_id: user.user.id, text, tag: tag ?? null });
  if (error) throw error;
}
