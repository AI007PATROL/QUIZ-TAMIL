async function saveNickname() {
  const nicknameInput = document.getElementById("nickname");
  const nickname = nicknameInput.value.trim();
  const username = localStorage.getItem("username");

  if (!username) {
    alert("Session expired. Please login again.");
    window.location.href = "/";
    return;
  }

  if (!nickname) {
    alert("Please enter a nickname");
    return;
  }

  try {
    const res = await fetch("/api/set-nickname", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, nickname })
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.message);
      return;
    }

    localStorage.setItem("nickname", data.nickname);
    window.location.href = "/views/user-dashboard.html";

  } catch (err) {
    alert("Server error. Try again.");
    console.error(err);
  }
}
