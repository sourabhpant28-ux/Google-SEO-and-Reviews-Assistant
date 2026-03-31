import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { API_BASE } from './api';

export default function ReplyToReviews({ profile }) {
  const [reviewText, setReviewText] = useState('');
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    loadHistory();
  }, []);

  async function loadHistory() {
    setHistoryLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_my_replies');
      if (!error && data) setHistory(data);
    } catch (_) {
      // table may not exist yet — show empty history gracefully
    }
    setHistoryLoading(false);
  }

  async function handleGenerate(e) {
    e.preventDefault();
    if (!reviewText.trim()) return;

    setGenerating(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch(`${API_BASE}/api/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewText: reviewText.trim(),
          businessName: profile?.business_name || '',
          businessCategory: profile?.business_category || '',
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Reply generation failed');
      }

      const data = await res.json();
      setResult(data);

      // Save to Supabase history
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('review_replies').insert({
        user_id: user.id,
        review_text: reviewText.trim(),
        sentiment: data.sentiment,
        formal_reply: data.formalReply,
        friendly_reply: data.friendlyReply,
        brief_reply: data.briefReply,
        business_name: profile?.business_name || '',
      });

      loadHistory();
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setGenerating(false);
    }
  }

  async function copyToClipboard(text, id) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (_) {
      // fallback for older browsers
      const el = document.createElement('textarea');
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  }

  return (
    <div className="reply-page">
      {/* Input card */}
      <div className="dash-form-card">
        <h2 className="dash-form-title">Reply to a Review</h2>
        <p className="dash-form-subtitle">
          Paste in a Google review and Claude will generate 3 personalised reply options you can copy straight to Google.
        </p>

        <form onSubmit={handleGenerate} noValidate>
          <div className="field">
            <label htmlFor="reviewText">Paste Review Text</label>
            <textarea
              id="reviewText"
              rows={5}
              placeholder={`e.g. "Great food and friendly staff! The pasta was absolutely amazing…"`}
              value={reviewText}
              onChange={(e) => { setReviewText(e.target.value); setError(''); }}
              className="textarea-input"
            />
          </div>

          {error && <p className="error server-error" style={{ marginTop: '8px' }}>{error}</p>}

          <button
            type="submit"
            className="btn btn-full btn-analyze"
            disabled={generating || !reviewText.trim()}
          >
            {generating ? 'Generating replies…' : 'Generate Reply Options'}
          </button>
        </form>
      </div>

      {/* Loading */}
      {generating && (
        <div className="analysis-loading">
          <div className="analysis-spinner" />
          <p>Claude is crafting personalised replies…</p>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="reply-results">
          <div className="reply-results-header">
            <h3 className="reply-results-title">Generated Replies</h3>
            <span className={`sentiment-badge sentiment-${result.sentiment}`}>
              {result.sentiment.charAt(0).toUpperCase() + result.sentiment.slice(1)} Review
            </span>
          </div>

          <div className="reply-cards">
            <ReplyCard
              label="Formal"
              description="Professional and polished"
              text={result.formalReply}
              id="formal"
              copiedId={copiedId}
              onCopy={copyToClipboard}
            />
            <ReplyCard
              label="Friendly"
              description="Warm and conversational"
              text={result.friendlyReply}
              id="friendly"
              copiedId={copiedId}
              onCopy={copyToClipboard}
            />
            <ReplyCard
              label="Brief"
              description="Short and to the point"
              text={result.briefReply}
              id="brief"
              copiedId={copiedId}
              onCopy={copyToClipboard}
            />
          </div>
        </div>
      )}

      {/* History */}
      <div className="reply-history">
        <h3 className="reply-history-title">Reply History</h3>
        {historyLoading ? (
          <div className="analysis-loading" style={{ marginTop: 0, boxShadow: 'none', padding: '16px 0' }}>
            <div className="analysis-spinner" />
            <p>Loading history…</p>
          </div>
        ) : history.length === 0 ? (
          <p className="reply-history-empty">
            No replies generated yet. Paste a review above to get started.
          </p>
        ) : (
          <div className="history-list">
            {history.map((item) => (
              <HistoryItem
                key={item.id}
                item={item}
                copiedId={copiedId}
                onCopy={copyToClipboard}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ReplyCard({ label, description, text, id, copiedId, onCopy }) {
  return (
    <div className="reply-card">
      <div className="reply-card-header">
        <div>
          <span className="reply-card-label">{label}</span>
          <span className="reply-card-desc">{description}</span>
        </div>
        <button
          type="button"
          className={`btn-copy${copiedId === id ? ' btn-copy-done' : ''}`}
          onClick={() => onCopy(text, id)}
        >
          {copiedId === id ? '✓ Copied' : 'Copy'}
        </button>
      </div>
      <p className="reply-card-text">{text}</p>
    </div>
  );
}

function HistoryItem({ item, copiedId, onCopy }) {
  const [expanded, setExpanded] = useState(false);

  const date = new Date(item.created_at).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });

  const replies = [
    { label: 'Formal', text: item.formal_reply, id: `${item.id}-formal` },
    { label: 'Friendly', text: item.friendly_reply, id: `${item.id}-friendly` },
    { label: 'Brief', text: item.brief_reply, id: `${item.id}-brief` },
  ];

  return (
    <div className="history-item">
      <div className="history-item-header" onClick={() => setExpanded((p) => !p)}>
        <div className="history-item-left">
          <span className={`sentiment-badge sentiment-${item.sentiment} sentiment-sm`}>
            {item.sentiment}
          </span>
          <span className="history-review-preview">
            {item.review_text.length > 80
              ? item.review_text.slice(0, 80) + '…'
              : item.review_text}
          </span>
        </div>
        <div className="history-item-right">
          <span className="history-date">{date}</span>
          <span className="history-chevron">{expanded ? '▲' : '▼'}</span>
        </div>
      </div>

      {expanded && (
        <div className="history-item-body">
          <p className="history-full-review">"{item.review_text}"</p>
          <div className="history-replies">
            {replies.map(({ label, text, id }) => (
              <div key={id} className="history-reply-row">
                <div className="history-reply-label">{label}</div>
                <p className="history-reply-text">{text}</p>
                <button
                  type="button"
                  className={`btn-copy btn-copy-sm${copiedId === id ? ' btn-copy-done' : ''}`}
                  onClick={() => onCopy(text, id)}
                >
                  {copiedId === id ? '✓' : 'Copy'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
