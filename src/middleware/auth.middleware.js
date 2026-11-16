function getRole(username, password) {
  if (
    process.env.STUDENT_USERNAME &&
    process.env.STUDENT_PASSWORD &&
    username === process.env.STUDENT_USERNAME &&
    password === process.env.STUDENT_PASSWORD
  ) {
    return "STUDENT";
  }

  if (
    process.env.TEACHER_USERNAME &&
    process.env.TEACHER_PASSWORD &&
    username === process.env.TEACHER_USERNAME &&
    password === process.env.TEACHER_PASSWORD
  ) {
    return "TEACHER";
  }

  return null;
}

function authenticate(req, res, next) {
  const role = getRole(req.headers["x-username"], req.headers["x-password"]);

  if (!role) {
    return res.status(401).json({ error: "Please log in to do that" });
  }

  req.userRole = role;
  return next();
}

function requireTeacher(req, res, next) {
  if (req.userRole !== "TEACHER") {
    return res.status(403).json({ error: "Only a teacher can resolve questions" });
  }

  return next();
}

function identifyVoter(req, res, next) {
  if (req.userRole === "TEACHER") {
    req.voterId = "TEACHER";
    return next();
  }

  const studentId = req.headers["x-student-id"];

  if (typeof studentId !== "string" || studentId.trim().length === 0) {
    return res.status(400).json({ error: "Enter your student roll number to upvote" });
  }

  req.voterId = "STUDENT:" + studentId.trim().toLowerCase();
  return next();
}

module.exports = {
  getRole,
  authenticate,
  requireTeacher,
  identifyVoter
};
