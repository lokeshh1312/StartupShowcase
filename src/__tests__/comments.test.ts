import { describe, it, expect } from "vitest";
import { validateCommentSpam } from "@/server/comments";

describe("validateCommentSpam heuristics", () => {
  it("allows standard helpful comments", () => {
    const text =
      "Great product and clean interface! Looking forward to testing the new API features once released.";
    expect(validateCommentSpam(text)).toEqual({ valid: true });
  });

  it("allows up to 2 links in a comment", () => {
    const text =
      "Check our demo at https://example.com/demo and docs at https://docs.example.com";
    expect(validateCommentSpam(text)).toEqual({ valid: true });
  });

  it("rejects comments with more than 2 links", () => {
    const text =
      "Links: https://link1.com and https://link2.com and also www.link3.com for more info.";
    const res = validateCommentSpam(text);
    expect(res.valid).toBe(false);
    expect(res.error).toMatch(/more than 2 links/i);
  });

  it("allows uppercase in short comments", () => {
    const text = "WOW THIS IS AMAZING!";
    expect(validateCommentSpam(text)).toEqual({ valid: true });
  });

  it("rejects excessive uppercase (>30%) on long comments", () => {
    const text =
      "THIS IS A VERY LONG SHOUTING MESSAGE THAT CONTAINS WAY TOO MANY CAPITAL LETTERS TO BE CONSIDERED NORMAL FEEDBACK FOR FOUNDERS.";
    const res = validateCommentSpam(text);
    expect(res.valid).toBe(false);
    expect(res.error).toMatch(/capital letters/i);
  });

  it("rejects comments exceeding 1,500 characters", () => {
    const longText = "a".repeat(1501);
    const res = validateCommentSpam(longText);
    expect(res.valid).toBe(false);
    expect(res.error).toMatch(/1,500 characters/i);
  });

  it("rejects empty comments", () => {
    expect(validateCommentSpam("").valid).toBe(false);
    expect(validateCommentSpam("   ").valid).toBe(false);
  });
});
