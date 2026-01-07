const answersDiv = document.getElementById("answers");
const typeSelect = document.getElementById("type");
const imageInput = document.getElementById("image");
const preview = document.getElementById("preview");

/* ===== IMAGE PREVIEW ===== */
if (imageInput) {
  imageInput.addEventListener("change", () => {
    const file = imageInput.files[0];
    if (!file) return;
    preview.src = URL.createObjectURL(file);
    preview.style.display = "block";
  });
}

/* ===== RENDER ANSWER OPTIONS ===== */
function toggleType() {
  answersDiv.innerHTML = "";
  const inputType = typeSelect.value === "single" ? "radio" : "checkbox";

  for (let i = 0; i < 4; i++) {
    answersDiv.innerHTML += `
      <label class="option">
        <input type="${inputType}" name="correct" value="${i}">
        Correct Option ${String.fromCharCode(65 + i)}
      </label>
    `;
  }
}

/* ===== SAVE QUESTION ===== */
async function addQuestion() {
  const question = document.getElementById("question").value.trim();
  const options = [
    opt0.value.trim(),
    opt1.value.trim(),
    opt2.value.trim(),
    opt3.value.trim()
  ];

  if (!question || options.some(o => !o)) {
    alert("Fill question and all options");
    return;
  }

  const selected = document.querySelectorAll("input[name='correct']:checked");
  if (selected.length === 0) {
    alert("Select correct answer");
    return;
  }

  const formData = new FormData();
  formData.append("question", question);
  formData.append("type", typeSelect.value);
  formData.append("options", JSON.stringify(options));
  formData.append(
    "answer",
    JSON.stringify(Array.from(selected).map(i => Number(i.value)))
  );

  if (imageInput.files[0]) {
    formData.append("image", imageInput.files[0]);
  }

  try {
    const res = await fetch("/admin/add-question", {
      method: "POST",
      headers: { "x-admin": "true" },   // 🔥 REQUIRED
      body: formData
    });

    const data = await res.json();
    alert(data.message || "Question saved successfully");

    // Reset form
    document.getElementById("question").value = "";
    opt0.value = opt1.value = opt2.value = opt3.value = "";
    imageInput.value = "";
    preview.style.display = "none";
    toggleType();

  } catch (err) {
    alert("Server error while saving question");
    console.error(err);
  }
}

/* ===== INIT ===== */
toggleType();
