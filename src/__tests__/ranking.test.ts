import { describe, it, expect } from "vitest";

interface LeaderboardCandidate {
  id: string;
  name: string;
  votesCount: number;
  approvedAt: Date;
}

/**
 * Deterministic rank comparator matching SQL:
 * ORDER BY
 *   COUNT(v.user_id) DESC,
 *   COALESCE(s.approved_at, s.created_at) ASC,
 *   s.name ASC
 */
export function rankCandidates(
  candidates: LeaderboardCandidate[]
): Array<LeaderboardCandidate & { rank: number }> {
  const sorted = [...candidates].sort((a, b) => {
    // 1. Vote count DESC
    if (b.votesCount !== a.votesCount) {
      return b.votesCount - a.votesCount;
    }
    // 2. Earlier approval ASC
    const timeA = a.approvedAt.getTime();
    const timeB = b.approvedAt.getTime();
    if (timeA !== timeB) {
      return timeA - timeB;
    }
    // 3. Name ASC (alphabetical)
    return a.name.localeCompare(b.name);
  });

  return sorted.map((item, index) => ({
    ...item,
    rank: index + 1,
  }));
}

describe("Leaderboard Ranking Tie-Breaks", () => {
  it("ranks startups primarily by vote count descending", () => {
    const list: LeaderboardCandidate[] = [
      { id: "1", name: "Startup Low", votesCount: 50, approvedAt: new Date("2026-10-01T10:00:00Z") },
      { id: "2", name: "Startup High", votesCount: 500, approvedAt: new Date("2026-10-01T12:00:00Z") },
      { id: "3", name: "Startup Mid", votesCount: 200, approvedAt: new Date("2026-10-01T08:00:00Z") },
    ];

    const ranked = rankCandidates(list);
    expect(ranked[0].id).toBe("2"); // 500 votes
    expect(ranked[0].rank).toBe(1);
    expect(ranked[1].id).toBe("3"); // 200 votes
    expect(ranked[1].rank).toBe(2);
    expect(ranked[2].id).toBe("1"); // 50 votes
    expect(ranked[2].rank).toBe(3);
  });

  it("breaks vote ties using earlier approval timestamp (earlier first)", () => {
    const list: LeaderboardCandidate[] = [
      {
        id: "late-approval",
        name: "Zeta Health",
        votesCount: 100,
        approvedAt: new Date("2026-10-05T15:00:00Z"),
      },
      {
        id: "early-approval",
        name: "Alpha Clean",
        votesCount: 100, // Tied votes
        approvedAt: new Date("2026-10-01T09:00:00Z"), // 4 days earlier
      },
    ];

    const ranked = rankCandidates(list);
    expect(ranked[0].id).toBe("early-approval");
    expect(ranked[0].rank).toBe(1);
    expect(ranked[1].id).toBe("late-approval");
    expect(ranked[1].rank).toBe(2);
  });

  it("breaks simultaneous timestamp ties using alphabetical name (A before Z)", () => {
    const sameTime = new Date("2026-10-02T12:00:00Z");
    const list: LeaderboardCandidate[] = [
      { id: "z-corp", name: "Zenith Agri", votesCount: 250, approvedAt: sameTime },
      { id: "a-corp", name: "AeroSolar", votesCount: 250, approvedAt: sameTime },
      { id: "m-corp", name: "MetaBio", votesCount: 250, approvedAt: sameTime },
    ];

    const ranked = rankCandidates(list);
    expect(ranked.map((r) => r.name)).toEqual(["AeroSolar", "MetaBio", "Zenith Agri"]);
    expect(ranked.map((r) => r.rank)).toEqual([1, 2, 3]);
  });

  it("handles complex multi-level ties correctly", () => {
    const t1 = new Date("2026-10-01T00:00:00Z");
    const t2 = new Date("2026-10-02T00:00:00Z");

    const list: LeaderboardCandidate[] = [
      { id: "1", name: "Bravo", votesCount: 300, approvedAt: t2 },
      { id: "2", name: "Alpha", votesCount: 300, approvedAt: t1 }, // Higher than Bravo because t1 < t2
      { id: "3", name: "Charlie", votesCount: 300, approvedAt: t1 }, // Lower than Alpha because 'Alpha' < 'Charlie'
      { id: "4", name: "Winner", votesCount: 1000, approvedAt: t2 }, // Rank 1 by votes
      { id: "5", name: "Delta", votesCount: 50, approvedAt: t1 }, // Rank 5
    ];

    const ranked = rankCandidates(list);
    expect(ranked.map((r) => r.name)).toEqual([
      "Winner",
      "Alpha",
      "Charlie",
      "Bravo",
      "Delta",
    ]);
  });
});
