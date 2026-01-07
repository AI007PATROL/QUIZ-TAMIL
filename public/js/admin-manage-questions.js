async function loadQuestions() {
  const res = await fetch("/admin/questions");
  const questions = await res.json();

  const list = document.getElementById("questionList");
  list.innerHTML = "";

  if (questions.length === 0) {
    list.innerHTML = "<p>No questions added yet.</p>";
    return;
  }

  questions.forEach(q => {
    list.innerHTML += `
      <div class="option" style="flex-direction:column;align-items:flex-start">
        <p><b>Q${q.id}:</b> ${q.question}</p>

        ${
          q.image
            ? `<img src="${q.image}" style="max-width:100%;border-radius:10px;margin:8px 0;">`
            : ""
        }

        <div style="display:flex;gap:10px;margin-top:8px;width:100%">
          <button class="btn secondary" onclick="editQuestion(${q.id})">
            ✏️ Edit
          </button>
          <button class="btn secondary" onclick="deleteQuestion(${q.id})">
            🗑 Delete
          </button>
        </div>
      </div>
    `;
  });
}

async function deleteQuestion(id) {
  if (!confirm("Delete this question?")) return;

  const res = await fetch(`/admin/delete-question/${id}`, {
    method: "DELETE"
  });

  const data = await res.json();
  alert(data.message);
  loadQuestions();
}

function editQuestion(id) {
  window.location.href = `/views/admin-edit-question.html?id=${id}`;
}

loadQuestions();
