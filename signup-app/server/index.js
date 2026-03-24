import express from 'express';
import cors from 'cors';
import Anthropic from '@anthropic-ai/sdk';
import Stripe from 'stripe';

const app = express();
app.use(cors());
app.use(express.json());

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
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

// ── Stripe: create checkout session ───────────────────────────
app.post('/api/stripe/checkout', async (req, res) => {
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

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`API server running on port ${PORT}`));
