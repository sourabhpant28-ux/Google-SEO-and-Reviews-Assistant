import './StaticPage.css';

export default function PrivacyPolicy({ onGoBack }) {
  return (
    <div className="static-page">
      <div className="static-nav">
        <button className="static-back-btn" onClick={onGoBack}>← Back to home</button>
        <span className="static-brand">
          <span>⚡</span> SEO AI Labs
        </span>
      </div>

      <div className="static-container">
        <h1 className="static-title">Privacy Policy</h1>
        <p className="static-updated">Last updated: March 2026</p>

        <p className="static-intro">
          SEO AI Labs ("we", "our", or "us") is committed to protecting your privacy. This Privacy
          Policy explains how we collect, use, and safeguard your information when you use our
          web application at seoailabs.com.
        </p>

        <div className="static-section">
          <h2>1. Information We Collect</h2>
          <h3>Account Information</h3>
          <p>When you create an account, we collect your first name, last name, and email address. Your password is stored securely by Supabase and is never accessible to us in plain text.</p>

          <h3>Business Information</h3>
          <p>We collect information you voluntarily provide about your business, including your Google Business page URL, business name, category, description, and any customer review text you paste into the app for analysis.</p>

          <h3>Usage Data</h3>
          <p>We store the results of your SEO analyses, keyword reports, AI-generated review replies, and your optimization progress (checkbox states) so you can access your history across sessions.</p>

          <h3>Payment Information</h3>
          <p>We do not store your payment card details. All payment processing is handled by Stripe. We receive only non-sensitive billing metadata such as your subscription status and billing period dates.</p>
        </div>

        <div className="static-section">
          <h2>2. How We Use Your Information</h2>
          <ul>
            <li>To provide, operate, and improve the SEO AI Labs service</li>
            <li>To generate AI-powered SEO analyses and review reply suggestions using your business data</li>
            <li>To save your history, progress, and results so you can reference them later</li>
            <li>To manage your subscription and send billing-related communications</li>
            <li>To send important service updates (we do not send marketing emails without your consent)</li>
            <li>To respond to your support requests</li>
          </ul>
        </div>

        <div className="static-section">
          <h2>3. AI Processing</h2>
          <p>SEO analyses and review reply generation are powered by Claude, an AI model developed by Anthropic. When you submit information for analysis, your business data and review text is sent to Anthropic's API for processing. Anthropic's privacy policy applies to this processing. We do not use your data to train AI models.</p>
        </div>

        <div className="static-section">
          <h2>4. Third-Party Services</h2>
          <p>We use the following third-party services to operate SEO AI Labs:</p>
          <ul>
            <li><strong>Supabase</strong> — database and user authentication. Your account data and analysis history is stored in Supabase's infrastructure.</li>
            <li><strong>Stripe</strong> — payment processing and subscription management. Card details are handled entirely by Stripe and never stored on our servers.</li>
            <li><strong>Anthropic (Claude)</strong> — AI analysis and content generation.</li>
            <li><strong>Netlify</strong> — web application hosting.</li>
          </ul>
          <p>Each of these providers operates under their own privacy policies and data protection standards.</p>
        </div>

        <div className="static-section">
          <h2>5. Data Storage and Security</h2>
          <p>Your data is stored in Supabase's secure cloud infrastructure with row-level security (RLS) enabled. This means only you — authenticated as yourself — can read or modify your own data. We use HTTPS for all data transmission. While we take reasonable steps to protect your information, no method of transmission over the internet is 100% secure.</p>
        </div>

        <div className="static-section">
          <h2>6. Data Retention</h2>
          <p>We retain your account data and analysis history for as long as your account is active. If you close your account, you may request deletion of your data by contacting us. Some information may be retained for legal or billing purposes for a limited period after account closure.</p>
        </div>

        <div className="static-section">
          <h2>7. Your Rights</h2>
          <p>You have the right to:</p>
          <ul>
            <li>Access the personal data we hold about you</li>
            <li>Request correction of inaccurate data</li>
            <li>Request deletion of your account and associated data</li>
            <li>Object to or restrict certain processing of your data</li>
            <li>Export a copy of your data</li>
          </ul>
          <p>To exercise any of these rights, please contact us at the email address below.</p>
        </div>

        <div className="static-section">
          <h2>8. Cookies</h2>
          <p>We use essential cookies and local storage to maintain your login session. We do not use advertising or tracking cookies. No third-party tracking or analytics scripts are loaded on our platform.</p>
        </div>

        <div className="static-section">
          <h2>9. Children's Privacy</h2>
          <p>SEO AI Labs is intended for business owners and professionals. We do not knowingly collect personal information from anyone under the age of 16. If you believe we have inadvertently collected such information, please contact us immediately.</p>
        </div>

        <div className="static-section">
          <h2>10. Changes to This Policy</h2>
          <p>We may update this Privacy Policy from time to time. When we do, we will update the "last updated" date at the top of this page. We encourage you to review this page periodically. Continued use of SEO AI Labs after any changes constitutes your acceptance of the updated policy.</p>
        </div>

        <div className="static-section">
          <h2>11. Contact Us</h2>
          <p>If you have any questions, concerns, or requests regarding this Privacy Policy or your personal data, please contact us at:</p>
          <p className="static-contact">
            <strong>SEO AI Labs</strong><br />
            Email: <a href="mailto:seoailabs@gmail.com">seoailabs@gmail.com</a><br />
            Website: seoailabs.com
          </p>
        </div>
      </div>
    </div>
  );
}
