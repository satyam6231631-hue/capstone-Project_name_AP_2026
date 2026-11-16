# CP4 — ClassVox query timings

**Measured:** 16 November 2026 · **Database:** local PostgreSQL · **Prisma:** 6.12.0

These plans and timings use the final roll-number schema and the SQL statements in `04_queries.sql`. Each statement was run three times with `EXPLAIN (ANALYZE, BUFFERS)`. Write statements and temporary benchmark setup were enclosed in transactions and rolled back. The database had 21 questions and 186 upvotes before and after. All 21 saved questions were resolved, so each run temporarily marked one existing question active and added one benchmark vote inside its transaction; rollback restored the original rows. PostgreSQL sequences may advance after rolled-back inserts.

| Query | Type | What it does | Run 1 (ms) | Run 2 (ms) | Run 3 (ms) | Average (ms) | Scan / plan |
|---|---|---|---:|---:|---:|---:|---|
| R1 | READ | Active feed and upvote count | 0.097 | 0.100 | 0.099 | 0.099 | Sequential scans of Question and Upvote; two aggregates |
| R1B | READ | Find questions already upvoted by this voter | 0.009 | 0.009 | 0.009 | 0.009 | Sequential scan of Upvote |
| W1 | WRITE | Create question | 0.025 | 0.019 | 0.017 | 0.020 | Insert into Question |
| R2 | READ | Check question is active before upvote | 0.004 | 0.004 | 0.004 | 0.004 | Sequential scan of Question |
| R2B | READ | Check whether this voter already upvoted | 0.009 | 0.009 | 0.009 | 0.009 | Sequential scan of Upvote |
| W2 | WRITE | Insert an identified upvote | 0.024 | 0.024 | 0.023 | 0.024 | Insert into Upvote; foreign-key and unique checks |
| R3 | READ | Find question before resolving | 0.004 | 0.004 | 0.004 | 0.004 | Sequential scan of Question |
| W3 | WRITE | Set question status to resolved | 0.009 | 0.009 | 0.008 | 0.009 | Update Question using a sequential scan |

## What the plans show

- R1 scans the upvotes twice because the Prisma feed query calculates one count for sorting and another for display. This is clear to explain and fast on the current small database; do not rewrite it without a larger workload showing a need.
- R1B and R2B use sequential scans on the 186-row Upvote table. The composite unique index starts with `questionId`, so it is not a direct lookup index for R1B's voter-only filter. At this data size the measured time is 0.009 ms; adding another index is not justified by these results.
- R2, R3, and W3 use sequential scans because the Question table has only 21 rows. The scans complete in 0.004–0.009 ms. The primary-key index remains available and PostgreSQL can choose it when the table grows.
- W2's insert is protected by both the question foreign key and the `(questionId, voterId)` unique index. The same voter cannot create a second identified vote for the same question.
- Setup and write statements were rolled back, preserving all table rows. PostgreSQL sequences can still advance after rolled-back inserts.

## Limitations

These measurements use the small local development database plus one temporary active question and voter in each rolled-back run. They are a reproducible baseline for this machine, not a prediction for a large classroom. The plans are in `plans/`, with one file per query and three runs in each file. Login, `/health`, and static page requests do not query PostgreSQL.
