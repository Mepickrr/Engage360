import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function NotFoundPage() {
  return (
    <div
      data-testid="page-not-found"
      className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-fade-in-up"
    >
      <span className="text-[64px] font-bold tracking-tight text-primary leading-none">
        404
      </span>
      <h1 className="mt-3 text-xl font-semibold text-text-primary">
        Page not found
      </h1>
      <p className="mt-2 text-sm text-text-secondary max-w-md">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Button asChild className="mt-6 bg-primary hover:bg-primary-hover">
        <Link to="/" data-testid="not-found-home-link">
          Back to Home
        </Link>
      </Button>
    </div>
  );
}
