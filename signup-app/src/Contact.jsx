import './StaticPage.css';

export default function Contact({ onGoBack }) {
  return (
    <div className="static-page">
      <div className="static-nav">
        <button className="static-back-btn" onClick={onGoBack}>← Back to home</button>
        <span className="static-brand">
          <span>⚡</span> SEO AI Labs
        </span>
      </div>

      <div className="static-container">
        <h1 className="static-title">Contact Us</h1>

        <p className="static-intro">
          We'd love to hear from you. Whether you have a question about a feature,
          need help with your account, or just want to say hello — drop us an email
          and we'll get back to you as soon as possible.
        </p>

        {/* Main contact card */}
        <div className="static-section">
          <h2>Get in Touch</h2>
          <p>
            The fastest way to reach us is by email. We typically respond within
            one business day.
          </p>
          <p className="static-contact">
            <strong>SEO AI Labs</strong><br />
            Email: <a href="mailto:seoailabs@gmail.com">seoailabs@gmail.com</a><br />
            Website: seoailabs.com
          </p>
        </div>

        {/* What to include */}
        <div className="static-section">
          <h2>What to Include in Your Message</h2>
          <p>To help us resolve your query quickly, please include:</p>
          <ul>
            <li>Your account email address</li>
            <li>A short description of the issue or question</li>
            <li>Any error messages or screenshots if relevant</li>
          </ul>
        </div>

        {/* Billing & subscriptions */}
        <div className="static-section">
          <h2>Billing &amp; Subscriptions</h2>
          <p>
            For questions about your subscription, invoices, or payment, email us at{' '}
            <a href="mailto:seoailabs@gmail.com" style={{ color: '#0071e3' }}>seoailabs@gmail.com</a>{' '}
            with the subject line <strong>"Billing"</strong> and we'll help you out right away.
          </p>
        </div>

        {/* Feature requests */}
        <div className="static-section">
          <h2>Feature Requests &amp; Feedback</h2>
          <p>
            We genuinely read every piece of feedback. If there's something you'd love to see
            in SEO AI Labs, send it our way — your ideas shape the product roadmap.
          </p>
          <p className="static-contact">
            <a href="mailto:seoailabs@gmail.com">seoailabs@gmail.com</a>
          </p>
        </div>
      </div>
    </div>
  );
}
