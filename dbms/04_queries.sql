-- CP3: SQL emitted by Prisma Client for src/services/question.service.js,
-- with bound values shown literally. Run with psql.
-- POST /api/auth/login checks .env and does not access PostgreSQL.
-- These query statements cover the database operations used by the app.
-- Use an existing Question.id for question_id.
-- W1, W2, and W3 change data; use BEGIN/ROLLBACK when benchmarking them.

\set question_id 10
\set question_body 'AP query timing sample'
\set voter_id 'STUDENT:example-roll-number'

-- @R1 READ: Active feed and each question's upvote total.
SELECT
    "public"."Question"."id",
    "public"."Question"."body",
    "public"."Question"."status",
    "public"."Question"."createdAt",
    "public"."Question"."updatedAt",
    COALESCE("aggr_selection_0_Upvote"."_aggr_count_upvotes", 0) AS "_aggr_count_upvotes"
FROM "public"."Question"
LEFT JOIN (
    SELECT "public"."Upvote"."questionId", COUNT(*) AS "orderby_aggregator"
    FROM "public"."Upvote"
    WHERE 1 = 1
    GROUP BY "public"."Upvote"."questionId"
) AS "orderby_1_Upvote"
    ON ("public"."Question"."id" = "orderby_1_Upvote"."questionId")
LEFT JOIN (
    SELECT "public"."Upvote"."questionId", COUNT(*) AS "_aggr_count_upvotes"
    FROM "public"."Upvote"
    WHERE 1 = 1
    GROUP BY "public"."Upvote"."questionId"
) AS "aggr_selection_0_Upvote"
    ON ("public"."Question"."id" = "aggr_selection_0_Upvote"."questionId")
WHERE "public"."Question"."status" = 'APPROVED'
ORDER BY COALESCE("orderby_1_Upvote"."orderby_aggregator", 0) DESC,
         "public"."Question"."createdAt" DESC
OFFSET 0;

-- @R1B READ: Find questions this signed-in voter already upvoted (optional feed query).
SELECT "public"."Upvote"."questionId"
FROM "public"."Upvote"
WHERE "public"."Upvote"."voterId" = :'voter_id'
OFFSET 0;

-- @W1 WRITE: Create an approved question.
INSERT INTO "public"."Question" ("body", "status", "createdAt", "updatedAt")
VALUES (:'question_body', 'APPROVED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
RETURNING "id", "body", "status", "createdAt", "updatedAt";

-- @R2 READ: Confirm that the question exists and is active before an upvote.
SELECT "public"."Question"."id"
FROM "public"."Question"
WHERE ("public"."Question"."id" = :question_id
       AND "public"."Question"."status" = 'APPROVED')
OFFSET 0;

-- @R2B READ: Check whether this voter already upvoted this question.
SELECT "public"."Upvote"."id"
FROM "public"."Upvote"
WHERE ("public"."Upvote"."questionId" = :question_id
       AND "public"."Upvote"."voterId" = :'voter_id')
OFFSET 0;

-- @W2 WRITE: Add an upvote only when the previous query returned no row.
INSERT INTO "public"."Upvote" ("questionId", "voterId", "createdAt")
VALUES (:question_id, :'voter_id', CURRENT_TIMESTAMP)
RETURNING "id", "questionId", "voterId", "createdAt";

-- @R3 READ: Find the question before resolving it.
SELECT "public"."Question"."id", "public"."Question"."body",
       "public"."Question"."status", "public"."Question"."createdAt",
       "public"."Question"."updatedAt"
FROM "public"."Question"
WHERE "public"."Question"."id" = :question_id
OFFSET 0;

-- @W3 WRITE: Resolve the question. Prisma also updates updatedAt.
UPDATE "public"."Question"
SET "status" = 'RESOLVED', "updatedAt" = CURRENT_TIMESTAMP
WHERE ("public"."Question"."id" = :question_id AND 1 = 1)
RETURNING "id", "body", "status", "createdAt", "updatedAt";
