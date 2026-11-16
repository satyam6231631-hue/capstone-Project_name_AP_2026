# ClassVox Codex Instructions

This file defines the strict architectural rules, syllabus boundaries, and coding conventions for **ClassVox**. Any AI agent generating or modifying code in this repository must follow these guidelines.

---

## 1. Project Brief & Scope (Basic MVP)

**ClassVox** is a minimal classroom Q&A app built with **Node.js, Express.js, PostgreSQL, and Prisma ORM**. It uses one shared student login and one shared teacher login from environment variables; it does not store user accounts in PostgreSQL.

### In-Scope Features

1. **Login (`POST /api/auth/login`):** Checks the shared student or teacher credentials from `process.env` and returns the role.
2. **Submit Question (`POST /api/questions`):** A logged-in student or teacher submits a question string. Middleware loads restricted words from `src/config/bannedWords.txt` via `fs.readFileSync`, trims whitespace, rejects empty input, strips punctuation with a character loop, and checks word/phrase matches using `.includes()`. Saves clean questions to PostgreSQL with status `APPROVED`.
3. **Fetch Active Feed (`GET /api/questions`):** Returns all `APPROVED` questions along with their total upvote count, sorted by highest upvotes first.
4. **Upvote Question (`POST /api/questions/:id/upvote`):** A logged-in student or teacher adds one upvote per question. Students identify themselves with a roll number; the teacher role uses one shared teacher identity. A database unique constraint prevents duplicate votes.
5. **Resolve Question (`PATCH /api/questions/:id/resolve`):** A teacher login updates a question's status to `RESOLVED` and triggers a Node `EventEmitter` that asynchronously appends a log entry to `logs/archive.log` using `fs.appendFile`.

### Out of Scope

- No individual user accounts, `User` model, JWT, external password libraries, or external authentication services. The shared role credentials are for local classroom use, are stored in `.env`, and are checked on protected requests using headers. Student roll numbers identify votes but are not checked against an official student list.
- No external profanity packages or regular expressions for content filtering.
- Do not install `leo-profanity`, `bad-words`, `zod`, `joi`, `winston`, `cors`, `helmet`, or external moderation APIs.
- No TypeScript or ES modules. Use plain JavaScript with CommonJS (`require` / `module.exports`) only.

---

## 2. Strict Syllabus Constraints

Only use JavaScript, Node.js, Express, and Prisma concepts from the supplied mid-sem syllabus and knowledge base:

- Node core: `process.env`, `path.join(__dirname, ...)`, `events` (`EventEmitter`), `fs.readFileSync` inside `try/catch`, and `fs.appendFile` with an error-first `(err)` callback.
- Express: `express()`, `express.json()`, `express.Router()`, `req.params`, `req.body`, custom middleware `(req, res, next)`, and global error middleware `(err, req, res, next)`.
- Validation: standard JS string methods (`.trim()`, `.toLowerCase()`, `.split()`), basic `for` loops over string characters, and array `.includes()`.
- Architecture: MVC separation (`routes/`, `controllers/`, `services/`, `middleware/`, `events/`, `config/`).
- Prisma ORM: PostgreSQL models with integer auto-increment IDs, relations, timestamps, and Prisma Client CRUD (`create`, `findMany`, `update`).

---

## 3. Repository Structure

```text
ClassVox/
├── prisma/schema.prisma
├── src/
│   ├── config/bannedWords.txt
│   ├── config/prisma.js
│   ├── controllers/question.controller.js
│   ├── controllers/auth.controller.js
│   ├── events/archive.logger.js
│   ├── middleware/contentFilter.js
│   ├── middleware/auth.middleware.js
│   ├── middleware/error.middleware.js
│   ├── routes/question.routes.js
│   ├── routes/auth.routes.js
│   ├── services/question.service.js
│   └── app.js
├── logs/archive.log
├── .env.example
├── AGENTS.md
└── package.json
```

Create only files actively required by the four MVP operations and the planned setup/health check.

---

## 4. Database Schema Specification

Use integer auto-increment IDs:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model Question {
  id        Int      @id @default(autoincrement())
  body      String
  status    String   @default("APPROVED")
  upvotes   Upvote[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Upvote {
  id         Int      @id @default(autoincrement())
  questionId Int
  voterId    String?
  question   Question @relation(fields: [questionId], references: [id], onDelete: Cascade)
  createdAt  DateTime @default(now())

  @@unique([questionId, voterId])
}
```

`voterId` is nullable so old upvotes without an identity remain in the feed totals. New upvotes always include `STUDENT:<roll number>` or the shared `TEACHER` value.

---

## 5. Content Moderation Specification

1. Read `src/config/bannedWords.txt` once using `fs.readFileSync(path.join(__dirname, "../config/bannedWords.txt"), "utf8")` inside a `try/catch`, splitting by `"\n"`, trimming, lowercasing, and filtering empty lines.
2. Inside `contentFilter(req, res, next)`:
   - Reject missing or whitespace-only `req.body.body` with a `400` JSON error.
   - Trim and convert the input to lowercase for checking.
   - Use a simple `for` loop to remove punctuation characters while keeping English and Hindi letters and spaces.
   - Split cleaned text by `" "` into an array of words.
   - Loop through `bannedWords`: for entries containing a space, check `cleanedText.includes(entry)`; otherwise check exact word matches with `words.includes(entry)`.
   - Return a `400` JSON error on a match, or set `req.body.body` to the trimmed original text and call `next()`.

---

## 6. Coding Standards

1. CommonJS everywhere: use `require` and `module.exports`.
2. Construct file paths with `path.join(__dirname, ...)` rather than relative strings.
3. Controllers must wrap async Prisma calls in `try { ... } catch (err) { next(err); }` so `error.middleware.js` handles unexpected failures.
4. Keep files concise, readable, and easy for students to explain during a viva/code review.
