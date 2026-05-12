import { useState, useRef, useMemo, useEffect } from 'react';
import { API_BASE } from './api';
import './AdminLeads.css';

const CATEGORIES = [
  'Restaurant', 'Salon', 'Gym', 'Dental', 'Retail', 'Hotel',
  'Realtor', 'Mortgage Agent', 'Insurance Agent',
  'Real Estate Brokerage', 'Mortgage Brokerage', 'Insurance Brokerage',
];

function getLowReviewsThreshold(category) {
  if (category === 'Realtor' || category === 'Real Estate Brokerage') return 20;
  if (
    category === 'Mortgage Agent' || category === 'Mortgage Brokerage' ||
    category === 'Insurance Agent' || category === 'Insurance Brokerage'
  ) return 15;
  return 50;
}

function getUrgencyScore(p, category) {
  let score = 0;
  if (!p.website) score += 4;
  if (p.totalReviews < 10) score += 3;
  else if (p.totalReviews < getLowReviewsThreshold(category)) score += 2;
  if (p.rating != null && p.rating < 4.2) score += 1;
  return score;
}

function isStruggling(p, category) {
  return !p.website || p.totalReviews < getLowReviewsThreshold(category) || (p.rating != null && p.rating < 4.2);
}

function getBadges(p, category) {
  const threshold = getLowReviewsThreshold(category);
  const badges = [];
  if (!p.website) badges.push({ label: 'No Website', cls: 'al-badge-red' });
  if (p.totalReviews < 10) {
    badges.push({ label: 'New Business', cls: 'al-badge-blue' });
  } else if (p.totalReviews < threshold) {
    badges.push({ label: 'Low Reviews', cls: 'al-badge-orange' });
  }
  if (p.rating != null && p.rating < 4.2) badges.push({ label: 'Low Rating', cls: 'al-badge-yellow' });
  return badges;
}

// Stable key for a place — used for selection and contacted tracking
function bizKey(p) { return `${p.name}|||${p.address}`; }

// Pick the email template based on the most urgent badge
function getTemplate(primaryBadge) {
  if (primaryBadge === 'No Website') {
    return {
      subject: 'Your Google Business page is missing customers',
      body: `Hi [Business Name],

I noticed your Google Business profile doesn't have a website linked. This is costing you customers every day.

I built a free AI tool that analyses your profile and tells you exactly what to fix in 60 seconds.

Try it free at seoailabs.com`,
    };
  }
  if (primaryBadge === 'New Business' || primaryBadge === 'Low Reviews') {
    return {
      subject: 'Quick way to get more Google reviews for [Business Name]',
      body: `Hi [Business Name],

I noticed your Google Business profile has fewer reviews than your competitors. Our free AI tool shows you exactly how to fix this in 60 seconds.

Try it free at seoailabs.com`,
    };
  }
  if (primaryBadge === 'Low Rating') {
    return {
      subject: 'How to improve your Google rating fast',
      body: `Hi [Business Name],

I noticed [Business Name] has a [Rating] star rating on Google. Our free AI tool shows you exactly how to improve it.

Try it free at seoailabs.com`,
    };
  }
  return { subject: '', body: '' };
}

function exportCSV(places, query, category) {
  const headers = ['Business Name', 'Rating', 'Total Reviews', 'Address', 'Website', 'Phone', 'Issues'];
  const rows = places.map((p) => {
    const issues = getBadges(p, category).map((b) => b.label).join(' | ');
    return [
      `"${p.name.replace(/"/g, '""')}"`,
      p.rating ?? '',
      p.totalReviews,
      `"${p.address.replace(/"/g, '""')}"`,
      p.website,
      p.phone,
      `"${issues}"`,
    ];
  });
  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `leads-${query.replace(/\s+/g, '-').toLowerCase()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AdminLeads({ onGoBack }) {
  const [city, setCity] = useState('');
  const [category, setCategory] = useState('Restaurant');
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [results, setResults] = useState(null);
  const [nextPageToken, setNextPageToken] = useState(null);
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const [filterMode, setFilterMode] = useState('struggling');

  // Selection state
  const [selectedKeys, setSelectedKeys] = useState(new Set());

  // Outreach modal state
  const [showModal, setShowModal] = useState(false);
  const [modalSubject, setModalSubject] = useState('');
  const [modalBody, setModalBody] = useState('');
  const [leadEmails, setLeadEmails] = useState({});
  const [sending, setSending] = useState(false);
  const [sendResults, setSendResults] = useState(null);

  // Contacted state — persisted in Supabase
  const [contactedKeys, setContactedKeys] = useState(new Set());

  const cache = useRef(new Map());

  // Load outreach log on mount
  useEffect(() => {
    fetch(`${API_BASE}/api/admin/outreach-log`)
      .then((r) => r.json())
      .then((data) => {
        const keys = new Set((data.log || []).map((l) => `${l.business_name}|||${l.business_address}`));
        setContactedKeys(keys);
      })
      .catch(() => {});
  }, []);

  // Filtered + sorted view
  const displayedResults = useMemo(() => {
    if (!results) return null;
    const list = filterMode === 'struggling'
      ? results.filter((p) => isStruggling(p, category))
      : [...results];
    list.sort((a, b) => getUrgencyScore(b, category) - getUrgencyScore(a, category));
    return list;
  }, [results, filterMode, category]);

  const strugglingCount = useMemo(
    () => (results ? results.filter((p) => isStruggling(p, category)).length : 0),
    [results, category],
  );

  // Selection helpers
  const allDisplayedSelected = !!displayedResults?.length &&
    displayedResults.every((p) => selectedKeys.has(bizKey(p)));
  const someDisplayedSelected = !!displayedResults?.some((p) => selectedKeys.has(bizKey(p)));
  const selectedList = displayedResults?.filter((p) => selectedKeys.has(bizKey(p))) || [];

  function handleToggleSelect(p) {
    const key = bizKey(p);
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  function handleSelectAll() {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (allDisplayedSelected) {
        displayedResults.forEach((p) => next.delete(bizKey(p)));
      } else {
        displayedResults.forEach((p) => next.add(bizKey(p)));
      }
      return next;
    });
  }

  function handleClearSelection() {
    setSelectedKeys(new Set());
  }

  // Outreach modal
  function handleOpenModal() {
    const first = selectedList[0];
    const primaryBadge = first ? (getBadges(first, category)[0]?.label || '') : '';
    const tpl = getTemplate(primaryBadge);
    setModalSubject(tpl.subject);
    setModalBody(tpl.body);
    setSendResults(null);
    setShowModal(true);
  }

  function handleCloseModal() {
    if (sending) return;
    setShowModal(false);
    setSendResults(null);
  }

  async function handleSend() {
    setSending(true);
    const leadsToSend = selectedList
      .filter((p) => leadEmails[bizKey(p)]?.trim())
      .map((p) => ({
        name: p.name,
        email: leadEmails[bizKey(p)].trim(),
        address: p.address,
        city,
        category,
        rating: p.rating,
      }));

    try {
      const res = await fetch(`${API_BASE}/api/admin/send-outreach`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leads: leadsToSend, subjectTemplate: modalSubject, bodyTemplate: modalBody }),
      });
      const data = await res.json();
      setSendResults(data.results || []);

      // Mark successes as contacted and deselect them
      const newContacted = new Set(contactedKeys);
      const newSelected = new Set(selectedKeys);
      (data.results || []).forEach((r) => {
        if (r.success) {
          const key = `${r.name}|||${r.address}`;
          newContacted.add(key);
          newSelected.delete(key);
        }
      });
      setContactedKeys(newContacted);
      setSelectedKeys(newSelected);
    } catch (err) {
      setSendResults([{ name: '—', email: '—', success: false, error: err.message }]);
    } finally {
      setSending(false);
    }
  }

  const emailCount = selectedList.filter((p) => leadEmails[bizKey(p)]?.trim()).length;

  // ── Fetch helpers ──
  async function fetchPlaces(cityVal, cat, pageToken = null) {
    const res = await fetch(`${API_BASE}/api/admin/places-search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ city: cityVal.trim(), category: cat, pageToken }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Search failed');
    return data;
  }

  async function handleSearch(e) {
    e.preventDefault();
    if (!city.trim()) return;
    const cacheKey = `${city.trim().toLowerCase()}|${category}`;
    if (cache.current.has(cacheKey)) {
      const cached = cache.current.get(cacheKey);
      setResults(cached.places);
      setNextPageToken(cached.nextPageToken);
      setQuery(cached.query);
      setError('');
      setSelectedKeys(new Set());
      return;
    }
    setLoading(true);
    setError('');
    setResults(null);
    setNextPageToken(null);
    setSelectedKeys(new Set());
    try {
      const data = await fetchPlaces(city, category);
      setResults(data.places);
      setNextPageToken(data.nextPageToken || null);
      setQuery(data.query);
      cache.current.set(cacheKey, { places: data.places, nextPageToken: data.nextPageToken || null, query: data.query });
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  async function handleLoadMore() {
    if (!nextPageToken) return;
    setLoadingMore(true);
    setError('');
    try {
      const data = await fetchPlaces(city, category, nextPageToken);
      const combined = [...results, ...data.places];
      setResults(combined);
      setNextPageToken(data.nextPageToken || null);
      const cacheKey = `${city.trim().toLowerCase()}|${category}`;
      cache.current.set(cacheKey, { places: combined, nextPageToken: data.nextPageToken || null, query });
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoadingMore(false);
    }
  }

  function renderStars(rating) {
    if (rating == null) return '—';
    const full = Math.floor(rating);
    const half = rating - full >= 0.5;
    return '★'.repeat(full) + (half ? '½' : '') + ` ${rating.toFixed(1)}`;
  }

  return (
    <div className="al-page">
      <div className="al-header">
        <div className="al-header-inner">
          <button className="al-back" onClick={onGoBack}>← Dashboard</button>
          <div>
            <h1 className="al-title">⚡ Lead Finder</h1>
            <p className="al-subtitle">Search Google Places to find local businesses to reach out to</p>
          </div>
        </div>
      </div>

      <div className="al-body">
        {/* Search form */}
        <div className="al-search-card">
          <form className="al-form" onSubmit={handleSearch}>
            <div className="al-form-row">
              <div className="al-field">
                <label className="al-label">City</label>
                <input
                  className="al-input"
                  type="text"
                  placeholder="e.g. Brampton Ontario"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  required
                />
              </div>
              <div className="al-field">
                <label className="al-label">Business Category</label>
                <select className="al-select" value={category} onChange={(e) => setCategory(e.target.value)}>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <button className="al-btn-search" type="submit" disabled={loading}>
                {loading ? 'Searching…' : '🔍 Search'}
              </button>
            </div>
          </form>
        </div>

        {error && <div className="al-error">⚠️ {error}</div>}

        {/* Selection action bar */}
        {selectedList.length > 0 && (
          <div className="al-outreach-bar">
            <span className="al-outreach-bar-count">{selectedList.length} lead{selectedList.length !== 1 ? 's' : ''} selected</span>
            <div className="al-outreach-bar-actions">
              <button className="al-btn-clear-sel" onClick={handleClearSelection}>Clear</button>
              <button className="al-btn-outreach" onClick={handleOpenModal}>
                ✉ Send Outreach Email
              </button>
            </div>
          </div>
        )}

        {/* Results */}
        {displayedResults && (
          <div className="al-results">
            <div className="al-results-header">
              <div className="al-results-header-left">
                <span className="al-results-count">{displayedResults.length} results</span>
                <span className="al-results-query"> for "{query}"</span>
                {filterMode === 'struggling' && results && (
                  <span className="al-results-note"> — {strugglingCount} of {results.length} loaded need help</span>
                )}
              </div>
              <div className="al-results-header-right">
                <div className="al-filter-toggle">
                  <button
                    className={`al-filter-btn ${filterMode === 'struggling' ? 'active' : ''}`}
                    onClick={() => setFilterMode('struggling')}
                  >🚨 Struggling</button>
                  <button
                    className={`al-filter-btn ${filterMode === 'all' ? 'active' : ''}`}
                    onClick={() => setFilterMode('all')}
                  >All Businesses</button>
                </div>
                {displayedResults.length > 0 && (
                  <button className="al-btn-export" onClick={() => exportCSV(displayedResults, query, category)}>
                    ⬇ Export CSV
                  </button>
                )}
              </div>
            </div>

            {displayedResults.length === 0 ? (
              <div className="al-empty">
                {filterMode === 'struggling'
                  ? 'No struggling businesses found. Try loading more or switch to "All Businesses".'
                  : 'No results found. Try a different city or category.'}
              </div>
            ) : (
              <>
                <div className="al-table-wrap">
                  <table className="al-table">
                    <thead>
                      <tr>
                        <th className="al-th-check">
                          <input
                            type="checkbox"
                            className="al-checkbox"
                            checked={allDisplayedSelected}
                            ref={(el) => { if (el) el.indeterminate = someDisplayedSelected && !allDisplayedSelected; }}
                            onChange={handleSelectAll}
                          />
                        </th>
                        <th>#</th>
                        <th>Business Name</th>
                        <th>Issues</th>
                        <th>Rating</th>
                        <th>Reviews</th>
                        <th>Address</th>
                        <th>Website</th>
                        <th>Phone</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayedResults.map((p, i) => {
                        const badges = getBadges(p, category);
                        const threshold = getLowReviewsThreshold(category);
                        const isContacted = contactedKeys.has(bizKey(p));
                        const isSelected = selectedKeys.has(bizKey(p));
                        return (
                          <tr
                            key={i}
                            className={`${badges.length > 0 ? 'al-row-struggling' : ''} ${isSelected ? 'al-row-selected' : ''}`}
                          >
                            <td className="al-td-check">
                              <input
                                type="checkbox"
                                className="al-checkbox"
                                checked={isSelected}
                                onChange={() => handleToggleSelect(p)}
                              />
                            </td>
                            <td className="al-td-num">{i + 1}</td>
                            <td className="al-td-name">{p.name}</td>
                            <td className="al-td-issues">
                              <div className="al-badges">
                                {badges.map((b) => (
                                  <span key={b.label} className={`al-badge ${b.cls}`}>{b.label}</span>
                                ))}
                                {isContacted && (
                                  <span className="al-badge al-badge-green">✓ Contacted</span>
                                )}
                              </div>
                            </td>
                            <td className="al-td-rating">
                              {p.rating != null ? (
                                <span className={`al-stars ${p.rating < 4.2 ? 'al-stars-low' : ''}`}>
                                  {renderStars(p.rating)}
                                </span>
                              ) : '—'}
                            </td>
                            <td className={`al-td-reviews ${p.totalReviews < threshold ? 'al-reviews-low' : ''}`}>
                              {p.totalReviews.toLocaleString()}
                            </td>
                            <td className="al-td-address">{p.address}</td>
                            <td className="al-td-website">
                              {p.website ? (
                                <a href={p.website} target="_blank" rel="noreferrer" className="al-link">
                                  {p.website.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]}
                                </a>
                              ) : <span className="al-no-website">—</span>}
                            </td>
                            <td className="al-td-phone">{p.phone || '—'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="al-load-more-wrap">
                  {nextPageToken ? (
                    <button className="al-btn-load-more" onClick={handleLoadMore} disabled={loadingMore}>
                      {loadingMore ? 'Loading…' : 'Load More Results'}
                    </button>
                  ) : (
                    <p className="al-no-more">All results loaded ({results.length} total)</p>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* ── Outreach Modal ── */}
      {showModal && (
        <div className="al-modal-overlay" onClick={handleCloseModal}>
          <div className="al-modal" onClick={(e) => e.stopPropagation()}>
            <div className="al-modal-header">
              <div>
                <h2 className="al-modal-title">Send Outreach Email</h2>
                <p className="al-modal-subtitle">
                  {sendResults ? 'Results' : `${selectedList.length} business${selectedList.length !== 1 ? 'es' : ''} selected`}
                </p>
              </div>
              <button className="al-modal-close" onClick={handleCloseModal} disabled={sending}>✕</button>
            </div>

            <div className="al-modal-body">
              {sendResults ? (
                /* ── Results view ── */
                <>
                  <div className="al-send-results">
                    {sendResults.map((r, i) => (
                      <div key={i} className={`al-send-result ${r.success ? 'al-send-ok' : 'al-send-fail'}`}>
                        <span className="al-send-icon">{r.success ? '✓' : '✗'}</span>
                        <span className="al-send-name">{r.name}</span>
                        <span className="al-send-email">{r.email}</span>
                        {!r.success && <span className="al-send-error">{r.error}</span>}
                      </div>
                    ))}
                  </div>
                  <div className="al-modal-footer">
                    <button className="al-btn-modal-secondary" onClick={handleCloseModal}>Close</button>
                  </div>
                </>
              ) : (
                /* ── Compose view ── */
                <>
                  <div className="al-modal-section">
                    <label className="al-label">Subject</label>
                    <input
                      className="al-input"
                      value={modalSubject}
                      onChange={(e) => setModalSubject(e.target.value)}
                    />
                  </div>

                  <div className="al-modal-section">
                    <label className="al-label">Message</label>
                    <textarea
                      className="al-modal-textarea"
                      rows={8}
                      value={modalBody}
                      onChange={(e) => setModalBody(e.target.value)}
                    />
                    <p className="al-modal-hint">
                      💡 <strong>[Business Name]</strong> and <strong>[Rating]</strong> are automatically replaced for each recipient
                    </p>
                  </div>

                  <div className="al-modal-section">
                    <label className="al-label">Recipients — add email address for each business you want to contact</label>
                    <div className="al-lead-email-list">
                      {selectedList.map((p) => (
                        <div key={bizKey(p)} className="al-lead-email-row">
                          <div className="al-lead-email-info">
                            <span className="al-lead-email-name">{p.name}</span>
                            <div className="al-badges">
                              {getBadges(p, category).map((b) => (
                                <span key={b.label} className={`al-badge ${b.cls}`}>{b.label}</span>
                              ))}
                            </div>
                          </div>
                          <input
                            className="al-input al-lead-email-input"
                            type="email"
                            placeholder="Email address"
                            value={leadEmails[bizKey(p)] || ''}
                            onChange={(e) => setLeadEmails((prev) => ({ ...prev, [bizKey(p)]: e.target.value }))}
                          />
                        </div>
                      ))}
                    </div>
                    {emailCount === 0 && (
                      <p className="al-modal-warn">⚠ Add at least one email address to send</p>
                    )}
                  </div>

                  <div className="al-modal-footer">
                    <button className="al-btn-modal-secondary" onClick={handleCloseModal} disabled={sending}>
                      Cancel
                    </button>
                    <button
                      className="al-btn-modal-primary"
                      onClick={handleSend}
                      disabled={sending || emailCount === 0}
                    >
                      {sending ? 'Sending…' : `Send ${emailCount || ''} Email${emailCount !== 1 ? 's' : ''}`}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
