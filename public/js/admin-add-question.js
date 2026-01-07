async function addQuestion() {
  const question = document.getElementById("question").value.trim();
  const type = document.getElementById("type").value;

  const options = [
    document.getElementById("opt0").value,
    document.getElementById("opt1").value,
    document.getElementById("opt2").value,
    document.getElementById("opt3").value
  ];

  const selected = document.querySelectorAll("input[name='correct']:checked");
  if (!question || options.some(o => !o) || selected.length === 0) {
    alert("Fill all fields & select correct answers");
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
}
