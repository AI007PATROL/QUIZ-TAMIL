/* =========================
   QUIZ START CHECK
========================= */
async function checkQuizStart() {
  const res = await fetch("/api/quiz-status");
  const status = await res.json();

  if (!status.started) {
    alert("Quiz has not started yet");
    window.location.href = "/views/user-dashboard.html";
  }
}

checkQuizStart();

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
   ANTI-CHEAT
========================= */
let violations = 0;
const MAX_VIOLATIONS = 2;
let submitted = false;

function addViolation(reason) {
  violations++;
  document.getElementById("warning").innerText =
    `⚠ Warning ${violations}: ${reason}`;

  if (violations >= MAX_VIOLATIONS) {
    alert("Too many violations. Quiz auto-submitted.");
    submitQuiz();
  }
}

document.addEventListener("visibilitychange", () => {
  if (document.hidden && !submitted) {
    addViolation("Tab switched or minimized");
  }
});

window.addEventListener("beforeunload", e => {
  if (!submitted && timeLeft > 0) {
    e.preventDefault();
    e.returnValue = "";
  }
});

["copy", "paste", "contextmenu"].forEach(evt =>
  document.addEventListener(evt, e => e.preventDefault())
);

/* =========================
   QUIZ STATE
========================= */
let questions = [];
let current = 0;
let answers = {};
let timeLeft = 300; // 5 minutes
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
   RENDER QUESTION
========================= */
function showQuestion() {
  const q = questions[current];

  document.getElementById("qno").innerText =
    `Question ${current + 1} / ${questions.length}`;

  const img = q.image
    ? `<img src="${q.image}" style="max-width:100%;border-radius:10px;margin-bottom:10px;">`
    : "";

  document.getElementById("question").innerHTML = img + q.question;

  const optDiv = document.getElementById("options");
  optDiv.innerHTML = "";

  document.getElementById("nextBtn").disabled = true;

  q.options.forEach((opt, idx) => {
    const checked =
      answers[q.id]?.includes(idx) ? "checked" : "";

    optDiv.innerHTML += `
      <label class="option">
        <input type="${q.type === "single" ? "radio" : "checkbox"}"
               name="opt"
               value="${idx}"
               ${checked}
               onchange="selectAnswer(${q.id}, ${idx}, '${q.type}')">
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

  if (type === "single") {
    answers[qid] = [idx];
  } else {
    answers[qid].includes(idx)
      ? (answers[qid] = answers[qid].filter(i => i !== idx))
      : answers[qid].push(idx);
  }

  document.getElementById("nextBtn").disabled = false;
}

/* =========================
   NEXT QUESTION
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
    timeLeft--;
    document.getElementById("timer").innerText = timeLeft;

    if (timeLeft <= 0) {
      clearInterval(timer);
      submitQuiz();
    }
  }, 1000);
}

/* =========================
   SUBMIT QUIZ
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
      timeTaken: 300 - timeLeft,
      violations
    })
  });

  const data = await res.json();
  alert(`Quiz finished! Your score: ${data.score}`);
  window.location.href = "/views/leaderboard.html";
}

/* =========================
   START QUIZ
========================= */
loadQuiz();
