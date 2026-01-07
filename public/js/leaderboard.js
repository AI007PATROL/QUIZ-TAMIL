async function loadLeaderboard() {
  const res = await fetch("/results");
  const data = await res.json();

  const board = document.getElementById("board");
  board.innerHTML = "";

  data.sort((a, b) => b.score - a.score || a.time - b.time);

  data.forEach((r, i) => {
    board.innerHTML += `
      <div class="option">
        <b>#${i + 1}</b>&nbsp;
        ${r.nickname} — ${r.score} pts
      </div>
    `;
  });
}
app.get("/results", (req, res) => {
  const results = JSON.parse(fs.readFileSync("./data/results.json"));
  res.json(results);
});

loadLeaderboard();
