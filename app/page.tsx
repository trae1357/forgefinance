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

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'breakdown', label: 'Vice Breakdown' },
    { id: 'transactions', label: 'Transactions' },
    { id: 'investments', label: 'Investments' },
    { id: 'income', label: 'Income' },
    { id: 'bills', label: 'Bills' },
    { id: 'goals', label: 'Goals' },
    { id: 'reports', label: 'Reports' },
  ] as const;

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-900 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-4xl">🔥</span>
            <h1 className="text-3xl font-bold tracking-tighter text-yellow-400">ForgeFinance</h1>
          </div>
          {!isPremium && (
            <button onClick={handleUpgrade} className="bg-yellow-400 hover:bg-amber-300 text-zinc-950 font-bold px-8 py-3 rounded-2xl text-sm tracking-wider">
              UPGRADE — $4.99/MO
            </button>
          )}
        </div>

        {/* Tabs - scrollable on mobile */}
        <div className="max-w-6xl mx-auto px-6 overflow-x-auto">
          <div className="flex border-b border-zinc-800 text-sm font-medium whitespace-nowrap">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-8 py-4 capitalize border-b-2 transition-colors ${
                  activeTab === tab.id ? 'border-yellow-400 text-yellow-400' : 'border-transparent text-zinc-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        {/* Upload - always visible at top */}
        <div className="bg-zinc-900 rounded-3xl p-8 border border-zinc-800 mb-8">
          <h2 className="text-2xl font-semibold mb-2">Upload Bank CSV</h2>
          <p className="text-zinc-400 mb-6">Drop any bank export here</p>
          <label className="block w-full border-2 border-dashed border-yellow-400 hover:border-yellow-300 rounded-3xl p-12 text-center cursor-pointer transition-all">
            <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
            <span className="text-4xl block mb-4">📤</span>
            <span className="text-xl font-medium">Click or drop CSV</span>
            {fileName && <p className="text-green-400 mt-6 font-medium">✅ {fileName}</p>}
          </label>
        </div>

        {transactions.length === 0 && activeTab !== 'income' && activeTab !== 'bills' && activeTab !== 'goals' && (
          <div className="text-center py-20 text-zinc-400">
            <p className="text-3xl font-medium">Upload a CSV to get started</p>
          </div>
        )}

        {/* Tab Content */}
        {activeTab === 'overview' && <div>Overview content coming - Bro Roast here</div>}
        {activeTab === 'breakdown' && <div>Vice Breakdown content here</div>}
        {activeTab === 'transactions' && <div>Transactions list here</div>}
        {activeTab === 'investments' && <div>Stocks + Crypto portfolio here</div>}
        {activeTab === 'income' && <div>Income tracker here</div>}
        {activeTab === 'bills' && <div>Bills / recurring here</div>}
        {activeTab === 'goals' && <div>Goals & challenges here</div>}
        {activeTab === 'reports' && <div>Reports & insights here</div>}

      </div>
    </div>
  );
}