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

// Expand one category at a time; each panel contains its four game choices.
const categoryGrid = document.getElementById("categoryGrid");
const categoryPanels = [...document.querySelectorAll("[data-category-panel]")];

function closeCategoryPanels() {
  categoryPanels.forEach((panel) => { panel.hidden = true; });
  categoryGrid?.querySelectorAll("[data-category-toggle]").forEach((button) => {
    button.setAttribute("aria-expanded", "false");
    const plus = button.querySelector(".category-meta b");
    if (plus) plus.textContent = "＋";
  });
}

if (categoryGrid) {
  categoryGrid.addEventListener("click", (event) => {
    const button = event.target.closest("[data-category-toggle]");
    if (!button) return;
    const id = button.dataset.categoryToggle;
    const panel = document.querySelector(`[data-category-panel="${id}"]`);
    const wasOpen = button.getAttribute("aria-expanded") === "true";
    closeCategoryPanels();
    if (!wasOpen && panel) {
      panel.hidden = false;
      button.setAttribute("aria-expanded", "true");
      const plus = button.querySelector(".category-meta b");
      if (plus) plus.textContent = "−";
      panel.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  });
}

categoryPanels.forEach((panel) => {
  panel.querySelector(".panel-close")?.addEventListener("click", closeCategoryPanels);
});

document.querySelectorAll(".choose-game").forEach((button) => {
  button.addEventListener("click", () => {
    const gameName = button.dataset.game || "Game";
    window.location.href = gameName === "Car Racing" ? "car-racing.html" : `studio.html?game=${encodeURIComponent(gameName)}`;
  });
});