// Shared cart-funding math for the Listing's CartRail and the Recharge
// step — both need the exact same "what will this selection cost to run
// for the runway period" number, and must never compute it independently
// (the number the seller sees in the cart must match the number they're
// asked to fund one screen later).
import { RATE_CARD, WALLET_TOPUP } from "@/components/engage2/journey-dashboard/data";

const MARKETING_RATE_PER_MESSAGE = RATE_CARD.enabled.find(
  (c) => c.id === "wa-marketing"
).pricePerMessage;

export function formatINR(amount) {
  return `₹${amount.toLocaleString("en-IN")}`;
}

// Selected Known/Identified variants of the same journey type reach the
// same underlying population through two different audience-recognition
// mechanisms — they don't double the messaging volume for that moment.
// Dedupe by journeyType before summing daily volume, so selecting both
// variants of "Abandoned Cart" still counts its ~4,000/day once, not twice.
export function computeCartFunding(selectedJourneys) {
  const seenTypes = new Set();
  let dailyVolume = 0;
  selectedJourneys.forEach((j) => {
    if (seenTypes.has(j.journeyType)) return;
    seenTypes.add(j.journeyType);
    dailyVolume += j.estimatedDailyVolume;
  });
  const dailyCost = dailyVolume * MARKETING_RATE_PER_MESSAGE;
  const runwayDays = WALLET_TOPUP.aiSuggestRunwayDays;
  const total = dailyCost * runwayDays;
  return { dailyVolume, dailyCost, total, runwayDays };
}
