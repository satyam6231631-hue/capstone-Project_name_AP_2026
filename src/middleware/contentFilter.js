const fs = require("fs");
const path = require("path");

let bannedWords = [];

try {
  const wordList = fs.readFileSync(
    path.join(__dirname, "../config/bannedWords.txt"),
    "utf8"
  );

  const wordLines = wordList.split("\n");

  for (let i = 0; i < wordLines.length; i += 1) {
    const word = wordLines[i].trim().toLowerCase();

    if (word.length > 0) {
      bannedWords[bannedWords.length] = word;
    }
  }
} catch (err) {
  console.error("Could not load the banned words list:", err.message);
  throw err;
}

function contentFilter(req, res, next) {
  const rawText = req.body && req.body.body;

  if (typeof rawText !== "string" || rawText.trim().length === 0) {
    return res.status(400).json({ error: "Question body is required" });
  }

  const textToCheck = rawText.trim().toLowerCase();
  let cleanedText = "";

  for (let i = 0; i < textToCheck.length; i += 1) {
    const character = textToCheck[i];
    const isEnglishLetter = character >= "a" && character <= "z";
    const isNumber = character >= "0" && character <= "9";
    const isHindiLetter = character >= "\u0900" && character <= "\u097f";

    if (isEnglishLetter || isNumber || isHindiLetter || character === " ") {
      if (character !== " " || cleanedText.length === 0 || cleanedText[cleanedText.length - 1] !== " ") {
        cleanedText += character;
      }
    } else {
      if (cleanedText.length === 0 || cleanedText[cleanedText.length - 1] !== " ") {
        cleanedText += " ";
      }
    }
  }

  cleanedText = cleanedText.trim();
  const words = cleanedText.split(" ");

  for (let i = 0; i < bannedWords.length; i += 1) {
    const bannedWord = bannedWords[i];
    const bannedWordParts = bannedWord.split(" ");
    let isMatch = false;

    if (bannedWordParts.length > 1) {
      isMatch = cleanedText.includes(bannedWord);
    } else if (words.includes(bannedWord)) {
      isMatch = true;
    }

    if (isMatch) {
      return res.status(400).json({ error: "Question contains restricted language" });
    }
  }

  req.body.body = rawText.trim();
  return next();
}

module.exports = contentFilter;
