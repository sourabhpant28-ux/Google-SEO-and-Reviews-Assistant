import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import SignupForm from './SignupForm';
import LoginForm from './LoginForm';
import Dashboard from './Dashboard';
import LandingPage from './LandingPage';
import { API_BASE } from './api';
import './App.css';

export default function App() {
  const [session, setSession] = useState(undefined); // undefined = loading
  const [profile, setProfile] = useState(null);
  const [page, setPage] = useState('landing');

  // Fetch profile row — includes subscription fields
  async function fetchProfile(userId) {
    const { data } = await supabase
      .from('profiles')
      .select(
        'first_name, last_name, business_url, business_name, business_category, business_description, ' +
        'trial_start, subscription_status, stripe_customer_id, stripe_subscription_id, ' +
        'current_period_end, cancel_at_period_end'
      )
      .eq('id', userId)
      .single();
    setProfile(data);
  }

  // After Stripe checkout redirect: verify session and update Supabase
  async function handleStripeReturn(sessionId, userId) {
    try {
      const res = await fetch(`${API_BASE}/api/stripe/verify-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });
      if (!res.ok) return;
      const data = await res.json();
      await supabase.from('profiles').update({
        stripe_customer_id: data.customerId,
        stripe_subscription_id: data.subscriptionId,
        subscription_status: data.status === 'active' ? 'active' : data.status,
        current_period_end: data.currentPeriodEnd,
        cancel_at_period_end: data.cancelAtPeriodEnd,
      }).eq('id', userId);
      await fetchProfile(userId);
    } catch (_) {
      // Non-fatal — user can still use the app
    } finally {
      // Clean up URL params
      window.history.replaceState({}, '', window.location.pathname);
    }
  }

  useEffect(() => {
    // Set initial session — enforce "don't remember me" if user opted out
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        const persist = localStorage.getItem('persist_session');
        const activeThisTab = sessionStorage.getItem('no_persist');
        if (persist === 'false' && !activeThisTab) {
          await supabase.auth.signOut();
          setSession(null);
          return;
        }
      }
      setSession(session);
      if (session) {
        await fetchProfile(session.user.id);

        // Check for Stripe redirect params
        const params = new URLSearchParams(window.location.search);
        const stripeSessionId = params.get('stripe_session_id');
        if (stripeSessionId) {
          await handleStripeReturn(stripeSessionId, session.user.id);
        } else {
          window.history.replaceState({}, '', window.location.pathname);
        }
      }
    });

    // Listen for auth changes (login / logout / token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        if (session) {
          fetchProfile(session.user.id);
        } else {
          setProfile(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Still checking auth state
  if (session === undefined) {
    return (
      <main className="page">
        <div className="spinner-wrap">
          <div className="spinner" />
        </div>
      </main>
    );
  }

  // Logged in
  if (session) {
    return <Dashboard profile={profile} onProfileUpdate={setProfile} />;
  }

  // Logged out — landing, login, or signup
  if (page === 'landing') {
    return (
      <LandingPage
        onGoToSignup={() => setPage('signup')}
        onGoToLogin={() => setPage('login')}
      />
    );
  }

  return (
    <main className="page">
      {page === 'login' ? (
        <LoginForm
          onGoToSignup={() => setPage('signup')}
          onGoToLanding={() => setPage('landing')}
        />
      ) : (
        <SignupForm
          onGoToLogin={() => setPage('login')}
          onGoToLanding={() => setPage('landing')}
        />
      )}
    </main>
  );
}
