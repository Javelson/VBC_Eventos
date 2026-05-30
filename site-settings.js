/* ============================================
   VB Conexao - Shared Site Settings Loader
   Loads logo + footer from Supabase settings
   ============================================ */

import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const db = createClient(
  "https://opcsqdjyyxahxiyxlwpv.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wY3NxZGp5eXhhaHhpeXhsd3B2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4NzYyMDUsImV4cCI6MjA5NTQ1MjIwNX0.X_Zx7cmbdYwbUp7eOjy2SgDqxVefA2oBSGN-vFysB5U"
);

export async function loadSiteSettings() {
  try {
    const keys = ["site_logo_url", "site_logo_size", "footer_text", "footer_credit"];
    const { data } = await db
      .from("settings")
      .select("key, value")
      .in("key", keys);

    if (!data || data.length === 0) return;

    const settings = {};
    data.forEach((row) => { settings[row.key] = row.value; });

    // Update logos (header + footer)
    if (settings.site_logo_url) {
      document.querySelectorAll(".site-logo").forEach((el) => {
        el.src = settings.site_logo_url;
      });
    }

    // Update logo size
    if (settings.site_logo_size) {
      const size = settings.site_logo_size + "px";
      document.querySelectorAll(".site-logo").forEach((el) => {
        el.style.width = size;
        el.style.height = size;
      });
    }

    // Update footer text
    if (settings.footer_text) {
      const footerText = document.getElementById("footer-text");
      if (footerText) footerText.textContent = settings.footer_text;
    }

    // Update footer credit
    if (settings.footer_credit) {
      const footerCredit = document.getElementById("footer-credit");
      if (footerCredit) footerCredit.textContent = settings.footer_credit;
    }
  } catch (err) {
    console.warn("Site settings not available:", err);
  }
}

// Auto-load on import
loadSiteSettings();
