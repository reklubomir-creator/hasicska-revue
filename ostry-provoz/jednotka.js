(() => {
  const el = id => document.getElementById(id);
  const storageKey = "hasicskaRevueUnitAccess";
  const fragment = new URLSearchParams(location.hash.slice(1)).get("pristup");
  if (fragment !== null) history.replaceState(null, "", location.pathname + location.search);
  let token = fragment || "";
  let lastUpdate = null;
  let request;
  const stateLabels = {
    preparation: "Ročník se připravuje",
    waiting: "Čeká na start",
    active: "Probíhá soutěž",
    standby: "Pohotovost",
    paused: "Pauza",
    finished: "Soutěž dokončena"
  };

  try {
    if (fragment === null) token = sessionStorage.getItem(storageKey) || "";
    if (fragment !== null) sessionStorage.removeItem(storageKey);
    if (/^[a-f0-9]{64}$/.test(token)) sessionStorage.setItem(storageKey, token);
  } catch (error) {
    // The link remains usable when session storage is unavailable.
  }
  if (!/^[a-f0-9]{64}$/.test(token)) token = "";

  const dashboard = el("unitDashboard");
  const message = el("unitMessage");
  const refresh = el("unitRefresh");
  const signOut = el("unitSignOut");
  el("unitVersion").textContent = "Verze " + APP_VERSION;

  function showConnection(text) {
    el("unitConnection").textContent = text || (navigator.onLine ? "Online" : "Bez připojení");
  }

  function showDashboard(data) {
    el("unitEdition").textContent = data.edition;
    el("unitEdition").hidden = false;
    el("unitName").textContent = data.name;
    el("unitState").textContent = stateLabels[data.state] || "Stav není dostupný";
    el("unitStationTitle").textContent = data.state === "preparation" ? "Startovní stanoviště" : "Aktuální stanoviště";
    el("unitStation").textContent = data.station?.name || "Start zatím nebyl přidělen";
    el("unitLocation").textContent = data.station?.location || "";
    el("unitLocation").hidden = !data.station?.location;
    const standby = data.station?.kind === "standby";
    el("unitStationPanel").classList.toggle("standby", standby);
    el("unitStandby").hidden = !standby;
    el("unitPause").textContent = data.pause || (data.state === "preparation" ? "Informace o pauze zatím nejsou dostupné." : "Pauza není naplánována.");
    el("unitCompletedCount").textContent = data.completedCount;
    const list = el("unitCompleted");
    list.replaceChildren(...data.completed.map(name => {
      const item = document.createElement("li");
      item.textContent = name;
      return item;
    }));
    list.hidden = !data.completed.length;
    dashboard.hidden = false;
    lastUpdate = new Date();
    el("unitLastUpdate").textContent = "Aktualizováno v " + lastUpdate.toLocaleTimeString("cs-CZ");
    el("unitLastUpdate").hidden = false;
  }

  function clearAccess(reason) {
    token = "";
    request?.abort();
    try { sessionStorage.removeItem(storageKey); } catch (error) {}
    dashboard.hidden = true;
    el("unitEdition").hidden = true;
    el("unitName").textContent = "Soutěžní jednotka";
    el("unitLastUpdate").hidden = true;
    lastUpdate = null;
    refresh.hidden = true;
    signOut.hidden = true;
    message.textContent = reason;
  }

  async function load() {
    if (!token || request) return;
    if (!navigator.onLine) {
      showConnection();
      message.textContent = lastUpdate ? "Zobrazuji poslední načtené údaje." : "Po připojení se údaje načtou automaticky.";
      return;
    }
    refresh.disabled = true;
    request = new AbortController();
    const timeout = setTimeout(() => request?.abort(), 12000);
    try {
      const response = await fetch(revueApiUrl(), {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=UTF-8" },
        body: JSON.stringify({ action: "readUnitDashboard", token }),
        cache: "no-store",
        referrerPolicy: "no-referrer",
        signal: request.signal
      });
      if (!response.ok) throw new Error("Server vrátil chybu.");
      const data = await response.json();
      if (!token) return;
      if (data.code === "INVALID_UNIT_ACCESS") {
        clearAccess("Přístup jednotky není platný. Požádej organizátora o odkaz.");
        return;
      }
      if (!data.ok) throw new Error("Údaje jednotky nejsou dostupné.");
      showDashboard(data.dashboard);
      showConnection();
      message.textContent = "";
    } catch (error) {
      if (token) {
        showConnection(navigator.onLine ? "Soutěžní server je nedostupný" : "Bez připojení");
        message.textContent = lastUpdate ? "Zobrazuji poslední načtené údaje." : "Údaje se nepodařilo načíst.";
      }
    } finally {
      clearTimeout(timeout);
      request = null;
      refresh.disabled = false;
    }
  }

  showConnection();
  if (token) {
    refresh.hidden = false;
    signOut.hidden = false;
    load();
  } else {
    message.textContent = "Otevři soukromý odkaz nebo QR kód, který ti předal organizátor.";
  }
  refresh.onclick = load;
  signOut.onclick = () => clearAccess("Jednotka je odhlášená. Přihlásíš se původním odkazem, pokud je stále platný.");
  window.addEventListener("online", () => { showConnection(); load(); });
  window.addEventListener("offline", () => {
    showConnection();
    if (lastUpdate) message.textContent = "Zobrazuji poslední načtené údaje.";
  });
  document.addEventListener("visibilitychange", () => { if (!document.hidden) load(); });
  setInterval(() => { if (!document.hidden) load(); }, 30000);
})();
