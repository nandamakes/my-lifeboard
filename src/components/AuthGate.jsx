import { useEffect, useState } from 'react';
import { getSession, onAuthChange, signInMagic, signOut } from '../lib/db';

export default function AuthGate({ children, tokens }) {
  const [session, setSession] = useState(null);
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    let unsub;
    (async () => {
      setSession(await getSession());
      unsub = onAuthChange(setSession).data.subscription;
    })();
    return () => unsub?.unsubscribe?.();
  }, []);

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: tokens.bg, color: tokens.text }}>
        <div className="w-full max-w-sm rounded-2xl p-5" style={{ background: tokens.surface }}>
          <h2 className="text-xl font-semibold mb-2">Sign in to My Lifeboard</h2>
          <p className="text-sm mb-4" style={{ color: tokens.textSecondary }}>
            Magic link will be emailed to you. No password, no drama.
          </p>
          <input
            value={email}
            onChange={(e)=>setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-lg px-3 py-2 mb-3 bg-transparent border"
            style={{ borderColor: '#4B4343', color: tokens.text }}
          />
          <button
            onClick={async ()=>{
              try { setStatus('Sending…'); await signInMagic(email); setStatus('Check your email ✉️'); }
              catch (e) { setStatus(e.message); }
            }}
            className="w-full rounded-xl px-4 py-2"
            style={{ background: tokens.primaryDark, color: tokens.text }}
          >
            Send magic link
          </button>
          <div className="mt-3 text-xs" style={{ color: tokens.textSecondary }}>{status}</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="fixed top-2 right-2 z-50">
        <button onClick={signOut} className="rounded-full px-3 py-1 text-xs border" style={{ borderColor: '#B56576', color: tokens.text }}>
          Sign out
        </button>
      </div>
      {children}
    </div>
  );
}
