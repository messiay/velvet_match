// ─── Admin Email Whitelist ────────────────────────────────────────────────────
// Add authorised admin email addresses here (lowercase)
const ADMIN_EMAILS = [
  "arjun.subbaaman13@gmail.com",
  // Add more emails as needed:
  // "team@velvetmatch.com",
];

// ─── Storage Keys ─────────────────────────────────────────────────────────────
const SK = {
  event: "vm.event",
  formLink: "vm.formLink",
  waitlist: "vm.waitlist",
  matches: "vm.matches",
  adminSession: "vm.adminSession",
};

const questionBank = [
  { id:"energy",       text:"Your energy in a room is usually...",         mode:"balance", weight:10, choices:[{label:"Quiet magnetic",value:0},{label:"Warm and social",value:1},{label:"Main character",value:2}]},
  { id:"dateStyle",    text:"The best first plan sounds like...",           mode:"same",    weight:9,  choices:[{label:"A slow dinner",value:0},{label:"An activity",value:1},{label:"A night out",value:2}]},
  { id:"communication",text:"Your texting style is closer to...",           mode:"same",    weight:8,  choices:[{label:"Thoughtful replies",value:0},{label:"Steady check-ins",value:1},{label:"Instant chaos",value:2}]},
  { id:"attention",    text:"You feel most seen when someone...",           mode:"same",    weight:10, choices:[{label:"Remembers details",value:0},{label:"Shows up",value:1},{label:"Makes it special",value:2}]},
  { id:"weekend",      text:"Your ideal weekend has...",                    mode:"same",    weight:7,  choices:[{label:"Soft reset",value:0},{label:"One good plan",value:1},{label:"Full calendar",value:2}]},
  { id:"curiosity",    text:"What catches your interest first?",            mode:"same",    weight:8,  choices:[{label:"Taste",value:0},{label:"Mindset",value:1},{label:"Chemistry",value:2}]},
  { id:"conflict",     text:"When something feels off, you prefer to...",  mode:"same",    weight:9,  choices:[{label:"Take space first",value:0},{label:"Talk it through",value:1},{label:"Keep it light",value:2}]},
  { id:"ambition",     text:"Your current season is mostly about...",       mode:"same",    weight:7,  choices:[{label:"Peace",value:0},{label:"Growth",value:1},{label:"Adventure",value:2}]},
  { id:"affection",    text:"Affection feels best when it is...",           mode:"same",    weight:10, choices:[{label:"Words",value:0},{label:"Time",value:1},{label:"Gestures",value:2}]},
  { id:"taste",        text:"Pick the mood you are drawn to...",            mode:"same",    weight:6,  choices:[{label:"Vintage romance",value:0},{label:"Clean modern",value:1},{label:"Bold nightlife",value:2}]},
  { id:"connection",   text:"Tonight, you are most open to...",             mode:"same",    weight:11, choices:[{label:"A real date",value:0},{label:"A soft maybe",value:1},{label:"A new person",value:2}]},
  { id:"pace",         text:"Your favorite connection moves...",            mode:"balance", weight:9,  choices:[{label:"Slow burn",value:0},{label:"Natural rhythm",value:1},{label:"Instant spark",value:2}]},
];

function loadJson(key, fallback) {
  try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fallback; }
  catch { return fallback; }
}
function saveJson(key, val) { localStorage.setItem(key, JSON.stringify(val)); }
function escHtml(v) {
  return String(v||"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;");
}
function pad(n) { return String(n).padStart(2,"0"); }
function $(id) { return document.getElementById(id); }

// ─── Auth ─────────────────────────────────────────────────────────────────────
async function checkSession() {
  const session = loadJson(SK.adminSession, null);
  if (session && ADMIN_EMAILS.includes(session.email?.toLowerCase())) {
    await showAdminPanel(session.email);
  }
}

async function showAdminPanel(email) {
  $("adminLoginGate").style.display = "none";
  $("adminPanel").style.display = "flex";
  $("adminEmailDisplay").textContent = email;
  await initAdminPanel();
}

$("adminLoginBtn").addEventListener("click", async () => {
  const emailVal = $("adminEmail").value.trim().toLowerCase();
  const errEl = $("algError");
  errEl.textContent = "";

  if (!emailVal) { errEl.textContent = "Please enter your email address."; return; }
  if (!ADMIN_EMAILS.includes(emailVal)) {
    errEl.textContent = "This email is not authorised for admin access."; return;
  }

  saveJson(SK.adminSession, { email: emailVal });
  await showAdminPanel(emailVal);
});

$("adminEmail").addEventListener("keydown", (e) => {
  if (e.key === "Enter") $("adminLoginBtn").click();
});

$("adminLogout").addEventListener("click", () => {
  localStorage.removeItem(SK.adminSession);
  location.reload();
});

// ─── Tab switching ────────────────────────────────────────────────────────────
async function initAdminPanel() {
  document.querySelectorAll(".as-nav-item").forEach((item) => {
    item.addEventListener("click", async (e) => {
      e.preventDefault();
      const tab = item.dataset.tab;
      document.querySelectorAll(".as-nav-item").forEach((i) => i.classList.remove("active"));
      item.classList.add("active");
      document.querySelectorAll(".admin-tab").forEach((t) => t.style.display = "none");
      
      const tabId = `tabContent${tab.charAt(0).toUpperCase() + tab.slice(1)}`;
      const tabEl = $(tabId);
      if (tabEl) tabEl.style.display = "block";

      if (tab === "event") await renderEventTab();
      if (tab === "responses") await renderResponsesTab();
      if (tab === "matches") renderMatchesTab();
    });
  });

  await renderEventTab();
  await renderResponsesTab();
  renderMatchesTab();
}

// ─── Event Tab ────────────────────────────────────────────────────────────────
async function renderEventTab() {
  const ev = await db.getEvent() || {};
  const fl = loadJson(SK.formLink, { url:"", active:false });

  if (ev.name)  $("evName").value  = ev.name;
  if (ev.date)  $("evDate").value  = ev.date;
  if (ev.time)  $("evTime").value  = ev.time;
  if (ev.reveal_time) $("evRevealTime").value = ev.reveal_time;
  if (ev.venue) $("evVenue").value = ev.venue;
  if (ev.note)  $("evNote").value  = ev.note;

  $("formLink").value = fl.url || "";
  $("formLinkActive").checked = fl.active || false;

  await updatePreview();
}

async function updatePreview() {
  const ev = await db.getEvent() || {};
  const fl = loadJson(SK.formLink, {});

  $("prevName").textContent = ev.name || "Not set";
  $("prevVenue").textContent = ev.venue || "Venue TBA";

  if (ev.date) {
    const d = new Date(`${ev.date}T${ev.time || "00:00"}`);
    $("prevDate").textContent = new Intl.DateTimeFormat("en-IN", {
      weekday:"short", day:"numeric", month:"short", year:"numeric",
      ...(ev.time ? { hour:"numeric", minute:"2-digit" } : {}),
    }).format(d);
  } else {
    $("prevDate").textContent = "Date TBA";
  }

  $("prevNote").textContent = ev.note || "";
  $("prevFormCta").style.display = (fl.active && fl.url) ? "block" : "none";
}

$("saveEvent").addEventListener("click", async () => {
  const ev = {
    name:  $("evName").value.trim(),
    date:  $("evDate").value,
    time:  $("evTime").value,
    reveal_time: $("evRevealTime").value,
    venue: $("evVenue").value.trim(),
    note:  $("evNote").value.trim(),
  };
  const { error } = await db.saveEvent(ev);
  if (error) {
    showStatus("saveEventStatus", "⚠ Error saving to database.");
  } else {
    await updatePreview();
    showStatus("saveEventStatus", "✓ Event details saved to cloud.");
  }
});

$("deleteEvent").addEventListener("click", async () => {
  if (confirm("Are you sure? This will delete the event from the live site and the database.")) {
    await db.deleteEvent();
    location.reload();
  }
});

$("saveFormLink").addEventListener("click", () => {
  const fl = {
    url:    $("formLink").value.trim(),
    active: $("formLinkActive").checked,
  };
  saveJson(SK.formLink, fl);
  updatePreview();
  showStatus("saveFormStatus", fl.active && fl.url
    ? "✓ Form link is now live and visible to guests."
    : "✓ Form settings saved. Link is not yet active.");
});

function showStatus(id, msg, isErr = false) {
  const el = $(id);
  if (!el) return;
  el.textContent = msg;
  el.style.color = isErr ? "var(--rose)" : "var(--green)";
  setTimeout(() => { el.textContent = ""; }, 4000);
}

// ─── Responses Tab ────────────────────────────────────────────────────────────
async function renderResponsesTab() {
  const { data: list, error } = await db.getWaitlist();
  if (error) return;
  const tbody = document.getElementById("responsesBody");
  if (!tbody) return;

  if (!list || list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:40px; color:var(--muted)">No entries yet. The waitlist is currently empty.</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map((r) => `
    <tr>
      <td><strong>${escHtml(r.name)}</strong></td>
      <td>${escHtml(r.email)}</td>
      <td>${escHtml(r.insta || "—")}</td>
      <td class="about-cell">${escHtml(r.about || "—")}</td>
      <td>${new Intl.DateTimeFormat("en-IN", { dateStyle:"medium", timeStyle:"short" }).format(new Date(r.created_at))}</td>
    </tr>
  `).join("");
}

$("exportCsv").addEventListener("click", async () => {
  const { data: list } = await db.getWaitlist();
  if (!list) return;
  const headers = ["Name","Email","Instagram","About","Joined At"];
  const rows = list.map((r) => [r.name, r.email, r.insta, r.about, r.joinedAt]);
  const csv = [headers, ...rows]
    .map((row) => row.map((c) => `"${String(c||"").replaceAll('"','""')}"`).join(","))
    .join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type:"text/csv" }));
  a.download = "velvet-match-waitlist.csv";
  a.click();
});

$("clearResponses").addEventListener("click", () => {
  if (!confirm("Clear ALL waitlist entries? This cannot be undone.")) return;
  saveJson(SK.waitlist, []);
  renderResponsesTab();
});

// ─── Matching Tab ─────────────────────────────────────────────────────────────
let matchState = { people: [], matches: [], revealed: false };

function renderMatchesTab() {
  const saved = loadJson(SK.matches, null);
  if (saved) matchState = saved;
  renderMatchResults();
}

// ─── Google Sheets CSV fetch ──────────────────────────────────────────────────
function parseSheetCsv(csvText) {
  const lines = csvText.trim().split("\n").map((l) => l.split(",").map((c) => c.trim().replace(/^"|"$/g, "")));
  if (lines.length < 2) throw new Error("Sheet has no data rows");
  const headers = lines[0].map((h) => h.toLowerCase().trim());
  return lines.slice(1).filter((row) => row.some((c) => c)).map((row) => {
    const obj = {};
    headers.forEach((h, i) => { obj[h] = row[i] || ""; });
    // Build answers array from a1..a12
    const answers = [];
    for (let i = 1; i <= 12; i++) {
      const val = parseInt(obj[`a${i}`], 10);
      answers.push(isNaN(val) ? 0 : Math.min(2, Math.max(0, val)));
    }
    return { name: obj.name || "Unknown", email: obj.email || "", insta: obj.insta || "", about: obj.about || "", answers };
  });
}

$("fetchSheets").addEventListener("click", async () => {
  const url = $("sheetsUrl").value.trim();
  if (!url) { showStatus("importStatus", "Paste a Google Sheets CSV URL first.", true); return; }
  $("fetchSheets").textContent = "Fetching…";
  $("fetchSheets").disabled = true;
  try {
    // Use a CORS proxy for local testing; in production host on same domain or use Apps Script
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    const data = parseSheetCsv(text);
    if (!data.length) throw new Error("No rows found. Check column headers.");
    matchState.people = data;
    matchState.matches = [];
    matchState.revealed = false;
    saveJson(SK.matches, matchState);
    showStatus("importStatus", `✓ ${data.length} responses imported from Google Sheets.`);
    renderMatchResults();
  } catch (err) {
    showStatus("importStatus", `Failed: ${err.message}. If on localhost, try JSON import instead (CORS blocks direct sheet fetch).`, true);
  } finally {
    $("fetchSheets").textContent = "Fetch from Google Sheets";
    $("fetchSheets").disabled = false;
  }
});

$("toggleJsonImport").addEventListener("click", () => {
  const area = $("jsonImportArea");
  const isHidden = area.style.display === "none";
  area.style.display = isHidden ? "block" : "none";
  $("toggleJsonImport").textContent = isHidden ? "Hide JSON import" : "Paste JSON manually";
});

$("importResponses").addEventListener("click", () => {
  const raw = $("importJson").value.trim();
  if (!raw) { showStatus("importStatus", "Paste response JSON first.", true); return; }
  try {
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) throw new Error("Expected an array");
    matchState.people = data;
    matchState.matches = [];
    matchState.revealed = false;
    saveJson(SK.matches, matchState);
    showStatus("importStatus", `✓ ${data.length} responses imported.`);
    renderMatchResults();
  } catch (err) {
    showStatus("importStatus", "Invalid JSON — " + err.message, true);
  }
});

$("calculateMatches").addEventListener("click", () => {
  const people = matchState.people;
  if (people.length < 2) {
    $("matchStatusText").textContent = "Need at least 2 responses to run matching."; return;
  }
  matchState.matches = runMatching([...people]);
  matchState.revealed = false;
  saveJson(SK.matches, matchState);
  renderMatchResults("Matches calculated! Reveal when you're at the event.");
});

$("releaseMatches").addEventListener("click", () => {
  if (!matchState.matches.length) {
    $("matchStatusText").textContent = "Calculate matches first."; return;
  }
  matchState.revealed = true;
  saveJson(SK.matches, matchState);
  renderMatchResults("Matches revealed — guests can now see their notifications.");
});

function pairScore(a, b) {
  let score = 0;
  const max = questionBank.reduce((s, q) => s + q.weight, 0);
  const reasons = [];

  questionBank.forEach((q, i) => {
    const aAns = a.answers?.[i] ?? 0;
    const bAns = b.answers?.[i] ?? 0;
    const diff = Math.abs(aAns - bAns);
    let earned = q.mode === "balance"
      ? (diff === 1 ? q.weight : diff === 0 ? q.weight * 0.82 : q.weight * 0.55)
      : (diff === 0 ? q.weight : diff === 1 ? q.weight * 0.62 : q.weight * 0.22);
    score += earned;
    if (diff === 0) reasons.push(`Both chose "${q.choices[aAns]?.label}" for ${q.id}.`);
  });

  return { score: Math.round((score / max) * 100), reasons: reasons.slice(0, 2) };
}

function runMatching(people) {
  if (people.length < 2) return [];
  const [first, ...rest] = people;
  let best = { score: -Infinity, pairs: [] };
  rest.forEach((person, i) => {
    const remaining = rest.filter((_,j) => j !== i);
    const pair = pairScore(first, person);
    const next = runMatching(remaining);
    const nextScore = next.reduce((s,p) => s + p.score, 0);
    const total = pair.score + nextScore;
    if (total > best.score) best = { score: total, pairs: [{ a: first, b: person, ...pair }, ...next] };
  });
  return best.pairs;
}

function renderMatchResults(msg = "") {
  const container = $("matchResults");
  if (!container) return;
  container.innerHTML = "";

  const count = matchState.people.length;
  $("matchStatusText").textContent = count
    ? `${count} profiles loaded. ${matchState.matches.length} pairs calculated.${matchState.revealed ? " Matches are LIVE." : ""}`
    : "No profiles loaded. Import responses above.";

  if (msg) {
    const p = document.createElement("p");
    p.className = "adm-status";
    p.textContent = msg;
    container.appendChild(p);
  }

  matchState.matches.forEach((match, i) => {
    const card = document.createElement("div");
    card.className = "match-card";
    const names = matchState.revealed
      ? `${match.a.name} + ${match.b.name}`
      : `Match ${i + 1}`;
    const contact = matchState.revealed
      ? `${match.a.email || match.a.insta || "?"} / ${match.b.email || match.b.insta || "?"}`
      : "Hidden until reveal";
    card.innerHTML = `
      <div class="match-card-top">
        <div>
          <h3>${escHtml(names)}</h3>
          <p>${escHtml(contact)}</p>
        </div>
        <span class="score-badge">${match.score}%</span>
      </div>
      <ul class="reason-list">
        ${match.reasons.map((r) => `<li>${escHtml(matchState.revealed ? r : "Sealed until reveal")}</li>`).join("")}
      </ul>
    `;
    container.appendChild(card);
  });
}

// ─── Init ─────────────────────────────────────────────────────────────────────
checkSession();
