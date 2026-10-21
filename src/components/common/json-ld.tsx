import React from "react";
import { serializeJsonLd } from "@/lib/seo";

export interface JsonLdProps {
  data: unknown;
}

/**
 * Renders an escaped application/ld+json script tag safe against script injection.
 */
export function JsonLd({ data }: JsonLdProps) {
  if (!data) return null;
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  );
}
