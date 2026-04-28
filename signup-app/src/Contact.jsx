import { useState } from 'react';
import { API_BASE } from './api';
import './StaticPage.css';

const BUSINESS_TYPES = ['Restaurant', 'Salon', 'Gym', 'Dental', 'Retail', 'Hotel', 'Other'];

const EMPTY_FORM = {
  firstName:    '',
  lastName:     '',
  email:        '',
  phone:        '',
  businessName: '',
  businessType: 'Restaurant',
  businessUrl:  '',
  message:      '',
};

export default function Contact({ onGoBack }) {
  const [form,    setForm]    = useState(EMPTY_FORM);
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setError('');
  }

  function handleBlur(e) {
    setTouched(prev => ({ ...prev, [e.target.name]: true }));
  }

  function isInvalid(field) {
    return touched[field] && !form[field];
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setTouched({ firstName: true, email: true, phone: true, businessName: true });

    if (!form.firstName || !form.email || !form.phone || !form.businessName) {
      setError('Please fill in all required fields.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/api/contact`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong. Please try again.');
      setSuccess(true);
      window.scrollTo(0, 0);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="static-page">
      {/* Nav */}
      <nav className="static-nav">
        <button className="static-back-btn" onClick={onGoBack}>← Back to home</button>
        <span className="static-brand"><span>⚡</span> SEO AI Labs</span>
      </nav>

      <div className="static-container">

        {success ? (
          /* ── Success state ── */
          <div className="cf-success">
            <div className="cf-success-icon">🎉</div>
            <h2 className="cf-success-title">Thank you, {form.firstName}!</h2>
            <p className="cf-success-msg">We will be in touch within 24 hours.</p>
            <button className="cf-btn" onClick={onGoBack}>← Back to home</button>
          </div>
        ) : (
          <>
            <h1 className="static-title">Done For You Plan</h1>
            <p className="static-intro">
              Want our team to handle your Google Business SEO for you? Fill in the form below
              and we will be in touch within 24 hours.
            </p>

            <form className="cf-form" onSubmit={handleSubmit} noValidate>

              {/* Row 1 — Names */}
              <div className="cf-row">
                <div className="cf-field">
                  <label className="cf-label">
                    First Name <span className="cf-req">*</span>
                  </label>
                  <input
                    className={`cf-input${isInvalid('firstName') ? ' cf-input-error' : ''}`}
                    name="firstName" type="text" autoComplete="given-name"
                    placeholder="Jane"
                    value={form.firstName} onChange={handleChange} onBlur={handleBlur}
                  />
                  {isInvalid('firstName') && <span className="cf-error">First name is required</span>}
                </div>
                <div className="cf-field">
                  <label className="cf-label">Last Name</label>
                  <input
                    className="cf-input"
                    name="lastName" type="text" autoComplete="family-name"
                    placeholder="Doe"
                    value={form.lastName} onChange={handleChange} onBlur={handleBlur}
                  />
                </div>
              </div>

              {/* Row 2 — Email + Phone */}
              <div className="cf-row">
                <div className="cf-field">
                  <label className="cf-label">
                    Email Address <span className="cf-req">*</span>
                  </label>
                  <input
                    className={`cf-input${isInvalid('email') ? ' cf-input-error' : ''}`}
                    name="email" type="email" autoComplete="email"
                    placeholder="jane@yourbusiness.com"
                    value={form.email} onChange={handleChange} onBlur={handleBlur}
                  />
                  {isInvalid('email') && <span className="cf-error">Email is required</span>}
                </div>
                <div className="cf-field">
                  <label className="cf-label">
                    Phone Number <span className="cf-req">*</span>
                  </label>
                  <input
                    className={`cf-input${isInvalid('phone') ? ' cf-input-error' : ''}`}
                    name="phone" type="tel" autoComplete="tel"
                    placeholder="+1 (555) 000-0000"
                    value={form.phone} onChange={handleChange} onBlur={handleBlur}
                  />
                  {isInvalid('phone') && <span className="cf-error">Phone number is required</span>}
                </div>
              </div>

              {/* Row 3 — Business Name + Type */}
              <div className="cf-row">
                <div className="cf-field">
                  <label className="cf-label">
                    Business Name <span className="cf-req">*</span>
                  </label>
                  <input
                    className={`cf-input${isInvalid('businessName') ? ' cf-input-error' : ''}`}
                    name="businessName" type="text"
                    placeholder="My Business"
                    value={form.businessName} onChange={handleChange} onBlur={handleBlur}
                  />
                  {isInvalid('businessName') && <span className="cf-error">Business name is required</span>}
                </div>
                <div className="cf-field">
                  <label className="cf-label">Business Type</label>
                  <select
                    className="cf-select"
                    name="businessType"
                    value={form.businessType} onChange={handleChange}
                  >
                    {BUSINESS_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              {/* Google URL */}
              <div className="cf-field">
                <label className="cf-label">Google Business Page URL</label>
                <input
                  className="cf-input"
                  name="businessUrl" type="url"
                  placeholder="https://www.google.com/maps/place/your-business..."
                  value={form.businessUrl} onChange={handleChange} onBlur={handleBlur}
                />
              </div>

              {/* Message */}
              <div className="cf-field">
                <label className="cf-label">Message</label>
                <textarea
                  className="cf-textarea"
                  name="message" rows={5}
                  placeholder="Tell us about your business and what you need help with"
                  value={form.message} onChange={handleChange} onBlur={handleBlur}
                />
              </div>

              {error && <p className="cf-server-error">{error}</p>}

              <button type="submit" className="cf-btn" disabled={loading}>
                {loading ? 'Sending…' : 'Send My Request'}
              </button>

              <p className="cf-note">
                We typically respond within 24 hours · No spam, ever
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
