-- CP2: ClassVox tables in PostgreSQL's public schema.
-- This matches prisma/schema.prisma and the existing Prisma migration.
-- Shared student/teacher credentials are environment-based; auth adds no database table.

CREATE TABLE "Question" (
    "id" SERIAL PRIMARY KEY,
    "body" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'APPROVED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "Upvote" (
    "id" SERIAL PRIMARY KEY,
    "questionId" INTEGER NOT NULL,
    "voterId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Upvote_questionId_voterId_key" UNIQUE ("questionId", "voterId"),
    CONSTRAINT "Upvote_questionId_fkey"
        FOREIGN KEY ("questionId")
        REFERENCES "Question"("id")
        ON DELETE CASCADE
        ON UPDATE CASCADE
);
