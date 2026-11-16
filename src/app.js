require("dotenv").config();

const express = require("express");
const path = require("path");
const authRoutes = require("./routes/auth.routes");
const errorMiddleware = require("./middleware/error.middleware");
const questionRoutes = require("./routes/question.routes");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/questions", questionRoutes);
app.use(express.static(path.join(__dirname, "../public")));
app.use(errorMiddleware);

app.listen(PORT, () => {
  console.log("ClassVox server running on port " + PORT);
});

module.exports = app;
