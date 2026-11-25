(() => {
  const el = id => document.getElementById(id);
  const storageKey = "hasicskaRevueUnitAccess";
  const params = new URLSearchParams(location.hash.slice(1));
  const fragment = params.get("pristup");
  const registrationKey = "hasicskaRevueRegistrationAccess";
  const registration = el("unitRegistration");
  const invitation = params.get("registrace");
  const registrationYear = Number(params.get("rocnik"));
  let registrationPending;
  let focusedNotice = params.get("zprava");
  if (fragment !== null || focusedNotice) history.replaceState(null,"",location.pathname + location.search);
  let token = fragment || "";
  let replaceDeviceAccess = false;
  let lastUpdate = null;
  let request;
  let dispatchStationId;
  let acknowledging = false;
  let dispatchReceived = false;
  let pushRegistration;
  let pushPrepared = false;
  let pushSubscription;
  let pushBusy = false;
  const login = el("unitLogin");
  const pushPanel = el("unitPushPanel");
  const pushStatus = el("unitPushStatus");
  const enablePush = el("unitEnablePush");
  const disablePush = el("unitDisablePush");
  const copyLink = el("unitCopyLink");
  const isAppleMobile = /iPhone|iPad|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const standalone = matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
  const stateLabels = {
    preparation: "Ročník se připravuje",
    waiting: "Čeká se na uvolnění dalšího stanoviště",
    active: "Probíhá soutěž",
    evaluating: "Probíhá hodnocení",
    standby: "Pohotovost na zbrojnici · pauza",
    enroute: "Přesun na stanoviště",
    paused: "Pauza",
    finished: "Soutěž dokončena"
  };

  try {
    const registered = JSON.parse(localStorage.getItem(registrationKey) || "null");
    if (fragment === null) {
      token = invitation ? (registered?.year === registrationYear ? registered.token : "")
        : sessionStorage.getItem(storageKey) || localStorage.getItem(storageKey) || registered?.token || "";
    }
    if (invitation && token) history.replaceState(null,"",location.pathname + location.search);
    if (fragment !== null) {
      const remembered = localStorage.getItem(storageKey);
      replaceDeviceAccess = Boolean(remembered && remembered !== fragment);
      if (remembered !== fragment) localStorage.removeItem(storageKey);
      sessionStorage.removeItem(storageKey);
    }
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
    const status = text || (navigator.onLine ? "Online" : "Bez připojení");
    const connection = el("unitConnection");
    if (connection.textContent !== status) connection.textContent = status;
    connection.dataset.state = status === "Online" ? "online" : "offline";
  }

  function showDashboard(data) {
    el("unitEdition").textContent = data.edition;
    el("unitEdition").hidden = false;
    el("unitName").textContent = data.name;
    el("unitPreparation").hidden = !data.preparation;
    el("unitConnectionPanel").hidden = Boolean(data.preparation);
    if (data.preparation) {
      const {startsAt,venue,meetingPlace} = data.preparation;
      const date = startsAt ? new Date(startsAt) : null;
      el("unitEventWhen").textContent = date && !Number.isNaN(date.getTime())
        ? "Termín: " + date.toLocaleString("cs-CZ",{dateStyle:"long",timeStyle:"short"}) : "";
      el("unitEventWhere").textContent = venue ? "Místo: " + venue : "";
      el("unitMeeting").textContent = meetingPlace ? "Sraz: " + meetingPlace : "";
      dashboard.hidden = true;
      pushPanel.hidden = true;
      return;
    }
    if (!pushPrepared) {
      pushPrepared = true;
      preparePush();
    }
    el("unitState").textContent = stateLabels[data.state] || "Stav není dostupný";
    dispatchStationId = data.dispatch?.stationId;
    dispatchReceived = Boolean(data.dispatch?.receivedAt);
    el("unitReceived").hidden = dispatchReceived;
    el("unitReceivedStatus").hidden = !dispatchReceived;
    el("unitArrived").hidden = !dispatchReceived;
    el("unitDispatch").hidden = !dispatchStationId;
    el("unitStationPanel").hidden = Boolean(dispatchStationId);
    if (dispatchStationId) {
      const location = data.station.location;
      el("unitDispatchTitle").textContent = data.station.name;
      el("unitDispatchLocation").textContent = location;
      el("unitDispatchLocation").hidden = !location;
      el("unitDispatchMessage").textContent = data.dispatch.message;
      el("unitDispatchMessage").hidden = !data.dispatch.message;
      const map = el("unitDispatchMap");
      map.hidden = !location;
      if (location) {
        const query = new URLSearchParams({api:"1",query:location});
        map.href = "https://www.google.com/maps/search/?" + query;
      }
    }
    el("unitReceived").disabled = el("unitArrived").disabled = acknowledging || !navigator.onLine;
    el("unitStationTitle").textContent = data.state === "preparation" ? "Startovní stanoviště" : "Aktuální stanoviště";
    el("unitStation").textContent = data.station?.name || (data.state === "finished" ? "Všechna stanoviště jsou absolvována" : ["waiting","paused"].includes(data.state) ? "Vyčkej na pokyn k přesunu" : "Stanoviště se zobrazí po startu soutěže");
    el("unitLocation").textContent = data.station?.location || "";
    el("unitLocation").hidden = !data.station?.location;
    const standby = data.station?.kind === "standby";
    el("unitStationPanel").classList.toggle("standby", standby);
    el("unitStandby").hidden = !standby;
    el("unitStatusPanel").classList.toggle("pause",Boolean(data.pause));
    const end = data.pause && new Date(data.pause.endsAt).toLocaleTimeString("cs-CZ",{hour:"2-digit",minute:"2-digit"});
    el("unitPause").textContent = data.pause
      ? ["Mimořádná pauza do " + end + ". S přesunem vyčkej.",data.pause.text].filter(Boolean).join(" ")
      : "";
    const notices = data.notices || [];
    const noticeList = el("unitNotices");
    noticeList.replaceChildren(...notices.map(notice => {
      const item = document.createElement("li");
      const time = new Date(notice.at).toLocaleTimeString("cs-CZ",{hour:"2-digit",minute:"2-digit"});
      item.textContent = time + " · " + notice.text;
      if (notice.id === focusedNotice) item.setAttribute("aria-current","true");
      return item;
    }));
    el("unitNoticePanel").hidden = !notices.length;
    if (focusedNotice && notices.some(notice => notice.id === focusedNotice)) {
      noticeList.querySelector('[aria-current="true"]')?.scrollIntoView({block:"nearest"});
      focusedNotice = null;
    }
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
    try {
      sessionStorage.removeItem(storageKey);
      localStorage.removeItem(storageKey);
      localStorage.removeItem(registrationKey);
    } catch (error) {}
    pushPrepared = false;
    el("unitPreparation").hidden = true;
    el("unitConnectionPanel").hidden = false;
    login.hidden = false;
    pushPanel.hidden = true;
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

  async function acknowledgeDispatch(action) {
    if (acknowledging || !dispatchStationId || !token) return;
    acknowledging = true;
    el("unitReceived").disabled = el("unitArrived").disabled = true;
    try {
      const response = await fetch(revueApiUrl(),{
        method:"POST",headers:{"Content-Type":"text/plain;charset=UTF-8"},
        body:JSON.stringify({action,stationId:dispatchStationId,token}),
        signal:AbortSignal.timeout(12000),referrerPolicy:"no-referrer"
      });
      if (!response.ok) throw new Error("Potvrzení se nepodařilo odeslat.");
      const data = await response.json();
      if (!data.ok) throw new Error(data.error);
      await load();
    } catch (error) {
      message.textContent = error.message;
    } finally {
      acknowledging = false;
      el("unitReceived").disabled = el("unitArrived").disabled = !navigator.onLine;
    }
  }
  el("unitReceived").onclick = () => acknowledgeDispatch("acknowledgeUnitDispatch");
  el("unitArrived").onclick = () => acknowledgeDispatch("acknowledgeUnitArrival");

  async function managePush(action, details) {
    const response = await fetch(revueApiUrl(),{
      method:"POST",headers:{"Content-Type":"text/plain;charset=UTF-8"},
      body:JSON.stringify({action,token,...details}),
      signal:AbortSignal.timeout(12000),referrerPolicy:"no-referrer"
    });
    if (!response.ok) throw new Error("Soutěžní server je nedostupný.");
    const result = await response.json();
    if (!result.ok) throw new Error(result.error);
  }

  function showPushControls(enabled) {
    enablePush.hidden = enabled;
    disablePush.hidden = !enabled;
    enablePush.disabled = disablePush.disabled = pushBusy;
  }

  async function preparePush() {
    if (!token || !PUSH_VAPID_PUBLIC_KEY) return;
    pushPanel.hidden = false;
    if (isAppleMobile && !standalone) {
      pushStatus.textContent = "Na iPhonu přidej stránku na plochu. V aplikaci z plochy vlož zkopírovaný přístup a povol oznámení.";
      copyLink.hidden = false;
      return;
    }
    if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
      pushStatus.textContent = "Tento prohlížeč Web Push nepodporuje.";
      return;
    }
    const sessionToken = token;
    try {
      await navigator.serviceWorker.register("jednotka-sw.js");
      pushRegistration = await navigator.serviceWorker.ready;
      const subscription = await pushRegistration.pushManager.getSubscription();
      if (token !== sessionToken) return;
      if (replaceDeviceAccess && subscription) {
        await subscription.unsubscribe();
        replaceDeviceAccess = false;
        pushSubscription = null;
      } else pushSubscription = subscription;
      let remembered = false;
      try { remembered = localStorage.getItem(storageKey) === token; } catch (error) {}
      const enabled = Boolean(remembered && pushSubscription && Notification.permission === "granted");
      showPushControls(enabled);
      pushStatus.textContent = enabled ? "Oznámení jsou povolena." : "Povolením si toto zařízení zapamatuje přístup jednotky.";
    } catch (error) {
      pushStatus.textContent = "Oznámení se nepodařilo připravit.";
    }
  }

  enablePush.onclick = async () => {
    if (!token || pushBusy || !pushRegistration) return;
    pushBusy = true;
    showPushControls(false);
    try {
      pushSubscription ||= await pushRegistration.pushManager.subscribe({
        userVisibleOnly:true, applicationServerKey:PUSH_VAPID_PUBLIC_KEY
      });
      localStorage.setItem(storageKey,token);
      try { await managePush("subscribeUnitPush",{subscription:pushSubscription.toJSON()}); }
      catch (error) { localStorage.removeItem(storageKey); throw error; }
      pushStatus.textContent = "Oznámení jsou povolena.";
      pushBusy = false;
      showPushControls(true);
    } catch (error) {
      pushStatus.textContent = Notification.permission === "denied"
        ? "Oznámení jsou zakázaná v nastavení zařízení."
        : "Oznámení se nepodařilo povolit. " + error.message;
      pushBusy = false;
      showPushControls(false);
    }
  };

  async function disableNotifications() {
    if (!pushSubscription) return true;
    const endpoint = pushSubscription.endpoint;
    let locallyRemoved;
    try { locallyRemoved = await pushSubscription.unsubscribe(); }
    catch (error) { locallyRemoved = false; }
    try { await managePush("unsubscribeUnitPush",{endpoint}); }
    catch (error) { if (!locallyRemoved) return false; }
    pushSubscription = null;
    return true;
  }

  disablePush.onclick = async () => {
    if (pushBusy) return;
    pushBusy = true;
    showPushControls(true);
    const disabled = await disableNotifications();
    if (disabled) {
      try { localStorage.removeItem(storageKey); } catch (error) {}
    }
    pushBusy = false;
    showPushControls(!disabled);
    pushStatus.textContent = disabled ? "Oznámení jsou vypnutá." : "Oznámení se nepodařilo vypnout.";
  };

  copyLink.onclick = async () => {
    const link = new URL(location.pathname,location.origin);
    link.hash = new URLSearchParams({pristup:token}).toString();
    try {
      await navigator.clipboard.writeText(link.href);
      pushStatus.textContent = "Odkaz je zkopírovaný. Vlož ho do aplikace otevřené z plochy.";
    } catch (error) {
      pushStatus.textContent = "Odkaz se nepodařilo zkopírovat. Použij původní odkaz od organizátora.";
    }
  };

  login.onsubmit = event => {
    event.preventDefault();
    const input = el("unitAccessLink");
    try {
      const link = new URL(input.value.trim());
      const supplied = new URLSearchParams(link.hash.slice(1)).get("pristup");
      if (link.origin !== location.origin || link.pathname !== location.pathname || !/^[a-f0-9]{64}$/.test(supplied)) {
        throw new Error();
      }
      token = supplied;
      input.value = "";
      try { sessionStorage.setItem(storageKey,token); } catch (error) {}
      startSession();
    } catch (error) {
      message.textContent = "Vlož platný odkaz pro tuto aplikaci.";
    }
  };

  function startSession() {
    registration.hidden = true;
    login.hidden = true;
    refresh.hidden = false;
    signOut.hidden = false;
    load();
  }

  async function registrationRequest(action, fields = {}) {
    const response = await fetch(revueApiUrl(),{
      method:"POST",headers:{"Content-Type":"text/plain;charset=UTF-8"},
      body:JSON.stringify({action,invitation,year:registrationYear,...fields}),
      signal:AbortSignal.timeout(12000),referrerPolicy:"no-referrer"
    });
    if (!response.ok) throw new Error("Registraci se nepodařilo načíst.");
    const data = await response.json();
    if (!data.ok) throw new Error(data.error);
    return data;
  }

  async function loadRegistration() {
    try {
      const data = await registrationRequest("readEditionRegistration");
      el("unitEdition").hidden = false;
      el("unitEdition").textContent = data.edition;
      const select = el("registrationUnit");
      select.replaceChildren(new Option("Vyber svou jednotku",""),
        ...data.units.map(unit => new Option(unit.name,unit.id)));
      registration.hidden = data.units.length === 0;
      el("unitConnectionPanel").hidden = true;
      message.textContent = data.units.length ? "" : "Všechny jednotky už mají přístup. Ozvi se vedení soutěže.";
    } catch (error) {
      message.textContent = error.message;
      registration.hidden = true;
    }
  }

  registration.onsubmit = async event => {
    event.preventDefault();
    const submit = el("registrationSubmit");
    if (submit.disabled) return;
    const unitId = el("registrationUnit").value;
    if (registrationPending?.unitId !== unitId) {
      registrationPending = {unitId,token:Array.from(crypto.getRandomValues(new Uint8Array(32)),
        byte => byte.toString(16).padStart(2,"0")).join("")};
    }
    submit.disabled = true;
    try {
      await registrationRequest("registerEditionUnit",{
        ...registrationPending,name:el("registrationCommander").value,phone:el("registrationPhone").value
      });
      token = registrationPending.token;
      try {
        localStorage.setItem(registrationKey,JSON.stringify({year:registrationYear,token}));
        sessionStorage.setItem(storageKey,token);
      } catch (error) {}
      history.replaceState(null,"",location.pathname + location.search);
      registration.reset();
      registrationPending = null;
      startSession();
    } catch (error) {
      message.textContent = error.message;
    } finally {
      submit.disabled = false;
    }
  };

  showConnection();
  if (token) startSession();
  else if (invitation) loadRegistration();
  else {
    login.hidden = false;
    message.textContent = "Otevři soukromý odkaz nebo QR kód, který ti předal organizátor.";
  }
  refresh.onclick = load;
  signOut.onclick = async () => {
    if (pushBusy) return;
    pushBusy = true;
    signOut.disabled = true;
    const disabled = await disableNotifications();
    pushBusy = false;
    signOut.disabled = false;
    if (!disabled) {
      message.textContent = "Oznámení se nepodařilo odhlásit. Zkus to znovu po připojení.";
      return;
    }
    clearAccess("Jednotka je odhlášená. Přihlásíš se původním odkazem, pokud je stále platný.");
  };
  navigator.serviceWorker?.addEventListener("message",event => {
    if (event.data?.type === "showUnitNotice") {
      focusedNotice = event.data.id;
      load();
    }
  });
  window.addEventListener("online", () => { showConnection(); load(); });
  window.addEventListener("offline", () => {
    showConnection();
    if (lastUpdate) message.textContent = "Zobrazuji poslední načtené údaje.";
  });
  document.addEventListener("visibilitychange", () => { if (!document.hidden) load(); });
  setInterval(() => { if (!document.hidden) load(); }, 5000);
})();
