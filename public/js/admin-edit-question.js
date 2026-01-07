const params = new URLSearchParams(window.location.search);
const qid = params.get("id");
let currentQuestion = null;

async function loadQuestion() {
  const res = await fetch("/admin/questions");
  const questions = await res.json();

  currentQuestion = questions.find(q => q.id == qid);

  if (!currentQuestion) {
    alert("Question not found");
    window.location.href = "/views/admin-manage-questions.html";
    return;
  }

  document.getElementById("question").value = currentQuestion.question;
  document.getElementById("type").value = currentQuestion.type;

  ["opt0", "opt1", "opt2", "opt3"].forEach((id, i) => {
    document.getElementById(id).value = currentQuestion.options[i] || "";
  });

  renderAnswers();
}

function renderAnswers() {
  const ansDiv = document.getElementById("answers");
  ansDiv.innerHTML = "<p><b>Select correct answer(s)</b></p>";

  for (let i = 0; i < 4; i++) {
    const checked = currentQuestion.answer.includes(i) ? "checked" : "";

    ansDiv.innerHTML += `
      <label class="option">
        <input type="${currentQuestion.type === "single" ? "radio" : "checkbox"}"
               name="correct" value="${i}" ${checked}>
        Option ${String.fromCharCode(65 + i)}
      </label>
    `;
  }
}

// Re-render answers when type changes
document.getElementById("type").addEventListener("change", () => {
  currentQuestion.type = document.getElementById("type").value;
  renderAnswers();
});

async function updateQuestion() {
  const formData = new FormData();

  formData.append("id", qid);
  formData.append("type", document.getElementById("type").value);
  formData.append("question", document.getElementById("question").value);

  const options = [
    document.getElementById("opt0").value,
    document.getElementById("opt1").value,
    document.getElementById("opt2").value,
    document.getElementById("opt3").value
  ];
  formData.append("options", JSON.stringify(options));

  const selected = document.querySelectorAll("input[name='correct']:checked");
  if (selected.length === 0) {
    alert("Select at least one correct answer");
    return;
  }

  formData.append(
    "answer",
    JSON.stringify(Array.from(selected).map(i => Number(i.value)))
  );

  const img = document.getElementById("image").files[0];
  if (img) formData.append("image", img);

  const res = await fetch("/admin/update-question", {
    method: "POST",
    body: formData
  });

  const data = await res.json();
  alert(data.message);
  window.location.href = "/views/admin-manage-questions.html";
}

loadQuestion();
