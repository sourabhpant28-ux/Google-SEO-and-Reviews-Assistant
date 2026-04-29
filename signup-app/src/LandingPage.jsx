import { useState } from 'react';
import './LandingPage.css';
import { trackLead } from './pixel.js';
import { trackFreeAnalysis, trackLeadCaptured } from './gtag.js';
import { API_BASE } from './api';

const FAQS = [
  {
    q: 'Is there a free option?',
    a: 'Yes! You can get a free SEO Health Score, top 3 issues, and top 3 keywords for your Google Business page instantly — no signup required. Just paste your URL in the free analyser above and your full report will be emailed to you. To access the complete keyword analysis, step-by-step fix guides, and AI review replies, upgrade to the Growth Plan for $39/month.',
  },
  {
    q: 'Can I manage multiple locations?',
    a: 'Each LocalRank account is tied to one Google Business location. If you own or manage multiple locations, you\'ll need a separate account for each. This keeps your data, history, and optimization progress clean and isolated per location.',
  },
  {
    q: 'How does the SEO analysis work?',
    a: 'You paste in your Google Business page URL and some basic details about your business. Our AI (powered by Claude) analyses your listing, compares it against best practices, and returns an SEO health score out of 10, a keyword gap report, and a prioritised list of improvements — each with exact step-by-step instructions inside Google Business Profile.',
  },
  {
    q: 'Is my data safe?',
    a: 'Absolutely. Your data is stored securely in Supabase with row-level security so only you can access your own information. We never sell your data to third parties, and your Google Business details are only used to generate your analysis.',
  },
  {
    q: 'How do I cancel?',
    a: 'You can cancel anytime from your account settings — no phone calls, no forms, no hassle. If you cancel during a billing period, you keep access until the period ends. We don\'t do surprise charges or hidden fees.',
  },
];

const FEATURES_SEO = [
  'AI-powered SEO health score out of 10',
  'Keyword gap analysis and suggestions',
  'Prioritised list of improvements with exact Google Business Profile steps',
  'Track your progress with checkboxes that save across sessions',
];

const FEATURES_REPLY = [
  'Paste any Google review — AI detects positive, neutral, or negative sentiment',
  '3 personalised reply options: formal, friendly, and brief',
  'Every reply references your business name — never sounds generic',
  'One-click copy to paste straight into Google',
];

const TESTIMONIALS = [
  {
    name: 'Maria Santos',
    business: 'Owner, Casa Verde Restaurant',
    avatar: 'MS',
    quote: 'My review response rate went from 20% to 100% in the first week. I paste a review in and have three great replies in seconds.',
  },
  {
    name: 'James Chen',
    business: 'Director, Peak Form Gym',
    quote: 'Fixed my description and added proper keywords — within a month I was showing up in searches I never appeared in before.',
    avatar: 'JC',
  },
  {
    name: 'Sarah O\'Brien',
    business: 'Owner, Glow Beauty Salon',
    quote: 'It\'s like having an SEO expert on call 24/7. Walked me through every fix step by step — no guessing.',
    avatar: 'SO',
  },
];

const FREE_CATEGORIES = [
  'Restaurant', 'Salon', 'Gym', 'Dental', 'Retail', 'Hotel', 'Other',
];

function handleGetFreeReport() {
  document.getElementById('free-analyzer')?.scrollIntoView({ behavior: 'smooth' });
}

function handleStartGrowth(onGoToSignup) {
  trackLead();
  onGoToSignup();
}

export default function LandingPage({ onGoToSignup, onGoToLogin, onGoToAbout, onGoToPrivacy, onGoToContact }) {
  const [openFaq, setOpenFaq] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  // Free analyser state
  const [freeUrl, setFreeUrl] = useState('');
  const [freeCategory, setFreeCategory] = useState('Restaurant');
  const [freeReviews, setFreeReviews] = useState('');
  const [freeLoading, setFreeLoading] = useState(false);
  const [freeResult, setFreeResult] = useState(null);
  const [freeError, setFreeError] = useState('');

  // Lead capture state
  const [leadFirstName, setLeadFirstName] = useState('');
  const [leadLastName, setLeadLastName] = useState('');
  const [leadEmail, setLeadEmail] = useState('');
  const [leadLoading, setLeadLoading] = useState(false);
  const [leadSent, setLeadSent] = useState(false);
  const [leadError, setLeadError] = useState('');

  async function runFreeAnalysis() {
    if (!freeUrl.trim()) { setFreeError('Please enter your Google Business page URL.'); return; }
    setFreeError('');
    setFreeResult(null);
    setFreeLoading(true);
    trackFreeAnalysis();
    try {
      const reviews = freeReviews.split('\n').map((r) => r.trim()).filter(Boolean).slice(0, 5);
      const res = await fetch(`${API_BASE}/api/free-analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessUrl: freeUrl.trim(), businessCategory: freeCategory, reviews }),
      });
      if (!res.ok) throw new Error('Analysis failed. Please try again.');
      const data = await res.json();
      setFreeResult(data);
    } catch (err) {
      setFreeError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setFreeLoading(false);
    }
  }

  async function submitLeadReport() {
    if (!leadFirstName.trim()) { setLeadError('Please enter your first name.'); return; }
    if (!leadEmail.trim() || !leadEmail.includes('@')) { setLeadError('Please enter a valid email address.'); return; }
    setLeadError('');
    setLeadLoading(true);
    try {
      const reviews = freeReviews.split('\n').map((r) => r.trim()).filter(Boolean).slice(0, 5);
      const res = await fetch(`${API_BASE}/api/lead-report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: leadFirstName.trim(),
          lastName: leadLastName.trim(),
          email: leadEmail.trim(),
          businessUrl: freeUrl.trim(),
          businessCategory: freeCategory,
          reviews,
        }),
      });
      if (!res.ok) throw new Error('Something went wrong. Please try again.');
      trackLeadCaptured();
      setLeadSent(true);
    } catch (err) {
      setLeadError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLeadLoading(false);
    }
  }

  function toggleFaq(i) {
    setOpenFaq(openFaq === i ? null : i);
  }

  function scrollTo(id) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMenuOpen(false);
  }

  return (
    <div className="lp">

      {/* ── NAVBAR ── */}
      <nav className="lp-nav">
        <div className="lp-nav-inner">
          <div className="lp-logo">
            <span className="lp-logo-icon">⚡</span>
            <span className="lp-logo-text">SEO AI Labs</span>
          </div>

          {/* Desktop links */}
          <ul className="lp-nav-links">
            <li><button onClick={() => scrollTo('features')}>Features</button></li>
            <li><button onClick={() => scrollTo('pricing')}>Pricing</button></li>
            <li><button onClick={onGoToAbout}>About</button></li>
            <li><button onClick={onGoToContact}>Contact</button></li>
          </ul>

          <div className="lp-nav-actions">
            <button className="lp-btn-ghost" onClick={onGoToLogin}>Log in</button>
            <button className="lp-btn-outline" onClick={onGoToSignup}>Sign up</button>
            <button className="lp-btn-primary" onClick={handleGetFreeReport}>Get Free SEO Report</button>
          </div>

          {/* Mobile hamburger */}
          <button
            className="lp-hamburger"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            <span /><span /><span />
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="lp-mobile-menu">
            <button onClick={() => scrollTo('features')}>Features</button>
            <button onClick={() => scrollTo('pricing')}>Pricing</button>
            <button onClick={onGoToAbout}>About</button>
            <button onClick={onGoToContact}>Contact</button>
            <hr />
            <button onClick={onGoToLogin}>Log in</button>
            <button className="lp-btn-primary lp-btn-full" onClick={handleGetFreeReport}>Get Free SEO Report</button>
          </div>
        )}
      </nav>

      {/* ── HERO ── */}
      <section className="lp-hero">
        <div className="lp-hero-inner">
          <div className="lp-hero-text">
            <div className="lp-hero-badge">AI-Powered · No SEO Experience Needed</div>
            <h1 className="lp-hero-headline">
              Find Out Why Customers Are Choosing<br />
              <span className="lp-hero-highlight">Your Competitor Over You On Google</span>
            </h1>
            {/* Full subheadline — hidden on mobile */}
            <p className="lp-hero-sub lp-hero-sub-desktop">
              Paste your Google Business link and get a free AI powered SEO analysis
              in 60 seconds — no signup required.
            </p>
            {/* Short subheadline — mobile only */}
            <p className="lp-hero-sub lp-hero-sub-mobile">
              Free AI-powered SEO analysis for your Google Business page in 60 seconds.
            </p>

            {/* Mini mockup — mobile only, above CTA */}
            <div className="lp-mini-mockup">
              <div className="lp-mini-mockup-row">
                <span className="lp-mini-score">8<span>/10</span></span>
                <div className="lp-mini-info">
                  <div className="lp-mini-label">SEO Health Score</div>
                  <div className="lp-mockup-bar-track">
                    <div className="lp-mockup-bar-fill" style={{ width: '80%' }} />
                  </div>
                </div>
              </div>
              <div className="lp-mini-items">
                <span className="lp-mini-done">✓ Add business hours</span>
                <span className="lp-mini-done">✓ Upload photos</span>
                <span className="lp-mini-todo">◦ Update description</span>
              </div>
            </div>

            <p className="lp-hero-urgency">
              🚀 Trusted by local businesses ranking higher on Google Maps
            </p>
            <div className="lp-hero-cta">
              <button className="lp-btn-primary lp-btn-lg" onClick={handleGetFreeReport}>
                Analyse My Google Page Free
              </button>
            </div>
            <p className="lp-hero-trust">Free instant analysis · No credit card · No signup required</p>
            <button className="lp-btn-text" onClick={onGoToLogin}>
              Already have an account? Log in →
            </button>
          </div>

          {/* App mockup */}
          <div className="lp-hero-mockup">
            <div className="lp-mockup-card">
              <div className="lp-mockup-header">
                <div className="lp-mockup-dot" /><div className="lp-mockup-dot" /><div className="lp-mockup-dot" />
                <span className="lp-mockup-title">SEO Analysis</span>
              </div>
              <div className="lp-mockup-body">
                <div className="lp-mockup-score-row">
                  <div className="lp-mockup-score">
                    <span className="lp-mockup-score-num">8</span>
                    <span className="lp-mockup-score-denom">/10</span>
                  </div>
                  <div className="lp-mockup-score-info">
                    <div className="lp-mockup-label">SEO Health Score</div>
                    <div className="lp-mockup-bar-track">
                      <div className="lp-mockup-bar-fill" style={{ width: '80%' }} />
                    </div>
                  </div>
                </div>
                <div className="lp-mockup-keywords">
                  {['pizza delivery', 'best italian', 'family restaurant', 'dine in'].map((kw) => (
                    <span key={kw} className="lp-mockup-kw">{kw}</span>
                  ))}
                </div>
                <div className="lp-mockup-improvements">
                  <div className="lp-mockup-imp lp-mockup-imp-done">✓ Add business hours</div>
                  <div className="lp-mockup-imp lp-mockup-imp-done">✓ Upload 10 photos</div>
                  <div className="lp-mockup-imp">◦ Update description</div>
                  <div className="lp-mockup-imp">◦ Add Q&amp;A section</div>
                </div>
              </div>
            </div>
            <div className="lp-mockup-card lp-mockup-card-sm">
              <div className="lp-mockup-review-label">AI Reply Generator</div>
              <div className="lp-mockup-review-text">"Great food, but took a while to arrive."</div>
              <div className="lp-mockup-reply">
                <div className="lp-mockup-reply-tag">Friendly</div>
                <div className="lp-mockup-reply-text">Thank you for the kind words! We're working on…</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SOCIAL PROOF BAR ── */}
      <div className="lp-social-proof">
        <div className="lp-social-proof-inner">
          <div className="lp-social-proof-stars">★★★★★</div>
          <p className="lp-social-proof-text">
            Trusted by local business owners across <strong>restaurants, salons, gyms</strong> and more
          </p>
          <div className="lp-social-proof-avatars">
            {['MR','JC','SO','AB','PK'].map((initials) => (
              <div key={initials} className="lp-social-proof-avatar">{initials}</div>
            ))}
            <span className="lp-social-proof-count">100+ businesses</span>
          </div>
        </div>
      </div>

      {/* ── PROBLEM ── */}
      <section className="lp-problem" id="about">
        <div className="lp-container">
          <p className="lp-problem-eyebrow">Sound familiar?</p>
          <h2 className="lp-section-title">You Know You Should — But Never Get Around To It</h2>
          <div className="lp-problem-grid">
            <div className="lp-problem-card">
              <div className="lp-problem-icon">😩</div>
              <h3>Replying to reviews takes forever</h3>
              <p>Every reply needs to sound personal, professional, and on-brand. Writing them from scratch eats up time you don't have.</p>
            </div>
            <div className="lp-problem-card">
              <div className="lp-problem-icon">🤷</div>
              <h3>You don't know where to start with SEO</h3>
              <p>Everyone says "optimise your Google Business page" but nobody tells you exactly what to change or where to click.</p>
            </div>
            <div className="lp-problem-card">
              <div className="lp-problem-icon">📉</div>
              <h3>Competitors are outranking you</h3>
              <p>While you're busy running your business, other local listings are climbing Google Maps — stealing your customers.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="lp-how">
        <div className="lp-container">
          <p className="lp-eyebrow">How it works</p>
          <h2 className="lp-section-title">Your Free SEO Report in 4 Simple Steps</h2>
          <div className="lp-steps lp-steps-4">
            <div className="lp-step">
              <div className="lp-step-num">1</div>
              <div className="lp-step-connector" />
              <h3 className="lp-step-title">Paste your Google Business URL</h3>
              <p className="lp-step-desc">Search your business on Google Maps, click your listing, and copy the URL from your browser address bar. Paste it into the free analyser above.</p>
            </div>
            <div className="lp-step">
              <div className="lp-step-num">2</div>
              <div className="lp-step-connector" />
              <h3 className="lp-step-title">Get your free SEO health score</h3>
              <p className="lp-step-desc">In seconds our AI analyses your page and returns your SEO health score out of 10, your top 3 issues, and the top 3 keywords already working for you.</p>
            </div>
            <div className="lp-step">
              <div className="lp-step-num">3</div>
              <div className="lp-step-connector" />
              <h3 className="lp-step-title">Receive your full report by email</h3>
              <p className="lp-step-desc">Enter your name and email to get your complete report — full keyword analysis, all issues found, and top 5 improvements — delivered to your inbox instantly.</p>
            </div>
            <div className="lp-step">
              <div className="lp-step-num">4</div>
              <h3 className="lp-step-title">Upgrade to fix everything with AI</h3>
              <p className="lp-step-desc">Get the step-by-step fix guide for every issue and reply to all your Google reviews with AI-generated responses in seconds. Upgrade anytime for $39/month.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FREE ANALYSER ── */}
      <section className="lp-free-analyzer" id="free-analyzer">
        <div className="lp-container lp-container-md">
          <p className="lp-eyebrow">Free instant check</p>
          <h2 className="lp-section-title">See How Your Google Business Page Scores — Right Now</h2>
          <p className="lp-free-analyzer-sub">No account needed. Paste your URL and get your free SEO health score in seconds.</p>

          <div className="lp-fa-form">
            <div className="lp-fa-row">
              <div className="lp-fa-field lp-fa-field-grow">
                <label className="lp-fa-label">Google Business Page URL</label>
                <input
                  className="lp-fa-input"
                  type="url"
                  placeholder="https://www.google.com/maps/place/your-business..."
                  value={freeUrl}
                  onChange={(e) => setFreeUrl(e.target.value)}
                />
              </div>
              <div className="lp-fa-field">
                <label className="lp-fa-label">Business Category</label>
                <select
                  className="lp-fa-select"
                  value={freeCategory}
                  onChange={(e) => setFreeCategory(e.target.value)}
                >
                  {FREE_CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="lp-fa-field">
              <label className="lp-fa-label">Paste Up to 5 Recent Google Reviews <span className="lp-fa-optional">(one per line — optional but improves accuracy)</span></label>
              <textarea
                className="lp-fa-textarea"
                placeholder={"Paste a review here...\nPaste another review...\nUp to 5 reviews total"}
                value={freeReviews}
                onChange={(e) => setFreeReviews(e.target.value)}
                rows={5}
              />
            </div>

            {freeError && <p className="lp-fa-error">{freeError}</p>}

            <button
              className="lp-btn-primary lp-btn-lg lp-fa-btn"
              onClick={runFreeAnalysis}
              disabled={freeLoading}
            >
              {freeLoading ? (
                <span className="lp-fa-loading"><span className="lp-fa-spinner" />Analysing your page…</span>
              ) : (
                '🔍 Analyse My Page Free'
              )}
            </button>
          </div>

          {/* Results */}
          {freeResult && (
            <div className="lp-fa-results">
              {/* Score */}
              <div className="lp-fa-score-card">
                <div className="lp-fa-score-circle" style={{ '--score-pct': `${freeResult.seoRating * 10}%` }}>
                  <span className="lp-fa-score-num">{freeResult.seoRating}</span>
                  <span className="lp-fa-score-denom">/10</span>
                </div>
                <div className="lp-fa-score-info">
                  <div className="lp-fa-score-label">SEO Health Score</div>
                  <div className="lp-fa-score-bar-track">
                    <div className="lp-fa-score-bar-fill" style={{ width: `${freeResult.seoRating * 10}%` }} />
                  </div>
                  <div className="lp-fa-score-caption">
                    {freeResult.seoRating >= 8 ? 'Great — a few tweaks to reach the top' :
                     freeResult.seoRating >= 5 ? 'Room to improve — act on these issues now' :
                     'Needs attention — competitors are pulling ahead'}
                  </div>
                </div>
              </div>

              <div className="lp-fa-cards-row">
                {/* Issues */}
                <div className="lp-fa-card lp-fa-card-issues">
                  <div className="lp-fa-card-header">
                    <span className="lp-fa-card-icon">⚠️</span>
                    <h3 className="lp-fa-card-title">Top 3 Issues Found</h3>
                  </div>
                  <ul className="lp-fa-list">
                    {freeResult.topIssues.map((issue, i) => (
                      <li key={i}><span className="lp-fa-issue-num">{i + 1}</span>{issue}</li>
                    ))}
                  </ul>
                </div>

                {/* Positives */}
                <div className="lp-fa-card lp-fa-card-positives">
                  <div className="lp-fa-card-header">
                    <span className="lp-fa-card-icon">✅</span>
                    <h3 className="lp-fa-card-title">Top 3 Keywords Working</h3>
                  </div>
                  <ul className="lp-fa-list">
                    {freeResult.positiveKeywords.map((kw, i) => (
                      <li key={i}><span className="lp-fa-kw-tag">{kw}</span></li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Email capture */}
              {!leadSent ? (
                <div className="lp-fa-capture">
                  <div className="lp-fa-capture-header">
                    <span className="lp-fa-capture-icon">📧</span>
                    <div>
                      <h3 className="lp-fa-capture-title">Get Your Full Report by Email</h3>
                      <p className="lp-fa-capture-sub">Complete analysis with step-by-step fix guide — free, no credit card needed.</p>
                    </div>
                  </div>
                  <div className="lp-fa-capture-row">
                    <div className="lp-fa-field">
                      <label className="lp-fa-label">First Name</label>
                      <input className="lp-fa-input" type="text" placeholder="Jane" value={leadFirstName} onChange={(e) => setLeadFirstName(e.target.value)} />
                    </div>
                    <div className="lp-fa-field">
                      <label className="lp-fa-label">Last Name</label>
                      <input className="lp-fa-input" type="text" placeholder="Smith" value={leadLastName} onChange={(e) => setLeadLastName(e.target.value)} />
                    </div>
                  </div>
                  <div className="lp-fa-field">
                    <label className="lp-fa-label">Email Address</label>
                    <input className="lp-fa-input" type="email" placeholder="jane@yourbusiness.com" value={leadEmail} onChange={(e) => setLeadEmail(e.target.value)} />
                  </div>
                  {leadError && <p className="lp-fa-error">{leadError}</p>}
                  <button className="lp-btn-primary lp-btn-lg lp-fa-btn" onClick={submitLeadReport} disabled={leadLoading}>
                    {leadLoading
                      ? <span className="lp-fa-loading"><span className="lp-fa-spinner" />Generating your report…</span>
                      : '📩 Send Me My Full Report'}
                  </button>
                  <p className="lp-fa-capture-note">Your free report will be emailed within 60 seconds. No credit card required.</p>
                </div>
              ) : (
                <div className="lp-fa-success">
                  <div className="lp-fa-success-icon">🎉</div>
                  <h3 className="lp-fa-success-title">Report Sent!</h3>
                  <p className="lp-fa-success-msg">Your full report has been sent to <strong>{leadEmail}</strong>. Check your inbox!</p>
                  <button className="lp-btn-primary" onClick={() => handleStartGrowth(onGoToSignup)}>
                    Start Growth Plan — $39/mo →
                  </button>
                </div>
              )}

              {/* Locked teaser */}
              <div className="lp-fa-locked">
                <div className="lp-fa-locked-blur">
                  <div className="lp-fa-locked-row"><span className="lp-fa-locked-dot" />Complete keyword gap analysis (12 missing keywords)</div>
                  <div className="lp-fa-locked-row"><span className="lp-fa-locked-dot" />Step-by-step fix guide for every issue</div>
                  <div className="lp-fa-locked-row"><span className="lp-fa-locked-dot" />AI review reply templates</div>
                  <div className="lp-fa-locked-row"><span className="lp-fa-locked-dot" />Monthly ranking progress tracker</div>
                </div>
                <div className="lp-fa-locked-overlay">
                  <div className="lp-fa-locked-icon">🔒</div>
                  <div className="lp-fa-locked-title">Full Report Includes:</div>
                  <ul className="lp-fa-locked-list">
                    <li>Complete keyword analysis</li>
                    <li>Step by step fix guide</li>
                    <li>Review reply templates</li>
                    <li>Monthly tracking</li>
                  </ul>
                  <button className="lp-btn-primary lp-btn-lg" onClick={() => handleStartGrowth(onGoToSignup)}>
                    Start Growth Plan — $39/mo →
                  </button>
                  <p className="lp-fa-locked-note">Cancel anytime · No hidden fees</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="lp-features" id="features">
        <div className="lp-container">
          <p className="lp-eyebrow">What's included</p>
          <h2 className="lp-section-title">Two Powerful Tools, One Simple Dashboard</h2>
          <div className="lp-features-grid">
            <div className="lp-feature-card">
              <div className="lp-feature-icon">🔍</div>
              <h3 className="lp-feature-title">AI SEO Analyzer</h3>
              <p className="lp-feature-desc">Get a full picture of how your Google Business listing stacks up — and exactly how to fix it.</p>
              <ul className="lp-feature-list">
                {FEATURES_SEO.map((f) => (
                  <li key={f}><span className="lp-check">✓</span>{f}</li>
                ))}
              </ul>
            </div>
            <div className="lp-feature-card lp-feature-card-accent">
              <div className="lp-feature-icon">💬</div>
              <h3 className="lp-feature-title">AI Review Reply Generator</h3>
              <p className="lp-feature-desc">Turn every Google review into a polished, professional reply in under 10 seconds.</p>
              <ul className="lp-feature-list">
                {FEATURES_REPLY.map((f) => (
                  <li key={f}><span className="lp-check">✓</span>{f}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section className="lp-pricing" id="pricing">
        <div className="lp-container">
          <p className="lp-eyebrow">Simple pricing</p>
          <h2 className="lp-section-title">Start Free. Upgrade When You're Ready.</h2>
          <div className="lp-pricing-grid lp-pricing-grid-3">

            {/* Free Plan */}
            <div className="lp-pricing-card lp-pricing-card-free">
              <div className="lp-pricing-plan-name">Free</div>
              <div className="lp-pricing-price">
                <span className="lp-price-currency">$</span>
                <span className="lp-price-amount">0</span>
                <span className="lp-price-period">/forever</span>
              </div>
              <p className="lp-pricing-trial">No signup required</p>
              <ul className="lp-pricing-features">
                <li><span className="lp-check">✓</span> Google Business SEO Health Score</li>
                <li><span className="lp-check">✓</span> Top 3 issues identified</li>
                <li><span className="lp-check">✓</span> Top 3 positive keywords</li>
                <li><span className="lp-check">✓</span> Full report emailed instantly</li>
              </ul>
              <div className="lp-pricing-cta">
                <button className="lp-btn-outline-blue lp-btn-lg lp-btn-full" onClick={handleGetFreeReport}>
                  Get Free SEO Report
                </button>
              </div>
            </div>

            {/* Growth Plan */}
            <div className="lp-pricing-card lp-pricing-card-growth">
              <div className="lp-pricing-badge">Most Popular</div>
              <div className="lp-pricing-plan-name lp-pricing-plan-name-growth">Growth Plan</div>
              <div className="lp-pricing-price">
                <span className="lp-price-currency">$</span>
                <span className="lp-price-amount">39</span>
                <span className="lp-price-period">/mo per location</span>
              </div>
              <p className="lp-pricing-trial lp-pricing-trial-growth">Everything in Free, plus:</p>
              <ul className="lp-pricing-features">
                <li><span className="lp-check">✓</span> Complete keyword analysis</li>
                <li><span className="lp-check">✓</span> Step-by-step optimization guide</li>
                <li><span className="lp-check">✓</span> AI review reply generator</li>
                <li><span className="lp-check">✓</span> Monthly progress tracking</li>
                <li><span className="lp-check">✓</span> Unlimited analyses</li>
                <li><span className="lp-check">✓</span> Priority email support</li>
                <li><span className="lp-check">✓</span> Cancel anytime</li>
              </ul>
              <div className="lp-pricing-cta">
                <p className="lp-pricing-note">
                  Managing multiple locations? Each location needs its own account.
                </p>
                <button className="lp-btn-primary lp-btn-lg lp-btn-full" onClick={() => handleStartGrowth(onGoToSignup)}>
                  Start Growth Plan
                </button>
              </div>
            </div>

            {/* Done For You */}
            <div className="lp-pricing-card lp-pricing-card-dfy">
              <div className="lp-pricing-plan-name lp-pricing-plan-name-dfy">Done For You</div>
              <div className="lp-pricing-price">
                <span className="lp-price-amount lp-price-amount-dfy">Custom</span>
              </div>
              <p className="lp-pricing-trial lp-pricing-trial-dfy">We handle everything for you</p>
              <ul className="lp-pricing-features">
                <li><span className="lp-check">✓</span> Full Google Business profile setup</li>
                <li><span className="lp-check">✓</span> Monthly SEO optimisation</li>
                <li><span className="lp-check">✓</span> Review reply management</li>
                <li><span className="lp-check">✓</span> Keyword &amp; competitor tracking</li>
                <li><span className="lp-check">✓</span> Monthly performance report</li>
                <li><span className="lp-check">✓</span> Dedicated account manager</li>
                <li><span className="lp-check">✓</span> Priority support</li>
              </ul>
              <div className="lp-pricing-cta">
                <button className="lp-btn-dfy lp-btn-lg lp-btn-full" onClick={onGoToContact}>
                  Contact Us To Get Started
                </button>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="lp-testimonials">
        <div className="lp-container">
          <p className="lp-eyebrow">What customers say</p>
          <h2 className="lp-section-title">Real Businesses, Real Results</h2>
          <div className="lp-testi-grid">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="lp-testi-card">
                <div className="lp-testi-stars">★★★★★</div>
                <p className="lp-testi-quote">"{t.quote}"</p>
                <div className="lp-testi-author">
                  <div className="lp-testi-avatar">{t.avatar}</div>
                  <div>
                    <div className="lp-testi-name">{t.name}</div>
                    <div className="lp-testi-biz">{t.business}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="lp-faq">
        <div className="lp-container lp-container-sm">
          <p className="lp-eyebrow">Got questions?</p>
          <h2 className="lp-section-title">Frequently Asked Questions</h2>
          <div className="lp-faq-list">
            {FAQS.map((faq, i) => (
              <div key={i} className={`lp-faq-item${openFaq === i ? ' lp-faq-open' : ''}`}>
                <button className="lp-faq-question" onClick={() => toggleFaq(i)}>
                  <span>{faq.q}</span>
                  <span className="lp-faq-chevron">{openFaq === i ? '−' : '+'}</span>
                </button>
                {openFaq === i && (
                  <div className="lp-faq-answer">{faq.a}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <div className="lp-footer-brand">
            <div className="lp-logo">
              <span className="lp-logo-icon">⚡</span>
              <span className="lp-logo-text">SEO AI Labs</span>
            </div>
            <p className="lp-footer-tagline">AI-powered Google Business tools for local businesses.</p>
          </div>
          <div className="lp-footer-links">
            <button onClick={onGoToPrivacy} className="lp-footer-link-btn">Privacy Policy</button>
            <button onClick={onGoToAbout} className="lp-footer-link-btn">About</button>
            <button onClick={onGoToContact} className="lp-footer-link-btn">Contact</button>
          </div>
          <p className="lp-footer-copy">© {new Date().getFullYear()} SEO AI Labs. All rights reserved.</p>
        </div>
      </footer>

    </div>
  );
}
