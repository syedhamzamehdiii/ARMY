/**
 * Operator Command Panel — client-side navigation & modals.
 * Personnel record modal matches the provided “Personnel Record” design.
 */

const titles = {
  dashboard: "Command Dashboard",
  database: "Database — Personnel Records",
  incidents: "Incident Reports",
  operations: "Operations",
  cdr: "CDRs / IPDRs · Analysis",
  ai: "AI Command Assistant",
  threats: "Threat Assessment",
  commanders: "Khwarjis Commanders",
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
}

function setTab(el) {
  el.parentElement.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
  el.classList.add("active");
}

function closeModal() {
  const m = document.getElementById("modal");
  if (m) {
    m.classList.remove("open");
    m.querySelector(".modal")?.classList.remove("modal-personnel");
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

  const modTitles = {
    addIncident: "File Incident Report",
    addOp: "New Operation",
    addThreat: "Submit Threat Report",
    addCmd: "Add Commander Record",
    uploadCDR: "Upload CDR / IPDR",
    addOperator: "Add Operator",
  };

  const htmlMap = {
    addIncident: modalsSimple.addIncident,
    addOp: modalsSimple.addOp,
    addThreat: modalsSimple.addThreat,
    addCmd: modalsSimple.addCmd,
    uploadCDR: modalsSimple.uploadCDR,
    addOperator: modalsSimple.addOperator,
  };

  titleEl.classList.remove("modal-title--personnel");
  titleEl.textContent = modTitles[type] || "Form";
  bodyEl.innerHTML = htmlMap[type] || "<p>Coming soon.</p>";
  overlay.classList.add("open");
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
  <div class="pr-status-pill">Status = Active</div>
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
  <div class="form-actions"><button class="btn btn-outline" type="button" onclick="closeModal()">Cancel</button><button class="btn btn-red" type="button">🚨 File Incident</button></div>`,

  addOp: `<div class="form-grid">
    <div class="form-group"><label>Code Name</label><input placeholder="e.g. OPERATION THUNDER"></div>
    <div class="form-group"><label>Type</label><select><option>Counter-Terror</option><option>Cordon & Search</option><option>Surveillance</option><option>Strike Op</option></select></div>
    <div class="form-group"><label>Area / Zone</label><input placeholder="Operational area"></div>
    <div class="form-group"><label>Personnel Count</label><input type="number" placeholder="0"></div>
    <div class="form-group"><label>Start Date</label><input type="date"></div>
    <div class="form-group"><label>Commanding Officer</label><input placeholder="CO Name / Rank"></div>
    <div class="form-group form-full"><label>Objectives</label><textarea placeholder="List objectives..."></textarea></div>
    <div class="form-group form-full"><label>Intel Notes</label><textarea placeholder="Background intel..."></textarea></div>
  </div>
  <div class="form-actions"><button class="btn btn-outline" type="button" onclick="closeModal()">Cancel</button><button class="btn btn-primary" type="button">⚔️ Create Operation</button></div>`,

  addThreat: `<div class="form-grid">
    <div class="form-group"><label>Report Title</label><input placeholder="Threat title"></div>
    <div class="form-group"><label>Risk Level</label><select><option>Critical</option><option>High</option><option>Medium</option><option>Low</option></select></div>
    <div class="form-group"><label>Zone / Area</label><input placeholder="Affected zone"></div>
    <div class="form-group"><label>Date</label><input type="date"></div>
    <div class="form-group form-full"><label>Threat Description</label><textarea placeholder="Detail the threat..."></textarea></div>
    <div class="form-group form-full"><label>Recommended Action</label><textarea placeholder="Recommended response..."></textarea></div>
  </div>
  <div class="form-actions"><button class="btn btn-outline" type="button" onclick="closeModal()">Cancel</button><button class="btn btn-red" type="button">⚠️ Submit Report</button></div>`,

  addCmd: `<div class="form-grid">
    <div class="form-group"><label>Name S/O</label><input placeholder="Commander full name"></div>
    <div class="form-group"><label>Alias</label><input placeholder="Known alias"></div>
    <div class="form-group"><label>Tashkeel / Group</label><input placeholder="Affiliated group"></div>
    <div class="form-group"><label>Area</label><input placeholder="Last known area"></div>
    <div class="form-group"><label>CNIC</label><input placeholder="XXXXX-XXXXXXX-X"></div>
    <div class="form-group"><label>Head Money (PKR)</label><input placeholder="Amount"></div>
    <div class="form-group"><label>Case Officer</label><input placeholder="Assigned officer"></div>
    <div class="form-group"><label>Status</label><select><option>At Large</option><option>Arrested</option><option>Neutralized</option></select></div>
    <div class="form-group form-full"><label>Intel Notes</label><textarea placeholder="Background, networks, activities..."></textarea></div>
  </div>
  <div class="form-actions"><button class="btn btn-outline" type="button" onclick="closeModal()">Cancel</button><button class="btn btn-primary" type="button">💾 Save</button></div>`,

  uploadCDR: `<div class="form-grid">
    <div class="form-group"><label>Target Name / ID</label><input placeholder="e.g. TGT-Alpha"></div>
    <div class="form-group"><label>Cell # / IMEI</label><input placeholder="0300-XXXXXXX"></div>
    <div class="form-group"><label>Data Type</label><select><option>CDR</option><option>IPDR</option><option>Both</option></select></div>
    <div class="form-group"><label>Period</label><input placeholder="e.g. Mar 2026"></div>
    <div class="form-group form-full"><label>Upload File</label><div class="upload-zone"><div style="font-size:2rem;">📡</div><div>CSV, XLS, PDF</div></div></div>
    <div class="form-group form-full"><label>Notes</label><textarea placeholder="Additional context..."></textarea></div>
  </div>
  <div class="form-actions"><button class="btn btn-outline" type="button" onclick="closeModal()">Cancel</button><button class="btn btn-primary" type="button">📤 Upload & Process</button></div>`,

  addOperator: `<div class="form-grid">
    <div class="form-group"><label>Display Name</label><input placeholder="Operator name"></div>
    <div class="form-group"><label>Email</label><input type="email" placeholder="email@pak.com"></div>
    <div class="form-group"><label>Role</label><select><option>Operator</option><option>Sr. Operator</option></select></div>
    <div class="form-group form-full"><label>Notes</label><textarea placeholder="Optional"></textarea></div>
  </div>
  <div class="form-actions"><button class="btn btn-outline" type="button" onclick="closeModal()">Cancel</button><button class="btn btn-primary" type="button">💾 Add Operator</button></div>`,
};

document.getElementById("modal")?.addEventListener("click", function (e) {
  if (e.target === this) closeModal();
});

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
