/* ============================================
   VB Conexao - FortiGate Experience
   Vanilla JavaScript (ES Module)
   ============================================ */

import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const db = createClient(
  "https://opcsqdjyyxahxiyxlwpv.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wY3NxZGp5eXhhaHhpeXhsd3B2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4NzYyMDUsImV4cCI6MjA5NTQ1MjIwNX0.X_Zx7cmbdYwbUp7eOjy2SgDqxVefA2oBSGN-vFysB5U"
);

// --- Countdown Timer ---
let countdownTarget = new Date("2026-06-06T15:00:00+01:00").getTime();
let countdownInterval = null;

function initCountdown() {
  function update() {
    const now = Date.now();
    const diff = countdownTarget - now;

    if (diff <= 0) {
      document.getElementById("cd-days").textContent = "00";
      document.getElementById("cd-hours").textContent = "00";
      document.getElementById("cd-mins").textContent = "00";
      document.getElementById("cd-secs").textContent = "00";
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((diff % (1000 * 60)) / 1000);

    document.getElementById("cd-days").textContent = String(days).padStart(2, "0");
    document.getElementById("cd-hours").textContent = String(hours).padStart(2, "0");
    document.getElementById("cd-mins").textContent = String(mins).padStart(2, "0");
    document.getElementById("cd-secs").textContent = String(secs).padStart(2, "0");
  }

  update();
  countdownInterval = setInterval(update, 1000);
}

// --- Event Details Loading ---
async function loadEventDetails() {
  try {
    const keys = ["event_title", "event_badge", "event_description", "event_date", "event_time_display", "event_platform", "event_duration"];
    const { data } = await db
      .from("settings")
      .select("key, value")
      .in("key", keys);

    if (!data || data.length === 0) return;

    const settings = {};
    data.forEach((row) => { settings[row.key] = row.value; });

    if (settings.event_badge) {
      const badgeEl = document.getElementById("event-badge");
      if (badgeEl) badgeEl.textContent = settings.event_badge;
    }

    if (settings.event_title) {
      const titleEl = document.getElementById("event-title");
      if (titleEl) titleEl.innerHTML = settings.event_title;
    }

    if (settings.event_description) {
      const descEl = document.getElementById("event-description");
      if (descEl) descEl.textContent = settings.event_description;
    }

    if (settings.event_date) {
      const eventDate = new Date(settings.event_date);
      countdownTarget = eventDate.getTime();
      if (countdownInterval) clearInterval(countdownInterval);
      initCountdown();

      const dateEl = document.getElementById("event-date");
      if (dateEl) {
        dateEl.textContent = eventDate.toLocaleDateString("pt-PT", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        });
      }
    }

    if (settings.event_time_display) {
      const timeEl = document.getElementById("event-time");
      if (timeEl) timeEl.textContent = settings.event_time_display;
    }

    if (settings.event_platform) {
      const platformEl = document.getElementById("event-platform");
      if (platformEl) platformEl.textContent = settings.event_platform;
    }

    if (settings.event_duration) {
      const durationEl = document.getElementById("event-duration");
      if (durationEl) durationEl.textContent = settings.event_duration;
    }
  } catch (err) {
    console.warn("Event details not available:", err);
  }
}

// --- Flyer Loading ---
async function loadFlyer() {
  try {
    const { data } = await db
      .from("settings")
      .select("value")
      .eq("key", "flyer_url")
      .single();

    if (data && data.value) {
      const flyerEl = document.getElementById("flyer-image");
      if (flyerEl) {
        flyerEl.src = data.value;
        flyerEl.parentElement.classList.remove("hidden");
      }
    }
  } catch (err) {
    console.warn("Flyer not available:", err);
  }
}

// --- Form Validation ---
function validateField(input) {
  const id = input.id;
  const value = input.value.trim();
  let error = "";

  if (id === "nome") {
    if (value.length < 2) error = "Nome deve ter pelo menos 2 caracteres.";
  } else if (id === "email") {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) error = "E-mail invalido.";
  } else if (id === "telefone") {
    const digits = value.replace(/\D/g, "");
    if (digits.length < 9) error = "Telefone deve ter pelo menos 9 digitos.";
  }

  const errorEl = document.getElementById(id + "-error");
  if (error) {
    input.classList.add("form-error");
    if (errorEl) errorEl.textContent = error;
  } else {
    input.classList.remove("form-error");
    if (errorEl) errorEl.textContent = "";
  }

  return !error;
}

// --- Form Submission ---
function initForm() {
  const form = document.getElementById("register-form");
  const formContent = document.getElementById("form-content");
  const successMessage = document.getElementById("success-message");
  const btnAnother = document.getElementById("btn-another");

  if (!form) return;

  form.querySelectorAll(".form-input").forEach((input) => {
    input.addEventListener("blur", () => validateField(input));
    input.addEventListener("input", () => {
      if (input.classList.contains("form-error")) validateField(input);
    });
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const nome = document.getElementById("nome");
    const email = document.getElementById("email");
    const telefone = document.getElementById("telefone");
    const btn = document.getElementById("btn-submit");

    const validNome = validateField(nome);
    const validEmail = validateField(email);
    const validTel = validateField(telefone);

    if (!validNome || !validEmail || !validTel) return;

    btn.disabled = true;
    btn.textContent = "A enviar...";

    try {
      const { error } = await db.from("inscricoes").insert({
        nome: nome.value.trim(),
        email: email.value.trim(),
        telefone: telefone.value.trim(),
        status: "pendente",
      });

      if (error) {
        if (error.code === "23505") {
          alert("Este e-mail ja esta inscrito.");
        } else {
          alert("Erro ao enviar inscricao. Tenta novamente.");
          console.error(error);
        }
        btn.disabled = false;
        btn.textContent = "Enviar Inscricao";
        return;
      }

      formContent.classList.add("hidden");
      successMessage.classList.remove("hidden");
    } catch (err) {
      console.error(err);
      alert("Erro de conexao. Verifica a tua internet.");
      btn.disabled = false;
      btn.textContent = "Enviar Inscricao";
    }
  });

  if (btnAnother) {
    btnAnother.addEventListener("click", () => {
      form.reset();
      form.querySelectorAll(".form-input").forEach((i) => i.classList.remove("form-error"));
      form.querySelectorAll(".error-text").forEach((e) => (e.textContent = ""));
      document.getElementById("btn-submit").disabled = false;
      document.getElementById("btn-submit").textContent = "Enviar Inscricao";
      successMessage.classList.add("hidden");
      formContent.classList.remove("hidden");
    });
  }
}

// --- Init ---
initCountdown();
loadEventDetails();
loadFlyer();
initForm();
