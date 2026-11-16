const prisma = require("../config/prisma");

function createQuestion(body) {
  return prisma.question.create({
    data: { body }
  });
}

async function getQuestions(voterId) {
  const questions = await prisma.question.findMany({
    where: { status: "APPROVED" },
    include: {
      _count: {
        select: { upvotes: true }
      }
    },
    orderBy: [
      { upvotes: { _count: "desc" } },
      { createdAt: "desc" }
    ]
  });

  if (voterId) {
    const upvotes = await prisma.upvote.findMany({
      where: { voterId },
      select: { questionId: true }
    });

    for (let i = 0; i < questions.length; i += 1) {
      questions[i].hasUpvoted = false;

      for (let j = 0; j < upvotes.length; j += 1) {
        if (questions[i].id === upvotes[j].questionId) {
          questions[i].hasUpvoted = true;
        }
      }
    }
  }

  return questions;
}

async function addUpvote(questionId, voterId) {
  const questions = await prisma.question.findMany({
    where: { id: questionId, status: "APPROVED" },
    select: { id: true }
  });

  if (questions.length === 0) {
    return null;
  }

  const existingUpvotes = await prisma.upvote.findMany({
    where: { questionId, voterId },
    select: { id: true }
  });

  if (existingUpvotes.length > 0) {
    return { alreadyVoted: true };
  }

  return prisma.upvote.create({
    data: { questionId, voterId }
  });
}

async function resolveQuestion(questionId) {
  const questions = await prisma.question.findMany({
    where: { id: questionId }
  });

  if (questions.length === 0) {
    return null;
  }

  return prisma.question.update({
    where: { id: questionId },
    data: { status: "RESOLVED" }
  });
}

module.exports = {
  createQuestion,
  getQuestions,
  addUpvote,
  resolveQuestion
};
