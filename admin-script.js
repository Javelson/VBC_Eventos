/* ============================================
   VB Conexao - Admin Panel Script (ES Module)
   ============================================ */

import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const db = createClient(
  "https://opcsqdjyyxahxiyxlwpv.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wY3NxZGp5eXhhaHhpeXhsd3B2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4NzYyMDUsImV4cCI6MjA5NTQ1MjIwNX0.X_Zx7cmbdYwbUp7eOjy2SgDqxVefA2oBSGN-vFysB5U"
);

let subscribers = [];
let editingId = null;
let deletingId = null;

// --- Auth Guard ---
const { data: { session } } = await db.auth.getSession();
if (!session) {
  window.location.href = "login.html";
} else {
  const emailEl = document.getElementById("user-email");
  if (emailEl) emailEl.textContent = session.user.email;
  init();
}

// --- Load Subscribers ---
async function loadSubscribers() {
  const { data, error } = await db
    .from("inscricoes")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error loading subscribers:", error);
    return;
  }

  subscribers = data || [];
  renderStats();
  renderTable();
}

// --- Render Stats ---
function renderStats() {
  const total = subscribers.length;
  const pending = subscribers.filter((s) => s.status === "pendente").length;
  const confirmed = subscribers.filter((s) => s.status === "confirmado").length;

  document.getElementById("stat-total").textContent = total;
  document.getElementById("stat-pending").textContent = pending;
  document.getElementById("stat-confirmed").textContent = confirmed;
}

// --- Render Table ---
function renderTable() {
  const tbody = document.getElementById("subscribers-body");

  if (subscribers.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="empty-state"><div class="empty-state-icon">&#128203;</div><div>Nenhum inscrito encontrado</div></td></tr>';
    return;
  }

  tbody.innerHTML = subscribers
    .map((s) => {
      const date = new Date(s.created_at).toLocaleDateString("pt-PT", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });

      const statusBadge =
        s.status === "confirmado"
          ? '<span class="status-badge status-confirmed">Confirmado</span>'
          : '<span class="status-badge status-pending">Pendente</span>';

      const confirmBtn =
        s.status === "pendente"
          ? `<button class="btn-action btn-confirm" onclick="window._confirmSub('${s.id}')">Confirmar</button>`
          : "";

      return `<tr>
        <td>${escapeHtml(s.nome)}</td>
        <td>${escapeHtml(s.email)}</td>
        <td>${escapeHtml(s.telefone)}</td>
        <td>${statusBadge}</td>
        <td>${date}</td>
        <td>
          <div class="actions">
            ${confirmBtn}
            <button class="btn-action btn-edit" onclick="window._openEdit('${s.id}')">Editar</button>
            <button class="btn-action btn-delete" onclick="window._openDelete('${s.id}')">Eliminar</button>
          </div>
        </td>
      </tr>`;
    })
    .join("");
}

// --- Confirm Subscriber ---
async function confirmSubscriber(id) {
  const sub = subscribers.find((s) => s.id === id);
  if (!sub) return;

  const { error } = await db
    .from("inscricoes")
    .update({ status: "confirmado", confirmed_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    alert("Erro ao confirmar.");
    console.error(error);
    return;
  }

  // Enviar e-mail de confirmacao via Netlify Function
  let emailStatus = "";
  try {
    const emailRes = await fetch("/.netlify/functions/send-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: sub.email,
        subject: "Inscricao Confirmada - VB Conexao",
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f4f4f4;padding:40px 20px">
            <div style="background:#ffffff;border-radius:12px;padding:40px 30px;box-shadow:0 2px 8px rgba(0,0,0,0.08)">
              <!-- Header -->
              <div style="text-align:center;margin-bottom:30px">
                <div style="background:#005696;color:#ffffff;display:inline-block;padding:8px 20px;border-radius:6px;font-size:14px;font-weight:600;letter-spacing:0.5px">VB Conexao</div>
              </div>

              <!-- Confirmacao -->
              <div style="text-align:center;margin-bottom:30px">
                <div style="background:#22c55e;color:#ffffff;width:60px;height:60px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:30px;margin-bottom:16px">&#10003;</div>
                <h1 style="color:#1a1a1a;font-size:24px;margin:0 0 8px">Inscricao Confirmada!</h1>
                <p style="color:#666;font-size:16px;margin:0">A sua presenca foi confirmada com sucesso.</p>
              </div>

              <!-- Mensagem -->
              <div style="background:#f0f9ff;border-left:4px solid #005696;padding:20px;border-radius:0 8px 8px 0;margin-bottom:30px">
                <p style="color:#333;font-size:15px;line-height:1.6;margin:0">
                  Olá <strong>${sub.nome}</strong>,<br><br>
                  Temos o prazer de confirmar a sua inscricao no evento <strong>FortiGate Experience</strong>.
                  Prepararamos uma experiencia unica e imersiva sobre seguranca de rede que nao vai querer perder!
                </p>
              </div>

              <!-- Detalhes do Evento -->
              <div style="background:#fafafa;border-radius:8px;padding:24px;margin-bottom:30px">
                <h3 style="color:#005696;font-size:16px;margin:0 0 16px;text-transform:uppercase;letter-spacing:1px">Detalhes do Evento</h3>
                <table style="width:100%;border-collapse:collapse">
                  <tr>
                    <td style="padding:8px 0;color:#666;font-size:14px;width:30px">&#128197;</td>
                    <td style="padding:8px 0;color:#333;font-size:14px"><strong>Data:</strong> 06 de Junho, 2026</td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0;color:#666;font-size:14px">&#128336;</td>
                    <td style="padding:8px 0;color:#333;font-size:14px"><strong>Horario:</strong> 15h00 - 17h00</td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0;color:#666;font-size:14px">&#128187;</td>
                    <td style="padding:8px 0;color:#333;font-size:14px"><strong>Plataforma:</strong> Microsoft Teams</td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0;color:#666;font-size:14px">&#9889;</td>
                    <td style="padding:8px 0;color:#333;font-size:14px"><strong>Duracao:</strong> 2 horas (pratica)</td>
                  </tr>
                </table>
              </div>

              <!-- CTA -->
              <div style="text-align:center;margin-bottom:30px">
                <p style="color:#333;font-size:15px;line-height:1.6;margin:0">
                  Em breve recebera o link de acesso e mais instrucoes por e-mail.<br>
                  Fique atento(a) a sua caixa de entrada!
                </p>
              </div>

              <!-- Footer -->
              <div style="border-top:1px solid #eee;padding-top:20px;text-align:center">
                <p style="color:#999;font-size:12px;margin:0">
                  Este e-mail foi enviado automaticamente pelo sistema VB Conexao.<br>
                  Se tem alguma duvida, responda a este e-mail.
                </p>
              </div>
            </div>
          </div>
        `,
      }),
    });

    const emailData = await emailRes.json();
    if (emailRes.ok && emailData.success) {
      emailStatus = " E-mail enviado!";
    } else {
      emailStatus = " (E-mail: " + (emailData.error || "erro desconhecido") + ")";
      console.error("Resend error:", emailData);
    }
  } catch (err) {
    emailStatus = " (E-mail: falha na conexao)";
    console.warn("Erro ao enviar e-mail:", err);
  }

  await loadSubscribers();
  alert("Inscricao confirmada!" + emailStatus);
}

// --- Edit Modal ---
function openEdit(id) {
  const sub = subscribers.find((s) => s.id === id);
  if (!sub) return;

  editingId = id;
  document.getElementById("edit-nome").value = sub.nome;
  document.getElementById("edit-email").value = sub.email;
  document.getElementById("edit-telefone").value = sub.telefone;
  document.getElementById("edit-error").textContent = "";
  document.getElementById("edit-modal").classList.remove("hidden");
}

function closeEdit() {
  editingId = null;
  document.getElementById("edit-modal").classList.add("hidden");
}

async function saveEdit(e) {
  e.preventDefault();
  const nome = document.getElementById("edit-nome").value.trim();
  const email = document.getElementById("edit-email").value.trim();
  const telefone = document.getElementById("edit-telefone").value.trim();
  const errorEl = document.getElementById("edit-error");

  if (nome.length < 2) { errorEl.textContent = "Nome deve ter pelo menos 2 caracteres."; return; }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { errorEl.textContent = "E-mail invalido."; return; }
  if (telefone.replace(/\D/g, "").length < 9) { errorEl.textContent = "Telefone invalido."; return; }

  const { error } = await db
    .from("inscricoes")
    .update({ nome, email, telefone })
    .eq("id", editingId);

  if (error) {
    if (error.code === "23505") { errorEl.textContent = "E-mail ja em uso."; }
    else { errorEl.textContent = "Erro ao guardar."; }
    console.error(error);
    return;
  }

  closeEdit();
  await loadSubscribers();
}

// --- Delete Modal ---
function openDelete(id) {
  const sub = subscribers.find((s) => s.id === id);
  if (!sub) return;

  deletingId = id;
  document.getElementById("delete-name").textContent = sub.nome;
  document.getElementById("delete-modal").classList.remove("hidden");
}

function closeDelete() {
  deletingId = null;
  document.getElementById("delete-modal").classList.add("hidden");
}

async function confirmDelete() {
  const { error } = await db
    .from("inscricoes")
    .delete()
    .eq("id", deletingId);

  if (error) {
    alert("Erro ao eliminar.");
    console.error(error);
    return;
  }

  closeDelete();
  await loadSubscribers();
}

// --- Flyer Manager ---
async function loadFlyer() {
  const { data } = await db
    .from("settings")
    .select("value")
    .eq("key", "flyer_url")
    .single();

  if (data && data.value) {
    document.getElementById("flyer-img").src = data.value;
    document.getElementById("flyer-upload").classList.add("hidden");
    document.getElementById("flyer-preview").classList.remove("hidden");
  } else {
    document.getElementById("flyer-upload").classList.remove("hidden");
    document.getElementById("flyer-preview").classList.add("hidden");
  }
}

async function uploadFlyer(file) {
  const ext = file.name.split(".").pop();
  const path = `flyer-${Date.now()}.${ext}`;

  const { data: settings } = await db
    .from("settings")
    .select("value")
    .eq("key", "flyer_url")
    .single();

  if (settings && settings.value) {
    const oldPath = settings.value.split("/").pop();
    if (oldPath) await db.storage.from("flyers").remove([oldPath]);
  }

  const { error: uploadError } = await db.storage
    .from("flyers")
    .upload(path, file, { upsert: true });

  if (uploadError) {
    alert("Erro ao carregar flyer.");
    console.error(uploadError);
    return;
  }

  const { data: urlData } = db.storage.from("flyers").getPublicUrl(path);

  await db.from("settings").upsert({
    key: "flyer_url",
    value: urlData.publicUrl,
    updated_at: new Date().toISOString(),
  });

  await loadFlyer();
}

async function removeFlyer() {
  if (!confirm("Tem certeza que deseja remover o flyer?")) return;

  const { data: settings } = await db
    .from("settings")
    .select("value")
    .eq("key", "flyer_url")
    .single();

  if (settings && settings.value) {
    const oldPath = settings.value.split("/").pop();
    if (oldPath) await db.storage.from("flyers").remove([oldPath]);
  }

  await db.from("settings").upsert({
    key: "flyer_url",
    value: "",
    updated_at: new Date().toISOString(),
  });

  await loadFlyer();
}

// --- Logout ---
async function logout() {
  await db.auth.signOut();
  window.location.href = "../index.html";
}

// --- Helper ---
function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// --- Expose to inline onclick handlers ---
window._confirmSub = confirmSubscriber;
window._openEdit = openEdit;
window._openDelete = openDelete;

// --- Init ---
function init() {
  loadSubscribers();
  loadFlyer();

  document.getElementById("btn-logout").addEventListener("click", logout);
  document.getElementById("btn-refresh").addEventListener("click", loadSubscribers);

  document.getElementById("edit-form").addEventListener("submit", saveEdit);
  document.getElementById("edit-cancel").addEventListener("click", closeEdit);
  document.getElementById("edit-modal").addEventListener("click", (e) => {
    if (e.target === e.currentTarget) closeEdit();
  });

  document.getElementById("delete-confirm").addEventListener("click", confirmDelete);
  document.getElementById("delete-cancel").addEventListener("click", closeDelete);
  document.getElementById("delete-modal").addEventListener("click", (e) => {
    if (e.target === e.currentTarget) closeDelete();
  });

  const flyerInput = document.getElementById("flyer-input");
  document.getElementById("btn-flyer-select").addEventListener("click", () => flyerInput.click());
  document.getElementById("btn-flyer-replace").addEventListener("click", () => flyerInput.click());
  document.getElementById("flyer-upload").addEventListener("click", (e) => {
    if (e.target.tagName !== "BUTTON") flyerInput.click();
  });
  flyerInput.addEventListener("change", (e) => {
    if (e.target.files[0]) uploadFlyer(e.target.files[0]);
  });
  document.getElementById("btn-flyer-remove").addEventListener("click", removeFlyer);
}
