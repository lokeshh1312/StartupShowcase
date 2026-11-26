/**
 * @vitest-environment jsdom
 */

import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { db } from "@/db";
import { listStartups, getLeaderboard, setStartupPinned } from "@/server/startups";
import { pinStartupAction } from "@/server/actions";
import * as supabaseServer from "@/lib/supabase/server";
import { LeaderboardTable } from "@/components/startup/leaderboard-table";
import { AdminPanel } from "@/components/admin/admin-panel";
import type { FormattedStartup } from "@/server/startups";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
    [key: string]: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/components/startup/vote-button", () => ({
  VoteButton: ({ startupName }: { startupName: string }) => (
    <button data-testid={`vote-btn-${startupName}`} type="button">
      Like
    </button>
  ),
}));

// Helper to flatten Drizzle SQL chunks into a readable SQL string for assertions
function sqlToString(chunk: unknown): string {
  if (chunk === null || chunk === undefined) return "";
  if (typeof chunk === "string" || typeof chunk === "number" || typeof chunk === "boolean") {
    return String(chunk);
  }
  if (Array.isArray(chunk)) {
    return chunk.map(sqlToString).join("");
  }
  if (typeof chunk === "object") {
    const obj = chunk as { value?: unknown; queryChunks?: unknown[] };
    if (Array.isArray(obj.value)) {
      return obj.value.map(sqlToString).join("");
    }
    if (Array.isArray(obj.queryChunks)) {
      return obj.queryChunks.map(sqlToString).join("");
    }
  }
  return "";
}

describe("Admin Pin Startups - Ordering, Actions, Privacy & UI", () => {
  const adminId = "11111111-1111-4111-8111-111111111111";
  const nonAdminId = "22222222-2222-4222-8222-222222222222";
  const startupId = "33333333-3333-4333-8333-333333333333";

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("1. Ordering & Privacy in listStartups / getLeaderboard", () => {
    it("orders default 'votes' sort by sort_priority DESC first, before vote_agg.count DESC", async () => {
      vi.spyOn(db, "select").mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ total: 2 }]),
        }),
      } as never);

      const executeSpy = vi.spyOn(db, "execute").mockResolvedValueOnce([
        {
          id: startupId,
          name: "Pinned Zero Likes",
          slug: "pinned-zero",
          status: "approved",
          sort_priority: 10,
          vote_count: 0,
        },
        {
          id: "44444444-4444-4444-8444-444444444444",
          name: "Unpinned Popular",
          slug: "unpinned-popular",
          status: "approved",
          sort_priority: 0,
          vote_count: 50,
        },
      ] as never);

      const res = await listStartups({});
      expect(res.items).toHaveLength(2);
      expect(res.items[0].name).toBe("Pinned Zero Likes");

      const queryText = sqlToString(executeSpy.mock.calls[0][0]);
      expect(queryText).toContain("startups.sort_priority DESC");
      const sortPriorityIdx = queryText.indexOf("startups.sort_priority DESC");
      const voteCountIdx = queryText.indexOf("COALESCE(vote_agg.count, 0) DESC");
      expect(sortPriorityIdx).toBeGreaterThan(-1);
      expect(voteCountIdx).toBeGreaterThan(sortPriorityIdx);
    });

    it("ignores sort_priority for sort='recent' and sort='alphabetical'", async () => {
      for (const sort of ["recent", "alphabetical"] as const) {
        vi.spyOn(db, "select").mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([{ total: 1 }]),
          }),
        } as never);

        const executeSpy = vi.spyOn(db, "execute").mockResolvedValueOnce([
          {
            id: startupId,
            name: "Alpha",
            slug: "alpha",
            status: "approved",
            sort_priority: 10,
          },
        ] as never);

        await listStartups({ sort });
        const queryText = sqlToString(executeSpy.mock.calls[0][0]);
        expect(queryText).not.toContain("sort_priority");
        vi.restoreAllMocks();
      }
    });

    it("omits isPinned and sortPriority for non-admin listStartups and getLeaderboard calls", async () => {
      // listStartups without includePinned
      vi.spyOn(db, "select").mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ total: 1 }]),
        }),
      } as never);
      vi.spyOn(db, "execute").mockResolvedValueOnce([
        {
          id: startupId,
          name: "Pinned Secret",
          slug: "pinned-secret",
          status: "approved",
          sort_priority: 5,
          vote_count: 0,
        },
      ] as never);

      const listRes = await listStartups({});
      expect(listRes.items[0].isPinned).toBeUndefined();
      expect("isPinned" in listRes.items[0]).toBe(false);
      expect("sortPriority" in listRes.items[0]).toBe(false);
      expect("sort_priority" in listRes.items[0]).toBe(false);

      // getLeaderboard without includePinned
      vi.spyOn(db, "select").mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ total: 1 }]),
        }),
      } as never);
      vi.spyOn(db, "execute").mockResolvedValueOnce([
        {
          id: startupId,
          name: "Pinned Secret",
          slug: "pinned-secret",
          status: "approved",
          rank: 1,
          votes_count: 0,
          sort_priority: 5,
        },
      ] as never);

      const lbRes = await getLeaderboard("2026-10-01", 1, 20);
      expect(lbRes.items[0].isPinned).toBeUndefined();
      expect("isPinned" in lbRes.items[0]).toBe(false);
      expect("sortPriority" in lbRes.items[0]).toBe(false);
    });

    it("includes isPinned (without sortPriority) when includePinned=true is passed for admins", async () => {
      vi.spyOn(db, "select").mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ total: 2 }]),
        }),
      } as never);
      vi.spyOn(db, "execute")
        .mockResolvedValueOnce([
          {
            id: startupId,
            name: "Pinned One",
            slug: "pinned-one",
            status: "approved",
            rank: 1,
            votes_count: 0,
            sort_priority: 3,
          },
          {
            id: "44444444-4444-4444-8444-444444444444",
            name: "Normal One",
            slug: "normal-one",
            status: "approved",
            rank: 2,
            votes_count: 10,
            sort_priority: 0,
          },
        ] as never)
        .mockResolvedValueOnce([] as never);

      const lbRes = await getLeaderboard("2026-10-01", 1, 20, adminId, {
        includePinned: true,
      });
      expect(lbRes.items[0].isPinned).toBe(true);
      expect(lbRes.items[1].isPinned).toBe(false);
      expect("sortPriority" in lbRes.items[0]).toBe(false);
    });
  });

  describe("2. pinStartupAction & setStartupPinned", () => {
    it("rejects non-admin users", async () => {
      vi.spyOn(supabaseServer, "getCurrentUserProfile").mockResolvedValue({
        user: { id: nonAdminId } as never,
        profile: { id: nonAdminId, role: "community" } as never,
      });

      const res = await pinStartupAction(startupId, true);
      expect(res).toEqual({
        ok: false,
        error: "Forbidden: Admin privileges required.",
      });
    });

    it("rejects unauthenticated users", async () => {
      vi.spyOn(supabaseServer, "getCurrentUserProfile").mockResolvedValue(null);

      const res = await pinStartupAction(startupId, true);
      expect(res).toEqual({
        ok: false,
        error: "Forbidden: Admin privileges required.",
      });
    });

    it("rejects invalid startup UUID", async () => {
      vi.spyOn(supabaseServer, "getCurrentUserProfile").mockResolvedValue({
        user: { id: adminId } as never,
        profile: { id: adminId, role: "admin" } as never,
      });

      const res = await pinStartupAction("not-a-uuid", true);
      expect(res.ok).toBe(false);
    });

    it("rejects pinning non-approved startups", async () => {
      vi.spyOn(db, "select").mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{ role: "admin" }]),
          }),
        }),
      } as never);

      vi.spyOn(db, "transaction").mockImplementation(async (cb) => {
        const tx = {
          select: vi.fn().mockReturnValue({
            from: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue([{ id: startupId, status: "pending" }]),
              }),
            }),
          }),
        };
        return cb(tx as never);
      });

      await expect(setStartupPinned(startupId, true, adminId)).rejects.toThrow(
        "Only approved startups can be pinned."
      );
    });

    it("allows admin to pin and unpin an approved startup and writes audit_log", async () => {
      vi.spyOn(supabaseServer, "getCurrentUserProfile").mockResolvedValue({
        user: { id: adminId } as never,
        profile: { id: adminId, role: "admin" } as never,
      });

      vi.spyOn(db, "select").mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{ role: "admin" }]),
          }),
        }),
      } as never);

      const auditValuesSpy = vi.fn().mockResolvedValue(undefined);
      const txExecuteSpy = vi.fn().mockResolvedValue([{ id: startupId, sort_priority: 1 }]);

      vi.spyOn(db, "transaction").mockImplementation(async (cb) => {
        const tx = {
          select: vi.fn().mockReturnValue({
            from: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue([{ id: startupId, status: "approved" }]),
              }),
            }),
          }),
          execute: txExecuteSpy,
          insert: vi.fn().mockReturnValue({
            values: auditValuesSpy,
          }),
        };
        return cb(tx as never);
      });

      const pinRes = await pinStartupAction(startupId, true);
      expect(pinRes).toEqual({ ok: true });
      expect(sqlToString(txExecuteSpy.mock.calls[0][0])).toContain("MAX(s2.sort_priority)");
      expect(auditValuesSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          actorId: adminId,
          action: "startup.pin",
          targetType: "startup",
          targetId: startupId,
        })
      );

      // Unpin
      txExecuteSpy.mockResolvedValueOnce([{ id: startupId, sort_priority: 0 }]);
      const unpinRes = await pinStartupAction(startupId, false);
      expect(unpinRes).toEqual({ ok: true });
      expect(sqlToString(txExecuteSpy.mock.calls[1][0])).toContain("sort_priority = 0");
      expect(auditValuesSpy).toHaveBeenLastCalledWith(
        expect.objectContaining({
          actorId: adminId,
          action: "startup.unpin",
          targetType: "startup",
          targetId: startupId,
        })
      );
    });
  });

  describe("3. UI Privacy & Admin Controls", () => {
    const baseStartup: FormattedStartup & { rank?: number } = {
      id: startupId,
      name: "NovaFlow",
      slug: "novaflow",
      tagline: "Global workflow automation",
      ideaTitle: "NovaFlow Automation",
      description: "Automates global business workflows.",
      fullStory: "",
      category: "SaaS",
      countryCode: "US",
      region: "",
      city: "",
      remoteFirst: false,
      location: "",
      stage: "MVP",
      month: "2026-10-01",
      monthLabel: "October 2026",
      websiteUrl: "https://novaflow.example.com",
      logoType: "cpu",
      logoColor: "#2563EB",
      thumbnail: "",
      coverImage: "",
      founderJson: {},
      problem: "",
      solution: "",
      keyFeaturesJson: [],
      techStackJson: [],
      traction: "",
      viewsCount: 10,
      reviewedBy: null,
      approvedAt: new Date("2026-10-01"),
      createdAt: new Date("2026-10-01"),
      updatedAt: new Date("2026-10-01"),
      ownerId: "owner-1",
      isSample: false,
      status: "approved",
      likes: 0,
      views: 10,
      rank: 1,
    };

    it("renders zero pin markers, text, or attributes in LeaderboardTable for non-admin viewers", () => {
      const { container } = render(<LeaderboardTable startups={[baseStartup]} />);
      const html = container.innerHTML;
      expect(html.toLowerCase()).not.toContain("pinned");
      expect(container.querySelector('[aria-label*="pin" i]')).toBeNull();
      expect(container.querySelector('[title*="pin" i]')).toBeNull();
    });

    it("renders Pinned (admin only) icon in both mobile and desktop rows when isPinned=true", () => {
      const { container } = render(
        <LeaderboardTable startups={[{ ...baseStartup, isPinned: true }]} />
      );
      const pinMarkers = container.querySelectorAll('[aria-label="Pinned (admin only)"]');
      // One in mobile list, one in desktop list
      expect(pinMarkers).toHaveLength(2);
    });

    it("allows admin to toggle Pin / Unpin on Approved tab in AdminPanel", async () => {
      const actionsModule = await import("@/server/actions");
      const pinSpy = vi
        .spyOn(actionsModule, "pinStartupAction")
        .mockResolvedValue({ ok: true });

      render(
        <AdminPanel
          initialPending={[]}
          initialApproved={[
            {
              id: startupId,
              name: "NovaFlow",
              slug: "novaflow",
              tagline: "Global workflow automation",
              description: "Automates global business workflows.",
              category: "SaaS",
              stage: "MVP",
              countryCode: "US",
              createdAt: new Date("2026-10-01"),
              status: "approved",
              monthLabel: "October 2026",
              isPinned: false,
            },
          ]}
          initialRejected={[]}
          auditLogs={[]}
        />
      );

      fireEvent.click(screen.getByRole("button", { name: /Approved \(1\)/i }));
      const pinBtn = screen.getByRole("button", { name: "Pin NovaFlow" });
      fireEvent.click(pinBtn);

      await waitFor(() => {
        expect(pinSpy).toHaveBeenCalledWith(startupId, true);
      });
      expect(screen.getByRole("button", { name: "Unpin NovaFlow" })).toBeDefined();
    });
  });
});
