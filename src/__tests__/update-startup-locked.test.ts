import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { db } from "@/db";
import { updateStartup } from "@/server/startups";
import { updateStartupAction } from "@/server/actions";
import * as supabaseServer from "@/lib/supabase/server";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

describe("updateStartup & updateStartupAction - locked live listings", () => {
  const ownerId = "owner-123";
  const adminId = "admin-999";
  const startupId = "startup-123";
  const originalEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL;

  beforeEach(() => {
    vi.restoreAllMocks();
    delete process.env.NEXT_PUBLIC_CONTACT_EMAIL;
  });

  afterEach(() => {
    if (originalEmail !== undefined) {
      process.env.NEXT_PUBLIC_CONTACT_EMAIL = originalEmail;
    } else {
      delete process.env.NEXT_PUBLIC_CONTACT_EMAIL;
    }
  });

  function mockExistingStartup(status: string) {
    const existing = {
      id: startupId,
      ownerId,
      status,
      name: "Acme AI",
      slug: "acme-ai",
      tagline: "Old tagline",
      description: "Old description",
      thumbnail: "",
      coverImage: "",
      location: "Boston, MA, United States",
      countryCode: "US",
      region: "MA",
      city: "Boston",
      remoteFirst: false,
    };
    const mockLimit = vi.fn().mockResolvedValue([existing]);
    const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit });
    const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Drizzle mock in unit test
    vi.spyOn(db, "select").mockReturnValue({ from: mockFrom } as any);
    return existing;
  }

  function mockDbUpdateSuccess(updatedRow: Record<string, unknown>) {
    const mockReturning = vi.fn().mockResolvedValue([updatedRow]);
    const mockWhere = vi.fn().mockReturnValue({ returning: mockReturning });
    const mockSet = vi.fn().mockReturnValue({ where: mockWhere });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Drizzle mock in unit test
    vi.spyOn(db, "update").mockReturnValue({ set: mockSet } as any);
  }

  it("rejects owner editing an approved startup with the live listing message", async () => {
    mockExistingStartup("approved");

    await expect(
      updateStartup(startupId, { name: "Acme AI v2" }, ownerId, false)
    ).rejects.toThrow(
      "Live listings can be updated by our team. Email contact@startupshowcaseglobal.com with your changes."
    );
  });

  it("rejects owner editing a rejected startup with the non-editable message", async () => {
    mockExistingStartup("rejected");

    await expect(
      updateStartup(startupId, { name: "Acme AI v2" }, ownerId, false)
    ).rejects.toThrow(
      "This submission can no longer be edited here. Email contact@startupshowcaseglobal.com for help."
    );
  });

  it("returns the unmasked live listing error from updateStartupAction for an approved startup owner", async () => {
    mockExistingStartup("approved");
    vi.spyOn(supabaseServer, "getCurrentUserProfile").mockResolvedValue({
      user: { id: ownerId } as never,
      profile: { id: ownerId, role: "founder" } as never,
    });

    const res = await updateStartupAction(startupId, { name: "Acme AI v2" });
    expect(res).toEqual({
      error:
        "Live listings can be updated by our team. Email contact@startupshowcaseglobal.com with your changes.",
    });
  });

  it("allows admin to update an approved startup", async () => {
    const existing = mockExistingStartup("approved");
    const updatedRow = { ...existing, name: "Acme AI Admin Edit" };
    mockDbUpdateSuccess(updatedRow);

    const res = await updateStartup(
      startupId,
      { name: "Acme AI Admin Edit" },
      adminId,
      true
    );

    expect(res.name).toBe("Acme AI Admin Edit");
  });

  it("allows owner to update a pending startup", async () => {
    const existing = mockExistingStartup("pending");
    const updatedRow = { ...existing, name: "Acme AI Pending Edit" };
    mockDbUpdateSuccess(updatedRow);

    const res = await updateStartup(
      startupId,
      { name: "Acme AI Pending Edit" },
      ownerId,
      false
    );

    expect(res.name).toBe("Acme AI Pending Edit");
  });
});
