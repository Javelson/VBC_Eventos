/* ============================================
   VB Conexao - Feedback / Classificacao
   Vanilla JavaScript (ES Module)
   ============================================ */

import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const db = createClient(
  "https://opcsqdjyyxahxiyxlwpv.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wY3NxZGp5eXhhaHhpeXhsd3B2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4NzYyMDUsImV4cCI6MjA5NTQ1MjIwNX0.X_Zx7cmbdYwbUp7eOjy2SgDqxVefA2oBSGN-vFysB5U"
);

const ratingLabels = {
  1: "Fraco",
  2: "Razoavel",
  3: "Bom",
  4: "Muito Bom",
  5: "Excelente"
};

// --- Star Rating Interaction ---
function initStarRating() {
  const ratingText = document.getElementById("rating-text");
  const ratingError = document.getElementById("rating-error");
  const stars = document.querySelectorAll('.star-rating input');

  document.querySelectorAll('.star-rating label').forEach(label => {
    label.addEventListener('mouseenter', () => {
      const val = label.getAttribute('for').replace('star', '');
      ratingText.textContent = ratingLabels[val] || '';
    });

    label.addEventListener('mouseleave', () => {
      const checked = document.querySelector('.star-rating input:checked');
      ratingText.textContent = checked ? ratingLabels[checked.value] : '';
    });

    label.addEventListener('click', () => {
      if (ratingError) ratingError.textContent = '';
    });
  });
}

// --- Name Validation ---
function validateNome(value) {
  return value.trim().length >= 2;
}

// --- Get Average Rating ---
async function loadAverageRating() {
  try {
    const { data, error } = await db
      .from("feedback")
      .select("rating");

    if (error || !data || data.length === 0) return;

    const sum = data.reduce((acc, row) => acc + row.rating, 0);
    const avg = (sum / data.length).toFixed(1);

    const avgContainer = document.getElementById("average-rating");
    const avgValue = document.getElementById("avg-value");
    const avgCount = document.getElementById("avg-count");

    if (avgContainer && avgValue && avgCount) {
      avgValue.textContent = avg;
      avgCount.textContent = `(${data.length} classificacao${data.length > 1 ? 'oes' : ''})`;
      avgContainer.style.display = "flex";
    }
  } catch (err) {
    console.warn("Could not load average rating:", err);
  }
}

// --- Form Submission ---
function initForm() {
  const form = document.getElementById("feedback-form");
  const feedbackContent = document.getElementById("feedback-content");
  const successMessage = document.getElementById("feedback-success");
  const btnAnother = document.getElementById("btn-another");

  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const ratingInput = document.querySelector('.star-rating input:checked');
    const ratingError = document.getElementById("rating-error");

    if (!ratingInput) {
      if (ratingError) ratingError.textContent = "Por favor seleciona uma classificacao.";
      return;
    }

    const nomeInput = document.getElementById("nome");
    const nomeError = document.getElementById("nome-error");
    if (!validateNome(nomeInput.value)) {
      if (nomeError) nomeError.textContent = "Nome deve ter pelo menos 2 caracteres.";
      nomeInput.classList.add("form-error");
      return;
    } else {
      if (nomeError) nomeError.textContent = "";
      nomeInput.classList.remove("form-error");
    }

    const btn = document.getElementById("btn-submit");
    btn.disabled = true;
    btn.textContent = "A enviar...";

    try {
      const payload = {
        nome: nomeInput.value.trim(),
        rating: parseInt(ratingInput.value),
        comentario: document.getElementById("comentario").value.trim() || null,
      };

      const { error } = await db.from("feedback").insert(payload);

      if (error) {
        alert("Erro ao enviar classificacao. Tenta novamente.");
        console.error(error);
        btn.disabled = false;
        btn.textContent = "Enviar Classificacao";
        return;
      }

      feedbackContent.style.display = "none";
      successMessage.style.display = "block";

      // Load average after submission
      await loadAverageRating();
    } catch (err) {
      console.error(err);
      alert("Erro de conexao. Verifica a tua internet.");
      btn.disabled = false;
      btn.textContent = "Enviar Classificacao";
    }
  });

  if (btnAnother) {
    btnAnother.addEventListener("click", () => {
      form.reset();
      document.getElementById("rating-text").textContent = "";
      document.getElementById("nome-error").textContent = "";
      document.getElementById("btn-submit").disabled = false;
      document.getElementById("btn-submit").textContent = "Enviar Classificacao";
      successMessage.style.display = "none";
      feedbackContent.style.display = "block";
    });
  }
}

// --- Init ---
initStarRating();
initForm();
