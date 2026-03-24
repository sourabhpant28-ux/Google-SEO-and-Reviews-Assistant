import './StaticPage.css';

export default function About({ onGoBack, onGoToSignup, onGoToLogin }) {
  return (
    <div className="static-page">
      <div className="static-nav">
        <button className="static-back-btn" onClick={onGoBack}>← Back to home</button>
        <span className="static-brand">
          <span>⚡</span> SEO AI Labs
        </span>
      </div>

      <div className="static-container">
        <h1 className="static-title">About SEO AI Labs</h1>

        <p className="static-intro">
          We built SEO AI Labs because we watched too many great local businesses lose customers
          to competitors — not because they were worse, but because they were harder to find on Google.
        </p>

        {/* Mission */}
        <div className="about-mission">
          <div className="about-mission-icon">⚡</div>
          <h2>Our Mission</h2>
          <p>
            To give every local business owner — regardless of technical skill or marketing budget —
            the same SEO advantage that large chains pay agencies thousands of dollars for. We use
            AI to make it simple, fast, and affordable.
          </p>
        </div>

        {/* Story */}
        <div className="static-section">
          <h2>The Problem We Saw</h2>
          <p>
            Most local business owners know they should be replying to Google reviews and optimising
            their Google Business listing. But between running their business day-to-day, there is
            simply no time — and even when there is, nobody tells them exactly what to change or where to click.
          </p>
          <p>
            SEO agencies charge $500–$2,000 per month for this work. Generic tools give scores
            without action plans. And Google's own documentation is buried and confusing.
          </p>
          <p>
            We thought: what if an AI could do this for you in seconds?
          </p>
        </div>

        {/* What we built */}
        <div className="static-section">
          <h2>What We Built</h2>
          <div className="about-features-grid">
            <div className="about-feature-card">
              <div className="about-feature-icon">🔍</div>
              <h3>AI SEO Analyzer</h3>
              <p>
                Paste your Google Business URL and get a full SEO health score, keyword gap
                analysis, and a step-by-step action plan with exact instructions for every
                improvement — right down to which menu to click inside Google Business Profile.
              </p>
            </div>
            <div className="about-feature-card">
              <div className="about-feature-icon">💬</div>
              <h3>AI Review Reply Generator</h3>
              <p>
                Paste any customer review and receive three personalised reply options — formal,
                friendly, and brief. Each reply references your business name and sounds human,
                not templated. Copy and paste straight into Google in under 10 seconds.
              </p>
            </div>
          </div>
        </div>

        {/* Values */}
        <div className="static-section">
          <h2>What We Believe</h2>
          <div className="about-values">
            <div className="about-value">
              <span className="about-value-icon">🎯</span>
              <div>
                <strong>Simple over complex</strong>
                <p>We strip away everything that doesn't directly help you get more customers from Google.</p>
              </div>
            </div>
            <div className="about-value">
              <span className="about-value-icon">💰</span>
              <div>
                <strong>Fair pricing</strong>
                <p>$39 per month per location. One price, all features, no hidden add-ons. Cancel anytime.</p>
              </div>
            </div>
            <div className="about-value">
              <span className="about-value-icon">🔒</span>
              <div>
                <strong>Your data is yours</strong>
                <p>We store only what we need to run the service. We never sell your data or use it to train AI models.</p>
              </div>
            </div>
            <div className="about-value">
              <span className="about-value-icon">⚡</span>
              <div>
                <strong>Results in minutes, not months</strong>
                <p>You'll have your first SEO report and a complete action plan within 60 seconds of signing up.</p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="about-cta">
          <h2>Ready to rank higher on Google?</h2>
          <p>Start your 7-day free trial today. No credit card required.</p>
          <div className="about-cta-buttons">
            <button className="about-btn-primary" onClick={onGoToSignup}>
              Start Free Trial
            </button>
            <button className="about-btn-ghost" onClick={onGoToLogin}>
              Already have an account? Log in →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
