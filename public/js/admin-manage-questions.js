async function loadQuestions() {
  const res = await fetch("/admin/questions");
  const questions = await res.json();

  const list = document.getElementById("questionList");
  list.innerHTML = "";

  questions.forEach(q => {
    list.innerHTML += `
      <div style="border-bottom:1px solid #ddd;padding:10px;">
        <p><b>Q${q.id}:</b> ${q.question}</p>
        ${q.image ? `<img src="${q.image}" style="max-width:100%;border-radius:6px;">` : ""}
        <button onclick="editQuestion(${q.id})">Edit</button>
        <button class="secondary" onclick="deleteQuestion(${q.id})">Delete</button>
      </div>
    `;
  });
}

async function deleteQuestion(id) {
  if (!confirm("Delete this question?")) return;

  const res = await fetch(`/admin/delete-question/${id}`, {
    method: "DELETE",
    headers: { "x-admin": "true" }
  });

  const data = await res.json();
  alert(data.message);
  loadQuestions();
}

function editQuestion(id) {
  window.location.href = `/views/admin-edit-question.html?id=${id}`;
}

loadQuestions();
