# ProjectHub

A place for showing people what you have been creating.

ProjectHub is a student project exhibit for **Thirdspace**. It groups screenshots, source code, demos and the people behind a project in a single page, to quickly see what something does before forking its repo.

**Live demo:** `NA` 

## Screenshots

![Project discovery with search, filters and project cards](docs/screenshots/discover.png)

![Project editor with live card preview](docs/screenshots/project-editor.png)

---

## What it does

Create, edit, and remove projects of your own.
Upload up to 6 screenshots, PNG, JPEG or WebP, up to 5 MB per file.
- Explore projects and filter by most recent or most popular.
- Set a public profile, give credit to registered co-workers and like projects.
Displays the languages, stars, forks and update dates of public GitHub repositories.
Sign up with email verification and reset forgotten passwords by email.
Optionally, create a draft of a description, review and edit it prior to publishing.

## How it's built

| Part | Tools |
| --- | --- |
Frontend | React 19, TypeScript, Vite, React Router |
Styling | Plain CSS, Lucide icons |
Backend | Node.js, Express 5, TypeScript, Zod |
| Database | PostgreSQL 17, Prisma 6 |
| Accounts | JWT for authentication, bcryptjs for password hashing, Nodemailer for sending emails |
Integrations | Cloudinary, GitHub REST API, OpenAI |
Testing | Vitest, Supertest, Playwright |

The client and server are two separate npm applications. Requests are sent through services and repositories along express routes, and Prisma will deal with the database.

Some implementation aspects are important: Only owners are allowed to change projects, credited teammates aren't allowed to edit, and the database permits one like per account per project. Browser tests validate layouts across phone, tablet and desktop.

## Run it locally

### 1. Prerequisites

Install Node.js with npm, Git, and Docker with Compose. Configure Docker to run Linux containers.

Also, you need to have functional SMTP credentials for verification of emails. The following example assumes a set up using Gmail.

### 2. Clone the repository and start the database

```sh
git clone https://github.com/swaznil/project1.git
cd project1
docker compose up -d
docker compose ps
```

Wait until PostgreSQL is in the healthy state. It is located at localhost:5434 while Docker only runs the database.

### 3. Set up the backend

To the repository root:

```sh
cd server
npm ci
npm run setup:env
npm run db:generate
npm run db:deploy
```

Both the `.env` files are created and jwt secrets are generated in the setup script without overwriting files. Database settings are already configured to match Docker Compose.

Edit `server/.env`:

```dotenv
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-google-app-password
SMTP_FROM=ProjectHub <your-email@gmail.com>
```

Do not use your normal password; use one of the Google app passwords. Don't put `.env` files in the source control.

In the `server/` directory, run the API:

```sh
npm run dev
```

Check [localhost:5000/api/v1/health](http://localhost:5000/api/v1/health).

### 4. Start the frontend

Open another terminal at the root of the repository:

```sh
cd client
npm ci
npm run dev
```

Visit **[localhost:5173](http://localhost:5173)**. Sign up, follow the email link and verify your account, log in, and select Share a project.

Use `localhost` consistently. The client config generated will include `VITE_API_URL=/api/v1`; Vite will forward requests to port 5000.

### Optional integrations

Place these in `server/.env` and restart the backend:

| Feature | Variables |
| --- | --- |
| Screenshot uploads | `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` |
| AI drafts | `OPENAI_API_KEY`; optionally `OPENAI_MODEL` |
| Higher GitHub API limits | `GITHUB_TOKEN` |

Without these, you can still publish text-only projects and write up the descriptions yourself. Within the unauthenticated limit it is possible to perform public GitHub lookups without the requirement of a token. AI requests are subject to fees. Never put service secrets in `VITE_` variables.

## Builds and tests

Create frontend from client/:

```sh
npm run build
```

Files are output in `client/dist/`. Run/Compile the backend in `server/`:

```sh
npm run build
npm start
```

Once PostgreSQL is running, create and migrate the test database, and perform the backend checks from `server/`:

```sh
npm run db:test:setup
npm run typecheck
npm test
```

Then run the browser checks from `client/`:

```sh
npm run typecheck
npx playwright install chromium
npm run test:e2e
```

Tests clear `projecthub_test`. Run the suites sequentially because they share it. Playwright starts its own servers on ports 5001 and 5174. External services are mocked; real email delivery and uploads need separate checks.

---