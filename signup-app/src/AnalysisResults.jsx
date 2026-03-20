import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

// Stable key per step — derived from improvement text content + step index
function stepKey(improvementText, stepIdx) {
  const base = improvementText
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/gi, '')
    .toLowerCase()
    .slice(0, 44);
  return `${base}_s${stepIdx}`;
}

export default function AnalysisResults({ result, actionPlans, actionPlansLoading, userId }) {
  const { seoRating, positiveKeywords, negativeKeywords, missingKeywords, improvements } = result;

  const ratingColor =
    seoRating >= 8 ? '#30d158' : seoRating >= 5 ? '#ff9f0a' : '#ff3b30';

  // ── Checkbox persistence ────────────────────────────────────────
  const [checkedSteps, setCheckedSteps] = useState({});
  const [expandedPlans, setExpandedPlans] = useState({});

  useEffect(() => {
    if (!userId) return;
    async function loadProgress() {
      try {
        const { data } = await supabase
          .from('optimization_progress')
          .select('step_key, completed')
          .eq('user_id', userId);
        if (data) {
          const map = {};
          data.forEach((row) => { if (row.completed) map[row.step_key] = true; });
          setCheckedSteps(map);
        }
      } catch (_) {
        // table may not exist yet — start with empty state
      }
    }
    loadProgress();
  }, [userId]);

  async function toggleStep(key) {
    const newVal = !checkedSteps[key];
    setCheckedSteps((prev) => ({ ...prev, [key]: newVal }));
    if (!userId) return;
    try {
      await supabase.from('optimization_progress').upsert(
        { user_id: userId, step_key: key, completed: newVal, updated_at: new Date().toISOString() },
        { onConflict: 'user_id,step_key' },
      );
    } catch (_) {}
  }

  // ── Progress summary ────────────────────────────────────────────
  let totalSteps = 0;
  let completedCount = 0;
  if (actionPlans) {
    improvements.forEach((imp, impIdx) => {
      const plan = actionPlans.plans[impIdx];
      if (!plan) return;
      plan.steps.forEach((_, si) => {
        totalSteps++;
        if (checkedSteps[stepKey(imp, si)]) completedCount++;
      });
    });
  }

  return (
    <div className="analysis-results">
      <h2 className="analysis-title">SEO Analysis Results</h2>

      {/* Rating */}
      <div className="rating-card">
        <div className="rating-label">SEO Health Score</div>
        <div className="rating-score" style={{ color: ratingColor }}>
          {seoRating}<span className="rating-max">/10</span>
        </div>
        <div className="rating-bar-track">
          <div
            className="rating-bar-fill"
            style={{ width: `${seoRating * 10}%`, background: ratingColor }}
          />
        </div>
        <div className="rating-description">
          {seoRating >= 8
            ? 'Excellent — your Google Business profile is well-optimised.'
            : seoRating >= 5
            ? 'Fair — there are meaningful improvements you can make.'
            : 'Needs work — significant SEO opportunities are being missed.'}
        </div>
      </div>

      {/* Keyword sections */}
      <div className="keyword-grid">
        <KeywordSection
          title="Positive Keywords"
          subtitle="Already working for you"
          keywords={positiveKeywords}
          chipClass="chip-positive"
        />
        <KeywordSection
          title="Negative Themes"
          subtitle="Issues to address"
          keywords={negativeKeywords}
          chipClass="chip-negative"
        />
        <KeywordSection
          title="Missing Keywords"
          subtitle="Opportunities to target"
          keywords={missingKeywords}
          chipClass="chip-missing"
        />
      </div>

      {/* Improvements quick-list */}
      <div className="improvements-card">
        <h3 className="section-heading">Top 5 Prioritised Improvements</h3>
        <ol className="improvements-list">
          {improvements.map((item, i) => (
            <li key={i} className="improvement-item">
              <span className="improvement-num">{i + 1}</span>
              <span>{item}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* ── Optimization Plan ─────────────────────────────────── */}
      <div className="opt-plan-section">
        <div className="opt-plan-header">
          <h2 className="analysis-title" style={{ marginBottom: 0 }}>Your Optimisation Plan</h2>
          {actionPlans && totalSteps > 0 && (
            <div className={`opt-progress-pill${completedCount === totalSteps ? ' opt-progress-pill-done' : ''}`}>
              {completedCount === totalSteps
                ? '✓ All done!'
                : `${completedCount} / ${totalSteps} steps done`}
            </div>
          )}
        </div>

        {actionPlansLoading && (
          <div className="analysis-loading" style={{ marginTop: '16px', boxShadow: 'none', background: '#f5f5f7', borderRadius: '12px' }}>
            <div className="analysis-spinner" />
            <p>Claude is building your step-by-step action plan…</p>
          </div>
        )}

        {actionPlans && (
          <div className="opt-plan-list">
            {improvements.map((improvement, impIdx) => {
              const plan = actionPlans.plans[impIdx];
              const steps = plan?.steps || [];
              const doneCnt = steps.filter((_, si) => checkedSteps[stepKey(improvement, si)]).length;
              const allDone = steps.length > 0 && doneCnt === steps.length;

              return (
                <OptPlanItem
                  key={impIdx}
                  num={impIdx + 1}
                  improvement={improvement}
                  steps={steps}
                  isExpanded={!!expandedPlans[impIdx]}
                  onToggle={() => setExpandedPlans((p) => ({ ...p, [impIdx]: !p[impIdx] }))}
                  checkedSteps={checkedSteps}
                  onToggleStep={toggleStep}
                  doneCnt={doneCnt}
                  allDone={allDone}
                  improvementText={improvement}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function KeywordSection({ title, subtitle, keywords, chipClass }) {
  return (
    <div className="keyword-section">
      <h3 className="section-heading">{title}</h3>
      <p className="section-subtitle">{subtitle}</p>
      <div className="chip-list">
        {keywords.map((kw, i) => (
          <span key={i} className={`chip ${chipClass}`}>{kw}</span>
        ))}
      </div>
    </div>
  );
}

function OptPlanItem({
  num, improvement, steps, isExpanded, onToggle,
  checkedSteps, onToggleStep, doneCnt, allDone, improvementText,
}) {
  return (
    <div className={`opt-plan-item${allDone ? ' all-done' : ''}`}>
      <div className="opt-plan-item-header" onClick={onToggle}>
        <div className={`opt-plan-item-num${allDone ? ' opt-plan-item-num-done' : ''}`}>
          {allDone ? '✓' : num}
        </div>
        <div className="opt-plan-item-content">
          <div className="opt-plan-item-title">{improvement}</div>
          <div className="opt-plan-item-meta">
            {steps.length > 0 && (
              <span className={doneCnt === steps.length ? 'opt-done-badge' : 'opt-pending-badge'}>
                {doneCnt === steps.length
                  ? '✓ Complete'
                  : `${doneCnt}/${steps.length} steps done`}
              </span>
            )}
          </div>
        </div>
        <div className="opt-chevron">{isExpanded ? '▲' : '▼'}</div>
      </div>

      {isExpanded && steps.length > 0 && (
        <div className="opt-plan-item-body">
          {steps.map((step, si) => {
            const key = stepKey(improvementText, si);
            const done = !!checkedSteps[key];
            return (
              <label
                key={si}
                className={`action-step${done ? ' done' : ''}`}
                htmlFor={`step-${key}`}
              >
                <input
                  id={`step-${key}`}
                  type="checkbox"
                  className="action-step-checkbox"
                  checked={done}
                  onChange={() => onToggleStep(key)}
                />
                <span className="action-step-num">{si + 1}</span>
                <span className="action-step-text">{step}</span>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}
