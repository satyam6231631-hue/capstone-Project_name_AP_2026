const { getRole } = require("../middleware/auth.middleware");

function login(req, res) {
  const username = req.body && req.body.username;
  const password = req.body && req.body.password;

  if (typeof username !== "string" || typeof password !== "string") {
    return res.status(400).json({ error: "Username and password are required" });
  }

  const role = getRole(username, password);

  if (!role) {
    return res.status(401).json({ error: "Username or password is incorrect" });
  }

  return res.status(200).json({ role: role });
}

module.exports = { login };
