import { useState, useEffect, useRef } from 'react';
import { supabase } from './supabaseClient';
import AnalysisResults from './AnalysisResults';
import ReplyToReviews from './ReplyToReviews';
import PastAnalyses from './PastAnalyses';
import ProgressCard from './ProgressCard';
import { API_BASE } from './api';

const CATEGORIES = [
  'Restaurant',
  'Cafe / Coffee Shop',
  'Bar / Pub',
  'Salon / Hair & Beauty',
  'Barbershop',
  'Gym / Fitness',
  'Dental',
  'Medical / Clinic',
  'Retail',
  'Hotel',
  'Spa / Wellness',
  'Auto Service',
  'Real Estate',
  'Law Firm',
  'Accounting / Finance',
  'Other',
];

const MAX_REVIEWS = 10;

export default function Dashboard({ profile, onProfileUpdate }) {
  const [activeTab, setActiveTab] = useState('seo');

  const [form, setForm] = useState({
    businessUrl: '',
    businessName: '',
    businessCategory: '',
    businessDescription: '',
  });
  const [reviews, setReviews] = useState(['']);
  const [touched, setTouched] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [analysisError, setAnalysisError] = useState('');
  const [actionPlans, setActionPlans] = useState(null);
  const [actionPlansLoading, setActionPlansLoading] = useState(false);

  // ── Past analyses history ──────────────────────────────────────
  const [analyses, setAnalyses] = useState([]);
  const [analysesLoading, setAnalysesLoading] = useState(false);
  const [selectedAnalysisId, setSelectedAnalysisId] = useState(null);

  // ── Progress stats ─────────────────────────────────────────────
  const [progressStats, setProgressStats] = useState({ completed: 0, total: 0 });

  const resultsRef = useRef(null);

  // Is the URL permanently locked (already saved to this account)?
  const isUrlLocked = !!profile?.business_url;

  // Pre-fill form whenever profile loads / changes
  useEffect(() => {
    if (profile) {
      setForm({
        businessUrl: profile.business_url || '',
        businessName: profile.business_name || '',
        businessCategory: profile.business_category || '',
        businessDescription: profile.business_description || '',
      });
    }
  }, [profile]);

  // Load analyses history + progress stats whenever profile is available
  useEffect(() => {
    if (profile?.id) {
      loadAnalyses(profile.id);
      loadProgressStats(profile.id);
    }
  }, [profile?.id]);

  async function loadAnalyses(userId) {
    setAnalysesLoading(true);
    try {
      const { data } = await supabase
        .from('seo_analyses')
        .select('id, business_name, seo_rating, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);
      if (data) setAnalyses(data);
    } catch (_) {
      // table may not exist yet — degrade gracefully
    }
    setAnalysesLoading(false);
  }

  async function loadProgressStats(userId) {
    try {
      const { data } = await supabase
        .from('optimization_progress')
        .select('completed')
        .eq('user_id', userId);
      if (data) {
        setProgressStats({
          completed: data.filter((r) => r.completed).length,
          total: data.length,
        });
      }
    } catch (_) {
      // table may not exist yet — degrade gracefully
    }
  }

  async function handleSelectAnalysis(id) {
    setSelectedAnalysisId(id);
    setAnalysisError('');
    try {
      const { data } = await supabase
        .from('seo_analyses')
        .select('*')
        .eq('id', id)
        .single();
      if (data) {
        setAnalysisResult({
          seoRating: data.seo_rating,
          positiveKeywords: data.positive_keywords,
          negativeKeywords: data.negative_keywords,
          missingKeywords: data.missing_keywords,
          improvements: data.improvements,
        });
        setActionPlans(data.action_plans || null);
        setActionPlansLoading(false);
        // Scroll to results after state settles
        setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
      }
    } catch (_) {}
  }

  // ── Field helpers ──────────────────────────────────────────────
  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setSaveError('');
    setSaveSuccess(false);
  }

  function handleBlur(e) {
    setTouched((prev) => ({ ...prev, [e.target.name]: true }));
  }

  // ── Review helpers ─────────────────────────────────────────────
  function handleReviewChange(index, value) {
    setReviews((prev) => prev.map((r, i) => (i === index ? value : r)));
  }

  function addReview() {
    if (reviews.length < MAX_REVIEWS) setReviews((prev) => [...prev, '']);
  }

  function removeReview(index) {
    setReviews((prev) => prev.filter((_, i) => i !== index));
  }

  // ── Validation ────────────────────────────────────────────────
  const errors = {
    businessUrl: !form.businessUrl ? 'Google Business URL is required' : null,
    businessName: !form.businessName ? 'Business name is required' : null,
    businessCategory: !form.businessCategory ? 'Please select a category' : null,
  };
  const formValid = !errors.businessUrl && !errors.businessName && !errors.businessCategory;

  // ── Submit ────────────────────────────────────────────────────
  async function handleSubmit(e) {
    e.preventDefault();
    setTouched({ businessUrl: true, businessName: true, businessCategory: true });
    if (!formValid) return;

    // Clear previous history selection when running a new analysis
    setSelectedAnalysisId(null);

    setSaving(true);
    setSaveError('');
    setSaveSuccess(false);

    const { data: { user } } = await supabase.auth.getUser();

    const updates = {
      business_name: form.businessName,
      business_category: form.businessCategory,
      business_description: form.businessDescription,
      // Only set the URL on the very first save
      ...(!isUrlLocked && { business_url: form.businessUrl }),
    };

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id);

    if (error) {
      setSaveError(error.message);
      setSaving(false);
      return;
    }

    // Reflect the save in parent so the lock kicks in immediately
    onProfileUpdate((prev) => ({ ...prev, ...updates }));
    setSaveSuccess(true);
    setSaving(false);

    // Run the Claude SEO analysis
    setAnalyzing(true);
    setAnalysisError('');
    setAnalysisResult(null);
    setActionPlans(null);
    try {
      const res = await fetch(`${API_BASE}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessUrl: form.businessUrl,
          businessName: form.businessName,
          businessCategory: form.businessCategory,
          businessDescription: form.businessDescription,
          reviews,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Analysis failed');
      }
      const data = await res.json();
      setAnalysisResult(data);

      // Chain: generate step-by-step action plan for all 5 improvements
      setActionPlansLoading(true);
      let planData = null;
      try {
        const planRes = await fetch(`${API_BASE}/api/action-plan`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            improvements: data.improvements,
            businessName: form.businessName,
            businessCategory: form.businessCategory,
          }),
        });
        if (planRes.ok) {
          planData = await planRes.json();
          setActionPlans(planData);
        }
      } catch (_) {
        // Action plan failure is non-fatal — SEO results still show
      } finally {
        setActionPlansLoading(false);
      }

      // Save analysis to Supabase history
      try {
        await supabase.from('seo_analyses').insert({
          user_id: user.id,
          business_name: form.businessName,
          business_category: form.businessCategory,
          business_url: form.businessUrl,
          seo_rating: data.seoRating,
          positive_keywords: data.positiveKeywords,
          negative_keywords: data.negativeKeywords,
          missing_keywords: data.missingKeywords,
          improvements: data.improvements,
          action_plans: planData,
        });
        loadAnalyses(user.id);
        loadProgressStats(user.id);
      } catch (_) {
        // history save failure is non-fatal
      }
    } catch (err) {
      setAnalysisError(err.message || 'Something went wrong during analysis.');
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
  }

  // ── Render ────────────────────────────────────────────────────
  return (
    <div className="dashboard-layout">
      {/* Top nav */}
      <header className="dash-header">
        <div className="dash-header-inner">
          <div className="dash-brand">
            <div className="dash-avatar">
              {profile?.first_name?.[0]?.toUpperCase() ?? '?'}
            </div>
            <span className="dash-name">
              Welcome, <strong>{profile?.first_name ?? '…'}</strong>
            </span>
          </div>
          <button className="btn btn-ghost" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </header>

      {/* Tab navigation */}
      <nav className="dash-tabs">
        <div className="dash-tabs-inner">
          <button
            className={`dash-tab${activeTab === 'seo' ? ' active' : ''}`}
            onClick={() => setActiveTab('seo')}
          >
            SEO Analysis
          </button>
          <button
            className={`dash-tab${activeTab === 'replies' ? ' active' : ''}`}
            onClick={() => setActiveTab('replies')}
          >
            Reply to Reviews
          </button>
        </div>
      </nav>

      {/* Main content */}
      <main className="dash-main">
        {activeTab === 'seo' ? (
          <>
            <ProgressCard
              latestScore={analyses[0]?.seo_rating ?? null}
              analysesCount={analyses.length}
              stepsCompleted={progressStats.completed}
              stepsTotal={progressStats.total}
            />

            <div className="dash-form-card">
              <h2 className="dash-form-title">Your Business Profile</h2>
              <p className="dash-form-subtitle">
                Fill in your business details and paste in recent reviews to get your SEO analysis.
              </p>

              <form onSubmit={handleSubmit} noValidate>

                {/* Google Business URL */}
                <div className="field">
                  <label htmlFor="businessUrl">Google Business Page URL</label>
                  {isUrlLocked ? (
                    <>
                      <div className="locked-url">
                        <span className="lock-icon">🔒</span>
                        <span className="locked-url-text">{form.businessUrl}</span>
                      </div>
                      <p className="lock-note">
                        Each account is linked to one Google Business page. To manage another location please create a separate account.
                      </p>
                    </>
                  ) : (
                    <>
                      <input
                        id="businessUrl"
                        name="businessUrl"
                        type="url"
                        placeholder="https://maps.google.com/?cid=..."
                        value={form.businessUrl}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className={touched.businessUrl && errors.businessUrl ? 'input-error' : ''}
                      />
                      {touched.businessUrl && errors.businessUrl && (
                        <span className="error">{errors.businessUrl}</span>
                      )}
                      <p className="field-hint">Search your business on Google Maps, click your listing, and copy the URL from your browser address bar.</p>
                    </>
                  )}
                </div>

                {/* Business name + category */}
                <div className="row">
                  <div className="field">
                    <label htmlFor="businessName">Business Name</label>
                    <input
                      id="businessName"
                      name="businessName"
                      type="text"
                      placeholder="Acme Coffee Co."
                      value={form.businessName}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={touched.businessName && errors.businessName ? 'input-error' : ''}
                    />
                    {touched.businessName && errors.businessName && (
                      <span className="error">{errors.businessName}</span>
                    )}
                  </div>

                  <div className="field">
                    <label htmlFor="businessCategory">Category</label>
                    <select
                      id="businessCategory"
                      name="businessCategory"
                      value={form.businessCategory}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={`select-input${touched.businessCategory && errors.businessCategory ? ' input-error' : ''}`}
                    >
                      <option value="">Select a category…</option>
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                    {touched.businessCategory && errors.businessCategory && (
                      <span className="error">{errors.businessCategory}</span>
                    )}
                  </div>
                </div>

                {/* Description */}
                <div className="field">
                  <label htmlFor="businessDescription">
                    Short Business Description
                    <span className="field-hint"> (optional)</span>
                  </label>
                  <textarea
                    id="businessDescription"
                    name="businessDescription"
                    rows={3}
                    placeholder="Briefly describe your business, services, and what makes you unique…"
                    value={form.businessDescription}
                    onChange={handleChange}
                    className="textarea-input"
                  />
                </div>

                {/* Reviews */}
                <div className="reviews-section">
                  <div className="reviews-header">
                    <label className="reviews-label">Recent Google Reviews</label>
                    <span className="reviews-count">{reviews.length} / {MAX_REVIEWS}</span>
                  </div>
                  <p className="field-hint reviews-hint">
                    Paste each review text as your customers wrote it. The more you add, the better the analysis.
                  </p>

                  <div className="reviews-list">
                    {reviews.map((review, i) => (
                      <div key={i} className="review-item">
                        <div className="review-item-header">
                          <span className="review-label">Review {i + 1}</span>
                          {reviews.length > 1 && (
                            <button
                              type="button"
                              className="btn-remove"
                              onClick={() => removeReview(i)}
                              aria-label={`Remove review ${i + 1}`}
                            >
                              ✕ Remove
                            </button>
                          )}
                        </div>
                        <textarea
                          rows={3}
                          placeholder={`Paste review text here…`}
                          value={review}
                          onChange={(e) => handleReviewChange(i, e.target.value)}
                          className="textarea-input"
                        />
                      </div>
                    ))}
                  </div>

                  {reviews.length < MAX_REVIEWS && (
                    <button type="button" className="btn-add-review" onClick={addReview}>
                      + Add another review
                    </button>
                  )}
                </div>

                {/* Status messages */}
                {saveError && <p className="error server-error">{saveError}</p>}
                {saveSuccess && (
                  <p className="save-success">✓ Business info saved successfully.</p>
                )}

                <button type="submit" className="btn btn-full btn-analyze" disabled={saving || analyzing}>
                  {saving ? 'Saving…' : analyzing ? 'Analyzing…' : 'Analyze My SEO'}
                </button>
              </form>
            </div>

            {/* Past analyses history */}
            <PastAnalyses
              analyses={analyses}
              loading={analysesLoading}
              selectedId={selectedAnalysisId}
              onSelect={handleSelectAnalysis}
            />

            {analyzing && (
              <div className="analysis-loading">
                <div className="analysis-spinner" />
                <p>Claude is analyzing your SEO&hellip;</p>
              </div>
            )}

            {analysisError && (
              <div className="analysis-error-card">
                <p>⚠ {analysisError}</p>
              </div>
            )}

            {analysisResult && (
              <div ref={resultsRef}>
                <AnalysisResults
                  result={analysisResult}
                  actionPlans={actionPlans}
                  actionPlansLoading={actionPlansLoading}
                  userId={profile?.id}
                />
              </div>
            )}
          </>
        ) : (
          <ReplyToReviews profile={profile} />
        )}
      </main>
    </div>
  );
}
