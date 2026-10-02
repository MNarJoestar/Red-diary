const STORAGE_KEY = "diario-rojo-entries-v1";

const screens = {
  home: document.getElementById("homeScreen"),
  editor: document.getElementById("editorScreen"),
  daily: document.getElementById("dailyScreen"),
  entries: document.getElementById("entriesScreen"),
  detail: document.getElementById("detailScreen")
};
const textField = document.getElementById("entryText");
const saveMessage = document.getElementById("saveMessage");
const backHome = document.getElementById("backHome");
const backToList = document.getElementById("backToList");
const detailTitle = document.getElementById("detailTitle");
const detailText = document.getElementById("detailText");
const deleteEntry = document.getElementById("deleteEntry");
let selectedEntryIndex = null;
let currentList = null;

function readEntries() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

function showScreen(name) {
  Object.entries(screens).forEach(([screenName, element]) => {
    element.hidden = screenName !== name;
  });
  backHome.hidden = name === "home" || name === "detail";
  backToList.hidden = name !== "detail";
  saveMessage.textContent = "";
  if (name === "daily" || name === "entries") renderEntries(name);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function formatDate(dateString) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "Fecha desconocida";
  return new Intl.DateTimeFormat("es", {
    dateStyle: "long",
    timeStyle: "short"
  }).format(date);
}

function renderEntries(type) {
  const list = document.getElementById(type === "daily" ? "dailyList" : "entriesList");
  const entries = readEntries()
    .map((entry, index) => ({ entry, index }))
    .filter(({ entry }) => entry && entry.type === type && typeof entry.text === "string")
    .sort((a, b) => new Date(b.entry.createdAt) - new Date(a.entry.createdAt));

  list.replaceChildren();
  if (entries.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "Sin registros";
    list.append(empty);
    return;
  }

  entries.forEach(({ entry, index }) => {
    const card = document.createElement("article");
    card.className = "entry-card";
    card.tabIndex = 0;
    card.setAttribute("role", "button");
    card.setAttribute("aria-label", `Abrir entrada del ${formatDate(entry.createdAt)}`);
    const title = document.createElement("h2");
    title.textContent = formatDate(entry.createdAt);
    const content = document.createElement("p");
    content.textContent = entry.text;
    card.append(title, content);
    card.addEventListener("click", () => openEntry(index, type));
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openEntry(index, type);
      }
    });
    list.append(card);
  });
}

function openEntry(index, type) {
  const entry = readEntries()[index];
  if (!entry) return;
  selectedEntryIndex = index;
  currentList = type;
  detailTitle.textContent = formatDate(entry.createdAt);
  detailText.textContent = entry.text;
  showScreen("detail");
}

document.querySelectorAll("[data-screen]").forEach((button) => {
  button.addEventListener("click", () => showScreen(button.dataset.screen));
});

document.querySelectorAll("[data-save]").forEach((button) => {
  button.addEventListener("click", () => {
    const text = textField.value.trim();
    if (!text) {
      saveMessage.textContent = "Escribe algo antes de guardar tu entrada.";
      textField.focus();
      return;
    }

    const entries = readEntries();
    entries.push({
      type: button.dataset.save,
      text,
      createdAt: new Date().toISOString()
    });

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
      textField.value = "";
      showScreen(button.dataset.save);
    } catch {
      saveMessage.textContent = "No se pudo guardar. El almacenamiento del navegador puede estar lleno o desactivado.";
    }
  });
});

deleteEntry.addEventListener("click", () => {
  if (selectedEntryIndex === null || !window.confirm("¿Seguro que quieres eliminar esta entrada?")) return;

  const entries = readEntries();
  entries.splice(selectedEntryIndex, 1);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    selectedEntryIndex = null;
    showScreen(currentList);
  } catch {
    window.alert("No se pudo eliminar la entrada. El almacenamiento del navegador puede estar desactivado.");
  }
});

backToList.addEventListener("click", () => showScreen(currentList || "entries"));
backHome.addEventListener("click", () => showScreen("home"));

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("sw.js")
      .then((registration) => {
        console.log("Service Worker registrado:", registration.scope);
      })
      .catch((error) => {
        console.error("Error registrando Service Worker:", error);
      });
  });
}
