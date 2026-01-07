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
  if (document.hidden) {
    addViolation("Tab switched or minimized");
  }
});
window.addEventListener("beforeunload", (e) => {
  if (!submitted) {
    addViolation("Page refresh or close detected");
    e.preventDefault();
    e.returnValue = "";
  }
});
document.addEventListener("copy", e => e.preventDefault());
document.addEventListener("paste", e => e.preventDefault());
document.addEventListener("contextmenu", e => e.preventDefault());

let questions = [];
let current = 0;
let answers = {};
let timeLeft = 300; // 5 minutes
let timer;

const username = localStorage.getItem("username");
const nickname = localStorage.getItem("nickname");

async function loadQuiz() {
  const res = await fetch("/api/questions");
  questions = await res.json();
  showQuestion();
  startTimer();
}

function showQuestion() {
  const q = questions[current];
  document.getElementById("qno").innerText =
    `Question ${current + 1} / ${questions.length}`;
  document.getElementById("question").innerText = q.question;

  const optDiv = document.getElementById("options");
  optDiv.innerHTML = "";

  q.options.forEach((opt, idx) => {
    const inputType = q.type === "single" ? "radio" : "checkbox";
    const checked =
      answers[q.id]?.includes(idx) ? "checked" : "";

    optDiv.innerHTML += `
      <label>
        <input type="${inputType}" name="opt"
          value="${idx}" ${checked}
          onchange="selectAnswer(${q.id}, ${idx}, '${q.type}')">
        ${opt}
      </label><br>
    `;
  });
}

function selectAnswer(qid, idx, type) {
  if (!answers[qid]) answers[qid] = [];

  if (type === "single") {
    answers[qid] = [idx];
  } else {
    if (answers[qid].includes(idx)) {
      answers[qid] = answers[qid].filter(i => i !== idx);
    } else {
      answers[qid].push(idx);
    }
  }
}

function nextQuestion() {
  if (current < questions.length - 1) {
    current++;
    showQuestion();
  }
}
function showQuestion() {
  const q = questions[current];

  document.getElementById("qno").innerText =
    `Question ${current + 1} / ${questions.length}`;

  const img = q.image
    ? `<img src="${q.image}" style="max-width:100%;border-radius:8px;margin-bottom:10px;">`
    : "";

  document.getElementById("question").innerHTML = img + q.question;

  const optDiv = document.getElementById("options");
  optDiv.innerHTML = "";

  document.getElementById("nextBtn").disabled = true;

  q.options.forEach((opt, idx) => {
    optDiv.innerHTML += `
      <label>
        <input type="${q.type === "single" ? "radio" : "checkbox"}"
               name="opt"
               onchange="selectAnswer(${q.id}, ${idx}, '${q.type}')">
        <span>${opt}</span>
      </label>`;
  });

  document.getElementById("progressBar").style.width =
    `${((current) / questions.length) * 100}%`;
}

function selectAnswer(qid, idx, type) {
  if (!answers[qid]) answers[qid] = [];

  if (type === "single") {
    answers[qid] = [idx];
  } else {
    if (answers[qid].includes(idx)) {
      answers[qid] = answers[qid].filter(i => i !== idx);
    } else {
      answers[qid].push(idx);
    }
  }

  document.getElementById("nextBtn").disabled = false;
}

function startTimer() {
  const bar = document.getElementById("timerBar");

  timer = setInterval(() => {
    timeLeft--;
    bar.style.width = `${(timeLeft / 300) * 100}%`;

    if (timeLeft <= 0) {
      clearInterval(timer);
      submitQuiz();
    }
  }, 1000);
}

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

async function submitQuiz() {
  if (submitted) return; // block re-submit
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

  const data = await res.json();
  alert(`Quiz finished! Your score: ${data.score}`);
  window.location.href = "/views/leaderboard.html";
}
const q = questions[current];

const imgTag = q.image
  ? `<img src="${q.image}" style="max-width:100%;margin-bottom:10px;border-radius:8px;">`
  : "";

document.getElementById("question").innerHTML =
  imgTag + q.question;

loadQuiz();
