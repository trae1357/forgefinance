'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { loadStripe } from '@stripe/stripe-js';

export default function Home() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [fileName, setFileName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [investments, setInvestments] = useState<any[]>([]);
  const supabase = createClientComponentClient();

  const STRIPE_PRICE_ID = 'price_1TRyJu0hatOTkfbRORpZ1I4I';
  const STRIPE_PUBLISHABLE_KEY = 'pk_test_51TRxiu0hatOTkfbRHoyNmPCEuLnGrHR8bMR8i0crPka4c5mn63tPSO9k0fZJH3NFa1vhtqrkf23JdQ5AcLcRjUyI00NYDwTqQQ';

  const categories = ['Beer', 'Vapes', 'Gambling', 'Dating', 'Food', 'Gas', 'Groceries', 'Women\'s Stuff', 'Investing', 'Other'];

  useEffect(() => {
    const loadData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('transactions').select('*').eq('user_id', user.id).order('date', { ascending: false });
      if (data) setTransactions(data);
    };
    loadData();
  }, [supabase]);

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
    const { error } = await stripe.redirectToCheckout({
      lineItems: [{ price: STRIPE_PRICE_ID, quantity: 1 }],
      mode: 'subscription',
      successUrl: `${window.location.origin}/?success=true`,
      cancelUrl: window.location.origin,
    });
    if (error) alert(error.message);
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

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-yellow-400">🔥 ForgeFinance</h1>
          <div className="flex items-center gap-4">
            <button onClick={() => supabase.auth.signInWithOAuth({ provider: 'google' })} className="bg-white text-zinc-950 px-5 py-2 rounded-2xl font-medium text-sm">Sign in</button>
            {!isPremium && (
              <button onClick={handleUpgrade} className="bg-yellow-400 text-zinc-950 px-6 py-2 rounded-2xl font-bold">Upgrade — $4.99/mo</button>
            )}
            {isPremium && <span className="text-green-400 font-medium">✅ Premium</span>}
          </div>
        </div>

        {/* Upload */}
        <div className="bg-zinc-900 rounded-3xl p-8 mb-8 border border-zinc-800">
          <h2 className="text-2xl font-semibold mb-2">Upload Bank CSV</h2>
          <p className="text-zinc-400 mb-6">Any bank export works</p>
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

        {transactions.length > 0 && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <div className="bg-zinc-900 rounded-3xl p-8 border border-zinc-800">
                <h3 className="text-xl font-semibold mb-6