const WHATSAPP_NUMBER = "447557651323"; // Add your number, e.g. 447700900000

let items = [];
let selectedCategory = "All";
let searchTerm = "";

const grid = document.querySelector("#itemsGrid");
const filters = document.querySelector("#categoryFilters");
const searchInput = document.querySelector("#searchInput");
const resultCount = document.querySelector("#resultCount");
const emptyState = document.querySelector("#emptyState");
const dialog = document.querySelector("#itemDialog");
const dialogContent = document.querySelector("#dialogContent");
const dialogClose = document.querySelector("#dialogClose");
const themeToggle = document.querySelector("#themeToggle");

fetch("items.json")
  .then(response => {
    if (!response.ok) throw new Error("Could not load items.json");
    return response.json();
  })
  .then(data => {
    items = data;
    renderFilters();
    renderItems();
  })
  .catch(error => {
    console.error(error);
    grid.innerHTML = "<p>There was a problem loading the catalogue.</p>";
  });

function renderFilters() {
  const categories = ["All", ...new Set(items.map(item => item.category))];

  filters.innerHTML = categories
    .map(category => `
      <button
        class="filter-button ${category === selectedCategory ? "active" : ""}"
        data-category="${category}">
        ${category}
      </button>
    `)
    .join("");

  filters.querySelectorAll("button").forEach(button => {
    button.addEventListener("click", () => {
      selectedCategory = button.dataset.category;
      renderFilters();
      renderItems();
    });
  });
}

function getFilteredItems() {
  return items.filter(item => {
    const categoryMatch = selectedCategory === "All" || item.category === selectedCategory;
    const haystack = `${item.title} ${item.category} ${item.summary} ${item.description}`.toLowerCase();
    const searchMatch = haystack.includes(searchTerm);
    return categoryMatch && searchMatch;
  });
}

function renderItems() {
  const filteredItems = getFilteredItems();

  resultCount.textContent = `${filteredItems.length} item${filteredItems.length === 1 ? "" : "s"}`;
  emptyState.hidden = filteredItems.length !== 0;

  grid.innerHTML = filteredItems
    .map(item => `
      <article class="item-card" tabindex="0" data-id="${item.id}" aria-label="View ${item.title}">
        <div class="item-image-wrap">
          <img class="item-image" src="${item.image}" alt="${item.title}" loading="lazy">
          <span class="status-badge ${item.status}">${item.status}</span>
        </div>
        <div class="item-content">
          <div class="item-topline">
            <h3 class="item-title">${item.title}</h3>
            <p class="item-price">£${item.price}</p>
          </div>
          <p class="item-meta">${item.summary}</p>
          <span class="item-category">${item.category}</span>
        </div>
      </article>
    `)
    .join("");

  grid.querySelectorAll(".item-card").forEach(card => {
    card.addEventListener("click", () => openItem(card.dataset.id));
    card.addEventListener("keydown", event => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openItem(card.dataset.id);
      }
    });
  });
}

function openItem(id) {
  const item = items.find(entry => entry.id === id);
  if (!item) return;

  const unavailable = item.status !== "available";
  const whatsappText = encodeURIComponent(`Hi! I'm interested in the ${item.title} listed for £${item.price}. Is it still available?`);
  const whatsappHref = WHATSAPP_NUMBER
    ? `https://wa.me/${WHATSAPP_NUMBER}?text=${whatsappText}`
    : `https://wa.me/?text=${whatsappText}`;

  dialogContent.innerHTML = `
    <div class="dialog-layout">
      <div class="dialog-image-wrap">
        <img class="dialog-image" src="${item.image}" alt="${item.title}">
      </div>
      <div class="dialog-details">
        <p class="eyebrow">${item.category} · ${item.status}</p>
        <h3>${item.title}</h3>
        <p class="dialog-price">£${item.price}</p>
        <p class="dialog-description">${item.description}</p>
        <ul class="dialog-facts">
          <li><span>Condition</span><strong>${item.condition}</strong></li>
          <li><span>Collection</span><strong>${item.collection}</strong></li>
          <li><span>Status</span><strong>${item.status}</strong></li>
        </ul>
        <a
          class="whatsapp-button ${unavailable ? "disabled" : ""}"
          href="${whatsappHref}"
          target="_blank"
          rel="noopener">
          ${unavailable ? "Currently unavailable" : "Message on WhatsApp"}
        </a>
      </div>
    </div>
  `;

  dialog.showModal();
}

searchInput.addEventListener("input", event => {
  searchTerm = event.target.value.trim().toLowerCase();
  renderItems();
});

dialogClose.addEventListener("click", () => dialog.close());

dialog.addEventListener("click", event => {
  const bounds = dialog.getBoundingClientRect();
  const outside =
    event.clientX < bounds.left ||
    event.clientX > bounds.right ||
    event.clientY < bounds.top ||
    event.clientY > bounds.bottom;

  if (outside) dialog.close();
});

const storedTheme = localStorage.getItem("yard-sale-theme");
if (storedTheme) {
  document.documentElement.dataset.theme = storedTheme;
}

themeToggle.addEventListener("click", () => {
  const current = document.documentElement.dataset.theme;
  const next = current === "dark" ? "light" : "dark";

  if (next === "light") {
    delete document.documentElement.dataset.theme;
  } else {
    document.documentElement.dataset.theme = next;
  }

  localStorage.setItem("yard-sale-theme", next);
});
