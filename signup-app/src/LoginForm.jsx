import { useState } from 'react';
import { supabase } from './supabaseClient';

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export default function LoginForm({ onGoToSignup }) {
  const [form, setForm] = useState({ email: '', password: '' });
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  const errors = {
    email: !form.email
      ? 'Email is required'
      : !isValidEmail(form.email)
      ? 'Enter a valid email address'
      : null,
    password: !form.password ? 'Password is required' : null,
  };

  const isValid = !errors.email && !errors.password;

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setServerError('');
  }

  function handleBlur(e) {
    setTouched((prev) => ({ ...prev, [e.target.name]: true }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setTouched({ email: true, password: true });
    if (!isValid) return;

    setLoading(true);
    setServerError('');

    const { error } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    });

    if (error) {
      setServerError(error.message);
      setLoading(false);
      return;
    }

    // onAuthStateChange in App.jsx handles the redirect to Dashboard
    setLoading(false);
  }

  return (
    <div className="card">
      <h1 className="title">Welcome back</h1>
      <p className="subtitle">Sign in to your account</p>

      <form onSubmit={handleSubmit} noValidate>
        <div className="field">
          <label htmlFor="login-email">Email</label>
          <input
            id="login-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="jane@example.com"
            value={form.email}
            onChange={handleChange}
            onBlur={handleBlur}
            className={touched.email && errors.email ? 'input-error' : ''}
          />
          {touched.email && errors.email && (
            <span className="error">{errors.email}</span>
          )}
        </div>

        <div className="field">
          <div className="label-row">
            <label htmlFor="login-password">Password</label>
            <a href="#" className="forgot-link">Forgot password?</a>
          </div>
          <input
            id="login-password"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="Your password"
            value={form.password}
            onChange={handleChange}
            onBlur={handleBlur}
            className={touched.password && errors.password ? 'input-error' : ''}
          />
          {touched.password && errors.password && (
            <span className="error">{errors.password}</span>
          )}
        </div>

        {serverError && <p className="error server-error">{serverError}</p>}

        <button type="submit" className="btn btn-full" disabled={loading}>
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <p className="footer-text">
        Don't have an account?{' '}
        <button className="link-btn" onClick={onGoToSignup}>
          Sign up
        </button>
      </p>
    </div>
  );
}
