const menuToggle = document.getElementById("menuToggle");
const mainNav = document.getElementById("mainNav");

if (menuToggle && mainNav) {
  menuToggle.addEventListener("click", () => {
    const isOpen = mainNav.classList.toggle("open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
    menuToggle.textContent = isOpen ? "✕" : "☰";
  });

  mainNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      mainNav.classList.remove("open");
      menuToggle.setAttribute("aria-expanded", "false");
      menuToggle.textContent = "☰";
    });
  });
}

const year = document.getElementById("year");
if (year) year.textContent = new Date().getFullYear();

// Game catalogue: category filters, live search and template selection.
const gameGrid = document.getElementById("gameGrid");
const gameSearch = document.getElementById("gameSearch");
const gameFilters = document.getElementById("gameFilters");
const gameCount = document.getElementById("gameCount");
let activeCategory = "All";

function filterGames() {
  if (!gameGrid) return;
  const query = (gameSearch?.value || "").trim().toLowerCase();
  const cards = [...gameGrid.querySelectorAll(".game-card")];
  let visible = 0;
  cards.forEach((card) => {
    const matchesCategory = activeCategory === "All" || card.dataset.category === activeCategory;
    const matchesSearch = card.textContent.toLowerCase().includes(query);
    const show = matchesCategory && matchesSearch;
    card.hidden = !show;
    if (show) visible++;
  });
  if (gameCount) gameCount.textContent = `Showing ${visible} of 20 game templates`;
}

if (gameSearch) gameSearch.addEventListener("input", filterGames);

if (gameFilters) {
  gameFilters.addEventListener("click", (event) => {
    const button = event.target.closest("[data-filter]");
    if (!button) return;
    activeCategory = button.dataset.filter;
    gameFilters.querySelectorAll(".filter-chip").forEach((chip) => {
      chip.classList.toggle("active", chip === button);
    });
    filterGames();
  });
}

if (gameGrid) {
  gameGrid.addEventListener("click", (event) => {
    const button = event.target.closest(".choose-game");
    if (!button) return;
    const card = button.closest(".game-card");
    const gameName = card.querySelector("h3")?.textContent || "Game";
    alert(`${gameName} selected! The Game Studio editor is the next development step.`);
  });
}
