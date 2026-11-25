/**
 * @vitest-environment jsdom
 */

import React from "react";
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { FittedImage } from "@/components/common/fitted-image";

describe("FittedImage Component", () => {
  it("renders two images: an aria-hidden object-cover background and an object-contain foreground", () => {
    const { container } = render(
      <FittedImage
        src="/startups/example-banner.png"
        alt="Example Startup cover"
        sizes="(max-width: 1200px) 100vw, 1152px"
      />
    );

    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.className).toContain("relative");
    expect(wrapper.className).toContain("w-full");
    expect(wrapper.className).toContain("h-full");
    expect(wrapper.className).toContain("overflow-hidden");

    const images = container.querySelectorAll("img");
    expect(images).toHaveLength(2);

    const [bgImg, fgImg] = Array.from(images);

    // Layer 1: blurred ambient background fill
    expect(bgImg.getAttribute("aria-hidden")).toBe("true");
    expect(bgImg.getAttribute("alt")).toBe("");
    expect(bgImg.className).toContain("object-cover");
    expect(bgImg.className).toContain("scale-110");
    expect(bgImg.className).toContain("blur-xl");
    expect(bgImg.className).toContain("opacity-60");
    expect(bgImg.className).toContain("dark:opacity-40");
    expect(bgImg.className).toContain("pointer-events-none");
    expect(bgImg.getAttribute("sizes")).toBe("64px");
    expect(bgImg.getAttribute("loading")).toBe("lazy");

    // Layer 2: uncropped foreground image
    expect(fgImg.getAttribute("aria-hidden")).toBeNull();
    expect(fgImg.getAttribute("alt")).toBe("Example Startup cover");
    expect(fgImg.className).toContain("object-contain");
    expect(fgImg.getAttribute("sizes")).toBe("(max-width: 1200px) 100vw, 1152px");
    expect(fgImg.getAttribute("loading")).toBe("lazy");
  });

  it("applies priority only to the foreground image and keeps the background layer lazy", () => {
    const { container } = render(
      <FittedImage
        src="/startups/hero-banner.png"
        alt="Hero cover"
        sizes="(max-width: 1200px) 100vw, 1152px"
        priority
      />
    );

    const images = container.querySelectorAll("img");
    expect(images).toHaveLength(2);

    const [bgImg, fgImg] = Array.from(images);

    // Background layer stays lazy even when priority={true}
    expect(bgImg.getAttribute("aria-hidden")).toBe("true");
    expect(bgImg.getAttribute("loading")).toBe("lazy");
    expect(bgImg.getAttribute("fetchpriority")).not.toBe("high");

    // Foreground layer receives priority (eager loading, no loading="lazy")
    expect(fgImg.getAttribute("alt")).toBe("Hero cover");
    expect(fgImg.getAttribute("loading")).toBeNull();
  });

  it("forwards custom className to the wrapper element", () => {
    const { container } = render(
      <FittedImage
        src="/startups/example-banner.png"
        alt="Example"
        sizes="64px"
        className="rounded-lg"
      />
    );

    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.className).toContain("rounded-lg");
  });
});
