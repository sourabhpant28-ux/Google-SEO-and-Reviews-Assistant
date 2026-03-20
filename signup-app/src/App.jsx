import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import SignupForm from './SignupForm';
import LoginForm from './LoginForm';
import Dashboard from './Dashboard';
import './App.css';

export default function App() {
  const [session, setSession] = useState(undefined); // undefined = loading
  const [profile, setProfile] = useState(null);
  const [page, setPage] = useState('login');

  // Fetch profile row for the authenticated user
  async function fetchProfile(userId) {
    const { data } = await supabase
      .from('profiles')
      .select('first_name, last_name, business_url, business_name, business_category, business_description')
      .eq('id', userId)
      .single();
    setProfile(data);
  }

  useEffect(() => {
    // Set initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
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

  // Logged out
  return (
    <main className="page">
      {page === 'login' ? (
        <LoginForm onGoToSignup={() => setPage('signup')} />
      ) : (
        <SignupForm onGoToLogin={() => setPage('login')} />
      )}
    </main>
  );
}
