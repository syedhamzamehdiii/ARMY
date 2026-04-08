/**
 * Operator Command Panel — client-side navigation & modals.
 * Personnel record modal matches the provided “Personnel Record” design.
 */

const titles = {
  dashboard: "Command Dashboard",
  database: "Database",
  incidents: "Reports",
  operations: "Operations",
  cdr: "Prism Data",
  ai: "AI Command Assistant",
  threats: "Threat Assessment",
  commanders: "Threat response",
};

function showPage(id) {
  document.querySelectorAll(".page").forEach((p) => p.classList.remove("active"));
  const page = document.getElementById("p-" + id);
  if (page) page.classList.add("active");
  document.querySelectorAll(".nav-item").forEach((n) => n.classList.remove("active"));
  const nav = document.querySelector(`.nav-item[data-nav="${id}"]`);
  if (nav) nav.classList.add("active");
  const pt = document.getElementById("page-title");
  if (pt) pt.textContent = titles[id] || id;
  if (id === "commanders") threatResponseRenderTable();
  if (id === "threats") renderAllThreatReportTables();
}

function setTab(el) {
  el.parentElement.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
  el.classList.add("active");
}

function closeModal() {
  const m = document.getElementById("modal");
  if (m) {
    m.classList.remove("open");
    const box = m.querySelector(".modal");
    box?.classList.remove("modal-personnel");
    box?.classList.remove("modal-report-detail");
    document.getElementById("modal-title")?.classList.remove("modal-title--personnel");
  }
}

function openModal(type) {
  const overlay = document.getElementById("modal");
  const titleEl = document.getElementById("modal-title");
  const bodyEl = document.getElementById("modal-body");
  const modalBox = overlay?.querySelector(".modal");
  if (!overlay || !titleEl || !bodyEl || !modalBox) return;

  modalBox.classList.remove("modal-personnel");
  modalBox.classList.remove("modal-report-detail");

  if (type === "personnelRecord" || type === "addRecord") {
    modalBox.classList.add("modal-personnel");
    titleEl.classList.add("modal-title--personnel");
    titleEl.textContent =
      type === "addRecord" ? "💾 PERSONNEL RECORD • New" : "💾 PERSONNEL RECORD • #001";
    bodyEl.innerHTML = getPersonnelRecordFormHtml();
    overlay.classList.add("open");
    return;
  }

  if (type === "viewRecord") {
    titleEl.classList.add("modal-title--personnel");
    titleEl.textContent = "💾 PERSONNEL RECORD • #001";
    bodyEl.innerHTML = getViewRecordReadonlyHtml();
    overlay.classList.add("open");
    return;
  }

  if (type === "uploadCDR") {
    titleEl.classList.remove("modal-title--personnel");
    const pt = getPrismActiveType();
    titleEl.textContent = `Add ${pt.toUpperCase()}`;
    bodyEl.innerHTML = getPrismUploadFormHtml(pt);
    overlay.classList.add("open");
    return;
  }

  const modTitles = {
    addIncident: "Add Incident Report",
    addOp: "New Operation",
    addThreat: "Add Threat Report",
    addInfoReport: "Add Info Report",
    addPors: "Add PORS Report",
    addCmd: "Add Commander Record",
    addOperator: "Add Operator",
  };

  const htmlMap = {
    addIncident: modalsSimple.addIncident,
    addOp: modalsSimple.addOp,
    addThreat: modalsSimple.addThreat,
    addInfoReport: modalsSimple.addInfoReport,
    addPors: modalsSimple.addPors,
    addCmd: modalsSimple.addCmd,
    addOperator: modalsSimple.addOperator,
  };

  titleEl.classList.remove("modal-title--personnel");
  titleEl.textContent = modTitles[type] || "Form";
  bodyEl.innerHTML = htmlMap[type] || "<p>Coming soon.</p>";
  overlay.classList.add("open");
}

/** Reports page: which modal opens from the primary "Add …" button */
const REPORT_ADD_CONFIG = {
  incident: { label: "➕ Add Incident Report", modal: "addIncident" },
  threat: { label: "➕ Add Threat Report", modal: "addThreat" },
  info: { label: "➕ Add Info Report", modal: "addInfoReport" },
  pors: { label: "➕ Add PORS Report", modal: "addPors" },
};

function setReportCategory(type) {
  const cfg = REPORT_ADD_CONFIG[type];
  if (!cfg) return;

  document.querySelectorAll("#p-incidents .report-type-btn").forEach((btn) => {
    const on = btn.getAttribute("data-report-type") === type;
    btn.classList.toggle("active", on);
    btn.setAttribute("aria-selected", on ? "true" : "false");
  });

  document.querySelectorAll("#p-incidents tbody[data-report-panel]").forEach((panel) => {
    const match = panel.getAttribute("data-report-panel") === type;
    if (match) panel.removeAttribute("hidden");
    else panel.setAttribute("hidden", "");
  });

  const addBtn = document.getElementById("reports-add-btn");
  if (addBtn) {
    addBtn.textContent = cfg.label;
    addBtn.dataset.openModal = cfg.modal;
  }
}

function openActiveReportModal() {
  const addBtn = document.getElementById("reports-add-btn");
  const key = addBtn?.dataset.openModal || "addIncident";
  openModal(key);
}

/** Prism Data: stat cards switch CDR / IPDR / OPS panels */
function setPrismCategory(type) {
  if (!["cdr", "ipdr", "ops"].includes(type)) return;
  document.querySelectorAll("#p-cdr .prism-stat-btn").forEach((btn) => {
    const on = btn.getAttribute("data-prism-type") === type;
    btn.classList.toggle("prism-stat-btn--active", on);
    btn.setAttribute("aria-pressed", on ? "true" : "false");
  });
  document.querySelectorAll("#p-cdr [data-prism-panel]").forEach((panel) => {
    const match = panel.getAttribute("data-prism-panel") === type;
    if (match) panel.removeAttribute("hidden");
    else panel.setAttribute("hidden", "");
  });
  const addBtn = document.getElementById("prism-add-btn");
  if (addBtn) {
    const map = { cdr: "📤 Add CDR", ipdr: "📤 Add IPDR", ops: "📤 Add OPS" };
    addBtn.textContent = map[type] || "📤 Add CDR";
  }
}

function getPrismActiveType() {
  const active = document.querySelector("#p-cdr .prism-stat-btn.prism-stat-btn--active");
  return active?.getAttribute("data-prism-type") || "cdr";
}

function openPrismUploadModal() {
  const type = getPrismActiveType();
  const overlay = document.getElementById("modal");
  const titleEl = document.getElementById("modal-title");
  const bodyEl = document.getElementById("modal-body");
  const modalBox = overlay?.querySelector(".modal");
  if (!overlay || !titleEl || !bodyEl || !modalBox) return;
  modalBox.classList.remove("modal-personnel", "modal-report-detail");
  titleEl.classList.remove("modal-title--personnel");
  titleEl.textContent = `Add ${type.toUpperCase()}`;
  bodyEl.innerHTML = getPrismUploadFormHtml(type);
  overlay.classList.add("open");
}

/** Prism add-record: fields depend on CDR / IPDR / OPS */
function getPrismUploadFormHtml(type) {
  const t = ["cdr", "ipdr", "ops"].includes(type) ? type : "cdr";
  const opt = (v, lab) =>
    `<option value="${v}"${t === v ? " selected" : ""}>${lab}</option>`;
  const typeRow = `<div class="form-group"><label>Record type</label><select name="prism-record-type" onchange="switchPrismUploadFormType(this.value)">${opt("cdr", "CDR")}${opt("ipdr", "IPDR")}${opt("ops", "OPS")}</select></div>`;

  let grid = "";
  if (t === "cdr") {
    grid = `
    <div class="form-group"><label>Target ID</label><input name="u_cdr_target" placeholder="e.g. TGT-Alpha" autocomplete="off" /></div>
    <div class="form-group"><label>Cell #</label><input name="u_cdr_cell" placeholder="0300-XXXXXXX" autocomplete="off" /></div>
    <div class="form-group"><label>Total Calls</label><input name="u_cdr_calls" placeholder="e.g. 347" inputmode="numeric" autocomplete="off" /></div>
    <div class="form-group"><label>Unique Contacts</label><input name="u_cdr_contacts" placeholder="e.g. 12" inputmode="numeric" autocomplete="off" /></div>
    <div class="form-group"><label>Area</label><input name="u_cdr_area" placeholder="Zone / district" autocomplete="off" /></div>
    <div class="form-group"><label>Last Active</label><input name="u_cdr_last" placeholder="e.g. 30 Mar" autocomplete="off" /></div>`;
  } else if (t === "ipdr") {
    grid = `
    <div class="form-group"><label>Session ID</label><input name="u_ipdr_session" placeholder="e.g. IPDR-902" autocomplete="off" /></div>
    <div class="form-group"><label>IP Address</label><input name="u_ipdr_ip" placeholder="192.168.x.x" autocomplete="off" /></div>
    <div class="form-group"><label>Device / IMEI</label><input name="u_ipdr_device" placeholder="IMEI or device label" autocomplete="off" /></div>
    <div class="form-group"><label>Packets</label><input name="u_ipdr_packets" placeholder="e.g. 12.4K" autocomplete="off" /></div>
    <div class="form-group"><label>Area</label><input name="u_ipdr_area" placeholder="Zone / district" autocomplete="off" /></div>
    <div class="form-group"><label>Last Seen</label><input name="u_ipdr_seen" placeholder="e.g. 30 Mar" autocomplete="off" /></div>`;
  } else {
    grid = `
    <div class="form-group"><label>Ref</label><input name="u_ops_ref" placeholder="e.g. PR-OPS-04" autocomplete="off" /></div>
    <div class="form-group"><label>Name</label><input name="u_ops_name" placeholder="Operation name" autocomplete="off" /></div>
    <div class="form-group"><label>Location</label><input name="u_ops_loc" placeholder="Area / grid" autocomplete="off" /></div>
    <div class="form-group"><label>Mode</label><input name="u_ops_mode" placeholder="Overt / Covert / …" autocomplete="off" /></div>
    <div class="form-group"><label>Case Officer</label><input name="u_ops_officer" placeholder="Name / rank" autocomplete="off" /></div>
    <div class="form-group"><label>Date</label><input name="u_ops_date" placeholder="e.g. 30 Mar" autocomplete="off" /></div>`;
  }

  return `<form id="prism-upload-form" onsubmit="event.preventDefault(); submitPrismUpload();">
  <div class="form-grid">
    ${typeRow}
    ${grid}
    <div class="form-group form-full"><label>Upload File</label><div class="upload-zone"><div style="font-size:2rem;">🔷</div><div>CSV, XLS, PDF</div></div></div>
    <div class="form-group form-full"><label>Notes</label><textarea name="prism_upload_notes" placeholder="Additional context…" rows="3"></textarea></div>
  </div>
  <div class="form-actions"><button class="btn btn-outline" type="button" onclick="closeModal()">Cancel</button><button class="btn btn-primary" type="submit">💾 Save record</button></div>
</form>`;
}

function switchPrismUploadFormType(type) {
  const titleEl = document.getElementById("modal-title");
  if (titleEl) titleEl.textContent = `Add ${String(type).toUpperCase()}`;
  const bodyEl = document.getElementById("modal-body");
  if (bodyEl) bodyEl.innerHTML = getPrismUploadFormHtml(type);
}

/** Prism data detail/edit/delete (same pattern as Reports). */
const PRISM_DETAILS = {
  "CDR-001": {
    type: "cdr",
    idLabel: "Target ID",
    idValue: "TGT-Alpha",
    field2Label: "Cell #",
    field2Value: "0300-XXXXXXX",
    field3Label: "Total Calls",
    field3Value: "347",
    field4Label: "Unique Contacts",
    field4Value: "12",
    area: "Zone-7",
    dateLabel: "Last Active",
    dateValue: "30 Mar",
    notes: "Peak activity 21:00–23:00; two recurring high-priority contacts.",
  },
  "CDR-002": {
    type: "cdr",
    idLabel: "Target ID",
    idValue: "TGT-Bravo",
    field2Label: "Cell #",
    field2Value: "0312-XXXXXXX",
    field3Label: "Total Calls",
    field3Value: "189",
    field4Label: "Unique Contacts",
    field4Value: "7",
    area: "FATA",
    dateLabel: "Last Active",
    dateValue: "28 Mar",
    notes: "Inbound-heavy profile; contact graph stable for last 72h.",
  },
  "CDR-003": {
    type: "cdr",
    idLabel: "Target ID",
    idValue: "TGT-Charlie",
    field2Label: "Cell #",
    field2Value: "0344-XXXXXXX",
    field3Label: "Total Calls",
    field3Value: "562",
    field4Label: "Unique Contacts",
    field4Value: "24",
    area: "KPK",
    dateLabel: "Last Active",
    dateValue: "29 Mar",
    notes: "Large fan-out behavior; flagged for deeper clustering analysis.",
  },
  "IPDR-901": {
    type: "ipdr",
    idLabel: "Session ID",
    idValue: "IPDR-901",
    field2Label: "IP Address",
    field2Value: "192.168.x.x",
    field3Label: "Device / IMEI",
    field3Value: "IMEI-354xxx",
    field4Label: "Packets",
    field4Value: "12.4K",
    area: "Zone-7",
    dateLabel: "Last Seen",
    dateValue: "30 Mar",
    notes: "Burst upload windows observed in short nighttime intervals.",
  },
  "IPDR-888": {
    type: "ipdr",
    idLabel: "Session ID",
    idValue: "IPDR-888",
    field2Label: "IP Address",
    field2Value: "10.0.x.x",
    field3Label: "Device / IMEI",
    field3Value: "Router-FTTH",
    field4Label: "Packets",
    field4Value: "8.1K",
    area: "FATA",
    dateLabel: "Last Seen",
    dateValue: "29 Mar",
    notes: "Steady packet profile; no abrupt pattern jump during watch window.",
  },
  "IPDR-877": {
    type: "ipdr",
    idLabel: "Session ID",
    idValue: "IPDR-877",
    field2Label: "IP Address",
    field2Value: "172.16.x.x",
    field3Label: "Device / IMEI",
    field3Value: "USB modem",
    field4Label: "Packets",
    field4Value: "3.2K",
    area: "KPK",
    dateLabel: "Last Seen",
    dateValue: "28 Mar",
    notes: "Low-volume session; retained for link-correlation only.",
  },
  "OPS-001": {
    type: "ops",
    idLabel: "Ref",
    idValue: "PR-OPS-01",
    field2Label: "Name",
    field2Value: "Grid sweep",
    field3Label: "Location",
    field3Value: "Border-4",
    field4Label: "Mode",
    field4Value: "Overt",
    area: "Maj. Hamza",
    dateLabel: "Date",
    dateValue: "30 Mar",
    notes: "Sweep completed; follow-up verification task assigned.",
  },
  "OPS-002": {
    type: "ops",
    idLabel: "Ref",
    idValue: "PR-OPS-02",
    field2Label: "Name",
    field2Value: "Link follow-up",
    field3Label: "Location",
    field3Value: "Zone-7",
    field4Label: "Mode",
    field4Value: "Covert",
    area: "Capt. Rafay",
    dateLabel: "Date",
    dateValue: "29 Mar",
    notes: "Follow-up initiated; secondary observer team attached.",
  },
  "OPS-003": {
    type: "ops",
    idLabel: "Ref",
    idValue: "PR-OPS-03",
    field2Label: "Name",
    field2Value: "Watch rotation",
    field3Label: "Location",
    field3Value: "KPK",
    field4Label: "Mode",
    field4Value: "Mixed",
    area: "Maj. Faseeh",
    dateLabel: "Date",
    dateValue: "27 Mar",
    notes: "Rotation updated as per HQ schedule; no conflict reported.",
  },
};

function nextPrismRecordId(kind) {
  const prefix = kind === "cdr" ? "CDR-" : kind === "ipdr" ? "IPDR-" : "OPS-";
  let max = 0;
  Object.keys(PRISM_DETAILS).forEach((k) => {
    if (!k.startsWith(prefix)) return;
    const n = parseInt(k.slice(prefix.length), 10);
    if (!Number.isNaN(n) && n > max) max = n;
  });
  return prefix + String(max + 1).padStart(3, "0");
}

function submitPrismUpload() {
  const form = document.getElementById("prism-upload-form");
  if (!form) return;
  const sel = form.elements.namedItem("prism-record-type");
  const kind = sel && "value" in sel ? String(sel.value) : "cdr";
  const gv = (name) => {
    const el = form.elements.namedItem(name);
    return el && "value" in el ? String(el.value).trim() : "";
  };
  const notes = gv("prism_upload_notes") || "—";

  let prismId = "";
  let d = null;

  if (kind === "cdr") {
    prismId = nextPrismRecordId("cdr");
    const target = gv("u_cdr_target") || "TGT-New";
    const cell = gv("u_cdr_cell") || "—";
    d = {
      type: "cdr",
      idLabel: "Target ID",
      idValue: target,
      field2Label: "Cell #",
      field2Value: cell,
      field3Label: "Total Calls",
      field3Value: gv("u_cdr_calls") || "—",
      field4Label: "Unique Contacts",
      field4Value: gv("u_cdr_contacts") || "—",
      area: gv("u_cdr_area") || "—",
      dateLabel: "Last Active",
      dateValue: gv("u_cdr_last") || "—",
      notes,
    };
  } else if (kind === "ipdr") {
    prismId = nextPrismRecordId("ipdr");
    const session = gv("u_ipdr_session") || prismId;
    d = {
      type: "ipdr",
      idLabel: "Session ID",
      idValue: session,
      field2Label: "IP Address",
      field2Value: gv("u_ipdr_ip") || "—",
      field3Label: "Device / IMEI",
      field3Value: gv("u_ipdr_device") || "—",
      field4Label: "Packets",
      field4Value: gv("u_ipdr_packets") || "—",
      area: gv("u_ipdr_area") || "—",
      dateLabel: "Last Seen",
      dateValue: gv("u_ipdr_seen") || "—",
      notes,
    };
  } else {
    prismId = nextPrismRecordId("ops");
    d = {
      type: "ops",
      idLabel: "Ref",
      idValue: gv("u_ops_ref") || prismId,
      field2Label: "Name",
      field2Value: gv("u_ops_name") || "—",
      field3Label: "Location",
      field3Value: gv("u_ops_loc") || "—",
      field4Label: "Mode",
      field4Value: gv("u_ops_mode") || "—",
      area: gv("u_ops_officer") || "—",
      dateLabel: "Date",
      dateValue: gv("u_ops_date") || "—",
      notes,
    };
  }

  PRISM_DETAILS[prismId] = d;
  const idArg = JSON.stringify(prismId);

  const panelSel = `#p-cdr [data-prism-panel="${kind}"] tbody`;
  const tbody = document.querySelector(panelSel);
  if (tbody) {
    const tr = document.createElement("tr");
    tr.setAttribute("data-prism-id", prismId);
    if (kind === "cdr") {
      tr.innerHTML = `<td>${escapeHtml(d.idValue)}</td><td>${escapeHtml(d.field2Value)}</td><td>${escapeHtml(d.field3Value)}</td><td>${escapeHtml(d.field4Value)}</td><td>${escapeHtml(d.area)}</td><td>${escapeHtml(d.dateValue)}</td><td class="op-table-actions"><button type="button" class="btn btn-outline btn-sm" onclick="event.stopPropagation();openPrismDetail(${idArg})">View</button><button type="button" class="btn btn-primary btn-sm" onclick="event.stopPropagation();openPrismDetail(${idArg},true)">Edit</button></td>`;
    } else if (kind === "ipdr") {
      tr.innerHTML = `<td>${escapeHtml(d.idValue)}</td><td>${escapeHtml(d.field2Value)}</td><td>${escapeHtml(d.field3Value)}</td><td>${escapeHtml(d.field4Value)}</td><td>${escapeHtml(d.area)}</td><td>${escapeHtml(d.dateValue)}</td><td class="op-table-actions"><button type="button" class="btn btn-outline btn-sm" onclick="event.stopPropagation();openPrismDetail(${idArg})">View</button><button type="button" class="btn btn-primary btn-sm" onclick="event.stopPropagation();openPrismDetail(${idArg},true)">Edit</button></td>`;
    } else {
      tr.innerHTML = `<td>${escapeHtml(d.idValue)}</td><td><strong>${escapeHtml(d.field2Value)}</strong></td><td>${escapeHtml(d.field3Value)}</td><td>${escapeHtml(d.field4Value)}</td><td>${escapeHtml(d.area)}</td><td>${escapeHtml(d.dateValue)}</td><td class="op-table-actions"><button type="button" class="btn btn-outline btn-sm" onclick="event.stopPropagation();openPrismDetail(${idArg})">View</button><button type="button" class="btn btn-primary btn-sm" onclick="event.stopPropagation();openPrismDetail(${idArg},true)">Edit</button></td>`;
    }
    tbody.appendChild(tr);
  }

  closeModal();
}

let __prismDetailContext = { id: null };

function buildPrismDetailHtml(d, prismId) {
  const pf = (label, value) =>
    `<div class="pf-item"><div class="pf-label">${escapeHtml(label)}</div><div class="pf-val">${escapeHtml(value)}</div></div>`;
  return `
<div class="profile-fields report-detail-fields">
  ${pf("Record ID", prismId)}
  ${pf(d.idLabel, d.idValue)}
  ${pf(d.field2Label, d.field2Value)}
  ${pf(d.field3Label, d.field3Value)}
  ${pf(d.field4Label, d.field4Value)}
  ${pf(d.type === "ops" ? "Case Officer" : "Area", d.area)}
  ${pf(d.dateLabel, d.dateValue)}
  <div class="pf-item pf-item--wide"><div class="pf-label">Notes</div><div class="pf-val">${escapeHtml(d.notes)}</div></div>
</div>
<div class="form-actions report-detail-actions">
  <button type="button" class="btn btn-outline btn-sm" onclick="closeModal()">Close</button>
  <span class="report-detail-actions-spacer"></span>
  <button type="button" class="btn btn-red btn-sm" onclick="prismDetailDelete()">🗑 Delete</button>
  <button type="button" class="btn btn-primary btn-sm" onclick="prismDetailEdit()">✏️ Edit</button>
</div>`;
}

function buildPrismEditHtml(d, prismId) {
  return `
<form id="prism-detail-edit-form" class="report-edit-form" onsubmit="event.preventDefault(); prismDetailSaveEdit();">
  <div class="form-grid">
    <div class="form-group"><label>Record ID</label><input class="report-edit-readonly" name="recordId" value="${escapeHtml(prismId)}" readonly /></div>
    <div class="form-group"><label>${escapeHtml(d.idLabel)}</label><input name="idValue" value="${escapeHtml(d.idValue)}" /></div>
    <div class="form-group"><label>${escapeHtml(d.field2Label)}</label><input name="field2Value" value="${escapeHtml(d.field2Value)}" /></div>
    <div class="form-group"><label>${escapeHtml(d.field3Label)}</label><input name="field3Value" value="${escapeHtml(d.field3Value)}" /></div>
    <div class="form-group"><label>${escapeHtml(d.field4Label)}</label><input name="field4Value" value="${escapeHtml(d.field4Value)}" /></div>
    <div class="form-group"><label>${d.type === "ops" ? "Case Officer" : "Area"}</label><input name="area" value="${escapeHtml(d.area)}" /></div>
    <div class="form-group"><label>${escapeHtml(d.dateLabel)}</label><input name="dateValue" value="${escapeHtml(d.dateValue)}" /></div>
    <div class="form-group form-full"><label>Notes</label><textarea name="notes" rows="4">${escapeHtml(d.notes)}</textarea></div>
  </div>
  <div class="form-actions report-detail-actions">
    <button type="button" class="btn btn-outline btn-sm" onclick="prismDetailShowView()">Cancel</button>
    <span class="report-detail-actions-spacer"></span>
    <button type="submit" class="btn btn-primary btn-sm">💾 Save</button>
  </div>
</form>`;
}

function openPrismDetail(prismId, startInEdit) {
  const d = PRISM_DETAILS[prismId];
  if (!d) return;
  __prismDetailContext = { id: prismId };
  const overlay = document.getElementById("modal");
  const titleEl = document.getElementById("modal-title");
  const bodyEl = document.getElementById("modal-body");
  const modalBox = overlay?.querySelector(".modal");
  if (!overlay || !titleEl || !bodyEl || !modalBox) return;
  modalBox.classList.remove("modal-personnel");
  modalBox.classList.add("modal-report-detail");
  titleEl.classList.remove("modal-title--personnel");
  titleEl.textContent = `${d.type.toUpperCase()} Record • ${prismId}`;
  bodyEl.innerHTML = startInEdit ? buildPrismEditHtml(d, prismId) : buildPrismDetailHtml(d, prismId);
  overlay.classList.add("open");
}

function prismDetailShowView() {
  const id = __prismDetailContext.id;
  if (!id || !PRISM_DETAILS[id]) return;
  openPrismDetail(id, false);
}

function prismDetailEdit() {
  const id = __prismDetailContext.id;
  if (!id || !PRISM_DETAILS[id]) return;
  openPrismDetail(id, true);
}

function prismDetailSaveEdit() {
  const id = __prismDetailContext.id;
  const d = PRISM_DETAILS[id];
  const form = document.getElementById("prism-detail-edit-form");
  if (!id || !d || !form) return;
  const getv = (name) => {
    const el = form.elements.namedItem(name);
    return el && "value" in el ? String(el.value).trim() : "";
  };
  d.idValue = getv("idValue");
  d.field2Value = getv("field2Value");
  d.field3Value = getv("field3Value");
  d.field4Value = getv("field4Value");
  d.area = getv("area");
  d.dateValue = getv("dateValue");
  d.notes = getv("notes");
  syncPrismTableRow(id, d);
  prismDetailShowView();
}

function prismDetailDelete() {
  const id = __prismDetailContext.id;
  if (!id) return;
  if (!confirm(`Delete record ${id}? This cannot be undone.`)) return;
  delete PRISM_DETAILS[id];
  document.querySelectorAll("#p-cdr tr[data-prism-id]").forEach((row) => {
    if (row.getAttribute("data-prism-id") === id) row.remove();
  });
  closeModal();
}

function syncPrismTableRow(prismId, d) {
  let row = null;
  document.querySelectorAll("#p-cdr tr[data-prism-id]").forEach((r) => {
    if (r.getAttribute("data-prism-id") === prismId) row = r;
  });
  if (!row) return;
  const cells = row.querySelectorAll("td");
  if (d.type === "cdr" && cells.length >= 7) {
    cells[0].textContent = d.idValue;
    cells[1].textContent = d.field2Value;
    cells[2].textContent = d.field3Value;
    cells[3].textContent = d.field4Value;
    cells[4].textContent = d.area;
    cells[5].textContent = d.dateValue;
  } else if (d.type === "ipdr" && cells.length >= 7) {
    cells[0].textContent = d.idValue;
    cells[1].textContent = d.field2Value;
    cells[2].textContent = d.field3Value;
    cells[3].textContent = d.field4Value;
    cells[4].textContent = d.area;
    cells[5].textContent = d.dateValue;
  } else if (d.type === "ops" && cells.length >= 7) {
    cells[0].textContent = d.idValue;
    cells[1].innerHTML = `<strong>${escapeHtml(d.field2Value)}</strong>`;
    cells[2].textContent = d.field3Value;
    cells[3].textContent = d.field4Value;
    cells[4].textContent = d.area;
    cells[5].textContent = d.dateValue;
  }
}

/** Demo detail payloads for Reports → Details (replace with API data later). */
const REPORT_DETAILS = {
  "INC-001": {
    kind: "incident",
    modalTitle: "Incident Report",
    title: "IED Detection · Supply Route",
    severity: { cls: "tag-red", text: "HIGH" },
    zone: "Zone-7 North",
    operation: "SWIFT",
    when: "30 Mar 2026 · 09:42 PKT",
    reporter: "Faseeh",
    status: { cls: "tag-red", text: "Open" },
    summary:
      "IED components observed near supply route MSR-7B. EOD team notified; cordon established 400 m radius. Two civilian vehicles diverted without incident. Photos and GPS pins attached. Follow-up sweep scheduled with route clearance team.",
    files: [
      { name: "msr7b_ied_photos.zip", meta: "14.2 MB · Archive" },
      { name: "gps_pins.kmz", meta: "88 KB · KMZ" },
      { name: "witness_notes.pdf", meta: "420 KB · PDF" },
    ],
  },
  "INC-002": {
    kind: "incident",
    modalTitle: "Incident Report",
    title: "Suspicious Vehicles · Border",
    severity: { cls: "tag-orange", text: "MEDIUM" },
    zone: "Border-12",
    operation: "—",
    when: "29 Mar 2026 · 16:10 PKT",
    reporter: "Rafay",
    status: { cls: "tag-orange", text: "In Progress" },
    summary:
      "Two unregistered pickups with covered beds observed at checkpoint; drivers provided conflicting paperwork. Vehicles held for inspection; registration forwarded to customs cell. Dashcam excerpt and checkpoint log uploaded.",
    files: [
      { name: "checkpoint_log_scan.pdf", meta: "1.1 MB · PDF" },
      { name: "dashcam_excerpt.mp4", meta: "32 MB · MP4" },
    ],
  },
  "INC-003": {
    kind: "incident",
    modalTitle: "Incident Report",
    title: "Intel Tip · Informant #4",
    severity: { cls: "tag-teal", text: "LOW" },
    zone: "Zone-2",
    operation: "—",
    when: "28 Mar 2026 · 11:05 PKT",
    reporter: "Hamza",
    status: { cls: "tag-green", text: "Under Review" },
    summary:
      "Informant reports possible meet window for couriers in urban cell grid. Correlation with CDR watchlist pending. No physical contact confirmed; held for fusion cell review.",
    files: [{ name: "informant_redacted.txt", meta: "4 KB · TXT" }],
  },
  "THR-007": {
    kind: "threat",
    modalTitle: "Threat Report",
    title: "Armed group movement · Border",
    severity: { cls: "tag-red", text: "CRITICAL" },
    zone: "Zone 7",
    operation: "—",
    when: "30 Mar 2026 · 07:00 PKT",
    reporter: "Faseeh",
    status: { cls: "tag-orange", text: "Under Review" },
    summary:
      "SIGINT and HUMINT align on southward movement along dry wadi. Recommend increased UAV coverage and border team alert. Financial trace suggests logistics prep within 72 h.",
    recommended: "Increase UAV orbit B-7; brief border posts; share fusion package with sister unit.",
    files: [
      { name: "threat_fusion_THR-007.pdf", meta: "2.4 MB · PDF" },
      { name: "heatmap_overlay.png", meta: "1.8 MB · PNG" },
    ],
    taLead: "hot",
  },
  "THR-006": {
    kind: "threat",
    modalTitle: "Threat Report",
    title: "Financial transfers detected",
    severity: { cls: "tag-orange", text: "HIGH" },
    zone: "Zone 5",
    operation: "—",
    when: "29 Mar 2026 · 14:22 PKT",
    reporter: "Hamza",
    status: { cls: "tag-green", text: "Approved" },
    summary:
      "Unusual hawala pattern flagged through FIU referral. Beneficiary names cross-match low-confidence watchlist; case forwarded for banking liaison.",
    recommended: "Maintain account holds; weekly re-check until pattern clears.",
    files: [{ name: "fiu_extract.xlsx", meta: "156 KB · XLSX" }],
    taLead: "actionable",
  },
  "THR-005": {
    kind: "threat",
    modalTitle: "Threat Report",
    title: "Routine watch · Corridor",
    severity: { cls: "tag-teal", text: "LOW" },
    zone: "Zone 3",
    operation: "—",
    when: "25 Mar 2026 · 09:00 PKT",
    reporter: "Rafay",
    status: { cls: "tag-green", text: "Filed" },
    summary: "Routine observation; no abnormal movement. Corridor traffic within baseline.",
    recommended: "Continue periodic watch per SOP.",
    files: [],
    taLead: "standard",
  },
  "INF-014": {
    kind: "info",
    modalTitle: "Info Report",
    title: "Open-source network · Comms shift",
    severity: { cls: "tag-orange", text: "MEDIUM" },
    zone: "Zone-4",
    operation: "—",
    when: "30 Mar 2026 · 08:30 PKT",
    reporter: "Rafay",
    status: { cls: "tag-red", text: "Open" },
    category: "OSINT",
    sources: "Public channels / scraped metadata only; no direct collection.",
    summary:
      "Observed shift in public-facing comms handles and posting times; possible new coordinator window. Not actionable alone; merge with CDR spike from 28 Mar.",
    files: [
      { name: "osint_screens_bundle.pdf", meta: "6 MB · PDF" },
      { name: "metadata_table.csv", meta: "24 KB · CSV" },
    ],
  },
  "INF-013": {
    kind: "info",
    modalTitle: "Info Report",
    title: "Media sentiment · District brief",
    severity: { cls: "tag-teal", text: "LOW" },
    zone: "KPK",
    operation: "—",
    when: "28 Mar 2026 · 19:00 PKT",
    reporter: "Bilal",
    status: { cls: "tag-green", text: "Filed" },
    category: "Media",
    sources: "Regional print + vetted social aggregates.",
    summary:
      "District-level sentiment stable; no coordinated escalation detected. Retain routine monitoring.",
    files: [{ name: "district_sentiment_week12.pdf", meta: "890 KB · PDF" }],
  },
  "PORS-042": {
    kind: "pors",
    modalTitle: "PORS Report",
    title: "Route recon · Checkpoint Alpha",
    severity: { cls: "tag-orange", text: "MEDIUM" },
    zone: "Border-12",
    operation: "GRID 38S",
    when: "29 Mar 2026 · 05:15 PKT",
    reporter: "Maj. Faseeh",
    status: { cls: "tag-red", text: "Open" },
    classification: "Restricted",
    summary:
      "Route visibility good; minor washout north of checkpoint. Local liaison reports no overnight activity. Grid photos and sketch in attachments.",
    files: [
      { name: "grid38s_sketch.pdf", meta: "640 KB · PDF" },
      { name: "dawn_photos.zip", meta: "22 MB · Archive" },
    ],
  },
  "PORS-041": {
    kind: "pors",
    modalTitle: "PORS Report",
    title: "Night patrol · Sector 7-N",
    severity: { cls: "tag-teal", text: "LOW" },
    zone: "Zone-7",
    operation: "GRID 38N",
    when: "27 Mar 2026 · 22:40 PKT",
    reporter: "Capt. Hamza",
    status: { cls: "tag-green", text: "Closed" },
    classification: "Confidential",
    summary:
      "Patrol completed without contact. Thermal sweep clear; noise discipline maintained. Closed per SOP.",
    files: [{ name: "patrol_voice_log.aac", meta: "8 MB · AAC" }],
  },
};

let __reportDetailContext = { id: null, kind: null };

function _reportTagSpan(t) {
  return `<span class="tag ${t.cls}">${escapeHtml(t.text)}</span>`;
}

function severityTextToTag(text) {
  const raw = (text || "").trim();
  const u = raw.toUpperCase();
  if (u === "CRITICAL") return { cls: "tag-red", text: "CRITICAL" };
  if (u === "HIGH") return { cls: "tag-red", text: "HIGH" };
  if (u === "MEDIUM") return { cls: "tag-orange", text: "MEDIUM" };
  if (u === "LOW") return { cls: "tag-teal", text: "LOW" };
  return { cls: "tag-teal", text: raw || "LOW" };
}

function statusTextToTag(text) {
  const t = (text || "Open").trim();
  const map = {
    Open: "tag-red",
    "In Progress": "tag-orange",
    "Under Review": "tag-orange",
    Approved: "tag-green",
    Filed: "tag-green",
    Closed: "tag-green",
  };
  return { cls: map[t] || "tag-teal", text: t };
}

function formatTableDate(when) {
  if (!when) return "—";
  const m = when.match(/^(\d{1,2}\s+\w{3})/);
  return m ? m[1] : when.slice(0, 14);
}

function getThreatZoneSelectHtml(selected) {
  const cur = (selected || "Zone 1").trim();
  let html = "";
  for (let z = 1; z <= 12; z++) {
    const label = `Zone ${z}`;
    html += `<option value="${escapeHtml(label)}"${cur === label ? " selected" : ""}>${escapeHtml(
      label
    )}</option>`;
  }
  return html;
}

function formatDateInputToWhen(isoDate) {
  if (!isoDate) return "";
  const parts = isoDate.split("-");
  if (parts.length !== 3) return "";
  const [y, mo, d] = parts;
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return `${String(parseInt(d, 10)).padStart(2, "0")} ${months[parseInt(mo, 10) - 1]} ${y} · 08:00 PKT`;
}

function nextThreatReportId() {
  let max = 0;
  Object.keys(REPORT_DETAILS).forEach((k) => {
    if (!k.startsWith("THR-")) return;
    const n = parseInt(k.replace("THR-", ""), 10);
    if (!Number.isNaN(n) && n > max) max = n;
  });
  return "THR-" + String(max + 1).padStart(3, "0");
}

function getThreatReportIdsFromDb() {
  return Object.keys(REPORT_DETAILS).filter((k) => REPORT_DETAILS[k].kind === "threat");
}

function buildThreatAssessmentRowHtml(id, d) {
  const idArg = JSON.stringify(id);
  return `<tr data-report-id="${escapeHtml(id)}" data-ta-lead="${escapeHtml(d.taLead || "standard")}">
    <td>${escapeHtml(id)}</td>
    <td><strong>${escapeHtml(d.title)}</strong></td>
    <td>${escapeHtml(d.zone)}</td>
    <td>${_reportTagSpan(d.severity)}</td>
    <td>${escapeHtml(d.reporter)}</td>
    <td>${escapeHtml(formatTableDate(d.when))}</td>
    <td>${_reportTagSpan(d.status)}</td>
    <td><button type="button" class="btn btn-outline btn-sm" onclick="event.stopPropagation();openReportDetail(${idArg})">View</button></td>
  </tr>`;
}

function buildReportsPanelThreatRowHtml(id, d) {
  const idArg = JSON.stringify(id);
  return `<tr data-report-id="${escapeHtml(id)}"><td>${escapeHtml(id)}</td><td><strong>${escapeHtml(
    d.title
  )}</strong></td><td>${_reportTagSpan(d.severity)}</td><td>${escapeHtml(d.zone)}</td><td>—</td><td>${escapeHtml(
    formatTableDate(d.when)
  )}</td><td>${escapeHtml(d.reporter)}</td><td>${_reportTagSpan(d.status)}</td><td><button type="button" class="btn btn-outline btn-sm" onclick="event.stopPropagation();openReportDetail(${idArg})">Details</button></td></tr>`;
}

function renderAllThreatReportTables() {
  const allIds = getThreatReportIdsFromDb();
  const mode = document.getElementById("threat-assessment-mode")?.value || "day-month";
  let filtered = allIds.map((id) => ({ id, ...REPORT_DETAILS[id] }));
  if (mode === "hot") filtered = filtered.filter((r) => r.taLead === "hot");
  else if (mode === "actionable") filtered = filtered.filter((r) => r.taLead === "actionable");
  filtered.sort((a, b) => (b.when || "").localeCompare(a.when || ""));

  const taBody = document.getElementById("threat-assessment-tbody");
  if (taBody) {
    taBody.innerHTML =
      filtered.map((r) => buildThreatAssessmentRowHtml(r.id, r)).join("") ||
      `<tr><td colspan="8" style="text-align:center;padding:16px;color:#888;">No threat reports for this view.</td></tr>`;
  }

  const titleEl = document.getElementById("threat-reports-card-title");
  if (titleEl) {
    titleEl.textContent =
      mode === "day-month"
        ? "Submitted Threat Reports"
        : mode === "hot"
          ? "Hot leads"
          : "Actionable leads";
  }

  const rp = document.getElementById("reports-panel-threat");
  if (rp) {
    const sortedAll = [...allIds].sort((a, b) =>
      (REPORT_DETAILS[b].when || "").localeCompare(REPORT_DETAILS[a].when || "")
    );
    rp.innerHTML = sortedAll
      .map((id) => buildReportsPanelThreatRowHtml(id, REPORT_DETAILS[id]))
      .join("");
  }
}

function setThreatAssessmentMode() {
  renderAllThreatReportTables();
}

function openThreatMapModal() {
  const overlay = document.getElementById("modal");
  const titleEl = document.getElementById("modal-title");
  const bodyEl = document.getElementById("modal-body");
  const modalBox = overlay?.querySelector(".modal");
  const iframe = document.getElementById("threat-map-iframe");
  if (!overlay || !titleEl || !bodyEl || !modalBox) return;
  modalBox.classList.remove("modal-personnel");
  modalBox.classList.remove("modal-report-detail");
  titleEl.classList.remove("modal-title--personnel");
  titleEl.textContent = "Add / change map";
  const cur = iframe?.getAttribute("src") || "";
  bodyEl.innerHTML = `
<div class="form-grid">
  <div class="form-group form-full">
    <label>Map embed URL (HTTPS)</label>
    <textarea id="threat-map-url-input" rows="4" placeholder="https://www.openstreetmap.org/export/embed.html?...">${escapeHtml(
      cur
    )}</textarea>
  </div>
</div>
<div class="form-actions">
  <button type="button" class="btn btn-outline" onclick="closeModal()">Cancel</button>
  <button type="button" class="btn btn-primary" onclick="applyThreatMapUrl()">Apply</button>
</div>`;
  overlay.classList.add("open");
}

function applyThreatMapUrl() {
  const ta = document.getElementById("threat-map-url-input");
  const url = ta && "value" in ta ? String(ta.value).trim() : "";
  if (url && /^https:\/\//i.test(url)) {
    const iframe = document.getElementById("threat-map-iframe");
    if (iframe) iframe.setAttribute("src", url);
  } else if (url) {
    alert("Please use an HTTPS URL.");
    return;
  }
  closeModal();
}

function threatAssessmentAddSubmit() {
  const form = document.getElementById("threat-assessment-add-form");
  if (!form) return;
  const getv = (name) => {
    const el = form.elements.namedItem(name);
    return el && "value" in el ? String(el.value).trim() : "";
  };
  const id = nextThreatReportId();
  const sevRaw = getv("severity");
  const sev = severityTextToTag(sevRaw);
  const st = statusTextToTag(getv("status"));
  const when = formatDateInputToWhen(getv("reportDate")) || "—";
  REPORT_DETAILS[id] = {
    kind: "threat",
    modalTitle: "Threat Report",
    title: getv("title") || "Untitled threat report",
    severity: sev,
    zone: getv("zone") || "Zone 1",
    operation: "—",
    when,
    reporter: getv("reporter") || "—",
    status: st,
    summary: getv("summary") || "",
    recommended: getv("recommended") || "",
    files: [],
    taLead: "standard",
  };
  closeModal();
  renderAllThreatReportTables();
}

function getAddThreatModalHtml() {
  const sevOpts = ["CRITICAL", "HIGH", "MEDIUM", "LOW"]
    .map((o) => `<option value="${o}">${o}</option>`)
    .join("");
  const stOpts = ["Open", "In Progress", "Under Review", "Approved", "Filed", "Closed"]
    .map((o) => `<option value="${o}">${o}</option>`)
    .join("");
  return `<form id="threat-assessment-add-form" onsubmit="event.preventDefault(); threatAssessmentAddSubmit();">
  <div class="form-grid">
    <div class="form-group form-full"><label>Report title</label><input name="title" placeholder="Brief title" required /></div>
    <div class="form-group"><label>Risk level</label><select name="severity">${sevOpts}</select></div>
    <div class="form-group"><label>Zone</label><select name="zone">${getThreatZoneSelectHtml("Zone 7")}</select></div>
    <div class="form-group"><label>Status</label><select name="status">${stOpts}</select></div>
    <div class="form-group"><label>Date</label><input name="reportDate" type="date" /></div>
    <div class="form-group"><label>Submitted by</label><input name="reporter" placeholder="Rank / name" /></div>
    <div class="form-group form-full"><label>Threat description</label><textarea name="summary" rows="4" placeholder="Detail the threat..." required></textarea></div>
    <div class="form-group form-full"><label>Recommended action</label><textarea name="recommended" rows="3" placeholder="Recommended response..."></textarea></div>
  </div>
  <div class="form-actions"><button class="btn btn-outline" type="button" onclick="closeModal()">Cancel</button><button class="btn btn-red" type="submit">➕ Add Threat Report</button></div>
</form>`;
}

function syncReportTableRow(reportId, d) {
  document.querySelectorAll(`tr[data-report-id="${reportId}"]`).forEach((row) => {
    const cells = row.querySelectorAll("td");
    if (row.closest("#p-threats") && cells.length >= 8) {
      cells[1].innerHTML = `<strong>${escapeHtml(d.title)}</strong>`;
      cells[2].textContent = d.zone;
      cells[3].innerHTML = _reportTagSpan(d.severity);
      cells[4].textContent = d.reporter;
      cells[5].textContent = formatTableDate(d.when);
      cells[6].innerHTML = _reportTagSpan(d.status);
      if (d.taLead) row.setAttribute("data-ta-lead", d.taLead);
      return;
    }
    if (cells.length < 9) return;
    cells[1].innerHTML = `<strong>${escapeHtml(d.title)}</strong>`;
    cells[2].innerHTML = _reportTagSpan(d.severity);
    cells[3].textContent = d.zone;
    cells[4].textContent = d.operation;
    cells[5].textContent = formatTableDate(d.when);
    cells[6].textContent = d.reporter;
    cells[7].innerHTML = _reportTagSpan(d.status);
  });
}

function buildReportDetailEditHtml(d, reportId) {
  const sevOpts = d.kind === "threat" ? ["CRITICAL", "HIGH", "MEDIUM", "LOW"] : ["HIGH", "MEDIUM", "LOW"];
  const curSev = d.severity.text;
  const statusOpts = ["Open", "In Progress", "Under Review", "Approved", "Filed", "Closed"];
  const curSt = d.status.text;

  const sevOptions = sevOpts
    .map((o) => `<option value="${escapeHtml(o)}" ${o === curSev ? "selected" : ""}>${escapeHtml(o)}</option>`)
    .join("");
  const stOptions = statusOpts
    .map((o) => `<option value="${escapeHtml(o)}" ${o === curSt ? "selected" : ""}>${escapeHtml(o)}</option>`)
    .join("");

  let extraFields = "";
  if (d.kind === "threat") {
    extraFields += `<div class="form-group form-full"><label>Recommended action</label><textarea name="recommended" rows="3">${escapeHtml(
      d.recommended || ""
    )}</textarea></div>`;
  }
  if (d.kind === "info") {
    extraFields += `<div class="form-group"><label>Category</label><input name="category" value="${escapeHtml(
      d.category || ""
    )}" /></div>`;
    extraFields += `<div class="form-group form-full"><label>Sources / references</label><textarea name="sources" rows="3">${escapeHtml(
      d.sources || ""
    )}</textarea></div>`;
  }
  if (d.kind === "pors") {
    const clsOpts = ["Unclassified", "Restricted", "Confidential"];
    const cur = d.classification || "Restricted";
    extraFields += `<div class="form-group"><label>Classification</label><select name="classification">${clsOpts
      .map(
        (c) =>
          `<option value="${escapeHtml(c)}" ${c === cur ? "selected" : ""}>${escapeHtml(c)}</option>`
      )
      .join("")}</select></div>`;
  }

  const filesReadonly = (d.files || [])
    .map(
      (f) =>
        `<div class="report-file-row">
          <div class="report-file-meta"><span class="report-file-name">${escapeHtml(f.name)}</span><span class="report-file-info">${escapeHtml(f.meta)}</span></div>
          <button type="button" class="btn btn-outline btn-sm" title="Download (demo)">⬇</button>
        </div>`
    )
    .join("");

  return `
<form id="report-detail-edit-form" class="report-edit-form" onsubmit="event.preventDefault(); reportDetailSaveEdit();">
  <div class="form-grid">
    <div class="form-group"><label>Report ID</label><input class="report-edit-readonly" name="reportId" value="${escapeHtml(
      reportId
    )}" readonly /></div>
    <div class="form-group form-full"><label>Title</label><input name="title" value="${escapeHtml(d.title)}" required /></div>
    <div class="form-group"><label>Severity / Level</label><select name="severity">${sevOptions}</select></div>
    <div class="form-group"><label>Status</label><select name="status">${stOptions}</select></div>
    <div class="form-group"><label>Zone</label>${
      d.kind === "threat"
        ? `<select name="zone">${getThreatZoneSelectHtml(d.zone)}</select>`
        : `<input name="zone" value="${escapeHtml(d.zone)}" />`
    }</div>
    <div class="form-group"><label>${d.kind === "pors" ? "Sector / Grid" : "Operation / Ref"}</label><input name="operation" value="${escapeHtml(
      d.operation
    )}" /></div>
    <div class="form-group"><label>Date &amp; time</label><input name="when" value="${escapeHtml(d.when)}" /></div>
    <div class="form-group"><label>Reported by</label><input name="reporter" value="${escapeHtml(d.reporter)}" /></div>
    ${extraFields}
    <div class="form-group form-full"><label>Description</label><textarea name="summary" rows="5" required>${escapeHtml(
      d.summary
    )}</textarea></div>
  </div>
  <div class="report-detail-section-title">Attachments</div>
  <div class="report-files-box">${filesReadonly || `<p class="report-files-empty">No files uploaded.</p>`}</div>
  <p class="report-edit-files-hint">Attachments are view-only here; add new files when saving to backend is wired.</p>
  <div class="form-actions report-detail-actions">
    <button type="button" class="btn btn-outline btn-sm" onclick="reportDetailCancelEdit()">Cancel</button>
    <span class="report-detail-actions-spacer"></span>
    <button type="submit" class="btn btn-primary btn-sm">💾 Save</button>
  </div>
</form>`;
}

function buildReportDetailHtml(d, reportId) {
  const pf = (label, innerHtml) =>
    `<div class="pf-item"><div class="pf-label">${escapeHtml(label)}</div><div class="pf-val">${innerHtml}</div></div>`;

  let fields =
    pf("Report ID", escapeHtml(reportId)) +
    pf("Title", escapeHtml(d.title)) +
    pf("Severity / Level", _reportTagSpan(d.severity)) +
    pf("Zone", escapeHtml(d.zone)) +
    pf(d.kind === "pors" ? "Sector / Grid" : "Operation / Ref", escapeHtml(d.operation)) +
    pf("Date & time", escapeHtml(d.when)) +
    pf("Reported by", escapeHtml(d.reporter)) +
    pf("Status", _reportTagSpan(d.status));

  if (d.category) fields += pf("Category", escapeHtml(d.category));
  if (d.classification) fields += pf("Classification", escapeHtml(d.classification));
  if (d.recommended) {
    fields +=
      `<div class="pf-item pf-item--wide"><div class="pf-label">Recommended action</div><div class="pf-val">${escapeHtml(d.recommended)}</div></div>`;
  }
  if (d.sources) {
    fields +=
      `<div class="pf-item pf-item--wide"><div class="pf-label">Sources / references</div><div class="pf-val">${escapeHtml(d.sources)}</div></div>`;
  }

  const filesHtml = (d.files || [])
    .map(
      (f) =>
        `<div class="report-file-row">
          <div class="report-file-meta"><span class="report-file-name">${escapeHtml(f.name)}</span><span class="report-file-info">${escapeHtml(f.meta)}</span></div>
          <button type="button" class="btn btn-outline btn-sm" title="Download (demo)">⬇</button>
        </div>`
    )
    .join("");

  return `
<div class="profile-fields report-detail-fields">${fields}</div>
<div class="report-detail-section-title">Description</div>
<div class="report-detail-narrative">${escapeHtml(d.summary)}</div>
<div class="report-detail-section-title">Attachments</div>
<div class="report-files-box">${filesHtml || `<p class="report-files-empty">No files uploaded.</p>`}</div>
<div class="form-actions report-detail-actions">
  <button type="button" class="btn btn-outline btn-sm" onclick="closeModal()">Close</button>
  <span class="report-detail-actions-spacer"></span>
  <button type="button" class="btn btn-red btn-sm" onclick="reportDetailDelete()">🗑 Delete</button>
  <button type="button" class="btn btn-primary btn-sm" onclick="reportDetailEdit()">✏️ Edit</button>
</div>`;
}

function openReportDetail(reportId) {
  const d = REPORT_DETAILS[reportId];
  if (!d) return;

  __reportDetailContext = { id: reportId, kind: d.kind };

  const overlay = document.getElementById("modal");
  const titleEl = document.getElementById("modal-title");
  const bodyEl = document.getElementById("modal-body");
  const modalBox = overlay?.querySelector(".modal");
  if (!overlay || !titleEl || !bodyEl || !modalBox) return;

  modalBox.classList.remove("modal-personnel");
  modalBox.classList.add("modal-report-detail");
  titleEl.classList.remove("modal-title--personnel");
  titleEl.textContent = `${d.modalTitle} • ${reportId}`;
  bodyEl.innerHTML = buildReportDetailHtml(d, reportId);
  overlay.classList.add("open");
}

function reportDetailShowView() {
  const id = __reportDetailContext.id;
  const d = id ? REPORT_DETAILS[id] : null;
  const bodyEl = document.getElementById("modal-body");
  const titleEl = document.getElementById("modal-title");
  if (!id || !d || !bodyEl || !titleEl) return;
  titleEl.textContent = `${d.modalTitle} • ${id}`;
  bodyEl.innerHTML = buildReportDetailHtml(d, id);
}

function reportDetailEdit() {
  const id = __reportDetailContext.id;
  const d = REPORT_DETAILS[id];
  const bodyEl = document.getElementById("modal-body");
  const titleEl = document.getElementById("modal-title");
  if (!id || !d || !bodyEl || !titleEl) return;
  titleEl.textContent = `Edit ${d.modalTitle} • ${id}`;
  bodyEl.innerHTML = buildReportDetailEditHtml(d, id);
}

function reportDetailCancelEdit() {
  reportDetailShowView();
}

function reportDetailSaveEdit() {
  const id = __reportDetailContext.id;
  const form = document.getElementById("report-detail-edit-form");
  if (!form || !REPORT_DETAILS[id]) return;

  const getv = (name) => {
    const el = form.elements.namedItem(name);
    return el && "value" in el ? String(el.value).trim() : "";
  };

  const d = REPORT_DETAILS[id];
  d.title = getv("title") || d.title;
  d.severity = severityTextToTag(getv("severity"));
  d.status = statusTextToTag(getv("status"));
  d.zone = getv("zone");
  d.operation = getv("operation");
  d.when = getv("when");
  d.reporter = getv("reporter");
  d.summary = getv("summary");

  if (d.kind === "threat") d.recommended = getv("recommended");
  if (d.kind === "info") {
    d.category = getv("category");
    d.sources = getv("sources");
  }
  if (d.kind === "pors") d.classification = getv("classification");

  syncReportTableRow(id, d);
  if (d.kind === "threat") renderAllThreatReportTables();
  reportDetailShowView();
}

function reportDetailDelete() {
  const id = __reportDetailContext.id;
  if (!id) return;
  if (!confirm(`Delete report ${id}? This cannot be undone.`)) return;
  delete REPORT_DETAILS[id];
  document.querySelectorAll(`tr[data-report-id="${id}"]`).forEach((r) => r.remove());
  renderAllThreatReportTables();
  closeModal();
}

/** Operations list detail / edit (same modal pattern as Reports). */
const OPERATIONS_DETAILS = {
  "OP-001": {
    category: "Counter-Terror",
    categoryTag: "tag-red",
    name: "SWIFT EAGLE",
    location: "N. Waziristan",
    date: "24 Mar",
    mode: "Overt",
    caseOfficer: "Maj. Hamza",
    operator: "Op. Faseeh",
    remarks: "Route clearance ongoing",
  },
  "OP-002": {
    category: "Cordon & Search",
    categoryTag: "tag-blue",
    name: "IRON SHIELD",
    location: "FATA",
    date: "28 Mar",
    mode: "Overt",
    caseOfficer: "Capt. Rafay",
    operator: "Op. Bilal",
    remarks: "Joint cordon with levies",
  },
  "OP-003": {
    category: "Surveillance",
    categoryTag: "tag-orange",
    name: "STEEL NET",
    location: "KPK Border",
    date: "01 Apr",
    mode: "Surveillance",
    caseOfficer: "Maj. Faseeh",
    operator: "Op. Hamza",
    remarks: "Developing — UAV rotation TBD",
  },
  "OP-004": {
    category: "Strike Op",
    categoryTag: "tag-purple",
    name: "THUNDER",
    location: "Khyber",
    date: "01 Mar",
    mode: "Covert",
    caseOfficer: "Capt. Bilal",
    operator: "Op. Rafay",
    remarks: "Closed — debrief filed",
  },
};

let __operationDetailContext = { id: null };

function categoryLabelToTagCls(label) {
  const l = (label || "").toLowerCase();
  if (l.includes("counter") || l.includes("terror")) return "tag-red";
  if (l.includes("cordon")) return "tag-blue";
  if (l.includes("surveillance")) return "tag-orange";
  if (l.includes("strike")) return "tag-purple";
  return "tag-teal";
}

function buildOperationDetailHtml(d, opId) {
  const pf = (label, innerHtml) =>
    `<div class="pf-item"><div class="pf-label">${escapeHtml(label)}</div><div class="pf-val">${innerHtml}</div></div>`;

  return `
<div class="profile-fields report-detail-fields">
  ${pf("Operation ID", escapeHtml(opId))}
  ${pf("Category", `<span class="tag ${d.categoryTag}">${escapeHtml(d.category)}</span>`)}
  ${pf("Name", escapeHtml(d.name))}
  ${pf("Location", escapeHtml(d.location))}
  ${pf("Date", escapeHtml(d.date))}
  ${pf("Mode", escapeHtml(d.mode))}
  ${pf("Case Officer", escapeHtml(d.caseOfficer))}
  ${pf("Operator", escapeHtml(d.operator))}
  ${`<div class="pf-item pf-item--wide"><div class="pf-label">Remarks</div><div class="pf-val">${escapeHtml(d.remarks)}</div></div>`}
</div>
<div class="form-actions report-detail-actions">
  <button type="button" class="btn btn-outline btn-sm" onclick="closeModal()">Close</button>
  <span class="report-detail-actions-spacer"></span>
  <button type="button" class="btn btn-red btn-sm" onclick="operationDetailDelete()">🗑 Delete</button>
  <button type="button" class="btn btn-primary btn-sm" onclick="operationDetailEdit()">✏️ Edit</button>
</div>`;
}

function buildOperationEditHtml(d, opId) {
  return `
<form id="operation-detail-edit-form" class="report-edit-form" onsubmit="event.preventDefault(); operationDetailSaveEdit();">
  <div class="form-grid">
    <div class="form-group"><label>Operation ID</label><input class="report-edit-readonly" name="opId" value="${escapeHtml(
      opId
    )}" readonly /></div>
    <div class="form-group"><label>Category</label><input name="category" value="${escapeHtml(d.category)}" required /></div>
    <div class="form-group"><label>Name</label><input name="name" value="${escapeHtml(d.name)}" required /></div>
    <div class="form-group"><label>Location</label><input name="location" value="${escapeHtml(d.location)}" /></div>
    <div class="form-group"><label>Date</label><input name="date" value="${escapeHtml(d.date)}" /></div>
    <div class="form-group"><label>Mode</label><input name="mode" value="${escapeHtml(d.mode)}" placeholder="Enter mode" /></div>
    <div class="form-group"><label>Case Officer</label><input name="caseOfficer" value="${escapeHtml(d.caseOfficer)}" /></div>
    <div class="form-group"><label>Operator</label><input name="operator" value="${escapeHtml(d.operator)}" /></div>
    <div class="form-group form-full"><label>Remarks</label><textarea name="remarks" rows="4">${escapeHtml(d.remarks)}</textarea></div>
  </div>
  <div class="form-actions report-detail-actions">
    <button type="button" class="btn btn-outline btn-sm" onclick="operationDetailCancelEdit()">Cancel</button>
    <span class="report-detail-actions-spacer"></span>
    <button type="submit" class="btn btn-primary btn-sm">💾 Save</button>
  </div>
</form>`;
}

function openOperationDetail(operationId, startInEdit) {
  const d = OPERATIONS_DETAILS[operationId];
  if (!d) return;

  __operationDetailContext = { id: operationId };

  const overlay = document.getElementById("modal");
  const titleEl = document.getElementById("modal-title");
  const bodyEl = document.getElementById("modal-body");
  const modalBox = overlay?.querySelector(".modal");
  if (!overlay || !titleEl || !bodyEl || !modalBox) return;

  modalBox.classList.remove("modal-personnel");
  modalBox.classList.add("modal-report-detail");
  titleEl.classList.remove("modal-title--personnel");

  if (startInEdit) {
    titleEl.textContent = `Edit Operation • ${operationId}`;
    bodyEl.innerHTML = buildOperationEditHtml(d, operationId);
  } else {
    titleEl.textContent = `Operation • ${operationId}`;
    bodyEl.innerHTML = buildOperationDetailHtml(d, operationId);
  }
  overlay.classList.add("open");
}

function operationDetailShowView() {
  const id = __operationDetailContext.id;
  const d = id ? OPERATIONS_DETAILS[id] : null;
  const bodyEl = document.getElementById("modal-body");
  const titleEl = document.getElementById("modal-title");
  if (!id || !d || !bodyEl || !titleEl) return;
  titleEl.textContent = `Operation • ${id}`;
  bodyEl.innerHTML = buildOperationDetailHtml(d, id);
}

function operationDetailEdit() {
  const id = __operationDetailContext.id;
  const d = OPERATIONS_DETAILS[id];
  const bodyEl = document.getElementById("modal-body");
  const titleEl = document.getElementById("modal-title");
  if (!id || !d || !bodyEl || !titleEl) return;
  titleEl.textContent = `Edit Operation • ${id}`;
  bodyEl.innerHTML = buildOperationEditHtml(d, id);
}

function operationDetailCancelEdit() {
  operationDetailShowView();
}

function operationDetailSaveEdit() {
  const id = __operationDetailContext.id;
  const form = document.getElementById("operation-detail-edit-form");
  if (!form || !OPERATIONS_DETAILS[id]) return;

  const getv = (name) => {
    const el = form.elements.namedItem(name);
    return el && "value" in el ? String(el.value).trim() : "";
  };

  const d = OPERATIONS_DETAILS[id];
  d.category = getv("category") || d.category;
  d.categoryTag = categoryLabelToTagCls(d.category);
  d.name = getv("name") || d.name;
  d.location = getv("location");
  d.date = getv("date");
  d.mode = getv("mode");
  d.caseOfficer = getv("caseOfficer");
  d.operator = getv("operator");
  d.remarks = getv("remarks");

  syncOperationTableRow(id, d);
  operationDetailShowView();
}

function operationDetailDelete() {
  const id = __operationDetailContext.id;
  if (!id) return;
  if (!confirm(`Delete operation ${id}? This cannot be undone.`)) return;
  delete OPERATIONS_DETAILS[id];
  document.querySelectorAll("#p-operations tr[data-operation-id]").forEach((row) => {
    if (row.getAttribute("data-operation-id") === id) row.remove();
  });
  closeModal();
}

function syncOperationTableRow(opId, d) {
  let row = null;
  document.querySelectorAll("#p-operations tr[data-operation-id]").forEach((r) => {
    if (r.getAttribute("data-operation-id") === opId) row = r;
  });
  if (!row) return;
  const cells = row.querySelectorAll("td");
  if (cells.length < 9) return;
  cells[0].innerHTML = `<span class="tag ${d.categoryTag}">${escapeHtml(d.category)}</span>`;
  cells[1].innerHTML = `<strong>${escapeHtml(d.name)}</strong>`;
  cells[2].textContent = d.location;
  cells[3].textContent = d.date;
  cells[4].textContent = d.mode;
  cells[5].textContent = d.caseOfficer;
  cells[6].textContent = d.operator;
  cells[7].textContent = d.remarks;
}

function getPersonnelRecordFormHtml() {
  const calInput = (name) => `
    <div class="pr-cal-wrap">
      <input type="date" name="${name}" class="pr-date-native" aria-label="${name}" />
      <span class="pr-cal-ico" aria-hidden="true">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
      </span>
    </div>`;

  return `
<div class="pr-form-layout">
  <div class="pr-fields-grid" role="group" aria-label="Personnel fields">
    <div class="pr-field">
      <label>Ser #</label>
      <input type="text" placeholder="Auto" autocomplete="off" />
    </div>
    <div class="pr-field">
      <label>Name S/O</label>
      <input type="text" placeholder="Full Name + S/O" autocomplete="name" />
    </div>
    <div class="pr-field">
      <label>Alias</label>
      <input type="text" placeholder="Known alias" />
    </div>
    <div class="pr-field">
      <label>CNIC</label>
      <input type="text" placeholder="XXXXX-XXXXXXX-X" inputmode="numeric" />
    </div>
    <div class="pr-field">
      <label>Cell # / IMEI</label>
      <input type="text" placeholder="0300-XXXXXXX" />
    </div>

    <div class="pr-field">
      <label>Tashkeel</label>
      <input type="text" placeholder="Group/Org" />
    </div>
    <div class="pr-field">
      <label>DOB</label>
      ${calInput("dob")}
    </div>
    <div class="pr-field">
      <label>Age</label>
      <input type="text" placeholder="Age" inputmode="numeric" />
    </div>
    <div class="pr-field">
      <label>Caste</label>
      <input type="text" placeholder="Caste" />
    </div>
    <div class="pr-field">
      <label>Marital Status</label>
      <select>
        <option selected>Single</option>
        <option>Married</option>
        <option>Widowed</option>
        <option>Divorced</option>
      </select>
    </div>

    <div class="pr-field">
      <label>Area</label>
      <input type="text" placeholder="Zone/District" />
    </div>
    <div class="pr-field">
      <label>HM (Head Money)</label>
      <input type="text" placeholder="PKR amount" />
    </div>
    <div class="pr-field">
      <label>Banking Details</label>
      <input type="text" placeholder="Bank/IBAN" />
    </div>
    <div class="pr-field">
      <label>SMNS</label>
      <input type="text" placeholder="FB/TG/WA handles" />
    </div>
    <div class="pr-field">
      <label>FIRs</label>
      <input type="text" placeholder="FIR numbers" />
    </div>

    <div class="pr-field">
      <label>TS Activities</label>
      <input type="text" placeholder="Activities involved" />
    </div>
    <div class="pr-field">
      <label>Family Tree</label>
      <input type="text" placeholder="Family details" />
    </div>
    <div class="pr-field">
      <label>Case Officer</label>
      <input type="text" placeholder="Assigned officer" />
    </div>
    <div class="pr-field">
      <label>Area Active</label>
      <input type="text" placeholder="Active areas" />
    </div>
    <div class="pr-field">
      <label>GP</label>
      <input type="text" placeholder="GP number" />
    </div>

    <div class="pr-field">
      <label>Years Active</label>
      <input type="text" placeholder="Years" />
    </div>
    <div class="pr-field">
      <label>Position</label>
      <input type="text" placeholder="Role/Position" />
    </div>
    <div class="pr-field">
      <label>Misc</label>
      <input type="text" placeholder="Misc info" />
    </div>
    <div class="pr-field">
      <label>Remarks</label>
      <input type="text" placeholder="Remarks" />
    </div>
    <div class="pr-field">
      <label>Date Updated</label>
      ${calInput("date_updated")}
    </div>
  </div>

  <aside class="pr-photo-aside" aria-label="Profile photo">
    <div class="pr-photo-frame" title="Click to upload photo">
      <div class="pr-photo-circle">
        <svg class="pr-photo-silhouette" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
        </svg>
      </div>
      <div class="pr-photo-meta">
        <strong>Picture</strong>
        <span>Photo on file…</span>
      </div>
    </div>
  </aside>
</div>

<div class="pr-status-row">
  <label class="pr-status-pill pr-status-pill--select" for="pr-record-status">Status</label>
  <select id="pr-record-status" class="pr-status-select" name="status" aria-label="Record status">
    <option selected>Active</option>
    <option>Eliminated</option>
    <option>Arrested</option>
    <option>SSG</option>
    <option>SST</option>
    <option>Tech/Cyber</option>
    <option>Ariel</option>
    <option>Matured</option>
    <option>Developing</option>
  </select>
</div>

<div class="pr-details-block">
  <textarea rows="4" placeholder="Details will be added here as Paragraph..." aria-label="Details paragraph"></textarea>
</div>

<div class="pr-files-section">
  <div class="pr-files-toolbar">
    <button type="button" class="btn-file-dl"><span class="pr-ico-dl" aria-hidden="true">⬇</span> Download File</button>
    <button type="button" class="btn-file-up"><span class="pr-ico-up" aria-hidden="true">⬆</span> Upload File</button>
  </div>
  <div class="pr-files-slots-row">
    <span class="pr-files-label">Uploaded Files:</span>
    <div class="file-slots" aria-label="File attachment slots">
      ${Array.from({ length: 10 })
        .map(
          (_, i) =>
            `<button type="button" class="file-slot" title="Slot ${i + 1}">+</button>`
        )
        .join("")}
    </div>
  </div>
</div>

<div class="personnel-footer">
  <button type="button" class="btn-cancel" onclick="closeModal()">Cancel</button>
  <button type="button" class="btn-save"><span aria-hidden="true">💾</span> Save Record</button>
</div>`;
}

function getViewRecordReadonlyHtml() {
  return `<div class="profile-fields">
    <div class="pf-item"><div class="pf-label">SR #</div><div class="pf-val">001</div></div>
    <div class="pf-item"><div class="pf-label">Tashkeel</div><div class="pf-val">Lashkar-e-X</div></div>
    <div class="pf-item"><div class="pf-label">Name S/O</div><div class="pf-val">Muhammad Tahir S/O Abdul Rehman</div></div>
    <div class="pf-item"><div class="pf-label">Alias</div><div class="pf-val">Tiger</div></div>
    <div class="pf-item"><div class="pf-label">CNIC</div><div class="pf-val">42101-XXXXXXX-X</div></div>
    <div class="pf-item"><div class="pf-label">DOB & Age</div><div class="pf-val">01/01/1985 · 41</div></div>
    <div class="pf-item"><div class="pf-label">Caste</div><div class="pf-val">Wazir</div></div>
    <div class="pf-item"><div class="pf-label">Marital Status</div><div class="pf-val">Married</div></div>
    <div class="pf-item"><div class="pf-label">Cell # / IMEI</div><div class="pf-val">0300-XXXXXXX</div></div>
    <div class="pf-item"><div class="pf-label">Social Media</div><div class="pf-val">TG: @xxxxx</div></div>
    <div class="pf-item"><div class="pf-label">Area</div><div class="pf-val">Zone-7 North</div></div>
    <div class="pf-item"><div class="pf-label">HM</div><div class="pf-val" style="color:var(--red);">PKR 25 Lakh</div></div>
    <div class="pf-item"><div class="pf-label">FIRs</div><div class="pf-val">FIR-2024-337</div></div>
    <div class="pf-item"><div class="pf-label">Case Officer</div><div class="pf-val">Capt. Hamza</div></div>
    <div class="pf-item"><div class="pf-label">GP</div><div class="pf-val">GP-77</div></div>
    <div class="pf-item"><div class="pf-label">Status</div><div class="pf-val"><span class="tag tag-red">Active</span></div></div>
  </div>
  <div style="background:#f8f8f8;border-radius:10px;padding:12px;margin-bottom:10px;font-size:.78rem;"><strong>Banking Details:</strong> HBL · PKXXXX000000000<br><strong>TS Activities:</strong> Facilitation, Financing<br><strong>Family Details:</strong> Wife: Fatima, 3 children – Eldest son enrolled in Madrassa X</div>
  <div class="form-actions">
    <button class="btn btn-outline btn-sm" type="button">📥 Download</button>
    <button class="btn btn-primary btn-sm" type="button" onclick="closeModal();openModal('personnelRecord');">✏️ Edit</button>
    <button class="btn btn-red btn-sm" type="button">🗑 Delete</button>
  </div>`;
}

/** Shared fields for New Operation and Add Operator modals. */
const OPERATIONS_ENTRY_FORM = `<div class="form-grid">
    <div class="form-group"><label>Category</label><input placeholder="e.g. Counter-Terror, Surveillance" /></div>
    <div class="form-group"><label>Name</label><input placeholder="Operation or record name" /></div>
    <div class="form-group"><label>Location</label><input placeholder="Area / grid / district" /></div>
    <div class="form-group"><label>Date</label><input type="date" /></div>
    <div class="form-group"><label>Mode</label><input placeholder="Enter mode (any value)" /></div>
    <div class="form-group"><label>Case Officer</label><input placeholder="Name / rank" /></div>
    <div class="form-group"><label>Operator</label><input placeholder="Assigned operator" /></div>
    <div class="form-group form-full"><label>Remarks</label><textarea placeholder="Remarks" rows="3"></textarea></div>
  </div>`;

const modalsSimple = {
  addIncident: `<div class="form-grid">
    <div class="form-group"><label>Incident Title</label><input placeholder="Brief title"></div>
    <div class="form-group"><label>Severity</label><select><option>High</option><option>Medium</option><option>Low</option></select></div>
    <div class="form-group"><label>Zone / Area</label><input placeholder="Zone or location"></div>
    <div class="form-group"><label>Related Operation</label><input placeholder="Op code name (if any)"></div>
    <div class="form-group"><label>Date & Time</label><input type="datetime-local"></div>
    <div class="form-group"><label>Reported By</label><input placeholder="Your name"></div>
    <div class="form-group form-full"><label>Description</label><textarea placeholder="Full incident description..."></textarea></div>
    <div class="form-group form-full"><label>Attach Evidence</label><div class="upload-zone"><div style="font-size:2rem;margin-bottom:6px;">📎</div><div>Images, docs, videos</div></div></div>
  </div>
  <div class="form-actions"><button class="btn btn-outline" type="button" onclick="closeModal()">Cancel</button><button class="btn btn-red" type="button">➕ Add Incident Report</button></div>`,

  addOp: `${OPERATIONS_ENTRY_FORM}
  <div class="form-actions"><button class="btn btn-outline" type="button" onclick="closeModal()">Cancel</button><button class="btn btn-primary" type="button">⚔️ Create Operation</button></div>`,

  addThreat: getAddThreatModalHtml(),

  addInfoReport: `<div class="form-grid">
    <div class="form-group"><label>Report Title</label><input placeholder="Brief title"></div>
    <div class="form-group"><label>Category</label><select><option>OSINT</option><option>Media</option><option>Open Source</option><option>General</option></select></div>
    <div class="form-group"><label>Zone / Area</label><input placeholder="Affected zone"></div>
    <div class="form-group"><label>Date</label><input type="date"></div>
    <div class="form-group"><label>Reported By</label><input placeholder="Your name"></div>
    <div class="form-group form-full"><label>Summary</label><textarea placeholder="Information summary..."></textarea></div>
    <div class="form-group form-full"><label>Sources / References</label><textarea placeholder="Sources, links, refs (classified handling)..."></textarea></div>
  </div>
  <div class="form-actions"><button class="btn btn-outline" type="button" onclick="closeModal()">Cancel</button><button class="btn btn-primary" type="button">➕ Add Info Report</button></div>`,

  addPors: `<div class="form-grid">
    <div class="form-group"><label>PORS Title</label><input placeholder="Patrol / observation title"></div>
    <div class="form-group"><label>Sector / Grid</label><input placeholder="Grid ref or sector code"></div>
    <div class="form-group"><label>Zone / Area</label><input placeholder="Area of observation"></div>
    <div class="form-group"><label>Date & Time</label><input type="datetime-local"></div>
    <div class="form-group"><label>Submitted By</label><input placeholder="Rank / Name"></div>
    <div class="form-group"><label>Classification</label><select><option>Unclassified</option><option>Restricted</option><option>Confidential</option></select></div>
    <div class="form-group form-full"><label>Observations</label><textarea placeholder="Patrol observations, contacts, terrain..."></textarea></div>
  </div>
  <div class="form-actions"><button class="btn btn-outline" type="button" onclick="closeModal()">Cancel</button><button class="btn btn-primary" type="button">➕ Add PORS Report</button></div>`,

  addCmd: `<div class="form-grid">
    <div class="form-group"><label>Name S/O</label><input placeholder="Commander full name"></div>
    <div class="form-group"><label>Alias</label><input placeholder="Known alias"></div>
    <div class="form-group"><label>Tashkeel / Group</label><input placeholder="Affiliated group"></div>
    <div class="form-group"><label>Area</label><input placeholder="Last known area"></div>
    <div class="form-group"><label>CNIC</label><input placeholder="XXXXX-XXXXXXX-X"></div>
    <div class="form-group"><label>Head Money (PKR)</label><input placeholder="Amount"></div>
    <div class="form-group"><label>Case Officer</label><input placeholder="Assigned officer"></div>
    <div class="form-group"><label>Status</label><select><option>Active</option><option>Eliminated</option><option>Arrested</option><option>SSG</option><option>SST</option><option>Tech/Cyber</option><option>Ariel</option><option>Matured</option><option>Developing</option></select></div>
    <div class="form-group form-full"><label>Intel Notes</label><textarea placeholder="Background, networks, activities..."></textarea></div>
  </div>
  <div class="form-actions"><button class="btn btn-outline" type="button" onclick="closeModal()">Cancel</button><button class="btn btn-primary" type="button">💾 Save</button></div>`,

  addOperator: `${OPERATIONS_ENTRY_FORM}
  <div class="form-actions"><button class="btn btn-outline" type="button" onclick="closeModal()">Cancel</button><button class="btn btn-primary" type="button">💾 Add Operator</button></div>`,
};

document.getElementById("modal")?.addEventListener("click", function (e) {
  if (e.target === this) closeModal();
});

/** Threat response page — status boxes + soldier rows (swap THREAT_RESPONSE_RECORDS for API / DB later). */
const THREAT_RESPONSE_RECORDS = [
  { id: "TR-001", sr: "S-101", name: "Ahmad S/O Karim", alias: "Shadow", tashkeel: "TTP-X", area: "N. Waziristan", hm: "25L", lastSeen: "28 Mar", officer: "Maj. Hamza", status: "active" },
  { id: "TR-002", sr: "S-102", name: "Hassan S/O Tariq", alias: "Iron Fist", tashkeel: "JuA", area: "KPK", hm: "15L", lastSeen: "27 Mar", officer: "Capt. Faseeh", status: "arrested" },
  { id: "TR-003", sr: "S-103", name: "Zubair S/O Saleem", alias: "Ghost", tashkeel: "LeT", area: "FATA", hm: "30L", lastSeen: "20 Feb", officer: "Maj. Rafay", status: "eliminated" },
  { id: "TR-004", sr: "S-104", name: "Imran S/O Nadeem", alias: "Viper", tashkeel: "TTP", area: "Khyber", hm: "—", lastSeen: "Op Thunder", officer: "Capt. Bilal", status: "ssg" },
  { id: "TR-005", sr: "S-105", name: "Tariq S/O Jamil", alias: "Hawk", tashkeel: "JuA", area: "Orakzai", hm: "12L", lastSeen: "25 Mar", officer: "Maj. Hamza", status: "sst" },
  { id: "TR-006", sr: "S-106", name: "Faisal S/O Aslam", alias: "Cipher", tashkeel: "—", area: "Zone-7", hm: "—", lastSeen: "29 Mar", officer: "Capt. Rafay", status: "tech_cyber" },
  { id: "TR-007", sr: "S-107", name: "Noman S/O Iqbal", alias: "Sky", tashkeel: "TTP-X", area: "Bajaur", hm: "18L", lastSeen: "26 Mar", officer: "Maj. Faseeh", status: "ariel" },
  { id: "TR-008", sr: "S-108", name: "Waseem S/O Khalid", alias: "Rust", tashkeel: "LeT", area: "Swat", hm: "8L", lastSeen: "15 Mar", officer: "Capt. Bilal", status: "matured" },
  { id: "TR-009", sr: "S-109", name: "Sohail S/O Majid", alias: "Nova", tashkeel: "TTP", area: "Kurram", hm: "—", lastSeen: "01 Apr", officer: "Maj. Hamza", status: "developing" },
  { id: "TR-010", sr: "S-110", name: "Bilal S/O Farooq", alias: "Wolf", tashkeel: "JuA", area: "Mohmand", hm: "22L", lastSeen: "30 Mar", officer: "Capt. Faseeh", status: "active" },
  { id: "TR-011", sr: "S-111", name: "Usman S/O Rashid", alias: "Storm", tashkeel: "TTP-X", area: "N. Waziristan", hm: "—", lastSeen: "22 Mar", officer: "Maj. Rafay", status: "arrested" },
  { id: "TR-012", sr: "S-112", name: "Kamran S/O Saeed", alias: "Edge", tashkeel: "LeT", area: "FATA", hm: "35L", lastSeen: "18 Mar", officer: "Maj. Faseeh", status: "ssg" },
];

const THREAT_STATUS_LABEL = {
  eliminated: "Eliminated",
  arrested: "Arrested",
  active: "Active",
  ssg: "SSG",
  sst: "SST",
  tech_cyber: "Tech/Cyber",
  ariel: "Ariel",
  matured: "Matured",
  developing: "Developing",
};

let __threatResponseFilter = "all";

function threatResponseTagClass(status) {
  const map = {
    eliminated: "tr-tag tr-tag--eliminated",
    arrested: "tr-tag tr-tag--arrested",
    active: "tr-tag tr-tag--active",
    ssg: "tr-tag tr-tag--ssg",
    sst: "tr-tag tr-tag--sst",
    tech_cyber: "tr-tag tr-tag--tech",
    ariel: "tr-tag tr-tag--ariel",
    matured: "tr-tag tr-tag--matured",
    developing: "tr-tag tr-tag--developing",
  };
  return map[status] || "tr-tag";
}

function threatResponseSetFilter(key) {
  __threatResponseFilter = key;
  document.querySelectorAll("#threat-status-grid .tr-status-box").forEach((btn) => {
    const on = btn.getAttribute("data-tr-status") === key;
    btn.classList.toggle("is-active", on);
    btn.setAttribute("aria-pressed", on ? "true" : "false");
  });
  const cap = document.getElementById("threat-response-table-title");
  if (cap) {
    cap.textContent =
      key === "all"
        ? "All records"
        : `Records · ${THREAT_STATUS_LABEL[key] || key}`;
  }
  threatResponseRenderTable();
}

function threatResponseRenderTable() {
  const tbody = document.getElementById("threat-response-tbody");
  if (!tbody) return;
  const rows = THREAT_RESPONSE_RECORDS.filter(
    (r) => __threatResponseFilter === "all" || r.status === __threatResponseFilter
  );
  tbody.innerHTML = rows
    .map((r) => {
      const idArg = JSON.stringify(r.id);
      const lab = THREAT_STATUS_LABEL[r.status] || r.status;
      const tagCls = threatResponseTagClass(r.status);
      return `<tr data-threat-id="${escapeHtml(r.id)}">
    <td>${escapeHtml(r.sr)}</td>
    <td><strong>${escapeHtml(r.name)}</strong></td>
    <td><span class="tag tag-orange">${escapeHtml(r.alias)}</span></td>
    <td>${escapeHtml(r.tashkeel)}</td>
    <td>${escapeHtml(r.area)}</td>
    <td style="color:var(--red);font-weight:800;">${escapeHtml(r.hm)}</td>
    <td>${escapeHtml(r.lastSeen)}</td>
    <td>${escapeHtml(r.officer)}</td>
    <td><span class="${tagCls}">${escapeHtml(lab)}</span></td>
    <td><button type="button" class="btn btn-outline btn-sm" onclick="openThreatResponseDetail(${idArg})">Details</button></td>
  </tr>`;
    })
    .join("");
  if (rows.length === 0) {
    tbody.innerHTML = `<tr><td colspan="10" style="text-align:center;color:#888;padding:20px;">No records for this status. Connect your database to populate live data.</td></tr>`;
  }
}

function openThreatResponseDetail(recordId) {
  const r = THREAT_RESPONSE_RECORDS.find((x) => x.id === recordId);
  if (!r) return;
  const overlay = document.getElementById("modal");
  const titleEl = document.getElementById("modal-title");
  const bodyEl = document.getElementById("modal-body");
  const modalBox = overlay?.querySelector(".modal");
  if (!overlay || !titleEl || !bodyEl || !modalBox) return;
  modalBox.classList.remove("modal-personnel");
  modalBox.classList.add("modal-report-detail");
  titleEl.classList.remove("modal-title--personnel");
  titleEl.textContent = `Threat response · ${r.sr}`;
  const lab = THREAT_STATUS_LABEL[r.status] || r.status;
  const tagCls = threatResponseTagClass(r.status);
  bodyEl.innerHTML = `
<div class="profile-fields report-detail-fields">
  <div class="pf-item"><div class="pf-label">Serial</div><div class="pf-val">${escapeHtml(r.sr)}</div></div>
  <div class="pf-item"><div class="pf-label">Name S/O</div><div class="pf-val">${escapeHtml(r.name)}</div></div>
  <div class="pf-item"><div class="pf-label">Alias</div><div class="pf-val">${escapeHtml(r.alias)}</div></div>
  <div class="pf-item"><div class="pf-label">Tashkeel</div><div class="pf-val">${escapeHtml(r.tashkeel)}</div></div>
  <div class="pf-item"><div class="pf-label">Area</div><div class="pf-val">${escapeHtml(r.area)}</div></div>
  <div class="pf-item"><div class="pf-label">HM (PKR)</div><div class="pf-val">${escapeHtml(r.hm)}</div></div>
  <div class="pf-item"><div class="pf-label">Last seen</div><div class="pf-val">${escapeHtml(r.lastSeen)}</div></div>
  <div class="pf-item"><div class="pf-label">Case officer</div><div class="pf-val">${escapeHtml(r.officer)}</div></div>
  <div class="pf-item"><div class="pf-label">Status</div><div class="pf-val"><span class="${tagCls}">${escapeHtml(lab)}</span></div></div>
  <div class="pf-item pf-item--wide"><div class="pf-label">Record ID</div><div class="pf-val">${escapeHtml(r.id)}</div></div>
</div>
<div class="form-actions report-detail-actions">
  <button type="button" class="btn btn-outline btn-sm" onclick="closeModal()">Close</button>
</div>`;
  overlay.classList.add("open");
}

const aiResponses = {
  "zone-7":
    "🔍 <strong>Zone-7 Threat Assessment:</strong><br>• IED activity HIGH – 3 incidents this week<br>• CDR spike detected Mar 27<br>• <strong style=\"color:var(--red);\">Recommend: Increase patrol frequency</strong><br><em style=\"font-size:.68rem;color:#888;\">AI Confidence: 87%</em>",
  cdr: "📡 <strong>CDR Pattern – Target Alpha:</strong><br>• 347 calls, 12 unique contacts<br>• Peak hours: 21:00–23:00",
  incident: "📋 <strong>Incident Summary:</strong><br>• 3 incidents filed this week<br>• Zone-7 most active",
  default:
    "🤖 Based on current records, review Zone-7 CDR patterns and cross-reference with active incident reports.",
};

function sendMsg() {
  const inp = document.getElementById("chatIn");
  const box = document.getElementById("chatBox");
  if (!inp || !box) return;
  const msg = inp.value.trim();
  if (!msg) return;
  box.innerHTML += `<div class="msg user">${escapeHtml(msg)}</div>`;
  inp.value = "";
  const k = msg.toLowerCase().includes("zone")
    ? "zone-7"
    : msg.toLowerCase().includes("cdr")
      ? "cdr"
      : msg.toLowerCase().includes("incident")
        ? "incident"
        : "default";
  setTimeout(() => {
    box.innerHTML += `<div class="msg bot">${aiResponses[k]}</div>`;
    box.scrollTop = box.scrollHeight;
  }, 500);
  box.scrollTop = box.scrollHeight;
}

function escapeHtml(s) {
  const d = document.createElement("div");
  d.textContent = s;
  return d.innerHTML;
}

function addAIMsg(t) {
  const inp = document.getElementById("chatIn");
  if (inp) {
    inp.value = t;
    sendMsg();
  }
}

document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("threat-response-tbody")) threatResponseRenderTable();
  renderAllThreatReportTables();
});
