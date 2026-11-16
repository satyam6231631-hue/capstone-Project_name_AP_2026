-- Add optional voter identity so existing anonymous upvotes stay valid.
ALTER TABLE "Upvote" ADD COLUMN "voterId" TEXT;

-- Keep new votes unique for each question and voter.
CREATE UNIQUE INDEX "Upvote_questionId_voterId_key"
ON "Upvote"("questionId", "voterId");
