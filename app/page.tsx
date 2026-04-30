'use client';

import { loadStripe } from '@stripe/stripe-js';

export default function Home() {
  const STRIPE_PRICE_ID = 'price_1TRyJu0hatOTkfbRORpZ1I4I';
  const STRIPE_PUBLISHABLE_KEY = 'pk_test_51TRxiu0hatOTkfbRHoyNmPCEuLnGrHR8bMR8i0crPka4c5mn63tPSO9k0fZJH3NFa1vhtqrkf23JdQ5AcLcRjUyI00NYDwTqQQ';

  const handleUpgrade = async () => {
    const stripe = await loadStripe(STRIPE_PUBLISHABLE_KEY);
    if (!stripe) return alert('Stripe failed to load');

    // ←←← THIS FIXES THE TYPE ERROR
    await (stripe as any).redirectToCheckout({
      lineItems: [{ price: STRIPE_PRICE_ID, quantity: 1 }],
      mode: 'subscription',
      successUrl: `${window.location.origin}/?success=true`,
      cancelUrl: window.location.origin,
    });
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-8 flex items-center justify-center">
      <div className="max-w-md w-full text-center">
        <h1 className="text-5xl font-bold text-yellow-400 mb-8">🔥 ForgeFinance</h1>
        
        <button
          onClick={handleUpgrade}
          className="block w-full bg-yellow-400 hover:bg-yellow-300 text-zinc-950 text-3xl font-bold py-8 px-8 rounded-3xl mb-12 shadow-2xl"
        >
          UPGRADE — $4.99/mo
        </button>

        <p className="text-green-400 text-xl">✅ Big yellow button should now appear!</p>
        <p className="text-zinc-400 text-sm mt-4">
          Click it → use test card 4242 4242 4242 4242
        </p>
      </div>
    </div>
  );
}