/* ============================================
   VB Conexao - Admin Classificacoes (ES Module)
   ============================================ */

import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const db = createClient(
  "https://opcsqdjyyxahxiyxlwpv.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wY3NxZGp5eXhhaHhpeXhsd3B2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4NzYyMDUsImV4cCI6MjA5NTQ1MjIwNX0.X_Zx7cmbdYwbUp7eOjy2SgDqxVefA2oBSGN-vFysB5U"
);

let feedbackData = [];

// --- Auth Guard ---
const { data: { session } } = await db.auth.getSession();
if (!session) {
  window.location.href = "login.html";
} else {
  const emailEl = document.getElementById("user-email");
  if (emailEl) emailEl.textContent = session.user.email;
  init();
}

// --- Stars Display ---
function starsHtml(rating) {
  return '<span class="star-display">' + '&#9733;'.repeat(rating) + '&#9734;'.repeat(5 - rating) + '</span>';
}

// --- Format Date ---
function formatDate(dateStr) {
  if (!dateStr) return '--';
  const d = new Date(dateStr);
  return d.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// --- Load Feedback ---
async function loadFeedback() {
  const { data, error } = await db
    .from("feedback")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error loading feedback:", error);
    return;
  }

  feedbackData = data || [];
  renderTable();
  renderStats();
}

// --- Render Stats ---
function renderStats() {
  const total = feedbackData.length;
  const sum = feedbackData.reduce((acc, r) => acc + r.rating, 0);
  const avg = total > 0 ? (sum / total).toFixed(1) : '--';
  const count5 = feedbackData.filter(r => r.rating === 5).length;
  const count4 = feedbackData.filter(r => r.rating === 4).length;
  const countLow = feedbackData.filter(r => r.rating <= 3).length;

  document.getElementById("fb-total").textContent = total;
  document.getElementById("fb-avg").textContent = avg;
  document.getElementById("fb-5").textContent = count5;
  document.getElementById("fb-4").textContent = count4;
  document.getElementById("fb-low").textContent = countLow;
}

// --- Render Table ---
function renderTable() {
  const tbody = document.getElementById("feedback-body");

  if (feedbackData.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" class="empty-state"><div class="empty-state-icon">&#11088;</div><div>Sem classificacoes ainda</div></td></tr>';
    return;
  }

  tbody.innerHTML = feedbackData.map(row => `
    <tr>
      <td><strong>${escapeHtml(row.nome)}</strong></td>
      <td>${starsHtml(row.rating)}</td>
      <td class="comment-cell">${row.comentario ? escapeHtml(row.comentario) : '<span class="empty-comment">Sem comentario</span>'}</td>
      <td>${formatDate(row.created_at)}</td>
    </tr>
  `).join('');
}

// --- Escape HTML ---
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// --- Generate PDF ---
function downloadPdf() {
  if (feedbackData.length === 0) {
    alert("Nenhuma classificacao para exportar.");
    return;
  }

  const total = feedbackData.length;
  const sum = feedbackData.reduce((acc, r) => acc + r.rating, 0);
  const avg = (sum / total).toFixed(1);

  // Build HTML for PDF
  let html = `<!DOCTYPE html>
<html lang="pt">
<head>
<meta charset="UTF-8">
<title>Classificacoes - VB Conexao</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; color: #1a1a2e; padding: 40px; }
  .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #005696; padding-bottom: 20px; }
  .header h1 { color: #005696; font-size: 24px; }
  .header p { color: #6b7280; font-size: 14px; margin-top: 5px; }
  .summary { display: flex; gap: 20px; justify-content: center; margin-bottom: 30px; }
  .summary-box { background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 8px; padding: 15px 25px; text-align: center; }
  .summary-box .label { font-size: 11px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.05em; }
  .summary-box .value { font-size: 22px; font-weight: 700; color: #003d6b; }
  .summary-box .value.gold { color: #f59e0b; }
  table { width: 100%; border-collapse: collapse; margin-top: 20px; }
  th { background: #005696; color: white; text-align: left; padding: 10px 12px; font-size: 12px; text-transform: uppercase; }
  td { padding: 10px 12px; border-bottom: 1px solid #e9ecef; font-size: 13px; }
  tr:nth-child(even) { background: #f8f9fa; }
  .stars { color: #f59e0b; font-size: 16px; }
  .footer { text-align: center; margin-top: 30px; padding-top: 15px; border-top: 1px solid #e9ecef; font-size: 11px; color: #9ca3af; }
</style>
</head>
<body>
<div class="header">
  <h1>Classificacoes do Evento</h1>
  <p>VB Conexao - Relatorio de Feedback</p>
</div>
<div class="summary">
  <div class="summary-box"><div class="label">Total</div><div class="value">${total}</div></div>
  <div class="summary-box"><div class="label">Media</div><div class="value gold">${avg} / 5</div></div>
</div>
<table>
<thead><tr><th>Nome</th><th>Classificacao</th><th>Comentario</th><th>Data</th></tr></thead>
<tbody>`;

  feedbackData.forEach(row => {
    const stars = '&#9733;'.repeat(row.rating) + '&#9734;'.repeat(5 - row.rating);
    const comment = row.comentario ? escapeHtml(row.comentario) : '--';
    const date = formatDate(row.created_at);
    html += `<tr><td>${escapeHtml(row.nome)}</td><td class="stars">${stars}</td><td>${comment}</td><td>${date}</td></tr>`;
  });

  html += `</tbody></table>
<div class="footer">Gerado em ${new Date().toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' })} - VB Conexao</div>
</body></html>`;

  // Open in new window for printing
  const win = window.open('', '_blank');
  win.document.write(html);
  win.document.close();
  win.onload = () => win.print();
}

// --- Init ---
function init() {
  loadFeedback();

  document.getElementById("btn-refresh").addEventListener("click", loadFeedback);
  document.getElementById("btn-pdf").addEventListener("click", downloadPdf);
}
