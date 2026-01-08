/* =========================
   SESSION CHECK
========================= */
const username = localStorage.getItem("username");
const nickname = localStorage.getItem("nickname");

if (!username || !nickname) {
  alert("Session expired. Please login again.");
  window.location.href = "/";
}

/* =========================
   QUIZ STATUS CHECK
========================= */
async function checkQuizStatus() {
  const res = await fetch("/api/quiz-status");
  const status = await res.json();

  if (status.ended) {
    alert("Quiz has ended");
    submitQuiz();
  }

  if (!status.started) {
    alert("Quiz not started");
    window.location.href = "/views/user-dashboard.html";
  }
}

setInterval(checkQuizStatus, 3000);


checkQuizStart();

/* =========================
   ANTI CHEAT
========================= */
let violations = 0;
let submitted = false;
const MAX_VIOLATIONS = 2;

function addViolation(reason) {
  if (submitted) return;
  violations++;
  document.getElementById("warning").innerText =
    `⚠ Warning ${violations}: ${reason}`;

  if (violations >= MAX_VIOLATIONS) {
    submitQuiz();
  }
}

document.addEventListener("visibilitychange", () => {
  if (document.hidden && !submitted)
    addViolation("Tab switched");
});

["copy", "paste", "contextmenu"].forEach(e =>
  document.addEventListener(e, ev => ev.preventDefault())
);

/* =========================
   QUIZ STATE
========================= */
let questions = [];
let current = 0;
let answers = {};
let timeLeft = 300;
let timer;

/* =========================
   LOAD QUIZ
========================= */
async function loadQuiz() {
  const res = await fetch("/api/questions");
  questions = await res.json();

  if (!questions.length) {
    alert("No questions available");
    return;
  }

  showQuestion();
  startTimer();
}

/* =========================
   SHOW QUESTION
========================= */
function showQuestion() {
  const q = questions[current];

  document.getElementById("qno").innerText =
    `Question ${current + 1} / ${questions.length}`;

  document.getElementById("question").innerHTML =
    (q.image ? `<img src="${q.image}" style="max-width:100%;border-radius:10px">` : "") +
    q.question;

  const optDiv = document.getElementById("options");
  optDiv.innerHTML = "";
  document.getElementById("nextBtn").disabled = true;

  q.options.forEach((opt, i) => {
    optDiv.innerHTML += `
      <label class="option">
        <input type="${q.type === "single" ? "radio" : "checkbox"}"
               name="opt"
               onchange="selectAnswer(${q.id}, ${i}, '${q.type}')">
        ${opt}
      </label>
    `;
  });

  document.getElementById("progressBar").style.width =
    `${((current + 1) / questions.length) * 100}%`;
}

/* =========================
   SELECT ANSWER
========================= */
function selectAnswer(qid, idx, type) {
  if (!answers[qid]) answers[qid] = [];

  if (type === "single") answers[qid] = [idx];
  else {
    answers[qid].includes(idx)
      ? answers[qid] = answers[qid].filter(i => i !== idx)
      : answers[qid].push(idx);
  }

  document.getElementById("nextBtn").disabled = false;
}

/* =========================
   NAVIGATION
========================= */
function nextQuestion() {
  if (current < questions.length - 1) {
    current++;
    showQuestion();
  }
}

/* =========================
   TIMER
========================= */
function startTimer() {
  timer = setInterval(() => {
    if (submitted) return;

    timeLeft--;
    document.getElementById("timer").innerText = timeLeft;

    if (timeLeft <= 0) {
      clearInterval(timer);
      submitQuiz();
    }
  }, 1000);
}

/* =========================
   SUBMIT
========================= */
async function submitQuiz() {
  if (submitted) return;
  submitted = true;

  clearInterval(timer);

  const res = await fetch("/api/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username,
      nickname,
      answers,
      timeTaken: 300 - timeLeft
    })
  });

  const data = await res.json();
  alert(`Quiz finished! Score: ${data.score}`);
  window.location.href = "/views/leaderboard.html";
}

loadQuiz();
