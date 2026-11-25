(() => {
  const el = id => document.getElementById(id);
  const observer = new URLSearchParams(location.search).get("observer") === "1";
  const readAction = observer ? "readEditionObserver" : "readEditionProgress";
  if (observer) {
    el("progressTitle").textContent = "Náhled pro pozorovatele";
    el("credentialLabel").textContent = "Kód pozorovatele";
    document.title = "Pozorovatel · Hasičská revue";
  }
  const states = { preparation:"Příprava", waiting:"Čeká na uvolnění dalšího stanoviště", active:"Na stanovišti", enroute:"Na cestě", standby:"Pohotovost · pauza na zbrojnici", paused:"Mimořádná pauza", evaluating:"PRÁVĚ HODNOTÍ", finished:"Dokončeno", closed:"Uzavřeno" };
  let login, overview, overviewSignature, selected, draftKey, submission, pendingNotice, busy = false, reading = false;
  el("version").textContent = "Verze " + APP_VERSION;
  el("year").value = new Date().getFullYear() + 1;

  async function api(action, payload = {}, session = login) {
    const response = await fetch(revueApiUrl(), {
      method:"POST", headers:{"Content-Type":"text/plain;charset=UTF-8"},
      body:JSON.stringify({action, ...session, ...payload}),
      signal:AbortSignal.timeout(12000)
    });
    if (!response.ok) throw new Error("Server je nedostupný.");
    const data = await response.json();
    if (!data.ok) throw new Error(data.error);
    return data;
  }

  function options(control, label, items) {
    const value = control.value;
    control.replaceChildren(new Option(label,""), ...items.map(item => new Option(item.name,item.id)));
    if (items.some(item => item.id === value)) control.value = value;
  }

  function render() {
    const stationFilter = el("stationFilter").value;
    const unitFilter = el("unitFilter").value;
    const gates = el("gates");
    gates.replaceChildren();
    el("gatePanel").hidden = overview.status !== "active" || !overview.gates.length;
    if (!el("gatePanel").hidden) {
      for (const gate of overview.gates) {
        if (stationFilter && stationFilter !== gate.stationId) continue;
        const station = overview.stations.find(item => item.id === gate.stationId);
        const row = document.createElement("article");
        const title = document.createElement("strong");
        title.textContent = station.name;
        const detail = document.createElement("p");
        detail.textContent = gate.ready ? "Připraveno přijmout jednotku."
          : gate.unitName ? (gate.canOpen ? "Dokončeno · " : "Obsazeno · ") + gate.unitName : "Stanoviště čeká na otevření.";
        row.append(title, detail);
        if (gate.canOpen) {
          const button = document.createElement("button");
          button.textContent = gate.unitId ? "Můžeme poslat novou jednotku" : "Otevřít volné stanoviště";
          button.onclick = async () => {
            if (busy) return;
            busy = true;
            button.disabled = true;
            try {
              await api("openEditionStation",{stationId:gate.stationId,unitId:gate.unitId});
            } catch (error) {
              el("message").textContent = error.message;
            } finally {
              button.disabled = false;
              busy = false;
              refresh();
            }
          };
          row.append(button);
        }
        gates.append(row);
      }
    }
    const list = el("units");
    list.replaceChildren();
    for (const unit of overview.units) {
      const station = overview.stations.find(item => item.id === unit.stationId);
      if (unitFilter && unit.id !== unitFilter) continue;
      if (stationFilter && station?.id !== stationFilter && !unit.delayed.includes(stationFilter)) continue;
      const row = document.createElement("article");
      const name = document.createElement("strong");
      name.textContent = unit.name;
      const detail = document.createElement("p");
      detail.textContent = [states[unit.state],station?.name].filter(Boolean).join(" · ");
      detail.classList.toggle("evaluating",unit.state === "evaluating");
      row.append(name,detail);
      if (overview.organizer && station) {
        const receipts = document.createElement("p");
        const format = time => new Date(time).toLocaleTimeString("cs-CZ",{hour:"2-digit",minute:"2-digit"});
        receipts.textContent = [
          unit.receivedAt ? "Pokyn přijat v " + format(unit.receivedAt) : "Přijetí pokynu nepotvrzeno",
          unit.arrivedAt ? "Příjezd potvrzen v " + format(unit.arrivedAt) : null
        ].filter(Boolean).join(" · ");
        row.append(receipts);
      }
      if (overview.organizer || (overview.observer && unit.remaining !== null)) {
        const progress = document.createElement("p");
        const completed = unit.completed.length ? unit.completed.join(", ") : "zatím žádné";
        progress.textContent = "Absolvováno " + completed + ". Zbývá " + unit.remaining + ".";
        row.append(progress);
      }
      const available = !overview.observer && overview.status === "active" ? [station, ...unit.delayed.map(id => overview.stations.find(item => item.id === id))] : [];
      for (const choice of available.filter(Boolean)) {
        if (stationFilter && choice.id !== stationFilter) continue;
        if (["standby","quiz"].includes(choice.kind) && !overview.organizer) continue;
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = choice.id !== unit.stationId ? "Dodatečně vyhodnotit · " + choice.name
          : choice.kind === "standby" ? "Ukončit pohotovost" : choice.kind === "quiz" ? "Potvrdit uzavřený kvíz" : "Otevřít hodnocení";
        button.onclick = () => open(unit, choice);
        row.append(button);
      }
      list.append(row);
    }
    if (!list.children.length) list.textContent = "Žádné jednotky pro vybraný filtr.";
  }

  async function organizationAction(action, details) {
    if (busy) return;
    const signature = JSON.stringify([action, login.year, details]);
    if (pendingNotice?.signature !== signature) pendingNotice = {signature,eventId:crypto.randomUUID()};
    busy = true;
    el("organization").inert = true;
    try {
      await api(action,{eventId:pendingNotice.eventId,...details});
      pendingNotice = null;
      if (action !== "endEditionPause") el("noticeText").value = "";
      el("message").textContent = "Server změnu potvrdil.";
    } catch (error) {
      el("message").textContent = error.message;
    } finally {
      busy = false;
      el("organization").inert = false;
      refresh();
    }
  }

  function renderOrganization(data) {
    const visible = data.organizer && data.status === "active";
    el("organization").hidden = !visible;
    if (!visible) return;
    const select = el("noticeRecipient");
    const current = select.value;
    select.replaceChildren(new Option("Všechny jednotky","*"), ...data.units.map(unit => new Option(unit.name,unit.id)));
    if ([...select.options].some(option => option.value === current)) select.value = current;
    const list = el("activePauses");
    list.replaceChildren();
    for (const pause of data.pauses) {
      const row = document.createElement("article");
      const unit = data.units.find(item => item.id === pause.unitId);
      const detail = document.createElement("p");
      const end = new Date(pause.endsAt).toLocaleTimeString("cs-CZ",{hour:"2-digit",minute:"2-digit"});
      detail.textContent = (unit?.name || "Všechny jednotky") + " · Pauza do " + end;
      const endButton = document.createElement("button");
      endButton.type = "button";
      endButton.className = "secondary";
      endButton.textContent = "Ukončit pauzu";
      endButton.onclick = () => organizationAction("endEditionPause",{unitId:pause.unitId,eventId:pause.id});
      row.append(detail,endButton);
      list.append(row);
    }
  }

  el("beginPause").onclick = () => {
    if (!el("pauseMinutes").reportValidity()) return;
    organizationAction("startEditionPause",{
      unitId:el("noticeRecipient").value,minutes:Number(el("pauseMinutes").value),text:el("noticeText").value.trim()
    });
  };
  el("sendNotice").onclick = () => {
    const text = el("noticeText").value.trim();
    if (!text) {
      el("message").textContent = "Napiš text zprávy.";
      el("noticeText").focus();
      return;
    }
    organizationAction("sendEditionNotice",{unitId:el("noticeRecipient").value,text});
  };

  const instructionDrafts = new Map();
  const instructionSelect = el("dispatchStation");
  const instruction = el("dispatchInstruction");

  function showInstruction(stationId) {
    const station = overview.stations.find(item => item.id === stationId);
    const draft = instructionDrafts.get(stationId);
    el("dispatchLocation").textContent = station?.location || "Místo doplň ve Správě ročníků.";
    instruction.value = draft?.message ?? station?.dispatchMessage ?? "";
    instruction.disabled = el("saveDispatchInstruction").disabled = !station;
  }

  function renderDispatchSettings(data) {
    el("dispatchSettings").hidden = !data.organizer || data.status === "archived";
    if (el("dispatchSettings").hidden) return;
    options(instructionSelect,"Vyber stanoviště",data.stations);
    if (!instructionSelect.value && data.stations.length) instructionSelect.value = data.stations[0].id;
    if (document.activeElement !== instruction) showInstruction(instructionSelect.value);
  }

  instructionSelect.onchange = () => showInstruction(instructionSelect.value);
  instruction.oninput = () => {
    const stationId = instructionSelect.value;
    const station = overview.stations.find(item => item.id === stationId);
    const original = instructionDrafts.get(stationId)?.original ?? station.dispatchMessage;
    instructionDrafts.set(stationId,{original,message:instruction.value});
  };
  el("saveDispatchInstruction").onclick = async () => {
    if (busy) return;
    const stationId = instructionSelect.value;
    const draft = instructionDrafts.get(stationId);
    if (!draft) return;
    busy = true;
    el("dispatchSettings").inert = true;
    try {
      await api("saveEditionDispatchMessage",{stationId,message:draft.message,expectedMessage:draft.original});
      instructionDrafts.delete(stationId);
      el("message").textContent = "Výjezdová zpráva uložena.";
    } catch (error) {
      el("message").textContent = error.message;
    } finally {
      busy = false;
      el("dispatchSettings").inert = false;
      refresh();
    }
  };

  function showOverview(data) {
    const signature = JSON.stringify(data);
    if (overviewSignature === signature) return;
    const first = !overview;
    overviewSignature = signature;
    overview = data;
    if (first) el("gatePanel").open = !data.organizer;
    el("edition").textContent = data.edition;
    options(el("stationFilter"),"Všechna dostupná stanoviště",data.stations);
    options(el("unitFilter"),"Všechny dostupné jednotky",data.units);
    el("overview").hidden = Boolean(selected);
    render();
    renderOrganization(data);
    renderDispatchSettings(data);
  }

  async function refresh() {
    if (!login || reading || busy || document.hidden) return;
    reading = true;
    const session = login;
    try {
      const data = await api(readAction, {}, session);
      if (login === session) {
        showOverview(data);
      }
    } catch (error) {
      if (login === session && !selected) el("message").textContent = error.message;
    } finally { reading = false; }
  }

  function open(unit, station) {
    selected = { unitId:unit.id, stationId:station.id, arrived:Boolean(unit.arrivedAt) };
    const delayed = unit.delayed.includes(station.id);
    const passes = ["standby","quiz"].includes(station.kind);
    el("overview").hidden = true;
    el("assessment").hidden = false;
    el("assessmentTitle").textContent = unit.name + " · " + station.name;
    options(el("reviewer"),"Vyber hodnotitele",overview.reviewers.filter(item => item.stationId === station.id));
    if (el("reviewer").options.length === 2) el("reviewer").selectedIndex = 1;
    el("reviewer").parentElement.hidden = passes;
    el("reviewer").required = !passes;
    el("reviewer").disabled = false;
    el("start").hidden = delayed || passes;
    el("assessmentFields").hidden = !delayed;
    el("passage").hidden = delayed || (station.kind !== "studna" && !passes);
    el("passage").textContent = station.kind === "standby" ? "Ukončit pohotovost"
      : station.kind === "quiz" ? "Potvrdit uzavřený kvíz" : "Potvrdit průchod stanovištěm";
    el("message").textContent = "";
    el("dictationStatus").textContent = "";
    loadDraft();
    if (selected.arrived && !delayed && !passes && el("reviewer").value) beginAssessment();
  }

  function loadDraft() {
    draftKey = "hasicskaRevueEditionDraft:" + JSON.stringify([login.year, selected.unitId, selected.stationId, el("reviewer").value]);
    submission = null;
    let draft;
    try { draft = JSON.parse(localStorage.getItem(draftKey)); } catch (error) {}
    el("notes").value = draft?.notes || "";
    el("result").value = draft?.result || "V pořádku";
    submission = draft?.submission || null;
    el("draftStatus").textContent = draft ? "Koncept obnoven." : "";
  }

  function storeDraft() {
    try {
      localStorage.setItem(draftKey, JSON.stringify({ notes:el("notes").value, result:el("result").value, submission }));
      el("draftStatus").textContent = "Koncept uložen v zařízení.";
    } catch (error) {
      el("draftStatus").textContent = "Koncept se nepodařilo uložit do zařízení.";
    }
  }

  async function update(action, extra = {}) {
    if (busy) return false;
    busy = true;
    el("assessment").inert = true;
    el("message").textContent = "Ukládám…";
    try {
      await api(action,{...selected,reviewerId:el("reviewer").value,...extra});
      el("message").textContent = "Server změnu potvrdil.";
      return true;
    } catch (error) {
      el("message").textContent = error.message;
      return false;
    } finally {
      el("assessment").inert = false;
      busy = false;
    }
  }

  function closeAssessment() {
    stopDictation();
    selected = null;
    el("assessment").hidden = true;
    el("overview").hidden = false;
    refresh();
  }

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const microphone = el("dictateNotes");
  const voiceStatus = el("dictationStatus");
  const notes = el("notes");
  let recognition = null;

  function stopDictation() {
    if (!recognition) return;
    const speech = recognition;
    recognition = null;
    speech.abort();
    notes.readOnly = false;
    microphone.textContent = "🎙 Diktovat poznámku";
  }

  microphone.onclick = () => {
    if (recognition) {
      recognition.stop();
      return;
    }
    if (!SpeechRecognition) {
      voiceStatus.textContent = "Tento prohlížeč nepodporuje webové diktování. Použij mikrofon na klávesnici telefonu.";
      notes.focus();
      return;
    }
    const speech = new SpeechRecognition();
    recognition = speech;
    const original = notes.value.trimEnd();
    const key = draftKey;
    let hadError = false;
    speech.lang = "cs-CZ";
    speech.continuous = true;
    speech.interimResults = true;
    notes.readOnly = true;
    microphone.textContent = "Zastavit diktování";
    voiceStatus.textContent = "Poslouchám…";
    speech.onresult = event => {
      if (recognition !== speech || draftKey !== key) return;
      const phrases = [];
      for (const result of Array.from(event.results)) {
        if (result.isFinal) {
          const phrase = result[0]?.transcript.trim();
          if (phrase && phrases.at(-1) !== phrase) phrases.push(phrase);
        }
      }
      const next = [original,...phrases].filter(Boolean).join(" ").slice(0,notes.maxLength);
      if (next !== notes.value) {
        notes.value = next;
        submission = null;
        storeDraft();
      }
    };
    speech.onerror = () => {
      if (recognition !== speech) return;
      hadError = true;
      voiceStatus.textContent = "Diktování se nepodařilo. Zkontroluj oprávnění mikrofonu nebo použij diktování klávesnice.";
    };
    speech.onend = () => {
      if (recognition !== speech) return;
      recognition = null;
      notes.readOnly = false;
      microphone.textContent = "🎙 Diktovat poznámku";
      if (!hadError) voiceStatus.textContent = "Diktování ukončeno. Zkontroluj přepis před uložením.";
    };
    try { speech.start(); }
    catch (error) {
      stopDictation();
      voiceStatus.textContent = "Diktování se nepodařilo spustit.";
    }
  };

  el("login").onsubmit = async event => {
    event.preventDefault();
    if (busy || selected) return;
    const session = { year:Number(el("year").value), credential:el("credential").value.trim() };
    el("overview").hidden = true;
    login = null;
    overview = null;
    overviewSignature = null;
    el("organization").open = false;
    busy = true;
    try {
      showOverview(await api(readAction,{},session));
      login = session;
      el("login").hidden = true;
      el("credential").value = "";
      el("edition").focus();
      el("message").textContent = "";
    } catch (error) {
      el("message").textContent = error.message;
    } finally { busy = false; }
  };
  el("switchEdition").onclick = () => {
    if (busy) return;
    login = null;
    overview = null;
    overviewSignature = null;
    pendingNotice = null;
    instructionDrafts.clear();
    el("dispatchSettings").open = false;
    el("noticeText").value = "";
    el("overview").hidden = true;
    el("message").textContent = "";
    el("login").hidden = false;
    el("year").focus();
  };
  el("stationFilter").onchange = render;
  el("unitFilter").onchange = render;
  el("reviewer").onchange = () => {
    stopDictation();
    loadDraft();
    if (selected.arrived && !el("start").hidden) beginAssessment();
  };
  for (const id of ["result","notes"]) el(id).oninput = () => { submission = null; storeDraft(); };
  async function beginAssessment() {
    if (!el("reviewer").reportValidity()) return;
    if (await update("startEditionAssessment")) {
      el("reviewer").disabled = true;
      el("start").hidden = true;
      el("assessmentFields").hidden = false;
      el("notes").focus();
    }
  }
  el("start").onclick = beginAssessment;
  el("passage").onclick = async () => {
    if (el("reviewer").required && !el("reviewer").reportValidity()) return;
    if (await update("completeEditionPassage")) closeAssessment();
  };
  el("assessment").onsubmit = async event => {
    event.preventDefault();
    if (busy || el("assessmentFields").hidden) return;
    if (recognition) {
      recognition.stop();
      voiceStatus.textContent = "Po dokončení přepisu zkontroluj poznámku a ulož hodnocení.";
      return;
    }
    submission ||= crypto.randomUUID();
    storeDraft();
    if (await update("saveEditionAssessment",{ result:el("result").value, notes:el("notes").value, submissionId:submission })) {
      try {
        const savedDraft = JSON.parse(localStorage.getItem(draftKey));
        if (savedDraft?.submission === submission) localStorage.removeItem(draftKey);
      } catch (error) {}
      el("gatePanel").open = true;
      closeAssessment();
    }
  };
  el("back").onclick = closeAssessment;
  document.addEventListener("visibilitychange", refresh);
  window.addEventListener("online", refresh);
  setInterval(refresh, 5000);
})();
