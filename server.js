const express = require("express");
const fs = require("fs");
const path = require("path");
const multer = require("multer");

/* =========================
   HELPERS
========================= */
const readJSON = (file, fallback = []) => {
  try {
    if (!fs.existsSync(file)) return fallback;
    const raw = fs.readFileSync(file, "utf8").trim();
    return raw ? JSON.parse(raw) : fallback;
  } catch (err) {
    console.error("JSON ERROR:", file);
    return fallback;
  }
};

const writeJSON = (file, data) => {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
};

const ensureDir = dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

const ensureFile = (file, data) => {
  if (!fs.existsSync(file)) writeJSON(file, data);
};

/* =========================
   INIT STORAGE
========================= */
ensureDir("./data");
ensureDir("./data/questions");
ensureDir("./data/results");

ensureFile("./data/users.json", []);
ensureFile("./data/quizzes.json", []);
ensureFile("./data/quiz-status.json", {
  currentQuiz: null,
  active: false,
  started: false,
  title: "",
  joined: []
});

/* =========================
   APP SETUP
========================= */
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static("public"));
app.use("/uploads", express.static("public/uploads"));

/* =========================
   MULTER
========================= */
const storage = multer.diskStorage({
  destination: "public/uploads/",
  filename: (_, file, cb) =>
    cb(null, Date.now() + "-" + file.originalname)
});
const upload = multer({ storage });

/* =========================
   HOME
========================= */
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "views/login.html"));
});

/* =========================
   SAFE VIEW ROUTER
========================= */
app.get("/views/:page", (req, res) => {
  const allowed = [
    "login.html",
    "user-dashboard.html",
    "quiz.html",
    "leaderboard.html",
    "set-nickname.html",
    "admin-dashboard.html",
    "admin-add-question.html",
    "admin-manage-questions.html",
    "admin-analytics.html",
    "admin-users.html"
  ];

  if (!allowed.includes(req.params.page))
    return res.status(403).send("Access denied");

  res.sendFile(path.join(__dirname, "views", req.params.page));
});

/* =========================
   AUTH
========================= */
app.post("/api/login", (req, res) => {
  const { username, password, role } = req.body;
  const users = readJSON("./data/users.json");

  const user = users.find(
    u => u.username === username && u.role === role
  );

  if (!user || user.password !== password)
    return res.status(401).json({ message: "Invalid credentials" });

  res.json({
    username: user.username,
    role: user.role,
    nickname: user.nickname || ""
  });
});

/* =========================
   QUIZZES
========================= */
app.get("/api/quizzes", (req, res) => {
  res.json(readJSON("./data/quizzes.json"));
});

app.post("/admin/create-quiz", (req, res) => {
  const { title } = req.body;
  const quizzes = readJSON("./data/quizzes.json");

  const id = "quiz-" + Date.now();
  quizzes.push({ id, title, active: false });

  writeJSON("./data/quizzes.json", quizzes);
  writeJSON(`./data/questions/${id}.json`, []);
  writeJSON(`./data/results/${id}.json`, []);

  res.json({ message: "Quiz created", id });
});

app.post("/admin/activate-quiz", (req, res) => {
  const { quizId } = req.body;
  const quizzes = readJSON("./data/quizzes.json");

  quizzes.forEach(q => (q.active = q.id === quizId));
  writeJSON("./data/quizzes.json", quizzes);

  writeJSON("./data/quiz-status.json", {
    currentQuiz: quizId,
    active: true,
    started: false,
    title: quizzes.find(q => q.id === quizId)?.title || "",
    joined: []
  });

  res.json({ message: "Quiz activated" });
});

/* =========================
   QUIZ STATUS
========================= */
app.get("/api/quiz-status", (req, res) => {
  res.json(readJSON("./data/quiz-status.json"));
});

app.post("/api/join-quiz", (req, res) => {
  const { username, nickname } = req.body;
  const status = readJSON("./data/quiz-status.json");

  if (status.started)
    return res.status(403).json({ message: "Quiz already started" });

  if (!status.joined.some(u => u.username === username)) {
    status.joined.push({ username, nickname });
    writeJSON("./data/quiz-status.json", status);
  }

  res.json({ message: "Joined quiz" });
});

app.post("/admin/start-quiz", (req, res) => {
  const status = readJSON("./data/quiz-status.json");
  status.started = true;
  writeJSON("./data/quiz-status.json", status);
  res.json({ message: "Quiz started" });
});

app.post("/admin/reset-quiz", (req, res) => {
  writeJSON("./data/quiz-status.json", {
    currentQuiz: null,
    active: false,
    started: false,
    title: "",
    joined: []
  });
  res.json({ message: "Quiz reset" });
});
app.post("/admin/start-quiz", (req, res) => {
  const status = readJSON("./data/quiz-status.json");

  if (!status.currentQuiz) {
    return res.status(400).json({ message: "No quiz activated" });
  }

  status.started = true;
  status.ended = false;

  writeJSON("./data/quiz-status.json", status);

  res.json({ message: "Quiz started" });
});

/* =========================
   QUESTIONS
========================= */
app.get("/api/questions", (req, res) => {
  const status = readJSON("./data/quiz-status.json");
  if (!status.currentQuiz) return res.json([]);
  res.json(readJSON(`./data/questions/${status.currentQuiz}.json`));
});

app.post("/admin/add-question", upload.single("image"), (req, res) => {
  const status = readJSON("./data/quiz-status.json");
  if (!status.currentQuiz)
    return res.status(400).json({ message: "No active quiz" });

  const questions = readJSON(`./data/questions/${status.currentQuiz}.json`);

  questions.push({
    id: questions.length + 1,
    type: req.body.type,
    question: req.body.question,
    options: JSON.parse(req.body.options || "[]"),
    answer: JSON.parse(req.body.answer || "[]"),
    image: req.file ? `/uploads/${req.file.filename}` : ""
  });

  writeJSON(`./data/questions/${status.currentQuiz}.json`, questions);
  res.json({ message: "Question added successfully ✅" });
});

/* =========================
   SUBMIT & SCORING
========================= */
app.post("/api/submit", (req, res) => {
  const { username, nickname, answers, timeTaken } = req.body;
  const status = readJSON("./data/quiz-status.json");

  if (!status.currentQuiz)
    return res.status(400).json({ message: "No active quiz" });

  const questions = readJSON(
    `./data/questions/${status.currentQuiz}.json`
  );

  let correct = 0;
  questions.forEach(q => {
    if (
      JSON.stringify((answers[q.id] || []).sort()) ===
      JSON.stringify(q.answer.sort())
    ) correct++;
  });

  const total = questions.length;
  const accuracy = total ? Math.round((correct / total) * 100) : 0;

  const score =
    correct * 10 +
    Math.round((accuracy / 100) * 20) +
    Math.max(0, Math.round(((300 - timeTaken) / 300) * 20));

  const resultsPath = `./data/results/${status.currentQuiz}.json`;
  const results = readJSON(resultsPath);

  results.push({
    username,
    nickname,
    correct,
    total,
    accuracy,
    time: timeTaken,
    score
  });

  writeJSON(resultsPath, results);
  res.json({ score });
});

/* =========================
   ANALYTICS
========================= */
app.get("/admin/analytics/:quizId", (req, res) => {
  const results = readJSON(`./data/results/${req.params.quizId}.json`);

  if (!results.length)
    return res.json({ participants: 0 });

  res.json({
    participants: results.length,
    averageScore: Math.round(
      results.reduce((a, b) => a + b.score, 0) / results.length
    ),
    averageAccuracy: Math.round(
      results.reduce((a, b) => a + b.accuracy, 0) / results.length
    ),
    highestScore: Math.max(...results.map(r => r.score)),
    fastestTime: Math.min(...results.map(r => r.time))
  });
});
/* =========================
   SET NICKNAME (FIX)
========================= */
app.post("/api/set-nickname", (req, res) => {
  const { username, nickname } = req.body;

  if (!username || !nickname) {
    return res.status(400).json({ message: "Missing data" });
  }

  const users = readJSON("./data/users.json");

  const user = users.find(u => u.username === username);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  // allow nickname only once (optional)
  if (user.nickname) {
    return res.status(403).json({ message: "Nickname already set" });
  }

  user.nickname = nickname;
  writeJSON("./data/users.json", users);

  res.json({ message: "Nickname saved" });
});
app.post("/admin/stop-quiz", (req, res) => {
  const status = readJSON("./data/quiz-status.json");

  if (!status.started) {
    return res.status(400).json({ message: "Quiz not running" });
  }

  status.started = false;
  status.ended = true;

  writeJSON("./data/quiz-status.json", status);

  res.json({ message: "Quiz stopped for all users" });
});
app.post("/admin/deactivate-quiz", (req, res) => {
  writeJSON("./data/quiz-status.json", {
    currentQuiz: null,
    active: false,
    started: false,
    ended: false,
    title: "",
    joined: []
  });

  res.json({ message: "Quiz deactivated" });
});

/* =========================
   DOWNLOAD RESULTS (PER QUIZ)
========================= */
app.get("/admin/download-results/:quizId", (req, res) => {
  const quizId = req.params.quizId;
  const resultsPath = `./data/results/${quizId}.json`;

  if (!fs.existsSync(resultsPath)) {
    return res.status(404).send("Results not found");
  }

  const results = readJSON(resultsPath);

  let csv = "Username,Nickname,Correct,Total,Accuracy,Time,Score\n";
  results.forEach(r => {
    csv += `${r.username},${r.nickname},${r.correct},${r.total},${r.accuracy},${r.time},${r.score}\n`;
  });

  res.header("Content-Type", "text/csv");
  res.attachment(`${quizId}-results.csv`);
  res.send(csv);
});

/* =========================
   START SERVER
========================= */
app.listen(PORT, () =>
  console.log("Server running on port " + PORT)
);
