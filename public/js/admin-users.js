// admin logic
async function loadUsers() {
  const res = await fetch("/admin/users");
  const users = await res.json();

  const container = document.getElementById("userList");
  container.innerHTML = "";

  if (users.length === 0) {
    container.innerHTML = "<p>No users found.</p>";
    return;
  }

  users.forEach(u => {
    container.innerHTML += `
      <div class="option">
        <div style="flex:1">
          <b>${u.username}</b><br>
          <small>Nickname: ${u.nickname || "Not set"}</small>
        </div>
        <button class="btn secondary" onclick="editNickname('${u.username}')">
          ✏️ Edit
        </button>
      </div>
    `;
  });
}

async function editNickname(username) {
  let newNick = prompt("Enter new nickname");
  if (!newNick) return;

  newNick = newNick.trim();
  if (!newNick) {
    alert("Nickname cannot be empty");
    return;
  }

  const res = await fetch("/admin/update-nickname", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, nickname: newNick })
  });

  const data = await res.json();
  alert(data.message);
  loadUsers();
}

loadUsers();
