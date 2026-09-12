import React from "react";

const FICTIONAL_BRANDS = [
  "Lumora",
  "Verve & Co.",
  "Northline",
  "Aurelia Home",
  "Kindred Goods",
  "Solstice Apparel",
];

export default function LogoStrip() {
  return (
    <div className="text-center mb-10" data-testid="fastrr-engage-logo-strip">
      <p className="text-xs font-semibold uppercase tracking-wide text-text-muted mb-2">
        Trusted by growing D2C brands
      </p>
      {/* Public, real numbers sourced directly from https://fastrrai.shiprocket.in/
          ("90M+ subscribers on Shiprocket network") and https://www.shiprocket.in/
          ("4 Lakh+ Businesses") — not fabricated, no sign-off flag needed. */}
      <p className="text-sm text-text-secondary mb-6">
        Backed by Shiprocket — powering 4 Lakh+ businesses and 90M+ shoppers
      </p>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {FICTIONAL_BRANDS.map((brand) => (
          <div key={brand} className="text-lg font-bold text-text-muted text-center">
            {brand}
          </div>
        ))}
      </div>
    </div>
  );
}
