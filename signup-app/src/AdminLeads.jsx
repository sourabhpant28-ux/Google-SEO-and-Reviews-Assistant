import { useState, useRef } from 'react';
import { API_BASE } from './api';
import './AdminLeads.css';

const CATEGORIES = ['Restaurant', 'Salon', 'Gym', 'Dental', 'Retail', 'Hotel'];

function exportCSV(places, query) {
  const headers = ['Business Name', 'Rating', 'Total Reviews', 'Address', 'Website', 'Phone'];
  const rows = places.map((p) => [
    `"${p.name.replace(/"/g, '""')}"`,
    p.rating ?? '',
    p.totalReviews,
    `"${p.address.replace(/"/g, '""')}"`,
    p.website,
    p.phone,
  ]);
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

  // Session-level cache: key = "city|category", value = { places, nextPageToken, query }
  const cache = useRef(new Map());

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

      // Cache the first page
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

      // Update cache with expanded results
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
        {results && (
          <div className="al-results">
            <div className="al-results-header">
              <div>
                <span className="al-results-count">{results.length} results</span>
                <span className="al-results-query"> for "{query}"</span>
              </div>
              {results.length > 0 && (
                <button className="al-btn-export" onClick={() => exportCSV(results, query)}>
                  ⬇ Export CSV
                </button>
              )}
            </div>

            {results.length === 0 ? (
              <div className="al-empty">No results found. Try a different city or category.</div>
            ) : (
              <>
                <div className="al-table-wrap">
                  <table className="al-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Business Name</th>
                        <th>Rating</th>
                        <th>Reviews</th>
                        <th>Address</th>
                        <th>Website</th>
                        <th>Phone</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.map((p, i) => (
                        <tr key={i}>
                          <td className="al-td-num">{i + 1}</td>
                          <td className="al-td-name">{p.name}</td>
                          <td className="al-td-rating">
                            {p.rating != null ? (
                              <span className="al-stars">{renderStars(p.rating)}</span>
                            ) : '—'}
                          </td>
                          <td className="al-td-reviews">{p.totalReviews.toLocaleString()}</td>
                          <td className="al-td-address">{p.address}</td>
                          <td className="al-td-website">
                            {p.website ? (
                              <a href={p.website} target="_blank" rel="noreferrer" className="al-link">
                                {p.website.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]}
                              </a>
                            ) : '—'}
                          </td>
                          <td className="al-td-phone">{p.phone || '—'}</td>
                        </tr>
                      ))}
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
                      {loadingMore ? 'Loading…' : `Load More Results`}
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
