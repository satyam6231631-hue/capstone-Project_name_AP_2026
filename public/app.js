const questionForm = document.getElementById("question-form");
const questionInput = document.getElementById("question-body");
const message = document.getElementById("message");
const questionsList = document.getElementById("questions-list");
const loginForm = document.getElementById("login-form");
const loginMessage = document.getElementById("login-message");
const loginUsername = document.getElementById("username");
const loginPassword = document.getElementById("password");
const studentIdInput = document.getElementById("student-id");
const loginCard = document.getElementById("login-card");
const askCard = document.getElementById("ask-card");
const accountBar = document.getElementById("account-bar");
const accountRole = document.getElementById("account-role");
const logoutButton = document.getElementById("logout-button");
let currentRole = "";
let currentUsername = "";
let currentPassword = "";
let currentStudentId = "";

function showMessage(text) {
  message.textContent = text;
}

function getAuthHeaders() {
  const headers = {};

  if (currentUsername.length > 0) {
    headers["X-Username"] = currentUsername;
    headers["X-Password"] = currentPassword;
  }

  if (currentRole === "STUDENT") {
    headers["X-Student-ID"] = currentStudentId;
  }

  return headers;
}

function updateLoginView() {
  const isLoggedIn = currentRole.length > 0;

  loginCard.hidden = isLoggedIn;
  askCard.hidden = !isLoggedIn;
  accountBar.hidden = !isLoggedIn;

  if (isLoggedIn) {
    accountRole.textContent = "Logged in as " + currentRole.toLowerCase();
  }
}

function addQuestionToPage(question) {
  const card = document.createElement("article");
  const body = document.createElement("p");
  const actions = document.createElement("div");
  const count = document.createElement("span");

  card.className = "question";
  body.textContent = question.body;
  actions.className = "question-actions";
  count.className = "question-count";
  count.textContent = "Upvotes: " + question._count.upvotes;
  actions.appendChild(count);

  if (currentRole.length > 0) {
    if (question.hasUpvoted) {
      const votedText = document.createElement("span");
      votedText.textContent = "You upvoted";
      actions.appendChild(votedText);
    } else {
      const upvoteButton = document.createElement("button");
      upvoteButton.textContent = "Upvote";
      upvoteButton.addEventListener("click", function () {
        changeQuestion(question.id, "upvote");
      });
      actions.appendChild(upvoteButton);
    }
  }

  if (currentRole === "TEACHER") {
    const resolveButton = document.createElement("button");
    resolveButton.textContent = "Mark resolved";
    resolveButton.addEventListener("click", function () {
      const shouldResolve = window.confirm(
        "Mark this question as resolved? It will leave the active feed."
      );

      if (shouldResolve) {
        changeQuestion(question.id, "resolve");
      }
    });
    actions.appendChild(resolveButton);
  }

  card.appendChild(body);
  card.appendChild(actions);
  questionsList.appendChild(card);
}

async function loadQuestions() {
  try {
    const response = await fetch("/api/questions", { headers: getAuthHeaders() });
    const result = await response.json();

    if (!response.ok) {
      showMessage(result.error || "Could not load questions.");
      return;
    }

    questionsList.textContent = "";

    if (result.questions.length === 0) {
      questionsList.textContent = "There are no active questions yet.";
      return;
    }

    for (let i = 0; i < result.questions.length; i += 1) {
      addQuestionToPage(result.questions[i]);
    }
  } catch (err) {
    showMessage("Could not connect to ClassVox.");
  }
}

async function changeQuestion(questionId, action) {
  let address = "/api/questions/" + questionId + "/" + action;
  let method = "POST";

  if (action === "resolve") {
    method = "PATCH";
  }

  try {
    const response = await fetch(address, {
      method: method,
      headers: getAuthHeaders()
    });
    const result = await response.json();

    if (!response.ok) {
      showMessage(result.error || "Could not update the question.");
      return;
    }

    showMessage(action === "upvote" ? "Your upvote was added." : "Question updated.");
    await loadQuestions();
  } catch (err) {
    showMessage("Could not connect to ClassVox.");
  }
}

questionForm.addEventListener("submit", async function (event) {
  event.preventDefault();

  const body = questionInput.value.trim();

  if (body.length === 0) {
    showMessage("Write a question first.");
    return;
  }

  try {
    const response = await fetch("/api/questions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Username": currentUsername,
        "X-Password": currentPassword
      },
      body: JSON.stringify({ body: body })
    });
    const result = await response.json();

    if (!response.ok) {
      showMessage(result.error || "Could not post the question.");
      return;
    }

    questionInput.value = "";
    showMessage("Question posted.");
    await loadQuestions();
  } catch (err) {
    showMessage("Could not connect to ClassVox.");
  }
});

loginForm.addEventListener("submit", async function (event) {
  event.preventDefault();

  try {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: loginUsername.value.trim(),
        password: loginPassword.value
      })
    });
    const result = await response.json();

    if (!response.ok) {
      loginMessage.textContent = result.error || "Login failed.";
      return;
    }

    currentRole = result.role;
    currentUsername = loginUsername.value.trim();
    currentPassword = loginPassword.value;
    currentStudentId = studentIdInput.value.trim();

    if (currentRole === "STUDENT" && currentStudentId.length === 0) {
      currentRole = "";
      currentUsername = "";
      currentPassword = "";
      loginMessage.textContent = "Enter your student roll number to log in.";
      return;
    }

    loginPassword.value = "";
    studentIdInput.value = "";
    loginMessage.textContent = "";
    updateLoginView();
    await loadQuestions();
  } catch (err) {
    loginMessage.textContent = "Could not connect to ClassVox.";
  }
});

logoutButton.addEventListener("click", function () {
  currentRole = "";
  currentUsername = "";
  currentPassword = "";
  currentStudentId = "";
  updateLoginView();
  showMessage("");
  loadQuestions();
});

updateLoginView();
loadQuestions();
