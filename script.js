
function normalizeStatus(status) {
  return String(status || "").trim().toLowerCase();
}

function formatPriceText(price) {
  if (typeof price === "number") return `£${price}`;
  if (typeof price === "string") return price.trim();
  return "";
}

function formatPrice(price) {
  if (typeof price === "number") return `£${price}`;
  if (typeof price === "string") {
    const value = price.trim();
    if (value.toUpperCase() === "FREE") {
      return '<span class="price-free">FREE</span>';
    }
    return value;
  }
  return "";
}

const WHATSAPP_NUMBER = ""; // Add your number, e.g. 447700900000

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
          <span class="status-badge ${normalizeStatus(item.status)}">${item.status}</span>
        </div>
        <div class="item-content">
          <div class="item-topline">
            <h3 class="item-title">${item.title}</h3>
            <p class="item-price">${formatPrice(item.price)}</p>
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

let activeGalleryImages = [];
let activeGalleryIndex = 0;
let touchStartX = 0;

function openItem(id) {
  const item = items.find(entry => entry.id === id);
  if (!item) return;

  const unavailable = normalizeStatus(item.status) !== "available";
  const whatsappText = encodeURIComponent(`Hi! I'm interested in the ${item.title} listed for ${formatPriceText(item.price)}. Is it still available?`);
  const whatsappHref = WHATSAPP_NUMBER
    ? `https://wa.me/${WHATSAPP_NUMBER}?text=${whatsappText}`
    : `https://wa.me/?text=${whatsappText}`;

  activeGalleryImages = Array.isArray(item.images) && item.images.length
    ? item.images
    : [item.image];
  activeGalleryIndex = 0;

  dialogContent.innerHTML = `
    <div class="dialog-layout">
      <div class="dialog-gallery" id="dialogGallery">
        <div class="dialog-image-wrap">
          <img
            class="dialog-image"
            id="dialogImage"
            src="${activeGalleryImages[0]}"
            alt="${item.title}, photo 1 of ${activeGalleryImages.length}">
        </div>

        ${activeGalleryImages.length > 1 ? `
          <button class="gallery-arrow gallery-arrow-left" id="galleryPrev" aria-label="Previous photo">‹</button>
          <button class="gallery-arrow gallery-arrow-right" id="galleryNext" aria-label="Next photo">›</button>

          <div class="gallery-counter" id="galleryCounter">
            1 / ${activeGalleryImages.length}
          </div>

          <div class="gallery-dots" id="galleryDots" aria-label="Choose photo">
            ${activeGalleryImages.map((_, index) => `
              <button
                class="gallery-dot ${index === 0 ? "active" : ""}"
                data-gallery-index="${index}"
                aria-label="View photo ${index + 1}">
              </button>
            `).join("")}
          </div>
        ` : ""}
      </div>

      <div class="dialog-details">
        <p class="eyebrow">${item.category} · ${item.status}</p>
        <h3>${item.title}</h3>
        <p class="dialog-price">${formatPrice(item.price)}</p>
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

  const gallery = document.querySelector("#dialogGallery");
  const previousButton = document.querySelector("#galleryPrev");
  const nextButton = document.querySelector("#galleryNext");

  previousButton?.addEventListener("click", () => changeGalleryImage(-1, item.title));
  nextButton?.addEventListener("click", () => changeGalleryImage(1, item.title));

  document.querySelectorAll(".gallery-dot").forEach(dot => {
    dot.addEventListener("click", () => {
      activeGalleryIndex = Number(dot.dataset.galleryIndex);
      updateGallery(item.title);
    });
  });

  gallery?.addEventListener("touchstart", event => {
    touchStartX = event.changedTouches[0].clientX;
  }, { passive: true });

  gallery?.addEventListener("touchend", event => {
    const touchEndX = event.changedTouches[0].clientX;
    const difference = touchEndX - touchStartX;

    if (Math.abs(difference) < 45) return;
    changeGalleryImage(difference > 0 ? -1 : 1, item.title);
  }, { passive: true });

  dialog.showModal();
}

function changeGalleryImage(direction, itemTitle) {
  if (activeGalleryImages.length < 2) return;

  activeGalleryIndex =
    (activeGalleryIndex + direction + activeGalleryImages.length) %
    activeGalleryImages.length;

  updateGallery(itemTitle);
}

function updateGallery(itemTitle) {
  const image = document.querySelector("#dialogImage");
  const counter = document.querySelector("#galleryCounter");

  if (!image) return;

  image.classList.add("changing");

  window.setTimeout(() => {
    image.src = activeGalleryImages[activeGalleryIndex];
    image.alt = `${itemTitle}, photo ${activeGalleryIndex + 1} of ${activeGalleryImages.length}`;
    image.classList.remove("changing");
  }, 100);

  if (counter) {
    counter.textContent = `${activeGalleryIndex + 1} / ${activeGalleryImages.length}`;
  }

  document.querySelectorAll(".gallery-dot").forEach((dot, index) => {
    dot.classList.toggle("active", index === activeGalleryIndex);
    dot.setAttribute("aria-current", index === activeGalleryIndex ? "true" : "false");
  });
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


document.addEventListener("keydown", event => {
  if (!dialog.open || activeGalleryImages.length < 2) return;

  const itemTitle = document.querySelector(".dialog-details h3")?.textContent || "Item";

  if (event.key === "ArrowLeft") {
    changeGalleryImage(-1, itemTitle);
  }

  if (event.key === "ArrowRight") {
    changeGalleryImage(1, itemTitle);
  }
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
