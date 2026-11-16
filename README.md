# ClassVox

ClassVox is a small classroom Q&A app. It has an Express and Prisma API plus a plain HTML, CSS, and JavaScript page for trying it in a browser.

## Run it locally

1. Install the packages:

   ```sh
   npm install
   ```

2. Copy `.env.example` to `.env` and set `DATABASE_URL` to your local PostgreSQL database. Set the shared `STUDENT_*` and `TEACHER_*` login values there too. Keep real credentials in `.env`.

3. Apply the database migration:

   ```sh
   npx prisma migrate dev
   ```

4. Start the app:

   ```sh
   npm start
   ```

5. Open <http://localhost:3000> in a browser and log in with either the shared student or teacher account.

Students and teachers can post and upvote. Students enter their roll number when logging in, and can upvote each question once per entered roll number. The teacher login is shared and can upvote once per question. Only the teacher account can resolve questions. The feed is public. These shared credentials are for local classroom use, not individual accounts; the page forgets the login when it is refreshed or closed. Roll numbers are not verified against a class list, so this prevents accidental repeat votes for the same number but does not prove who entered it.

For this simple version, the page sends the shared credentials with protected requests. Use it locally; do not expose it over an unencrypted network.

The health route is available at `/health`.

## API routes

- `POST /api/auth/login` checks the shared student or teacher credentials from `.env`.
- `POST /api/questions` creates a question.
- `GET /api/questions` lists active questions and their upvote totals; signed-in users also see whether their identifier has already voted.
- `POST /api/questions/:id/upvote` upvotes an active question once per student roll number or shared teacher identity.
- `PATCH /api/questions/:id/resolve` resolves a question and writes it to the archive log.

The database has no user table. Login checks `.env`; roll numbers are stored only on new upvote rows. Old upvotes have no roll number and remain included in totals.
