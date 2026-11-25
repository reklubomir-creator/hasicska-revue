(() => {
  const panel = el("editionAdmin");
  const pin = el("editionPin");
  const selector = el("editionSelect");
  const editor = el("editionEditor");
  const year = el("editionYear");
  const name = el("editionName");
  const status = el("editionStatus");
  const startsAt = el("editionStartsAt");
  const venue = el("editionVenue");
  const meetingPlace = el("editionMeeting");
  const registrationLink = el("editionRegistrationLink");
  const message = el("editionMessage");
  const lists = el("editionLists");
  const access = el("editionAccess");
  const accessUnit = el("editionAccessUnit");
  const accessLink = el("editionAccessLink");
  const accessQr = el("editionAccessQr");
  const schemas = [
    ["units", "Jednotky", "Přidat jednotku", [["name", "Název jednotky", 120]]],
    ["stations", "Stanoviště", "Přidat stanoviště", [["name", "Název", 120], ["kind", "Typ", "kinds"], ["location", "Místo", 240]]],
    ["commanders", "Velitelé", "Přidat velitele", [["name", "Jméno", 120], ["unitId", "Jednotka", "units"], ["phone", "Telefon", 40], ["email", "E-mail", 120]]],
    ["reviewers", "Hodnotitelé", "Přidat hodnotitele", [["name", "Jméno", 120], ["stationId", "Stanoviště", "stations"]]],
    ["observers", "Pozorovatelé", "Přidat pozorovatele", [["name", "Jméno", 120]]],
    ["draw", "Přiřazení startů", "Přidat start", [["unitId", "Jednotka", "competingUnits"], ["stationId", "Stanoviště", "stations"]]]
  ];
  const kinds = [
    ["scored", "Soutěžní stanoviště"], ["standby", "Pohotovost"], ["quiz", "Kvíz"]
  ];
  let editions = [];
  let draft;
  let dirty = false;
  let busy = false;

  function setMessage(text, error = false) {
    message.textContent = text;
    message.style.color = error ? "#a32121" : "";
  }

  function updateSelector() {
    selector.replaceChildren(new Option("Nový ročník", ""), ...editions.map(edition =>
      new Option(edition.year + " · " + edition.name, String(edition.year))));
    selector.value = draft?.revision ? String(draft.year) : "";
  }

  function populateOptions(control, values, value) {
    control.replaceChildren(...values.map(([id, label]) => new Option(label, id)));
    control.value = value ?? "";
  }

  function mergeName(merge, edition = draft) {
    return merge.unitIds.map(id => edition.units.find(unit => unit.id === id)?.name || "Bez názvu").join(" + ");
  }

  function competingUnits(edition = draft) {
    const members = new Set(edition.merges.flatMap(merge => merge.unitIds));
    return edition.units.filter(unit => !members.has(unit.id))
      .concat(edition.merges.map(merge => ({id:merge.id,name:mergeName(merge,edition)})));
  }

  function contactsAt(element) {
    const unitId = element.dataset.unitContact;
    const merge = draft.merges.find(item => item.id === unitId);
    const ids = new Set([unitId,...(merge?.unitIds || [])]);
    const seen = new Set();
    const contacts = [...(draft.registrations || []),...draft.commanders].filter(contact => {
      if (!ids.has(contact.unitId) || !contact.name) return false;
      const key = JSON.stringify([contact.unitId,contact.name,contact.phone?.replace(/\D/g,"")]);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    element.replaceChildren(...contacts.map(contact => {
      const line = document.createElement("li");
      const original = merge && draft.units.find(unit => unit.id === contact.unitId);
      line.textContent = (original ? original.name + " · " : "") + contact.name;
      if (contact.phone) {
        const phone = document.createElement("a");
        const number = contact.phone.replace(/[^+0-9]/g,"");
        if (number) phone.href = "tel:" + number;
        phone.textContent = contact.phone;
        line.append(" · ",phone);
      }
      return line;
    }));
    if (!contacts.length) {
      const empty = document.createElement("li");
      empty.textContent = "Kontakt velitele zatím chybí";
      element.append(empty);
    }
  }

  function makeContacts(unitId) {
    const contacts = document.createElement("ul");
    contacts.className = "edition-unit-contacts";
    contacts.dataset.unitContact = unitId;
    contactsAt(contacts);
    return contacts;
  }

  function renderMerges(section) {
    for (const merge of draft.merges) {
      const block = document.createElement("div");
      block.className = "edition-merge";
      const title = document.createElement("strong");
      title.dataset.mergeName = merge.id;
      title.textContent = mergeName(merge);
      block.append(title,makeContacts(merge.id));
      if (draft.registrations?.some(contact => contact.unitId === merge.id)) {
        const info = document.createElement("p");
        info.className = "muted";
        info.textContent = "Společná jednotka už má přihlášeného velitele.";
        block.append(info);
      } else if (draft.status === "preparation") {
        const split = document.createElement("button");
        split.type = "button";
        split.className = "soft";
        split.textContent = "Rozdělit společnou jednotku";
        split.onclick = () => {
          if (!confirm("Rozdělit jednotky? Společné startovní přiřazení se zruší.")) return;
          draft.merges = draft.merges.filter(item => item.id !== merge.id);
          draft.draw = draft.draw.filter(item => item.unitId !== merge.id);
          dirty = true;
          renderEditor();
          setMessage("Jednotky rozděleny. Doplň jejich starty a ulož ročník.");
        };
        block.append(split);
      }
      section.append(block);
    }
    if (draft.status !== "preparation") return;
    const available = draft.units.filter(unit => !draft.merges.some(merge => merge.unitIds.includes(unit.id)));
    if (available.length < 2) return;
    const box = document.createElement("details");
    box.className = "edition-merge";
    const title = document.createElement("summary");
    title.textContent = "Sloučit jednotky";
    box.append(title);
    const selected = new Set();
    for (const unit of available) {
      const option = document.createElement("label");
      option.className = "edition-station-setting";
      const check = document.createElement("input");
      check.type = "checkbox";
      check.onchange = () => {
        if (check.checked) selected.add(unit.id);
        else selected.delete(unit.id);
        mergeButton.disabled = selected.size < 2;
      };
      option.append(check,unit.name || "Bez názvu");
      box.append(option);
    }
    const mergeButton = document.createElement("button");
    mergeButton.type = "button";
    mergeButton.className = "primary";
    mergeButton.textContent = "Sloučit vybrané jednotky";
    mergeButton.disabled = true;
    mergeButton.onclick = () => {
      const id = crypto.randomUUID();
      const unitIds = available.filter(unit => selected.has(unit.id)).map(unit => unit.id);
      const start = draft.draw.find(row => selected.has(row.unitId));
      draft.merges.push({id,unitIds});
      draft.draw = draft.draw.filter(row => !selected.has(row.unitId));
      if (start) draft.draw.push({...start,unitId:id});
      dirty = true;
      renderEditor();
      setMessage(start ? "Společná jednotka převzala jedno startovní přiřazení. Zkontroluj starty a ulož ročník."
        : "Společná jednotka vytvořena. Přiřaď jí start a ulož ročník.");
    };
    box.append(mergeButton);
    section.append(box);
  }

  function fillReference(control, source, value) {
    populateOptions(control, [["", "Vyber…"], ...(source === "competingUnits" ? competingUnits() : draft[source]).map(item => [item.id, item.name || "Bez názvu"])], value);
  }

  function renderEditor() {
    const expanded = new Set([...lists.querySelectorAll("details[open]")].map(section => section.dataset.list));
    lists.replaceChildren();
    for (const [key, title, addLabel, fields] of schemas) {
      const section = document.createElement("details");
      section.className = "panel edition-list";
      section.dataset.list = key;
      section.open = expanded.has(key);
      const heading = document.createElement("summary");
      heading.textContent = title + " (" + draft[key].length + ")";
      section.append(heading);
      for (const [index, item] of draft[key].entries()) {
        const row = document.createElement("div");
        row.className = "edition-row";
        let stationKind;
        let delayed;
        if (key === "stations") {
          delayed = document.createElement("input");
          delayed.type = "checkbox";
          delayed.checked = item.kind === "studna";
        }
        for (const [field, label, options] of fields) {
          const wrapper = document.createElement("label");
          wrapper.className = "field";
          const control = document.createElement(typeof options === "number" ? "input" : "select");
          if (typeof options === "number") {
            control.maxLength = options;
            control.value = item[field] || "";
            if (field === "phone") control.type = "tel";
            if (field === "email") control.type = "email";
          } else if (options === "kinds") {
            stationKind = control;
            populateOptions(control, kinds, delayed.checked ? "scored" : item[field] || "scored");
          } else {
            control.dataset.editionReference = options;
            fillReference(control, options, item[field]);
          }
          control.addEventListener("input", () => {
            item[field] = field === "kind" && control.value === "scored" && delayed.checked ? "studna" : control.value;
            if (field === "kind") {
              delayed.parentElement.hidden = control.value !== "scored";
              if (delayed.parentElement.hidden) delayed.checked = false;
            }
            dirty = true;
            if (field === "name" && (key === "units" || key === "stations")) {
              for (const reference of lists.querySelectorAll('[data-edition-reference="' + key + '"]')) {
                fillReference(reference, key, reference.value);
              }
              if (key === "units") {
                for (const reference of lists.querySelectorAll('[data-edition-reference="competingUnits"]')) {
                  fillReference(reference,"competingUnits",reference.value);
                }
                for (const title of lists.querySelectorAll("[data-merge-name]")) {
                  title.textContent = mergeName(draft.merges.find(merge => merge.id === title.dataset.mergeName));
                }
              }
            }
          });
          wrapper.append(label, control);
          row.append(wrapper);
        }
        if (delayed) {
          const setting = document.createElement("label");
          setting.className = "edition-station-setting";
          setting.hidden = stationKind.value !== "scored";
          setting.append(delayed, "Umožnit potvrdit průchod a hodnotit později");
          delayed.onchange = () => {
            item.kind = delayed.checked ? "studna" : "scored";
            dirty = true;
          };
          row.append(setting);
        }
        if (key === "units") {
          const merge = draft.merges.find(group => group.unitIds.includes(item.id));
          if (merge) {
            const affiliation = document.createElement("small");
            affiliation.textContent = "Jede ve společné jednotce.";
            row.append(affiliation);
          }
          row.append(makeContacts(item.id));
        }
        const remove = document.createElement("button");
        remove.type = "button";
        remove.className = "soft";
        remove.textContent = "Odebrat";
        remove.setAttribute("aria-label", "Odebrat položku " + (index + 1) + " ze seznamu " + title);
        remove.onclick = () => {
          const linked = (key === "units" && ([...draft.commanders,...draft.draw,...(draft.registrations || [])].some(entry => entry.unitId === item.id)
            || draft.merges.some(merge => merge.unitIds.includes(item.id))))
            || (key === "stations" && [...draft.reviewers, ...draft.draw].some(entry => entry.stationId === item.id));
          if (linked) {
            setMessage("Nejprve uprav nebo odeber přiřazení této položky.", true);
            return;
          }
          draft[key].splice(index, 1);
          dirty = true;
          renderEditor();
        };
        row.append(remove);
        section.append(row);
      }
      const add = document.createElement("button");
      add.type = "button";
      add.className = "soft";
      add.textContent = addLabel;
      add.disabled = draft[key].length >= 40;
      add.onclick = () => {
        const item = { id: crypto.randomUUID() };
        if (key === "stations") item.kind = kinds[0][0];
        draft[key].push(item);
        dirty = true;
        renderEditor();
        lists.children[schemas.findIndex(schema => schema[0] === key)].querySelector(".edition-row:last-of-type input, .edition-row:last-of-type select")?.focus();
      };
      section.append(add);
      if (key === "units") renderMerges(section);
      if (key === "draw") {
        const fill = document.createElement("button");
        fill.type = "button";
        fill.className = "soft";
        fill.textContent = "Dolosovat zbývající";
        fill.onclick = fillDraw;
        section.append(fill);
      }
      lists.append(section);
    }
  }

  function fillDraw() {
    const drawnUnits = new Set(draft.draw.map(item => item.unitId));
    const drawnStations = new Set(draft.draw.map(item => item.stationId));
    if (drawnUnits.has(undefined) || drawnUnits.has("") || drawnStations.has(undefined) || drawnStations.has("")
      || drawnUnits.size !== draft.draw.length || drawnStations.size !== draft.draw.length) {
      setMessage("Nejdřív doplň a zkontroluj stávající starty.", true);
      return;
    }
    const remaining = competingUnits().filter(unit => !drawnUnits.has(unit.id));
    const available = draft.stations.filter(station => !drawnStations.has(station.id));
    if (remaining.length > available.length) {
      setMessage("Pro zbývající jednotky chybí volná stanoviště.", true);
      return;
    }
    for (let index = available.length - 1; index > 0; index--) {
      const other = Math.floor(Math.random() * (index + 1));
      [available[index], available[other]] = [available[other], available[index]];
    }
    remaining.forEach((unit, index) => {
      draft.draw.push({ id: crypto.randomUUID(), unitId: unit.id, stationId: available[index].id });
    });
    dirty ||= remaining.length > 0;
    renderEditor();
    setMessage(remaining.length ? "Zbývající starty jsou vylosované. Ulož ročník." : "Všechny jednotky už mají start.");
  }

  function openEdition(edition) {
    draft = edition ? structuredClone(edition) : Object.assign({
      year: new Date().getFullYear() + 1, name: "", status: "preparation", revision: null
    }, Object.fromEntries(schemas.map(([key]) => [key, []])));
    draft.merges ||= [];
    year.value = draft.year;
    year.readOnly = Boolean(draft.revision);
    name.value = draft.name;
    status.value = draft.status;
    startsAt.value = draft.startsAt || "";
    venue.value = draft.venue || "";
    meetingPlace.value = draft.meetingPlace || "";
    registrationLink.value = "";
    el("editionRegistrationLinkField").hidden = true;
    el("editionRegistration").hidden = !edition?.revision;
    el("editionIssueRegistration").hidden = draft.status !== "preparation";
    el("editionStart").hidden = draft.status !== "preparation";
    dirty = false;
    updateSelector();
    renderEditor();
    hideAccessLink();
    access.hidden = !edition?.units.length;
    const eligible = competingUnits();
    populateOptions(accessUnit,eligible.map(unit => [unit.id,unit.name]),eligible[0]?.id);
    el("editionIssueAccess").disabled = edition?.status === "archived";
    editor.hidden = false;
  }

  function confirmDiscard() {
    return !dirty || confirm("Zahodit neuložené změny ročníku?");
  }

  async function request(action, data) {
    const credential = pin.value.trim();
    if (!credential) {
      setMessage("Zadej organizační PIN.", true);
      pin.focus();
      return null;
    }
    busy = true;
    panel.querySelector("fieldset").disabled = true;
    try {
      const response = await quizPost({ action, credential, ...data });
      if (!response?.ok) throw new Error(response?.error || "Server požadavek odmítl.");
      return response;
    } catch (error) {
      setMessage(error.message, true);
      return null;
    } finally {
      busy = false;
      panel.querySelector("fieldset").disabled = false;
    }
  }

  function hideAccessLink() {
    el("editionAccessLinkField").hidden = true;
    accessLink.value = "";
    accessQr.replaceChildren();
  }

  accessUnit.onchange = hideAccessLink;
  el("editionIssueAccess").onclick = async () => {
    if (busy || !draft?.revision || !accessUnit.value) return;
    if (!confirm("Vydat nový odkaz? Dosavadní odkaz vybrané jednotky přestane platit.")) return;
    hideAccessLink();
    const token = Array.from(crypto.getRandomValues(new Uint8Array(32)), byte =>
      byte.toString(16).padStart(2, "0")).join("");
    const response = await request("issueUnitAccess", { year: draft.year, unitId: accessUnit.value, token });
    if (!response) return;
    const link = new URL("jednotka.html", location.href);
    link.hash = new URLSearchParams({ pristup: token }).toString();
    accessLink.value = link.href;
    el("editionAccessLinkField").hidden = false;
    setMessage("Odkaz vydán. Zkopíruj ho nebo jednotce ukaž QR kód.");
    if (typeof QRCode === "function") new QRCode(accessQr, { text:link.href, width:216, height:216 });
  };
  el("editionRevokeAccess").onclick = async () => {
    if (busy || !draft?.revision || !accessUnit.value) return;
    if (!confirm("Zrušit přístup vybrané jednotky?")) return;
    const response = await request("revokeUnitAccess", { year: draft.year, unitId: accessUnit.value });
    if (!response) return;
    hideAccessLink();
    setMessage("Přístup jednotky byl zrušen.");
  };
  el("editionCopyAccess").onclick = async () => {
    try {
      await navigator.clipboard.writeText(accessLink.value);
      setMessage("Odkaz zkopírován.");
    } catch (error) {
      accessLink.select();
      setMessage("Odkaz je označený. Zkopíruj ho ručně.");
    }
  };

  el("editionIssueRegistration").onclick = async () => {
    if (busy || !draft?.revision || draft.status !== "preparation") return;
    if (dirty) { setMessage("Nejdřív ulož termín, místo, sraz a seznam jednotek.",true); return; }
    if (!draft.startsAt || !draft.venue || !draft.meetingPlace) {
      setMessage("Doplň a ulož termín, místo konání a pokyny ke srazu.",true);
      return;
    }
    if (!confirm("Vytvořit společný odkaz? Předchozí registrační odkaz se zneplatní.")) return;
    const invitation = Array.from(crypto.getRandomValues(new Uint8Array(32)),byte => byte.toString(16).padStart(2,"0")).join("");
    if (!await request("issueEditionRegistration",{year:draft.year,invitation})) return;
    const url = new URL("jednotka.html",location.href);
    url.hash = new URLSearchParams({registrace:invitation,rocnik:String(draft.year)}).toString();
    registrationLink.value = url.href;
    el("editionRegistrationLinkField").hidden = false;
    setMessage("Odkaz je připravený k rozeslání.");
  };
  el("editionCopyRegistration").onclick = async () => {
    try {
      await navigator.clipboard.writeText(registrationLink.value);
      setMessage("Registrační odkaz zkopírován.");
    } catch {
      registrationLink.select();
      setMessage("Odkaz je označený. Zkopíruj ho ručně.");
    }
  };
  function applyRegistrations(saved) {
    if (!saved || JSON.stringify(saved.registrations) === JSON.stringify(draft.registrations)) return;
    draft.registrations = saved.registrations;
    const entry = editions.find(edition => edition.year === draft.year);
    if (entry) entry.registrations = saved.registrations;
    for (const contacts of lists.querySelectorAll("[data-unit-contact]")) contactsAt(contacts);
  }

  el("editionRefreshRegistrations").onclick = async () => {
    if (busy || !draft?.revision) return;
    const response = await request("listCompetitionEditions");
    if (!response) return;
    applyRegistrations(response.editions.find(edition => edition.year === draft.year));
    setMessage("Kontakty z předregistrace aktualizovány.");
  };

  let checkingContacts = false;
  setInterval(async () => {
    if (busy || checkingContacts || document.hidden || panel.classList.contains("hidden") || !draft?.revision) return;
    const current = draft;
    checkingContacts = true;
    try {
      const response = await quizPost({action:"listCompetitionEditions",credential:pin.value.trim()});
      if (draft === current && response?.ok) applyRegistrations(response.editions.find(edition => edition.year === current.year));
    } catch {
      // The manual refresh remains available if the connection drops.
    } finally {
      checkingContacts = false;
    }
  },10000);

  el("editionLoad").onclick = async () => {
    if (busy || !confirmDiscard()) return;
    const response = await request("listCompetitionEditions");
    if (!response) return;
    const previousYear = draft?.year;
    editions = response.editions.sort((a, b) => b.year - a.year);
    openEdition(editions.find(edition => edition.year === previousYear) || editions[0]);
    setMessage("Ročníky načteny.");
  };

  selector.onchange = () => {
    if (!confirmDiscard()) {
      updateSelector();
      return;
    }
    openEdition(editions.find(edition => String(edition.year) === selector.value));
    setMessage("");
  };
  for (const field of [year, name, status, startsAt, venue, meetingPlace]) field.addEventListener("input", () => { dirty = true; });

  editor.onsubmit = async event => {
    event.preventDefault();
    if (busy) return;
    const start = event.submitter === el("editionStart");
    if (start && !confirm("Spustit soutěž a zobrazit jednotkám jejich první stanoviště?")) return;
    const edition = { ...draft, year: Number(year.value), name: name.value, status: start ? "active" : status.value,
      startsAt: startsAt.value, venue: venue.value, meetingPlace: meetingPlace.value };
    const response = await request("saveCompetitionEdition", { edition, expectedRevision: draft.revision });
    if (!response) return;
    editions = editions.filter(item => item.year !== response.edition.year);
    editions.push(response.edition);
    editions.sort((a, b) => b.year - a.year);
    openEdition(response.edition);
    setMessage(start ? "Soutěž spuštěna. Jednotky vidí své první stanoviště." : "Ročník uložen.");
  };

  window.addEventListener("beforeunload", event => {
    if (dirty) event.preventDefault();
  });
})();
