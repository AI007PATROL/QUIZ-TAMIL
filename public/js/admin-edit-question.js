const params = new URLSearchParams(window.location.search);
const qid = params.get("id");
let currentQuestion = null;

async function loadQuestion() {
  const res = await fetch("/admin/questions");
  const questions = await res.json();
  currentQuestion = questions.find(q => q.id == qid);

  document.getElementById("question").value = currentQuestion.question;
  document.getElementById("type").value = currentQuestion.type;

  ["opt0","opt1","opt2","opt3"].forEach((id, i) => {
    document.getElementById(id).value = currentQuestion.options[i];
  });

  renderAnswers();
}

function renderAnswers() {
  const ansDiv = document.getElementById("answers");
  ansDiv.innerHTML = "";

  for (let i = 0; i < 4; i++) {
    const checked = currentQuestion.answer.includes(i) ? "checked" : "";
    ansDiv.innerHTML += `
      <label>
        <input type="${currentQuestion.type === "single" ? "radio" : "checkbox"}"
               name="correct" value="${i}" ${checked}>
        Correct Option ${String.fromCharCode(65 + i)}
      </label><br>
    `;
  }
}

async function updateQuestion() {
  const formData = new FormData();
  formData.append("id", qid);
  formData.append("type", document.getElementById("type").value);
  formData.append("question", document.getElementById("question").value);

  const options = [
    opt0.value, opt1.value, opt2.value, opt3.value
  ];
  formData.append("options", JSON.stringify(options));

  const selected = document.querySelectorAll("input[name='correct']:checked");
  formData.append("answer", JSON.stringify(Array.from(selected).map(i => +i.value)));

  const img = document.getElementById("image").files[0];
  if (img) formData.append("image", img);

  const res = await fetch("/admin/update-question", {
    method: "POST",
    headers: { "x-admin": "true" },
    body: formData
  });

  const data = await res.json();
  alert(data.message);
  window.location.href = "/views/admin-manage-questions.html";
}

loadQuestion();
