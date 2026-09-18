import { z } from "zod";
import { env } from "../../config/env.js";
import { AppError } from "../../utils/errors.js";
export const repositoryUrl = z
.string()
.url()
.regex(
    /^https: \/\/github\.com\/([\w.-]+)\/([\w.-]+)\/?$/ ,
    "Enter a public Github repository URL .",
);
const repositoryResponse = z.object({
    name: z.string(),
    description: z.string().nullable(),
    stargazers_count: z.number(),
    forks_count: z.number(),
    language: z.string().nullable(),
    updated_at: z.string(),
    html_url: z.string().url(),
    private: z.boolean().optional(),
});
async function githubFetch(path: string) {
    let result: Response;
    try {
        result = await fetch(`${env.GITHUB_API_URL}${path}`,{
            headers: {
                Accept: "application/vnd.github+json",
                "X-Github-Api-Version": "2022-11-28",
                ...(env.GITHUB_TOKEN
                    ? { Authorization: `Bearer ${env.GITHUB_TOKEN}` }
                    : {}
                )
            },
            signal: AbortSignal.timeout(10000),
        });
    } catch {
        throw new AppError(502, "Github is temporarily unavailable.");
    }
    if (result.status === 404)
        throw new AppError(404, "Repository is private, unavailable, or does not exist.");
    if ([403, 429].includes(result.status))
        throw new AppError(503, "Github rate limit reached. please try again later.",);
    if(!result.ok)
        throw new AppError(502, "Github could not load this repository.");
    return result.json() as Promise<unknown>;

}
export const githubService = {
    async repository(url: string) {
        const parsed = new URL(repositoryUrl.parse(url));
        const path = parsed.pathname.replace(/\/$/, "").replace(/\.git$/, "");
            try {
                const [raw, rawLanguage] = await Promise.all([
                    githubFetch(`/repos${path}`),
                    githubFetch(`/repos${path}/languages`),
                ]);
                const repo = repositoryResponse.parse(raw);
                if (repo.private)
                    throw new AppError(404, "Only repositories are supported.");
                return {
                    name: repo.name,
                    description: repo.description,
                    stars: repo.stargazers_count,
                    forks: repo.forks_count,
                    language: repo.language,
                    languages: Object.keys(z.record(z.number()).parse(rawLanguages)),
                    updatedAt: repo.updated_at,
                    url: repo.html_url,
                };
            } catch (error) {
                if (error instanceof AppError) throw error;
                throw new AppError(502, "Github returned an unexpected response.");
            }
    },
};