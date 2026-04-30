// Google Ads conversion tracking — uses window.gtag injected by index.html
function gtag(...args) {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag(...args);
  }
}

// Fired when user clicks "Analyse My Page Free"
export function trackFreeAnalysis() {
  gtag('event', 'conversion', { send_to: 'AW-18125603838/free_analysis' });
}

// Fired when user submits email to receive full report
export function trackLeadCaptured() {
  gtag('event', 'conversion', { send_to: 'AW-18125603838/lead_captured' });
}

// Fired when Stripe payment completes successfully
export function trackGrowthPlanPurchase() {
  gtag('event', 'conversion', {
    send_to: 'AW-18125603838/3gd8CKTQvaQcEP6H-8JD',
    value: 1.0,
    currency: 'CAD',
  });
}

// Fired when Done For You contact form is submitted
export function trackDoneForYouEnquiry() {
  gtag('event', 'conversion', { send_to: 'AW-18125603838/done_for_you_enquiry' });
}
