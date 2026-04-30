'use client';

import { useState } from 'react';

export default function Home() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [fileName, setFileName] = useState('');

  const categories = ['Beer', 'Vapes', 'Gambling', 'Dating', 'Food', 'Gas', 'Groceries', 'Women\'s Stuff', 'Investing', 'Other'];

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const rows = text.split('\n').slice(1);
      const parsed = rows
        .filter(row => row.trim() !== '')
        .map((row, index) => {
          const cols = row.split(',');
          return {
            id: index,
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
    if (lower.includes('casino') || lower.includes('bet') || lower.includes('draftkings') || lower.includes('fanduel') || lower.includes('gambl')) return 'Gambling';
    if (lower.includes('tinder') || lower.includes('hinge') || lower.includes('bumble') || lower.includes('date') || lower.includes('onlyfans')) return 'Dating';
    if (lower.includes('nail') || lower.includes('salon') || lower.includes('starbucks') || lower.includes('latte')) return 'Women\'s Stuff';
    if (lower.includes('food') || lower.includes('restaurant') || lower.includes('mcdonald')) return 'Food';
    if (lower.includes('gas') || lower.includes('shell') || lower.includes('chevron')) return 'Gas';
    if (lower.includes('grocery') || lower.includes('walmart') || lower.includes('costco')) return 'Groceries';
    if (lower.includes('stock') || lower.includes('robinhood') || lower.includes('coinbase') || lower.includes('crypto')) return 'Investing';
    return 'Other';
  };

  const totalSpent = transactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-yellow-400 flex items-center gap-3">
            🔥 ForgeFinance
          </h1>
          <div className="text-sm text-zinc-400">Welcome back, Trae</div>
        </div>

        <div className="bg-zinc-900 rounded-3xl p-8 mb-8 border border-zinc-800">
          <h2 className="text-2xl font-semibold mb-2">Upload Your Bank CSV</h2>
          <p className="text-zinc-400 mb-6">Chase • Amex • Wells Fargo • any bank CSV works</p>
          
          <label className="block w-full border-2 border-dashed border-yellow-400 hover:border-yellow-300 rounded-3xl p-12 text-center cursor-pointer transition">
            <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
            <span className="text-2xl block mb-2">📤</span>
            <span className="text-xl font-medium">Click to upload CSV file</span>
            {fileName && <p className="text-green-400 mt-6 text-sm">✅ {fileName}</p>}
          </label>
        </div>

        {transactions.length > 0 && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <div className="bg-zinc-900 rounded-3xl p-8 border border-zinc-800">
                <h3 className="text-xl font-semibold mb-6">Your Vice Breakdown</h3>
                <div className="space-y-5">
                  {categories.map(cat => {
                    const amount = transactions
                      .filter(t => t.category === cat)
                      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
                    const percent = totalSpent > 0 ? Math.round((amount / totalSpent) * 100) : 0;
                    return (
                      <div key={cat} className="flex items-center gap-4">
                        <div className="w-32 font-medium text-sm">{cat}</div>
                        <div className="flex-1 h-3 bg-zinc-800 rounded-3xl overflow-hidden">
                          <div className="h-full bg-yellow-400 transition-all" style={{ width: `${percent}%` }} />
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
                <div className="text-yellow-400 text-sm mt-auto pt-6">— ForgeFinance AI</div>
              </div>
            </div>

            <div className="bg-zinc-900 rounded-3xl p-8 border border-zinc-800">
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
                    {transactions.slice(0, 15).map((t) => (
                      <tr key={t.id} className="border-b border-zinc-800 last:border-none hover:bg-zinc-800/50">
                        <td className="py-4 text-zinc-400 font-mono">{t.date}</td>
                        <td className="py-4">{t.description}</td>
                        <td className="py-4">
                          <span className="inline-block px-4 py-1 bg-zinc-800 text-yellow-300 text-xs rounded-2xl">{t.category}</span>
                        </td>
                        <td className="py-4 text-right font-mono text-red-400">
                          -${Math.abs(t.amount).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}