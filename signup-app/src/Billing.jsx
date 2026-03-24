import { useState } from 'react';
import { supabase } from './supabaseClient';
import { useSubscription } from './useSubscription';
import { API_BASE } from './api';

function fmt(dateObj) {
  if (!dateObj) return '—';
  return dateObj.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

export default function Billing({ profile, onProfileUpdate }) {
  const sub = useSubscription(profile);
  const [loading, setLoading] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  async function handleSubscribe() {
    setLoading('subscribe');
    setError('');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const res = await fetch(`${API_BASE}/api/stripe/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, userEmail: user.email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      window.location.href = data.url;
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading('');
    }
  }

  async function handleCancel() {
    if (!sub.subscriptionId) return;
    if (!window.confirm('Cancel your subscription? You\'ll keep access until the end of the current billing period.')) return;
    setLoading('cancel');
    setError('');
    try {
      const res = await fetch(`${API_BASE}/api/stripe/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptionId: sub.subscriptionId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      // Update Supabase profile
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('profiles').update({
        subscription_status: 'canceled',
        current_period_end: data.currentPeriodEnd,
        cancel_at_period_end: true,
      }).eq('id', user.id);
      onProfileUpdate((prev) => ({
        ...prev,
        subscription_status: 'canceled',
        current_period_end: data.currentPeriodEnd,
        cancel_at_period_end: true,
      }));
      setSuccessMsg('Subscription canceled. You have access until ' + fmt(new Date(data.currentPeriodEnd)) + '.');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading('');
    }
  }

  async function handleResume() {
    if (!sub.subscriptionId) return;
    setLoading('resume');
    setError('');
    try {
      const res = await fetch(`${API_BASE}/api/stripe/resume`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptionId: sub.subscriptionId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('profiles').update({
        subscription_status: 'active',
        cancel_at_period_end: false,
      }).eq('id', user.id);
      onProfileUpdate((prev) => ({
        ...prev,
        subscription_status: 'active',
        cancel_at_period_end: false,
      }));
      setSuccessMsg('Your subscription has been resumed.');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading('');
    }
  }

  // Status display helpers
  const statusLabel = {
    trialing: 'Free Trial',
    active: 'Active',
    canceled: 'Canceled',
    expired: 'Expired',
  }[sub.status] ?? sub.status;

  const statusColor = {
    trialing: '#ff9f0a',
    active: '#30d158',
    canceled: '#ff3b30',
    expired: '#aeaeb2',
  }[sub.status] ?? '#aeaeb2';

  return (
    <div className="billing-page">
      <div className="billing-card">
        <h2 className="billing-title">Billing &amp; Plan</h2>

        <div className="billing-status-row">
          <span className="billing-plan-name">SEO AI Labs — $39 / month</span>
          <span className="billing-status-badge" style={{ background: statusColor + '22', color: statusColor }}>
            {statusLabel}
          </span>
        </div>

        <div className="billing-info-grid">
          {sub.isTrialing && sub.status === 'trialing' && (
            <div className="billing-info-row">
              <span className="billing-info-label">Trial ends</span>
              <span className="billing-info-val">{fmt(sub.trialEnd)} ({sub.trialDaysLeft} day{sub.trialDaysLeft !== 1 ? 's' : ''} left)</span>
            </div>
          )}
          {sub.status === 'active' && sub.currentPeriodEnd && (
            <div className="billing-info-row">
              <span className="billing-info-label">
                {sub.cancelAtPeriodEnd ? 'Access until' : 'Next billing date'}
              </span>
              <span className="billing-info-val">{fmt(sub.currentPeriodEnd)}</span>
            </div>
          )}
          {sub.status === 'canceled' && sub.currentPeriodEnd && (
            <div className="billing-info-row">
              <span className="billing-info-label">Access until</span>
              <span className="billing-info-val">{fmt(sub.currentPeriodEnd)}</span>
            </div>
          )}
          <div className="billing-info-row">
            <span className="billing-info-label">Plan</span>
            <span className="billing-info-val">1 location · $39/month</span>
          </div>
        </div>

        {successMsg && <p className="billing-success">{successMsg}</p>}
        {error && <p className="billing-error">{error}</p>}

        <div className="billing-actions">
          {/* No subscription yet — show subscribe button */}
          {(sub.status === 'trialing' || sub.status === 'expired') && !sub.subscriptionId && (
            <button className="btn paywall-btn" onClick={handleSubscribe} disabled={loading === 'subscribe'}>
              {loading === 'subscribe' ? 'Redirecting…' : 'Subscribe — $39 / month'}
            </button>
          )}

          {/* Active + not canceling — show cancel */}
          {sub.status === 'active' && !sub.cancelAtPeriodEnd && sub.subscriptionId && (
            <button className="btn btn-ghost billing-cancel-btn" onClick={handleCancel} disabled={loading === 'cancel'}>
              {loading === 'cancel' ? 'Canceling…' : 'Cancel Subscription'}
            </button>
          )}

          {/* Scheduled to cancel — show resume */}
          {sub.cancelAtPeriodEnd && sub.subscriptionId && (
            <button className="btn paywall-btn" onClick={handleResume} disabled={loading === 'resume'}>
              {loading === 'resume' ? 'Resuming…' : 'Resume Subscription'}
            </button>
          )}
        </div>

        <p className="billing-note">
          Payments processed securely by Stripe. To update your card or download invoices,
          contact support.
        </p>
      </div>
    </div>
  );
}
