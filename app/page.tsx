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

  // Load/save from localStorage
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

  const addManualEntry = () => {
    const date = prompt('Date (YYYY-MM-DD):') || new Date().toISOString().split('T')[0];
    const desc = prompt('Description:') || '';
    const amount = parseFloat(prompt('Amount:') || '0');
    const cat = prompt('Category (Beer, Vapes, Gambling, etc.):') || 'Other';
    if (desc && amount) {
      setTransactions([{ date, description: desc, amount, merchant: '', category: cat }, ...transactions]);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', bg: 'from-zinc-950 to-black' },
    { id: 'breakdown', label: 'Vice Breakdown', bg: 'from-red-950 to-amber-950' },
    { id: 'transactions', label: 'Transactions', bg: 'from-zinc-950 to-black' },
    { id: 'investments', label: 'Investments', bg: 'from-emerald-950 to-green-950' },
    { id: 'income', label: 'Income', bg: 'from-emerald-950 to-teal-950' },
    { id: 'bills', label: 'Bills', bg: 'from-rose-950 to-red-950' },
    { id: 'goals', label: 'Goals', bg: 'from-amber-950 to-yellow-950' },
    { id: 'reports', label: 'Reports', bg: 'from-zinc-950 to-black' },
  ] as const;

  return (
    <div className={`min-h-screen bg-gradient-to-br ${tabs.find(t => t.id === activeTab)?.bg} text-white transition-all duration-700`}>
      {/* Header */}
      <div className="border-b border-white/10 bg-black/60 backdrop-blur-md sticky top-0 z-50">
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

        {/* Tabs */}
        <div className="max-w-6xl mx-auto px-6 overflow-x-auto">
          <div className="flex border-b border-white/10 text-sm font-medium whitespace-nowrap">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-8 py-4 capitalize border-b-2 transition-all ${
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
        {/* Upload always visible */}
        <div className="bg-black/40 backdrop-blur-md rounded-3xl p-8 border border-white/10 mb-8">
          <h2 className="text-2xl font-semibold mb-2">Upload Bank CSV</h2>
          <label className="block w-full border-2 border-dashed border-yellow-400 hover:border-yellow-300 rounded-3xl p-12 text-center cursor-pointer transition-all">
            <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
            <span className="text-4xl block mb-4">📤</span>
            <span className="text-xl font-medium">Click or drop CSV</span>
            {fileName && <p className="text-green-400 mt-6">✅ {fileName}</p>}
          </label>
          <button onClick={addManualEntry} className="mt-6 w-full bg-white/10 hover:bg-white/20 text-white py-4 rounded-2xl font-medium">+ Manually Add Transaction</button>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && <div className="text-center py-12">Overview + Bro Roast here</div>}
        {activeTab === 'breakdown' && <div className="text-center py-12">Vice Breakdown with bars here</div>}
        {activeTab === 'transactions' && <div className="text-center py-12">Full transaction list here</div>}
        {activeTab === 'investments' && <div className="text-center py-12">Stocks + Crypto portfolio here</div>}
        {activeTab === 'income' && <div className="text-center py-12">Income tracker + manual add here</div>}
        {activeTab === 'bills' && <div className="text-center py-12">Bills / recurring here</div>}
        {activeTab === 'goals' && <div className="text-center py-12">Savings goals & challenges here</div>}
        {activeTab === 'reports' && <div className="text-center py-12">Monthly reports here</div>}

      </div>
    </div>
  );
}