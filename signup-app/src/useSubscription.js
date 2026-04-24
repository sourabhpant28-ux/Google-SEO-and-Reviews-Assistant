/**
 * Computes the user's subscription access level from their profile row.
 * No free trial — users must subscribe to access paid features.
 */
export function useSubscription(profile) {
  const now = new Date();

  const status = profile?.subscription_status || 'inactive';
  const currentPeriodEnd = profile?.current_period_end
    ? new Date(profile.current_period_end)
    : null;
  const cancelAtPeriodEnd = !!profile?.cancel_at_period_end;

  // Access only for active subscribers or canceled-but-still-in-paid-period
  let hasAccess = false;
  if (status === 'active') hasAccess = true;
  if (status === 'canceled' && currentPeriodEnd && now < currentPeriodEnd) hasAccess = true;

  return {
    hasAccess,
    isTrialing: false,
    trialEnd: null,
    trialDaysLeft: 0,
    status,
    currentPeriodEnd,
    cancelAtPeriodEnd,
    subscriptionId: profile?.stripe_subscription_id || null,
    customerId: profile?.stripe_customer_id || null,
  };
}
