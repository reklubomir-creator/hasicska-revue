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
  let contactEditor;
  let drawFeedback = "";
  let savedDispatch = new Map();
  const dispatchDrafts = new Map();

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

  function visibleCommanders() {
    const registered = draft.registrations || [];
    const primary = new Set(registered.map(contact => contact.unitId));
    const seen = new Set();
    return [
      ...registered.map(contact => ({contact,source:"registration"})),
      ...draft.commanders.filter(contact => !primary.has(contact.unitId) || contact.phone?.trim() || contact.email?.trim())
        .map(contact => ({contact,source:"manual"}))
    ].filter(({contact}) => {
      const name = (contact.name || "").trim();
      const key = JSON.stringify([contact.unitId,name.toLocaleLowerCase("cs-CZ"),(contact.phone || "").replace(/\D/g,"")]);
      if (!name || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  function contactsAt(element) {
    const unitId = element.dataset.unitContact;
    const merge = draft.merges.find(item => item.id === unitId);
    const directory = element.dataset.directory === "true";
    const ids = new Set([unitId,...(merge?.unitIds || [])]);
    const contacts = visibleCommanders().filter(({contact}) => directory || ids.has(contact.unitId));
    element.replaceChildren(...contacts.map(({contact,source}) => {
      const line = document.createElement("li");
      const original = (merge || directory) && [...draft.units,...competingUnits()].find(unit => unit.id === contact.unitId);
      line.textContent = (original ? original.name + " · " : "") + contact.name;
      for (const [value,href] of [
        [contact.phone,"tel:" + (contact.phone || "").replace(/[^+0-9]/g,"")],
        [contact.email,"mailto:" + encodeURIComponent(contact.email || "")]
      ]) {
        if (!value) continue;
        const link = document.createElement("a");
        link.href = href;
        link.textContent = value;
        line.append(" · ",link);
      }
      if (draft.status !== "archived") {
        const edit = document.createElement("button");
        edit.type = "button";
        edit.className = "soft";
        edit.textContent = "Upravit kontakt";
        edit.onclick = () => editContact(line,contact,source);
        line.append(" ",edit);
      }
      return line;
    }));
    if (!contacts.length) {
      const empty = document.createElement("li");
      empty.textContent = directory ? "Zatím nejsou zadané kontakty velitelů." : "Kontakt velitele zatím chybí";
      element.append(empty);
    }
  }

  function refreshContactCards() {
    for (const contacts of lists.querySelectorAll("[data-unit-contact]")) contactsAt(contacts);
  }

  function editContact(line, contact, source) {
    if (busy || contactEditor) return;
    const block = document.createElement("div");
    block.className = "edition-merge";
    const inputs = Object.fromEntries([
      ["name","Jméno","text",120],["phone","Telefon","tel",30],["email","E-mail","email",120]
    ].map(([key,title,type,max]) => {
      const label = document.createElement("label");
      label.className = "field";
      const field = document.createElement("input");
      field.type = type;
      field.maxLength = max;
      field.required = key === "name" || (key === "phone" && source === "registration");
      field.value = contact[key] || "";
      label.append(title,field);
      block.append(label);
      return [key,field];
    }));
    const save = document.createElement("button");
    save.type = "button";
    save.className = "primary";
    save.textContent = "Uložit kontakt";
    const cancel = document.createElement("button");
    cancel.type = "button";
    cancel.className = "soft";
    cancel.textContent = "Zrušit";
    const finish = () => { contactEditor = null; refreshContactCards(); };
    cancel.onclick = finish;
    save.onclick = async () => {
      if (busy || !Object.values(inputs).every(field => field.reportValidity())) return;
      const next = Object.fromEntries(Object.entries(inputs).map(([key,field]) => [key,field.value.trim()]));
      const prior = editions.find(item => item.year === draft.year)?.commanders.find(item => item.id === contact.id);
      if (source === "manual" && !prior) {
        Object.assign(contact,next);
        dirty = true;
        finish();
        renderEditor();
        setMessage("Kontakt upraven v rozepsaném ročníku. Ulož ročník.");
        return;
      }
      const response = await request("updateEditionCommander",{
        year:draft.year,unitId:contact.unitId,contactId:contact.id,source,...next,
        expected:prior || contact,expectedRevision:draft.revision
      });
      if (!response) return;
      const savedEdition = editions.find(item => item.year === draft.year);
      if (source === "manual") {
        Object.assign(contact,response.contact);
        Object.assign(prior,response.contact);
        draft.revision = response.revision;
        if (savedEdition) savedEdition.revision = response.revision;
      } else {
        draft.registrations = draft.registrations.map(item => item.unitId === contact.unitId ? response.contact : item);
        if (savedEdition) savedEdition.registrations = draft.registrations;
      }
      finish();
      if (source === "manual") renderEditor();
      setMessage("Kontakt velitele uložen.");
    };
    block.onkeydown = event => {
      if (event.key === "Enter" && event.target.tagName === "INPUT") {
        event.preventDefault();
        save.click();
      }
    };
    block.append(save,cancel);
    line.append(block);
    contactEditor = block;
    inputs.name.focus();
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
    contactEditor = null;
    const expanded = new Set([...lists.querySelectorAll("details[open]")].map(section => section.dataset.list));
    lists.replaceChildren();
    for (const [key, title, addLabel, fields] of schemas) {
      const section = document.createElement("details");
      section.className = "panel edition-list";
      section.dataset.list = key;
      section.open = expanded.has(key);
      const heading = document.createElement("summary");
      const count = key === "commanders" ? visibleCommanders().length : draft[key].length;
      heading.textContent = title + " (" + count + ")";
      if (key === "commanders") heading.id = "editionCommanderHeading";
      section.append(heading);
      let fieldsSection = section;
      if (key === "commanders") {
        const directory = document.createElement("ul");
        directory.className = "edition-unit-contacts";
        directory.dataset.unitContact = "";
        directory.dataset.directory = "true";
        contactsAt(directory);
        const manual = document.createElement("details");
        manual.dataset.list = "manualCommanders";
        manual.className = "edition-merge";
        manual.open = expanded.has("manualCommanders");
        const label = document.createElement("summary");
        label.textContent = "Ruční přiřazení velitelů";
        manual.append(label);
        fieldsSection = manual;
        section.append(directory,manual);
      }
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
        if (key === "stations") {
          const dispatch = document.createElement("div");
          dispatch.dataset.dispatchStation = item.id;
          dispatch.className = "edition-unit-contacts";
          renderStationMessage(dispatch);
          row.append(dispatch);
        }
        fieldsSection.append(row);
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
      fieldsSection.append(add);
      if (key === "units") renderMerges(section);
      if (key === "draw") {
        const fill = document.createElement("button");
        fill.type = "button";
        fill.className = "soft";
        fill.textContent = "Dolosovat zbývající";
        fill.onclick = fillDraw;
        const feedback = document.createElement("p");
        feedback.id = "editionDrawFeedback";
        feedback.setAttribute("role","status");
        feedback.textContent = drawFeedback;
        section.append(fill,feedback);
      }
      lists.append(section);
    }
  }

  async function loadStationMessages(edition) {
    try {
      const response = await quizPost({action:"readEditionProgress",credential:pin.value.trim(),year:edition.year});
      if (draft !== edition || !response?.ok) return;
      savedDispatch = new Map(response.stations.map(station => [station.id,station.dispatchMessage || ""]));
      for (const field of lists.querySelectorAll("[data-dispatch-station]")) renderStationMessage(field);
    } catch {
      if (draft === edition) setMessage("Výjezdové zprávy se nepodařilo načíst.",true);
    }
  }

  function renderStationMessage(block) {
    block.hidden = draft.status === "archived";
    if (block.hidden) return;
    block.replaceChildren();
    const stationId = block.dataset.dispatchStation;
    if (!savedDispatch.has(stationId)) {
      block.textContent = draft.revision && draft.stations.some(station => station.id === stationId)
        ? "Výjezdová zpráva bude dostupná po načtení uloženého stanoviště." : "Pro výjezdovou zprávu nejdřív ulož stanoviště.";
      return;
    }
    const label = document.createElement("label");
    label.className = "field";
    const input = document.createElement("textarea");
    input.maxLength = 800;
    input.value = dispatchDrafts.get(stationId) ?? savedDispatch.get(stationId);
    const count = document.createElement("output");
    function updateCount() {
      count.textContent = input.value.length + " / 800 znaků";
    }
    input.oninput = () => {
      dispatchDrafts.set(stationId,input.value);
      updateCount();
    };
    updateCount();
    label.append("Výjezdová zpráva pro jednotky",input);
    const save = document.createElement("button");
    save.type = "button";
    save.className = "soft";
    save.textContent = "Uložit výjezdovou zprávu";
    save.onclick = async () => {
      if (busy) return;
      const message = input.value.trim();
      const expectedMessage = savedDispatch.get(stationId);
      if (!await request("saveEditionDispatchMessage",{year:draft.year,stationId,message,expectedMessage})) return;
      savedDispatch.set(stationId,message);
      input.value = message;
      dispatchDrafts.delete(stationId);
      updateCount();
      setMessage("Výjezdová zpráva uložena.");
    };
    const station = draft.stations.find(item => item.id === stationId);
    block.append(dispatchMessageBuilder(station,input),label,count,save);
  }

  function dispatchMessageBuilder(station, messageInput) {
    const builder = document.createElement("details");
    builder.className = "dispatch-builder";
    const title = document.createElement("summary");
    title.textContent = "Sestavit soutěžní SMS";
    const source = document.createElement("a");
    source.href = "https://hzscr.gov.cz/soubor/ml-o3-pdf.aspx";
    source.target = "_blank";
    source.rel = "noopener";
    source.textContent = "Bojový řád JPO · metodický list 3/O";
    const regulation = document.createElement("a");
    regulation.href = "https://e-sbirka.gov.cz/sb/2001/247";
    regulation.target = "_blank";
    regulation.rel = "noopener";
    regulation.textContent = "Vyhláška č. 247/2001 Sb.";
    const references = document.createElement("p");
    references.append(source," · ",regulation);
    builder.append(title,references);

    const fields = [
      ["vehicles","Technika","1V, 1DA","",true],
      ["alarm","Datum a čas","16.11.2026 09:46:28","",true],
      ["event","Kód události","P-Odpad","",true],
      ["location","Místo události","Blansko 2492",station.location || "",true],
      ["landmark","Upřesnění místa","nad COV","",false],
      ["description","Popis události","P kompostarna - kompost, vedle hromada, plamen, 30 x 30 m","",true]
    ].map(([key,caption,placeholder,initial,enabled]) => {
      const row = document.createElement("div");
      const label = document.createElement("label");
      const check = document.createElement("input");
      check.type = "checkbox";
      check.checked = enabled;
      label.append(check," ",caption);
      const value = document.createElement("input");
      value.type = "text";
      value.setAttribute("aria-label","Text položky " + caption);
      value.placeholder = placeholder;
      value.value = initial;
      row.append(label,value);
      builder.append(row);
      return {key,caption,check,value};
    });

    const previewLabel = document.createElement("label");
    previewLabel.className = "field";
    const preview = document.createElement("textarea");
    preview.readOnly = true;
    preview.rows = 2;
    previewLabel.append("Náhled SMS",preview);
    const insert = document.createElement("button");
    insert.type = "button";
    insert.className = "soft";
    insert.textContent = "Použít náhled jako text SMS";
    const feedback = document.createElement("p");
    feedback.setAttribute("role","status");

    function updatePreview() {
      const selected = fields.filter(field => field.check.checked);
      const values = Object.fromEntries(selected.map(field => [field.key,field.value.value]));
      preview.value = formatDispatchSms(values);
      insert.disabled = !selected.length || selected.some(field => !field.value.value.trim()) ||
        preview.value.length > messageInput.maxLength;
      feedback.textContent = preview.value.length > messageInput.maxLength
        ? "Zkrať SMS na nejvýše 800 znaků." : "";
    }

    for (const {check,value} of fields) {
      check.onchange = () => {
        value.disabled = value.hidden = !check.checked;
        updatePreview();
      };
      value.oninput = updatePreview;
      value.disabled = value.hidden = !check.checked;
    }
    updatePreview();
    insert.onclick = () => {
      messageInput.value = preview.value;
      messageInput.oninput();
      feedback.textContent = "Náhled je v textu SMS. Zkontroluj ho a zprávu ulož.";
      messageInput.focus();
    };
    builder.append(previewLabel,insert,feedback);
    return builder;
  }

  function fillDraw() {
    const result = buildRemainingDraw(competingUnits(),draft.stations,draft.draw);
    drawFeedback = result.message;
    if (!result.ok) {
      el("editionDrawFeedback").textContent = drawFeedback;
      return;
    }
    dirty ||= JSON.stringify(draft.draw) !== JSON.stringify(result.draw);
    draft.draw = result.draw;
    renderEditor();
  }

  function openEdition(edition) {
    draft = edition ? structuredClone(edition) : Object.assign({
      year: new Date().getFullYear() + 1, name: "", status: "preparation", revision: null
    }, Object.fromEntries(schemas.map(([key]) => [key, []])));
    draft.merges ||= [];
    drawFeedback = "";
    savedDispatch = new Map();
    dispatchDrafts.clear();
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
    if (draft.revision && draft.status !== "archived") loadStationMessages(draft);
  }

  function confirmDiscard() {
    return (!dirty && !dispatchDrafts.size) || confirm("Zahodit neuložené změny ročníku nebo výjezdové SMS?");
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
    refreshContactCards();
    const heading = el("editionCommanderHeading");
    if (heading) heading.textContent = "Velitelé (" + visibleCommanders().length + ")";
  }

  el("editionRefreshRegistrations").onclick = async () => {
    if (busy || contactEditor || !draft?.revision) return;
    const response = await request("listCompetitionEditions");
    if (!response) return;
    applyRegistrations(response.editions.find(edition => edition.year === draft.year));
    setMessage("Kontakty z předregistrace aktualizovány.");
  };

  let checkingContacts = false;
  setInterval(async () => {
    if (busy || contactEditor || checkingContacts || document.hidden || panel.classList.contains("hidden") || !draft?.revision) return;
    const current = draft;
    checkingContacts = true;
    try {
      const response = await quizPost({action:"listCompetitionEditions",credential:pin.value.trim()});
      if (!busy && !contactEditor && draft === current && response?.ok) applyRegistrations(response.editions.find(edition => edition.year === current.year));
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

function buildRemainingDraw(units, stations, original) {
  const unitIds = new Set(units.map(unit => unit.id));
  const stationIds = new Set(stations.map(station => station.id));
  const pinnedUnits = new Set();
  const pinnedStations = new Set();
  const draw = original.filter(row => row.unitId || row.stationId).map(row => ({...row}));
  for (const row of draw) {
    if ((row.unitId && (!unitIds.has(row.unitId) || pinnedUnits.has(row.unitId))) ||
        (row.stationId && (!stationIds.has(row.stationId) || pinnedStations.has(row.stationId)))) {
      return {ok:false,message:"Některá jednotka nebo stanoviště jsou přiřazené dvakrát nebo už nejsou dostupné."};
    }
    if (row.unitId) pinnedUnits.add(row.unitId);
    if (row.stationId) pinnedStations.add(row.stationId);
  }
  if (units.length > stations.length) {
    return {ok:false,message:"Je " + units.length + " soutěžních jednotek a jen " + stations.length + " startovních stanovišť."};
  }
  const shuffle = items => {
    for (let i = items.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [items[i],items[j]] = [items[j],items[i]];
    }
    return items;
  };
  const freeUnits = shuffle([...unitIds].filter(id => !pinnedUnits.has(id)));
  const freeStations = shuffle([...stationIds].filter(id => !pinnedStations.has(id)));
  for (const row of draw) {
    if (!row.unitId) row.unitId = freeUnits.shift();
    if (!row.stationId) row.stationId = freeStations.shift();
  }
  if (draw.some(row => !row.unitId || !row.stationId)) {
    return {ok:false,message:"Některá vybraná stanoviště jsou navíc. Odeber jejich prázdné řádky."};
  }
  for (const unitId of freeUnits) draw.push({id:crypto.randomUUID(),unitId,stationId:freeStations.shift()});
  return {ok:true,draw,message:JSON.stringify(original) === JSON.stringify(draw)
    ? "Všechny jednotky už mají start." : "Starty jsou dolosované. Zkontroluj je a ulož ročník."};
}


function formatDispatchSms({vehicles = "",alarm = "",event = "",location = "",landmark = "",description = ""}) {
  const clean = value => value.trim().replace(/\s+/g," ");
  const timing = [alarm,event].map(clean).filter(Boolean).join(",");
  const header = [vehicles,timing,location,landmark].map(clean).filter(Boolean).join(", ");
  const detail = clean(description);
  const body = [header,detail].filter(Boolean).join("; ");
  return body ? "VYJEZD PRO: " + body : "";
}
