const express = require("express");
const fs = require("fs");
const path = require("path");
const multer = require("multer");

const app = express();
const PORT = process.env.PORT || 3000;

/* ===== MIDDLEWARE ===== */
app.use(express.json());
app.use(express.static("public"));
app.use("/uploads", express.static("public/uploads"));

/* ===== MULTER CONFIG ===== */
const storage = multer.diskStorage({
  destination: "public/uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});
const upload = multer({ storage });

/* ===== HOME ===== */
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "login.html"));
});

/* ===== AUTH ===== */
app.post("/api/login", (req, res) => {
  const { username, password, role } = req.body;

  const users = JSON.parse(fs.readFileSync("./data/users.json"));
  const user = users.find(u => u.username === username && u.role === role);

  if (!user || user.password !== password) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  res.json({
    username: user.username,
    role: user.role,
    nickname: user.nickname || ""
  });
});

/* ===== VIEW ROUTER ===== */
app.get("/views/:page", (req, res) => {
  res.sendFile(path.join(__dirname, "views", req.params.page));
});

/* ===== NICKNAME ===== */
app.get("/api/user/:username", (req, res) => {
  const users = JSON.parse(fs.readFileSync("./data/users.json"));
  const user = users.find(u => u.username === req.params.username);
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json({ username: user.username, nickname: user.nickname || "" });
});

app.post("/api/set-nickname", (req, res) => {
  const { username, nickname } = req.body;
  const users = JSON.parse(fs.readFileSync("./data/users.json"));

  const user = users.find(u => u.username === username);
  if (!user || user.nickname) {
    return res.status(403).json({ message: "Nickname already set" });
  }

  user.nickname = nickname;
  fs.writeFileSync("./data/users.json", JSON.stringify(users, null, 2));
  res.json({ nickname });
});

/* ===== ADMIN USER OVERRIDE ===== */
app.post("/admin/update-nickname", (req, res) => {
  const { username, nickname } = req.body;
  const users = JSON.parse(fs.readFileSync("./data/users.json"));

  const user = users.find(u => u.username === username);
  if (!user) return res.status(404).json({ message: "User not found" });

  user.nickname = nickname;
  fs.writeFileSync("./data/users.json", JSON.stringify(users, null, 2));
  res.json({ message: "Nickname updated" });
});

app.get("/admin/users", (req, res) => {
  res.json(JSON.parse(fs.readFileSync("./data/users.json")));
});

/* ===== QUIZ ===== */
app.get("/api/questions", (req, res) => {
  res.json(JSON.parse(fs.readFileSync("./data/questions.json")));
});

app.post("/api/submit", (req, res) => {
  const { username, nickname, answers, timeTaken, violations = 0 } = req.body;

  const questions = JSON.parse(fs.readFileSync("./data/questions.json"));
  let score = 0;

  questions.forEach(q => {
    if (
      JSON.stringify((answers[q.id] || []).sort()) ===
      JSON.stringify(q.answer.sort())
    ) score++;
  });

  const results = JSON.parse(fs.readFileSync("./data/results.json"));
  results.push({ username, nickname, score, time: timeTaken, violations });

  fs.writeFileSync("./data/results.json", JSON.stringify(results, null, 2));
  res.json({ score });
});

/* ===== ADMIN QUESTIONS ===== */
app.post("/admin/add-question", upload.single("image"), (req, res) => {
  const { type, question, options, answer } = req.body;
  const questions = JSON.parse(fs.readFileSync("./data/questions.json"));

  questions.push({
    id: questions.length + 1,
    type,
    question,
    options: JSON.parse(options),
    answer: JSON.parse(answer),
    image: req.file ? `/uploads/${req.file.filename}` : ""
  });

  fs.writeFileSync("./data/questions.json", JSON.stringify(questions, null, 2));
  res.json({ message: "Question added" });
});

app.get("/admin/questions", (req, res) => {
  res.json(JSON.parse(fs.readFileSync("./data/questions.json")));
});

app.post("/admin/update-question", upload.single("image"), (req, res) => {
  const { id, type, question, options, answer } = req.body;
  const questions = JSON.parse(fs.readFileSync("./data/questions.json"));

  const i = questions.findIndex(q => q.id == id);
  if (i === -1) return res.status(404).json({ message: "Not found" });

  questions[i] = {
    ...questions[i],
    type,
    question,
    options: JSON.parse(options),
    answer: JSON.parse(answer),
    image: req.file ? `/uploads/${req.file.filename}` : questions[i].image
  };

  fs.writeFileSync("./data/questions.json", JSON.stringify(questions, null, 2));
  res.json({ message: "Updated" });
});

app.delete("/admin/delete-question/:id", (req, res) => {
  let questions = JSON.parse(fs.readFileSync("./data/questions.json"));
  questions = questions.filter(q => q.id != req.params.id);
  questions.forEach((q, i) => q.id = i + 1);
  fs.writeFileSync("./data/questions.json", JSON.stringify(questions, null, 2));
  res.json({ message: "Deleted" });
});

/* ===== RESULTS ===== */
app.get("/results", (req, res) => {
  res.json(JSON.parse(fs.readFileSync("./data/results.json")));
});

app.get("/admin/download-results", (req, res) => {
  const results = JSON.parse(fs.readFileSync("./data/results.json"));
  let csv = "Username,Nickname,Score,Time,Violations\n";
  results.forEach(r => {
    csv += `${r.username},${r.nickname},${r.score},${r.time},${r.violations}\n`;
  });
  res.header("Content-Type", "text/csv");
  res.attachment("results.csv");
  res.send(csv);
});

/* ===== START SERVER (ALWAYS LAST) ===== */
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
