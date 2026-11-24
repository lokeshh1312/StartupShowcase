import { describe, it, expect, vi, beforeEach } from "vitest";
import { db } from "@/db";
import {
  getLikedStartupIds,
  getLeaderboard,
  listStartups,
  getSaved,
  getUserPublicProfile,
  toggleVote,
  listAdminStartups,
  getAdminStartupVoteStats,
  getStartupBySlug,
} from "@/server/startups";
import { voteAction } from "@/server/actions";
import * as authServer from "@/lib/supabase/server";
import * as rateLimitModule from "@/server/rate-limit";

// Mock next/headers
vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue(new Map()),
}));

// Mock next/cache
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

describe("Likes and Voting Integrity", () => {
  const mockUserId = "11111111-1111-1111-1111-111111111111";
  const mockStartupId1 = "22222222-2222-2222-2222-222222222222";
  const mockStartupId2 = "33333333-3333-3333-3333-333333333333";

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("1. List functions set isLiked from startup_votes for the user and not for anonymous", () => {
    it("getLikedStartupIds returns a Set of liked startup IDs for a logged-in user in one query", async () => {
      const executeSpy = vi.spyOn(db, "execute").mockResolvedValueOnce([
        { startup_id: mockStartupId1 },
      ] as never);

      const likedSet = await getLikedStartupIds(mockUserId, [mockStartupId1, mockStartupId2]);

      expect(executeSpy).toHaveBeenCalledTimes(1);
      expect(likedSet.has(mockStartupId1)).toBe(true);
      expect(likedSet.has(mockStartupId2)).toBe(false);
    });

    it("getLikedStartupIds returns empty Set without running a query when startupIds is empty", async () => {
      const executeSpy = vi.spyOn(db, "execute");

      const likedSet = await getLikedStartupIds(mockUserId, []);

      expect(executeSpy).not.toHaveBeenCalled();
      expect(likedSet.size).toBe(0);
    });

    it("getLeaderboard sets isLiked=true for liked startups and false for others when currentUserId is provided", async () => {
      // Mock db.select for total count
      vi.spyOn(db, "select").mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ total: 2 }]),
        }),
      } as never);

      // Mock db.execute for monthly_leaderboard and then getLikedStartupIds
      vi.spyOn(db, "execute")
        .mockResolvedValueOnce([
          {
            id: mockStartupId1,
            name: "Alpha Startup",
            slug: "alpha-startup",
            rank: 1,
            likes: 10,
            views_count: 50,
            status: "approved",
            month: "2026-10-01",
          },
          {
            id: mockStartupId2,
            name: "Beta Startup",
            slug: "beta-startup",
            rank: 2,
            likes: 5,
            views_count: 20,
            status: "approved",
            month: "2026-10-01",
          },
        ] as never)
        .mockResolvedValueOnce([
          { startup_id: mockStartupId1 },
        ] as never);

      const result = await getLeaderboard("2026-10-01", 1, 20, mockUserId);

      expect(result.items).toHaveLength(2);
      expect(result.items[0].id).toBe(mockStartupId1);
      expect(result.items[0].isLiked).toBe(true);
      expect(result.items[1].id).toBe(mockStartupId2);
      expect(result.items[1].isLiked).toBe(false);
    });

    it("getLeaderboard sets isLiked=false for anonymous visitors without querying startup_votes", async () => {
      vi.spyOn(db, "select").mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ total: 1 }]),
        }),
      } as never);

      const executeSpy = vi.spyOn(db, "execute").mockResolvedValueOnce([
        {
          id: mockStartupId1,
          name: "Alpha Startup",
          slug: "alpha-startup",
          rank: 1,
          likes: 10,
          views_count: 50,
          status: "approved",
          month: "2026-10-01",
        },
      ] as never);

      const result = await getLeaderboard("2026-10-01", 1, 20); // no currentUserId

      expect(result.items).toHaveLength(1);
      expect(result.items[0].isLiked).toBe(false);
      // Only the monthly_leaderboard query should have run, no getLikedStartupIds query
      expect(executeSpy).toHaveBeenCalledTimes(1);
    });

    it("listStartups stamps isLiked from getLikedStartupIds when currentUserId is provided", async () => {
      vi.spyOn(db, "select").mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ total: 1 }]),
        }),
      } as never);

      vi.spyOn(db, "execute")
        .mockResolvedValueOnce([
          {
            id: mockStartupId1,
            name: "Alpha Startup",
            slug: "alpha-startup",
            status: "approved",
          },
        ] as never)
        .mockResolvedValueOnce([
          { startup_id: mockStartupId1 },
        ] as never);

      const result = await listStartups({}, mockUserId);

      expect(result.items).toHaveLength(1);
      expect(result.items[0].isLiked).toBe(true);
    });

    it("listStartups sets isLiked=false when no user is provided", async () => {
      vi.spyOn(db, "select").mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ total: 1 }]),
        }),
      } as never);

      const executeSpy = vi.spyOn(db, "execute").mockResolvedValueOnce([
        {
          id: mockStartupId1,
          name: "Alpha Startup",
          slug: "alpha-startup",
          status: "approved",
        },
      ] as never);

      const result = await listStartups({});

      expect(result.items).toHaveLength(1);
      expect(result.items[0].isLiked).toBe(false);
      expect(executeSpy).toHaveBeenCalledTimes(1);
    });

    it("getSaved stamps isLiked from getLikedStartupIds", async () => {
      vi.spyOn(db, "execute")
        .mockResolvedValueOnce([{ total: 1 }] as never) // countResult
        .mockResolvedValueOnce([
          {
            id: mockStartupId1,
            name: "Saved Startup",
            slug: "saved-startup",
            status: "approved",
          },
        ] as never) // rows
        .mockResolvedValueOnce([
          { startup_id: mockStartupId1 },
        ] as never); // getLikedStartupIds

      const result = await getSaved(mockUserId);

      expect(result.items).toHaveLength(1);
      expect(result.items[0].isLiked).toBe(true);
      expect(result.items[0].isSaved).toBe(true);
    });

    it("getUserPublicProfile sets isLiked when currentUserId is provided", async () => {
      vi.spyOn(db, "select").mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValueOnce([
              { id: mockUserId, displayName: "Jane Doe", role: "founder", createdAt: new Date() },
            ]),
            orderBy: vi.fn().mockResolvedValueOnce([
              {
                id: mockStartupId1,
                name: "Jane Project",
                slug: "jane-project",
                status: "approved",
                ownerId: mockUserId,
              },
            ]),
          }),
        }),
      } as never);

      vi.spyOn(db, "execute").mockResolvedValueOnce([
        { startup_id: mockStartupId1 },
      ] as never);

      const result = await getUserPublicProfile(mockUserId, "viewer-uuid-4444");

      expect(result).not.toBeNull();
      expect(result?.startups).toHaveLength(1);
      expect(result?.startups[0].isLiked).toBe(true);
    });
  });

  describe("2. Safe Vote Toggle (desiredLiked state)", () => {
    it("desiredLiked=true on an already-liked startup keeps it liked without deletion", async () => {
      // Mock isUserEmailVerified
      vi.spyOn(db, "execute").mockResolvedValue([
        { email_confirmed_at: "2026-10-01T00:00:00Z" },
      ] as never);

      // Mock startup query
      vi.spyOn(db, "select").mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([
              {
                id: mockStartupId1,
                status: "approved",
                ownerId: "someone-else-uuid",
              },
            ]),
          }),
        }),
      } as never);

      let executedDelete = false;
      let executedInsert = false;

      // Mock transaction
      vi.spyOn(db, "transaction").mockImplementation(async (cb) => {
        const txMock = {
          execute: vi
            .fn()
            .mockImplementationOnce(() => {
              executedInsert = true;
              return Promise.resolve([]);
            })
            .mockResolvedValueOnce([{ count: 15 }]),
          delete: vi.fn().mockReturnValue({
            where: vi.fn().mockImplementation(() => {
              executedDelete = true;
              return Promise.resolve();
            }),
          }),
        };
        return cb(txMock as never);
      });

      const res = await toggleVote(mockStartupId1, mockUserId, true);

      expect(res.liked).toBe(true);
      expect(res.likesCount).toBe(15);
      expect(executedInsert).toBe(true);
      expect(executedDelete).toBe(false);
    });

    it("desiredLiked=false removes the vote", async () => {
      vi.spyOn(db, "execute").mockResolvedValue([
        { email_confirmed_at: "2026-10-01T00:00:00Z" },
      ] as never);

      vi.spyOn(db, "select").mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([
              {
                id: mockStartupId1,
                status: "approved",
                ownerId: "someone-else-uuid",
              },
            ]),
          }),
        }),
      } as never);

      let executedDelete = false;

      vi.spyOn(db, "transaction").mockImplementation(async (cb) => {
        const txMock = {
          execute: vi.fn().mockResolvedValueOnce([{ count: 14 }]),
          delete: vi.fn().mockReturnValue({
            where: vi.fn().mockImplementation(() => {
              executedDelete = true;
              return Promise.resolve();
            }),
          }),
        };
        return cb(txMock as never);
      });

      const res = await toggleVote(mockStartupId1, mockUserId, false);

      expect(res.liked).toBe(false);
      expect(res.likesCount).toBe(14);
      expect(executedDelete).toBe(true);
    });

    it("rewords the founder self-vote error to 'Founders can\\'t like their own startup.'", async () => {
      vi.spyOn(db, "execute").mockResolvedValueOnce([
        { email_confirmed_at: "2026-10-01T00:00:00Z" },
      ] as never);

      vi.spyOn(db, "select").mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([
              {
                id: mockStartupId1,
                status: "approved",
                ownerId: mockUserId, // same as voter
              },
            ]),
          }),
        }),
      } as never);

      await expect(toggleVote(mockStartupId1, mockUserId, true)).rejects.toThrow(
        "Founders can't like their own startup."
      );
    });
  });

  describe("3. Rate Limiting", () => {
    it("calls checkRateLimit exactly once per vote toggle (in voteAction, not duplicated in toggleVote)", async () => {
      vi.spyOn(authServer, "getCurrentUser").mockResolvedValue({
        id: mockUserId,
        email_confirmed_at: "2026-10-01T00:00:00Z",
      } as never);

      const rateLimitSpy = vi
        .spyOn(rateLimitModule, "checkRateLimit")
        .mockResolvedValue({ allowed: true, count: 1, maxCount: 30, resetInSeconds: 3600 });

      // Mock db calls for toggleVote
      vi.spyOn(db, "execute").mockResolvedValue([
        { email_confirmed_at: "2026-10-01T00:00:00Z" },
      ] as never);

      vi.spyOn(db, "select").mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([
              {
                id: mockStartupId1,
                status: "approved",
                ownerId: "someone-else-uuid",
              },
            ]),
          }),
        }),
      } as never);

      vi.spyOn(db, "transaction").mockImplementation(async (cb) => {
        const txMock = {
          execute: vi.fn().mockResolvedValue([{ count: 10 }]),
          delete: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue(undefined),
          }),
        };
        return cb(txMock as never);
      });

      const res = await voteAction(mockStartupId1, true);

      expect("error" in res && res.error).toBeFalsy();
      if ("success" in res) {
        expect(res.success).toBe(true);
      }
      expect(rateLimitSpy).toHaveBeenCalledTimes(1);
      expect(rateLimitSpy).toHaveBeenCalledWith(`vote:user:${mockUserId}`, 30, 3600);
    });
  });

  describe("4. Admin vs Non-admin Likes Visibility", () => {
    it("listAdminStartups returns countedLikes and totalLikes grouped for admins", async () => {
      // Mock admin profile check
      vi.spyOn(db, "select")
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([{ role: "admin" }]),
            }),
          }),
        } as never)
        // Mock total count
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([{ total: 1 }]),
          }),
        } as never)
        // Mock rows query
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            leftJoin: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                orderBy: vi.fn().mockReturnValue({
                  limit: vi.fn().mockReturnValue({
                    offset: vi.fn().mockResolvedValue([
                      {
                        startup: {
                          id: mockStartupId1,
                          name: "Test Admin Startup",
                          status: "approved",
                        },
                        payment: null,
                        ownerEmail: "owner@test.com",
                        effectivePlan: null,
                        upgradePaidCents: 0,
                      },
                    ]),
                  }),
                }),
              }),
            }),
          }),
        } as never);

      // Grouped vote query
      vi.spyOn(db, "execute").mockResolvedValueOnce([
        {
          startup_id: mockStartupId1,
          counted_likes: 12,
          total_votes: 14,
        },
      ] as never);

      const result = await listAdminStartups("approved", mockUserId);

      expect(result.items).toHaveLength(1);
      expect(result.items[0].countedLikes).toBe(12);
      expect(result.items[0].totalLikes).toBe(14);
    });

    it("getAdminStartupVoteStats returns countedLikes and totalLikes", async () => {
      vi.spyOn(db, "execute").mockResolvedValueOnce([
        {
          counted_likes: 25,
          total_votes: 30,
        },
      ] as never);

      const stats = await getAdminStartupVoteStats(mockStartupId1);

      expect(stats.countedLikes).toBe(25);
      expect(stats.totalLikes).toBe(30);
    });

    it("non-admin getStartupBySlug payload contains no totalLikes or countedLikes vote counts", async () => {
      vi.spyOn(db, "select")
        // startup query
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([
                {
                  id: mockStartupId1,
                  slug: "test-slug",
                  name: "Public Startup",
                  status: "approved",
                  viewsCount: 100,
                  isSample: false,
                },
              ]),
            }),
          }),
        } as never)
        // user vote query
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([]),
            }),
          }),
        } as never)
        // user save query
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([]),
            }),
          }),
        } as never)
        // comments query
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            leftJoin: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                orderBy: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue([]),
                }),
              }),
            }),
          }),
        } as never);

      // vote count result
      vi.spyOn(db, "execute").mockResolvedValueOnce([
        { count: 12 },
      ] as never);

      const data = await getStartupBySlug("test-slug", mockUserId);

      expect(data).not.toBeNull();
      const startup = data!.startup as Record<string, unknown>;
      // Standard public likes count is present
      expect(startup.likes).toBe(12);
      // Total uncounted votes must NEVER be on the public startup payload
      expect(startup.totalLikes).toBeUndefined();
      expect(startup.countedLikes).toBeUndefined();
      expect(startup.totalVotes).toBeUndefined();
    });
  });
});
