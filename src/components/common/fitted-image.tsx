import React from "react";
import Image from "next/image";

interface FittedImageProps {
  src: string;
  alt: string;
  sizes: string;
  priority?: boolean;
  className?: string;
}

/**
 * Renders an image inside a fixed/responsive container without cropping any part
 * of it, using a blurred, scaled duplicate of the same image as an ambient
 * background fill and `object-contain` for the crisp foreground image.
 */
export function FittedImage({
  src,
  alt,
  sizes,
  priority = false,
  className = "",
}: FittedImageProps) {
  return (
    <div className={`relative w-full h-full overflow-hidden ${className}`.trim()}>
      {/* Layer 1: Blurred ambient background fill (always lazy, small sizes) */}
      <Image
        src={src}
        alt=""
        fill
        aria-hidden="true"
        sizes="64px"
        className="object-cover scale-110 blur-xl opacity-60 dark:opacity-40 pointer-events-none"
      />
      {/* Layer 2: Uncropped foreground image */}
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        sizes={sizes}
        className="object-contain"
      />
    </div>
  );
}
