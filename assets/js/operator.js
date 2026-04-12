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
  if (id === "database") renderTashkeelOfficersTable();
  if (id === "commanders") threatResponseRenderTable();
  if (id === "threats") renderAllThreatReportTables();
  if (id === "incidents") {
    const activeBtn = document.querySelector("#p-incidents .report-type-btn.active");
    const t = activeBtn?.getAttribute("data-report-type") || "incident";
    updateReportsTableHeaderForCategory(t);
  }
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
    box?.classList.remove("modal-member-record");
    document.getElementById("modal-title")?.classList.remove("modal-title--personnel");
  }
}

const PR_ATTACHMENT_ACCEPT =
  ".pdf,.doc,.docx,.kvc,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

function prStripDigits(s) {
  return String(s || "").replace(/\D/g, "");
}

function prFormatCnicInput(val) {
  const d = prStripDigits(val).slice(0, 13);
  if (d.length <= 5) return d;
  if (d.length <= 12) return `${d.slice(0, 5)}-${d.slice(5)}`;
  return `${d.slice(0, 5)}-${d.slice(5, 12)}-${d.slice(12, 13)}`;
}

function prFormCnicInput(el) {
  if (!el) return;
  const fmt = prFormatCnicInput(el.value);
  if (fmt !== el.value) el.value = fmt;
}

function prFormatCellInput(val) {
  const d = prStripDigits(val).slice(0, 11);
  if (d.length <= 4) return d;
  return `${d.slice(0, 4)}-${d.slice(4)}`;
}

function prFormCellInput(el) {
  if (!el) return;
  const fmt = prFormatCellInput(el.value);
  if (fmt !== el.value) el.value = fmt;
}

function prFormAgeInput(el) {
  if (!el) return;
  el.value = prStripDigits(el.value).slice(0, 3);
}

function prCnicIsValid(s) {
  return /^\d{5}-\d{7}-\d{1}$/.test(String(s || "").trim());
}

function prCellIsValid(s) {
  return /^\d{4}-\d{7}$/.test(String(s || "").trim());
}

function prAgeIsValid(s) {
  const t = String(s || "").trim();
  if (!t) return true;
  return /^\d{1,3}$/.test(t);
}

function prAttachmentFileAllowed(file) {
  if (!file || !file.name) return false;
  if (/\.(pdf|doc|docx|kvc)$/i.test(file.name)) return true;
  const t = (file.type || "").toLowerCase();
  return (
    t === "application/pdf" ||
    t === "application/msword" ||
    t === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  );
}

function prParseAttachmentsJson(form) {
  const el = form?.elements?.namedItem("pr_attachments_json");
  if (!el || !("value" in el)) return [];
  try {
    const arr = JSON.parse(String(el.value || "[]"));
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function personnelAttachmentsRenderList(form) {
  const stash = form?.elements?.namedItem("pr_attachments_json");
  const wrap = form?.querySelector(".pr-attachments-list-display");
  if (!stash || !wrap) return;
  let list = [];
  try {
    list = JSON.parse(String(stash.value || "[]"));
  } catch {
    list = [];
  }
  if (!list.length) {
    wrap.innerHTML = `<p class="report-files-empty" style="margin:0;">No files yet.</p>`;
    return;
  }
  wrap.innerHTML = list
    .map(
      (f, i) =>
        `<div class="report-file-row pr-attachment-row">
      <div class="report-file-meta">
        <span class="report-file-name">${escapeHtml(f.name || "file")}</span>
        <span class="report-file-info">${f.size ? escapeHtml(`${Math.max(1, Math.round(f.size / 1024))} KB`) : ""}</span>
      </div>
      <button type="button" class="btn btn-outline btn-sm" data-pr-att-remove="${i}" onclick="personnelAttachmentRemoveRow(this)">Remove</button>
    </div>`
    )
    .join("");
}

function personnelAttachmentRemoveRow(btn) {
  const form = btn.closest("form");
  if (!form) return;
  const stash = form.elements.namedItem("pr_attachments_json");
  if (!stash) return;
  const idx = parseInt(btn.getAttribute("data-pr-att-remove") || "-1", 10);
  let list = [];
  try {
    list = JSON.parse(String(stash.value || "[]"));
  } catch {
    list = [];
  }
  if (!Array.isArray(list) || idx < 0 || idx >= list.length) return;
  list.splice(idx, 1);
  stash.value = JSON.stringify(list);
  personnelAttachmentsRenderList(form);
}

function personnelAttachmentsLoadFromArray(form, attachments) {
  const stash = form?.elements?.namedItem("pr_attachments_json");
  if (!stash) return;
  const safe = Array.isArray(attachments)
    ? attachments.map((a) => ({
        id: a.id || "att-" + Math.random().toString(36).slice(2, 10),
        name: a.name || "file",
        type: a.type || "",
        dataUrl: a.dataUrl || "",
        size: a.size || 0,
      }))
    : [];
  stash.value = JSON.stringify(safe);
  personnelAttachmentsRenderList(form);
}

function personnelAttachmentsOnPick(ev) {
  const input = ev.target;
  const form = input.form;
  if (!form || !input.files?.length) return;
  const stash = form.elements.namedItem("pr_attachments_json");
  if (!stash) return;
  let list = [];
  try {
    list = JSON.parse(String(stash.value || "[]"));
  } catch {
    list = [];
  }
  const files = Array.from(input.files);
  const toRead = files.filter((f) => {
    if (prAttachmentFileAllowed(f)) return true;
    alert(`File type not allowed: ${f.name}\nUse PDF, Word (.doc, .docx), or .kvc only.`);
    return false;
  });
  input.value = "";
  if (!toRead.length) return;
  Promise.all(
    toRead.map(
      (f) =>
        new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () =>
            resolve({
              id: "att-" + Date.now() + "-" + Math.random().toString(36).slice(2, 9),
              name: f.name,
              type: f.type || "",
              dataUrl: String(reader.result),
              size: f.size,
            });
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(f);
        })
    )
  )
    .then((arr) => {
      list.push(...arr);
      stash.value = JSON.stringify(list);
      personnelAttachmentsRenderList(form);
    })
    .catch(() => {});
}

function validatePersonnelCnicCellAge(form) {
  const gv = (name) => {
    const el = form.elements.namedItem(name);
    return el && "value" in el ? String(el.value).trim() : "";
  };
  if (!prCnicIsValid(gv("f_cnic"))) {
    alert("CNIC must be exactly 13 digits in the format #####-#######-#.");
    return false;
  }
  if (!prCellIsValid(gv("f_cell"))) {
    alert("Cell # / IMEI must be 11 digits in the format ####-#######.");
    return false;
  }
  if (!prAgeIsValid(gv("f_age"))) {
    alert("Age must contain digits only (up to 3 digits).");
    return false;
  }
  return true;
}

const TASHKEEL_COMMANDER_OPTIONS = [
  "Maj. Faseeh",
  "Capt. Hamza",
  "Capt. Rafay",
  "Maj. Bilal",
];

function getCommanderSelectOptions(selectedLabel) {
  const cur = (selectedLabel || "").trim();
  return TASHKEEL_COMMANDER_OPTIONS.map(
    (name) => `<option value="${escapeHtml(name)}"${cur === name ? " selected" : ""}>${escapeHtml(name)}</option>`
  ).join("");
}

function tashkeelValueForCommanderKey(commanderKey) {
  const k = String(commanderKey || "").trim();
  if (!k) return "";
  const off = TASHKEEL_OFFICERS.find((o) => String(o.commanderKey || "").trim() === k);
  return off && off.tashkeel != null ? String(off.tashkeel).trim() : "";
}

function syncMemberTashkeelFromCommander(form) {
  if (!form) return;
  const sel = form.elements.namedItem("assigned_commander");
  const tashInput = form.elements.namedItem("f_tashkeel");
  if (!tashInput) return;
  const key = sel && "value" in sel ? String(sel.value || "").trim() : "";
  tashInput.value = tashkeelValueForCommanderKey(key);
}

/** Database table: Tashkeel officers (commander profiles). `commanderKey` links to member `assignedCommander`. */
let TASHKEEL_OFFICERS = [
  {
    id: "TO-001",
    sr: "001",
    commanderKey: "Capt. Hamza",
    nameStrong: "Hamza Ali",
    nameSon: "S/O Rizwan Khan",
    alias: "—",
    cnic: "42101-XXXXXXX-X",
    cell: "0300-XXXXXXX",
    area: "Zone 6: Dera Ismail Khan",
    tashkeel: "Lashkar-e-X",
    status: "Active",
    photoUrl: "",
    details: "",
    dob: "",
    age: "",
    caste: "Caste",
    marital: "Single",
    hm: "PKR amount",
    banking: "Bank/IBAN",
    smns: "FB/TG/WA handles",
    firs: "FIR numbers",
    tsActivities: "Activities involved",
    familyTree: "Family details",
    areaActive: "Active areas",
    gp: "GP number",
    yearsActive: "Years",
    position: "Role/Position",
    misc: "Misc info",
    remarks: "Remarks",
    dateUpdated: "",
    attachments: [],
  },
  {
    id: "TO-002",
    sr: "002",
    commanderKey: "Maj. Faseeh",
    nameStrong: "Faseeh Ahmad",
    nameSon: "S/O Tariq Mehmood",
    alias: "Falcon",
    cnic: "35202-XXXXXXX-X",
    cell: "0312-XXXXXXX",
    area: "Zone 3: Daraban",
    tashkeel: "JuA",
    status: "Active",
    photoUrl: "",
    details: "",
    dob: "",
    age: "",
    caste: "",
    marital: "Single",
    hm: "",
    banking: "",
    smns: "",
    firs: "",
    tsActivities: "",
    familyTree: "",
    areaActive: "",
    gp: "",
    yearsActive: "",
    position: "",
    misc: "",
    remarks: "",
    dateUpdated: "",
    attachments: [],
  },
  {
    id: "TO-003",
    sr: "003",
    commanderKey: "Capt. Rafay",
    nameStrong: "Rafay Siddiqui",
    nameSon: "S/O Nadeem Siddiqui",
    alias: "—",
    cnic: "21304-XXXXXXX-X",
    cell: "0344-XXXXXXX",
    area: "Zone 6: Dera Ismail Khan",
    tashkeel: "TTP-X",
    status: "Tech/Cyber OPS",
    photoUrl: "",
    details: "",
    dob: "",
    age: "",
    caste: "",
    marital: "Single",
    hm: "",
    banking: "",
    smns: "",
    firs: "",
    tsActivities: "",
    familyTree: "",
    areaActive: "",
    gp: "",
    yearsActive: "",
    position: "",
    misc: "",
    remarks: "",
    dateUpdated: "",
    attachments: [],
  },
  {
    id: "TO-004",
    sr: "004",
    commanderKey: "Maj. Bilal",
    nameStrong: "Bilal Khan",
    nameSon: "S/O Jamil Khan",
    alias: "Wolf",
    cnic: "54400-XXXXXXX-X",
    cell: "0321-XXXXXXX",
    area: "Zone 2: Kulachi",
    tashkeel: "LeT",
    status: "Active",
    photoUrl: "",
    details: "",
    dob: "",
    age: "",
    caste: "",
    marital: "Single",
    hm: "",
    banking: "",
    smns: "",
    firs: "",
    tsActivities: "",
    familyTree: "",
    areaActive: "",
    gp: "",
    yearsActive: "",
    position: "",
    misc: "",
    remarks: "",
    dateUpdated: "",
    attachments: [],
  },
];

/** Members assigned to a commander via `commanderKey` (same string as Assigned Commander dropdown). */
let TASHKEEL_MEMBERS = [
  {
    id: "TM-001",
    sr: "M-101",
    commanderKey: "Capt. Hamza",
    nameStrong: "Ahmad Karim",
    nameSon: "S/O Karimullah",
    alias: "Shadow",
    cnic: "42105-XXXXXXX-X",
    cell: "0301-XXXXXXX",
    area: "Zone 6: Dera Ismail Khan",
    tashkeel: "LeT-X",
    status: "Active",
    photoUrl: "",
    details: "",
    caseOfficer: "Capt. Hamza",
    dob: "",
    age: "",
    caste: "",
    marital: "Single",
    hm: "PKR amount",
    banking: "Bank/IBAN",
    smns: "FB/TG/WA handles",
    firs: "FIR numbers",
    tsActivities: "Activities involved",
    familyTree: "Family details",
    areaActive: "Active areas",
    gp: "GP number",
    yearsActive: "Years",
    position: "Role/Position",
    misc: "Misc info",
    remarks: "Remarks",
    dateUpdated: "",
    attachments: [],
  },
  {
    id: "TM-002",
    sr: "M-102",
    commanderKey: "Capt. Hamza",
    nameStrong: "Tariq Noman",
    nameSon: "S/O Noman Shah",
    alias: "Rust",
    cnic: "42106-XXXXXXX-X",
    cell: "0302-XXXXXXX",
    area: "Zone 1: Paharpur",
    tashkeel: "TTP",
    status: "Arrested",
    photoUrl: "",
    details: "",
    caseOfficer: "Maj. Faseeh",
    dob: "",
    age: "",
    caste: "",
    marital: "Single",
    hm: "",
    banking: "",
    smns: "",
    firs: "",
    tsActivities: "",
    familyTree: "",
    areaActive: "",
    gp: "",
    yearsActive: "",
    position: "",
    misc: "",
    remarks: "",
    dateUpdated: "",
    attachments: [],
  },
  {
    id: "TM-003",
    sr: "M-201",
    commanderKey: "Maj. Faseeh",
    nameStrong: "Hassan Gul",
    nameSon: "S/O Gul Sher",
    alias: "Iron",
    cnic: "15301-XXXXXXX-X",
    cell: "0333-XXXXXXX",
    area: "Zone 4: Drazanda",
    tashkeel: "JuA",
    status: "Active",
    photoUrl: "",
    details: "",
    caseOfficer: "Capt. Rafay",
    dob: "",
    age: "",
    caste: "",
    marital: "Single",
    hm: "",
    banking: "",
    smns: "",
    firs: "",
    tsActivities: "",
    familyTree: "",
    areaActive: "",
    gp: "",
    yearsActive: "",
    position: "",
    misc: "",
    remarks: "",
    dateUpdated: "",
    attachments: [],
  },
  {
    id: "TM-004",
    sr: "M-301",
    commanderKey: "Capt. Rafay",
    nameStrong: "Imran Wali",
    nameSon: "S/O Wali Muhammad",
    alias: "Viper",
    cnic: "21308-XXXXXXX-X",
    cell: "0345-XXXXXXX",
    area: "Zone 5: Paroa",
    tashkeel: "TTP-X",
    status: "Developing OPS",
    photoUrl: "",
    details: "",
    caseOfficer: "Maj. Faseeh",
    dob: "",
    age: "",
    caste: "",
    marital: "Single",
    hm: "",
    banking: "",
    smns: "",
    firs: "",
    tsActivities: "",
    familyTree: "",
    areaActive: "",
    gp: "",
    yearsActive: "",
    position: "",
    misc: "",
    remarks: "",
    dateUpdated: "",
    attachments: [],
  },
];

/** When viewing the members sub-page under Database. */
let __dbMembersContext = { officerId: null, commanderKey: "" };

function memberRecordFieldDefaults() {
  return {
    dob: "",
    age: "",
    caste: "",
    marital: "Single",
    hm: "",
    banking: "",
    smns: "",
    firs: "",
    tsActivities: "",
    familyTree: "",
    areaActive: "",
    gp: "",
    yearsActive: "",
    position: "",
    misc: "",
    remarks: "",
    dateUpdated: "",
    attachments: [],
  };
}

function normalizeTashkeelMember(m) {
  if (!m) return null;
  const d = memberRecordFieldDefaults();
  const att = Array.isArray(m.attachments) ? m.attachments : [];
  return { ...d, ...m, attachments: att };
}

function normalizeTashkeelOfficer(o) {
  if (!o) return null;
  const d = memberRecordFieldDefaults();
  const att = Array.isArray(o.attachments) ? o.attachments : [];
  return { ...d, ...o, attachments: att };
}

function formatMemberDateDisplay(iso) {
  const s = String(iso || "").trim();
  if (!s) return "dd/mm/yyyy";
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [y, mo, d] = s.split("-");
    return `${d}/${mo}/${y}`;
  }
  return s;
}

function dbOfficerAvatarInner(o) {
  if (o.photoUrl && String(o.photoUrl).trim()) {
    return `<img src="${escapeHtml(o.photoUrl)}" alt="" />`;
  }
  const parts = String(o.nameStrong || "?")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const ini = (parts[0]?.[0] || "?") + (parts[1]?.[0] || "");
  return escapeHtml(ini.toUpperCase());
}

function tashkeelStatusToTag(status) {
  const t = String(status || "").trim();
  const lower = t.toLowerCase();
  const cls =
    lower === "active"
      ? "tag-red"
      : lower === "arrested"
        ? "tag-green"
        : lower === "eliminated"
          ? "tag-orange"
          : lower === "ssg ops" || lower === "ssg"
            ? "tag-purple"
            : lower === "sst ops" || lower === "sst"
              ? "tag-blue"
              : lower === "tech/cyber ops" || lower === "tech/cyber"
                ? "tag-teal"
                : lower === "arial ops" || lower === "arial"
                  ? "tag-blue"
                  : lower === "matured ops" || lower === "matured"
                    ? "tag-green"
                    : lower === "developing ops" || lower === "developing"
                      ? "tag-orange"
                      : "tag-teal";
  return `<span class="tag ${cls}">${escapeHtml(t)}</span>`;
}

function renderTashkeelOfficersTable() {
  const tbody = document.getElementById("tashkeel-officers-tbody");
  if (!tbody) return;
  tbody.innerHTML = TASHKEEL_OFFICERS.map((o) => {
    const idArg = JSON.stringify(o.id);
    const aliasCell =
      o.alias && o.alias !== "—"
        ? `<span class="tag tag-orange">${escapeHtml(o.alias)}</span>`
        : `<span style="color:#aaa;">—</span>`;
    return `<tr data-officer-id="${escapeHtml(o.id)}">
      <td class="db-sr-photo-cell">
        <div class="db-officer-avatar" aria-hidden="true">${dbOfficerAvatarInner(o)}</div>
        <span>${escapeHtml(o.sr)}</span>
      </td>
      <td><strong>${escapeHtml(o.nameStrong)}</strong><br><span style="font-size:.65rem;color:#888;">${escapeHtml(o.nameSon)}</span></td>
      <td>${aliasCell}</td>
      <td>${escapeHtml(o.cnic)}</td>
      <td>${escapeHtml(o.cell)}</td>
      <td>${escapeHtml(o.area)}</td>
      <td>${escapeHtml(o.tashkeel)}</td>
      <td>${tashkeelStatusToTag(o.status)}</td>
      <td class="db-officer-actions" onclick="event.stopPropagation();">
        <div class="db-officer-action-btns">
          <button type="button" class="btn btn-outline btn-sm" onclick='openCommanderProfileView(${idArg})'>View profile</button>
          <button type="button" class="btn btn-primary btn-sm" onclick='openCommanderEditProfile(${idArg})'>Edit Profile</button>
          <button type="button" class="btn btn-outline btn-sm" onclick='showTashkeelMembersPage(${idArg})'>View members</button>
        </div>
      </td>
    </tr>`;
  }).join("");
}

function getAddDataTypeChooserHtml() {
  return `
<div class="form-grid">
  <div class="form-group form-full">
    <label>Choose record type</label>
    <p style="margin:6px 0 12px;color:#777;font-size:.78rem;">Select what you want to add to the Tashkeel database.</p>
  </div>
</div>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
  <button type="button" class="btn btn-primary" style="padding:16px 12px;font-size:.86rem;" onclick="openAddDataForm('commander')">🛡️ Tashkeel Commander</button>
  <button type="button" class="btn btn-outline" style="padding:16px 12px;font-size:.86rem;" onclick="openAddDataForm('member')">👤 Tashkeel Member</button>
</div>
<div class="form-actions" style="margin-top:14px;">
  <button class="btn btn-outline" type="button" onclick="closeModal()">Cancel</button>
</div>`;
}

function openAddDataForm(recordType, preset) {
  const p = preset && typeof preset === "object" ? preset : {};
  const titleEl = document.getElementById("modal-title");
  const bodyEl = document.getElementById("modal-body");
  const modalBox = document.getElementById("modal")?.querySelector(".modal");
  if (!titleEl || !bodyEl || !modalBox) return;
  const safeType = recordType === "commander" ? "commander" : "member";
  const typeLabel = safeType === "commander" ? "Commander" : "Member";
  modalBox.classList.remove("modal-report-detail");
  modalBox.classList.add("modal-personnel");
  titleEl.classList.add("modal-title--personnel");
  titleEl.textContent = `💾 ADD DATA • Tashkeel ${typeLabel}`;
  const autoSr = safeType === "commander" ? nextTashkeelOfficerSr() : nextTashkeelMemberSr();
  let merged = { ...p, sr: String(p.sr != null && String(p.sr).trim() !== "" ? p.sr : autoSr) };
  if (safeType === "member") {
    const cmd = String(p.assignedCommander || "").trim();
    if (cmd) merged.tashkeel = tashkeelValueForCommanderKey(cmd);
  }
  bodyEl.innerHTML = `<form id="tashkeel-add-form" onsubmit="event.preventDefault(); submitAddDataForm('${safeType}');">
${getPersonnelRecordFormHtml(safeType, merged, { includeFooter: false, autoSerialReadonly: true })}
<div class="personnel-footer">
  <button type="button" class="btn-cancel" onclick="closeModal()">Cancel</button>
  <button type="submit" class="btn-save"><span aria-hidden="true">💾</span> Save Record</button>
</div>
</form>`;
  const addForm = document.getElementById("tashkeel-add-form");
  if (addForm) personnelAttachmentsLoadFromArray(addForm, []);
  if (addForm && safeType === "member") syncMemberTashkeelFromCommander(addForm);
  document.getElementById("modal")?.classList.add("open");
}

function openAddMemberForCurrentCommander() {
  const k = __dbMembersContext.commanderKey;
  if (!k) return;
  openAddDataForm("member", { assignedCommander: k });
  const titleEl = document.getElementById("modal-title");
  if (titleEl) titleEl.textContent = `💾 ADD MEMBER · ${k}`;
}

function nextTashkeelOfficerId() {
  let max = 0;
  TASHKEEL_OFFICERS.forEach((o) => {
    const n = parseInt(String(o.id || "").replace("TO-", ""), 10);
    if (!Number.isNaN(n) && n > max) max = n;
  });
  return "TO-" + String(max + 1).padStart(3, "0");
}

function nextTashkeelOfficerSr() {
  let max = 0;
  TASHKEEL_OFFICERS.forEach((o) => {
    const n = parseInt(String(o.sr || "").replace(/\D/g, ""), 10);
    if (!Number.isNaN(n) && n > max) max = n;
  });
  return String(max + 1);
}

function nextTashkeelMemberSr() {
  let max = 0;
  TASHKEEL_MEMBERS.forEach((m) => {
    const n = parseInt(String(m.sr || "").replace(/\D/g, ""), 10);
    if (!Number.isNaN(n) && n > max) max = n;
  });
  return String(max + 1);
}

function nextTashkeelMemberId() {
  let max = 0;
  TASHKEEL_MEMBERS.forEach((m) => {
    const n = parseInt(String(m.id || "").replace("TM-", ""), 10);
    if (!Number.isNaN(n) && n > max) max = n;
  });
  return "TM-" + String(max + 1).padStart(3, "0");
}

function submitAddDataForm(recordType) {
  const safeType = recordType === "commander" ? "commander" : "member";
  const form = document.getElementById("tashkeel-add-form");
  if (!form) return;
  if (!validatePersonnelCnicCellAge(form)) return;
  const gv = (name) => {
    const el = form.elements.namedItem(name);
    return el && "value" in el ? String(el.value).trim() : "";
  };
  const attachments = prParseAttachmentsJson(form);

  if (safeType === "commander") {
    const dCmd = memberRecordFieldDefaults();
    const commanderName = gv("f_name_strong") || "Unnamed Commander";
    const newOfficer = {
      id: nextTashkeelOfficerId(),
      sr: gv("f_sr") || nextTashkeelOfficerSr(),
      commanderKey: commanderName,
      nameStrong: commanderName,
      nameSon: gv("f_name_sub"),
      alias: gv("f_alias") || "—",
      cnic: gv("f_cnic"),
      cell: gv("f_cell"),
      area: gv("f_area"),
      tashkeel: gv("f_tashkeel"),
      status: gv("f_status") || "Active",
      photoUrl: gv("f_photo_url") || "",
      details: gv("f_details"),
      dob: gv("dob"),
      age: gv("f_age"),
      caste: gv("f_caste"),
      marital: gv("f_marital") || dCmd.marital,
      hm: gv("f_hm"),
      banking: gv("f_banking"),
      smns: gv("f_smns"),
      firs: gv("f_firs"),
      tsActivities: gv("f_ts"),
      familyTree: gv("f_family"),
      areaActive: gv("f_area_active"),
      gp: gv("f_gp"),
      yearsActive: gv("f_years"),
      position: gv("f_position"),
      misc: gv("f_misc"),
      remarks: gv("f_remarks"),
      dateUpdated: gv("date_updated"),
      attachments,
    };
    TASHKEEL_OFFICERS.push(newOfficer);
    if (!TASHKEEL_COMMANDER_OPTIONS.includes(newOfficer.commanderKey)) {
      TASHKEEL_COMMANDER_OPTIONS.push(newOfficer.commanderKey);
    }
    closeModal();
    renderTashkeelOfficersTable();
    return;
  }

  const memberId = nextTashkeelMemberId();
  const assignedCommander = gv("assigned_commander");
  const dNew = memberRecordFieldDefaults();
  const memberTashkeel = tashkeelValueForCommanderKey(assignedCommander) || gv("f_tashkeel");
  TASHKEEL_MEMBERS.push({
    id: memberId,
    sr: gv("f_sr") || nextTashkeelMemberSr(),
    commanderKey: assignedCommander || "",
    nameStrong: gv("f_name_strong") || "Unnamed Member",
    nameSon: gv("f_name_sub"),
    alias: gv("f_alias") || "—",
    cnic: gv("f_cnic"),
    cell: gv("f_cell"),
    area: gv("f_area"),
    tashkeel: memberTashkeel,
    status: gv("f_status") || "Active",
    photoUrl: gv("f_photo_url") || "",
    details: gv("f_details"),
    caseOfficer: gv("f_case_officer"),
    dob: gv("dob"),
    age: gv("f_age"),
    caste: gv("f_caste"),
    marital: gv("f_marital") || dNew.marital,
    hm: gv("f_hm"),
    banking: gv("f_banking"),
    smns: gv("f_smns"),
    firs: gv("f_firs"),
    tsActivities: gv("f_ts"),
    familyTree: gv("f_family"),
    areaActive: gv("f_area_active"),
    gp: gv("f_gp"),
    yearsActive: gv("f_years"),
    position: gv("f_position"),
    misc: gv("f_misc"),
    remarks: gv("f_remarks"),
    dateUpdated: gv("date_updated"),
    attachments,
  });
  closeModal();
  if (document.getElementById("p-database-members")?.classList.contains("active")) {
    renderTashkeelMembersTable();
  }
}

function openCommanderProfileView(officerId) {
  const raw = TASHKEEL_OFFICERS.find((x) => x.id === officerId);
  if (!raw) return;
  const o = normalizeTashkeelOfficer(raw);
  const overlay = document.getElementById("modal");
  const titleEl = document.getElementById("modal-title");
  const bodyEl = document.getElementById("modal-body");
  const modalBox = overlay?.querySelector(".modal");
  if (!overlay || !titleEl || !bodyEl || !modalBox) return;
  modalBox.classList.remove("modal-personnel");
  modalBox.classList.add("modal-report-detail", "modal-member-record");
  titleEl.classList.remove("modal-title--personnel");
  titleEl.textContent = `Commander profile · ${o.commanderKey}`;
  const idArg = JSON.stringify(officerId);
  const dv = (v) => {
    const s = String(v ?? "").trim();
    return s ? s : "—";
  };
  const pf = (label, val) =>
    `<div class="pf-item"><div class="pf-label">${escapeHtml(label)}</div><div class="pf-val">${escapeHtml(val)}</div></div>`;
  const pfHtml = (label, innerHtml) =>
    `<div class="pf-item"><div class="pf-label">${escapeHtml(label)}</div><div class="pf-val">${innerHtml}</div></div>`;
  const fields =
    pf("Ser #", dv(o.sr)) +
    pf("Commander name", dv(o.commanderKey)) +
    pf("Commander full name", dv(o.nameStrong)) +
    pf("S/O", dv(o.nameSon)) +
    pf("Alias", dv(o.alias)) +
    pf("CNIC", dv(o.cnic)) +
    pf("Cell # / IMEI", dv(o.cell)) +
    pf("Tashkeel", dv(o.tashkeel)) +
    pf("DOB", formatMemberDateDisplay(o.dob)) +
    pf("Age", dv(o.age)) +
    pf("Caste", dv(o.caste)) +
    pf("Marital Status", dv(o.marital)) +
    pf("Area", dv(o.area)) +
    pf("HM (Head Money)", dv(o.hm)) +
    pf("Banking Details", dv(o.banking)) +
    pf("SMNS", dv(o.smns)) +
    pf("FIRs", dv(o.firs)) +
    pf("TS Activities", dv(o.tsActivities)) +
    pf("Family Tree", dv(o.familyTree)) +
    pf("Area Active", dv(o.areaActive)) +
    pf("GP", dv(o.gp)) +
    pf("Years Active", dv(o.yearsActive)) +
    pf("Position", dv(o.position)) +
    pf("Misc", dv(o.misc)) +
    pf("Remarks", dv(o.remarks)) +
    pf("Date Updated", formatMemberDateDisplay(o.dateUpdated));

  const photoBlock =
    o.photoUrl && String(o.photoUrl).trim()
      ? `<img class="member-record-photo-img" src="${escapeHtml(String(o.photoUrl).trim())}" alt="" />`
      : `<div class="member-record-photo-placeholder">
      <div class="db-officer-avatar member-record-photo-avatar" aria-hidden="true">${dbOfficerAvatarInner(o)}</div>
      <strong>Picture</strong>
      <span class="member-record-photo-caption">Photo on file…</span>
    </div>`;

  const detailsBlock = (o.details || "").trim()
    ? `<div class="report-detail-narrative">${escapeHtml(o.details)}</div>`
    : `<div class="report-detail-narrative member-record-details-empty"><span class="pf-placeholder">Details will be added here as Paragraph...</span></div>`;

  const att = o.attachments || [];
  const filesRows = att
    .map(
      (f) =>
        `<div class="report-file-row report-file-row--readonly">
      <div class="report-file-meta">
        <span class="report-file-name">${escapeHtml(f.name)}</span>
        <span class="report-file-info">${f.size ? escapeHtml(`${Math.max(1, Math.round(f.size / 1024))} KB`) : ""}</span>
      </div>
    </div>`
    )
    .join("");
  const filesBox = filesRows || `<p class="report-files-empty">No files uploaded yet.</p>`;

  bodyEl.innerHTML = `<div class="member-record-readonly-wrap">
  <div class="member-record-readonly-main">
    <div class="profile-fields report-detail-fields">${fields}</div>
    <aside class="member-record-photo-aside" aria-label="Picture">
      ${photoBlock}
    </aside>
  </div>
  <div class="member-record-status-grid profile-fields">${pfHtml("Status", tashkeelStatusToTag(o.status))}</div>
  <div class="report-detail-section-title">Details</div>
  ${detailsBlock}
  <div class="pr-files-section member-record-files member-record-files--readonly">
    <div class="pr-files-slots-row">
      <span class="pr-files-label">Uploaded Files:</span>
      <div class="report-files-box member-record-files-list">${filesBox}</div>
    </div>
  </div>
</div>
<div class="form-actions report-detail-actions" style="margin-top:14px;">
  <button type="button" class="btn btn-outline btn-sm" onclick="closeModal()">Close</button>
  <span class="report-detail-actions-spacer"></span>
  <button type="button" class="btn btn-primary btn-sm" onclick='closeModal();openCommanderEditProfile(${idArg})'>Edit Profile</button>
  <button type="button" class="btn btn-outline btn-sm" onclick='closeModal();showTashkeelMembersPage(${idArg})'>View members</button>
</div>`;
  overlay.classList.add("open");
}

function openCommanderEditProfile(officerId) {
  const o = TASHKEEL_OFFICERS.find((x) => x.id === officerId);
  if (!o) return;
  const overlay = document.getElementById("modal");
  const titleEl = document.getElementById("modal-title");
  const bodyEl = document.getElementById("modal-body");
  const modalBox = overlay?.querySelector(".modal");
  if (!overlay || !titleEl || !bodyEl || !modalBox) return;
  modalBox.classList.remove("modal-report-detail");
  modalBox.classList.remove("modal-member-record");
  modalBox.classList.add("modal-personnel");
  titleEl.classList.add("modal-title--personnel");
  titleEl.textContent = `✏️ Commander profile • ${o.commanderKey}`;
  const idJson = JSON.stringify(officerId);
  const ob = normalizeTashkeelOfficer(o);
  bodyEl.innerHTML = `<form id="tashkeel-officer-edit-form" onsubmit="event.preventDefault(); saveTashkeelOfficerEdit(${idJson});">
${getPersonnelRecordFormHtml("commander", { ...ob, details: ob.details || "", marital: ob.marital || "Single" }, { includeFooter: false })}
<div class="personnel-footer personnel-footer--split">
  <button type="button" class="btn btn-red btn-delete-commander" onclick="deleteTashkeelOfficer(${idJson})">🗑 Delete profile</button>
  <button type="button" class="btn-cancel" onclick="closeModal()">Cancel</button>
  <button type="submit" class="btn-save"><span aria-hidden="true">💾</span> Save changes</button>
</div>
</form>`;
  const offForm = document.getElementById("tashkeel-officer-edit-form");
  if (offForm) personnelAttachmentsLoadFromArray(offForm, ob.attachments || []);
  overlay.classList.add("open");
}

function saveTashkeelOfficerEdit(id) {
  const form = document.getElementById("tashkeel-officer-edit-form");
  const o = TASHKEEL_OFFICERS.find((x) => x.id === id);
  if (!form || !o) return;
  const gv = (name) => {
    const el = form.elements.namedItem(name);
    return el && "value" in el ? String(el.value).trim() : "";
  };
  o.sr = gv("f_sr") || o.sr;
  o.nameStrong = gv("f_name_strong") || o.nameStrong;
  o.nameSon = gv("f_name_sub") || o.nameSon;
  o.alias = gv("f_alias") || "—";
  o.cnic = gv("f_cnic");
  o.cell = gv("f_cell");
  o.tashkeel = gv("f_tashkeel");
  o.area = gv("f_area");
  o.status = gv("f_status") || o.status;
  o.dob = gv("dob");
  o.age = gv("f_age");
  o.caste = gv("f_caste");
  o.marital = gv("f_marital") || o.marital || "Single";
  o.hm = gv("f_hm");
  o.banking = gv("f_banking");
  o.smns = gv("f_smns");
  o.firs = gv("f_firs");
  o.tsActivities = gv("f_ts");
  o.familyTree = gv("f_family");
  o.areaActive = gv("f_area_active");
  o.gp = gv("f_gp");
  o.yearsActive = gv("f_years");
  o.position = gv("f_position");
  o.misc = gv("f_misc");
  o.remarks = gv("f_remarks");
  o.dateUpdated = gv("date_updated");
  const photoEl = form.elements.namedItem("f_photo_url");
  if (photoEl && "value" in photoEl) o.photoUrl = String(photoEl.value).trim();
  o.details = gv("f_details");
  o.attachments = prParseAttachmentsJson(form);
  closeModal();
  renderTashkeelOfficersTable();
}

function deleteTashkeelOfficer(id) {
  if (
    !confirm(
      "Delete this commander profile? This cannot be undone. Members still linked to this commander in the list should be reassigned when your backend is connected."
    )
  ) {
    return;
  }
  const idx = TASHKEEL_OFFICERS.findIndex((x) => x.id === id);
  if (idx >= 0) TASHKEEL_OFFICERS.splice(idx, 1);
  closeModal();
  renderTashkeelOfficersTable();
}

function showTashkeelMembersPage(officerId) {
  const o = TASHKEEL_OFFICERS.find((x) => x.id === officerId);
  if (!o) return;
  __dbMembersContext = { officerId: o.id, commanderKey: o.commanderKey };
  document.querySelectorAll(".page").forEach((p) => p.classList.remove("active"));
  const pm = document.getElementById("p-database-members");
  if (pm) pm.classList.add("active");
  document.querySelectorAll(".nav-item").forEach((n) => n.classList.remove("active"));
  const navDb = document.querySelector('.nav-item[data-nav="database"]');
  if (navDb) navDb.classList.add("active");
  const pt = document.getElementById("page-title");
  if (pt) pt.textContent = "Database · Members";
  const titleEl = document.getElementById("tashkeel-members-page-title");
  const subEl = document.getElementById("tashkeel-members-page-sub");
  if (titleEl) titleEl.textContent = `👥 Members · ${o.commanderKey}`;
  if (subEl) {
    subEl.textContent = `Commander: ${o.nameStrong} · ${o.nameSon} · SR ${o.sr}`;
  }
  renderTashkeelMembersTable();
}

function renderTashkeelMembersTable() {
  const tbody = document.getElementById("tashkeel-members-tbody");
  if (!tbody) return;
  const key = __dbMembersContext.commanderKey;
  let rows = TASHKEEL_MEMBERS.filter((m) => m.commanderKey === key);

  const q = (document.getElementById("tashkeel-members-search")?.value || "").trim().toLowerCase();
  if (q) {
    rows = rows.filter((m) => {
      const blob = `${m.sr} ${m.nameStrong} ${m.nameSon} ${m.alias} ${m.cnic} ${m.cell} ${m.area} ${m.tashkeel} ${m.status || ""}`.toLowerCase();
      return blob.includes(q);
    });
  }
  const areaF = document.getElementById("tashkeel-members-filter-area")?.value || "";
  if (areaF) rows = rows.filter((m) => (m.area || "").trim() === areaF);
  const stF = document.getElementById("tashkeel-members-filter-status")?.value || "";
  if (stF) rows = rows.filter((m) => (m.status || "").trim() === stF);

  if (rows.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;padding:22px;color:#888;">No members match the current filters. Use <strong>Add member</strong> or <strong>Add Data</strong> to create records.</td></tr>`;
    return;
  }

  tbody.innerHTML = rows
    .map((m) => {
      const mPhoto = { ...m, photoUrl: m.photoUrl || "" };
      const idArg = JSON.stringify(m.id);
      const aliasCell =
        m.alias && m.alias !== "—"
          ? `<span class="tag tag-orange">${escapeHtml(m.alias)}</span>`
          : `<span style="color:#aaa;">—</span>`;
      return `<tr data-member-id="${escapeHtml(m.id)}">
      <td class="db-sr-photo-cell">
        <div class="db-officer-avatar" aria-hidden="true">${dbOfficerAvatarInner(mPhoto)}</div>
        <span>${escapeHtml(m.sr)}</span>
      </td>
      <td><strong>${escapeHtml(m.nameStrong)}</strong><br><span style="font-size:.65rem;color:#888;">${escapeHtml(m.nameSon)}</span></td>
      <td>${aliasCell}</td>
      <td>${escapeHtml(m.cnic)}</td>
      <td>${escapeHtml(m.cell)}</td>
      <td>${escapeHtml(m.area)}</td>
      <td>${escapeHtml(m.tashkeel)}</td>
      <td>${tashkeelStatusToTag(m.status)}</td>
      <td class="db-officer-actions" onclick="event.stopPropagation();">
        <div class="db-officer-action-btns">
          <button type="button" class="btn btn-primary btn-sm" onclick='openMemberEditProfile(${idArg})'>✏️ Edit profile</button>
          <button type="button" class="btn btn-outline btn-sm" onclick='openMemberDetailView(${idArg})'>📋 View record</button>
        </div>
      </td>
    </tr>`;
    })
    .join("");
}

function openMemberDetailView(memberId) {
  const raw = TASHKEEL_MEMBERS.find((x) => x.id === memberId);
  if (!raw) return;
  const m = normalizeTashkeelMember(raw);
  const overlay = document.getElementById("modal");
  const titleEl = document.getElementById("modal-title");
  const bodyEl = document.getElementById("modal-body");
  const modalBox = overlay?.querySelector(".modal");
  if (!overlay || !titleEl || !bodyEl || !modalBox) return;
  modalBox.classList.remove("modal-personnel");
  modalBox.classList.add("modal-report-detail", "modal-member-record");
  titleEl.classList.remove("modal-title--personnel");
  titleEl.textContent = `Member record · ${m.sr}`;
  const idArg = JSON.stringify(memberId);
  const dv = (v) => {
    const s = String(v ?? "").trim();
    return s ? s : "—";
  };
  const pf = (label, val) =>
    `<div class="pf-item"><div class="pf-label">${escapeHtml(label)}</div><div class="pf-val">${escapeHtml(val)}</div></div>`;
  const pfHtml = (label, innerHtml) =>
    `<div class="pf-item"><div class="pf-label">${escapeHtml(label)}</div><div class="pf-val">${innerHtml}</div></div>`;
  const fields =
    pf("Ser #", dv(m.sr)) +
    pf("Name", dv(m.nameStrong)) +
    pf("S/O", dv(m.nameSon)) +
    pf("Alias", dv(m.alias)) +
    pf("CNIC", dv(m.cnic)) +
    pf("Cell # / IMEI", dv(m.cell)) +
    pf("Tashkeel", dv(m.tashkeel)) +
    pf("Assigned Commander", dv(m.commanderKey)) +
    pf("DOB", formatMemberDateDisplay(m.dob)) +
    pf("Age", dv(m.age)) +
    pf("Caste", dv(m.caste)) +
    pf("Marital Status", dv(m.marital)) +
    pf("Area", dv(m.area)) +
    pf("HM (Head Money)", dv(m.hm)) +
    pf("Banking Details", dv(m.banking)) +
    pf("SMNS", dv(m.smns)) +
    pf("FIRs", dv(m.firs)) +
    pf("TS Activities", dv(m.tsActivities)) +
    pf("Family Tree", dv(m.familyTree)) +
    pf("Case Officer", dv(m.caseOfficer)) +
    pf("Area Active", dv(m.areaActive)) +
    pf("GP", dv(m.gp)) +
    pf("Years Active", dv(m.yearsActive)) +
    pf("Position", dv(m.position)) +
    pf("Misc", dv(m.misc)) +
    pf("Remarks", dv(m.remarks)) +
    pf("Date Updated", formatMemberDateDisplay(m.dateUpdated));

  const photoBlock =
    m.photoUrl && String(m.photoUrl).trim()
      ? `<img class="member-record-photo-img" src="${escapeHtml(String(m.photoUrl).trim())}" alt="" />`
      : `<div class="member-record-photo-placeholder">
      <div class="db-officer-avatar member-record-photo-avatar" aria-hidden="true">${dbOfficerAvatarInner(m)}</div>
      <strong>Picture</strong>
      <span class="member-record-photo-caption">Photo on file…</span>
    </div>`;

  const detailsBlock = (m.details || "").trim()
    ? `<div class="report-detail-narrative">${escapeHtml(m.details)}</div>`
    : `<div class="report-detail-narrative member-record-details-empty"><span class="pf-placeholder">Details will be added here as Paragraph...</span></div>`;

  const att = m.attachments || [];
  const filesRows = att
    .map(
      (f) =>
        `<div class="report-file-row report-file-row--readonly">
      <div class="report-file-meta">
        <span class="report-file-name">${escapeHtml(f.name)}</span>
        <span class="report-file-info">${f.size ? escapeHtml(`${Math.max(1, Math.round(f.size / 1024))} KB`) : ""}</span>
      </div>
    </div>`
    )
    .join("");
  const filesBox = filesRows || `<p class="report-files-empty">No files uploaded yet.</p>`;

  bodyEl.innerHTML = `<div class="member-record-readonly-wrap">
  <div class="member-record-readonly-main">
    <div class="profile-fields report-detail-fields">${fields}</div>
    <aside class="member-record-photo-aside" aria-label="Picture">
      ${photoBlock}
    </aside>
  </div>
  <div class="member-record-status-grid profile-fields">${pfHtml("Status", tashkeelStatusToTag(m.status))}</div>
  <div class="report-detail-section-title">Details</div>
  ${detailsBlock}
  <div class="pr-files-section member-record-files member-record-files--readonly">
    <div class="pr-files-slots-row">
      <span class="pr-files-label">Uploaded Files:</span>
      <div class="report-files-box member-record-files-list">${filesBox}</div>
    </div>
  </div>
</div>
<div class="form-actions report-detail-actions" style="margin-top:14px;">
  <button type="button" class="btn btn-outline btn-sm" onclick="closeModal()">Close</button>
  <span class="report-detail-actions-spacer"></span>
  <button type="button" class="btn btn-primary btn-sm" onclick='closeModal();openMemberEditProfile(${idArg})'>✏️ Edit</button>
</div>`;
  overlay.classList.add("open");
}

function openMemberEditProfile(memberId) {
  const m = TASHKEEL_MEMBERS.find((x) => x.id === memberId);
  if (!m) return;
  const overlay = document.getElementById("modal");
  const titleEl = document.getElementById("modal-title");
  const bodyEl = document.getElementById("modal-body");
  const modalBox = overlay?.querySelector(".modal");
  if (!overlay || !titleEl || !bodyEl || !modalBox) return;
  modalBox.classList.remove("modal-report-detail");
  modalBox.classList.add("modal-personnel");
  titleEl.classList.add("modal-title--personnel");
  titleEl.textContent = `✏️ Member profile · ${m.sr}`;
  const base = normalizeTashkeelMember(m);
  const preset = {
    ...base,
    details: base.details || "",
    assignedCommander: base.commanderKey,
    caseOfficer: base.caseOfficer || "",
    status: base.status,
    marital: base.marital || "Single",
  };
  const idJson = JSON.stringify(memberId);
  bodyEl.innerHTML = `<form id="tashkeel-member-edit-form" onsubmit="event.preventDefault(); saveTashkeelMemberEdit(${idJson});">
${getPersonnelRecordFormHtml("member", preset, { includeFooter: false })}
<div class="personnel-footer personnel-footer--split">
  <button type="button" class="btn btn-red btn-delete-commander" onclick="deleteTashkeelMember(${idJson})">🗑 Delete profile</button>
  <button type="button" class="btn-cancel" onclick="closeModal()">Cancel</button>
  <button type="submit" class="btn-save"><span aria-hidden="true">💾</span> Save changes</button>
</div>
</form>`;
  const memForm = document.getElementById("tashkeel-member-edit-form");
  if (memForm) personnelAttachmentsLoadFromArray(memForm, base.attachments || []);
  if (memForm) syncMemberTashkeelFromCommander(memForm);
  overlay.classList.add("open");
}

function saveTashkeelMemberEdit(id) {
  const form = document.getElementById("tashkeel-member-edit-form");
  const m = TASHKEEL_MEMBERS.find((x) => x.id === id);
  if (!form || !m) return;
  const gv = (name) => {
    const el = form.elements.namedItem(name);
    return el && "value" in el ? String(el.value).trim() : "";
  };
  m.sr = gv("f_sr") || m.sr;
  m.nameStrong = gv("f_name_strong") || m.nameStrong;
  m.nameSon = gv("f_name_sub") || m.nameSon;
  m.alias = gv("f_alias") || "—";
  m.cnic = gv("f_cnic");
  m.cell = gv("f_cell");
  m.area = gv("f_area");
  m.status = gv("f_status") || m.status;
  m.commanderKey = gv("assigned_commander") || m.commanderKey;
  m.tashkeel = tashkeelValueForCommanderKey(m.commanderKey) || gv("f_tashkeel");
  m.caseOfficer = gv("f_case_officer");
  m.details = gv("f_details");
  m.dob = gv("dob");
  m.age = gv("f_age");
  m.caste = gv("f_caste");
  m.marital = gv("f_marital") || m.marital || "Single";
  m.hm = gv("f_hm");
  m.banking = gv("f_banking");
  m.smns = gv("f_smns");
  m.firs = gv("f_firs");
  m.tsActivities = gv("f_ts");
  m.familyTree = gv("f_family");
  m.areaActive = gv("f_area_active");
  m.gp = gv("f_gp");
  m.yearsActive = gv("f_years");
  m.position = gv("f_position");
  m.misc = gv("f_misc");
  m.remarks = gv("f_remarks");
  m.dateUpdated = gv("date_updated");
  const photoEl = form.elements.namedItem("f_photo_url");
  if (photoEl && "value" in photoEl) m.photoUrl = String(photoEl.value).trim();
  m.attachments = prParseAttachmentsJson(form);
  closeModal();
  renderTashkeelMembersTable();
}

function deleteTashkeelMember(id) {
  if (!confirm("Delete this member record? This cannot be undone.")) return;
  const idx = TASHKEEL_MEMBERS.findIndex((x) => x.id === id);
  if (idx >= 0) TASHKEEL_MEMBERS.splice(idx, 1);
  closeModal();
  renderTashkeelMembersTable();
}

function openModal(type) {
  const overlay = document.getElementById("modal");
  const titleEl = document.getElementById("modal-title");
  const bodyEl = document.getElementById("modal-body");
  const modalBox = overlay?.querySelector(".modal");
  if (!overlay || !titleEl || !bodyEl || !modalBox) return;

  modalBox.classList.remove("modal-personnel");
  modalBox.classList.remove("modal-report-detail");

  if (type === "personnelRecord") {
    modalBox.classList.add("modal-personnel");
    titleEl.classList.add("modal-title--personnel");
    titleEl.textContent = "💾 PERSONNEL RECORD • #001";
    bodyEl.innerHTML = getPersonnelRecordFormHtml("member", {}, { includeFooter: true });
    overlay.classList.add("open");
    return;
  }

  if (type === "addRecord") {
    modalBox.classList.add("modal-personnel");
    titleEl.classList.add("modal-title--personnel");
    titleEl.textContent = "💾 ADD DATA";
    bodyEl.innerHTML = getAddDataTypeChooserHtml();
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
    addOp: modalsSimple.addOp,
    addCmd: modalsSimple.addCmd,
    addOperator: modalsSimple.addOperator,
  };

  titleEl.classList.remove("modal-title--personnel");
  titleEl.textContent = modTitles[type] || "Form";
  let bodyHtml = htmlMap[type];
  if (type === "addThreat") bodyHtml = getAddThreatModalHtml();
  else if (type === "addIncident") bodyHtml = getAddIncidentModalHtml();
  else if (type === "addInfoReport") bodyHtml = getAddInfoReportModalHtml();
  else if (type === "addPors") bodyHtml = getAddPorsModalHtml();
  bodyEl.innerHTML = bodyHtml || "<p>Coming soon.</p>";
  overlay.classList.add("open");
}

/** Reports page: which modal opens from the primary "Add …" button */
const REPORT_ADD_CONFIG = {
  incident: { label: "➕ Add Incident Report", modal: "addIncident" },
  threat: { label: "➕ Add Threat Report", modal: "addThreat" },
  info: { label: "➕ Add Info Report", modal: "addInfoReport" },
  pors: { label: "➕ Add PORS Report", modal: "addPors" },
};

function updateReportsTableHeaderForCategory(type) {
  const theadRow = document.getElementById("reports-thead-row");
  if (!theadRow) return;
  if (type === "incident") {
    theadRow.innerHTML =
      "<th>Incident serial</th><th>Severity</th><th>Zone</th><th>Area (Geo Coordinates)</th><th>Date</th><th>AOR</th><th>Description</th><th>Nature of incident</th><th>Casualties</th><th>Actions</th>";
  } else if (type === "threat" || type === "info" || type === "pors") {
    theadRow.innerHTML =
      '<th>ID</th><th id="reports-col-title">Title</th><th>Severity</th><th>Zone</th><th>Area (Geo Coordinates)</th><th>Date</th><th id="reports-col-reporter">Source category</th><th>Status</th><th>Actions</th>';
  } else {
    theadRow.innerHTML =
      '<th>ID</th><th id="reports-col-title">Title</th><th>Severity</th><th>Zone</th><th>Operation</th><th>Date</th><th id="reports-col-reporter">Reported By</th><th>Status</th><th>Actions</th>';
  }
}

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

  updateReportsTableHeaderForCategory(type);
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
    area: "Zone 6: Dera Ismail Khan",
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
    area: "Zone 3: Daraban",
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
    area: "Zone 6: Dera Ismail Khan",
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
    area: "Zone 6: Dera Ismail Khan",
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
    area: "Zone 3: Daraban",
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
    area: "Zone 6: Dera Ismail Khan",
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
    field3Value: "Zone 6: Dera Ismail Khan",
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
    field3Value: "Zone 6: Dera Ismail Khan",
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
    title: "IRS-2026-0042",
    severity: { cls: "tag-red", text: "HIGH" },
    zone: "Zone 6: Dera Ismail Khan",
    operation: "SWIFT",
    when: "30 Mar 2026 · 09:42 PKT",
    reporter: "7 Div North / Faseeh",
    casualties: "None (cordon only)",
    natureOfIncident: "IED / UXO find",
    areaGeo: "34.0521° N, 71.5783° E",
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
    title: "IRS-2026-0041",
    severity: { cls: "tag-orange", text: "MEDIUM" },
    zone: "Zone 4: Drazanda",
    operation: "—",
    when: "29 Mar 2026 · 16:10 PKT",
    reporter: "Border Task Force / Rafay",
    casualties: "None",
    natureOfIncident: "Suspicious vehicles / checkpoint",
    areaGeo: "34.0150° N, 71.5244° E",
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
    title: "IRS-2026-0040",
    severity: { cls: "tag-teal", text: "LOW" },
    zone: "Zone 2: Kulachi",
    operation: "—",
    when: "28 Mar 2026 · 11:05 PKT",
    reporter: "Zone 2: Kulachi AOR / Hamza",
    casualties: "N/A (intel only)",
    natureOfIncident: "Human intelligence / tip-off",
    areaGeo: "Approx. grid 38S NV 12345 67890",
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
    zone: "Zone 6: Dera Ismail Khan",
    operation: "—",
    areaGeo: "34.12° N, 71.45° E",
    when: "30 Mar 2026 · 07:00 PKT",
    reporter: "HUMINT",
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
    zone: "Zone 5: Paroa",
    operation: "—",
    areaGeo: "—",
    when: "29 Mar 2026 · 14:22 PKT",
    reporter: "FIU / OSINT",
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
    zone: "Zone 3: Daraban",
    operation: "—",
    areaGeo: "38S NV 12000 65000",
    when: "25 Mar 2026 · 09:00 PKT",
    reporter: "Routine patrol",
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
    zone: "Zone 4: Drazanda",
    operation: "—",
    areaGeo: "34.018° N, 71.496° E",
    when: "30 Mar 2026 · 08:30 PKT",
    reporter: "OSINT / open sources",
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
    zone: "Zone 6: Dera Ismail Khan",
    operation: "—",
    areaGeo: "—",
    when: "28 Mar 2026 · 19:00 PKT",
    reporter: "Media monitoring",
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
    zone: "Zone 4: Drazanda",
    operation: "GRID 38S",
    areaGeo: "34.205° N, 71.612° E",
    when: "29 Mar 2026 · 05:15 PKT",
    reporter: "Patrol lead / HUMINT",
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
    zone: "Zone 6: Dera Ismail Khan",
    operation: "GRID 38N",
    areaGeo: "38S NV 12100 65400",
    when: "27 Mar 2026 · 22:40 PKT",
    reporter: "Night patrol unit",
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

function formatReportAttachmentMeta(file) {
  const bytes = file && typeof file.size === "number" ? file.size : 0;
  const kb = Math.max(1, Math.round(bytes / 1024));
  const typeLabel = (file && file.type && String(file.type).trim()) || "File";
  if (kb >= 1024) return `${(kb / 1024).toFixed(1)} MB · ${typeLabel}`;
  return `${kb} KB · ${typeLabel}`;
}

function collectReportAttachmentsFromForm(form, inputName = "attachments") {
  if (!form) return [];
  const el = form.elements.namedItem(inputName);
  if (!el || !("files" in el) || !el.files || el.files.length === 0) return [];
  const out = [];
  for (let i = 0; i < el.files.length; i++) {
    const f = el.files[i];
    out.push({ name: f.name, meta: formatReportAttachmentMeta(f) });
  }
  return out;
}

/** Shared “Attachments” row for Add Incident / Threat / Info / PORS modals */
function getReportAddAttachmentsHtml() {
  return `<div class="form-group form-full report-add-attachments">
    <label>Attachments</label>
    <input type="file" name="attachments" multiple class="report-add-attachments-input" accept=".pdf,application/pdf,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.kmz,.kml,application/vnd.google-earth.kmz,application/vnd.google-earth.kml+xml" />
    <p class="report-add-attachments-hint">Supported files: PDF, Word (.doc, .docx), KMZ, KML</p>
  </div>`;
}

function buildIncidentDescriptionCellHtml(reportId, summary) {
  const text = String(summary || "").replace(/\s+/g, " ").trim();
  const safe = escapeHtml(text);
  const tip = text.length > 220 ? `${text.slice(0, 220)}…` : text;
  const titleAttr = escapeHtml(tip).replace(/"/g, "&quot;");
  const on = `event.stopPropagation();openReportDetail(${JSON.stringify(reportId)})`;
  return `<span class="incident-desc-truncate" title="${titleAttr}">${safe}</span><button type="button" class="incident-desc-more" onclick='${on}' title="View full description">…</button>`;
}

function buildIncidentReportsPanelRowHtml(id, d) {
  const sev = _reportTagSpan(d.severity);
  const desc = buildIncidentDescriptionCellHtml(id, d.summary);
  const on = `event.stopPropagation();openReportDetail(${JSON.stringify(id)})`;
  return `<tr data-report-id="${escapeHtml(id)}"><td><strong>${escapeHtml(d.title)}</strong></td><td>${sev}</td><td>${escapeHtml(
    d.zone
  )}</td><td>${escapeHtml(d.areaGeo || "—")}</td><td>${escapeHtml(formatTableDate(d.when))}</td><td>${escapeHtml(
    d.reporter
  )}</td><td class="incident-desc-cell">${desc}</td><td>${escapeHtml(d.natureOfIncident || "—")}</td><td>${escapeHtml(
    d.casualties || "—"
  )}</td><td><button type="button" class="btn btn-outline btn-sm" onclick='${on}'>Details</button></td></tr>`;
}

function renderIncidentReportsPanelTable() {
  const tbody = document.getElementById("reports-panel-incident");
  if (!tbody) return;
  const ids = Object.keys(REPORT_DETAILS).filter((k) => REPORT_DETAILS[k].kind === "incident");
  ids.sort((a, b) => (REPORT_DETAILS[b].when || "").localeCompare(REPORT_DETAILS[a].when || ""));
  tbody.innerHTML = ids.map((id) => buildIncidentReportsPanelRowHtml(id, REPORT_DETAILS[id])).join("") || "";
}

function reportsPanelGeoColumnText(d) {
  if (!d) return "—";
  if (d.kind === "threat" || d.kind === "info") {
    return d.areaGeo != null && String(d.areaGeo).trim() !== "" ? String(d.areaGeo).trim() : "—";
  }
  if (d.kind === "pors") {
    if (d.areaGeo != null && String(d.areaGeo).trim() !== "") return String(d.areaGeo).trim();
    return d.operation != null && String(d.operation).trim() !== "" ? String(d.operation).trim() : "—";
  }
  return d.operation != null && String(d.operation).trim() !== "" ? String(d.operation).trim() : "—";
}

function buildReportsPanelStandardRowHtml(id, d) {
  const geo = reportsPanelGeoColumnText(d);
  const on = `event.stopPropagation();openReportDetail(${JSON.stringify(id)})`;
  return `<tr data-report-id="${escapeHtml(id)}"><td>${escapeHtml(id)}</td><td><strong>${escapeHtml(
    d.title
  )}</strong></td><td>${_reportTagSpan(d.severity)}</td><td>${escapeHtml(d.zone)}</td><td>${escapeHtml(
    geo
  )}</td><td>${escapeHtml(formatTableDate(d.when))}</td><td>${escapeHtml(d.reporter)}</td><td>${_reportTagSpan(
    d.status
  )}</td><td><button type="button" class="btn btn-outline btn-sm" onclick='${on}'>Details</button></td></tr>`;
}

function renderInfoReportsPanelTable() {
  const tbody = document.getElementById("reports-panel-info");
  if (!tbody) return;
  const ids = Object.keys(REPORT_DETAILS).filter((k) => REPORT_DETAILS[k].kind === "info");
  ids.sort((a, b) => (REPORT_DETAILS[b].when || "").localeCompare(REPORT_DETAILS[a].when || ""));
  tbody.innerHTML = ids.map((id) => buildReportsPanelStandardRowHtml(id, REPORT_DETAILS[id])).join("") || "";
}

function renderPorsReportsPanelTable() {
  const tbody = document.getElementById("reports-panel-pors");
  if (!tbody) return;
  const ids = Object.keys(REPORT_DETAILS).filter((k) => REPORT_DETAILS[k].kind === "pors");
  ids.sort((a, b) => (REPORT_DETAILS[b].when || "").localeCompare(REPORT_DETAILS[a].when || ""));
  tbody.innerHTML = ids.map((id) => buildReportsPanelStandardRowHtml(id, REPORT_DETAILS[id])).join("") || "";
}

function refreshAllReportPanelTables() {
  renderIncidentReportsPanelTable();
  renderInfoReportsPanelTable();
  renderPorsReportsPanelTable();
  renderAllThreatReportTables();
}

/** Six operational AOR zones (Threat Assessment + shared area filters). */
const OPERATIONAL_ZONE_LABELS = [
  "Zone 1: Paharpur",
  "Zone 2: Kulachi",
  "Zone 3: Daraban",
  "Zone 4: Drazanda",
  "Zone 5: Paroa",
  "Zone 6: Dera Ismail Khan",
];

function getThreatZoneSelectHtml(selected) {
  const cur = (selected || "").trim();
  const entries = OPERATIONAL_ZONE_LABELS;
  let html = "";
  if (cur && !entries.includes(cur)) {
    html += `<option value="${escapeHtml(cur)}" selected>${escapeHtml(cur)}</option>`;
  }
  for (const label of entries) {
    html += `<option value="${escapeHtml(label)}"${cur === label ? " selected" : ""}>${escapeHtml(label)}</option>`;
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

function formatDateTimeLocalToWhen(v) {
  if (!v) return "";
  const [datePart, timePart] = v.split("T");
  const base = formatDateInputToWhen(datePart);
  if (!base) return "";
  if (!timePart) return base;
  const [hh = "08", mm = "00"] = timePart.split(":");
  return base.replace(/08:00 PKT/, `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")} PKT`);
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

function nextIncidentReportId() {
  let max = 0;
  Object.keys(REPORT_DETAILS).forEach((k) => {
    if (!k.startsWith("INC-")) return;
    const n = parseInt(k.replace("INC-", ""), 10);
    if (!Number.isNaN(n) && n > max) max = n;
  });
  return "INC-" + String(max + 1).padStart(3, "0");
}

function nextInfoReportId() {
  let max = 0;
  Object.keys(REPORT_DETAILS).forEach((k) => {
    if (!k.startsWith("INF-")) return;
    const n = parseInt(k.replace("INF-", ""), 10);
    if (!Number.isNaN(n) && n > max) max = n;
  });
  return "INF-" + String(max + 1).padStart(3, "0");
}

function nextPorsReportId() {
  let max = 0;
  Object.keys(REPORT_DETAILS).forEach((k) => {
    if (!k.startsWith("PORS-")) return;
    const n = parseInt(k.replace("PORS-", ""), 10);
    if (!Number.isNaN(n) && n > max) max = n;
  });
  return "PORS-" + String(max + 1).padStart(3, "0");
}

function getThreatReportIdsFromDb() {
  return Object.keys(REPORT_DETAILS).filter((k) => REPORT_DETAILS[k].kind === "threat");
}

function buildThreatAssessmentRowHtml(id, d) {
  const on = `event.stopPropagation();openReportDetail(${JSON.stringify(id)})`;
  return `<tr data-report-id="${escapeHtml(id)}" data-ta-lead="${escapeHtml(d.taLead || "standard")}">
    <td>${escapeHtml(id)}</td>
    <td><strong>${escapeHtml(d.title)}</strong></td>
    <td>${escapeHtml(d.zone)}</td>
    <td>${_reportTagSpan(d.severity)}</td>
    <td>${escapeHtml(d.reporter)}</td>
    <td>${escapeHtml(formatTableDate(d.when))}</td>
    <td>${_reportTagSpan(d.status)}</td>
    <td><button type="button" class="btn btn-outline btn-sm" onclick='${on}'>View</button></td>
  </tr>`;
}

function buildReportsPanelThreatRowHtml(id, d) {
  const geo =
    d.areaGeo != null && String(d.areaGeo).trim() !== "" ? String(d.areaGeo).trim() : "—";
  const on = `event.stopPropagation();openReportDetail(${JSON.stringify(id)})`;
  return `<tr data-report-id="${escapeHtml(id)}"><td>${escapeHtml(id)}</td><td><strong>${escapeHtml(
    d.title
  )}</strong></td><td>${_reportTagSpan(d.severity)}</td><td>${escapeHtml(d.zone)}</td><td>${escapeHtml(
    geo
  )}</td><td>${escapeHtml(formatTableDate(d.when))}</td><td>${escapeHtml(d.reporter)}</td><td>${_reportTagSpan(
    d.status
  )}</td><td><button type="button" class="btn btn-outline btn-sm" onclick='${on}'>Details</button></td></tr>`;
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
  let id = getv("reportId");
  if (!id) id = nextThreatReportId();
  if (REPORT_DETAILS[id]) {
    alert(`Report ID "${id}" already exists. Use a different ID.`);
    return;
  }
  const sevRaw = getv("severity");
  const sev = severityTextToTag(sevRaw);
  const st = statusTextToTag(getv("status"));
  const when = formatDateInputToWhen(getv("reportDate")) || "—";
  REPORT_DETAILS[id] = {
    kind: "threat",
    modalTitle: "Threat Report",
    title: getv("title") || "Untitled threat report",
    severity: sev,
    zone: getv("zone") || OPERATIONAL_ZONE_LABELS[0],
    operation: "—",
    areaGeo: getv("areaGeo") || "",
    when,
    reporter: getv("reporter") || "—",
    status: st,
    summary: getv("summary") || "",
    recommended: getv("recommended") || "",
    files: collectReportAttachmentsFromForm(form),
    taLead: "standard",
  };
  closeModal();
  refreshAllReportPanelTables();
}

function incidentReportAddSubmit() {
  const form = document.getElementById("incident-report-add-form");
  if (!form) return;
  const getv = (name) => {
    const el = form.elements.namedItem(name);
    return el && "value" in el ? String(el.value).trim() : "";
  };
  let id = getv("reportId");
  if (!id) id = nextIncidentReportId();
  if (REPORT_DETAILS[id]) {
    alert(`Report ID "${id}" already exists. Use a different ID.`);
    return;
  }
  const whenRaw = getv("whenLocal");
  const when =
    formatDateTimeLocalToWhen(whenRaw) || formatDateInputToWhen(whenRaw.slice(0, 10)) || "—";
  REPORT_DETAILS[id] = {
    kind: "incident",
    modalTitle: "Incident Report",
    title: getv("title") || "Untitled incident",
    severity: severityTextToTag(getv("severity")),
    zone: getv("zone") || "—",
    operation: "—",
    areaGeo: getv("areaGeo") || "",
    when,
    reporter: getv("reporter") || "—",
    casualties: getv("casualties") || "—",
    natureOfIncident: getv("natureOfIncident") || "—",
    status: statusTextToTag("Open"),
    summary: getv("summary") || "",
    files: collectReportAttachmentsFromForm(form),
  };
  closeModal();
  refreshAllReportPanelTables();
}

function infoReportAddSubmit() {
  const form = document.getElementById("info-report-add-form");
  if (!form) return;
  const getv = (name) => {
    const el = form.elements.namedItem(name);
    return el && "value" in el ? String(el.value).trim() : "";
  };
  let id = getv("reportId");
  if (!id) id = nextInfoReportId();
  if (REPORT_DETAILS[id]) {
    alert(`Report ID "${id}" already exists. Use a different ID.`);
    return;
  }
  REPORT_DETAILS[id] = {
    kind: "info",
    modalTitle: "Info Report",
    title: getv("title") || "Untitled info report",
    severity: severityTextToTag(getv("severity")),
    zone: getv("zone") || "—",
    operation: "—",
    areaGeo: getv("areaGeo") || "",
    when: formatDateInputToWhen(getv("reportDate")) || "—",
    reporter: getv("reporter") || "—",
    status: statusTextToTag(getv("status")),
    category: getv("category") || "—",
    sources: getv("sources") || "",
    summary: getv("summary") || "",
    files: collectReportAttachmentsFromForm(form),
  };
  closeModal();
  refreshAllReportPanelTables();
}

function porsReportAddSubmit() {
  const form = document.getElementById("pors-report-add-form");
  if (!form) return;
  const getv = (name) => {
    const el = form.elements.namedItem(name);
    return el && "value" in el ? String(el.value).trim() : "";
  };
  let id = getv("reportId");
  if (!id) id = nextPorsReportId();
  if (REPORT_DETAILS[id]) {
    alert(`Report ID "${id}" already exists. Use a different ID.`);
    return;
  }
  const whenRaw = getv("whenLocal");
  const when =
    formatDateTimeLocalToWhen(whenRaw) || formatDateInputToWhen(whenRaw.slice(0, 10)) || "—";
  REPORT_DETAILS[id] = {
    kind: "pors",
    modalTitle: "PORS Report",
    title: getv("title") || "Untitled PORS",
    severity: severityTextToTag(getv("severity")),
    zone: getv("zone") || "—",
    operation: getv("operation") || "—",
    areaGeo: getv("areaGeo") || "",
    when,
    reporter: getv("reporter") || "—",
    status: statusTextToTag(getv("status")),
    classification: getv("classification") || "Restricted",
    summary: getv("summary") || "",
    files: collectReportAttachmentsFromForm(form),
  };
  closeModal();
  refreshAllReportPanelTables();
}

function getAddIncidentModalHtml() {
  const suggestedId = nextIncidentReportId();
  return `<form id="incident-report-add-form" onsubmit="event.preventDefault(); incidentReportAddSubmit();">
  <div class="form-grid">
    <div class="form-group"><label>ID</label><input name="reportId" value="${escapeHtml(
      suggestedId
    )}" placeholder="e.g. INC-004" required /></div>
    <div class="form-group form-full"><label>Incident serial</label><input name="title" placeholder="e.g. IRS-2026-0001" required /></div>
    <div class="form-group"><label>Severity</label><select name="severity"><option value="HIGH">High</option><option value="MEDIUM" selected>Medium</option><option value="LOW">Low</option></select></div>
    <div class="form-group"><label>Zone / Area</label><input name="zone" placeholder="Zone or location" /></div>
    <div class="form-group"><label>Date &amp; Time</label><input name="whenLocal" type="datetime-local" /></div>
    <div class="form-group"><label>AOR</label><input name="reporter" placeholder="Area of responsibility" /></div>
    <div class="form-group"><label>Casualties</label><input name="casualties" placeholder="None / number / brief note" /></div>
    <div class="form-group"><label>Nature of incident</label><input name="natureOfIncident" placeholder="e.g. IED, fire, collision" /></div>
    <div class="form-group form-full"><label>Area (Geo coordinates)</label><input name="areaGeo" placeholder="Lat, long or MGRS" /></div>
    <div class="form-group form-full"><label>Description</label><textarea name="summary" rows="4" placeholder="Full incident description..." required></textarea></div>
    ${getReportAddAttachmentsHtml()}
  </div>
  <div class="form-actions"><button class="btn btn-outline" type="button" onclick="closeModal()">Cancel</button><button class="btn btn-red" type="submit">➕ Add Incident Report</button></div>
</form>`;
}

function getAddInfoReportModalHtml() {
  const suggestedId = nextInfoReportId();
  const stOpts = ["Open", "In Progress", "Under Review", "Approved", "Filed", "Closed"]
    .map((o) => `<option value="${o}">${o}</option>`)
    .join("");
  return `<form id="info-report-add-form" onsubmit="event.preventDefault(); infoReportAddSubmit();">
  <div class="form-grid">
    <div class="form-group"><label>ID</label><input name="reportId" value="${escapeHtml(
      suggestedId
    )}" placeholder="e.g. INF-015" required /></div>
    <div class="form-group form-full"><label>Report title</label><input name="title" placeholder="Brief title" required /></div>
    <div class="form-group"><label>Category</label><select name="category"><option>OSINT</option><option>Media</option><option>Open Source</option><option>General</option></select></div>
    <div class="form-group"><label>Severity / Level</label><input name="severity" list="info-report-severity-suggestions" placeholder="Type any level (e.g. HIGH, MEDIUM)" /></div>
    <div class="form-group"><label>Zone / Area</label><input name="zone" placeholder="Affected zone" /></div>
    <div class="form-group"><label>Date</label><input name="reportDate" type="date" /></div>
    <div class="form-group"><label>Status</label><select name="status">${stOpts}</select></div>
    <div class="form-group form-full"><label>Area (Geo Coordinates)</label><input name="areaGeo" placeholder="Lat, long or MGRS" /></div>
    <div class="form-group"><label>Source category</label><input name="reporter" placeholder="e.g. OSINT, Media, HUMINT" /></div>
    <div class="form-group form-full"><label>Summary</label><textarea name="summary" rows="4" placeholder="Information summary..." required></textarea></div>
    <div class="form-group form-full"><label>Sources / References</label><textarea name="sources" rows="3" placeholder="Sources, links, refs..."></textarea></div>
    ${getReportAddAttachmentsHtml()}
  </div>
  <datalist id="info-report-severity-suggestions"><option value="CRITICAL"></option><option value="HIGH"></option><option value="MEDIUM"></option><option value="LOW"></option></datalist>
  <div class="form-actions"><button class="btn btn-outline" type="button" onclick="closeModal()">Cancel</button><button class="btn btn-primary" type="submit">➕ Add Info Report</button></div>
</form>`;
}

function getAddPorsModalHtml() {
  const suggestedId = nextPorsReportId();
  const stOpts = ["Open", "In Progress", "Under Review", "Approved", "Filed", "Closed"]
    .map((o) => `<option value="${o}">${o}</option>`)
    .join("");
  const clsOpts = ["Unclassified", "Restricted", "Confidential"]
    .map((c) => `<option value="${c}" ${c === "Restricted" ? "selected" : ""}>${c}</option>`)
    .join("");
  return `<form id="pors-report-add-form" onsubmit="event.preventDefault(); porsReportAddSubmit();">
  <div class="form-grid">
    <div class="form-group"><label>ID</label><input name="reportId" value="${escapeHtml(
      suggestedId
    )}" placeholder="e.g. PORS-043" required /></div>
    <div class="form-group form-full"><label>PORS title</label><input name="title" placeholder="Patrol / observation title" required /></div>
    <div class="form-group"><label>Severity / Level</label><input name="severity" list="pors-report-severity-suggestions" placeholder="Type any level (e.g. HIGH, MEDIUM)" /></div>
    <div class="form-group"><label>Sector / Grid</label><input name="operation" placeholder="Grid ref or sector code" /></div>
    <div class="form-group"><label>Zone / Area</label><input name="zone" placeholder="Area of observation" /></div>
    <div class="form-group"><label>Date &amp; Time</label><input name="whenLocal" type="datetime-local" /></div>
    <div class="form-group"><label>Status</label><select name="status">${stOpts}</select></div>
    <div class="form-group form-full"><label>Area (Geo Coordinates)</label><input name="areaGeo" placeholder="Lat, long or MGRS" /></div>
    <div class="form-group"><label>Source category</label><input name="reporter" placeholder="e.g. Patrol, UAV, Liaison" /></div>
    <div class="form-group"><label>Classification</label><select name="classification">${clsOpts}</select></div>
    <div class="form-group form-full"><label>Observations</label><textarea name="summary" rows="4" placeholder="Patrol observations, contacts, terrain..." required></textarea></div>
    ${getReportAddAttachmentsHtml()}
  </div>
  <datalist id="pors-report-severity-suggestions"><option value="CRITICAL"></option><option value="HIGH"></option><option value="MEDIUM"></option><option value="LOW"></option></datalist>
  <div class="form-actions"><button class="btn btn-outline" type="button" onclick="closeModal()">Cancel</button><button class="btn btn-primary" type="submit">➕ Add PORS Report</button></div>
</form>`;
}

function getAddThreatModalHtml() {
  const suggestedId = nextThreatReportId();
  const stOpts = ["Open", "In Progress", "Under Review", "Approved", "Filed", "Closed"]
    .map((o) => `<option value="${o}">${o}</option>`)
    .join("");
  return `<form id="threat-assessment-add-form" onsubmit="event.preventDefault(); threatAssessmentAddSubmit();">
  <div class="form-grid">
    <div class="form-group"><label>ID</label><input name="reportId" value="${escapeHtml(
      suggestedId
    )}" placeholder="e.g. THR-008" required /></div>
    <div class="form-group form-full"><label>Report title</label><input name="title" placeholder="Brief title" required /></div>
    <div class="form-group"><label>Risk level</label><input name="severity" list="threat-risk-level-suggestions" placeholder="Type any level (e.g. HIGH, CRITICAL)" /></div>
    <div class="form-group"><label>Zone</label><select name="zone">${getThreatZoneSelectHtml(
      OPERATIONAL_ZONE_LABELS[0]
    )}</select></div>
    <div class="form-group"><label>Status</label><select name="status">${stOpts}</select></div>
    <div class="form-group"><label>Date</label><input name="reportDate" type="date" /></div>
    <div class="form-group form-full"><label>Area (Geo Coordinates)</label><input name="areaGeo" placeholder="Lat, long or MGRS" /></div>
    <div class="form-group"><label>Source category</label><input name="reporter" placeholder="e.g. HUMINT, OSINT, SIGINT" /></div>
    <div class="form-group form-full"><label>Threat description</label><textarea name="summary" rows="4" placeholder="Detail the threat..." required></textarea></div>
    <div class="form-group form-full"><label>Recommended action</label><textarea name="recommended" rows="3" placeholder="Recommended response..."></textarea></div>
    ${getReportAddAttachmentsHtml()}
  </div>
  <datalist id="threat-risk-level-suggestions"><option value="CRITICAL"></option><option value="HIGH"></option><option value="MEDIUM"></option><option value="LOW"></option></datalist>
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
    if (row.closest("#reports-panel-incident") && d.kind === "incident" && cells.length >= 10) {
      cells[0].innerHTML = `<strong>${escapeHtml(d.title)}</strong>`;
      cells[1].innerHTML = _reportTagSpan(d.severity);
      cells[2].textContent = d.zone;
      cells[3].textContent = d.areaGeo || "—";
      cells[4].textContent = formatTableDate(d.when);
      cells[5].textContent = d.reporter;
      cells[6].innerHTML = buildIncidentDescriptionCellHtml(reportId, d.summary);
      cells[7].textContent = d.natureOfIncident || "—";
      cells[8].textContent = d.casualties || "—";
      return;
    }
    if (cells.length < 9) return;
    cells[1].innerHTML = `<strong>${escapeHtml(d.title)}</strong>`;
    cells[2].innerHTML = _reportTagSpan(d.severity);
    cells[3].textContent = d.zone;
    cells[4].textContent = reportsPanelGeoColumnText(d);
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

  const severityField =
    d.kind === "threat"
      ? `<div class="form-group"><label>Risk level</label><input name="severity" list="threat-edit-risk-level-suggestions" value="${escapeHtml(
          curSev
        )}" placeholder="Any level (e.g. HIGH or custom)" /></div>`
      : d.kind === "info" || d.kind === "pors"
        ? `<div class="form-group"><label>Severity / Level</label><input name="severity" list="info-pors-edit-severity-suggestions" value="${escapeHtml(
            curSev
          )}" placeholder="Any level (e.g. HIGH or custom)" /></div>`
        : `<div class="form-group"><label>Severity / Level</label><select name="severity">${sevOptions}</select></div>`;

  let extraFields = "";
  if (d.kind === "threat") {
    extraFields += `<div class="form-group form-full"><label>Area (Geo coordinates)</label><input name="areaGeo" value="${escapeHtml(
      d.areaGeo != null ? String(d.areaGeo) : ""
    )}" placeholder="Lat, long or MGRS" /></div>`;
    extraFields += `<div class="form-group form-full"><label>Recommended action</label><textarea name="recommended" rows="3">${escapeHtml(
      d.recommended || ""
    )}</textarea></div>`;
  }
  if (d.kind === "info") {
    extraFields += `<div class="form-group form-full"><label>Area (Geo coordinates)</label><input name="areaGeo" value="${escapeHtml(
      d.areaGeo != null ? String(d.areaGeo) : ""
    )}" placeholder="Lat, long or MGRS" /></div>`;
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
    extraFields += `<div class="form-group form-full"><label>Area (Geo coordinates)</label><input name="areaGeo" value="${escapeHtml(
      d.areaGeo != null ? String(d.areaGeo) : ""
    )}" placeholder="Lat, long or MGRS" /></div>`;
  }
  if (d.kind === "incident") {
    extraFields += `<div class="form-group"><label>Casualties</label><input name="casualties" value="${escapeHtml(
      d.casualties != null ? String(d.casualties) : ""
    )}" placeholder="None / count / brief" /></div>`;
    extraFields += `<div class="form-group"><label>Nature of incident</label><input name="natureOfIncident" value="${escapeHtml(
      d.natureOfIncident != null ? String(d.natureOfIncident) : ""
    )}" placeholder="e.g. IED, fire" /></div>`;
    extraFields += `<div class="form-group form-full"><label>Area (Geo coordinates)</label><input name="areaGeo" value="${escapeHtml(
      d.areaGeo != null ? String(d.areaGeo) : ""
    )}" placeholder="Lat, long or MGRS" /></div>`;
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

  const editTitleLabel = d.kind === "incident" ? "Incident serial" : "Title";
  const editReporterLabel =
    d.kind === "incident"
      ? "AOR"
      : d.kind === "threat" || d.kind === "info" || d.kind === "pors"
        ? "Source category"
        : "Reported by";

  return `
<form id="report-detail-edit-form" class="report-edit-form" onsubmit="event.preventDefault(); reportDetailSaveEdit();">
  <div class="form-grid">
    <div class="form-group"><label>Report ID</label><input class="report-edit-readonly" name="reportId" value="${escapeHtml(
      reportId
    )}" readonly /></div>
    <div class="form-group form-full"><label>${editTitleLabel}</label><input name="title" value="${escapeHtml(
      d.title
    )}" required /></div>
    ${severityField}
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
    <div class="form-group"><label>${editReporterLabel}</label><input name="reporter" value="${escapeHtml(
      d.reporter
    )}" /></div>
    ${extraFields}
    <div class="form-group form-full"><label>Description</label><textarea name="summary" rows="5" required>${escapeHtml(
      d.summary
    )}</textarea></div>
  </div>
  ${
    d.kind === "threat"
      ? `<datalist id="threat-edit-risk-level-suggestions"><option value="CRITICAL"></option><option value="HIGH"></option><option value="MEDIUM"></option><option value="LOW"></option></datalist>`
      : d.kind === "info" || d.kind === "pors"
        ? `<datalist id="info-pors-edit-severity-suggestions"><option value="CRITICAL"></option><option value="HIGH"></option><option value="MEDIUM"></option><option value="LOW"></option></datalist>`
        : ""
  }
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

  const titleLabel = d.kind === "incident" ? "Incident serial" : "Title";
  const reporterLabel =
    d.kind === "incident"
      ? "AOR"
      : d.kind === "threat" || d.kind === "info" || d.kind === "pors"
        ? "Source category"
        : "Reported by";

  let fields =
    pf("Report ID", escapeHtml(reportId)) +
    pf(titleLabel, escapeHtml(d.title)) +
    pf(d.kind === "threat" ? "Risk level" : "Severity / Level", _reportTagSpan(d.severity)) +
    pf("Zone", escapeHtml(d.zone)) +
    pf(d.kind === "pors" ? "Sector / Grid" : "Operation / Ref", escapeHtml(d.operation)) +
    pf("Date & time", escapeHtml(d.when)) +
    pf(reporterLabel, escapeHtml(d.reporter)) +
    pf("Status", _reportTagSpan(d.status));

  if (d.kind === "threat" || d.kind === "info" || d.kind === "pors") {
    fields += pf(
      "Area (Geo coordinates)",
      escapeHtml(d.areaGeo != null && String(d.areaGeo).trim() !== "" ? String(d.areaGeo) : "—")
    );
  }

  if (d.kind === "incident") {
    fields +=
      pf("Casualties", escapeHtml(d.casualties != null ? String(d.casualties) : "—")) +
      pf("Nature of incident", escapeHtml(d.natureOfIncident != null ? String(d.natureOfIncident) : "—")) +
      pf("Area (Geo coordinates)", escapeHtml(d.areaGeo != null ? String(d.areaGeo) : "—"));
  }

  if (d.kind === "threat") {
    fields +=
      `<div class="pf-item pf-item--wide"><div class="pf-label">Recommended action</div><div class="pf-val">${escapeHtml(
        d.recommended != null && String(d.recommended).trim() !== "" ? String(d.recommended) : "—"
      )}</div></div>`;
  }

  if (d.kind === "info") {
    fields += pf(
      "Category",
      escapeHtml(d.category != null && String(d.category).trim() !== "" ? String(d.category) : "—")
    );
    fields +=
      `<div class="pf-item pf-item--wide"><div class="pf-label">Sources / references</div><div class="pf-val">${escapeHtml(
        d.sources != null && String(d.sources).trim() !== "" ? String(d.sources) : "—"
      )}</div></div>`;
  }

  if (d.kind === "pors") {
    fields += pf(
      "Classification",
      escapeHtml(d.classification != null && String(d.classification).trim() !== "" ? String(d.classification) : "—")
    );
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
  if (!d) {
    alert("Report not found. It may have been deleted, or the list is out of date — try refreshing the page.");
    return;
  }

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

  if (d.kind === "threat") {
    d.areaGeo = getv("areaGeo");
    d.recommended = getv("recommended");
  }
  if (d.kind === "info") {
    d.areaGeo = getv("areaGeo");
    d.category = getv("category");
    d.sources = getv("sources");
  }
  if (d.kind === "pors") {
    d.classification = getv("classification");
    d.areaGeo = getv("areaGeo");
  }
  if (d.kind === "incident") {
    d.casualties = getv("casualties");
    d.natureOfIncident = getv("natureOfIncident");
    d.areaGeo = getv("areaGeo");
  }

  syncReportTableRow(id, d);
  if (d.kind === "threat") renderAllThreatReportTables();
  reportDetailShowView();
}

function reportDetailDelete() {
  const id = __reportDetailContext.id;
  if (!id) return;
  if (!confirm(`Delete report ${id}? This cannot be undone.`)) return;
  delete REPORT_DETAILS[id];
  refreshAllReportPanelTables();
  closeModal();
}

/** Operations list detail / edit (same modal pattern as Reports). */
const OPERATIONS_DETAILS = {
  "OP-001": {
    category: "Counter-Terror",
    categoryTag: "tag-red",
    lifecycle: "Active",
    lifecycleTag: "tag-green",
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
    lifecycle: "Developing",
    lifecycleTag: "tag-orange",
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
    lifecycle: "Developing",
    lifecycleTag: "tag-orange",
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
    lifecycle: "Completed",
    lifecycleTag: "tag-blue",
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

/** null = show all operations; otherwise filter table by lifecycle status. */
let __operationsLifecycleFilter = null;

const OPERATIONS_LIFECYCLE_KEYS = ["Active", "Developing", "Completed"];

function normalizeOperationLifecycleKey(raw) {
  const t = String(raw || "").trim().toLowerCase();
  if (t === "active") return "Active";
  if (t === "developing") return "Developing";
  if (t === "completed") return "Completed";
  return "";
}

function getOperationsLifecycleCounts() {
  const c = { Active: 0, Developing: 0, Completed: 0 };
  Object.keys(OPERATIONS_DETAILS).forEach((id) => {
    const k = normalizeOperationLifecycleKey(OPERATIONS_DETAILS[id].lifecycle);
    if (k && c[k] !== undefined) c[k] += 1;
  });
  return c;
}

function updateOperationsLifecycleFilterButtons() {
  document.querySelectorAll("#p-operations .op-lifecycle-filter-btn").forEach((btn) => {
    const key = btn.getAttribute("data-op-lifecycle");
    const on = __operationsLifecycleFilter != null && key === __operationsLifecycleFilter;
    btn.classList.toggle("prism-stat-btn--active", on);
    btn.setAttribute("aria-pressed", on ? "true" : "false");
  });
}

function applyOperationsLifecycleTableFilter() {
  document.querySelectorAll("#p-operations tr[data-operation-id]").forEach((row) => {
    const id = row.getAttribute("data-operation-id");
    const d = id ? OPERATIONS_DETAILS[id] : null;
    const canon = normalizeOperationLifecycleKey(d?.lifecycle ?? row.getAttribute("data-lifecycle"));
    const show =
      __operationsLifecycleFilter === null || canon === __operationsLifecycleFilter;
    row.hidden = !show;
  });
}

function refreshOperationsLifecycleUI() {
  const counts = getOperationsLifecycleCounts();
  const elA = document.getElementById("operations-count-active");
  const elD = document.getElementById("operations-count-developing");
  const elC = document.getElementById("operations-count-completed");
  if (elA) elA.textContent = String(counts.Active);
  if (elD) elD.textContent = String(counts.Developing);
  if (elC) elC.textContent = String(counts.Completed);
  updateOperationsLifecycleFilterButtons();
  applyOperationsLifecycleTableFilter();
}

function setOperationsLifecycleFilter(lifecycle) {
  if (!OPERATIONS_LIFECYCLE_KEYS.includes(lifecycle)) return;
  if (__operationsLifecycleFilter === lifecycle) __operationsLifecycleFilter = null;
  else __operationsLifecycleFilter = lifecycle;
  refreshOperationsLifecycleUI();
}

function initOperationsLifecycleRowsFromData() {
  document.querySelectorAll("#p-operations tr[data-operation-id]").forEach((row) => {
    const id = row.getAttribute("data-operation-id");
    const d = id ? OPERATIONS_DETAILS[id] : null;
    if (d) {
      const canon = normalizeOperationLifecycleKey(d.lifecycle);
      row.setAttribute("data-lifecycle", canon || "");
    }
  });
}

function categoryLabelToTagCls(label) {
  const l = (label || "").trim().toLowerCase();
  if (l.includes("counter") || l.includes("terror")) return "tag-red";
  if (l.includes("cordon")) return "tag-blue";
  if (l.includes("surveillance")) return "tag-orange";
  if (l.includes("strike")) return "tag-purple";
  return "tag-teal";
}

function operationLifecycleTagCls(label) {
  const l = (label || "").trim().toLowerCase();
  if (l === "active") return "tag-green";
  if (l === "developing") return "tag-orange";
  if (l === "completed") return "tag-blue";
  return "tag-teal";
}

function operationLifecycleOptionsHtml(selected) {
  const opts = ["Active", "Developing", "Completed"];
  const cur = (selected || "").trim();
  let html = "";
  if (cur && !opts.includes(cur)) {
    html += `<option value="${escapeHtml(cur)}" selected>${escapeHtml(cur)}</option>`;
  }
  html += opts
    .map((o) => `<option value="${escapeHtml(o)}"${o === cur ? " selected" : ""}>${escapeHtml(o)}</option>`)
    .join("");
  return html;
}

function buildOperationDetailHtml(d, opId) {
  const pf = (label, innerHtml) =>
    `<div class="pf-item"><div class="pf-label">${escapeHtml(label)}</div><div class="pf-val">${innerHtml}</div></div>`;

  return `
<div class="profile-fields report-detail-fields">
  ${pf("Operation ID", escapeHtml(opId))}
  ${pf("Category", `<span class="tag ${d.categoryTag}">${escapeHtml(d.category)}</span>`)}
  ${pf(
    "Status",
    `<span class="tag ${d.lifecycleTag || operationLifecycleTagCls(d.lifecycle)}">${escapeHtml(d.lifecycle || "—")}</span>`
  )}
  ${pf("Name", escapeHtml(d.name))}
  ${pf("Area (Geo Coordinates)", escapeHtml(d.location))}
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
    <div class="form-group"><label>Status</label><select name="lifecycle" required>${operationLifecycleOptionsHtml(
      d.lifecycle
    )}</select></div>
    <div class="form-group"><label>Name</label><input name="name" value="${escapeHtml(d.name)}" required /></div>
    <div class="form-group"><label>Area (Geo Coordinates)</label><input name="location" value="${escapeHtml(
      d.location
    )}" /></div>
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
  d.lifecycle = getv("lifecycle") || d.lifecycle || "Active";
  d.lifecycleTag = operationLifecycleTagCls(d.lifecycle);
  d.name = getv("name") || d.name;
  d.location = getv("location");
  d.date = getv("date");
  d.mode = getv("mode");
  d.caseOfficer = getv("caseOfficer");
  d.operator = getv("operator");
  d.remarks = getv("remarks");

  syncOperationTableRow(id, d);
  refreshOperationsLifecycleUI();
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
  refreshOperationsLifecycleUI();
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
  row.setAttribute(
    "data-lifecycle",
    normalizeOperationLifecycleKey(d.lifecycle) || ""
  );
  cells[0].innerHTML = `<span class="tag ${d.categoryTag}">${escapeHtml(d.category)}</span>`;
  cells[1].innerHTML = `<strong>${escapeHtml(d.name)}</strong>`;
  cells[2].textContent = d.location;
  cells[3].textContent = d.date;
  cells[4].textContent = d.mode;
  cells[5].textContent = d.caseOfficer;
  cells[6].textContent = d.operator;
  cells[7].textContent = d.remarks;
}

function prRecordStatusOptionsHtml(selected) {
  const opts = [
    "Active",
    "Eliminated",
    "Arrested",
    "SSG OPS",
    "SST OPS",
    "Tech/Cyber OPS",
    "Arial OPS",
    "Matured OPS",
    "Developing OPS",
  ];
  const cur = (selected || "Active").trim();
  return opts
    .map(
      (o) =>
        `<option value="${escapeHtml(o)}"${cur === o ? " selected" : ""}>${escapeHtml(o)}</option>`
    )
    .join("");
}

function getPersonnelRecordFormHtml(recordType, preset, options) {
  const p = preset && typeof preset === "object" ? preset : {};
  const opt = { includeFooter: true, autoSerialReadonly: false, ...options };
  const safeType = recordType === "commander" ? "commander" : "member";
  const typeLabel = safeType === "commander" ? "Tashkeel Commander" : "Tashkeel Member";
  const nameStrongPh =
    safeType === "commander" ? "Commander full name" : "Full name";
  const v = (k, d = "") =>
    escapeHtml(p[k] != null && p[k] !== undefined ? String(p[k]) : d);

  const commanderMemberMappingField =
    safeType === "member"
      ? `<div class="pr-field">
      <label>Assigned Commander</label>
      <select name="assigned_commander" onchange="syncMemberTashkeelFromCommander(this.form)">
        <option value="" disabled${!p.assignedCommander ? " selected" : ""}>Select commander</option>
        ${getCommanderSelectOptions(p.assignedCommander || "")}
      </select>
    </div>`
      : "";

  const tashkeelFieldCommander = `
    <div class="pr-field">
      <label>Tashkeel</label>
      <input type="text" name="f_tashkeel" placeholder="Group/Org" value="${v("tashkeel")}" />
    </div>`;

  const tashkeelFieldMember = `
    <div class="pr-field">
      <label>Tashkeel</label>
      <input type="text" name="f_tashkeel" placeholder="Same as commander's Tashkeel" readonly class="report-edit-readonly" title="Inherited from assigned commander" value="${v("tashkeel")}" />
    </div>`;

  const caseOfficerField =
    safeType === "member"
      ? `<div class="pr-field">
      <label>Case Officer</label>
      <input type="text" name="f_case_officer" placeholder="Assigned officer" value="${v("caseOfficer")}" />
    </div>`
      : "";

  const calInput = (name, dateValue) => {
    const raw = dateValue != null ? String(dateValue).trim() : "";
    const val = /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : "";
    return `
    <div class="pr-cal-wrap">
      <input type="date" name="${name}" class="pr-date-native" value="${escapeHtml(val)}" aria-label="${name}" />
      <span class="pr-cal-ico" aria-hidden="true">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
      </span>
    </div>`;
  };

  const footerBlock =
    opt.includeFooter !== false
      ? `<div class="personnel-footer">
  <button type="button" class="btn-cancel" onclick="closeModal()">Cancel</button>
  <button type="button" class="btn-save"><span aria-hidden="true">💾</span> Save Record</button>
</div>`
      : "";

  return `
<div class="pr-status-row" style="margin:0 0 12px 0;">
  <span class="pr-status-pill">${typeLabel}</span>
</div>
<div class="pr-form-layout">
  <div class="pr-fields-grid" role="group" aria-label="Personnel fields">
    <div class="pr-field">
      <label>Ser #</label>
      <input type="text" name="f_sr" placeholder="Auto" autocomplete="off" value="${v("sr")}"${opt.autoSerialReadonly ? ' readonly class="report-edit-readonly" title="Assigned automatically"' : ""} />
    </div>
    <div class="pr-field">
      <label>${safeType === "commander" ? "Commander name" : "Name"}</label>
      <input type="text" name="f_name_strong" placeholder="${nameStrongPh}" autocomplete="name" value="${v("nameStrong")}" />
    </div>
    <div class="pr-field">
      <label>S/O</label>
      <input type="text" name="f_name_sub" placeholder="S/O Father name" value="${v("nameSon")}" />
    </div>
    <div class="pr-field">
      <label>Alias</label>
      <input type="text" name="f_alias" placeholder="Known alias" value="${v("alias")}" />
    </div>
    <div class="pr-field">
      <label>CNIC</label>
      <input type="text" name="f_cnic" placeholder="XXXXX-XXXXXXX-X" inputmode="numeric" maxlength="15" autocomplete="off" value="${v("cnic")}" oninput="prFormCnicInput(this)" />
    </div>
    <div class="pr-field">
      <label>Cell # / IMEI</label>
      <input type="text" name="f_cell" placeholder="0300-1234567" inputmode="numeric" maxlength="12" autocomplete="off" value="${v("cell")}" oninput="prFormCellInput(this)" />
    </div>

    ${safeType === "member" ? commanderMemberMappingField + tashkeelFieldMember : tashkeelFieldCommander}
    <div class="pr-field">
      <label>DOB</label>
      ${calInput("dob", p.dob)}
    </div>
    <div class="pr-field">
      <label>Age</label>
      <input type="text" name="f_age" placeholder="Age" inputmode="numeric" maxlength="3" pattern="[0-9]*" autocomplete="off" value="${v("age")}" oninput="prFormAgeInput(this)" />
    </div>
    <div class="pr-field">
      <label>Caste</label>
      <input type="text" name="f_caste" placeholder="Caste" value="${v("caste")}" />
    </div>
    <div class="pr-field">
      <label>Marital Status</label>
      <select name="f_marital">
        <option${(p.marital || "Single") === "Single" ? " selected" : ""}>Single</option>
        <option${p.marital === "Married" ? " selected" : ""}>Married</option>
        <option${p.marital === "Widowed" ? " selected" : ""}>Widowed</option>
        <option${p.marital === "Divorced" ? " selected" : ""}>Divorced</option>
      </select>
    </div>

    <div class="pr-field">
      <label>Area</label>
      <input type="text" name="f_area" placeholder="Zone/District" value="${v("area")}" />
    </div>
    <div class="pr-field">
      <label>HM (Head Money)</label>
      <input type="text" name="f_hm" placeholder="PKR amount" value="${v("hm")}" />
    </div>
    <div class="pr-field">
      <label>Banking Details</label>
      <input type="text" name="f_banking" placeholder="Bank/IBAN" value="${v("banking")}" />
    </div>
    <div class="pr-field">
      <label>SMNS</label>
      <input type="text" name="f_smns" placeholder="FB/TG/WA handles" value="${v("smns")}" />
    </div>
    <div class="pr-field">
      <label>FIRs</label>
      <input type="text" name="f_firs" placeholder="FIR numbers" value="${v("firs")}" />
    </div>

    <div class="pr-field">
      <label>TS Activities</label>
      <input type="text" name="f_ts" placeholder="Activities involved" value="${v("tsActivities")}" />
    </div>
    <div class="pr-field">
      <label>Family Tree</label>
      <input type="text" name="f_family" placeholder="Family details" value="${v("familyTree")}" />
    </div>
    ${caseOfficerField}
    <div class="pr-field">
      <label>Area Active</label>
      <input type="text" name="f_area_active" placeholder="Active areas" value="${v("areaActive")}" />
    </div>
    <div class="pr-field">
      <label>GP</label>
      <input type="text" name="f_gp" placeholder="GP number" value="${v("gp")}" />
    </div>

    <div class="pr-field">
      <label>Years Active</label>
      <input type="text" name="f_years" placeholder="Years" value="${v("yearsActive")}" />
    </div>
    <div class="pr-field">
      <label>Position</label>
      <input type="text" name="f_position" placeholder="Role/Position" value="${v("position")}" />
    </div>
    <div class="pr-field">
      <label>Misc</label>
      <input type="text" name="f_misc" placeholder="Misc info" value="${v("misc")}" />
    </div>
    <div class="pr-field">
      <label>Remarks</label>
      <input type="text" name="f_remarks" placeholder="Remarks" value="${v("remarks")}" />
    </div>
    <div class="pr-field">
      <label>Date Updated</label>
      ${calInput("date_updated", p.dateUpdated)}
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
  <select id="pr-record-status" class="pr-status-select" name="f_status" aria-label="Record status">
    ${prRecordStatusOptionsHtml(p.status)}
  </select>
</div>

<div class="pr-details-block">
  <textarea name="f_details" rows="4" placeholder="Details will be added here as Paragraph..." aria-label="Details paragraph">${v("details")}</textarea>
</div>

<div class="pr-files-section">
  <div class="pr-files-toolbar pr-files-toolbar--upload-only">
    <input type="file" id="pr-personnel-file-input" multiple accept="${PR_ATTACHMENT_ACCEPT}" style="display:none" aria-hidden="true" onchange="personnelAttachmentsOnPick(event)" />
    <input type="hidden" name="pr_attachments_json" value="[]" />
    <button type="button" class="btn-file-up" onclick="document.getElementById('pr-personnel-file-input').click()"><span class="pr-ico-up" aria-hidden="true">⬆</span> Upload File</button>
  </div>
  <div class="pr-files-slots-row">
    <span class="pr-files-label">Uploaded Files:</span>
    <div class="pr-attachments-list-display report-files-box" aria-live="polite"></div>
  </div>
</div>
${footerBlock}`;
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
    <div class="pf-item"><div class="pf-label">Area</div><div class="pf-val">Zone 6: Dera Ismail Khan</div></div>
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

/** New Operation modal — mission Category (free text) + Status (Active / Developing / Completed). */
const NEW_OPERATION_FORM = `<div class="form-grid">
    <div class="form-group"><label>Category</label><input placeholder="e.g. Counter-Terror, Surveillance" /></div>
    <div class="form-group"><label>Status</label><select><option>Active</option><option>Developing</option><option>Completed</option></select></div>
    <div class="form-group"><label>Name</label><input placeholder="Operation or record name" /></div>
    <div class="form-group"><label>Area (Geo Coordinates)</label><input placeholder="e.g. 34.0151° N, 71.5249° E" /></div>
    <div class="form-group"><label>Date</label><input type="date" /></div>
    <div class="form-group"><label>Mode</label><input placeholder="Enter mode (any value)" /></div>
    <div class="form-group"><label>Case Officer</label><input placeholder="Name / rank" /></div>
    <div class="form-group"><label>Operator</label><input placeholder="Assigned operator" /></div>
    <div class="form-group form-full"><label>Remarks</label><textarea placeholder="Remarks" rows="3"></textarea></div>
  </div>`;

/** Add Operator modal — shared layout, operator-specific category text. */
const OPERATOR_ENTRY_FORM = `<div class="form-grid">
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
  addOp: `${NEW_OPERATION_FORM}
  <div class="form-actions"><button class="btn btn-outline" type="button" onclick="closeModal()">Cancel</button><button class="btn btn-primary" type="button">⚔️ Create Operation</button></div>`,

  addCmd: `<div class="form-grid">
    <div class="form-group"><label>Name S/O</label><input placeholder="Commander full name"></div>
    <div class="form-group"><label>Alias</label><input placeholder="Known alias"></div>
    <div class="form-group"><label>Tashkeel / Group</label><input placeholder="Affiliated group"></div>
    <div class="form-group"><label>Area</label><input placeholder="Last known area"></div>
    <div class="form-group"><label>CNIC</label><input placeholder="XXXXX-XXXXXXX-X"></div>
    <div class="form-group"><label>Head Money (PKR)</label><input placeholder="Amount"></div>
    <div class="form-group"><label>Case Officer</label><input placeholder="Assigned officer"></div>
    <div class="form-group"><label>Status</label><select><option>Active</option><option>Eliminated</option><option>Arrested</option><option>SSG OPS</option><option>SST OPS</option><option>Tech/Cyber OPS</option><option>Arial OPS</option><option>Matured OPS</option><option>Developing OPS</option></select></div>
    <div class="form-group form-full"><label>Intel Notes</label><textarea placeholder="Background, networks, activities..."></textarea></div>
  </div>
  <div class="form-actions"><button class="btn btn-outline" type="button" onclick="closeModal()">Cancel</button><button class="btn btn-primary" type="button">💾 Save</button></div>`,

  addOperator: `${OPERATOR_ENTRY_FORM}
  <div class="form-actions"><button class="btn btn-outline" type="button" onclick="closeModal()">Cancel</button><button class="btn btn-primary" type="button">💾 Add Operator</button></div>`,
};

document.getElementById("modal")?.addEventListener("click", function (e) {
  if (e.target === this) closeModal();
});

/** Threat response page — status boxes + soldier rows (swap THREAT_RESPONSE_RECORDS for API / DB later). */
const THREAT_RESPONSE_RECORDS = [
  { id: "TR-001", sr: "S-101", name: "Ahmad S/O Karim", alias: "Shadow", tashkeel: "TTP-X", area: "Zone 1: Paharpur", hm: "25L", lastSeen: "28 Mar", officer: "Maj. Hamza", status: "active" },
  { id: "TR-002", sr: "S-102", name: "Hassan S/O Tariq", alias: "Iron Fist", tashkeel: "JuA", area: "Zone 6: Dera Ismail Khan", hm: "15L", lastSeen: "27 Mar", officer: "Capt. Faseeh", status: "arrested" },
  { id: "TR-003", sr: "S-103", name: "Zubair S/O Saleem", alias: "Ghost", tashkeel: "LeT", area: "Zone 3: Daraban", hm: "30L", lastSeen: "20 Feb", officer: "Maj. Rafay", status: "eliminated" },
  { id: "TR-004", sr: "S-104", name: "Imran S/O Nadeem", alias: "Viper", tashkeel: "TTP", area: "Zone 2: Kulachi", hm: "—", lastSeen: "Op Thunder", officer: "Capt. Bilal", status: "ssg" },
  { id: "TR-005", sr: "S-105", name: "Tariq S/O Jamil", alias: "Hawk", tashkeel: "JuA", area: "Zone 4: Drazanda", hm: "12L", lastSeen: "25 Mar", officer: "Maj. Hamza", status: "sst" },
  { id: "TR-006", sr: "S-106", name: "Faisal S/O Aslam", alias: "Cipher", tashkeel: "—", area: "Zone 6: Dera Ismail Khan", hm: "—", lastSeen: "29 Mar", officer: "Capt. Rafay", status: "tech_cyber" },
  { id: "TR-007", sr: "S-107", name: "Noman S/O Iqbal", alias: "Sky", tashkeel: "TTP-X", area: "Zone 1: Paharpur", hm: "18L", lastSeen: "26 Mar", officer: "Maj. Faseeh", status: "arial" },
  { id: "TR-008", sr: "S-108", name: "Waseem S/O Khalid", alias: "Rust", tashkeel: "LeT", area: "Zone 5: Paroa", hm: "8L", lastSeen: "15 Mar", officer: "Capt. Bilal", status: "matured" },
  { id: "TR-009", sr: "S-109", name: "Sohail S/O Majid", alias: "Nova", tashkeel: "TTP", area: "Zone 5: Paroa", hm: "—", lastSeen: "01 Apr", officer: "Maj. Hamza", status: "developing" },
  { id: "TR-010", sr: "S-110", name: "Bilal S/O Farooq", alias: "Wolf", tashkeel: "JuA", area: "Zone 2: Kulachi", hm: "22L", lastSeen: "30 Mar", officer: "Capt. Faseeh", status: "active" },
  { id: "TR-011", sr: "S-111", name: "Usman S/O Rashid", alias: "Storm", tashkeel: "TTP-X", area: "Zone 4: Drazanda", hm: "—", lastSeen: "22 Mar", officer: "Maj. Rafay", status: "arrested" },
  { id: "TR-012", sr: "S-112", name: "Kamran S/O Saeed", alias: "Edge", tashkeel: "LeT", area: "Zone 3: Daraban", hm: "35L", lastSeen: "18 Mar", officer: "Maj. Faseeh", status: "ssg" },
];

const THREAT_STATUS_LABEL = {
  eliminated: "Eliminated",
  arrested: "Arrested",
  active: "Active",
  ssg: "SSG OPS",
  sst: "SST OPS",
  tech_cyber: "Tech/Cyber OPS",
  arial: "Arial OPS",
  matured: "Matured OPS",
  developing: "Developing OPS",
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
    arial: "tr-tag tr-tag--arial",
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
  "zone-query":
    "🔍 <strong>Zone 6 (Dera Ismail Khan) — Threat Assessment:</strong><br>• IED activity HIGH – 3 incidents this week<br>• CDR spike detected Mar 27<br>• <strong style=\"color:var(--red);\">Recommend: Increase patrol frequency</strong><br><em style=\"font-size:.68rem;color:#888;\">AI Confidence: 87%</em>",
  cdr: "📡 <strong>CDR Pattern – Target Alpha:</strong><br>• 347 calls, 12 unique contacts<br>• Peak hours: 21:00–23:00",
  incident:
    "📋 <strong>Incident Summary:</strong><br>• 3 incidents filed this week<br>• Zone 6 (Dera Ismail Khan) most active",
  default:
    "🤖 Based on current records, review CDR patterns across the six operational zones and cross-reference with active incident reports.",
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
    ? "zone-query"
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
  refreshAllReportPanelTables();
  renderTashkeelOfficersTable();
  if (document.getElementById("p-operations")) {
    initOperationsLifecycleRowsFromData();
    refreshOperationsLifecycleUI();
  }
});
