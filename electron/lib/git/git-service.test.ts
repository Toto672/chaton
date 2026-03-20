import { describe, expect, it } from "vitest";
import { parsePorcelainStatus, parseStatusMatrix } from "./git-service.js";

describe("git-service status parsing", () => {
  it("distinguishes staged and unstaged changes from porcelain output", () => {
    const snapshot = parsePorcelainStatus([
      "M  staged-only.txt",
      " M unstaged-only.txt",
      "MM staged-and-unstaged.txt",
      "?? untracked.txt",
    ].join("\n"));

    expect(snapshot.hasStagedChanges).toBe(true);
    expect(snapshot.hasUncommittedChanges).toBe(true);
    expect(snapshot.status).toEqual([
      ["staged-only.txt", "staged"],
      ["unstaged-only.txt", "modified"],
      ["staged-and-unstaged.txt", "staged+modified"],
      ["untracked.txt", "untracked"],
    ]);
  });

  it("detects staged and unstaged changes independently from status matrix", () => {
    const snapshot = parseStatusMatrix([
      ["staged-only.txt", 1, 1, 2],
      ["unstaged-only.txt", 1, 2, 1],
      ["both.txt", 1, 2, 2],
      ["untracked.txt", 0, 2, 0],
    ]);

    expect(snapshot.hasStagedChanges).toBe(true);
    expect(snapshot.hasUncommittedChanges).toBe(true);
    expect(snapshot.status).toEqual([
      ["staged-only.txt", "staged"],
      ["unstaged-only.txt", "modified"],
      ["both.txt", "staged+modified"],
      ["untracked.txt", "untracked"],
    ]);
  });
});
