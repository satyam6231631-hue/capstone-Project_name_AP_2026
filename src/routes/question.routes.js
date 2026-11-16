const express = require("express");
const { authenticate, requireTeacher, identifyVoter } = require("../middleware/auth.middleware");
const contentFilter = require("../middleware/contentFilter");
const questionController = require("../controllers/question.controller");

const router = express.Router();

router.get("/", questionController.getQuestions);
router.post("/", authenticate, contentFilter, questionController.createQuestion);
router.post("/:id/upvote", authenticate, identifyVoter, questionController.upvoteQuestion);
router.patch("/:id/resolve", authenticate, requireTeacher, questionController.resolveQuestion);

module.exports = router;
