import express from 'express';
import cors from 'cors';
import Anthropic from '@anthropic-ai/sdk';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

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

// Stripe initialised lazily so missing key only errors on actual Stripe calls
let stripe = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
}

// ── Email builder ──────────────────────────────────────────────
function buildReportEmail(firstName, businessUrl, businessCategory, r) {
  const scoreColor = r.seoRating >= 8 ? '#30d158' : r.seoRating >= 5 ? '#ff9f0a' : '#ff3b30';
  const pct = r.seoRating * 10;

  const kw = (arr) => arr.map((k) =>
    `<span style="display:inline-block;background:#e8f0fe;color:#0071e3;font-size:13px;font-weight:600;padding:4px 12px;border-radius:99px;margin:3px 4px 3px 0">${k}</span>`
  ).join('');

  const actionPlans = (r.actionPlans || []).map((plan, i) => `
    <tr><td style="padding:20px 0 8px">
      <strong style="font-size:15px;color:#1d1d1f">${i + 1}. ${r.improvements[i] || ''}</strong>
    </td></tr>
    ${(plan.steps || []).map((step, j) => `
    <tr><td style="padding:4px 0 4px 16px;font-size:14px;color:#3a3a3c;line-height:1.6">
      <span style="color:#0071e3;font-weight:700">${j + 1}.</span> ${step}
    </td></tr>`).join('')}
  `).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Your Google Business SEO Report</title></head>
<body style="margin:0;padding:0;background:#f5f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f7;padding:40px 20px">
<tr><td align="center">
<table width="100%" style="max-width:620px;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 32px rgba(0,0,0,0.08)">

  <!-- Header -->
  <tr><td style="background:linear-gradient(135deg,#0071e3,#34aadc);padding:36px 40px;text-align:center">
    <div style="font-size:28px;margin-bottom:6px">⚡</div>
    <div style="font-size:22px;font-weight:800;color:#fff;letter-spacing:-0.3px">SEO AI Labs</div>
    <p style="margin:12px 0 0;color:rgba(255,255,255,0.85);font-size:15px">Your Free Google Business SEO Report</p>
  </td></tr>

  <!-- Greeting -->
  <tr><td style="padding:36px 40px 0">
    <p style="font-size:17px;color:#1d1d1f;margin:0 0 8px">Hi ${firstName || 'there'} 👋</p>
    <p style="font-size:14px;color:#6e6e73;line-height:1.6;margin:0">
      Here's your personalised SEO report for <strong style="color:#0071e3">${businessUrl}</strong>.<br>
      Category: <strong>${businessCategory || 'General Business'}</strong>
    </p>
  </td></tr>

  <!-- Score -->
  <tr><td style="padding:28px 40px 0">
    <table width="100%" style="background:#f5f5f7;border-radius:16px;padding:24px" cellpadding="0" cellspacing="0">
    <tr>
      <td width="90" style="text-align:center;vertical-align:middle">
        <div style="width:80px;height:80px;border-radius:50%;background:conic-gradient(${scoreColor} 0% ${pct}%,#e5e5ea ${pct}% 100%);display:inline-flex;align-items:center;justify-content:center;position:relative">
          <div style="position:absolute;inset:10px;border-radius:50%;background:#f5f5f7;display:flex;align-items:center;justify-content:center;flex-direction:column">
            <span style="font-size:22px;font-weight:800;color:${scoreColor};line-height:1">${r.seoRating}</span>
            <span style="font-size:10px;color:#aeaeb2">/10</span>
          </div>
        </div>
      </td>
      <td style="padding-left:20px;vertical-align:middle">
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#aeaeb2;margin-bottom:6px">SEO Health Score</div>
        <div style="height:8px;background:#e5e5ea;border-radius:99px;overflow:hidden;margin-bottom:8px">
          <div style="height:100%;width:${pct}%;background:${scoreColor};border-radius:99px"></div>
        </div>
        <div style="font-size:14px;font-weight:600;color:#1d1d1f">${r.seoExplanation || ''}</div>
      </td>
    </tr>
    </table>
  </td></tr>

  <!-- Positive Keywords -->
  <tr><td style="padding:28px 40px 0">
    <div style="font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#30d158;margin-bottom:10px">✅ Keywords Already Working For You</div>
    <div>${kw(r.positiveKeywords || [])}</div>
  </td></tr>

  <!-- Negative Keywords -->
  <tr><td style="padding:20px 40px 0">
    <div style="font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#ff9f0a;margin-bottom:10px">⚠️ Negative Themes & Complaints</div>
    <div>${kw(r.negativeKeywords || [])}</div>
  </td></tr>

  <!-- Missing Keywords -->
  <tr><td style="padding:20px 40px 0">
    <div style="font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#ff3b30;margin-bottom:10px">🎯 Missing Keywords You Should Target</div>
    <div>${kw(r.missingKeywords || [])}</div>
  </td></tr>

  <!-- Action Plan -->
  <tr><td style="padding:28px 40px 0">
    <div style="font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#0071e3;margin-bottom:4px">📋 Step-by-Step Fix Guide</div>
    <table width="100%" cellpadding="0" cellspacing="0">
      ${actionPlans}
    </table>
  </td></tr>

  <!-- CTA -->
  <tr><td style="padding:36px 40px">
    <table width="100%" style="background:linear-gradient(135deg,#f0f7ff,#e8f0fe);border-radius:16px;padding:28px" cellpadding="0" cellspacing="0">
    <tr><td align="center">
      <div style="font-size:18px;font-weight:700;color:#1d1d1f;margin-bottom:8px">Want monthly tracking + unlimited analyses?</div>
      <p style="font-size:14px;color:#6e6e73;margin:0 0 20px;line-height:1.6">Start your 7-day free trial — no credit card required.</p>
      <a href="https://seoailabs.com" style="display:inline-block;background:#0071e3;color:#fff;font-size:15px;font-weight:700;padding:14px 32px;border-radius:980px;text-decoration:none">
        Start Free Trial →
      </a>
    </td></tr>
    </table>
  </td></tr>

  <!-- Footer -->
  <tr><td style="padding:20px 40px;border-top:1px solid #e5e5ea;text-align:center">
    <p style="font-size:12px;color:#aeaeb2;margin:0;line-height:1.6">
      © ${new Date().getFullYear()} SEO AI Labs · <a href="https://seoailabs.com" style="color:#0071e3">seoailabs.com</a><br>
      You received this because you requested a free SEO report.
    </p>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;
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

Each action plan step must name the specific page, button, or field in Google Business Profile with exact click-by-click instructions a non-technical business owner can follow immediately.`;

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

    // 3. Send email via Resend
    if (process.env.RESEND_API_KEY) {
      const html = buildReportEmail(firstName, businessUrl, businessCategory, result);
      const emailRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: 'SEO AI Labs <noreply@seoailabs.com>',
          to: [email.trim().toLowerCase()],
          subject: `Your Free Google Business SEO Report — Score: ${result.seoRating}/10`,
          html,
        }),
      });
      if (!emailRes.ok) {
        const errText = await emailRes.text();
        console.error('Resend error:', errText);
      }
    } else {
      console.warn('RESEND_API_KEY not set — email not sent');
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
- topIssues: exactly 3 most critical problems found on this page that are hurting their Google ranking
- positiveKeywords: exactly 3 keywords or phrases already working well for this business`;

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
