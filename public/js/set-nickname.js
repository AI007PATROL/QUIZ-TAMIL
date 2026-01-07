async function saveNickname() {
  const nickname = document.getElementById("nickname").value.trim();
  const username = localStorage.getItem("username");

  if (!nickname) {
    alert("Nickname cannot be empty");
    return;
  }

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

  localStorage.setItem("nickname", nickname);
  alert("Welcome, " + nickname + " 🎉");
  window.location.href = "/views/user-dashboard.html";
}
