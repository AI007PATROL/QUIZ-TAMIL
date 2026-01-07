app.post("/admin/update-nickname", (req, res) => {
  const { username, nickname } = req.body;

  const usersPath = "./data/users.json";
  const users = JSON.parse(fs.readFileSync(usersPath));

  const user = users.find(u => u.username === username);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  user.nickname = nickname;
  fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));

  res.json({ message: "Nickname updated successfully ✅" });
});
