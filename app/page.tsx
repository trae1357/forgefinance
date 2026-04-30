'use client';

import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';

export default function Home() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [fileName, setFileName] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'breakdown' | 'transactions' | 'investments'>('overview');
  const [isPremium] = useState(false); // we'll hook real premium later

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

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Top Nav */}
      <div className="border-b border-zinc-800 bg-zinc-900">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-4xl">🔥</span>
            <h1 className="text-3xl font-bold tracking-tighter text-yellow-400">ForgeFinance</h1>
          </div>
          <div className="flex items-center gap-6">
            {!isPremium && (
              <button
                onClick={handleUpgrade}
                className="bg-yellow-400 hover:bg-amber-300 text-zinc-950 font-bold px-8 py-3 rounded-2xl text-sm tracking-wider"
              >
                UPGRADE — $4.99/MO
              </button>
            )}
            {isPremium && <span className="text-green-400 font-medium flex items-center gap-2">✅ PREMIUM</span>}
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex border-b border-zinc-800 text-sm font-medium">
            {(['overview', 'breakdown', 'transactions', 'investments'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-8 py-4 capitalize border-b-2 transition-colors ${
                  activeTab === tab
                    ? 'border-yellow-400 text-yellow-400'
                    : 'border-transparent text-zinc-400 hover:text-white'
                }`}
              >
                {tab === 'overview' ? 'Overview' : tab === 'breakdown' ? 'Vice Breakdown' : tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        {/* UPLOAD BOX - always visible */}
        <div className="bg-zinc-900 rounded-3xl p-8 border border-zinc-800 mb-8">
          <h2 className="text-2xl font-semibold mb-2">Upload Bank CSV</h2>
          <p className="text-zinc-400 mb-6">Drop your Chase, Amex, or any bank export here</p>
          <label className="block w-full border-2 border-dashed border-yellow-400 hover:border-yellow-300 rounded-3xl p-12 text-center cursor-pointer transition-all">
            <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
            <span className="text-4xl block mb-4">📤</span>
            <span className="text-xl font-medium">Click or drop CSV file</span>
            {fileName && <p className="text-green-400 mt-6 font-medium">✅ {fileName}</p>}
          </label>
        </div>

        {transactions.length === 0 ? (
          <div className="text-center py-20 text-zinc-400">
            <div className="text-6xl mb-6">🍺</div>
            <p className="text-3xl font-medium">Ready to see where your money went?</p>
            <p className="mt-3 text-lg">Upload a CSV and watch the vice breakdown hit different.</p>
          </div>
        ) : (
          <>
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-zinc-900 rounded-3xl p-8 border border-zinc-800">
                  <h3 className="text-xl font-semibold mb-6">Bro Roast</h3>
                  <p className="text-3xl leading-tight">
                    You dropped <span className="text-yellow-400">${totalSpent.toFixed(0)}</span> this month.<br />
                    {transactions.filter(t => t.category === 'Beer').length > 2 ? 'Those beers are stacking up, king 💀' : 'You\'re forging ahead, legend.'}
                  </p>
                </div>
                <div className="bg-zinc-900 rounded-3xl p-8 border border-zinc-800">
                  <h3 className="text-xl font-semibold mb-6">Quick Stats</h3>
                  <div className="grid grid-cols-2 gap-6 text-center">
                    <div>
                      <div className="text-4xl font-bold text-yellow-400">{transactions.length}</div>
                      <div className="text-sm text-zinc-400">Transactions</div>
                    </div>
                    <div>
                      <div className="text-4xl font-bold text-yellow-400">${totalSpent.toFixed(0)}</div>
                      <div className="text-sm text-zinc-400">Total Spent</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'breakdown' && (
              <div className="bg-zinc-900 rounded-3xl p-8 border border-zinc-800">
                <h3 className="text-2xl font-semibold mb-8">Vice Breakdown</h3>
                <div className="space-y-6">
                  {categories.map(cat => {
                    const amount = transactions.filter(t => t.category === cat).reduce((sum, t) => sum + Math.abs(t.amount), 0);
                    const percent = totalSpent > 0 ? Math.round((amount / totalSpent) * 100) : 0;
                    return (
                      <div key={cat} className="flex items-center gap-6">
                        <div className="w-36 font-semibold">{cat}</div>
                        <div className="flex-1 h-4 bg-zinc-800 rounded-3xl overflow-hidden">
                          <div className="h-full bg-yellow-400 transition-all" style={{ width: `${percent}%` }} />
                        </div>
                        <div className="font-mono w-24 text-right">${amount.toFixed(0)}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === 'transactions' && (
              <div className="bg-zinc-900 rounded-3xl p-8 border border-zinc-800">
                <h3 className="text-xl font-semibold mb-6">Recent Transactions</h3>
                <div className="max-h-[500px] overflow-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-zinc-400 text-xs border-b border-zinc-700">
                        <th className="text-left pb-4">DATE</th>
                        <th className="text-left pb-4">DESCRIPTION</th>
                        <th className="text-left pb-4">CATEGORY</th>
                        <th className="text-right pb-4">AMOUNT</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.slice(0, 20).map((t, i) => (
                        <tr key={i} className="border-b border-zinc-800 last:border-none hover:bg-zinc-800/50">
                          <td className="py-5 text-zinc-400 font-mono text-sm">{t.date}</td>
                          <td className="py-5">{t.description}</td>
                          <td className="py-5"><span className="px-5 py-1 bg-zinc-800 text-yellow-300 text-xs rounded-3xl">{t.category}</span></td>
                          <td className="py-5 text-right font-mono text-red-400">-${Math.abs(t.amount).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'investments' && (
              <div className="bg-zinc-900 rounded-3xl p-8 border border-zinc-800">
                <div className="flex justify-between mb-8">
                  <h3 className="text-2xl font-semibold">Investments • Stocks &amp; Crypto</h3>
                  <button onClick={() => {
                    const ticker = prompt('Ticker (AAPL, BTC, etc.)?');
                    if (!ticker) return;
                    const value = parseFloat(prompt('Current value $ ?') || '0');
                    setInvestments([...investments, { ticker: ticker.toUpperCase(), value }]);
                  }} className="bg-green-500 hover:bg-green-400 text-black px-8 py-3 rounded-2xl text-sm font-bold">
                    + Add Holding
                  </button>
                </div>
                {investments.length > 0 ? (
                  investments.map((inv, i) => (
                    <div key={i} className="flex justify-between py-6 border-b border-zinc-800 last:border-none">
                      <span className="font-mono text-xl">{inv.ticker}</span>
                      <span className="text-2xl font-bold text-green-400">${inv.value}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-zinc-400 py-12 text-center">No investments added yet. Add your Robinhood or Coinbase stuff here.</p>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}