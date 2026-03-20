export default function ProgressCard({ latestScore, analysesCount, stepsCompleted, stepsTotal }) {
  const scoreColor =
    latestScore == null ? '#aeaeb2'
    : latestScore >= 8 ? '#30d158'
    : latestScore >= 5 ? '#ff9f0a'
    : '#ff3b30';

  const scoreLabel =
    latestScore == null ? 'No analyses yet'
    : latestScore >= 8 ? 'Excellent'
    : latestScore >= 5 ? 'Fair'
    : 'Needs work';

  const pct = stepsTotal > 0 ? Math.round((stepsCompleted / stepsTotal) * 100) : 0;

  return (
    <div className="progress-card">
      {/* Latest SEO Score */}
      <div className="progress-stat">
        <div className="progress-stat-label">Latest SEO Score</div>
        {latestScore != null ? (
          <div className="progress-score-badge" style={{ color: scoreColor, borderColor: scoreColor }}>
            <span className="progress-score-num">{latestScore}</span>
            <span className="progress-score-denom">/10</span>
          </div>
        ) : (
          <div className="progress-score-empty">—</div>
        )}
        <div className="progress-stat-sub" style={{ color: scoreColor }}>{scoreLabel}</div>
      </div>

      <div className="progress-divider" />

      {/* Analyses run */}
      <div className="progress-stat">
        <div className="progress-stat-label">Analyses Run</div>
        <div className="progress-big-num">{analysesCount}</div>
        <div className="progress-stat-sub" style={{ color: '#6e6e73' }}>
          {analysesCount === 1 ? 'analysis' : 'analyses'} total
        </div>
      </div>

      <div className="progress-divider" />

      {/* Optimisation steps */}
      <div className="progress-stat progress-stat-wide">
        <div className="progress-stat-label">Optimisation Progress</div>
        <div className="progress-steps-row">
          <span className="progress-big-num">{stepsCompleted}</span>
          {stepsTotal > 0 && (
            <span className="progress-steps-denom"> / {stepsTotal} steps done</span>
          )}
          {stepsTotal === 0 && (
            <span className="progress-steps-denom"> steps completed</span>
          )}
        </div>
        <div className="progress-bar-track">
          <div
            className="progress-bar-fill"
            style={{ width: `${pct}%`, background: pct === 100 ? '#30d158' : '#0071e3' }}
          />
        </div>
        {stepsTotal > 0 && (
          <div className="progress-stat-sub" style={{ color: '#6e6e73' }}>
            {pct}% complete
            {pct === 100 && <span style={{ color: '#30d158', marginLeft: 6 }}>✓ All done!</span>}
          </div>
        )}
      </div>
    </div>
  );
}
