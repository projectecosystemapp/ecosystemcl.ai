export type Tier = 'free' | 'premium' | 'enterprise';

export function calculateBidPower(options: {
  tier: Tier;
  allocatedCredits?: number; // user-specified budget for this job
  currentLoadFactor?: number; // 0..1 (1 = peak load)
}): number {
  const { tier, allocatedCredits = 0, currentLoadFactor = 0.5 } = options;

  const tierWeight = tier === 'enterprise' ? 3 : tier === 'premium' ? 2 : 1;
  const budgetWeight = Math.log10(Math.max(allocatedCredits, 1)); // grows slowly
  const scarcityBoost = 1 + currentLoadFactor; // higher when load is high

  // Normalize to a manageable range
  const raw = tierWeight * (1 + budgetWeight) * scarcityBoost;
  return Math.round(raw * 100); // integer bid power
}

export function bidPowerToQueuePriority(bidPower: number): number {
  // BullMQ uses lower numbers as higher priority. Map bid power to inverse scale.
  // Bound between 1 (highest) and 100 (lowest) for simplicity.
  const clamped = Math.max(0, Math.min(1000, bidPower));
  const priority = 100 - Math.floor(clamped / 10);
  return Math.max(1, Math.min(100, priority));
}

