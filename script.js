(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const STORAGE = { bookmarks: "stiy_bookmarks_v1", engine: "stiy_engine_v1" };
  const HOME = "__home__";
  const engines = {
    Google: "https://www.google.com/search?q=",
    DuckDuckGo: "https://duckduckgo.com/?q=",
    Bing: "https://www.bing.com/search?q="
  };

  let tabs = [];
  let activeId = null;
  let bookmarks = readJSON(STORAGE.bookmarks, []);
  let searchEngine = localStorage.getItem(STORAGE.engine) || "Google";
  let nextId = 1;

  function readJSON(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
    catch { return fallback; }
  }
  function makeTab(url = HOME, title = "New Tab") {
    const tab = { id: nextId++, url, title, stack: url === HOME ? [] : [url], index: url === HOME ? -1 : 0 };
    tabs.push(tab);
    activeId = tab.id;
    render();
    return tab;
  }
  function activeTab() { return tabs.find(t => t.id === activeId); }
  function normalizeInput(raw) {
    const value = raw.trim();
    if (!value) return null;
    if (/^(https?:\/\/|ftp:\/\/)/i.test(value)) return value;
    if (/^(localhost|127\.0\.0\.1)(:\d+)?(\/|$)/i.test(value)) return "http://" + value;
    // Treat a dotted hostname without spaces as a URL; everything else is a search.
    if (!/\s/.test(value) && /^[a-z0-9-]+(\.[a-z0-9-]+)+(:\d+)?([/?#].*)?$/i.test(value)) return "https://" + value;
    return (engines[searchEngine] || engines.Google) + encodeURIComponent(value);
  }
  function navigate(raw, {replace = false} = {}) {
    const url = normalizeInput(raw);
    if (!url) return;
    const tab = activeTab() || makeTab();
    if (tab.url === HOME && tab.stack.length === 0) {
      tab.stack = [url]; tab.index = 0;
    } else if (replace && tab.index >= 0) {
      tab.stack[tab.index] = url;
    } else {
      tab.stack = tab.stack.slice(0, tab.index + 1);
      tab.stack.push(url); tab.index = tab.stack.length - 1;
    }
    tab.url = url;
    tab.title = safeHost(url);
    tab.favicon = faviconFor(url);
    render();
    setStatus("Loading " + safeHost(url));
  }
  function safeHost(url) {
    try { return new URL(url).hostname.replace(/^www\./, "") || "Website"; }
    catch { return "Website"; }
  }
  function faviconFor(url) {
    try { return "https://www.google.com/s2/favicons?domain=" + encodeURIComponent(new URL(url).hostname) + "&sz=32"; }
    catch { return ""; }
  }
  function setStatus(text) { $("statusText").textContent = text; }
  function render() {
    const strip = $("tabStrip");
    strip.replaceChildren();
    tabs.forEach(tab => {
      const el = document.createElement("div");
      el.className = "tab" + (tab.id === activeId ? " active" : "");
      el.setAttribute("role", "tab");
      el.setAttribute("aria-selected", String(tab.id === activeId));
      const icon = document.createElement("img");
      icon.className = "tab-favicon";
      icon.alt = "";
      if (tab.favicon) icon.src = tab.favicon;
      else icon.src = "assets/stiy.svg";
      icon.onerror = () => { icon.src = "assets/stiy.svg"; };
      const title = document.createElement("span");
      title.className = "tab-title";
      title.textContent = tab.title;
      const close = document.createElement("button");
      close.className = "tab-close";
      close.type = "button";
      close.textContent = "×";
      close.setAttribute("aria-label", "Close " + tab.title);
      close.addEventListener("click", (e) => { e.stopPropagation(); closeTab(tab.id); });
      el.append(icon, title, close);
      el.addEventListener("click", () => { activeId = tab.id; render(); });
      strip.append(el);
    });

    const tab = activeTab();
    const isHome = !tab || tab.url === HOME;
    $("homeView").classList.toggle("hidden", !isHome);
    $("pageView").classList.toggle("hidden", isHome);
    $("utilityView").classList.add("hidden");
    $("addressInput").value = isHome ? "" : tab.url;
    $("backBtn").disabled = !tab || tab.index <= 0;
    $("forwardBtn").disabled = !tab || tab.index >= tab.stack.length - 1;
    $("bookmarkBtn").textContent = tab && bookmarks.some(b => b.url === tab.url) ? "★" : "☆";
    $("pageFrame").src = isHome ? "about:blank" : tab.url;
    $("embedNotice").classList.toggle("hidden", isHome);
    if (isHome) setStatus("Ready");
  }
  function closeTab(id) {
    const index = tabs.findIndex(t => t.id === id);
    if (index < 0) return;
    tabs.splice(index, 1);
    if (!tabs.length) makeTab();
    else {
      if (activeId === id) activeId = tabs[Math.max(0, index - 1)].id;
      render();
    }
  }
  function goBack() {
    const tab = activeTab();
    if (!tab || tab.index <= 0) return;
    tab.index--; tab.url = tab.stack[tab.index]; tab.title = safeHost(tab.url); render();
  }
  function goForward() {
    const tab = activeTab();
    if (!tab || tab.index >= tab.stack.length - 1) return;
    tab.index++; tab.url = tab.stack[tab.index]; tab.title = safeHost(tab.url); render();
  }
  function reload() {
    const frame = $("pageFrame");
    if (frame.src && frame.src !== "about:blank") {
      try { frame.contentWindow.location.reload(); }
      catch { frame.src = frame.src; }
      setStatus("Reloading");
    }
  }
  function showUtility(kind) {
    $("homeView").classList.add("hidden");
    $("pageView").classList.add("hidden");
    $("utilityView").classList.remove("hidden");
    const panel = $("utilityPanel");
    panel.replaceChildren();
    if (kind === "bookmarks") renderBookmarks(panel);
    if (kind === "settings") renderSettings(panel);
  }
  function renderBookmarks(panel) {
    const heading = document.createElement("h1"); heading.textContent = "Bookmarks"; panel.append(heading);
    if (!bookmarks.length) {
      const empty = document.createElement("div"); empty.className = "utility-card"; empty.textContent = "No bookmarks yet. Use the ☆ button to save a website."; panel.append(empty); return;
    }
    bookmarks.forEach((b, i) => {
      const row = document.createElement("div"); row.className = "bookmark-item";
      const link = document.createElement("a"); link.href = "#"; link.textContent = b.title + " — " + b.url;
      link.addEventListener("click", e => { e.preventDefault(); showBrowser(); navigate(b.url); });
      const remove = document.createElement("button"); remove.textContent = "Remove"; remove.addEventListener("click", () => { bookmarks.splice(i, 1); saveBookmarks(); renderBookmarks(panel); });
      row.append(link, remove); panel.append(row);
    });
  }
  function renderSettings(panel) {
    const heading = document.createElement("h1"); heading.textContent = "Settings"; panel.append(heading);
    const card = document.createElement("div"); card.className = "utility-card";
    const row = document.createElement("div"); row.className = "utility-row";
    const label = document.createElement("label"); label.textContent = "Search engine"; label.htmlFor = "engineSelect";
    const select = document.createElement("select"); select.id = "engineSelect";
    Object.keys(engines).forEach(name => { const opt = document.createElement("option"); opt.value = name; opt.textContent = name; select.append(opt); });
    select.value = searchEngine;
    select.addEventListener("change", () => { searchEngine = select.value; localStorage.setItem(STORAGE.engine, searchEngine); });
    row.append(label, select); card.append(row);
    const note = document.createElement("p"); note.textContent = "STIY is a browser-style web app hosted as a website. It can display sites that permit embedding; it cannot override a site's frame restrictions or your network's access rules."; card.append(note);
    panel.append(card);
  }
  function showBrowser() {
    const tab = activeTab();
    if (tab && tab.url === HOME) render();
    else {
      $("utilityView").classList.add("hidden");
      $("homeView").classList.add("hidden");
      $("pageView").classList.remove("hidden");
    }
  }
  function saveBookmarks() { localStorage.setItem(STORAGE.bookmarks, JSON.stringify(bookmarks)); }
  function toggleBookmark() {
    const tab = activeTab();
    if (!tab || tab.url === HOME) return;
    const existing = bookmarks.findIndex(b => b.url === tab.url);
    if (existing >= 0) bookmarks.splice(existing, 1);
    else bookmarks.push({ url: tab.url, title: tab.title });
    saveBookmarks(); render();
  }

  $("addressForm").addEventListener("submit", e => { e.preventDefault(); navigate($("addressInput").value); });
  $("homeSearchForm").addEventListener("submit", e => { e.preventDefault(); navigate($("homeSearchInput").value); });
  $("newTabBtn").addEventListener("click", () => makeTab());
  $("backBtn").addEventListener("click", goBack);
  $("forwardBtn").addEventListener("click", goForward);
  $("reloadBtn").addEventListener("click", reload);
  $("homeBtn").addEventListener("click", () => { const tab = activeTab(); if (tab) { tab.url = HOME; tab.title = "New Tab"; tab.stack = []; tab.index = -1; render(); } });
  $("bookmarkBtn").addEventListener("click", toggleBookmark);
  $("bookmarksBtn").addEventListener("click", () => showUtility("bookmarks"));
  $("settingsBtn").addEventListener("click", () => showUtility("settings"));
  $("noticeDismiss").addEventListener("click", () => $("embedNotice").classList.add("hidden"));
  $("homeShortcuts").addEventListener("click", e => {
    const button = e.target.closest("[data-url]");
    if (button) navigate(button.dataset.url);
  });
  $("addressInput").addEventListener("focus", e => e.target.select());
  $("homeSearchInput").addEventListener("keydown", e => { if (e.key === "Escape") e.target.blur(); });
  document.addEventListener("keydown", e => {
    const mod = e.ctrlKey || e.metaKey;
    if (mod && e.key.toLowerCase() === "t") { e.preventDefault(); makeTab(); }
    if (mod && e.key.toLowerCase() === "w") { e.preventDefault(); if (activeTab()) closeTab(activeId); }
    if (mod && e.key.toLowerCase() === "l") { e.preventDefault(); $("addressInput").focus(); }
    if (e.key === "Enter" && document.activeElement === $("addressInput")) { e.preventDefault(); navigate($("addressInput").value); }
  });
  $("pageFrame").addEventListener("load", () => {
    const tab = activeTab();
    if (!tab || tab.url === HOME) return;
    setStatus("Page loaded or embedding attempted");
    // Cross-origin browser security prevents reading most external page titles.
    try {
      const title = $("pageFrame").contentDocument.title;
      if (title) { tab.title = title; renderTabTitlesOnly(); }
    } catch { /* Expected for cross-origin websites. */ }
  });
  function renderTabTitlesOnly() {
    const active = activeTab();
    if (!active) return;
    const node = [...$("tabStrip").children].find((el, i) => tabs[i]?.id === active.id);
    if (node) node.querySelector(".tab-title").textContent = active.title;
  }

  makeTab();
})();