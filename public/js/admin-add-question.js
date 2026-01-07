app.post("/admin/add-question", upload.single("image"), (req, res) => {
  const { type, question, options, answer } = req.body;

  if (!type || !question || !options || !answer) {
    return res.status(400).json({ message: "Missing fields" });
  }

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
