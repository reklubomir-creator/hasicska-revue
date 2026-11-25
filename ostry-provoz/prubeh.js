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
      if (overview.observer && station?.location) {
        const address = document.createElement("p");
        address.className = "muted";
        address.textContent = station.location;
        row.append(address);
      }
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

  let finalData;
  const finalUnitSelect = el("finalUnit");
  const finalRows = el("finalAssessmentRows");

  function renderFinalAssessment() {
    finalRows.replaceChildren();
    const unit = finalData?.units.find(item => item.id === finalUnitSelect.value);
    if (!unit) return;
    const title = document.createElement("h3");
    title.textContent = unit.name;
    finalRows.append(title);
    if (unit.sharedName) {
      const shared = document.createElement("p");
      shared.className = "muted";
      shared.textContent = "Společný průjezd: " + unit.sharedName;
      finalRows.append(shared);
    }
    for (const assessment of unit.assessments) {
      const row = document.createElement("article");
      const title = document.createElement("strong");
      title.textContent = assessment.name;
      const detail = document.createElement("p");
      row.append(title,detail);
      if (assessment.kind === "quiz") {
        detail.textContent = assessment.percentage === null ? "Výsledek kvízu chybí." : "Výsledek: " + assessment.percentage + " %";
        if (finalData.editable) {
          const label = document.createElement("label");
          const input = document.createElement("input");
          input.type = "number";
          input.min = "0";
          input.max = "100";
          input.required = true;
          input.value = assessment.percentage ?? "";
          label.append("Samostatný výsledek kvízu v %",input);
          const save = document.createElement("button");
          save.type = "button";
          save.className = "secondary";
          save.textContent = "Uložit výsledek kvízu";
          save.onclick = async () => {
            if (busy || !input.reportValidity()) return;
            busy = true;
            save.disabled = true;
            try {
              await api("saveEditionMemberQuiz",{unitId:unit.id,stationId:assessment.stationId,
                percentage:Number(input.value),expectedPercentage:assessment.percentage});
              el("message").textContent = "Výsledek kvízu uložen pro " + unit.name + ".";
              assessment.percentage = Number(input.value);
              renderFinalAssessment();
            } catch (error) { el("message").textContent = error.message; }
            finally { busy = false; save.disabled = false; }
          };
          row.append(label,save);
        }
      } else {
        detail.textContent = assessment.result || (assessment.completed ? "Průchod potvrzen, hodnocení chybí." : "Bez hodnocení.");
        if (assessment.notes) {
          const notes = document.createElement("p");
          notes.textContent = assessment.notes;
          row.append(notes);
        }
      }
      finalRows.append(row);
    }
  }

  el("loadFinalAssessments").onclick = async () => {
    if (busy) return;
    busy = true;
    try {
      finalData = await api("readEditionFinalAssessments");
      options(finalUnitSelect,"Vyber původní jednotku",finalData.units);
      if (!finalUnitSelect.value && finalData.units.length) finalUnitSelect.value = finalData.units[0].id;
      el("finalUnitField").hidden = false;
      renderFinalAssessment();
    } catch (error) { el("message").textContent = error.message; }
    finally { busy = false; }
  };
  finalUnitSelect.onchange = renderFinalAssessment;

  function showOverview(data) {
    const signature = JSON.stringify(data);
    if (overviewSignature === signature) return;
    const first = !overview;
    overviewSignature = signature;
    overview = data;
    if (first) el("gatePanel").open = !data.organizer;
    el("edition").textContent = data.edition;
    el("finalAssessments").hidden = !data.organizer || data.status === "preparation";
    options(el("stationFilter"),"Všechna dostupná stanoviště",data.stations);
    options(el("unitFilter"),"Všechny dostupné jednotky",data.units);
    el("overview").hidden = Boolean(selected);
    render();
    renderOrganization(data);
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
    const result = resultOptions.find(option => option.value === draft?.result) || resultOptions[0];
    result.checked = true;
    submission = draft?.submission || null;
    el("draftStatus").textContent = draft ? "Koncept obnoven." : "";
  }

  function storeDraft() {
    try {
      localStorage.setItem(draftKey, JSON.stringify({ notes:el("notes").value, result:selectedResult(), submission }));
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
      const transcript = liveDictationText(event.results,/Android/i.test(navigator.userAgent));
      if (!transcript) return;
      const next = [original,transcript].filter(Boolean).join(" ").slice(0,notes.maxLength);
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
    finalData = null;
    finalRows.replaceChildren();
    el("finalUnitField").hidden = true;
    el("finalAssessments").open = false;
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
  const resultOptions = [...document.querySelectorAll('input[name="assessmentResult"]')];
  function selectedResult() {
    return resultOptions.find(option => option.checked).value;
  }
  for (const field of [...resultOptions,notes]) {
    field.oninput = () => { submission = null; storeDraft(); };
  }
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
    if (await update("saveEditionAssessment",{ result:selectedResult(), notes:el("notes").value, submissionId:submission })) {
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

function liveDictationText(results, removeAndroidOverlap) {
  const words = [];
  const normalized = [];
  const normalize = word => word.toLocaleLowerCase("cs-CZ").replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu,"");
  for (const result of Array.from(results)) {
    const fragment = (result[0]?.transcript || "").trim();
    if (!fragment) continue;
    const incoming = fragment.split(/\s+/);
    if (!removeAndroidOverlap) {
      words.push(...incoming);
      continue;
    }
    const keys = incoming.map(normalize);
    let overlap = Math.min(normalized.length,keys.length);
    while (overlap > 0 && !keys.slice(0,overlap).every((key,index) =>
      key && key === normalized[normalized.length - overlap + index])) overlap--;
    if (overlap === keys.length && !result.isFinal) continue;
    words.push(...incoming.slice(overlap));
    normalized.push(...keys.slice(overlap));
  }
  return words.join(" ");
}
})();
