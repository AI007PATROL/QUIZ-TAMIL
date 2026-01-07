const multer = require("multer");
const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/uploads/");
  },
  filename: function (req, file, cb) {
    const unique = Date.now() + "-" + file.originalname;
    cb(null, unique);
  }
});

const upload = multer({ storage });

app.use(express.json());
app.use(express.static("public"));

/* Serve login page */
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "login.html"));
});

/* ===== AUTH API ===== */
app.post("/api/login", (req, res) => {
  const { username, password, role } = req.body;

  if (!username || !password || !role) {
    return res.status(400).json({ message: "Missing fields" });
  }

  const usersPath = path.join(__dirname, "data", "users.json");
  const users = JSON.parse(fs.readFileSync(usersPath));

  const user = users.find(
    u => u.username === username && u.role === role
  );

  if (!user) {
    return res.status(401).json({ message: "User not found" });
  }

  if (user.password !== password) {
    return res.status(401).json({ message: "Incorrect password" });
  }

  // Success
  res.json({
    message: "Login successful",
    username: user.username,
    role: user.role,
    nickname: user.nickname || ""
  });
});

/* ===== PROTECTED PAGES ===== */
app.get("/views/:page", (req, res) => {
  res.sendFile(path.join(__dirname, "views", req.params.page));
});

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
/* ===== NICKNAME CHECK ===== */
app.get("/api/user/:username", (req, res) => {
  const users = JSON.parse(fs.readFileSync("./data/users.json"));
  const user = users.find(u => u.username === req.params.username);

  if (!user) return res.status(404).json({ message: "User not found" });

  res.json({
    username: user.username,
    nickname: user.nickname || ""
  });
});

/* ===== SET NICKNAME (ONE TIME) ===== */
app.post("/api/set-nickname", (req, res) => {
  const { username, nickname } = req.body;

  if (!nickname) {
    return res.status(400).json({ message: "Nickname required" });
  }

  const usersPath = "./data/users.json";
  const users = JSON.parse(fs.readFileSync(usersPath));

  const user = users.find(u => u.username === username);
  if (!user) return res.status(404).json({ message: "User not found" });

  if (user.nickname && user.nickname !== "") {
    return res.status(403).json({ message: "Nickname already set" });
  }

  user.nickname = nickname;

  fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));
  res.json({ message: "Nickname saved", nickname });
});

/* ===== ADMIN OVERRIDE ===== */
app.post("/admin/update-nickname", (req, res) => {
  const { username, nickname } = req.body;

  const usersPath = "./data/users.json";
  const users = JSON.parse(fs.readFileSync(usersPath));

  const user = users.find(u => u.username === username);
  if (!user) return res.status(404).json({ message: "User not found" });

  user.nickname = nickname;
  fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));

  res.json({ message: "Nickname updated by admin" });
});
/* ===== LOAD QUESTIONS ===== */
app.get("/api/questions", (req, res) => {
  const questions = JSON.parse(fs.readFileSync("./data/questions.json"));
  res.json(questions);
});

/* ===== SUBMIT QUIZ ===== */
app.post("/api/submit", (req, res) => {
  const { username, nickname, answers, timeTaken } = req.body;

  const questions = JSON.parse(fs.readFileSync("./data/questions.json"));
  let score = 0;

  questions.forEach(q => {
    const userAns = answers[q.id] || [];
    if (
      JSON.stringify(userAns.sort()) ===
      JSON.stringify(q.answer.sort())
    ) {
      score++;
    }
  });

  const resultsPath = "./data/results.json";
  const results = JSON.parse(fs.readFileSync(resultsPath));

results.push({
  username,
  nickname,
  score,
  time: timeTaken,
  violations
});


  fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
  res.json({ score });
});
/* ===== ADD QUESTION WITH OPTIONAL IMAGE (ADMIN) ===== */
app.post("/admin/add-question", upload.single("image"), (req, res) => {
  const { type, question, options, answer } = req.body;

  const questions = JSON.parse(fs.readFileSync("./data/questions.json"));

  const newQuestion = {
    id: questions.length + 1,
    type,
    question,
    options: JSON.parse(options),
    answer: JSON.parse(answer),
    image: req.file ? `/uploads/${req.file.filename}` : ""
  };

  questions.push(newQuestion);
  fs.writeFileSync("./data/questions.json", JSON.stringify(questions, null, 2));

  res.json({ message: "Question added successfully ✅" });
});

/* ===== GET ALL QUESTIONS (ADMIN) ===== */
app.get("/admin/questions", (req, res) => {
  const questions = JSON.parse(fs.readFileSync("./data/questions.json"));
  res.json(questions);
});

/* ===== UPDATE QUESTION ===== */
app.post("/admin/update-question", upload.single("image"), (req, res) => {
  const { id, type, question, options, answer } = req.body;

  const qPath = "./data/questions.json";
  const questions = JSON.parse(fs.readFileSync(qPath));

  const qIndex = questions.findIndex(q => q.id == id);
  if (qIndex === -1) {
    return res.status(404).json({ message: "Question not found" });
  }

  let imagePath = questions[qIndex].image || "";
  if (req.file) {
    imagePath = `/uploads/${req.file.filename}`;
  }

  questions[qIndex] = {
    ...questions[qIndex],
    type,
    question,
    options: JSON.parse(options),
    answer: JSON.parse(answer),
    image: imagePath
  };

  fs.writeFileSync(qPath, JSON.stringify(questions, null, 2));
  res.json({ message: "Question updated successfully ✅" });
});
app.use("/uploads", express.static("public/uploads"));
/* ===== DELETE QUESTION ===== */
app.delete("/admin/delete-question/:id", (req, res) => {
  const qPath = "./data/questions.json";
  let questions = JSON.parse(fs.readFileSync(qPath));

  questions = questions.filter(q => q.id != req.params.id);

  // Reassign IDs
  questions.forEach((q, i) => q.id = i + 1);

  fs.writeFileSync(qPath, JSON.stringify(questions, null, 2));
  res.json({ message: "Question deleted ❌" });
});
