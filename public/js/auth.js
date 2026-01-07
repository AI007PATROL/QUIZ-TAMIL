function login() {
  const u = document.getElementById("username").value;
  const p = document.getElementById("password").value;
  const r = document.getElementById("role").value;

  if (!u || !p) {
    alert("Enter credentials");
    return;
  }

  if (r === "admin") {
    localStorage.setItem("isAdmin", "true");
    window.location.href = "/views/admin-dashboard.html";
  } else {
    window.location.href = "/views/user-dashboard.html";
  }
}
