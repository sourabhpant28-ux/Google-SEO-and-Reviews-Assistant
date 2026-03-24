import { useState } from 'react';
import { supabase } from './supabaseClient';
import { API_BASE } from './api';

export default function PayWall({ profile, onSubscribed }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubscribe() {
    setLoading(true);
    setError('');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const res = await fetch(`${API_BASE}/api/stripe/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, userEmail: user.email }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Could not start checkout');
      }
      const { url } = await res.json();
      window.location.href = url; // redirect to Stripe Checkout
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  return (
    <div className="paywall-wrap">
      <div className="paywall-card">
        <div className="paywall-icon">⏰</div>
        <h2 className="paywall-title">Your free trial has ended</h2>
        <p className="paywall-sub">
          Subscribe to keep running SEO analyses and generating AI review replies.
          Your past results and history are still saved and accessible.
        </p>

        <div className="paywall-price-row">
          <span className="paywall-price">$39</span>
          <span className="paywall-price-per">/month per location</span>
        </div>

        <ul className="paywall-features">
          <li><span className="paywall-check">✓</span> Unlimited SEO analyses</li>
          <li><span className="paywall-check">✓</span> Keyword gap reports</li>
          <li><span className="paywall-check">✓</span> Step-by-step optimization plan</li>
          <li><span className="paywall-check">✓</span> Unlimited AI review replies</li>
          <li><span className="paywall-check">✓</span> Full history &amp; progress tracking</li>
          <li><span className="paywall-check">✓</span> Cancel anytime</li>
        </ul>

        {error && <p className="paywall-error">{error}</p>}

        <button
          className="btn btn-full paywall-btn"
          onClick={handleSubscribe}
          disabled={loading}
        >
          {loading ? 'Redirecting to checkout…' : 'Subscribe — $39 / month'}
        </button>

        <p className="paywall-note">
          Secure payment via Stripe. No hidden fees.
        </p>
      </div>
    </div>
  );
}
