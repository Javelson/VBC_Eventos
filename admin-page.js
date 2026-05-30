/* ============================================
   VB Conexao - Admin Page Settings (ES Module)
   Logo + Footer + Logo Size management
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

// --- Logo Manager ---
async function loadLogo() {
  const { data } = await db
    .from("settings")
    .select("value")
    .eq("key", "site_logo_url")
    .single();

  if (data && data.value) {
    document.getElementById("logo-img").src = data.value;
    document.getElementById("logo-upload").classList.add("hidden");
    document.getElementById("logo-preview").classList.remove("hidden");
  } else {
    document.getElementById("logo-upload").classList.remove("hidden");
    document.getElementById("logo-preview").classList.add("hidden");
  }
}

async function uploadLogo(file) {
  const ext = file.name.split(".").pop();
  const path = `logo-${Date.now()}.${ext}`;

  const { data: settings } = await db
    .from("settings")
    .select("value")
    .eq("key", "site_logo_url")
    .single();

  if (settings && settings.value) {
    const oldPath = settings.value.split("/").pop();
    if (oldPath) await db.storage.from("flyers").remove([oldPath]);
  }

  const { error: uploadError } = await db.storage
    .from("flyers")
    .upload(path, file, { upsert: true });

  if (uploadError) {
    alert("Erro ao carregar logo.");
    console.error(uploadError);
    return;
  }

  const { data: urlData } = db.storage.from("flyers").getPublicUrl(path);

  await db.from("settings").upsert({
    key: "site_logo_url",
    value: urlData.publicUrl,
    updated_at: new Date().toISOString(),
  });

  await loadLogo();
}

async function removeLogo() {
  if (!confirm("Tem certeza que deseja remover o logo?")) return;

  const { data: settings } = await db
    .from("settings")
    .select("value")
    .eq("key", "site_logo_url")
    .single();

  if (settings && settings.value) {
    const oldPath = settings.value.split("/").pop();
    if (oldPath) await db.storage.from("flyers").remove([oldPath]);
  }

  await db.from("settings").upsert({
    key: "site_logo_url",
    value: "",
    updated_at: new Date().toISOString(),
  });

  await loadLogo();
}

// --- Logo Size Manager ---
async function loadLogoSize() {
  const { data } = await db
    .from("settings")
    .select("value")
    .eq("key", "site_logo_size")
    .single();

  const size = data && data.value ? parseInt(data.value) : 100;
  document.getElementById("logo-size").value = size;
  document.getElementById("logo-size-value").textContent = size + "px";
}

async function saveLogoSize(size) {
  document.getElementById("logo-size-value").textContent = size + "px";

  await db.from("settings").upsert({
    key: "site_logo_size",
    value: String(size),
    updated_at: new Date().toISOString(),
  });
}

// --- Footer Manager ---
async function loadFooter() {
  const keys = ["footer_text", "footer_credit"];
  const { data } = await db
    .from("settings")
    .select("key, value")
    .in("key", keys);

  if (!data) return;

  const settings = {};
  data.forEach((row) => { settings[row.key] = row.value; });

  if (settings.footer_text) {
    document.getElementById("footer-text-input").value = settings.footer_text;
  }
  if (settings.footer_credit) {
    document.getElementById("footer-credit-input").value = settings.footer_credit;
  }
}

async function saveFooter(e) {
  e.preventDefault();

  const textVal = document.getElementById("footer-text-input").value.trim();
  const creditVal = document.getElementById("footer-credit-input").value.trim();
  const errorEl = document.getElementById("footer-error");

  if (!textVal && !creditVal) {
    errorEl.textContent = "Preenche pelo menos um campo.";
    return;
  }

  errorEl.textContent = "";

  const rows = [];
  if (textVal) rows.push({ key: "footer_text", value: textVal, updated_at: new Date().toISOString() });
  if (creditVal) rows.push({ key: "footer_credit", value: creditVal, updated_at: new Date().toISOString() });

  const { error } = await db.from("settings").upsert(rows, { onConflict: "key" });

  if (error) {
    errorEl.textContent = "Erro ao guardar.";
    console.error(error);
    return;
  }

  alert("Footer atualizado!");
}

// --- Logout ---
async function logout() {
  await db.auth.signOut();
  window.location.href = "../index.html";
}

// --- Init ---
function init() {
  loadLogo();
  loadLogoSize();
  loadFooter();

  document.getElementById("btn-logout").addEventListener("click", logout);

  // Logo upload
  const logoInput = document.getElementById("logo-input");
  document.getElementById("btn-logo-select").addEventListener("click", () => logoInput.click());
  document.getElementById("btn-logo-replace").addEventListener("click", () => logoInput.click());
  document.getElementById("logo-upload").addEventListener("click", (e) => {
    if (e.target.tagName !== "BUTTON") logoInput.click();
  });
  logoInput.addEventListener("change", (e) => {
    if (e.target.files[0]) uploadLogo(e.target.files[0]);
  });
  document.getElementById("btn-logo-remove").addEventListener("click", removeLogo);

  // Logo size slider
  const sizeSlider = document.getElementById("logo-size");
  let sizeDebounce = null;
  sizeSlider.addEventListener("input", (e) => {
    const size = e.target.value;
    document.getElementById("logo-size-value").textContent = size + "px";
    clearTimeout(sizeDebounce);
    sizeDebounce = setTimeout(() => saveLogoSize(size), 500);
  });

  // Footer form
  document.getElementById("footer-form").addEventListener("submit", saveFooter);
}
