import React from "react";
import type { SVGProps } from "react";

export interface LogoMarkProps extends SVGProps<SVGSVGElement> {
  className?: string;
  title?: string;
  "aria-label"?: string;
}

export function LogoMark({
  className = "",
  title,
  "aria-label": ariaLabel,
  ...props
}: LogoMarkProps) {
  const accessibleName = title || ariaLabel;
  const isDecorative = !accessibleName;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      fill="none"
      className={className}
      aria-hidden={isDecorative ? true : undefined}
      role={isDecorative ? undefined : "img"}
      aria-label={accessibleName}
      {...props}
    >
      {title && <title>{title}</title>}
      <circle cx="50" cy="50" r="16.7" fill="currentColor" />
      <g className="orbit" fill="none" stroke="currentColor">
        <path
          d="M13.29 59.84A38 38 0 0 1 70.7 18.13"
          strokeWidth="4.3"
        />
        <path
          d="M86.71 40.16A38 38 0 0 1 29.3 81.87"
          strokeWidth="4.3"
        />
        <circle cx="76.87" cy="23.13" r="7.45" strokeWidth="4.1" />
        <circle cx="23.13" cy="76.87" r="7.45" strokeWidth="4.1" />
      </g>
    </svg>
  );
}
