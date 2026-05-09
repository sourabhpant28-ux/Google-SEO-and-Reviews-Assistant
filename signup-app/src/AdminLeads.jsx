import { useState, useRef, useMemo } from 'react';
import { API_BASE } from './api';
import './AdminLeads.css';

const CATEGORIES = ['Restaurant', 'Salon', 'Gym', 'Dental', 'Retail', 'Hotel'];

// Urgency scoring — higher = more urgent / more struggling
function getUrgencyScore(p) {
  let score = 0;
  if (!p.website) score += 4;
  if (p.totalReviews < 50) score += 2;
  if (p.rating != null && p.rating < 4.2) score += 1;
  return score;
}

function isStruggling(p) {
  return !p.website || p.totalReviews < 50 || (p.rating != null && p.rating < 4.2);
}

function getBadges(p) {
  const badges = [];
  if (!p.website) badges.push({ label: 'No Website', cls: 'al-badge-red' });
  if (p.totalReviews < 50) badges.push({ label: 'Low Reviews', cls: 'al-badge-orange' });
  if (p.rating != null && p.rating < 4.2) badges.push({ label: 'Low Rating', cls: 'al-badge-yellow' });
  return badges;
}

function exportCSV(places, query) {
  const headers = ['Business Name', 'Rating', 'Total Reviews', 'Address', 'Website', 'Phone', 'Issues'];
  const rows = places.map((p) => {
    const issues = getBadges(p).map((b) => b.label).join(' | ');
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
  const [filterMode, setFilterMode] = useState('struggling'); // 'struggling' | 'all'

  // Session-level cache: key = "city|category", value = { places, nextPageToken, query }
  const cache = useRef(new Map());

  // Filtered + sorted view derived from raw results
  const displayedResults = useMemo(() => {
    if (!results) return null;
    const list = filterMode === 'struggling'
      ? results.filter(isStruggling)
      : [...results];
    // Sort by urgency score descending (no website → low reviews → low rating)
    list.sort((a, b) => getUrgencyScore(b) - getUrgencyScore(a));
    return list;
  }, [results, filterMode]);

  async function fetchPlaces(city, category, pageToken = null) {
    const res = await fetch(`${API_BASE}/api/admin/places-search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ city: city.trim(), category, pageToken }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Search failed');
    return data;
  }

  async function handleSearch(e) {
    e.preventDefault();
    if (!city.trim()) return;

    const cacheKey = `${city.trim().toLowerCase()}|${category}`;

    // Return cached results without hitting the API
    if (cache.current.has(cacheKey)) {
      const cached = cache.current.get(cacheKey);
      setResults(cached.places);
      setNextPageToken(cached.nextPageToken);
      setQuery(cached.query);
      setError('');
      return;
    }

    setLoading(true);
    setError('');
    setResults(null);
    setNextPageToken(null);

    try {
      const data = await fetchPlaces(city, category);
      setResults(data.places);
      setNextPageToken(data.nextPageToken || null);
      setQuery(data.query);
      cache.current.set(cacheKey, {
        places: data.places,
        nextPageToken: data.nextPageToken || null,
        query: data.query,
      });
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
      cache.current.set(cacheKey, {
        places: combined,
        nextPageToken: data.nextPageToken || null,
        query,
      });
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

  const strugglingCount = results ? results.filter(isStruggling).length : 0;

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
                <select
                  className="al-select"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <button className="al-btn-search" type="submit" disabled={loading}>
                {loading ? 'Searching…' : '🔍 Search'}
              </button>
            </div>
          </form>
        </div>

        {error && (
          <div className="al-error">⚠️ {error}</div>
        )}

        {/* Results */}
        {displayedResults && (
          <div className="al-results">
            <div className="al-results-header">
              <div className="al-results-header-left">
                <span className="al-results-count">{displayedResults.length} results</span>
                <span className="al-results-query"> for "{query}"</span>
                {filterMode === 'struggling' && results && (
                  <span className="al-results-note">
                    — {strugglingCount} of {results.length} loaded need help
                  </span>
                )}
              </div>
              <div className="al-results-header-right">
                {/* Filter toggle */}
                <div className="al-filter-toggle">
                  <button
                    className={`al-filter-btn ${filterMode === 'struggling' ? 'active' : ''}`}
                    onClick={() => setFilterMode('struggling')}
                  >
                    🚨 Struggling
                  </button>
                  <button
                    className={`al-filter-btn ${filterMode === 'all' ? 'active' : ''}`}
                    onClick={() => setFilterMode('all')}
                  >
                    All Businesses
                  </button>
                </div>
                {displayedResults.length > 0 && (
                  <button className="al-btn-export" onClick={() => exportCSV(displayedResults, query)}>
                    ⬇ Export CSV
                  </button>
                )}
              </div>
            </div>

            {displayedResults.length === 0 ? (
              <div className="al-empty">
                {filterMode === 'struggling'
                  ? 'No struggling businesses found in these results. Try loading more or switch to "All Businesses".'
                  : 'No results found. Try a different city or category.'}
              </div>
            ) : (
              <>
                <div className="al-table-wrap">
                  <table className="al-table">
                    <thead>
                      <tr>
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
                        const badges = getBadges(p);
                        return (
                          <tr key={i} className={badges.length > 0 ? 'al-row-struggling' : ''}>
                            <td className="al-td-num">{i + 1}</td>
                            <td className="al-td-name">{p.name}</td>
                            <td className="al-td-issues">
                              <div className="al-badges">
                                {badges.map((b) => (
                                  <span key={b.label} className={`al-badge ${b.cls}`}>{b.label}</span>
                                ))}
                              </div>
                            </td>
                            <td className="al-td-rating">
                              {p.rating != null ? (
                                <span className={`al-stars ${p.rating < 4.2 ? 'al-stars-low' : ''}`}>
                                  {renderStars(p.rating)}
                                </span>
                              ) : '—'}
                            </td>
                            <td className={`al-td-reviews ${p.totalReviews < 50 ? 'al-reviews-low' : ''}`}>
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

                {/* Load More */}
                <div className="al-load-more-wrap">
                  {nextPageToken ? (
                    <button
                      className="al-btn-load-more"
                      onClick={handleLoadMore}
                      disabled={loadingMore}
                    >
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
    </div>
  );
}
