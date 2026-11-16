const questionService = require("../services/question.service");
const archiveEmitter = require("../events/archive.logger");
const { getRole } = require("../middleware/auth.middleware");

function readQuestionId(req, res) {
  const rawId = req.params.id;
  let isValid = rawId.length > 0;

  for (let i = 0; i < rawId.length; i += 1) {
    if (rawId[i] < "0" || rawId[i] > "9") {
      isValid = false;
    }
  }

  const questionId = Number(rawId);

  if (!isValid || questionId < 1) {
    res.status(400).json({ error: "Question ID must be a positive integer" });
    return null;
  }

  return questionId;
}

async function createQuestion(req, res, next) {
  try {
    const question = await questionService.createQuestion(req.body.body);
    res.status(201).json({ question });
  } catch (err) {
    next(err);
  }
}

async function getQuestions(req, res, next) {
  try {
    const role = getRole(req.headers["x-username"], req.headers["x-password"]);
    let voterId = "";

    if (role === "TEACHER") {
      voterId = "TEACHER";
    }

    if (role === "STUDENT") {
      const studentId = req.headers["x-student-id"];
      if (typeof studentId === "string" && studentId.trim().length > 0) {
        voterId = "STUDENT:" + studentId.trim().toLowerCase();
      }
    }

    const questions = await questionService.getQuestions(voterId);
    res.status(200).json({ questions });
  } catch (err) {
    next(err);
  }
}

async function upvoteQuestion(req, res, next) {
  const questionId = readQuestionId(req, res);
  if (questionId === null) return;

  try {
    const upvote = await questionService.addUpvote(questionId, req.voterId);

    if (!upvote) {
      return res.status(404).json({ error: "Active question not found" });
    }

    if (upvote.alreadyVoted) {
      return res.status(409).json({ error: "You have already upvoted this question" });
    }

    return res.status(201).json({ upvote });
  } catch (err) {
    if (err.code === "P2002") {
      return res.status(409).json({ error: "You have already upvoted this question" });
    }
    return next(err);
  }
}

async function resolveQuestion(req, res, next) {
  const questionId = readQuestionId(req, res);
  if (questionId === null) return;

  try {
    const question = await questionService.resolveQuestion(questionId);

    if (!question) {
      return res.status(404).json({ error: "Question not found" });
    }

    archiveEmitter.emit("questionResolved", question);
    return res.status(200).json({ question });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  createQuestion,
  getQuestions,
  upvoteQuestion,
  resolveQuestion
};
