/* ============================================
   VB Conexao - Admin Events Script (ES Module)
   ============================================ */

import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const db = createClient(
  "https://opcsqdjyyxahxiyxlwpv.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wY3NxZGp5eXhhaHhpeXhsd3B2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4NzYyMDUsImV4cCI6MjA5NTQ1MjIwNX0.X_Zx7cmbdYwbUp7eOjy2SgDqxVefA2oBSGN-vFysB5U"
);

// --- Auth Guard ---
const { data: { session } } = await db.auth.getSession();
if (!session) {
  window.location.href = "login.html";
} else {
  const emailEl = document.getElementById("user-email");
  if (emailEl) emailEl.textContent = session.user.email;
  init();
}

// --- Load Event Details ---
async function loadEventDetails() {
  const keys = ["event_title", "event_badge", "event_description", "event_date", "event_time_display", "event_platform", "event_duration"];
  const { data } = await db
    .from("settings")
    .select("key, value")
    .in("key", keys);

  const settings = {};
  if (data) data.forEach((row) => { settings[row.key] = row.value; });

  document.getElementById("ev-title").value = settings.event_title || "";
  document.getElementById("ev-badge").value = settings.event_badge || "";
  document.getElementById("ev-description").value = settings.event_description || "";
  document.getElementById("ev-time-display").value = settings.event_time_display || "";
  document.getElementById("ev-platform").value = settings.event_platform || "";
  document.getElementById("ev-duration").value = settings.event_duration || "";

  if (settings.event_date) {
    const d = new Date(settings.event_date);
    const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
    document.getElementById("ev-date").value = local.toISOString().slice(0, 16);
  } else {
    document.getElementById("ev-date").value = "";
  }
}

// --- Save Event Details ---
async function saveEventDetails(e) {
  e.preventDefault();
  const errorEl = document.getElementById("ev-error");
  const btn = document.getElementById("btn-save-event");
  errorEl.textContent = "";

  const title = document.getElementById("ev-title").value.trim();
  const badge = document.getElementById("ev-badge").value.trim();
  const description = document.getElementById("ev-description").value.trim();
  const dateVal = document.getElementById("ev-date").value;
  const timeDisplay = document.getElementById("ev-time-display").value.trim();
  const platform = document.getElementById("ev-platform").value.trim();
  const duration = document.getElementById("ev-duration").value.trim();

  if (!title) { errorEl.textContent = "Titulo e obrigatorio."; return; }

  btn.disabled = true;
  btn.textContent = "A guardar...";

  const now = new Date().toISOString();
  const rows = [
    { key: "event_title", value: title, updated_at: now },
    { key: "event_badge", value: badge, updated_at: now },
    { key: "event_description", value: description, updated_at: now },
    { key: "event_time_display", value: timeDisplay, updated_at: now },
    { key: "event_platform", value: platform, updated_at: now },
    { key: "event_duration", value: duration, updated_at: now },
  ];

  if (dateVal) {
    rows.push({ key: "event_date", value: new Date(dateVal).toISOString(), updated_at: now });
  }

  const { error } = await db.from("settings").upsert(rows, { onConflict: "key" });

  if (error) {
    errorEl.textContent = "Erro ao guardar detalhes do evento.";
    console.error(error);
    btn.disabled = false;
    btn.textContent = "Guardar Detalhes";
    return;
  }

  btn.textContent = "Guardado!";
  setTimeout(() => { btn.disabled = false; btn.textContent = "Guardar Detalhes"; }, 2000);
}

// --- Logout ---
async function logout() {
  await db.auth.signOut();
  window.location.href = "../index.html";
}

// --- Init ---
function init() {
  loadEventDetails();
  document.getElementById("event-details-form").addEventListener("submit", saveEventDetails);
  document.getElementById("btn-logout").addEventListener("click", logout);
}
