import { useState } from 'react';
import { supabase } from './supabaseClient';

const passwordRules = [
  { test: (pw) => pw.length >= 6,   label: 'Minimum 6 characters required' },
  { test: (pw) => /[A-Z]/.test(pw), label: 'At least one uppercase letter' },
  { test: (pw) => /[a-z]/.test(pw), label: 'At least one lowercase letter' },
  { test: (pw) => /[0-9]/.test(pw), label: 'At least one number' },
];

function validatePassword(password) {
  return passwordRules.map((rule) => ({
    label: rule.label,
    passed: rule.test(password),
  }));
}

export default function SignupForm({ onGoToLogin }) {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
  });
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const passwordChecks = validatePassword(form.password);
  const passwordValid = passwordChecks.every((c) => c.passed);
  const showPasswordHints = touched.password && form.password.length > 0;

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
    setTouched({ firstName: true, lastName: true, email: true, password: true });
    if (!form.firstName || !form.lastName || !form.email || !passwordValid) return;

    setLoading(true);
    setServerError('');

    // 1. Create auth user
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
    });

    if (signUpError) {
      // Friendly message for already-registered email
      if (signUpError.message.toLowerCase().includes('already registered') ||
          signUpError.message.toLowerCase().includes('already been registered') ||
          signUpError.message.toLowerCase().includes('user already')) {
        setServerError('An account with this email already exists. Please sign in instead.');
      } else {
        setServerError(signUpError.message);
      }
      setLoading(false);
      return;
    }

    const userId = data.user?.id;

    // 2. Insert profile (only possible when session exists — email confirm disabled)
    if (data.session && userId) {
      const { error: profileError } = await supabase.from('profiles').insert({
        id: userId,
        first_name: form.firstName,
        last_name: form.lastName,
        email: form.email,
      });

      if (profileError) {
        setServerError(profileError.message);
        setLoading(false);
        return;
      }
      // onAuthStateChange in App.jsx will handle the redirect
    } else {
      // Email confirmation is enabled — tell user to check their inbox
      setEmailSent(true);
    }

    setLoading(false);
  }

  if (emailSent) {
    return (
      <div className="card success-card">
        <div className="success-icon">✉</div>
        <h2>Check your email</h2>
        <p className="success-msg">
          We sent a confirmation link to <strong>{form.email}</strong>.<br />
          Click it to activate your account.
        </p>
        <p className="success-hint">
          Can't find it? Check your <strong>Spam</strong> or <strong>Junk</strong> folder.
        </p>
        <button className="btn" onClick={onGoToLogin}>Back to login</button>
      </div>
    );
  }

  return (
    <div className="card">
      <h1 className="title">Create account</h1>
      <p className="subtitle">Sign up to get started</p>

      <form onSubmit={handleSubmit} noValidate>
        <div className="row">
          <div className="field">
            <label htmlFor="firstName">First name</label>
            <input
              id="firstName"
              name="firstName"
              type="text"
              autoComplete="given-name"
              placeholder="Jane"
              value={form.firstName}
              onChange={handleChange}
              onBlur={handleBlur}
              className={touched.firstName && !form.firstName ? 'input-error' : ''}
            />
            {touched.firstName && !form.firstName && (
              <span className="error">First name is required</span>
            )}
          </div>

          <div className="field">
            <label htmlFor="lastName">Last name</label>
            <input
              id="lastName"
              name="lastName"
              type="text"
              autoComplete="family-name"
              placeholder="Doe"
              value={form.lastName}
              onChange={handleChange}
              onBlur={handleBlur}
              className={touched.lastName && !form.lastName ? 'input-error' : ''}
            />
            {touched.lastName && !form.lastName && (
              <span className="error">Last name is required</span>
            )}
          </div>
        </div>

        <div className="field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="jane@example.com"
            value={form.email}
            onChange={handleChange}
            onBlur={handleBlur}
            className={touched.email && !form.email ? 'input-error' : ''}
          />
          {touched.email && !form.email && (
            <span className="error">Email is required</span>
          )}
        </div>

        <div className="field">
          <label htmlFor="password">Password</label>
          <div className="input-wrap">
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="Create a password"
              value={form.password}
              onChange={handleChange}
              onBlur={handleBlur}
              className={touched.password && !passwordValid ? 'input-error' : ''}
            />
            <button
              type="button"
              className="show-pw-btn"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? '🙈' : '👁️'}
            </button>
          </div>
          {touched.password && !form.password && (
            <span className="error">Password is required</span>
          )}
          {showPasswordHints && (
            <ul className="password-rules">
              {passwordChecks.map((check) => (
                <li key={check.label} className={check.passed ? 'rule-pass' : 'rule-fail'}>
                  <span className="rule-icon">{check.passed ? '✓' : '✗'}</span>
                  {check.label}
                </li>
              ))}
            </ul>
          )}
        </div>

        {serverError && <p className="error server-error">{serverError}</p>}

        <button type="submit" className="btn btn-full" disabled={loading}>
          {loading ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <p className="footer-text">
        Already have an account?{' '}
        <button className="link-btn" onClick={onGoToLogin}>Sign in</button>
      </p>
    </div>
  );
}
