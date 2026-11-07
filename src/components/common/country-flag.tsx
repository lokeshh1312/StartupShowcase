import React from "react";
import { getCountryName } from "@/lib/validation";

interface CountryFlagProps {
  code?: string | null;
  className?: string;
}

export function CountryFlag({ code, className = "" }: CountryFlagProps) {
  if (!code || typeof code !== "string") return null;

  const upper = code.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(upper)) return null;

  const emoji = String.fromCodePoint(
    0x1F1E6 + upper.charCodeAt(0) - 65,
    0x1F1E6 + upper.charCodeAt(1) - 65
  );

  const countryName = getCountryName(upper);

  return (
    <span
      role="img"
      aria-label={countryName}
      title={countryName}
      className={`text-base leading-none shrink-0 ${className}`.trim()}
    >
      {emoji}
    </span>
  );
}
