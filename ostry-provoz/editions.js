(() => {
  const panel = el("editionAdmin");
  const pin = el("editionPin");
  const selector = el("editionSelect");
  const editor = el("editionEditor");
  const year = el("editionYear");
  const name = el("editionName");
  const status = el("editionStatus");
  const message = el("editionMessage");
  const lists = el("editionLists");
  const access = el("editionAccess");
  const accessUnit = el("editionAccessUnit");
  const accessLink = el("editionAccessLink");
  const accessQr = el("editionAccessQr");
  const schemas = [
    ["units", "Jednotky", "Přidat jednotku", [["name", "Název", 120], ["details", "Údaje", 300]]],
    ["stations", "Stanoviště", "Přidat stanoviště", [["name", "Název", 120], ["kind", "Typ", "kinds"], ["location", "Místo", 240]]],
    ["commanders", "Velitelé", "Přidat velitele", [["name", "Jméno", 120], ["unitId", "Jednotka", "units"], ["phone", "Telefon", 40], ["email", "E-mail", 120]]],
    ["reviewers", "Hodnotitelé", "Přidat hodnotitele", [["name", "Jméno", 120], ["stationId", "Stanoviště", "stations"]]],
    ["observers", "Pozorovatelé", "Přidat pozorovatele", [["name", "Jméno", 120]]],
    ["draw", "Přiřazení startů", "Přidat start", [["unitId", "Jednotka", "units"], ["stationId", "Stanoviště", "stations"]]]
  ];
  const kinds = [
    ["scored", "Soutěžní"], ["standby", "Pohotovost"], ["studna", "Studna"], ["quiz", "Kvíz"]
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

  function fillReference(control, source, value) {
    populateOptions(control, [["", "Vyber…"], ...draft[source].map(item => [item.id, item.name || "Bez názvu"])], value);
  }

  function renderEditor() {
    lists.replaceChildren();
    for (const [key, title, addLabel, fields] of schemas) {
      const section = document.createElement("section");
      section.className = "panel edition-list";
      const heading = document.createElement("h3");
      heading.textContent = title;
      section.append(heading);
      for (const [index, item] of draft[key].entries()) {
        const row = document.createElement("div");
        row.className = "edition-row";
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
            populateOptions(control, kinds, item[field] || kinds[0][0]);
          } else {
            control.dataset.editionReference = options;
            fillReference(control, options, item[field]);
          }
          control.addEventListener("input", () => {
            item[field] = control.value;
            dirty = true;
            if (field === "name" && (key === "units" || key === "stations")) {
              for (const reference of lists.querySelectorAll('[data-edition-reference="' + key + '"]')) {
                fillReference(reference, key, reference.value);
              }
            }
          });
          wrapper.append(label, control);
          row.append(wrapper);
        }
        const remove = document.createElement("button");
        remove.type = "button";
        remove.className = "soft";
        remove.textContent = "Odebrat";
        remove.setAttribute("aria-label", "Odebrat položku " + (index + 1) + " ze seznamu " + title);
        remove.onclick = () => {
          const linked = (key === "units" && [...draft.commanders, ...draft.draw].some(entry => entry.unitId === item.id))
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
    const remaining = draft.units.filter(unit => !drawnUnits.has(unit.id));
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
    year.value = draft.year;
    year.readOnly = Boolean(draft.revision);
    name.value = draft.name;
    status.value = draft.status;
    dirty = false;
    updateSelector();
    renderEditor();
    hideAccessLink();
    access.hidden = !edition?.units.length;
    populateOptions(accessUnit, (edition?.units || []).map(unit => [unit.id, unit.name]), edition?.units[0]?.id);
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
  for (const field of [year, name, status]) field.addEventListener("input", () => { dirty = true; });

  editor.onsubmit = async event => {
    event.preventDefault();
    if (busy) return;
    const edition = { ...draft, year: Number(year.value), name: name.value, status: status.value };
    const response = await request("saveCompetitionEdition", { edition, expectedRevision: draft.revision });
    if (!response) return;
    editions = editions.filter(item => item.year !== response.edition.year);
    editions.push(response.edition);
    editions.sort((a, b) => b.year - a.year);
    openEdition(response.edition);
    setMessage("Ročník uložen.");
  };

  window.addEventListener("beforeunload", event => {
    if (dirty) event.preventDefault();
  });
})();
