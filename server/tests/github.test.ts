import { afterEach, describe, expect, it, vi } from "vitest";
import { githubService } from "../src/modules/github/github.service.js";
afterEach(() => vi.unstubAllGlobals());
describe("GitHub REST service", () => {
  it("returns public repository metadata and languages", async () => {
    const mock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            name: "projecthub",
            description: "Student projects",
            stargazers_count: 5,
            forks_count: 2,
            language: "TypeScript",
            updated_at: "2026-01-01",
            html_url: "https://github.com/student/projecthub",
          }),
        ),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ TypeScript: 1000, CSS: 300 })),
      );
    vi.stubGlobal("fetch", mock);
    const repo = await githubService.repository(
      "https://github.com/student/projecthub",
    );
    expect(repo.stars).toBe(5);
    expect(repo.languages).toEqual(["TypeScript", "CSS"]);
    expect(mock.mock.calls[0][0]).toContain("/repos/student/projecthub");
  });
  it("rejects non-GitHub URLs before making a request", async () => {
    const mock = vi.fn();
    vi.stubGlobal("fetch", mock);
    await expect(
      githubService.repository("https://localhost/private"),
    ).rejects.toThrow();
    expect(mock).not.toHaveBeenCalled();
  });
  it.each([404, 403, 429, 500])("handles GitHub HTTP %s", async (status) => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("{}", { status })),
    );
    await expect(
      githubService.repository("https://github.com/student/projecthub"),
    ).rejects.toHaveProperty(
      "status",
      status === 404 ? 404 : status === 500 ? 502 : 503,
    );
  });
  it("handles timeouts", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("timeout")));
    await expect(
      githubService.repository("https://github.com/student/projecthub"),
    ).rejects.toHaveProperty("status", 502);
  });
});
