// Meta Pixel helper — uses window.fbq injected by index.html
function fbq(...args) {
  if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
    window.fbq(...args);
  }
}

export function initPixel() {
  // Pixel is already initialised via the script tag in index.html
}

export function trackPageView() {
  fbq('track', 'PageView');
}

export function trackLead() {
  fbq('track', 'Lead');
}

export function trackCompleteRegistration() {
  fbq('track', 'CompleteRegistration');
}

export function trackInitiateCheckout() {
  fbq('track', 'InitiateCheckout', { value: 39.00, currency: 'USD' });
}
