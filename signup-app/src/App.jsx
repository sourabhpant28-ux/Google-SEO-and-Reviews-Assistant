import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import SignupForm from './SignupForm';
import LoginForm from './LoginForm';
import Dashboard from './Dashboard';
import LandingPage from './LandingPage';
import About from './About';
import PrivacyPolicy from './PrivacyPolicy';
import Contact from './Contact';
import { API_BASE } from './api';
import { trackPageView } from './pixel.js';
import './App.css';

// Map URL path → page key
function pageFromPath() {
  const path = window.location.pathname;
  if (path.startsWith('/login'))   return 'login';
  if (path.startsWith('/signup'))  return 'signup';
  if (path.startsWith('/about'))   return 'about';
  if (path.startsWith('/privacy')) return 'privacy';
  if (path.startsWith('/contact')) return 'contact';
  return 'landing';
}

const PATH_MAP = {
  landing: '/',
  login:   '/login',
  signup:  '/signup',
  about:   '/about',
  privacy: '/privacy',
  contact: '/contact',
};

export default function App() {
  const [session, setSession] = useState(undefined); // undefined = loading
  const [profile, setProfile] = useState(null);
  const [page, setPage] = useState(pageFromPath);

  // Push a new history entry and update page state
  function navigate(target) {
    const path = PATH_MAP[target] ?? '/';
    window.history.pushState({ page: target }, '', path);
    setPage(target);
    window.scrollTo(0, 0);
    trackPageView();
  }

  // Fetch profile row — includes subscription fields
  // If no profile exists (email-confirm flow), auto-create it with trial data
  async function fetchProfile(userId) {
    const FIELDS =
      'id, first_name, last_name, business_url, business_name, business_category, business_description, ' +
      'trial_start, subscription_status, stripe_customer_id, stripe_subscription_id, ' +
      'current_period_end, cancel_at_period_end';

    const { data } = await supabase
      .from('profiles')
      .select(FIELDS)
      .eq('id', userId)
      .single();

    // Profile missing or trial_start not set → create/patch it
    if (!data || !data.trial_start) {
      const { data: { user } } = await supabase.auth.getUser();
      const meta = user?.user_metadata || {};
      await supabase.from('profiles').upsert({
        id: userId,
        first_name: data?.first_name || meta.first_name || '',
        last_name:  data?.last_name  || meta.last_name  || '',
        trial_start: new Date().toISOString(),
        subscription_status: 'trialing',
      }, { onConflict: 'id', ignoreDuplicates: false });

      const { data: refreshed } = await supabase
        .from('profiles').select(FIELDS).eq('id', userId).single();
      setProfile(refreshed ?? data);
      return;
    }

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
        stripe_customer_id:      data.customerId,
        stripe_subscription_id:  data.subscriptionId,
        subscription_status:     data.status === 'active' ? 'active' : data.status,
        current_period_end:      data.currentPeriodEnd,
        cancel_at_period_end:    data.cancelAtPeriodEnd,
      }).eq('id', userId);
      await fetchProfile(userId);
    } catch (_) {
      // Non-fatal
    } finally {
      window.history.replaceState({}, '', '/');
    }
  }

  useEffect(() => {
    // Handle browser back/forward button
    const onPopState = () => setPage(pageFromPath());
    window.addEventListener('popstate', onPopState);

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
        }
      }
    });

    // Listen for auth changes
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

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('popstate', onPopState);
    };
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

  // About and Privacy are accessible regardless of auth state
  if (page === 'about') {
    return <About onGoBack={() => navigate(session ? 'landing' : 'landing')} onGoToSignup={() => navigate('signup')} onGoToLogin={() => navigate('login')} />;
  }
  if (page === 'privacy') {
    return <PrivacyPolicy onGoBack={() => navigate('landing')} />;
  }
  if (page === 'contact') {
    return <Contact onGoBack={() => navigate('landing')} />;
  }

  // Logged in
  if (session) {
    return <Dashboard profile={profile} onProfileUpdate={setProfile} />;
  }

  // Logged out
  if (page === 'landing') {
    return (
      <LandingPage
        onGoToSignup={() => navigate('signup')}
        onGoToLogin={() => navigate('login')}
        onGoToAbout={() => navigate('about')}
        onGoToPrivacy={() => navigate('privacy')}
        onGoToContact={() => navigate('contact')}
      />
    );
  }

  return (
    <main className="page">
      {page === 'login' ? (
        <LoginForm
          onGoToSignup={() => navigate('signup')}
          onGoToLanding={() => navigate('landing')}
        />
      ) : (
        <SignupForm
          onGoToLogin={() => navigate('login')}
          onGoToLanding={() => navigate('landing')}
        />
      )}
    </main>
  );
}
