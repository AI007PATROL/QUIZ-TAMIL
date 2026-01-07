function toggleType() {
  const type = document.getElementById("type").value;
  const ansDiv = document.getElementById("answers");
  ansDiv.innerHTML = "";

  for (let i = 0; i < 4; i++) {
    ansDiv.innerHTML += `
      <label>
        <input 
          type="${type === "single" ? "radio" : "checkbox"}"
          name="correct"
          value="${i}">
        Correct Option ${String.fromCharCode(65 + i)}
      </label><br>
    `;
  }
}

// 🔥 THIS LINE IS CRITICAL
toggleType();

async function addQuestion() {
  const question = document.getElementById("question").value.trim();
  const type = document.getElementById("type").value;

  const options = [
    document.getElementById("opt0").value.trim(),
    document.getElementById("opt1").value.trim(),
    document.getElementById("opt2").value.trim(),
    document.getElementById("opt3").value.trim()
  ];

  if (!question || options.some(o => !o)) {
    alert("Fill all fields");
    return;
  }

  const selected = document.querySelectorAll("input[name='correct']:checked");

  if (selected.length === 0) {
    alert("Select at least one correct answer");
    return;
  }

  const answer = Array.from(selected).map(i => Number(i.value));

  const imageFile = document.getElementById("image").files[0];

  const formData = new FormData();
  formData.append("type", type);
  formData.append("question", question);
  formData.append("options", JSON.stringify(options));
  formData.append("answer", JSON.stringify(answer));

  if (imageFile) {
    formData.append("image", imageFile);
  }

  const res = await fetch("/admin/add-question", {
    method: "POST",
    headers: { "x-admin": "true" },
    body: formData
  });

  const data = await res.json();
  alert(data.message);

  // reset
  document.getElementById("question").value = "";
  ["opt0","opt1","opt2","opt3"].forEach(id => {
    document.getElementById(id).value = "";
  });

  toggleType();
}
