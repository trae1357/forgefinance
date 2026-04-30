'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { loadStripe } from '@stripe/stripe-js';

export default function Home() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [fileName, setFileName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [investments, setInvestments] = useState<any[]>([]);
  const supabase = createClientComponentClient();

  const STRIPE_PRICE_ID = 'price_1TRyJu0hatOTkfbRORpZ1I4I';
  const STRIPE_PUBLISHABLE_KEY = 'pk_test_51TRxiu0hatOTkfbRHoyNmPCEuLnGrHR8bMR8i0crPka4c5mn63tPSO9k0fZJH3NFa1vhtqrkf23JdQ5AcLcRjUyI00NYDwTqQQ';

  const categories = ['Beer', 'Vapes', 'Gambling', 'Dating', 'Food', 'Gas', 'Groceries', 'Women\'s Stuff', 'Investing', 'Other'];

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('success') === 'true') {
        setIsPremium(true);
        window.history.replaceState({}, '', window.location.pathname);
      }
    }

    const loadData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('transactions').select('*').eq('user_id', user.id).order('date', { ascending: false });
      if (data) setTransactions(data);
    };
    loadData();
  }, [supabase]);

  useEffect(() => {
    const handler = (e: any) => { e.preventDefault(); setInstallPrompt(e); };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const rows = text.split('\n').slice(1);
      const parsed = rows.filter(row => row.trim() !== '').map(row => {
        const cols = row.split(',');
        return {
          date: cols[0] || '',
          description: cols[1] || '',
          amount: parseFloat(cols[2]) || 0,
          merchant: cols[3] || '',
          category: categorize(cols[1] || '', cols[3] || '')
        };
      });
      setTransactions(parsed);
    };
    reader.readAsText(file);
  };

  const categorize = (desc: string, merchant: string) => {
    const lower = (desc + ' ' + merchant).toLowerCase();
    if (lower.includes('beer') || lower.includes('liquor') || lower.includes('bar') || lower.includes('brew')) return 'Beer';
    if (lower.includes('vape') || lower.includes('smoke') || lower.includes('cig') || lower.includes('juul')) return 'Vapes';
    if (lower.includes('casino') || lower.includes('bet') || lower.includes('draftkings') || lower.includes('fanduel')) return 'Gambling';
    if (lower.includes('tinder') || lower.includes('hinge') || lower.includes('bumble') || lower.includes('date') || lower.includes('onlyfans')) return 'Dating';
    if (lower.includes('nail') || lower.includes('salon') || lower.includes('starbucks') || lower.includes('latte')) return 'Women\'s Stuff';
    if (lower.includes('food') || lower.includes('restaurant') || lower.includes('mcdonald')) return 'Food';
    if (lower.includes('gas') || lower.includes('shell') || lower.includes('chevron')) return 'Gas';
    if (lower.includes('grocery') || lower.includes('walmart') || lower.includes('costco')) return 'Groceries';
    if (lower.includes('stock') || lower.includes('robinhood') || lower.includes('coinbase') || lower.includes('crypto')) return 'Investing';
    return 'Other';
  };

  const handleUpgrade = async () => {
    const stripe = await loadStripe(STRIPE_PUBLISHABLE_KEY);
    if (!stripe) return alert('Stripe failed to load');
    await (stripe as any).redirectToCheckout({
      lineItems: [{ price: STRIPE_PRICE_ID, quantity: 1 }],
      mode: 'subscription',
      successUrl: `${window.location.origin}/?success=true`,
      cancelUrl: window.location.origin,
    });
  };

  const saveToDatabase = async () => {
    if (!isPremium) {
      alert('Upgrade to Premium ($4.99/mo) to unlock unlimited saves!');
      return;
    }
    setIsSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from('transactions').insert(transactions.map(t => ({
      user_id: user.id,
      date: t.date,
      description: t.description,
      amount: t.amount,
      category: t.category,
      merchant: t.merchant || ''
    })));
    if (error) alert('Save error');
    else alert('✅ Saved to ForgeFinance forever!');
    setIsSaving(false);
  };

  const totalSpent = transactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const addInvestment = () => {
    const ticker = prompt('Ticker (AAPL, BTC, TSLA, etc.)?');
    if (!ticker) return;
    const value = parseFloat(prompt('Current value $ ?') || '0');
    setInvestments([...investments, { ticker: ticker.toUpperCase(), value }]);
  };

  const exportCSV = () => {
    if (transactions.length === 0) return;
    const csv = ['Date,Description,Amount,Category,Merchant', ...transactions.map(t => `${t.date},${t.description},${t.amount},${t.category},${t.merchant}`)].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'forgefinance-export.csv';
    a.click();
  };

  const handleInstallClick = () => {
    if (installPrompt) {
      installPrompt.prompt();
      setInstallPrompt(null);
    } else {
      alert('📲 On mobile: tap Share → "Add to Home Screen"');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-yellow-400">🔥 ForgeFinance</h1>
          <div className="flex items-center gap-4">
            <button onClick={() => supabase.auth.signInWithOAuth({ provider: 'google' })} className="bg-white text-zinc-950 px-5 py-2 rounded-2xl font-medium text-sm">Sign in</button>
            {!isPremium && <button onClick={handleUpgrade} className="bg-yellow-400 text-zinc-950 px-6 py-2 rounded-2xl font-bold">Upgrade — $4.99/mo</button>}
            {isPremium && <span className="text-green-400 font-medium">✅ Premium</span>}
            <button onClick={handleLogout} className="text-zinc-400 text-sm">Logout</button>
          </div>
        </div>

        {/* Upload Box - ALWAYS visible */}
        <div className="bg-zinc-900 rounded-3xl p-8 mb-8 border border-zinc-800">
          <h2 className="text-2xl font-semibold mb-2">Upload Bank CSV</h2>
          <p className="text-zinc-400 mb-6">Chase • Amex • Wells Fargo • any bank CSV works</p>
          <label className="block w-full border-2 border-dashed border-yellow-400 hover:border-yellow-300 rounded-3xl p-12 text-center cursor-pointer transition-colors">
            <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
            <span className="text-3xl mb-3 block">📤</span>
            <span className="text-xl font-medium">Click to upload CSV</span>
            {fileName && <p className="text-green-400 mt-6">✅ {fileName}</p>}
          </label>

          {transactions.length > 0 && (
            <div className="flex gap-4 mt-8">
              <button onClick={saveToDatabase} disabled={isSaving} className="flex-1 bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 text-zinc-950 font-bold py-5 rounded-3xl">
                {isSaving ? 'Saving...' : '💾 Save Forever'}
              </button>
              <button onClick={exportCSV} className="flex-1 border border-zinc-400 text-white font-medium py-5 rounded-3xl">📤 Export CSV</button>
            </div>
          )}
        </div>

        {transactions.length === 0 && (
          <div className="text-center py-12 text-zinc-400">
            <p className="text-2xl">No transactions yet</p>
            <p className="mt-2">Upload your first bank CSV above to see your Vice Breakdown, Bro Roast, and more!</p>
          </div>
        )}

        {transactions.length > 0 && (
          <>
            {/* Vice Breakdown + Roast */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <div className="bg-zinc-900 rounded-3xl p-8 border border-zinc-800">
                <h3 className="text-xl font-semibold mb-6">Your Vice Breakdown</h3>
                <div className="space-y-5">
                  {categories.map(cat => {
                    const amount = transactions.filter(t => t.category === cat).reduce((sum, t) => sum + Math.abs(t.amount), 0);
                    const percent = totalSpent > 0 ? Math.round((amount / totalSpent) * 100) : 0;
                    return (
                      <div key={cat} className="flex items-center gap-4">
                        <div className="w-32 text-sm font-medium">{cat}</div>
                        <div className="flex-1 h-3 bg-zinc-800 rounded-3xl overflow-hidden">
                          <div className="h-full bg-yellow-400" style={{ width: `${percent}%` }} />
                        </div>
                        <div className="font-mono w-20 text-right">${amount.toFixed(0)}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-zinc-900 rounded-3xl p-8 border border-zinc-800 flex flex-col">
                <h3 className="text-xl font-semibold mb-4">Bro Roast</h3>
                <p className="text-2xl leading-tight flex-1">
                  You spent <span className="text-yellow-400">$${totalSpent.toFixed(0)}</span> this month.<br />
                  {transactions.filter(t => t.category === 'Beer').length > 2 ? 'Those beers are stacking up, king 💀' : 'You\'re forging ahead.'}
                </p>
              </div>
            </div>

            {/* Transactions */}
            <div className="bg-zinc-900 rounded-3xl p-8 border border-zinc-800 mb-8">
              <h3 className="text-xl font-semibold mb-6">Recent Transactions ({transactions.length})</h3>
              <div className="max-h-96 overflow-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-700 text-zinc-400">
                      <th className="text-left pb-4">Date</th>
                      <th className="text-left pb-4">Description</th>
                      <th className="text-left pb-4">Category</th>
                      <th className="text-right pb-4">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.slice(0, 15).map((t, i) => (
                      <tr key={i} className="border-b border-zinc-800 last:border-none">
                        <td className="py-4 text-zinc-400 font-mono">{t.date}</td>
                        <td className="py-4">{t.description}</td>
                        <td className="py-4"><span className="px-4 py-1 bg-zinc-800 text-yellow-300 text-xs rounded-2xl">{t.category}</span></td>
                        <td className="py-4 text-right font-mono text-red-400">-${Math.abs(t.amount).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Investments - always visible */}
        <div className="bg-zinc-900 rounded-3xl p-8 border border-zinc-800">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold">Investments • Stocks &amp; Crypto</h3>
            <button onClick={addInvestment} className="bg-green-500 text-black px-6 py-3 rounded-2xl text-sm font-bold">+ Add</button>
          </div>
          {investments.length > 0 ? (
            investments.map((inv, i) => (
              <div key={i} className="flex justify-between py-4 border-b border-zinc-800 last:border-none">
                <span className="font-mono">{inv.ticker}</span>
                <span className="font-bold text-green-400">${inv.value}</span>
              </div>
            ))
          ) : (
            <p className="text-zinc-400">Add your Robinhood / Coinbase holdings here</p>
          )}
        </div>

        {/* PWA */}
        <div className="text-center mt-12">
          <button onClick={handleInstallClick} className="bg-zinc-800 hover:bg-zinc-700 text-white px-8 py-4 rounded-3xl text-lg font-medium flex items-center gap-3 mx-auto">
            📲 Add ForgeFinance to Home Screen
          </button>
        </div>
      </div>
    </div>
  );
}