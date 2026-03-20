export default function PastAnalyses({ analyses, loading, selectedId, onSelect }) {
  function ratingColor(r) {
    return r >= 8 ? '#30d158' : r >= 5 ? '#ff9f0a' : '#ff3b30';
  }

  function formatDate(iso) {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    });
  }

  return (
    <div className="past-analyses-card">
      <h3 className="past-analyses-title">Past Analyses</h3>

      {loading ? (
        <div className="past-analyses-empty">
          <div className="analysis-spinner" style={{ width: 20, height: 20, margin: '0 auto 8px' }} />
          <p>Loading history…</p>
        </div>
      ) : analyses.length === 0 ? (
        <p className="past-analyses-empty">
          No analyses yet — run your first one above.
        </p>
      ) : (
        <div className="past-analyses-list">
          {analyses.map((a) => (
            <button
              key={a.id}
              className={`past-analysis-item${selectedId === a.id ? ' selected' : ''}`}
              onClick={() => onSelect(a.id)}
            >
              <div className="pa-rating" style={{ color: ratingColor(a.seo_rating) }}>
                {a.seo_rating}
                <span className="pa-rating-max">/10</span>
              </div>
              <div className="pa-info">
                <span className="pa-biz-name">{a.business_name}</span>
                <span className="pa-date">{formatDate(a.created_at)}</span>
              </div>
              <div className="pa-arrow">›</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
