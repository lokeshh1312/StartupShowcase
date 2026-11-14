/**
 * @vitest-environment jsdom
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import ThesisPage, { metadata } from "@/app/thesis/page";

describe("Thesis Page (/thesis)", () => {
  it("exports correct metadata via createMetadata", () => {
    expect(metadata.title).toEqual({ absolute: "Thesis | Startup Showcase Global" });
    expect(metadata.description).toBe(
      "Startup Showcase aims to identify and support up to 10 promising startups with innovative ideas, strong business potential, and scalable solutions."
    );
    expect(metadata.alternates?.canonical).toContain("/thesis");
  });

  it("renders the h1 'Thesis' and all 7 section headings", () => {
    render(<ThesisPage />);

    // Check h1
    const h1 = screen.getByRole("heading", { level: 1, name: "Thesis" });
    expect(h1).toBeDefined();

    // Check intro text
    expect(
      screen.getByText("Backing the Next 10 Promising Startups")
    ).toBeDefined();
    expect(
      screen.getByText(
        "Startup Showcase aims to identify and support up to 10 promising startups with innovative ideas, strong business potential, and scalable solutions."
      )
    ).toBeDefined();

    // Check all 7 section headings
    const expectedHeadings = [
      "1. Open to All Industries",
      "2. What We Evaluate",
      "3. Product & Service Evidence",
      "4. Eligible Startup Stages",
      "5. Selection Process",
      "6. Grant Approach",
      "7. Important Information",
    ];

    for (const headingText of expectedHeadings) {
      const heading = screen.getByRole("heading", {
        level: 2,
        name: headingText,
      });
      expect(heading).toBeDefined();
    }
  });

  it("renders section 5 with a real numbered list (<ol> with list-decimal)", () => {
    const { container } = render(<ThesisPage />);

    const ol = container.querySelector("ol");
    expect(ol).not.toBeNull();
    expect(ol?.classList.contains("list-decimal")).toBe(true);

    const listItems = ol?.querySelectorAll("li");
    expect(listItems?.length).toBe(6);
    expect(listItems?.[0]?.textContent).toBe("Application Submission");
    expect(listItems?.[1]?.textContent).toBe("Initial Screening");
    expect(listItems?.[2]?.textContent).toBe("Business Evaluation");
    expect(listItems?.[3]?.textContent).toBe("Product Review");
    expect(listItems?.[4]?.textContent).toBe("Founder Interaction");
    expect(listItems?.[5]?.textContent).toBe("Final Selection");
  });

  it("renders back to home link", () => {
    render(<ThesisPage />);
    const backLink = screen.getByRole("link", { name: /Back to Home/i });
    expect(backLink).toBeDefined();
    expect(backLink.getAttribute("href")).toBe("/");
  });
});
