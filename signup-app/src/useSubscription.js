const TRIAL_DAYS = 7;

/**
 * Computes the user's subscription access level from their profile row.
 * profile must include: trial_start, subscription_status, stripe_subscription_id,
 * stripe_customer_id, current_period_end, cancel_at_period_end
 */
export function useSubscription(profile) {
  const now = new Date();

  // Determine trial window
  const trialStart = profile?.trial_start ? new Date(profile.trial_start) : null;
  const trialEnd = trialStart
    ? new Date(trialStart.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000)
    : null;
  const trialDaysLeft = trialEnd
    ? Math.max(0, Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24)))
    : 0;
  const isTrialing = trialEnd ? now < trialEnd : false;

  const status = profile?.subscription_status || 'trialing';
  const currentPeriodEnd = profile?.current_period_end
    ? new Date(profile.current_period_end)
    : null;
  const cancelAtPeriodEnd = !!profile?.cancel_at_period_end;

  // Determine if the user currently has full access
  let hasAccess = false;
  if (isTrialing && (status === 'trialing' || !status)) hasAccess = true;
  if (status === 'active') hasAccess = true;
  // Canceled but still within paid period
  if (status === 'canceled' && currentPeriodEnd && now < currentPeriodEnd) hasAccess = true;

  return {
    hasAccess,
    isTrialing,
    trialEnd,
    trialDaysLeft,
    status,
    currentPeriodEnd,
    cancelAtPeriodEnd,
    subscriptionId: profile?.stripe_subscription_id || null,
    customerId: profile?.stripe_customer_id || null,
  };
}
