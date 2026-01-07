async function login() {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();
  const role = document.getElementById("role").value;

  if (!username || !password) {
    alert("Enter username and password");
    return;
  }

  try {
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, role })
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.message);
      return;
    }

    // ✅ Save session data ONCE
    localStorage.setItem("username", data.username);
    localStorage.setItem("role", data.role);
    localStorage.setItem("nickname", data.nickname || "");

    // ✅ Redirect logic
    if (data.role === "admin") {
      window.location.href = "/views/admin-dashboard.html";
    } else {
      if (!data.nickname) {
        window.location.href = "/views/set-nickname.html";
      } else {
        window.location.href = "/views/user-dashboard.html";
      }
    }

  } catch (err) {
    alert("Server error. Try again.");
    console.error(err);
  }
}
