import express from 'express';
import cors from 'cors';
import Anthropic from '@anthropic-ai/sdk';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const app = express();
app.use(cors({
  origin: [
    'https://seoailabs.com',
    'https://www.seoailabs.com',
    'https://sourabhgooglereviewseoassistant.netlify.app',
    'http://localhost:5173',
    'http://localhost:4173',
  ],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Supabase admin client (service role — bypasses RLS)
const supabaseAdmin = process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
  : null;

// Resend email client
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// Stripe initialised lazily so missing key only errors on actual Stripe calls
let stripe = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
}

// ── Email builder ──────────────────────────────────────────────
function buildReportEmail(firstName, businessUrl, businessCategory, r) {
  const scoreColor = r.seoRating >= 8 ? '#30d158' : r.seoRating >= 5 ? '#ff9f0a' : '#ff3b30';
  const scoreBg    = r.seoRating >= 8 ? '#f0fdf4' : r.seoRating >= 5 ? '#fffbeb' : '#fff5f5';
  const scoreLabel = r.seoRating >= 8 ? 'Great Foundation' : r.seoRating >= 5 ? 'Needs Improvement' : 'Urgent Attention Needed';
  const pct = r.seoRating * 10;
  const year = new Date().getFullYear();

  const kwBadge = (k, bg, color) =>
    `<span style="display:inline-block;background:${bg};color:${color};font-size:12px;font-weight:600;padding:5px 13px;border-radius:99px;margin:3px 4px 3px 0;line-height:1.4">${k}</span>`;

  const positiveKws  = (r.positiveKeywords  || []).map((k) => kwBadge(k, '#e8f0fe', '#0071e3')).join('');
  const negativeKws  = (r.negativeKeywords  || []).map((k) => kwBadge(k, '#fff0ef', '#c0392b')).join('');
  const missingKws   = (r.missingKeywords   || []).map((k) => kwBadge(k, '#f5f5f7', '#3a3a3c')).join('');

  const improvements = (r.improvements || []).map((imp, i) => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #f0f0f0">
        <table cellpadding="0" cellspacing="0" width="100%"><tr>
          <td width="28" style="vertical-align:top;padding-top:1px">
            <div style="width:22px;height:22px;border-radius:50%;background:#0071e3;color:#fff;font-size:11px;font-weight:700;text-align:center;line-height:22px;flex-shrink:0">${i + 1}</div>
          </td>
          <td style="font-size:14px;color:#3a3a3c;line-height:1.6;padding-left:8px">${imp}</td>
        </tr></table>
      </td>
    </tr>`).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light">
  <title>Your Google Business SEO Report — SEO AI Labs</title>
  <style>
    @media only screen and (max-width:600px){
      .email-body{padding:16px !important}
      .main-card{border-radius:16px !important}
      .header-pad{padding:28px 24px !important}
      .content-pad{padding:0 24px !important}
      .section-pad{padding:24px !important}
      .score-table td{display:block !important;width:100% !important;text-align:center !important}
      .score-right{padding-left:0 !important;padding-top:16px !important}
      .cta-pad{padding:28px 24px !important}
      .footer-pad{padding:20px 24px !important}
    }
  </style>
</head>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">

<table width="100%" cellpadding="0" cellspacing="0" class="email-body" style="background:#f0f4f8;padding:40px 20px">
<tr><td align="center">
<table width="100%" style="max-width:640px" cellpadding="0" cellspacing="0">

  <!-- Pre-header -->
  <tr><td style="font-size:0;max-height:0;overflow:hidden;color:#f0f4f8">
    Your Google Business SEO Score: ${r.seoRating}/10 — ${scoreLabel}. See your full analysis inside.
  </td></tr>

  <!-- Main card -->
  <tr><td class="main-card" style="background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 4px 40px rgba(0,0,0,0.10)">

    <!-- Header -->
    <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td class="header-pad" style="background:linear-gradient(135deg,#0055b3 0%,#0071e3 50%,#34aadc 100%);padding:44px 48px;text-align:center">
      <table cellpadding="0" cellspacing="0" style="margin:0 auto">
        <tr><td style="text-align:center">
          <div style="display:inline-block;background:rgba(255,255,255,0.15);border-radius:16px;padding:10px 18px;margin-bottom:14px">
            <span style="font-size:26px;vertical-align:middle">⚡</span>
            <span style="font-size:20px;font-weight:800;color:#ffffff;letter-spacing:-0.3px;vertical-align:middle;margin-left:6px">SEO AI Labs</span>
          </div>
          <div style="font-size:26px;font-weight:800;color:#ffffff;line-height:1.2;margin-bottom:8px">Your Free SEO Report<br>is Ready</div>
          <p style="margin:0;font-size:15px;color:rgba(255,255,255,0.80);line-height:1.5">Powered by AI · Google Business Profile Analysis</p>
        </td></tr>
      </table>
    </td></tr>
    </table>

    <!-- Greeting -->
    <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td class="content-pad" style="padding:36px 48px 0">
      <p style="margin:0 0 8px;font-size:18px;font-weight:700;color:#1d1d1f">Hi ${firstName || 'there'} 👋</p>
      <p style="margin:0;font-size:14px;color:#6e6e73;line-height:1.7">
        Here's your personalised SEO analysis for:<br>
        <a href="${businessUrl}" style="color:#0071e3;font-weight:600;word-break:break-all">${businessUrl}</a>
        &nbsp;·&nbsp;<span style="color:#aeaeb2">${businessCategory || 'General Business'}</span>
      </p>
    </td></tr>
    </table>

    <!-- Divider -->
    <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td class="content-pad" style="padding:20px 48px 0"><hr style="border:none;border-top:1px solid #f0f0f0;margin:0"></td></tr>
    </table>

    <!-- SEO Score -->
    <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td class="section-pad" style="padding:28px 48px">
      <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#aeaeb2;margin-bottom:16px">SEO Health Score</div>
      <table class="score-table" width="100%" cellpadding="0" cellspacing="0" style="background:${scoreBg};border-radius:16px;padding:24px;border:1.5px solid ${scoreColor}30">
      <tr>
        <td width="100" style="text-align:center;vertical-align:middle">
          <div style="display:inline-block;position:relative">
            <div style="width:88px;height:88px;border-radius:50%;background:conic-gradient(${scoreColor} 0% ${pct}%,#e5e5ea ${pct}% 100%)">
              <table width="88" height="88" cellpadding="0" cellspacing="0" style="position:absolute;top:0;left:0"><tr><td align="center" valign="middle">
                <div style="width:66px;height:66px;border-radius:50%;background:${scoreBg};margin:11px auto;display:flex;align-items:center;justify-content:center">
                  <div>
                    <div style="font-size:26px;font-weight:800;color:${scoreColor};line-height:1;text-align:center">${r.seoRating}</div>
                    <div style="font-size:10px;color:#aeaeb2;text-align:center">/10</div>
                  </div>
                </div>
              </td></tr></table>
            </div>
          </div>
        </td>
        <td class="score-right" style="padding-left:24px;vertical-align:middle">
          <div style="font-size:18px;font-weight:800;color:${scoreColor};margin-bottom:4px">${scoreLabel}</div>
          <div style="height:6px;background:#e5e5ea;border-radius:99px;overflow:hidden;margin-bottom:10px;max-width:240px">
            <div style="height:100%;width:${pct}%;background:${scoreColor};border-radius:99px"></div>
          </div>
          <p style="margin:0;font-size:14px;color:#3a3a3c;line-height:1.6">${r.seoExplanation || ''}</p>
        </td>
      </tr>
      </table>
    </td></tr>
    </table>

    <!-- Positive Keywords -->
    <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td class="content-pad" style="padding:0 48px 24px">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">
        <span style="font-size:16px">✅</span>
        <span style="font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#1a8a3a">Keywords Already Working For You</span>
      </div>
      <div style="background:#f0fdf4;border-radius:12px;padding:16px 18px;border-left:4px solid #30d158">
        ${positiveKws || '<span style="font-size:13px;color:#6e6e73">No data available</span>'}
      </div>
    </td></tr>
    </table>

    <!-- Negative Keywords -->
    <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td class="content-pad" style="padding:0 48px 24px">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">
        <span style="font-size:16px">⚠️</span>
        <span style="font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#b45309">Negative Themes &amp; Complaints Found</span>
      </div>
      <div style="background:#fffbeb;border-radius:12px;padding:16px 18px;border-left:4px solid #ff9f0a">
        ${negativeKws || '<span style="font-size:13px;color:#6e6e73">None identified</span>'}
      </div>
    </td></tr>
    </table>

    <!-- Missing Keywords -->
    <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td class="content-pad" style="padding:0 48px 24px">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">
        <span style="font-size:16px">🎯</span>
        <span style="font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#c0392b">Missing Keywords You Should Be Targeting</span>
      </div>
      <div style="background:#fff5f5;border-radius:12px;padding:16px 18px;border-left:4px solid #ff3b30">
        ${missingKws || '<span style="font-size:13px;color:#6e6e73">No data available</span>'}
      </div>
    </td></tr>
    </table>

    <!-- CTA -->
    <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td class="cta-pad" style="padding:0 48px 36px">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#0055b3,#0071e3);border-radius:20px;overflow:hidden">
      <tr><td style="padding:36px 32px;text-align:center">
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:rgba(255,255,255,0.7);margin-bottom:12px">Ready to fix these issues?</div>
        <div style="font-size:22px;font-weight:800;color:#ffffff;line-height:1.3;margin-bottom:8px">Get Your Full<br>Optimization Plan</div>
        <p style="margin:0 0 24px;font-size:13px;color:rgba(255,255,255,0.75);line-height:1.6;max-width:320px;margin-left:auto;margin-right:auto">
          Upgrade to unlock step-by-step fix guides for every issue, plus AI-powered review reply templates to respond to your Google reviews in seconds.
        </p>
        <a href="https://seoailabs.com" style="display:inline-block;background:#ffffff;color:#0071e3;font-size:15px;font-weight:800;padding:15px 36px;border-radius:980px;text-decoration:none;letter-spacing:-0.2px">
          Get Your Full Optimization Plan →
        </a>
        <p style="margin:16px 0 0;font-size:12px;color:rgba(255,255,255,0.6)">$39/month · Cancel anytime · No hidden fees</p>
      </td></tr>
      </table>
    </td></tr>
    </table>

    <!-- Footer -->
    <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td class="footer-pad" style="padding:24px 48px;border-top:1px solid #f0f0f0;text-align:center">
      <table cellpadding="0" cellspacing="0" style="margin:0 auto 12px">
        <tr><td style="text-align:center">
          <span style="font-size:15px;vertical-align:middle">⚡</span>
          <span style="font-size:14px;font-weight:700;color:#1d1d1f;vertical-align:middle;margin-left:4px">SEO AI Labs</span>
        </td></tr>
      </table>
      <p style="margin:0 0 8px;font-size:12px;color:#aeaeb2;line-height:1.6">
        © ${year} SEO AI Labs ·
        <a href="https://seoailabs.com" style="color:#0071e3;text-decoration:none">seoailabs.com</a>
      </p>
      <p style="margin:0;font-size:11px;color:#c7c7cc;line-height:1.5">
        You received this email because you requested a free SEO report at seoailabs.com.<br>
        <a href="https://seoailabs.com" style="color:#c7c7cc;text-decoration:underline">Unsubscribe</a>
      </p>
    </td></tr>
    </table>

  </td></tr>
  <!-- End main card -->

</table>
</td></tr>
</table>

</body>
</html>`;
}
// ── Follow-up email builders ───────────────────────────────────
function emailShell(preheader, headerBg, content, year) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light">
  <title>SEO AI Labs</title>
  <style>
    @media only screen and (max-width:600px){
      .email-body{padding:16px !important}
      .main-card{border-radius:16px !important}
      .header-pad{padding:28px 24px !important}
      .body-pad{padding:28px 24px !important}
      .cta-pad{padding:28px 24px !important}
      .footer-pad{padding:20px 24px !important}
    }
  </style>
</head>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" class="email-body" style="background:#f0f4f8;padding:40px 20px">
<tr><td align="center">
<table width="100%" style="max-width:640px" cellpadding="0" cellspacing="0">
  <tr><td style="font-size:0;max-height:0;overflow:hidden;color:#f0f4f8">${preheader}</td></tr>
  <tr><td class="main-card" style="background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 4px 40px rgba(0,0,0,0.10)">
    <!-- Header -->
    <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td class="header-pad" style="background:${headerBg};padding:36px 48px;text-align:center">
      <div style="display:inline-block;background:rgba(255,255,255,0.15);border-radius:14px;padding:8px 16px;margin-bottom:12px">
        <span style="font-size:22px;vertical-align:middle">⚡</span>
        <span style="font-size:18px;font-weight:800;color:#ffffff;vertical-align:middle;margin-left:6px">SEO AI Labs</span>
      </div>
    </td></tr>
    </table>
    <!-- Body -->
    ${content}
    <!-- Footer -->
    <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td class="footer-pad" style="padding:24px 48px;border-top:1px solid #f0f0f0;text-align:center">
      <p style="margin:0 0 6px;font-size:12px;color:#aeaeb2">
        © ${year} SEO AI Labs · <a href="https://seoailabs.com" style="color:#0071e3;text-decoration:none">seoailabs.com</a>
      </p>
      <p style="margin:0;font-size:11px;color:#c7c7cc">
        You received this because you requested a free SEO report.<br>
        <a href="https://seoailabs.com" style="color:#c7c7cc;text-decoration:underline">Unsubscribe</a>
      </p>
    </td></tr>
    </table>
  </td></tr>
</table>
</td></tr>
</table>
</body></html>`;
}

function ctaButton(label, url) {
  return `<table cellpadding="0" cellspacing="0" style="margin:24px auto 0"><tr><td align="center">
    <a href="${url}" style="display:inline-block;background:linear-gradient(135deg,#0055b3,#0071e3);color:#fff;font-size:15px;font-weight:800;padding:15px 36px;border-radius:980px;text-decoration:none">${label} →</a>
  </td></tr></table>
  <p style="text-align:center;margin:12px 0 0;font-size:12px;color:#aeaeb2">7-day free trial · No credit card required</p>`;
}

function buildFollowup2(firstName, seoRating, topIssue) {
  const year = new Date().getFullYear();
  const scoreColor = seoRating >= 8 ? '#30d158' : seoRating >= 5 ? '#ff9f0a' : '#ff3b30';
  const content = `
    <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td class="body-pad" style="padding:36px 48px">
      <p style="font-size:18px;font-weight:700;color:#1d1d1f;margin:0 0 16px">Hi ${firstName || 'there'} 👋</p>
      <p style="font-size:15px;color:#3a3a3c;line-height:1.7;margin:0 0 20px">
        A couple of days ago you checked your Google Business page on SEO AI Labs and got a score of
        <strong style="color:${scoreColor};font-size:18px"> ${seoRating}/10</strong>.
      </p>
      <p style="font-size:15px;color:#3a3a3c;line-height:1.7;margin:0 0 20px">
        One of the key issues we found was:
      </p>
      <div style="background:#fff5f5;border-left:4px solid #ff3b30;border-radius:0 12px 12px 0;padding:16px 20px;margin-bottom:24px">
        <p style="margin:0;font-size:14px;color:#1d1d1f;line-height:1.7;font-weight:500">⚠️ ${topIssue || 'Your Google Business page has optimisation opportunities that are costing you customers.'}</p>
      </div>
      <p style="font-size:15px;color:#3a3a3c;line-height:1.7;margin:0 0 8px">
        The step-by-step fix guide for this — and every other issue on your page — is waiting inside SEO AI Labs.
        It takes less than 10 minutes to fix and could put you above your competitors in Google Maps.
      </p>
      ${ctaButton('See My Full Fix Guide', 'https://seoailabs.com')}
    </td></tr>
    </table>`;
  return emailShell(
    `Your Google Business score was ${seoRating}/10 — here's the #1 issue holding you back and how to fix it.`,
    'linear-gradient(135deg,#0055b3 0%,#0071e3 100%)',
    content,
    year
  );
}

function buildFollowup3(firstName) {
  const year = new Date().getFullYear();
  const content = `
    <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td class="body-pad" style="padding:36px 48px">
      <p style="font-size:18px;font-weight:700;color:#1d1d1f;margin:0 0 16px">Hi ${firstName || 'there'} 👋</p>
      <p style="font-size:15px;color:#3a3a3c;line-height:1.7;margin:0 0 20px">
        While you're reading this, your competitors are optimising their Google Business pages.
      </p>
      <div style="background:#fff8e1;border-left:4px solid #ff9f0a;border-radius:0 12px 12px 0;padding:20px;margin-bottom:24px">
        <p style="margin:0 0 10px;font-size:15px;font-weight:700;color:#1d1d1f">Every day without fixes costs you customers:</p>
        <table cellpadding="0" cellspacing="0" width="100%">
          ${['Searches that find them instead of you', 'Reviews going unanswered — hurting your trust score', 'Missing keywords keeping you off the first page', 'Customers choosing a competitor with a better-optimised listing'].map(item => `
          <tr><td style="padding:5px 0;font-size:14px;color:#3a3a3c;line-height:1.6">
            <span style="color:#ff9f0a;font-weight:700;margin-right:8px">→</span>${item}
          </td></tr>`).join('')}
        </table>
      </div>
      <p style="font-size:15px;color:#3a3a3c;line-height:1.7;margin:0 0 8px">
        SEO AI Labs gives you the exact playbook to fix all of this — step by step — in under an hour.
        Your 7-day free trial is still available. No credit card. No commitment.
      </p>
      ${ctaButton('Fix My Google Page Now', 'https://seoailabs.com')}
    </td></tr>
    </table>`;
  return emailShell(
    'Every day you wait, competitors are pulling ahead on Google. Here\'s how to catch up fast.',
    'linear-gradient(135deg,#b45309 0%,#d97706 100%)',
    content,
    year
  );
}

function buildFollowup4(firstName) {
  const year = new Date().getFullYear();
  const content = `
    <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td class="body-pad" style="padding:36px 48px">
      <p style="font-size:18px;font-weight:700;color:#1d1d1f;margin:0 0 16px">Hi ${firstName || 'there'} — one last message 👋</p>
      <p style="font-size:15px;color:#3a3a3c;line-height:1.7;margin:0 0 20px">
        I wanted to send one final reminder that your free SEO AI Labs account is still waiting for you.
      </p>
      <div style="background:#f0f7ff;border-radius:16px;padding:24px;margin-bottom:24px;text-align:center">
        <p style="margin:0 0 4px;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#0071e3">What you get free — no credit card needed</p>
        <table cellpadding="0" cellspacing="0" style="margin:16px auto 0;text-align:left">
          ${['Full SEO Health Score with detailed breakdown', 'Complete keyword gap analysis', 'Step-by-step fix guide for every issue', 'AI review reply generator — respond in seconds', '7-day full access — cancel anytime'].map(item => `
          <tr><td style="padding:5px 8px;font-size:14px;color:#3a3a3c;line-height:1.6">
            <span style="color:#30d158;font-weight:700;margin-right:8px">✓</span>${item}
          </td></tr>`).join('')}
        </table>
      </div>
      <p style="font-size:15px;color:#3a3a3c;line-height:1.7;margin:0 0 8px">
        Sign up in under 2 minutes and see your full optimisation plan instantly. This is the last email I'll send — I hope to see you inside!
      </p>
      ${ctaButton('Start Free — No Credit Card', 'https://seoailabs.com')}
    </td></tr>
    </table>`;
  return emailShell(
    'Last reminder — your free SEO AI Labs account is ready. No credit card. See your full plan instantly.',
    'linear-gradient(135deg,#1a8a3a 0%,#30d158 100%)',
    content,
    year
  );
}

// ── Schedule all follow-up emails via Resend ───────────────────
async function scheduleFollowupEmails(firstName, email, seoRating, topIssue) {
  if (!resend) return {};
  const ids = {};
  const now = new Date();

  const schedule = [
    {
      key: 'email_2',
      delayMs: 24 * 60 * 60 * 1000,           // 24 hours
      subject: `Did you see your SEO score, ${firstName || 'there'}?`,
      html: buildFollowup2(firstName, seoRating, topIssue),
    },
    {
      key: 'email_3',
      delayMs: 3 * 24 * 60 * 60 * 1000,        // 3 days
      subject: 'Your competitors are fixing their Google page. Are you?',
      html: buildFollowup3(firstName),
    },
    {
      key: 'email_4',
      delayMs: 7 * 24 * 60 * 60 * 1000,        // 7 days
      subject: `Last reminder — your free SEOAILabs account is waiting, ${firstName || 'there'}`,
      html: buildFollowup4(firstName),
    },
  ];

  for (const item of schedule) {
    const sendAt = new Date(now.getTime() + item.delayMs);
    try {
      const { data, error } = await resend.emails.send({
        from: 'SEO AI Labs <noreply@seoailabs.com>',
        to: [email],
        subject: item.subject,
        html: item.html,
        scheduled_at: sendAt.toISOString(),
      });
      if (error) {
        console.error(`Schedule ${item.key} error:`, error);
      } else {
        ids[item.key] = data?.id || null;
      }
    } catch (err) {
      console.error(`Schedule ${item.key} exception:`, err.message);
    }
  }

  return ids;
}

const FRONTEND_URL = process.env.FRONTEND_URL || 'https://sourabhgooglereviewseoassistant.netlify.app';
const STRIPE_PRODUCT_ID = process.env.STRIPE_PRODUCT_ID || 'prod_UCjQo4L9j23NxT';

app.post('/api/analyze', async (req, res) => {
  const { businessUrl, businessName, businessCategory, businessDescription, reviews } = req.body;

  const filledReviews = (reviews || []).filter((r) => r.trim());

  const reviewsBlock = filledReviews.length > 0
    ? filledReviews.map((r, i) => `Review ${i + 1}: "${r}"`).join('\n')
    : 'No reviews provided.';

  const prompt = `You are an expert Google Business SEO consultant. Analyze the following business information and customer reviews, then return a structured JSON report.

Business Information:
- Name: ${businessName}
- Category: ${businessCategory}
- Google Business URL: ${businessUrl}
- Description: ${businessDescription || 'Not provided'}

Customer Reviews:
${reviewsBlock}

Return ONLY valid JSON matching this exact schema — no markdown, no commentary, no extra text:
{
  "seoRating": <integer 1-10>,
  "positiveKeywords": [<string>, ...],
  "negativeKeywords": [<string>, ...],
  "missingKeywords": [<string>, ...],
  "improvements": [<string>, <string>, <string>, <string>, <string>]
}

Guidelines:
- seoRating: overall SEO health score (1 = very poor, 10 = excellent)
- positiveKeywords: 5-8 keywords/phrases already working well (appearing in reviews or description naturally)
- negativeKeywords: 4-6 negative themes, complaints, or problem areas mentioned in reviews
- missingKeywords: 6-10 high-value keywords this ${businessCategory} business should be targeting but isn't
- improvements: exactly 5 specific, actionable, prioritized suggestions to improve Google Business SEO`;

  try {
    const response = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 1024,
      thinking: { type: 'adaptive' },
      output_config: {
        format: {
          type: 'json_schema',
          schema: {
            type: 'object',
            properties: {
              seoRating: { type: 'integer' },
              positiveKeywords: { type: 'array', items: { type: 'string' } },
              negativeKeywords: { type: 'array', items: { type: 'string' } },
              missingKeywords: { type: 'array', items: { type: 'string' } },
              improvements: { type: 'array', items: { type: 'string' } },
            },
            required: ['seoRating', 'positiveKeywords', 'negativeKeywords', 'missingKeywords', 'improvements'],
            additionalProperties: false,
          },
        },
      },
      messages: [{ role: 'user', content: prompt }],
    });

    const textBlock = response.content.find((b) => b.type === 'text');
    const result = JSON.parse(textBlock.text);
    res.json(result);
  } catch (err) {
    console.error('Claude API error:', err);
    res.status(500).json({ error: err.message || 'Analysis failed' });
  }
});

app.post('/api/reply', async (req, res) => {
  const { reviewText, businessName, businessCategory } = req.body;

  if (!reviewText || !reviewText.trim()) {
    return res.status(400).json({ error: 'Review text is required' });
  }

  const biz = businessName || 'the business';
  const cat = businessCategory || 'business';

  const prompt = `You are an expert Google Business review manager for ${biz}, a ${cat}.

A customer left the following Google review:
"${reviewText}"

Analyze the review sentiment and generate 3 different reply options for the business owner to post on Google. Each reply must:
- Address the reviewer warmly
- Specifically mention "${biz}" by name (not "our business" or "the team")
- Reference specific details from this exact review to feel genuinely personal, not templated
- Be ready to copy-paste directly onto Google Reviews

Return ONLY valid JSON matching this exact schema — no markdown, no commentary:
{
  "sentiment": <"positive"|"neutral"|"negative">,
  "formalReply": <string — professional and polished tone>,
  "friendlyReply": <string — warm, conversational, human tone>,
  "briefReply": <string — concise, 1-2 sentences max>
}`;

  try {
    const response = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 1024,
      thinking: { type: 'adaptive' },
      output_config: {
        format: {
          type: 'json_schema',
          schema: {
            type: 'object',
            properties: {
              sentiment: { type: 'string', enum: ['positive', 'neutral', 'negative'] },
              formalReply: { type: 'string' },
              friendlyReply: { type: 'string' },
              briefReply: { type: 'string' },
            },
            required: ['sentiment', 'formalReply', 'friendlyReply', 'briefReply'],
            additionalProperties: false,
          },
        },
      },
      messages: [{ role: 'user', content: prompt }],
    });

    const textBlock = response.content.find((b) => b.type === 'text');
    const result = JSON.parse(textBlock.text);
    res.json(result);
  } catch (err) {
    console.error('Claude API error (reply):', err);
    res.status(500).json({ error: err.message || 'Reply generation failed' });
  }
});

app.post('/api/action-plan', async (req, res) => {
  const { improvements, businessName, businessCategory } = req.body;

  if (!Array.isArray(improvements) || improvements.length === 0) {
    return res.status(400).json({ error: 'Improvements array is required' });
  }

  const biz = businessName || 'the business';
  const cat = businessCategory || 'business';
  const improvementList = improvements.map((imp, i) => `${i + 1}. ${imp}`).join('\n');

  const prompt = `You are a Google Business Profile expert helping "${biz}", a ${cat}.

Here are 5 SEO improvement recommendations for their Google Business Profile:
${improvementList}

For each improvement, generate a step-by-step action guide with EXACT instructions a non-technical business owner can follow immediately. Each step must name the specific page, button, or field in Google Business Profile and describe precisely what to click, type, or change.

Return ONLY valid JSON — no markdown, no commentary:
{
  "plans": [
    { "steps": ["exact step 1", "exact step 2", "exact step 3", ...] },
    ...exactly 5 plan objects in the same order as the improvements...
  ]
}

Each plan should have 4–6 steps. Be specific to "${biz}" and the ${cat} industry where relevant.`;

  try {
    const response = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 2048,
      thinking: { type: 'adaptive' },
      output_config: {
        format: {
          type: 'json_schema',
          schema: {
            type: 'object',
            properties: {
              plans: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    steps: { type: 'array', items: { type: 'string' } },
                  },
                  required: ['steps'],
                  additionalProperties: false,
                },
              },
            },
            required: ['plans'],
            additionalProperties: false,
          },
        },
      },
      messages: [{ role: 'user', content: prompt }],
    });

    const textBlock = response.content.find((b) => b.type === 'text');
    const result = JSON.parse(textBlock.text);
    res.json(result);
  } catch (err) {
    console.error('Claude API error (action-plan):', err);
    res.status(500).json({ error: err.message || 'Action plan generation failed' });
  }
});

// ── Lead capture: save + full report + send email ─────────────
app.post('/api/lead-report', async (req, res) => {
  const { firstName, lastName, email, businessUrl, businessCategory, reviews } = req.body;

  if (!email || !email.trim()) return res.status(400).json({ error: 'Email is required' });
  if (!businessUrl || !businessUrl.trim()) return res.status(400).json({ error: 'Business URL is required' });

  const filledReviews = (reviews || []).filter((r) => r.trim());
  const reviewsBlock = filledReviews.length > 0
    ? filledReviews.map((r, i) => `Review ${i + 1}: "${r}"`).join('\n')
    : 'No reviews provided.';

  // 1. Save lead to Supabase (non-fatal if fails)
  if (supabaseAdmin) {
    try {
      await supabaseAdmin.from('leads').insert({
        first_name: firstName || '',
        last_name: lastName || '',
        email: email.trim().toLowerCase(),
        business_url: businessUrl.trim(),
        business_category: businessCategory || 'General',
      });
    } catch (dbErr) {
      console.error('Lead save error:', dbErr.message);
    }
  }

  // 2. Generate full analysis with action plans
  const prompt = `You are an expert Google Business SEO consultant. Analyse the following business and return a comprehensive SEO report.

Business URL: ${businessUrl}
Category: ${businessCategory || 'General Business'}

Customer Reviews:
${reviewsBlock}

Return ONLY valid JSON matching this exact schema — no markdown, no commentary:
{
  "seoRating": <integer 1-10>,
  "seoExplanation": <string — 1-2 sentence explanation of why they got this score>,
  "positiveKeywords": [<5-8 keywords already working well>],
  "negativeKeywords": [<4-6 negative themes or complaints from reviews>],
  "missingKeywords": [<6-10 high-value keywords they should target but aren't>],
  "improvements": [<exactly 5 specific, prioritized improvement suggestions>],
  "actionPlans": [
    { "steps": [<4-6 exact step-by-step instructions for improvement 1>] },
    { "steps": [<4-6 exact step-by-step instructions for improvement 2>] },
    { "steps": [<4-6 exact step-by-step instructions for improvement 3>] },
    { "steps": [<4-6 exact step-by-step instructions for improvement 4>] },
    { "steps": [<4-6 exact step-by-step instructions for improvement 5>] }
  ]
}

Each action plan step must name the specific page, button, or field in Google Business Profile with exact click-by-click instructions a non-technical business owner can follow immediately.

CRITICAL: You cannot see the actual Google Business listing from a URL alone. Do NOT flag "no reviews", "lack of reviews", or "no customer reviews" as an improvement or issue unless the user has actually pasted reviews AND those reviews reveal problems. The user may have hundreds of real Google reviews — the absence of pasted reviews does NOT mean the business has no reviews. For negativeKeywords, only include themes found in pasted review text; if no reviews were pasted, return general SEO weakness themes instead (e.g. "incomplete profile", "missing keywords"). Focus improvements on profile optimisation, keyword strategy, description quality, categories, photos, and posts.`;

  try {
    const response = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 4096,
      thinking: { type: 'adaptive' },
      output_config: {
        format: {
          type: 'json_schema',
          schema: {
            type: 'object',
            properties: {
              seoRating: { type: 'integer' },
              seoExplanation: { type: 'string' },
              positiveKeywords: { type: 'array', items: { type: 'string' } },
              negativeKeywords: { type: 'array', items: { type: 'string' } },
              missingKeywords: { type: 'array', items: { type: 'string' } },
              improvements: { type: 'array', items: { type: 'string' } },
              actionPlans: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: { steps: { type: 'array', items: { type: 'string' } } },
                  required: ['steps'],
                  additionalProperties: false,
                },
              },
            },
            required: ['seoRating', 'seoExplanation', 'positiveKeywords', 'negativeKeywords', 'missingKeywords', 'improvements', 'actionPlans'],
            additionalProperties: false,
          },
        },
      },
      messages: [{ role: 'user', content: prompt }],
    });

    const textBlock = response.content.find((b) => b.type === 'text');
    const result = JSON.parse(textBlock.text);

    const cleanEmail = email.trim().toLowerCase();

    // 3. Send Email 1 immediately via Resend SDK
    if (resend) {
      const html = buildReportEmail(firstName, businessUrl, businessCategory, result);
      const { error: emailErr } = await resend.emails.send({
        from: 'SEO AI Labs <noreply@seoailabs.com>',
        to: [cleanEmail],
        subject: `Your Google Business SEO Report is ready, ${firstName || 'there'}`,
        html,
      });
      if (emailErr) console.error('Resend email_1 error:', emailErr);
    } else {
      console.warn('RESEND_API_KEY not set — email not sent');
    }

    // 4. Schedule follow-up emails 2, 3, 4
    const topIssue = result.improvements?.[0] || '';
    const followupIds = await scheduleFollowupEmails(firstName, cleanEmail, result.seoRating, topIssue);

    // 5. Update lead record with sent_emails tracking
    if (supabaseAdmin) {
      try {
        await supabaseAdmin.from('leads').update({
          sent_emails: ['email_1_sent', 'email_2_scheduled', 'email_3_scheduled', 'email_4_scheduled'],
          resend_email_ids: followupIds,
        }).eq('email', cleanEmail);
      } catch (updateErr) {
        console.error('Lead update error:', updateErr.message);
      }
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Lead report error:', err);
    res.status(500).json({ error: err.message || 'Report generation failed' });
  }
});

// ── Free partial analysis (no login required) ─────────────────
app.post('/api/free-analyze', async (req, res) => {
  const { businessUrl, businessCategory, reviews } = req.body;

  if (!businessUrl || !businessUrl.trim()) {
    return res.status(400).json({ error: 'Business URL is required' });
  }

  const filledReviews = (reviews || []).filter((r) => r.trim());
  const reviewsBlock = filledReviews.length > 0
    ? filledReviews.map((r, i) => `Review ${i + 1}: "${r}"`).join('\n')
    : 'No reviews provided.';

  const prompt = `You are an expert Google Business SEO consultant. Analyse the following Google Business page and reviews.

Business URL: ${businessUrl}
Category: ${businessCategory || 'General Business'}

Customer Reviews:
${reviewsBlock}

Return ONLY valid JSON matching this exact schema — no markdown, no commentary:
{
  "seoRating": <integer 1-10>,
  "topIssues": [<string>, <string>, <string>],
  "positiveKeywords": [<string>, <string>, <string>]
}

Guidelines:
- seoRating: overall SEO health score (1 = very poor, 10 = excellent)
- topIssues: exactly 3 most critical SEO problems hurting their Google ranking — focus on profile completeness, keyword optimisation, description quality, categories, photos, and posts
- positiveKeywords: exactly 3 keywords or phrases already working well for this business
- CRITICAL: You cannot see the actual Google Business listing from a URL alone. Do NOT flag "no reviews", "lack of reviews", or "no customer reviews visible" as an issue unless the user has actually pasted reviews AND those reviews reveal problems. The user may have hundreds of real Google reviews — the absence of pasted reviews in this form does NOT mean the business has no reviews. Focus topIssues on SEO factors like description, keywords, categories, and content quality instead.`;

  try {
    const response = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 512,
      thinking: { type: 'adaptive' },
      output_config: {
        format: {
          type: 'json_schema',
          schema: {
            type: 'object',
            properties: {
              seoRating: { type: 'integer' },
              topIssues: { type: 'array', items: { type: 'string' } },
              positiveKeywords: { type: 'array', items: { type: 'string' } },
            },
            required: ['seoRating', 'topIssues', 'positiveKeywords'],
            additionalProperties: false,
          },
        },
      },
      messages: [{ role: 'user', content: prompt }],
    });

    const textBlock = response.content.find((b) => b.type === 'text');
    const result = JSON.parse(textBlock.text);
    res.json(result);
  } catch (err) {
    console.error('Free analyze error:', err);
    res.status(500).json({ error: err.message || 'Analysis failed' });
  }
});

// ── Stripe: create checkout session ───────────────────────────
app.post('/api/stripe/checkout', async (req, res) => {
  if (!stripe) return res.status(500).json({ error: 'Stripe not configured on this server. Set STRIPE_SECRET_KEY.' });
  const { userId, userEmail } = req.body;
  if (!userId || !userEmail) return res.status(400).json({ error: 'userId and userEmail required' });
  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer_email: userEmail,
      line_items: [{
        price_data: {
          currency: 'usd',
          product: STRIPE_PRODUCT_ID,
          recurring: { interval: 'month' },
          unit_amount: 3900,
        },
        quantity: 1,
      }],
      subscription_data: { metadata: { user_id: userId } },
      metadata: { user_id: userId },
      success_url: `${FRONTEND_URL}?stripe_session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${FRONTEND_URL}?payment=canceled`,
    });
    res.json({ url: session.url });
  } catch (err) {
    console.error('Stripe checkout error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ── Stripe: verify session after redirect ──────────────────────
app.post('/api/stripe/verify-session', async (req, res) => {
  const { sessionId } = req.body;
  if (!sessionId) return res.status(400).json({ error: 'sessionId required' });
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription'],
    });
    const sub = session.subscription;
    if (!sub) return res.status(400).json({ error: 'No subscription on session' });
    res.json({
      customerId: session.customer,
      subscriptionId: sub.id,
      status: sub.status,
      currentPeriodEnd: new Date(sub.current_period_end * 1000).toISOString(),
      cancelAtPeriodEnd: sub.cancel_at_period_end,
    });
  } catch (err) {
    console.error('Stripe verify error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ── Stripe: get subscription details ──────────────────────────
app.post('/api/stripe/subscription', async (req, res) => {
  const { subscriptionId } = req.body;
  if (!subscriptionId) return res.status(400).json({ error: 'subscriptionId required' });
  try {
    const sub = await stripe.subscriptions.retrieve(subscriptionId);
    res.json({
      status: sub.status,
      currentPeriodEnd: new Date(sub.current_period_end * 1000).toISOString(),
      cancelAtPeriodEnd: sub.cancel_at_period_end,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Stripe: cancel subscription (at period end) ────────────────
app.post('/api/stripe/cancel', async (req, res) => {
  const { subscriptionId } = req.body;
  if (!subscriptionId) return res.status(400).json({ error: 'subscriptionId required' });
  try {
    const sub = await stripe.subscriptions.update(subscriptionId, { cancel_at_period_end: true });
    res.json({
      status: 'canceled',
      currentPeriodEnd: new Date(sub.current_period_end * 1000).toISOString(),
      cancelAtPeriodEnd: true,
    });
  } catch (err) {
    console.error('Stripe cancel error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ── Done For You contact form ──────────────────────────────────
// Update this to your WhatsApp number before going live
const WHATSAPP_NUMBER = '416-876-1890';
const BUSINESS_EMAIL  = 'seoailabs@gmail.com';

function buildDFYNotificationEmail(firstName, lastName, email, phone, businessName, businessType, businessUrl, message) {
  const year = new Date().getFullYear();
  const row = (label, val) => val
    ? `<tr>
        <td style="padding:10px 0;color:#6e6e73;font-size:0.9rem;width:140px;vertical-align:top">${label}</td>
        <td style="padding:10px 0;font-size:0.9rem;color:#1d1d1f;font-weight:500">${val}</td>
       </tr>`
    : '';
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"></head><body style="margin:0;padding:0;background:#f5f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <div style="max-width:600px;margin:32px auto;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
    <div style="background:linear-gradient(135deg,#0071e3,#0077ed);padding:32px;color:#fff">
      <div style="font-size:0.8rem;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;opacity:0.75;margin-bottom:8px">New Enquiry</div>
      <h1 style="margin:0;font-size:1.5rem;font-weight:800">Done For You Lead</h1>
      <p style="margin:6px 0 0;opacity:0.85;font-size:0.95rem">${firstName} ${lastName} &mdash; ${businessName} &mdash; ${phone}</p>
    </div>
    <div style="background:#fff;padding:32px">
      <table style="width:100%;border-collapse:collapse;border-top:1px solid #e5e5ea">
        ${row('Name', `${firstName} ${lastName}`)}
        ${row('Email', `<a href="mailto:${email}" style="color:#0071e3;text-decoration:none">${email}</a>`)}
        ${row('Phone', phone)}
        ${row('Business', businessName)}
        ${row('Type', businessType)}
        ${businessUrl ? row('Google URL', `<a href="${businessUrl}" style="color:#0071e3;text-decoration:none;word-break:break-all">${businessUrl}</a>`) : ''}
        ${message ? row('Message', message.replace(/\n/g, '<br>')) : ''}
      </table>
      <div style="margin-top:28px;padding:16px 20px;background:#f0f7ff;border-radius:10px;font-size:0.88rem;color:#0071e3">
        Reply directly to this email or call/WhatsApp ${phone} to follow up.
      </div>
    </div>
    <div style="background:#f5f5f7;padding:16px 32px;text-align:center;font-size:0.78rem;color:#aeaeb2">&copy; ${year} SEO AI Labs</div>
  </div>
</body></html>`;
}

function buildDFYConfirmationEmail(firstName) {
  const year = new Date().getFullYear();
  return emailShell(
    `We received your request — our team will be in touch within 24 hours`,
    'linear-gradient(135deg, #0071e3 0%, #0077ed 100%)',
    `<p style="font-size:1rem;color:#3a3a3c;line-height:1.75;margin:0 0 18px">Hi <strong>${firstName}</strong>,</p>
    <p style="font-size:1rem;color:#3a3a3c;line-height:1.75;margin:0 0 18px">
      Thank you for your interest in our <strong>Done For You</strong> plan. Our team will contact you within <strong>24 hours</strong> on this email or by phone.
    </p>
    <p style="font-size:1rem;color:#3a3a3c;line-height:1.75;margin:0 0 28px">
      For a faster response, WhatsApp us at <strong>${WHATSAPP_NUMBER}</strong>.
    </p>
    <p style="font-size:0.95rem;color:#6e6e73;margin:0;line-height:1.7">
      Talk soon,<br><strong>Team SEOAILabs</strong>
    </p>`,
    year
  );
}

app.post('/api/contact', async (req, res) => {
  const { firstName, lastName, email, phone, businessName, businessType, businessUrl, message } = req.body;
  if (!firstName || !email || !phone || !businessName) {
    return res.status(400).json({ error: 'First name, email, phone and business name are required.' });
  }
  try {
    // 1. Save to Supabase
    if (supabaseAdmin) {
      const { error: dbErr } = await supabaseAdmin.from('done_for_you_leads').insert({
        first_name:     firstName,
        last_name:      lastName  || null,
        email,
        phone,
        business_name:  businessName,
        business_type:  businessType || null,
        business_url:   businessUrl  || null,
        message:        message      || null,
      });
      if (dbErr) throw new Error(dbErr.message);
    }

    if (resend) {
      // 2. Notify business
      await resend.emails.send({
        from:    'SEO AI Labs <noreply@seoailabs.com>',
        to:      [BUSINESS_EMAIL],
        subject: `New Done For You enquiry from ${firstName} ${lastName || ''} — ${businessName} — ${phone}`,
        html:    buildDFYNotificationEmail(firstName, lastName, email, phone, businessName, businessType, businessUrl, message),
      });

      // 3. Confirm to lead
      await resend.emails.send({
        from:    'SEO AI Labs <noreply@seoailabs.com>',
        to:      [email],
        subject: `Hi ${firstName}, we received your request — SEO AI Labs`,
        html:    buildDFYConfirmationEmail(firstName),
      });
    }

    res.json({ ok: true });
  } catch (err) {
    console.error('/api/contact error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ── Stripe: resume subscription (undo cancel) ──────────────────
app.post('/api/stripe/resume', async (req, res) => {
  const { subscriptionId } = req.body;
  if (!subscriptionId) return res.status(400).json({ error: 'subscriptionId required' });
  try {
    const sub = await stripe.subscriptions.update(subscriptionId, { cancel_at_period_end: false });
    res.json({ status: sub.status, cancelAtPeriodEnd: false });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Always use Railway's injected PORT env var, fallback to 3001 for local dev
const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => console.log(`API server running on port ${PORT}`));
