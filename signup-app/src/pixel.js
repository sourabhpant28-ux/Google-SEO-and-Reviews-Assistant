import ReactPixel from 'react-facebook-pixel';

const PIXEL_ID = '1235031845029079';

export function initPixel() {
  ReactPixel.init(PIXEL_ID, {}, {
    autoConfig: true,
    debug: false,
  });
}

export function trackPageView() {
  ReactPixel.pageView();
}

export function trackLead() {
  ReactPixel.track('Lead');
}

export function trackCompleteRegistration() {
  ReactPixel.track('CompleteRegistration');
}

export function trackInitiateCheckout() {
  ReactPixel.track('InitiateCheckout', {
    value: 39.00,
    currency: 'USD',
  });
}
