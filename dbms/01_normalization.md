# CP1 — ClassVox normalization

## Scope

This analysis describes the current ClassVox app. It has shared student and teacher credentials in `.env`, but no user table or question ownership. New student upvotes store the entered roll number; the app does not verify it against a class list. Legacy upvotes have no identity.

## Starting point and 1NF

A classroom feed can be pictured as a question with a repeating list of votes:

```text
Question(id, body, status, createdAt, updatedAt,
         upvotes[(upvoteId, questionId, createdAt), ...])
```

The repeating `upvotes` list is not atomic, so that representation is not in 1NF. In 1NF each vote is represented by one row in its own relation. Questions with no votes still have their row in `Question`:

```text
Question(id, body, status, createdAt, updatedAt)
Upvote(id, questionId, voterId, createdAt)
```

Each column stores one value. `Question.id` and `Upvote.id` are primary keys; `Upvote.questionId` references `Question.id`.

## Normalization steps

### Unnormalized form

The starting representation stores multiple upvotes inside a question row. The `upvotes` group repeats, so it is not 1NF.

### First normal form (1NF)

Split the repeating group into one row per vote:

- `Question(id, body, status, createdAt, updatedAt)`
- `Upvote(id, questionId, voterId, createdAt)`

Each field now stores one value. The key dependencies are `Question.id → body, status, createdAt, updatedAt` and `Upvote.id → questionId, voterId, createdAt`.

### Second normal form (2NF)

Both tables have a single-column primary key, so no attribute can depend on only part of a primary key. The identified votes also have the alternate key `(questionId, voterId)`; neither `questionId` nor `voterId` alone determines the vote row. There are no partial dependencies to split out.

### Third normal form (3NF)

No non-key field determines another non-key field. For example, question body and status stay in `Question`; `Upvote` refers to them through `questionId` instead of copying them. Therefore there are no transitive dependencies to remove.

### BCNF check (optional)

For identified votes, the determinants are candidate keys: `id` and `(questionId, voterId)`. Legacy votes have a null `voterId`, so the composite uniqueness rule applies to identified votes only. The design is in BCNF under those constraints.

## 2NF

Both tables use a single-column primary key, so partial dependency on part of a composite key cannot occur. Every non-key attribute depends on the whole key:

- `Question.id → body, status, createdAt, updatedAt`
- `Upvote.id → questionId, voterId, createdAt`

The tables are in 2NF.

## 3NF and BCNF

There are no non-key attributes that determine other non-key attributes. In particular, question text and status are not copied into `Upvote`; they are obtained through its foreign key. The determinants in the listed non-trivial functional dependencies are candidate keys (`Question.id` and `Upvote.id`). The design is in 3NF and BCNF.

## Functional dependencies and keys

| Relation | Candidate key | Functional dependency |
|---|---|---|
| `Question` | `id` | `id → body, status, createdAt, updatedAt` |
| `Upvote` | `id`; `(questionId, voterId)` for identified votes | `id → questionId, voterId, createdAt`; `(questionId, voterId) → id` when `voterId` is not null |

`Question.body` is not unique: two students may ask the same question. For new votes, the composite unique constraint on `(questionId, voterId)` enforces one vote for each entered roll number on a question. Teacher votes use the single shared teacher identity. Old rows have a null `voterId` because their voters cannot be recovered; PostgreSQL allows multiple null values under this unique constraint.

## Derived values and constraints

- The feed's upvote total is calculated from `Upvote` rows; it is not stored on `Question`.
- `Question.status` defaults to `APPROVED`; resolving changes it to `RESOLVED`. The current PostgreSQL schema stores this as text without a `CHECK` constraint.
- Deleting a question cascades to its upvotes.
- `updatedAt` is filled by Prisma on writes. The PostgreSQL column has no default in the current migration.

The ER diagram and final table definitions are in `02_er_diagram.png` and `03_schema.sql`. The editable ER source is in `02_er_diagram.mmd`.
