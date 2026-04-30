'use client';

import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';

export default function Home() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [fileName, setFileName] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'breakdown' | 'transactions' | 'investments' | 'income' | 'bills' | 'goals' | 'reports'>('overview');
  const [isPremium] = useState(false);

  const STRIPE_PRICE_ID = 'price_1TRyJu0hatOTkfbRORpZ1I4I';
  const STRIPE_PUBLISHABLE_KEY = 'pk_test_51TRxiu0hatOTkfbRHoyNmPCEuLnGrHR8bMR8i0crPka4c5mn63tPSO9k0fZJH3NFa1vhtqrkf23JdQ5AcLcRjUyI00NYDwTqQQ';

  const categories = ['Beer', 'Vapes', 'Gambling', 'Dating', 'Food', 'Gas', 'Groceries', 'Women\'s Stuff', 'Investing', 'Other'];

  useEffect(() => {
    const saved = localStorage.getItem('forgefinance_transactions');
    if (saved) setTransactions(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem('forgefinance_transactions', JSON.stringify(transactions));
  }, [transactions]);

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
    if (lower.includes('beer') || lower.includes('liquor') || lower.includes('bar')) return 'Beer';
    if (lower.includes('vape') || lower.includes('smoke')) return 'Vapes';
    if (lower.includes('casino') || lower.includes('bet')) return 'Gambling';
    if (lower.includes('tinder') || lower.includes('date')) return 'Dating';
    return 'Other';
  };

  const totalSpent = transactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);

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

  const addManualEntry = () => {
    const date = prompt('Date (YYYY-MM-DD)') || '';
    const desc = prompt('Description') || '';
    const amountStr = prompt('Amount') || '0';
    const amount = parseFloat(amountStr);
    const cat = prompt('Category') || 'Other';
    if (desc && amount) {
      setTransactions([{ date, description: desc, amount: -amount, merchant: '', category: cat }, ...transactions]);
    }
  };

  const tabConfig = {
    overview: { label: 'Overview', bg: 'from-zinc-950 via-black to-zinc-900' },
    breakdown: { label: 'Vice Breakdown', bg: 'from-red-950 via-amber-900 to-red-950' },
    transactions: { label: 'Transactions', bg: 'from-zinc-950 via-black to-zinc-900' },
    investments: { label: 'Investments', bg: 'from-emerald-950 via-green-900 to-teal-950' },
    income: { label: 'Income', bg: 'from-emerald-950 via-teal-900 to-cyan-950' },
    bills: { label: 'Bills', bg: 'from-rose-950 via-red-900 to-rose-950' },
    goals: { label: 'Goals', bg: 'from-amber-950 via-yellow-900 to-amber-950' },
    reports: { label: 'Reports', bg: 'from-zinc-950 via-black to-zinc-900' },
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br ${tabConfig[activeTab].bg} text-white transition-all duration-700`}>
      {/* Top Bar */}
      <div className="bg-black/70 backdrop-blur-lg border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-8 py-6 flex items-center justify-between">
          <div className="flex items-center gap-x-4">
            <div className="text-5xl">🔥</div>
            <h1 className="text-4xl font-black tracking-tighter text-yellow-400">ForgeFinance</h1>
          </div>

          <div className="flex items-center gap-x-8">
            {!isPremium && (
              <button
                onClick={handleUpgrade}
                className="bg-gradient-to-r from-yellow-400 to-amber-300 hover:from-amber-300 hover:to-yellow-400 text-zinc-950 font-bold px-10 py-4 rounded-3xl text-lg shadow-2xl shadow-yellow-500/30 transition-all active:scale-95"
              >
                UPGRADE — $4.99/mo
              </button>
            )}
            {isPremium && <div className="text-green-400 font-bold text-xl flex items-center gap-2">✅ PREMIUM</div>}
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-8">
          <div className="flex gap-x-2 border-b border-white/10 overflow-x-auto pb-1">
            {Object.entries(tabConfig).map(([key, tab]) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as any)}
                className={`px-8 py-4 rounded-3xl font-semibold transition-all whitespace-nowrap ${
                  activeTab === key
                    ? 'bg-white text-zinc-950 shadow-xl'
                    : 'text-white hover:bg-white/10'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-10">
        {/* Upload Bar */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 mb-12 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold">Upload Bank CSV</h2>
            <p className="text-white/70">Or add manually below</p>
          </div>
          <label className="cursor-pointer bg-white/10 hover:bg-white/20 px-10 py-5 rounded-3xl text-lg font-semibold transition-all flex items-center gap-3">
            <span>📤</span>
            <span>Upload CSV</span>
            <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
          </label>
          <button onClick={addManualEntry} className="bg-yellow-400 text-zinc-950 px-10 py-5 rounded-3xl font-bold">+ Manual Entry</button>
        </div>

        {/* Tab Content Area */}
        {activeTab === 'overview' && (
          <div className="text-center">
            <h1 className="text-6xl font-black tracking-tighter mb-4">Forge Your Future</h1>
            <p className="text-3xl text-yellow-300 mb-12">Stop leaking money on beer, vapes, and bad decisions.</p>
            <div className="grid grid-cols-3 gap-6 max-w-4xl mx-auto">
              <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8">
                <div className="text-5xl font-bold">${totalSpent.toFixed(0)}</div>
                <div className="text-white/60">Spent this month</div>
              </div>
              <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8">
                <div className="text-5xl font-bold text-green-400">4</div>
                <div className="text-white/60">Vice Categories</div>
              </div>
              <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8">
                <div className="text-5xl font-bold">🔥</div>
                <div className="text-white/60">Bro Roast Level</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'breakdown' && <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-12 text-center text-3xl">Vice Breakdown (bars + pie coming next)</div>}
        {activeTab === 'transactions' && <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-12 text-center text-3xl">Full Transaction List</div>}
        {activeTab === 'investments' && <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-12 text-center text-3xl">Stocks + Crypto Portfolio</div>}
        {activeTab === 'income' && <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-12 text-center text-3xl">Income Tracker</div>}
        {activeTab === 'bills' && <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-12 text-center text-3xl">Bills &amp; Recurring</div>}
        {activeTab === 'goals' && <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-12 text-center text-3xl">Savings Goals &amp; Challenges</div>}
        {activeTab === 'reports' && <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-12 text-center text-3xl">Monthly Reports &amp; Insights</div>}

      </div>
    </div>
  );
}