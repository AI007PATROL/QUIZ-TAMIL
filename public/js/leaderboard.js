async function loadLeaderboard() {
  const res = await fetch("/results");
  const data = await res.json();

  const board = document.getElementById("board");
  board.innerHTML = "";

  if (data.length === 0) {
    board.innerHTML = "<p>No results yet.</p>";
    return;
  }

  // Sort by score desc, then time asc
  data.sort((a, b) => b.score - a.score || a.time - b.time);

  data.forEach((r, i) => {
    board.innerHTML += `
      <div class="option">
        <b>#${i + 1}</b>&nbsp;
        ${r.nickname || r.username} — ${r.score} pts
      </div>
    `;
  });
}

loadLeaderboard();
