import { useState } from 'react';
import './LandingPage.css';

const FAQS = [
  {
    q: 'Is there a free trial?',
    a: 'Yes! Every new account gets a full 7-day free trial with no credit card required. You get access to all features — SEO analysis, keyword suggestions, the step-by-step optimization guide, and the AI review reply generator. Cancel anytime before the trial ends and you won\'t be charged a penny.',
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
    quote: 'I used to dread replying to reviews. Now I paste one in and have three great options in seconds. My response rate went from 20% to 100% in the first week.',
  },
  {
    name: 'James Chen',
    business: 'Director, Peak Form Gym',
    quote: 'The SEO score made it so obvious what I was missing. Fixed my business description and added proper keywords — within a month I was showing up in searches I never appeared in before.',
    avatar: 'JC',
  },
  {
    name: 'Sarah O\'Brien',
    business: 'Owner, Glow Beauty Salon',
    quote: 'I had no idea my Google page was basically invisible. LocalRank walked me through every fix step by step. It\'s like having an SEO expert on call 24/7.',
    avatar: 'SO',
  },
];

export default function LandingPage({ onGoToSignup, onGoToLogin, onGoToAbout, onGoToPrivacy }) {
  const [openFaq, setOpenFaq] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

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
          </ul>

          <div className="lp-nav-actions">
            <button className="lp-btn-ghost" onClick={onGoToLogin}>Log in</button>
            <button className="lp-btn-primary" onClick={onGoToSignup}>Start Free Trial</button>
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
            <hr />
            <button onClick={onGoToLogin}>Log in</button>
            <button className="lp-btn-primary lp-btn-full" onClick={onGoToSignup}>Start Free Trial</button>
          </div>
        )}
      </nav>

      {/* ── HERO ── */}
      <section className="lp-hero">
        <div className="lp-hero-inner">
          <div className="lp-hero-text">
            <div className="lp-hero-badge">AI-Powered · No SEO Experience Needed</div>
            <h1 className="lp-hero-headline">
              Get More Customers From<br />
              <span className="lp-hero-highlight">Google — On Autopilot</span>
            </h1>
            <p className="lp-hero-sub">
              SEO AI Labs analyses your Google Business page, tells you exactly
              what to fix, and helps you reply to reviews in seconds — all powered by AI.
            </p>
            <div className="lp-hero-cta">
              <button className="lp-btn-primary lp-btn-lg" onClick={onGoToSignup}>
                Start Free Trial — No Card Required
              </button>
              <button className="lp-btn-text" onClick={onGoToLogin}>
                Already have an account? Log in →
              </button>
            </div>
            <p className="lp-hero-note">7-day free trial · Cancel anytime</p>
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

      {/* ── HOW IT WORKS ── */}
      <section className="lp-how">
        <div className="lp-container">
          <p className="lp-eyebrow">Simple setup</p>
          <h2 className="lp-section-title">Up and Running in Minutes</h2>
          <div className="lp-steps">
            <div className="lp-step">
              <div className="lp-step-num">1</div>
              <div className="lp-step-connector" />
              <h3 className="lp-step-title">Create your account</h3>
              <p className="lp-step-desc">Create your account, then link your Google Business page by searching your business on Google Maps, clicking your listing, and copying the URL from your browser address bar.</p>
            </div>
            <div className="lp-step">
              <div className="lp-step-num">2</div>
              <div className="lp-step-connector" />
              <h3 className="lp-step-title">Get your AI SEO report</h3>
              <p className="lp-step-desc">In seconds, receive your SEO health score, keyword suggestions, and a personalised list of improvements ranked by impact.</p>
            </div>
            <div className="lp-step">
              <div className="lp-step-num">3</div>
              <h3 className="lp-step-title">Fix, optimise, and reply</h3>
              <p className="lp-step-desc">Follow the step-by-step action guide to improve your listing, and paste reviews in to generate professional replies instantly.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section className="lp-pricing" id="pricing">
        <div className="lp-container">
          <p className="lp-eyebrow">Simple pricing</p>
          <h2 className="lp-section-title">One Plan. Everything Included.</h2>
          <div className="lp-pricing-card">
            <div className="lp-pricing-badge">Most Popular</div>
            <div className="lp-pricing-price">
              <span className="lp-price-currency">$</span>
              <span className="lp-price-amount">39</span>
              <span className="lp-price-period">/mo per location</span>
            </div>
            <p className="lp-pricing-trial">7-day free trial — no credit card required</p>
            <ul className="lp-pricing-features">
              <li><span className="lp-check">✓</span> Unlimited SEO analyses</li>
              <li><span className="lp-check">✓</span> Full keyword gap report</li>
              <li><span className="lp-check">✓</span> Step-by-step optimization plan</li>
              <li><span className="lp-check">✓</span> Progress tracking with checkboxes</li>
              <li><span className="lp-check">✓</span> Unlimited AI review replies</li>
              <li><span className="lp-check">✓</span> Reply history saved to dashboard</li>
              <li><span className="lp-check">✓</span> Past analyses history</li>
              <li><span className="lp-check">✓</span> Cancel anytime, no questions asked</li>
            </ul>
            <button className="lp-btn-primary lp-btn-lg lp-btn-full" onClick={onGoToSignup}>
              Start Your Free Trial
            </button>
            <p className="lp-pricing-note">
              Managing multiple locations? Each location needs its own account.
            </p>
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
          </div>
          <p className="lp-footer-copy">© {new Date().getFullYear()} SEO AI Labs. All rights reserved.</p>
        </div>
      </footer>

    </div>
  );
}
