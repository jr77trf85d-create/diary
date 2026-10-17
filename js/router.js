const routes = {};
let currentRouteName = "plans";

const titleEl = document.getElementById("page-title");
const mainEl = document.getElementById("main-content");
const tabBar = document.getElementById("tab-bar");

export function registerRoute(name, renderFn) {
  routes[name] = renderFn;
}

export function setTitle(title, onBack) {
  titleEl.innerHTML = "";
  if (onBack) {
    const backBtn = document.createElement("button");
    backBtn.className = "btn-back";
    backBtn.textContent = "‹ Zurück";
    backBtn.addEventListener("click", onBack);
    titleEl.appendChild(backBtn);
    const h1 = document.createElement("h1");
    h1.textContent = title;
    titleEl.appendChild(h1);
    titleEl.className = "header-row";
    titleEl.style.flexDirection = "column";
    titleEl.style.alignItems = "flex-start";
    titleEl.style.gap = "2px";
  } else {
    titleEl.className = "";
    const h1 = document.createElement("h1");
    h1.textContent = title;
    titleEl.appendChild(h1);
  }
}

export function navigate(routeName) {
  currentRouteName = routeName;
  mainEl.innerHTML = "";
  routes[routeName]?.(mainEl, setTitle);

  for (const btn of tabBar.querySelectorAll("button")) {
    btn.classList.toggle("active", btn.dataset.route === routeName);
  }
  location.hash = routeName;
}

export function refresh() {
  navigate(currentRouteName);
}

tabBar.addEventListener("click", (event) => {
  const btn = event.target.closest("button[data-route]");
  if (!btn) return;
  navigate(btn.dataset.route);
});
