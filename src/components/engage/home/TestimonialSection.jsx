import React from "react";
import { Star } from "lucide-react";

const TESTIMONIALS = [
  {
    quote:
      "We recovered 22% of abandoned carts in the first month — WhatsApp converts so much better than email ever did for us.",
    name: "Ananya Rao",
    title: "Growth Lead",
    brand: "Lumora",
  },
  {
    quote:
      "Fastrr Journey found shoppers we didn't even know we had. Our repeat purchase rate jumped almost overnight.",
    name: "Rohit Malhotra",
    title: "Founder",
    brand: "Northline",
  },
  {
    quote:
      "Setup took less than 15 minutes and we were already sending our first recovery messages that same day.",
    name: "Priya Nair",
    title: "D2C Manager",
    brand: "Aurelia Home",
  },
];

function initials(name) {
  return name
    .split(" ")
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();
}

export default function TestimonialSection() {
  return (
    <div className="mb-10" data-testid="fastrr-engage-testimonials">
      <h2 className="text-xl font-semibold text-text-primary text-center mb-8">
        Loved by Growing D2C Brands
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {TESTIMONIALS.map((t) => (
          <div
            key={t.name}
            className="bg-surface border border-border rounded-lg p-5"
            data-testid={`testimonial-${t.name.replace(/\s+/g, "-").toLowerCase()}`}
          >
            <div className="flex gap-0.5 mb-3">
              {Array.from({ length: 5 }, (_, i) => (
                <Star key={i} className="w-4 h-4 text-warning" />
              ))}
            </div>
            <p className="text-sm text-text-secondary mb-4">{`"${t.quote}"`}</p>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-primary-tint text-primary flex items-center justify-center text-xs font-semibold flex-shrink-0">
                {initials(t.name)}
              </div>
              <div>
                <div className="text-sm font-semibold text-text-primary">{t.name}</div>
                <div className="text-xs text-text-muted">{`${t.title}, ${t.brand}`}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
