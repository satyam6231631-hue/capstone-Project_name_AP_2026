const EventEmitter = require("events");
const fs = require("fs");
const path = require("path");

const archiveEmitter = new EventEmitter();

archiveEmitter.on("questionResolved", (question) => {
  const logEntry = "Question #" + question.id + " resolved: " + question.body + "\n";
  const logPath = path.join(__dirname, "../../logs/archive.log");

  fs.appendFile(logPath, logEntry, (err) => {
    if (err) {
      console.error("Could not append to the question archive:", err.message);
    }
  });
});

module.exports = archiveEmitter;
