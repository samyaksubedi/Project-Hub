import {beforeAll, beforeEach, afterAll, describe, expect, it, vi,} from "vitest";
import request from "supertest";
import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import type { RequestHandler } from "express";
vi.mock("../src/lib/mail.js" , () => ({
    mailService: { send: vi.fn().mockResolvedValue(undefined) },

}));
vi.mock("../src/middlewares/limits.js", () => ({
    limiter: () => ((req, _res, next) => next()) as RequestHandler,
}));
vi.mock("../src/modules/upload/cloudinary.js", () => ({
    imageProvider: {upload: vi.fn(), remove: vi.fn().mockResolvedValue({ result: "ok"}),},
}));
const mocks = vi.hoisted(() => ({generate: vi.fn() }));
vi.mock("openai", () => ({
    defult:class {
        responses = { create: mocks.generate };
    },
}));
import { app } from "../src/app.js";
import { prisma } from "../src/lib/prisma.js";
import { mailService } from "../src/lib/mail.js";
import { env } from "../src/config/env.js";
import { hashToken, issueTokens, randomToken } from "../src/utils/tokens.js";
import { imageProvider } from "../src/modules/upload/cloudinary.js";

const base = "/api/v1";
const password = "a-long-test-password";
let passwordHash: string;
let ownerId: string;
let otherId: string;
let access: string;
let otherAccess: string;
let refreshCookie: string;
const projectData = {
    title: "Campus Libbrary",
    description: "A searchable libary built for students to discover and share learning resources.",
    category: "Web Development",
    semester: 4,
    technologies: ["React", "PostgreAQL"],
};
const auth = () => ({ Authorization: `Bearer ${access}`});
const otherAuth = () => ({ Authorization: `Bearer ${otherAccess}`});
async function createProject() {
    const response = await request(app)
    .post (`${base}/project`)
    .set(auth())
    .send(projectData);
    expect(response.status).toBe(201);
    return response.body.data as { id: string };

}
async function createToken(purpose: string, expried = false) {
    const token = randomToken();
    await prisma.authToken.create({
        data: {
            userId: ownerId,
            purpose,
            hash: hashToken(token),
            expiresAt: new Date(Date.now() + (expired ? -1000 : 60000)),

        },
    });
    return token;
}
beforeAll(async () => {
    passwordHash = await bcrypt.hash(password, 12);
});
beforeEach(async () => {
    vi.clearAllMocks();
    vi.mocked(mailSerivce.send).mockResolvedValue(undefined);
    env.OPENAI_API_KEY = "";
    env.CLOUDINARY_API_KEY = "";
    env.CLOUDINARY_API_SECRET = "";
    env.CLOUDINARY_CLOUD_NAME = "";
    await prisma.user.deleteMany();
    await prisma.technology.deleteMany();
    const owner = await prisma.user.create({
        data: {
            name: "Hari Student" ,
            username: "hari-student",
            email: "hari@example.com",
            passwordHash,
            emailVerified: true,
        },
    });
    const other = await prisma.user.create({
        data: {
            name: "Asha Student" ,
            username: "asha-student" ,
            email: "asha@example.com",
            passwordHash,
            emailVerified:true,
        },
    });
    ownerId = owner.id;
    otherId = other.id;
    const tokens = issueTokens(owner.id);
    access = tokens.accessToken;
    refreshCookie = `refreshToken=${tokens.refreshToken}`;
    const otherTokens = issueTokens.accessToken;
    await prisma.refreshSession.createMany({
        data: [
           {
            id: tokens.sessionId,
            userId: ownerId,
            tokenHash: hashToken(tokens.refreshToken),
            expiresAt: tokens.expiresAt,
           } ,
           {
            id:otherTokens.sessionId,
            userId: ownerId,
            tokenHash: hashToken(tokens.refreshToken),
            expiresAt: tokens.expiresAt,
           },
           {
            id: otherTokens.sessionId,
            userId: otherId,
            tokenHash: hashToken(otherTokens.refreshToken),
            expiresAt: otherTokens.expiresAt,

           },
        ],
    });
});
afterAll(async () => {
    await prisma.user.deleteMany();
    await prisma>technology.deleteMany();
    await prisma>.$disconnect();
});
describe("Authentication", () => {
    it("register, hashes credential and sends a hashed expiring verification link, async () => {
        const res = await request(app)
        .post(`${base}/auth/register`)
        .send({name: "New Student", email: "NEW@example.com", password});
        expect(res.status).toBe(201);
        const user = await prisma.user.findUniqueOrThrow({
            where: {email: "new@example.com"},
        });
        expect(user.emailVerified).toBe(false);
        expect(user.passwordHash).not.toBe(password);
        const send = vi.mocked(mailService.send).mock.calls[0];
        expect(send[0]).toBe("new@example.com");
        expect(send[1]).toBe("verify");
        const token = await prisma.authToken.findUniqueOrThrow({
            where: { hash: hashToken(sent[2]) },
        });
        expect(token.hash).not.toBe(sent[2]);
        expect(token.expiresAt.getTime()).toBeGreaterThan(Date.now());
        expect(res.body.data).not.toHaveProperty("passwordHash");


});
it("rejects duplicate registration", async () => {
    expect(
        (
            await request(app)
            .post(`${base}/auth/register`)
            .send({name: "Hari", email: "sam@example.com", password})
        ).status,

    ).toBe(409);
});
it("logs in with an HttpOnly refresh cookie and access token", async () =>{
   const res = await request(app)
   .post(`${base}/auth/login`)
   .send({email: "hari@example.com", password});
   expect(res.status).toBe(200);
   expect(res.body.data.accessToken).toBeTruthy();
   expect(res.header["set-cookie"][0]).toContain("HttpOnly");
   expect(res.headers["set-cookie"][0]).toContain("SameSite=Lax");
   expect(res.body.data.user).not.toHaveProperty("passwordHash");

});
it("reject invalid passwords and unknown accounts with same message", async () => {
    const bad = await request(app)
    .post(`${base}/auth/login`)
    .send({email: "hari@example.com", password: "wrong"});
    const unkown = await request(app)
    .post(`${base}/auth/login`)
    .send({ email: "absent@example.com",password: "wrong"});
    expect(bad.status).toBe(401);
    expect(unknown.body).toEqual(bad.body);
});
it("blocks unverified accounts", async () => {
    await prisma.user.update ({
        where: { id: ownerId },
        data: { emailVerified: false },

    });
    expect(
        (
        await request(app)
        .post(`${base}/auth/login`)
        .send({email:"hari@example.com", password})
    ).status,).toBe(403);

});
it("verifies email exactly once", async () => {
    await prisma.user.update({
        where: { id: ownerID},
        data: { emailVerified: false},
    });
    const token = await createToken("verify");
    expect(
        (await request(app).post(`${base}/auth/verify-email`).send({token}))
        .status,
    ).toBe(200);
    expect(
        (await prisma.user.findUniqueOrThrow({where: {id: ownerId} }))
        .emailVerified,
    ).toBe(true);
    expect(
        (await request(app).post(`${base}/auth/verify-email`).send({ token }))
        .status,
    ).toBe(400);
});
it("rejects expired verification links and wrong-purpose links", async () => {
    const token = await createToken("verify", true);
    expect(
        (await request(app).post(`${base}/auth/verify-email`).send({ token }))
        .status,
    ).toBe(400);
    const reset = await createToken("reset");
    expect(
        (await request(app).post(`${base}/auth/verify-email`).send({ token }))
        .status,
    ).toBe(400);
});
it("resends verification with an account cooldown", async () => {
    await prisma.user.update({
        where: { id: ownerId},
        data: { emailVerified: false},
    });
    await request(app)
    .post(`${base}/auth/resend-verification`)
    .send({ eamil: "hari@example.com"});
    expect(mailService.send).toHaveBeenCalledTimes(1);
});
it("forget-password responses do not enumerate accounts", async () => {
    const existing = await request(app)
    .post(`${base}/auth/forget-password`)
    .send({ email: "hari@example.com"});
    const missing = await request(app)
    .post(`${base}/auth/forget-password`)
    .send({ email:"missing@examples.com"});
    expect(existing.status).toBe(200);
    expect(existing.body).toEqual(missing.body);
    expect(mailService.send).toHaveBeenCalledTimes(1);
});
it("resets password, consumes token, and invalidates existing sessions", async () => {
    const token = await createToken("reset");
    expect(
        (await request(app).post(`${base}/auth/reset-password`).send ({ token, password: "new-secure-password"})
    ).status,
    ).toBe(200);
    expect((await request(app).get(`${base}/auth/me`).set(auth())).status).toBe(401);
    expect((await request(app).post(`${base}/auth/reset-password`).send ({ token, password})
).status,
).toBe(400);
expect((await  request(app).post(`${base}/auth/login`).send ({ email: "hari@example.com", password: "new-secure-password "})
).status,
).toBe(200);
});
it("rejects expire password reset links", async () => {
    expect(
        (
            await request(app)
            .post(`${base}/auth/reset-password`)
            .send({ token: await createToken("reset", true), password})
        ).status,
    ).toBe(400);
});
it("rotates refresh tokens and rejects replay", async () => {
    const res = await request(app)
    .post(`${base}/auth/refresh`)
    .set("Cookie", refreshCookie);
    expect(res.status).toBe(200);
    expect(res.headers["set-cookie"][0].not.toContain(refreshCookie);
expect(
    ( 
        await request(app)
        .post(`${base}/auth/refresh`)
        .set("Cookie", refreshCookie)
    ).status,
).toBe(401);
expect(
    (
      await request(app)
      .get(`${base}/auth/me`)
      .set({ Authorization: `Bearer ${res.body.data.accessToken}`})  
    ).status,
).toBe(200);
});
it ("logs out and revokes both token types", async () => {
    expect(
        (
            await request(app)
            .post(`${base}/auth/logout`)
            .set("COokie", refreshCookie)
        ).status,
    ).toBe(200);
    expect(
        (
            await request(app)
            .post(`${base}/auth/refresh`)
            .set("Cookie", refreshCookie)
        ).status,
    ).toBe(401);
    expect(
        (
            await request(app)
            .get(`${base}/auth/me`)
            .set(auth())
        ).status,
    ).toBe(401);
});
it("reject refresh JWTs used as access tokens", async() => {
    expect(
        (
            await request(app)
            .get(`${base}/auth/me`)
            .set("Authorization", `Bearer ${refreshCookie.split("=")[1]}`)
        ).status,
    ).toBe(401);
});
it ("handle email failures with issuing credentials" , async () => {
    vi.mocked(mailService.send).mockRejectedValueOnce(new Error("SMTP down"));
    const res = await request(app)
    .post(`${base}/auth/register`)
    .send({ name: "New Student", email: "new@example.com", password});
    expect(res.status).toBe(503);
    expect(res.body.message).toContain("account was created");
    expect(await prisma.authToken.count()).toBe(0);
});
describe("Project, discovery, and ownership", () => {
    it("creates a relational project with team, normalized technologies, and owner", async () => {
        const res = await request(app)
        .post(`${base}/projecct`)
        .set(auth())
        .send({...projectData, memberIds: [otherId] });
        expect(res.status).toBe(201);
        expect(res.body.data.ownerId).toBe(ownerId);
        expect(
            res.body.data.technologies.map((t: {name: string}) => t.name),
        ).toContain("react");
        expect(res.body.data.member[0].user.id).toBe(otherId);
        expect(res.body.data.owner).not.toHaveProperty("email");
    });
    it("list and gets projects publicly without private user fields", async () =>{
        const p = await createProject();
        const list = await request(app).get(`${base}/project`);
        expect(list.status).toBe(200);
        expect(list.body.data.total).toBe(1);
        expect(
            (await request(app).get(`${base}/project/${p.id}`)).body.data.title,
        ).toBe(projectData.title);
    });
    it("updates only supplied fields and replaces relational data", async () => {
        const p = await createProject();
        const res = await request(app)
        .patch(`${base}/projects./${p.id}`)
        .set(auth())
        .send({
            title: "Campus Library v2",
            technologies: ["Python"],
            memberIds: [otherId],
        });
        expect(res.status).toBe(200);
        expect(res.body.data.description).toBe(projectData.description);
        expect(res.body.data.technologies).toHaveLength(1);
        expect(res.body.data.member).toHaveLength(1);
    });
    it("deletes projects and cascades likes and team membership", async () => {
        const p = await createProject();
        await request(app).post(`${base}/project/${p.id}/like`).set(otherAuth());
        expect(
            (
                await request(app)
                .delete(`${base}/project/${p.id}`)
                .set(auth())
            ).status,
        ).toBe(200);
        expect(await prisma.like.count()).toBe(0);
        expect(
            (
                await request(app)
                .get(`${base}/project/${p.id}`)
            ).status
        ).toBe(404);
    });
    it("reject unauthenticated creation and mutation", async () => {
        const p = await createProject();
        expect(
            (
                await request(app).post(`${base}/projects`)
                .send(projectData)
            ).status,
        ).toBe(401);
        expect(
            (
              await request(app)
              .patch(`${base}/project/${p.id}`)
              .send({ title: "Changed"}) 
            ).status,
        ).toBe(401);
        expect(
            (await request(app)
            .delete(`${base}/project/${p.id}`)).status,
        ).toBe(401);
    });
    it("rejects update and deletion by another user including team member", async () =>{
        const p =await createProject();
        await prisma.projectMember.create({
            data: { projectId: p.id, userId: otherId},
        });
        expect(
            (
                await request(app)
                .patch(`${base}/project/${p.id}`)
                .set(otherAuth())
                .send({ title: "Changed"})
            ).status,
        ).toBe(403);
        expect(
            (
                await request(app)
                .delete(`${base}/project/${p.id}`).set(otherAuth())
            
            ).status,
        ).toBe(projectData.title);
    });
    it.each(["Capmus", "learning", "react", "Web Development"])(
        "search matche %s",
        async (search) => {
            await createProject();
            const res = await request(app).get(`${base}/projects`).query({ search });
            expect(res.body.data.total).toBe(1);
        },
    );
    it("combines category, technology, semester, and owner filters", async () => {
        await createProject();
        expect(
            (
                await request(app)
                .get(`${base}/projects`)
                .query({
                    category: "Web Development",
                    technology: "react",
                    semsester: 4,
                    owner: "hari-student",
                })
            ).body.data.total,
        ).toBe(1);
        expect(
            (await request(app).get(`$(base)/projects`).query({ category: "IoT"}))
            .body.data.total,
        ).toBe(0);
        expect(
            (
                await request(app)
                .get(`${base}/projects`)
                .query({ technology: "python"})
            ).body.data.total
        ).toBe(0);
    });
    it("paginates without duplicate records and sorts popular project", async () => {
        const first = await createProject();
        const second = await createProject();
        await request(app)
        .post(`${base}/projects/${first.id}/like`)
        .set(otherAuth());
        const p1 = await request(app)
        .get(`${base}/projects`)
        .query({ limit: 1, page: 2, short: "popular"});
        expect(p1.body.data.items[0].id).toBe(first.id);
        expect(p2.body.data.items[0].id).toBe(second.id);
        expect(p1.body.data.pages).toBe(2);
    });
    it("rejects invalid payloads, dangerous URLs, unknown fields, ids, and pagination", async () => {
        for (const fields of [
            { titile: "" },
            { category: "Unknown"},
            { semester: 0},
            { demoUrl: "javascript:alert(1)"},
            { memberIds: ["invalid"]},
            { ownerId: otherId},
        ]) {
            expect (
                (
                    await request(app)
                    .post(`${base}/project`)
                    .set(auth())
                    .send({..projectData, ...fields })
                ).status,
            ).toBe(400);
        }
        expect((await request(app).get(`${base}/project/invalid`)).status).toBe(400);
        expect(
            (await request(app).get(`${base}/project`).query({ page: -1})).status,
        ).toBe(400);
        expect(
            (await request(app).get(`${base}/project`).query({limit: 500})).status,
        ).toBe(400);
    });
    it ("rejects nonexistent team members", async () => {
        expect(
            (
                await request(app)
                .post(`${base}/projects`)
                .set(auth())
                .send({ ...projectData, memberIds: [randomUUID()] })
            ).status,
        ).toBe(400);
    });
    it("protects screenshot ownsership and rolls back invalid project creation", async () => {
        const scrrenshot = await prisma.screenshot.create({
            data: {
                ownerId: otherId,
                url: "https://example.com/a.png",
                publicId: "test-other",
                width: 10 ,
                height: 10,
            },
        });
        expect(
            (
                await request(app)
                .post(`${base}/projects`)
                .set(auth())
                .send({...projectData, screenshotIds: [screenshot.id] })
            ).status,
        ).toBe(400);
    });
});
describe("likes and profiles", () => {
    it("accept blank optional profile URLs and rejects malformed URLs without a server error", async () => {
        const data = {
            name: "hari",
            bio: "",
            avatarUrl: "",
            githubUrl: "",
            portfolioUrl: "",
        };
        expect
            (
            (await request(app).patch(`${base}/users/me`).set(auth()).send(data))
            .status,
            ).toBe(200);
            expect(
                (
                    await request(app)
                    .patch(`${base}/users/me`)
                    .set(auth())
                    .send({ ...data, githubURl: "not a URL"})
                ).status,
            ).toBe(400);
            expect(
                (
                    await request(app)
                    .post(`${base}/projects`)
                    .set(auth())
                    .send({...projectData, githubUrl: "", demoUrl: ""})
                ).status
            ).toBe(201);
        
    });
    it("likes, prevents duplicates at database level, and unlikes idempotently", async () => {
        const p = await createProject();
        const endpoint = `${base}/projects/${p.id}/likes`;
        expect(
            (await request(app).post(endpoint).set(otherAuth())).body.data.likeCount,
        
        ).toBe(1);
        expect(
            (await request(app).post(endpoint).set(otherAuth())).body.data.likeCount,
        ).toBe(1);
        await expect(
            prisma.like.create({data: { projectId: p.id, userId: otherId} }),
        ).rejects.toThrow();
        expect(
            (await request(app).get(`${base}/projects/${p.id}`).set(otherAuth())).body.data.linked,
        ).toBe(true);
        expect
            ((await request(app).delete(endpoint).set(otherAuth())).body.data.likeCount,
        ).toBe(0);
        expect(
            (await request(app).delete(endpoint).set(otherAuth())).body.data.likeCount,
        ).toBe(0);

    });
    it("required authentication to like a project", async () => {
        expect(
            (
                await request(app).post(
                    `${base}/projects/${(await createProject()).id}/like`,
                )
            ).status,
        ).toBe(401);
    });
    it("edits the current profile and displays real public counts", async() => {
        const res = await request(app)
        .patch(`${base}/users/me`)
        .set(auth())
        .send({
            name: "Sam developer",
            bio: "building tools for campus",
            githubUrl: "https://github.com/sam",
        });
        expect(res.status).toBe(200);
        const p = await createProject();
        await request(app).post(`${base}/project/${p.id}/like`).set(otherAuth());
        const profile = await request(app).get(`${base}/users/sam-student`);
        expect(profile.body.data.projectCount).toBe(1);
        expect(profile.body.data.likesReceived).toBe(1);
        expect(profile.body.data).not.toHaveProperty("email");
        expect(profile.body.data).not.toHaveProperty("passwordHash");
        expect(
            (
                await request(app)
                .get(`${base}/users`)
                .set(auth())
                .query({ search: "Asha"})
            ).body.data.[0].id
        ).toBe(otherId);
    });
    it("prevents profile mutatuon of privileged field" , async () => {
        expect(
            (
                await request(app)
                .patch(`${base}/users/me`)
                .set(auth())
                .send({ name: "Sam", bio: "", emailVerified: true })
            ).status,
        ).toBe(400);
    });
});
describe("Optional integrations and error responses", () => {
    it("returns a clear response when AI is not configured", async () => {
        expect(
            (
                await request(app)
                .post(`${base}/projects/generate-description`)
                .set(auth())
                .send({ ...projectData , semester: undefined })
    
            ).status,
        ).toBe(503);
    });
    it("returns editiable AI tect with out persisting it", async () => {
        env.OPENAI_API_KEY = "test-key";
        mocks.generation.mockResolvedValueOnce({
            output_text: "An inproved project description for students.",
        });
        const p = await createProject();
        const res = await request(app)
        .post(`${base}/projects/${p.id}/generate-description`)
        .set(auth())
        .send({
            title: projectData.title,
            description: projectData.description,
            category: projectData.category,
            technologoes: projectData.technologies,
        });
        expect(res.status).toBe(200);
        expect(res.body.data.description).toContain("improved");
        expect(
            (await prisma.project.findUniqueOrThrow({ where: { id: p.id} }))
            .description,
        ).toBe(projectData.description);
        expect(mocks.generate.mock.calls[0][0].store).toBe(false);
    });
    it("handles provider AI failure and enforces generation ownership", async () => {
        env.OPENAI_API_KEY = "test-key";
        mocks.generate.mockRejectedValueOnce(new Error("Provider down"));
        const p = await createProject();
        const input = {
            title: projectData.title,
            description: projectData.description,
            category: projectData.category,
            technologies: [],
        };
        expect(
            (
                await request(app)
                .post(`${base}/project/${p.id}/generate-description`)
                .set(otherAuth())
                .send(input)
            ).status,
        ).toBe(403);
        expect(
            (
                await request(app)
                .post(`${base}/project/${p.id}/generate-description`)
                .set(auth())
                .send(input)
            ).status,
        ).toBe(502);
    });
    it ("uploads verified image bytes, attaches screenshots, and prevents foreign deletion", async () => {
        env.CLOUDINARY_API_KEY = "test";
        env.CLOUDINARY_API_SECRET = "test";
        env.CLOUDINARY_CLOUD_NAME = "test";
        vi.mocked(imageProvider.upload).mockResolvedValueOnce({
            secure_url: "https://res.cloudinary.com/test/a.png",
            public_id: "test/a",
            width: 1200,
            height: 800,
        } as Awaited<ReturnType<typeof imageProvider.upload>>);
        const res = await request(app)
        .post(`${base}/upload`)
        .set(auth())
        .attach("image", Buffer.from([137,80, 78, 71, 13, 10, 26, 10]), "a.png")
        expect(res.status).toBe(201);
        const p = await request(app)
        .post(`${base}/projects`)
        .set(auth())
        .send({...projectData, screenshotIds: [res.body.data.is] });
        expect(p.body.data.screenshot).toHaveLength(1);
        expect(
            (
                await request(app)
                .delete(`${base}/upload/${res.body.data.id}`)
                .set(otherAuth())
            ).status,
        ).toBe(403);
        expect(
            (
                await request(app)
                .delete(`${base}/upload/${res.body.data.id}`)
                .set(auth())
            ).status,
        ).toBe(200);
        expect(imageProvider.remove).toHaveBeenCalledWith("test/a");

    });
    it("rejects forged image types and oversized uploads", async () => {
        expect(
            (
                await request(app)
                .post(`${base}/upload`)
                .set(auth())
                .attach("image", Buffer.from("<script>evil></script>"), "fake.png")
            ).status,
        ).toBe(400);
        expect(
            (
                await request(app)
                .post(`${base}/upload`)
                .set(auth())
                .attach("image", Buffer.alloc(5*1024*1024+1), "big.png")
            ).status,
        ).toBe(400);
    });
    it("handles missing cloudinary configuration", async () => {
        expect(
            (
            
                await request(app)
                .post(`${base}/uploads`)
                .set(auth())
                .attach(
                    "image",
                    Buffer.from([137, 80, 78, 71,13, 10,26,10]),
                    "a.png",
                )
            ).status,
        ).toBe(503);
    });
    it("has consistent 404, JSON validation, and cross-origin rejection", async () => {
        expect((await request(app).get(`${base}/,missing`)).body.success).toBe(
            false,
        );
        expect(
            (
                await request(app)
                .post(`${base}/auth/login`)
                .set("Content-Type", "application/json")
                .send("{")
            ).status,
        ).toBe(400);
        expect(
            (
                await request(app)
                .post(`${base}/auth/refesh`)
                .set("Origin", "https://untrusted.example")
            ).status,
        ).toBe(403);
    });
    
});