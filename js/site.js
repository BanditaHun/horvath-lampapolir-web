// Közös motor a többoldalas Horváth Lámpapolír oldalhoz.
// Minden oldal egy vékony váz (body[data-page]); ez a fájl építi fel a
// fejlécet/menüt/láblécet, betölti a megjelenést (theme.json), és az adott
// oldal tartalmát a content/*.json fájlokból rendereli.

// ---------- Segédfüggvények ----------
async function loadJSON(path) {
  const res = await fetch(path, { cache: "no-store" });
  if (!res.ok) throw new Error("Nem sikerült betölteni: " + path);
  return res.json();
}
function el(tag, className, html) {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (html !== undefined) e.innerHTML = html;
  return e;
}
function esc(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );
}
function telHref(phone) {
  const digits = (phone || "").replace(/[^\d+]/g, "");
  return digits ? "tel:" + digits : "kapcsolat.html";
}
function whatsappHref(phone) {
  let d = (phone || "").replace(/[^\d]/g, "");
  if (!d) return "";
  if (d.charAt(0) === "0" && d.charAt(1) === "6") d = "36" + d.slice(2); // 06.. -> 36..
  return "https://wa.me/" + d + "?text=" + encodeURIComponent("Szia! A weboldaladról írok, fényszóró-felújítás iránt érdeklődöm.");
}
function mdBlock(str) {
  if (str == null || str === "") return "";
  return window.marked ? window.marked.parse(String(str)) : esc(str);
}
function mdInline(str) {
  if (str == null || str === "") return "";
  return window.marked ? window.marked.parseInline(String(str)) : esc(str);
}
const isSet = (v) => typeof v === "string" && v.trim() && v.trim() !== "#";
// A "/images/..." abszolút útvonalat relatívvá teszi, hogy alkönyvtáron (pl. GitHub Pages) is működjön.
const rel = (u) => (typeof u === "string" && u.charAt(0) === "/" && u.charAt(1) !== "/" ? u.slice(1) : u);

// ---------- Betűtípusok (theme.json) ----------
const SYSTEM_FONT = '"Segoe UI", system-ui, -apple-system, Roboto, Arial, sans-serif';
const FONT_MAP = {
  "Rendszer (alap)": { css: SYSTEM_FONT, g: null },
  Montserrat: { css: "'Montserrat', sans-serif", g: "Montserrat:wght@400;600;800" },
  Poppins: { css: "'Poppins', sans-serif", g: "Poppins:wght@400;600;800" },
  Roboto: { css: "'Roboto', sans-serif", g: "Roboto:wght@400;700;900" },
  Inter: { css: "'Inter', sans-serif", g: "Inter:wght@400;600;800" },
  Oswald: { css: "'Oswald', sans-serif", g: "Oswald:wght@400;600;700" },
  Rajdhani: { css: "'Rajdhani', sans-serif", g: "Rajdhani:wght@500;600;700" },
  "Bebas Neue": { css: "'Bebas Neue', sans-serif", g: "Bebas+Neue" },
  Anton: { css: "'Anton', sans-serif", g: "Anton" },
};
function loadGoogleFonts(specs) {
  const families = specs.filter(Boolean);
  if (!families.length) return;
  const p1 = el("link"); p1.rel = "preconnect"; p1.href = "https://fonts.googleapis.com";
  const p2 = el("link"); p2.rel = "preconnect"; p2.href = "https://fonts.gstatic.com"; p2.crossOrigin = "anonymous";
  const link = el("link"); link.rel = "stylesheet";
  link.href = "https://fonts.googleapis.com/css2?" + families.map((f) => "family=" + f).join("&") + "&display=swap";
  document.head.append(p1, p2, link);
}
function applyTheme(theme) {
  if (!theme) return;
  const root = document.documentElement.style;
  const body = FONT_MAP[theme.font_family] || FONT_MAP["Rendszer (alap)"];
  const heading = FONT_MAP[theme.heading_font_family] || body;
  root.setProperty("--font-body", body.css);
  root.setProperty("--font-heading", heading.css);
  loadGoogleFonts([...new Set([body.g, heading.g])]);
  if (theme.base_font_size) root.setProperty("--base-font-size", theme.base_font_size);
  if (theme.heading_scale) root.setProperty("--heading-scale", String(theme.heading_scale));
  if (theme.accent_color) {
    root.setProperty("--gold", theme.accent_color);
    root.setProperty("--gold-dim", theme.accent_color);
  }
}

// ---------- Fejléc / menü / lábléc ----------
const NAV = [
  { href: "index.html", label: "Kezdőlap", page: "home" },
  { href: "csomagok.html", label: "Csomagok", page: "csomagok" },
  { href: "szolgaltatasok.html", label: "Szolgáltatások", page: "szolgaltatasok" },
  { href: "kiszallas.html", label: "Kiszállás", page: "kiszallas" },
  { href: "galeria.html", label: "Galéria", page: "galeria" },
  { href: "kapcsolat.html", label: "Kapcsolat", page: "kapcsolat", cta: true },
];
const ICON_PHONE = '<svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true"><path fill="currentColor" d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.2.2 2.4.6 3.6.1.4 0 .8-.2 1l-2.3 2.2z"/></svg>';
const ICON_FB = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.4v7A10 10 0 0 0 22 12z"/></svg>';
const ICON_WHATSAPP = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M17.5 14.4c-.3-.2-1.7-.8-2-.9-.3-.1-.5-.2-.6.2-.2.3-.7.9-.9 1.1-.2.2-.3.2-.6.1-1.7-.9-2.9-1.6-4-3.6-.3-.5.3-.5.8-1.6.1-.2 0-.4 0-.5-.1-.1-.6-1.5-.9-2.1-.2-.5-.4-.5-.6-.5h-.5c-.2 0-.5.1-.7.3-.9.9-1.1 2-.7 3.3.5 1.5 1.5 2.9 1.7 3.1.2.3 2.6 4 6.3 5.5.9.4 1.6.6 2.1.8.9.3 1.7.2 2.3.1.7-.1 1.7-.7 2-1.4.2-.7.2-1.2.2-1.4-.1-.1-.3-.2-.6-.3zM12 2C6.5 2 2 6.5 2 12c0 1.8.5 3.5 1.3 5L2 22l5.1-1.3c1.4.8 3.1 1.3 4.9 1.3 5.5 0 10-4.5 10-10S17.5 2 12 2zm0 18c-1.6 0-3.1-.4-4.4-1.2l-.3-.2-3 .8.8-2.9-.2-.3C4.4 15.1 4 13.6 4 12c0-4.4 3.6-8 8-8s8 3.6 8 8-3.6 8-8 8z"/></svg>';
const ICON_IG = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M12 2.2c3.2 0 3.6 0 4.9.1 1.2.1 1.8.3 2.2.4.6.2 1 .5 1.4.9.4.4.7.8.9 1.4.2.4.4 1 .4 2.2.1 1.3.1 1.7.1 4.9s0 3.6-.1 4.9c-.1 1.2-.3 1.8-.4 2.2-.2.6-.5 1-.9 1.4-.4.4-.8.7-1.4.9-.4.2-1 .4-2.2.4-1.3.1-1.7.1-4.9.1s-3.6 0-4.9-.1c-1.2-.1-1.8-.3-2.2-.4-.6-.2-1-.5-1.4-.9-.4-.4-.7-.8-.9-1.4-.2-.4-.4-1-.4-2.2-.1-1.3-.1-1.7-.1-4.9s0-3.6.1-4.9c.1-1.2.3-1.8.4-2.2.2-.6.5-1 .9-1.4.4-.4.8-.7 1.4-.9.4-.2 1-.4 2.2-.4 1.3-.1 1.7-.1 4.9-.1zm0 1.8c-3.1 0-3.5 0-4.7.1-1.1.1-1.7.2-2.1.4-.5.2-.9.4-1.3.8-.4.4-.6.8-.8 1.3-.2.4-.3 1-.4 2.1C4 8.5 4 8.9 4 12s0 3.5.1 4.7c.1 1.1.2 1.7.4 2.1.2.5.4.9.8 1.3.4.4.8.6 1.3.8.4.2 1 .3 2.1.4 1.2.1 1.6.1 4.7.1s3.5 0 4.7-.1c1.1-.1 1.7-.2 2.1-.4.5-.2.9-.4 1.3-.8.4-.4.6-.8.8-1.3.2-.4.3-1 .4-2.1.1-1.2.1-1.6.1-4.7s0-3.5-.1-4.7c-.1-1.1-.2-1.7-.4-2.1-.2-.5-.4-.9-.8-1.3-.4-.4-.8-.6-1.3-.8-.4-.2-1-.3-2.1-.4-1.2-.1-1.6-.1-4.7-.1zm0 3.1a4.9 4.9 0 1 1 0 9.8 4.9 4.9 0 0 1 0-9.8zm0 8.1a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4zm6.3-8.3a1.1 1.1 0 1 1-2.3 0 1.1 1.1 0 0 1 2.3 0z"/></svg>';

const ICON_CHAT = '<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><path fill="currentColor" d="M12 3C6.9 3 3 6.6 3 11c0 2.1.9 4 2.4 5.4-.1 1.1-.5 2.3-1.3 3.3-.2.3 0 .8.4.7 1.7-.3 3.1-.9 4.1-1.6 1 .3 2.2.5 3.4.5 5.1 0 9-3.6 9-8s-3.9-8-9-8zm-4 9a1.2 1.2 0 1 1 0-2.4 1.2 1.2 0 0 1 0 2.4zm4 0a1.2 1.2 0 1 1 0-2.4 1.2 1.2 0 0 1 0 2.4zm4 0a1.2 1.2 0 1 1 0-2.4 1.2 1.2 0 0 1 0 2.4z"/></svg>';
const ICON_SEND = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="M3.4 20.4l17.4-8.4c.7-.3.7-1.3 0-1.6L3.4 2C2.8 1.7 2.1 2.3 2.3 3l1.8 6.4c.1.3.3.5.6.5l8.3 1.1c.3 0 .3.4 0 .5l-8.3 1.1c-.3 0-.5.2-.6.5L2.3 21c-.2.7.5 1.3 1.1 1z"/></svg>';
const ICON_DOWNLOAD = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M12 3a1 1 0 0 1 1 1v8.6l2.3-2.3a1 1 0 1 1 1.4 1.4l-4 4a1 1 0 0 1-1.4 0l-4-4a1 1 0 1 1 1.4-1.4l2.3 2.3V4a1 1 0 0 1 1-1zM5 18a1 1 0 0 1 1 1v1h12v-1a1 1 0 1 1 2 0v2a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-2a1 1 0 0 1 1-1z"/></svg>';
// Footer „Információk" ikonok (currentColor, öröklik a link színét)
const IC_ATTR = 'viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"';
const ICON_LI_RECEIPT = '<svg ' + IC_ATTR + '><path d="M14 3H7a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V8z"/><path d="M14 3v5h5"/><path d="M9 13h6M9 17h4"/></svg>';
const ICON_LI_CERT = '<svg ' + IC_ATTR + '><path d="M12 3l7 3v5c0 4.5-3 7.4-7 9-4-1.6-7-4.5-7-9V6z"/><path d="M9 12l2 2 4-4"/></svg>';
const ICON_LI_FAQ = '<svg ' + IC_ATTR + '><circle cx="12" cy="12" r="9"/><path d="M9.5 9.2a2.5 2.5 0 1 1 3.4 2.3c-.8.4-1.1.9-1.1 1.7"/><path d="M12 16.5h.01"/></svg>';
const ICON_LI_LOCK = '<svg ' + IC_ATTR + '><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>';
const ICON_LI_INFO = '<svg ' + IC_ATTR + '><circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><path d="M12 8h.01"/></svg>';

function buildAiWidget(ai) {
  if (!ai || ai.enabled === false || ai.enabled === "false" || !isSet(ai.api_url)) return;
  if (document.querySelector(".ai-fab")) return;
  const title = isSet(ai.title) ? ai.title : "AI segéd";
  const label = isSet(ai.launch_label) ? ai.launch_label : "Kérdezz!";
  const greeting = isSet(ai.greeting) ? ai.greeting : "Szia! Miben segíthetek?";

  const fab = document.createElement("button");
  fab.className = "ai-fab"; fab.type = "button"; fab.setAttribute("aria-label", title);
  fab.innerHTML = ICON_CHAT;
  fab.title = label;

  const panel = document.createElement("section");
  panel.className = "ai-panel"; panel.hidden = true; panel.setAttribute("aria-label", title);
  panel.innerHTML =
    `<header class="ai-head"><span class="ai-head__dot"></span><span class="ai-head__title">${esc(title)}</span>` +
    `<button class="ai-head__close" type="button" aria-label="Bezárás">&times;</button></header>` +
    `<div class="ai-msgs" id="ai-msgs"></div>` +
    `<form class="ai-form" id="ai-form"><input type="text" id="ai-input" autocomplete="off" ` +
    `placeholder="Írd ide a kérdésed…" maxlength="500" /><button type="submit" aria-label="Küldés">${ICON_SEND}</button></form>` +
    `<div class="ai-note">Tájékoztató jellegű – pontos időpontért hívj vagy írj WhatsAppon: +36 20 541 8369.</div>`;

  document.body.append(fab, panel);
  const msgsBox = panel.querySelector("#ai-msgs");
  const input = panel.querySelector("#ai-input");
  const history = [];
  let busy = false;

  const addMsg = (who, text) => {
    const m = document.createElement("div");
    m.className = "ai-msg ai-msg--" + who;
    m.textContent = text;
    msgsBox.appendChild(m);
    msgsBox.scrollTop = msgsBox.scrollHeight;
    return m;
  };
  addMsg("bot", greeting);

  const openPanel = () => { panel.hidden = false; fab.classList.add("ai-fab--hidden"); setTimeout(() => input.focus(), 50); };
  const closePanel = () => { panel.hidden = true; fab.classList.remove("ai-fab--hidden"); };
  fab.addEventListener("click", openPanel);
  panel.querySelector(".ai-head__close").addEventListener("click", closePanel);

  panel.querySelector("#ai-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    if (busy) return;
    const text = input.value.trim();
    if (!text) return;
    input.value = "";
    addMsg("user", text);
    history.push({ role: "user", text });
    busy = true;
    const typing = addMsg("bot", "…");
    typing.classList.add("ai-msg--typing");
    try {
      const res = await fetch(ai.api_url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history.slice(-12) }),
      });
      const data = await res.json().catch(() => ({}));
      typing.remove();
      if (data && data.reply) {
        addMsg("bot", data.reply);
        history.push({ role: "model", text: data.reply });
      } else {
        addMsg("bot", (data && data.error) || "Elnézést, most nem tudok válaszolni. Hívj: +36 20 541 8369.");
      }
    } catch (err) {
      typing.remove();
      addMsg("bot", "Hiba történt a kapcsolatban. Kérlek hívj: +36 20 541 8369.");
    } finally {
      busy = false;
      input.focus();
    }
  });
}

const ICON_SUN = '<svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true"><circle cx="12" cy="12" r="4.5" fill="currentColor"/><g stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><line x1="12" y1="2" x2="12" y2="4.2"/><line x1="12" y1="19.8" x2="12" y2="22"/><line x1="2" y1="12" x2="4.2" y2="12"/><line x1="19.8" y1="12" x2="22" y2="12"/><line x1="4.9" y1="4.9" x2="6.5" y2="6.5"/><line x1="17.5" y1="17.5" x2="19.1" y2="19.1"/><line x1="4.9" y1="19.1" x2="6.5" y2="17.5"/><line x1="17.5" y1="6.5" x2="19.1" y2="4.9"/></g></svg>';
const ICON_MOON = '<svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true"><path fill="currentColor" d="M20.5 14.6A8.2 8.2 0 0 1 9.4 3.5a8.2 8.2 0 1 0 11.1 11.1z"/></svg>';
const ICON_GOOGLE = '<svg viewBox="0 0 48 48" width="18" height="18" aria-hidden="true"><path fill="#4285F4" d="M45 24c0-1.6-.1-2.8-.4-4.1H24v7.7h12c-.2 1.9-1.5 4.8-4.3 6.7l6.6 5.1C42.6 36 45 30.6 45 24z"/><path fill="#34A853" d="M24 46c5.9 0 10.8-1.9 14.4-5.3l-6.6-5.1c-1.8 1.2-4.2 2.1-7.8 2.1-6 0-11-4-12.8-9.5l-6.8 5.3C7.9 40.6 15.3 46 24 46z"/><path fill="#FBBC05" d="M11.2 28.2c-.5-1.4-.7-2.8-.7-4.2s.2-2.8.7-4.2l-6.8-5.3C3 17.3 2 20.5 2 24s1 6.7 2.4 9.5l6.8-5.3z"/><path fill="#EA4335" d="M24 10.5c3.3 0 5.6 1.4 6.9 2.6l5.8-5.7C33.3 4.1 28.9 2 24 2 15.3 2 7.9 7.4 4.4 14.5l6.8 5.3C13 14.5 18 10.5 24 10.5z"/></svg>';

function buildHeader(active) {
  const links = NAV.map((n) => {
    const cls = [n.cta ? "nav__cta" : "", n.page === active ? "is-active" : ""].filter(Boolean).join(" ");
    return `<li><a class="${cls}" href="${n.href}">${n.label}</a></li>`;
  }).join("");
  return `
  <nav class="nav" id="nav">
    <div class="nav__top">
      <a class="nav__brand" href="index.html">
        <img class="nav__logo" src="images/logo.png" alt="Horváth Lámpapolír" onerror="this.style.display='none'" />
      </a>
      <div class="nav__title">
        <span class="nav__title-main">Horváth Lámpapolír</span>
        <span class="nav__title-sub">Mobil fényszóró-felújítás – házhoz megyünk</span>
      </div>
      <div class="nav__right">
        <a class="topbar__phone" id="top-phone" href="#" hidden>${ICON_PHONE}<span id="top-phone-text"></span></a>
        <a class="topbar__social" id="top-email" href="#" aria-label="E-mail küldése" hidden>${ICON_MAIL}</a>
        <a class="topbar__social" id="top-fb" href="#" target="_blank" rel="noopener" aria-label="Facebook" hidden>${ICON_FB}</a>
        <button class="theme-toggle" id="theme-toggle" type="button" aria-label="Sötét / világos mód"><span class="ic-sun">${ICON_SUN}</span><span class="ic-moon">${ICON_MOON}</span></button>
        <button class="nav__toggle" id="nav-toggle" aria-label="Menü" aria-expanded="false"><span></span><span></span><span></span></button>
      </div>
    </div>
    <ul class="nav__links" id="nav-links">${links}</ul>
  </nav>`;
}
const ICON_MAIL = '<svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true"><path fill="currentColor" d="M3 5h18a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zm1.4 2 7.6 5.3L19.6 7H4.4zM20 8.9l-8 5.6-8-5.6V17h16V8.9z"/></svg>';
const PAY_BADGES =
  '<span class="pay-badge" title="Bankkártya – érintéses"><svg viewBox="0 0 40 26" width="40" height="26" aria-hidden="true"><rect width="40" height="26" rx="3.5" fill="#fff"/><rect x="4" y="6.5" width="21" height="14" rx="2" fill="none" stroke="#374151" stroke-width="1.5"/><rect x="4.7" y="9.3" width="19.6" height="2.6" fill="#374151"/><path d="M30 9a5.5 5.5 0 0 1 0 8.5" fill="none" stroke="#16a34a" stroke-width="1.7" stroke-linecap="round"/><path d="M32.7 6.7a9 9 0 0 1 0 13.1" fill="none" stroke="#16a34a" stroke-width="1.7" stroke-linecap="round"/></svg></span>' +
  '<span class="pay-badge" title="Mastercard"><svg viewBox="0 0 40 26" width="40" height="26" aria-hidden="true"><rect width="40" height="26" rx="3.5" fill="#fff"/><circle cx="16.5" cy="13" r="7.4" fill="#EB001B"/><circle cx="23.5" cy="13" r="7.4" fill="#F79E1B"/><path d="M20 7.5a7.4 7.4 0 0 0 0 11 7.4 7.4 0 0 0 0-11z" fill="#FF5F00"/></svg></span>' +
  '<span class="pay-badge" title="Visa"><svg viewBox="0 0 40 26" width="40" height="26" aria-hidden="true"><rect width="40" height="26" rx="3.5" fill="#fff"/><text x="20" y="17.6" font-family="Arial,Helvetica,sans-serif" font-size="11.5" font-weight="800" font-style="italic" fill="#1A1F71" text-anchor="middle" letter-spacing="0.4">VISA</text></svg></span>' +
  '<span class="pay-badge" title="Készpénz"><svg viewBox="0 0 40 26" width="40" height="26" aria-hidden="true"><rect width="40" height="26" rx="3.5" fill="#fff"/><rect x="5" y="7" width="30" height="12.5" rx="2" fill="#2f8f4e"/><circle cx="20" cy="13.2" r="3.4" fill="#eafbf0"/><rect x="7.6" y="9.4" width="1.8" height="7.6" rx="0.9" fill="#eafbf0" opacity="0.7"/><rect x="30.6" y="9.4" width="1.8" height="7.6" rx="0.9" fill="#eafbf0" opacity="0.7"/></svg></span>';

// Saját prémium-jelvény (aranyszínű medál, márkanevek nélkül) – nincs jogi/hivatkozási kockázat.
const ICON_PREMIUM_SEAL =
  '<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Prémium alapanyagok jelvény">' +
  '<defs><linearGradient id="hlpPrem" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe08a"/><stop offset="0.5" stop-color="#f0b429"/><stop offset="1" stop-color="#c1850f"/></linearGradient>' +
  '<path id="hlpPremTop" d="M22,60 a38,38 0 0 1 76,0" fill="none"/></defs>' +
  '<circle cx="60" cy="60" r="56" fill="none" stroke="url(#hlpPrem)" stroke-width="2.5" stroke-dasharray="1.5 4.5" stroke-linecap="round"/>' +
  '<circle cx="60" cy="60" r="47" fill="#17171b" stroke="url(#hlpPrem)" stroke-width="3.5"/>' +
  '<text font-family="Georgia, \'Times New Roman\', serif" font-size="8" font-weight="700" letter-spacing="0.5" fill="url(#hlpPrem)"><textPath href="#hlpPremTop" startOffset="50%" text-anchor="middle">PRÉMIUM MINŐSÉG</textPath></text>' +
  '<path d="M60 39 L64.5 55.5 L81 60 L64.5 64.5 L60 81 L55.5 64.5 L39 60 L55.5 55.5 Z" fill="url(#hlpPrem)"/>' +
  '<circle cx="60" cy="60" r="3.2" fill="#17171b"/>' +
  '<text x="60" y="95" font-family="Georgia, \'Times New Roman\', serif" font-size="9" font-weight="700" letter-spacing="1.6" fill="url(#hlpPrem)" text-anchor="middle">ALAPANYAGOK</text>' +
  '<text x="60" y="105.5" font-size="7.5" letter-spacing="2.5" fill="#f0b429" text-anchor="middle" opacity="0.9">★ ★ ★</text>' +
  '</svg>';

function premiumSection(H) {
  const heading = isSet(H && H.premium_heading) ? H.premium_heading : "Prémium alapanyagokkal dolgozom";
  const lead = isSet(H && H.premium_lead) ? H.premium_lead : "A minőség nálam az anyagnál kezdődik. Csak professzionális, bevált termékekkel dolgozom – ezért lesz tartós és igazán szép az eredmény.";
  const DEF = [
    { icon: "✨", title: "UV-álló védőréteg", text: "tartós, prémium védőbevonat, ami nem mattul vissza pár hónap alatt" },
    { icon: "🧪", title: "Profi polírrendszer", text: "több lépcsős, minőségi csiszoló- és polírpaszták a kristálytiszta eredményért" },
    { icon: "💧", title: "Tartós nano bevonat", text: "üvegre prémium vízlepergető réteg a jobb látásért esőben" },
    { icon: "🛡️", title: "Nyugodt garancia", text: "a minőségi anyag miatt tudok jó szívvel garanciát adni a munkára" },
  ];
  const points = Array.isArray(H && H.premium_points) && H.premium_points.length ? H.premium_points : DEF;
  const pts = points.map((p) => `<li><span class="premium__ic" aria-hidden="true">${esc(p.icon || "✓")}</span><span><strong>${esc(p.title || "")}</strong>${isSet(p.text) ? " – " + esc(p.text) : ""}</span></li>`).join("");
  return `<div class="container"><section class="premium">
    <div class="premium__badge">${ICON_PREMIUM_SEAL}</div>
    <div class="premium__body">
      <h2 class="premium__title">${esc(heading)}</h2>
      <p class="premium__lead">${mdInline(lead)}</p>
      <ul class="premium__points">${pts}</ul>
    </div>
  </section></div>`;
}

function buildFooter() {
  return `<footer class="site-footer">
    <div class="container site-footer__inner">
      <div class="site-footer__brand">
        <img class="site-footer__logo" src="images/logo.png" alt="" onerror="this.style.display='none'" />
        <div class="site-footer__brandtext">
          <strong>Horváth Lámpapolír</strong>
          <span id="footer-subtitle">Mobil fényszóró-felújítás Tolna megyében, 50 km-es körzetben</span>
          <span class="site-footer__tags" id="footer-tags">Házhoz megyünk – magánszemélyeknek, cégeknek és flottáknak egyaránt –, a munkára 1 év garanciát és számlát adunk.</span>
        </div>
        <div class="site-footer__pay">
          <div class="site-footer__pay-badges" aria-label="Elfogadott fizetési módok">${PAY_BADGES}</div>
          <span class="site-footer__pay-txt" id="footer-pay-text">Bankkártya (érintéses is), Mastercard, Visa és készpénz</span>
        </div>
      </div>
      <div class="site-footer__col">
        <h4 class="site-footer__h">Elérhetőség</h4>
        <div class="site-footer__contact" id="footer-contact"></div>
      </div>
      <nav class="site-footer__col" aria-label="Oldalak">
        <h4 class="site-footer__h">Oldalak</h4>
        <div class="site-footer__links">
          <a href="index.html">Kezdőlap</a>
          <a href="csomagok.html">Csomagok</a>
          <a href="szolgaltatasok.html">Szolgáltatások</a>
          <a href="kiszallas.html">Kiszállás</a>
          <a href="galeria.html">Galéria</a>
          <a href="kapcsolat.html">Kapcsolat</a>
        </div>
      </nav>
      <nav class="site-footer__col" aria-label="Információk">
        <h4 class="site-footer__h">Információk</h4>
        <div class="site-footer__links site-footer__links--icons">
          <a href="arlista.html" target="_blank" rel="noopener">${ICON_LI_RECEIPT}<span>Árlista (PDF)</span></a>
          <a href="garancia.html" target="_blank" rel="noopener">${ICON_LI_CERT}<span>Garancialevél (PDF)</span></a>
          <a href="gyik.html">${ICON_LI_FAQ}<span>GYIK – Gyakori kérdések</span></a>
          <a href="adatvedelem.html">${ICON_LI_LOCK}<span>Adatvédelmi tájékoztató</span></a>
          <a href="impresszum.html">${ICON_LI_INFO}<span>Impresszum</span></a>
        </div>
      </nav>
    </div>
    <div class="site-footer__bottom">
      <span>© <span id="year"></span> Horváth Lámpapolír – mobil fényszóró-felújítás</span>
    </div>
  </footer>`;
}
function populateFooter(contact) {
  const box = document.getElementById("footer-contact");
  if (!box || !contact) return;
  const parts = [];
  if (isSet(contact.phone)) parts.push(`<a class="site-footer__link" href="${telHref(contact.phone)}">${ICON_PHONE}<span>${esc(contact.phone)}</span></a>`);
  if (isSet(contact.email)) parts.push(`<a class="site-footer__link" href="mailto:${esc(contact.email)}">${ICON_MAIL}<span>${esc(contact.email)}</span></a>`);
  if (isSet(contact.facebook_url)) parts.push(`<a class="site-footer__link site-footer__link--fb" href="${esc(contact.facebook_url)}" target="_blank" rel="noopener">${ICON_FB}<span>Facebook</span></a>`);
  if (isSet(contact.google_url)) parts.push(`<a class="site-footer__link" href="${esc(contact.google_url)}" target="_blank" rel="noopener">${ICON_GOOGLE}<span>Google</span></a>`);
  box.innerHTML = parts.join("");
}

// Animált, pislákoló csillagos háttér (fix, a tartalom mögött)
function buildStarfield(count) {
  if (document.querySelector(".starfield")) return;
  count = count || 110;
  const sf = document.createElement("div");
  sf.className = "starfield";
  sf.setAttribute("aria-hidden", "true");
  const frag = document.createDocumentFragment();
  for (let i = 0; i < count; i++) {
    const s = document.createElement("span");
    s.className = "star" + (Math.random() < 0.22 ? " star--gold" : "");
    const size = (Math.random() * 1.8 + 0.8).toFixed(2);
    s.style.width = s.style.height = size + "px";
    s.style.left = (Math.random() * 100).toFixed(2) + "%";
    s.style.top = (Math.random() * 100).toFixed(2) + "%";
    s.style.setProperty("--dur", (Math.random() * 3 + 2).toFixed(2) + "s");
    s.style.animationDelay = (Math.random() * 5).toFixed(2) + "s";
    frag.appendChild(s);
  }
  sf.appendChild(frag);
  document.body.prepend(sf);
}
function wireNav() {
  const nav = document.getElementById("nav");
  const toggle = document.getElementById("nav-toggle");
  const links = document.getElementById("nav-links");
  if (!nav || !toggle || !links) return;
  toggle.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(open));
  });
  links.querySelectorAll("a").forEach((a) =>
    a.addEventListener("click", () => { nav.classList.remove("open"); toggle.setAttribute("aria-expanded", "false"); })
  );
  const y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();
}
function populateTopbar(contact) {
  if (!contact) return;
  if (isSet(contact.phone)) {
    document.getElementById("top-phone-text").textContent = contact.phone;
    const tp = document.getElementById("top-phone"); tp.href = telHref(contact.phone); tp.hidden = false;
  }
  if (isSet(contact.email)) {
    const te = document.getElementById("top-email");
    te.href = "mailto:" + contact.email;
    te.title = contact.email;
    te.hidden = false;
  }
  if (isSet(contact.facebook_url)) { const t = document.getElementById("top-fb"); t.href = contact.facebook_url; t.hidden = false; }
}

// ---------- Neon kártyák ----------
function neonCard(i, inner, extraClass, href) {
  const tag = href ? "a" : "article";
  const card = el(tag, "neon-card" + (extraClass ? " " + extraClass : ""), inner);
  if (href) { card.href = href; }
  card.style.animationDelay = (i % 6) * 0.35 + "s";
  return card;
}

// ---------- Oldalankénti renderelés ----------
function pageHead(heading, intro) {
  return `<div class="container"><header class="page__head">
    <h1 class="page__title">${esc(heading || "")}</h1>
    ${intro ? `<div class="rich page__intro">${mdBlock(intro)}</div>` : ""}
  </header></div>`;
}

// ---------- Vélemények / értékelés ----------
function starsHTML(n) {
  n = Math.max(0, Math.min(5, parseInt(n, 10) || 0));
  let s = "";
  for (let i = 0; i < 5; i++) s += `<span class="star${i < n ? " star--on" : ""}">★</span>`;
  return `<div class="stars" aria-label="${n}/5 csillag">${s}</div>`;
}
// ---------- Google-értékelések (Places proxy) ----------
const GREVIEWS_URL = "https://horvath-greviews.andras-horvat1989.workers.dev";
function gReviewCardHTML(r) {
  const text = esc(r.text || "").replace(/\n/g, "<br>");
  const initial = esc((r.name || "G").trim().charAt(0).toUpperCase());
  return `<article class="neon-card greview-card">
    <div class="greview-card__head">
      <span class="greview-card__avatar" aria-hidden="true">${initial}</span>
      <div class="greview-card__who">
        <span class="greview-card__name">${esc(r.name || "Google felhasználó")}</span>
        <span class="greview-card__src">${ICON_GOOGLE}<span>${esc(r.time || "")}</span></span>
      </div>
    </div>
    ${starsHTML(r.rating)}
    <div class="review-card__text">${text}</div>
  </article>`;
}
async function initGoogleReviews(contact) {
  const box = document.getElementById("greviews");
  if (!box) return;
  let d = null;
  try {
    const res = await fetch(GREVIEWS_URL, { cache: "no-store" });
    if (res.ok) d = await res.json();
  } catch (e) { /* nem elérhető -> rejtve marad */ }
  if (!d || !d.configured || !Array.isArray(d.reviews) || !d.reviews.length) return;

  const moreUrl = isSet(d.url) ? d.url : (contact && isSet(contact.google_url) ? contact.google_url : "");
  const ratingTxt = d.rating ? String(d.rating).replace(".", ",") : "";
  const head = `<div class="greviews__head">
      <span class="greviews__badge">${ICON_GOOGLE}<span>Google értékelések</span></span>
      ${d.rating ? `<span class="greviews__score"><strong>${ratingTxt}</strong>${starsHTML(Math.round(d.rating))}${d.count ? `<span class="greviews__count">${d.count} értékelés</span>` : ""}</span>` : ""}
    </div>`;
  const grid = `<div class="greviews__grid">${d.reviews.map(gReviewCardHTML).join("")}</div>`;
  const foot = moreUrl ? `<a class="greviews__more" href="${esc(moreUrl)}" target="_blank" rel="noopener">Összes értékelés a Google-on →</a>` : "";
  box.innerHTML = head + grid + foot;
  box.hidden = false;
}
function reviewCardHTML(r, i) {
  const text = esc(r.text || "").replace(/\n/g, "<br>"); // közönség által beküldött -> escape (XSS ellen)
  return `<article class="neon-card review-card" style="animation-delay:${(i % 6) * 0.35}s">
    ${starsHTML(r.rating)}
    <div class="review-card__text">${text}</div>
    <div class="review-card__meta">— ${esc(r.name || "Névtelen")}${r.date ? " · " + esc(r.date) : ""}</div>
  </article>`;
}
function reviewsSummaryHTML(list) {
  if (!list.length) return "";
  const nums = list.map((r) => Math.max(1, Math.min(5, parseInt(r.rating, 10) || 5)));
  const avg = nums.reduce((a, b) => a + b, 0) / nums.length;
  return `<div class="reviews__summary">
      <span class="reviews__avg">${avg.toFixed(1).replace(".", ",")}</span>
      <div class="reviews__avg-stars">${starsHTML(Math.round(avg))}</div>
      <span class="reviews__count">${list.length} vélemény alapján</span>
    </div>`;
}
function reviewsSectionHTML(reviews, contact) {
  const apiUrl = reviews && isSet(reviews.api_url) ? reviews.api_url : "";
  const fbUrl = contact && isSet(contact.facebook_url) ? contact.facebook_url : "";
  const googUrl = contact && isSet(contact.google_review_url) ? contact.google_review_url : "";
  const starBtns = [1, 2, 3, 4, 5].map((i) => `<button type="button" class="star-btn" data-v="${i}" aria-label="${i} csillag">★</button>`).join("");
  let form = "";
  if (apiUrl) {
    form = `<div class="review-form-card">
      <h3 class="review-form-card__title">Írj véleményt vagy hozzászólást</h3>
      <form class="review-form" data-api="${esc(apiUrl)}">
        <input type="checkbox" name="botcheck" class="hp" tabindex="-1" autocomplete="off" />
        <div class="form-row"><label for="rv-name">Neved</label><input id="rv-name" type="text" name="name" required maxlength="60" /></div>
        <div class="form-row"><span class="form-label">Értékelés</span>
          <div class="star-input" id="star-input">${starBtns}</div>
          <input type="hidden" name="rating" id="rating-input" value="5" />
        </div>
        <div class="form-row"><label for="rv-msg">Véleményed / hozzászólásod</label><textarea id="rv-msg" name="message" rows="4" required maxlength="1000"></textarea></div>
        <button type="submit" class="btn btn--primary">Küldés</button>
        <p class="review-form__note">A véleményed a küldés után <strong>azonnal megjelenik</strong> az oldalon.</p>
      </form>
      ${(googUrl || fbUrl) ? `<p class="review-or">…vagy értékelj itt: ${googUrl ? `<a href="${esc(googUrl)}" target="_blank" rel="noopener">Google</a>` : ""}${googUrl && fbUrl ? " · " : ""}${fbUrl ? `<a href="${esc(fbUrl)}" target="_blank" rel="noopener">Facebook</a>` : ""}</p>` : ""}
    </div>`;
  } else if (fbUrl) {
    form = `<div class="review-cta"><p>Elégedett voltál? Örülnénk a véleményednek:</p>
      <a class="btn btn--primary" href="${esc(fbUrl)}" target="_blank" rel="noopener">Értékelés a Facebookon</a></div>`;
  }
  return `<section class="reviews" id="velemenyek"><div class="container"><div class="reviews__panel">
    <h2 class="page__title">${esc((reviews && reviews.heading) || "Vélemények")}</h2>
    ${reviews && reviews.intro ? `<div class="rich page__intro">${mdBlock(reviews.intro)}</div>` : ""}
    ${googUrl ? `<a class="btn btn--primary reviews__google-btn" href="${esc(googUrl)}" target="_blank" rel="noopener">${ICON_GOOGLE}<span>Értékelj minket a Google-on</span></a>` : ""}
    <div class="reviews__grid">
      <div class="reviews__main">
        <div id="greviews" class="greviews" hidden></div>
        <div id="reviews-summary"></div>
        <div class="reviews__list" id="reviews-list"></div>
      </div>
      <aside class="reviews__aside">${form}</aside>
    </div>
  </div></div></section>`;
}
async function initReviews(reviews, scope, contact) {
  const curated = (reviews && reviews.items) || [];
  const apiUrl = reviews && isSet(reviews.api_url) ? reviews.api_url.replace(/\/+$/, "") : "";
  let apiReviews = [];
  if (apiUrl) {
    try {
      const res = await fetch(apiUrl + "/list", { cache: "no-store" });
      if (res.ok) { const d = await res.json(); if (Array.isArray(d)) apiReviews = d; }
    } catch (e) { /* ha nem elérhető, csak a kézi vélemények látszanak */ }
  }
  const all = curated.concat(apiReviews);
  const listBox = document.getElementById("reviews-list");
  const summaryBox = document.getElementById("reviews-summary");
  const renderAll = () => {
    if (summaryBox) summaryBox.innerHTML = reviewsSummaryHTML(all);
    if (listBox) listBox.innerHTML = all.length
      ? all.map(reviewCardHTML).join("")
      : `<p class="reviews__empty">Még nincs közzétett vélemény – <strong>legyél te az első!</strong></p>`;
  };
  renderAll();
  initGoogleReviews(contact);

  const form = scope.querySelector(".review-form");
  if (!form) return;
  const starBtns = [...scope.querySelectorAll(".star-btn")];
  const ratingInput = scope.querySelector("#rating-input");
  const paint = (v) => starBtns.forEach((s) => s.classList.toggle("on", Number(s.dataset.v) <= v));
  paint(Number(ratingInput.value) || 5);
  starBtns.forEach((s) => s.addEventListener("click", () => { ratingInput.value = s.dataset.v; paint(Number(s.dataset.v)); }));

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const hp = form.querySelector('input[name="botcheck"]');
    if (hp && hp.checked) return; // spam-csapda
    const val = (n) => (form.querySelector('[name="' + n + '"]') || {}).value || "";
    const name = val("name").trim(), rating = val("rating"), message = val("message").trim();
    if (name.length < 2 || message.length < 3) { alert("Kérlek, add meg a neved és a véleményed."); return; }
    const api = form.getAttribute("data-api");
    const btn = form.querySelector('button[type="submit"]');
    const orig = btn.textContent; btn.disabled = true; btn.textContent = "Küldés…";
    try {
      const res = await fetch(api.replace(/\/+$/, "") + "/submit", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, rating, message, botcheck: "" }),
      });
      const data = await res.json();
      if (data.success && data.review) {
        all.unshift(data.review);
        renderAll();
        const card = form.closest(".review-form-card");
        if (card) card.innerHTML = '<p class="review-form__ok">Köszönjük a véleményed! Már meg is jelent az oldalon. 🙏</p>';
      } else { throw new Error((data && data.error) || "Ismeretlen hiba."); }
    } catch (err) {
      btn.disabled = false; btn.textContent = orig;
      alert("Nem sikerült elküldeni: " + (err && err.message ? err.message : "próbáld újra később."));
    }
  });
}

// Animált "reklám" buborékok a banner két oldalán (csak széles képernyőn)
const FLANK_LEFT = ["Kristálytiszta fény", "Ingyenes állapotfelmérés", "1 év garancia*"];
const FLANK_RIGHT = ["Házhoz megyünk", "UV-védelem", "Gyors, helyszíni munka"];
function flankChips(list) {
  return list
    .map((t, i) => `<div class="flank-chip" style="animation-delay:${(i * 0.45).toFixed(2)}s"><span class="flank-chip__ic">✦</span><span>${esc(t)}</span></div>`)
    .join("");
}
// Futó szalaghirdetés (ticker) a kezdőlapon
const TICKER_DEFAULT = [
  "Házhoz megyünk Tolna megyében",
  "Ingyenes állapotfelmérés",
  "1 év garancia*",
  "Kristálytiszta fény – biztonságosabb éjszakai vezetés",
  "50 km-es körzetben, akár csak a fényszóróért",
  "Professzionális, helyszíni munka",
];
function tickerBand(items) {
  const norm = (t) => (typeof t === "string" ? t : (t && (t.text || t.value)) || "");
  let list = Array.isArray(items) ? items.map(norm).filter(Boolean) : [];
  if (!list.length) list = TICKER_DEFAULT;
  const sep = '<span class="ticker__sep" aria-hidden="true">•</span>';
  const seq = list.map((t) => `<span class="ticker__item">${esc(t)}</span>`).join(sep);
  const half = seq + sep;
  return `<div class="ticker" aria-hidden="true"><div class="ticker__track">${half}${half}</div></div>`;
}

// Oldalsó elem: a feltöltött kép(ek) egymás alatt; a kép a kereten belül TELJESEN látszik (contain).
// A méret a keret magasságát (így a kép nagyságát) állítja. items: [{image, size}] VAGY string. size: "s"|"m"|"l".
const FLANK_GROW = { s: 1, m: 2, l: 3.5 };
function flankSide(side, items, chips) {
  const list = (Array.isArray(items) ? items : [items])
    .map((it) => (typeof it === "string" ? { image: it, size: "m" } : { image: it && it.image, size: (it && it.size) || "m" }))
    .filter((x) => isSet(x.image));
  const inner = list.length
    ? list.map((x) => `<figure class="flank-imgwrap" style="flex-grow:${FLANK_GROW[x.size] || 2}"><img class="flank-img" src="${esc(rel(x.image))}" alt="" loading="lazy" /></figure>`).join("")
    : flankChips(chips);
  return `<aside class="hero-flank hero-flank--${side}" aria-hidden="true">${inner}</aside>`;
}

function promoSection(promo) {
  if (!promo || promo.active === false || promo.active === "false") return "";
  if (!isSet(promo.heading) && !isSet(promo.text)) return "";
  const bg = isSet(promo.image) ? `style="background-image:url('${esc(rel(promo.image))}')"` : "";
  return `<div class="container"><section class="promo" ${bg}>
    <div class="promo__overlay"></div>
    <div class="promo__inner">
      ${isSet(promo.badge) ? `<span class="promo__badge">${esc(promo.badge)}</span>` : ""}
      <div class="promo__body">
        ${isSet(promo.eyebrow) ? `<span class="promo__eyebrow">🍂 ${esc(promo.eyebrow)}</span>` : ""}
        ${isSet(promo.heading) ? `<h2 class="promo__title">${mdInline(promo.heading)}</h2>` : ""}
        ${isSet(promo.text) ? `<div class="promo__text rich">${mdBlock(promo.text)}</div>` : ""}
        <div class="promo__cta-row">
          ${isSet(promo.cta_label) ? `<a class="btn btn--primary" href="${esc(isSet(promo.cta_href) ? promo.cta_href : "kapcsolat.html")}">${esc(promo.cta_label)}</a>` : ""}
          ${isSet(promo.valid_text) ? `<span class="promo__valid">${esc(promo.valid_text)}</span>` : ""}
        </div>
      </div>
    </div>
  </section></div>`;
}

function multicarNote(promo) {
  if (!promo || promo.multicar_active === false || promo.multicar_active === "false") return "";
  const txt = isSet(promo.multicar_text) ? promo.multicar_text : "Egy helyszínen két vagy több autó felújítására kedvezményt adok.";
  return `<div class="container"><div class="multicar">
    <span class="multicar__ic" aria-hidden="true">🚗🚗</span>
    <div class="multicar__body"><strong>Több autós kedvezmény</strong><span>${mdInline(txt)} <a href="kapcsolat.html">Kérj ajánlatot →</a></span></div>
  </div></div>`;
}

async function renderHome(app, contact) {
  const [hero, about, reviews, promo, home, gallery] = await Promise.all([
    loadJSON("content/hero.json"),
    loadJSON("content/about.json").catch(() => null),
    loadJSON("content/reviews.json").catch(() => null),
    loadJSON("content/promo.json").catch(() => null),
    loadJSON("content/home.json").catch(() => null),
    loadJSON("content/gallery.json").catch(() => null),
  ]);
  const H = home || {};

  let h = `<header class="hero${hero.banner ? " hero--banner" : ""}">
    <div class="hero__overlay"></div>`;
  if (hero.banner) {
    // Új listás formátum (kép + méret); ha nincs, visszaesik a régi mezőkre.
    const leftList = (Array.isArray(hero.side_left_images) && hero.side_left_images.length)
      ? hero.side_left_images
      : [hero.side_left, hero.side_left_2, hero.side_left_3 || hero.side_right];
    const rightList = (Array.isArray(hero.side_right_images) && hero.side_right_images.length)
      ? hero.side_right_images
      : [hero.side_right, hero.side_right_2, hero.side_right_3 || hero.side_left_2];
    h += `<div class="hero-stage">
        ${flankSide("left", leftList, FLANK_LEFT)}
        <img class="hero__banner" src="${esc(rel(hero.banner))}" alt="${esc(hero.title || "")}" />
        ${flankSide("right", rightList, FLANK_RIGHT)}
      </div>`;
  } else {
    h += `<div class="hero__content">
      <img class="hero__emblem" src="images/logo.png" alt="" onerror="this.style.display='none'" />
      <h1 class="hero__title">${esc(hero.title || "")}</h1>
      <p class="hero__subtitle">${mdInline(hero.subtitle || "")}</p>
      <div class="hero__cta">
        <a class="btn btn--primary" href="kapcsolat.html">Kérj időpontot</a>
        <a class="btn btn--ghost" href="csomagok.html">Csomagok &amp; árak</a>
      </div></div>`;
  }
  h += `</header>`;

  const aboutHTML = about ? `<div class="container"><section class="home-about">
    <h2 class="page__title">${esc(about.heading || "Bemutatkozás")}</h2>
    <div class="rich prose">${mdBlock(about.text || "")}</div>
  </section></div>` : "";

  const DQUICK = [
    { title: "Csomagok & árak", text: "ALAP · STANDARD · PRÉMIUM csomagok – már 12 000 Ft-tól, minden autótípusra.", link: "csomagok.html", more: "Megnézem →" },
    { title: "Szolgáltatások", text: "Fényszóró-felújítás, üvegkezelés, állapotfelmérés – mind helyben.", link: "szolgaltatasok.html", more: "Megnézem →" },
    { title: "Kapcsolat", text: "Hívj vagy írj, és egyeztetünk egy időpontot – házhoz megyünk.", link: "kapcsolat.html", more: "Kapcsolat →" },
  ];
  const quickItems = Array.isArray(H.quick) && H.quick.length ? H.quick : DQUICK;
  const quick = `<div class="container"><div class="cards cards--3">` +
    quickItems.map((q, i) => `<a class="neon-card neon-card--link" href="${esc(q.link || "#")}" style="animation-delay:${(i * 0.35).toFixed(2)}s"><h3 class="neon-card__title">${esc(q.title || "")}</h3><p class="neon-card__desc">${esc(q.text || "")}</p><span class="neon-card__more">${esc(q.more || "Megnézem →")}</span></a>`).join("") +
    `</div></div>`;

  const whyItems = Array.isArray(H.why) ? H.why : [];
  const whyCards = whyItems.map((w) => `<div class="why-item"><span class="why-item__ic" aria-hidden="true">${esc(w.icon || "✦")}</span><h3>${esc(w.title || "")}</h3><p>${esc(w.text || "")}</p></div>`).join("");
  const why = whyItems.length ? `<div class="container"><section class="why"><h2 class="page__title">${esc(H.why_heading || "Miért válassz engem?")}</h2><div class="why-grid">${whyCards}</div></section></div>` : "";

  const townsRaw = Array.isArray(H.areas_towns) && H.areas_towns.length ? H.areas_towns : TOWNS_UNIQUE;
  const towns = townsRaw.map((t) => (typeof t === "string" ? t : (t && (t.name || t.value)) || "")).filter(Boolean);
  const townTags = towns.map((t) => `<span class="areas__tag">${esc(t)}</span>`).join("");
  const areas = `<div class="container"><section class="areas">
    <h2 class="page__title">${esc(H.areas_heading || "Hol dolgozom?")}</h2>
    ${isSet(H.areas_lead) ? `<p class="areas__lead">${esc(H.areas_lead)}</p>` : ""}
    <div class="areas__tags">${townTags}</div>
    ${isSet(H.areas_note) ? `<p class="areas__note">${mdInline(H.areas_note)}</p>` : ""}
  </section></div>`;

  const DTRUST = [
    { icon: "🛡️", text: "**1 év** garancia" },
    { icon: "🧾", text: "**Számlaképes** vállalkozás" },
    { icon: "🏠", text: "**Házhoz** megyünk" },
    { icon: "📍", text: "Tolna megye, **50 km**" },
  ];
  const trustItems = Array.isArray(H.trust) && H.trust.length ? H.trust : DTRUST;
  const trust = `<div class="container"><div class="trustbar">` +
    trustItems.map((t) => `<div class="trustbar__item"><span class="trustbar__ic">${esc(t.icon || "✓")}</span> ${mdInline(t.text || "")}</div>`).join("") +
    `</div></div>`;

  const introHTML = isSet(H.intro) ? `<div class="container"><p class="home-intro">${mdInline(H.intro)}</p></div>` : "";

  const galItems = (gallery && Array.isArray(gallery.items) ? gallery.items : []).filter((g) => g && isSet(g.image));
  const galleryPreview = galItems.length ? `<div class="container"><section class="home-gallery">
    <h2 class="page__title">${esc((gallery && gallery.heading) || "Munkáink")}</h2>
    <p class="home-gallery__lead">Nézd meg az eredményt – <strong>előtte</strong> és <strong>utána</strong>. Kattints a képre a nagyításhoz.</p>
    <div class="home-gallery__grid">
      ${galItems.slice(0, 6).map((g) => `<figure class="home-gallery__item"><span class="home-gallery__frame"><img class="zoomable" src="${esc(rel(g.image))}" alt="${esc(g.caption || "Fényszóró-felújítás munka")}" loading="lazy" /></span>${isSet(g.caption) ? `<figcaption>${esc(g.caption)}</figcaption>` : ""}</figure>`).join("")}
    </div>
    <div class="home-gallery__cta"><a class="btn btn--ghost" href="galeria.html">Teljes galéria →</a></div>
  </section></div>` : "";

  app.innerHTML = h + tickerBand(hero.ticker) + trust + introHTML + promoSection(promo) + aboutHTML + quick + multicarNote(promo) + why + premiumSection(H) + galleryPreview + areas + reviewsSectionHTML(reviews, contact);
  await initReviews(reviews, app, contact);
  wireHeroPolish();
}

function renderCardsPage(app, data, defTitle, kind, promo) {
  app.innerHTML = pageHead(data.heading || defTitle, data.intro || "");
  const cont = app.querySelector(".container");
  if (kind === "packages") {
    cont.insertAdjacentHTML("beforeend", `<div class="arlista-dl"><a class="arlista-dl__btn" href="arlista.html" target="_blank" rel="noopener">${ICON_DOWNLOAD}<span>Teljes árlista – nyomtatás / PDF mentése</span></a></div>`);
  }
  const grid = el("div", "cards" + (kind === "delivery" ? " cards--4" : ""));
  (data.items || []).forEach((it, i) => {
    let inner = "";
    if (kind === "delivery") {
      inner = `<h3 class="neon-card__title">${esc(it.range || "")}</h3>
        ${it.description ? `<div class="neon-card__desc rich">${mdBlock(it.description)}</div>` : ""}
        <div class="neon-card__price">${esc(it.fee || "")}</div>`;
    } else {
      const order = kind === "packages" ? `<a class="btn btn--primary neon-card__order" href="kapcsolat.html">Megrendelem</a>` : "";
      inner = `${it.badge ? `<span class="neon-card__badge">${esc(it.badge)}</span>` : ""}
        <h3 class="neon-card__title">${esc(it.name || "")}</h3>
        ${it.description ? `<div class="neon-card__desc rich">${mdBlock(it.description)}</div>` : ""}
        <div class="neon-card__price">${esc(it.price || "")}</div>
        ${order}`;
    }
    grid.appendChild(neonCard(i, inner));
  });
  cont.appendChild(grid);
  if (kind === "packages" && promo) app.insertAdjacentHTML("beforeend", multicarNote(promo));
}

function printLetterhead() {
  return `<div class="print-only print-letterhead">
    <strong>Horváth Lámpapolír</strong> · Mobil fényszóró-felújítás – házhoz megyünk<br>
    +36 20 541 8369 · horvathlampapolir@gmail.com · horvathlampapolir.hu
  </div>`;
}
function pdfBar(label) {
  return `<div class="container arlista-dl no-print"><button type="button" class="arlista-dl__btn" onclick="window.print()">${ICON_DOWNLOAD}<span>${esc(label || "Letöltés PDF-ben")}</span></button></div>`;
}

function renderDoc(app, data, defTitle) {
  app.innerHTML = printLetterhead() + pageHead(data.heading || defTitle, "") +
    `<div class="container"><div class="rich prose">${mdBlock(data.body || "")}</div></div>` +
    pdfBar("Letöltés PDF-ben");
}

function renderGallery(app, gallery) {
  app.innerHTML = pageHead(gallery.heading || "Munkáink", "");
  const cont = app.querySelector(".container");
  if (gallery.items && gallery.items.length) {
    const grid = el("div", "gallery");
    gallery.items.forEach((g) => {
      const fig = el("figure");
      const img = el("img"); img.src = rel(g.image); img.alt = g.caption || "Munka"; img.loading = "lazy"; img.className = "zoomable";
      fig.appendChild(img);
      if (g.caption) fig.appendChild(el("figcaption", null, esc(g.caption)));
      grid.appendChild(fig);
    });
    cont.appendChild(grid);
  } else {
    cont.appendChild(el("p", "gallery__empty", "Hamarosan feltöltjük az elkészült munkák képeit."));
  }
}

function renderContact(app, contact) {
  const phone = isSet(contact.phone) ? contact.phone : "";
  const infoRow = (ic, label, valueHTML, vClass) =>
    `<li class="contact-info__item">
       <span class="contact-info__ic">${ic}</span>
       <span class="contact-info__body">
         <span class="contact-info__label">${label}</span>
         <span class="contact-info__value${vClass ? " " + vClass : ""}">${valueHTML}</span>
       </span>
     </li>`;
  const rows = [];
  if (phone) rows.push(infoRow(ICON_PHONE, "Telefon", `<a href="${telHref(phone)}">${esc(phone)}</a>`));
  if (phone) rows.push(infoRow(ICON_WHATSAPP, "WhatsApp", `<a href="${whatsappHref(phone)}" target="_blank" rel="noopener">Írj vagy hívj WhatsAppon</a>`));
  if (isSet(contact.email)) rows.push(infoRow(ICON_MAIL, "E-mail", `<a href="mailto:${esc(contact.email)}">${esc(contact.email)}</a>`, "contact-info__value--email"));
  if (isSet(contact.facebook_url)) rows.push(infoRow(ICON_FB, "Facebook", `<a href="${esc(contact.facebook_url)}" target="_blank" rel="noopener">Nézd meg a Facebookon</a>`));
  if (isSet(contact.google_url)) rows.push(infoRow(ICON_GOOGLE, "Google", `<a href="${esc(contact.google_url)}" target="_blank" rel="noopener">Nézd meg a Google-on</a>`));
  if (isSet(contact.instagram_url)) rows.push(infoRow(ICON_IG, "Instagram", `<a href="${esc(contact.instagram_url)}" target="_blank" rel="noopener">Megnézem</a>`));

  const aside = `<aside class="contact-aside">
      <h2 class="contact-aside__title">Közvetlen elérhetőség</h2>
      <ul class="contact-info">${rows.join("")}</ul>
      ${contact.note ? `<div class="contact-aside__note rich">${mdBlock(contact.note)}</div>` : ""}
    </aside>`;

  const hasMap = isSet(contact.map_lat) && isSet(contact.map_lng);
  const mapSection = hasMap ? `<div class="container"><section class="area-map-wrap">
      <h2 class="area-map-title">Kiszolgált terület</h2>
      <p class="area-map-lead">Házhoz megyek Tolna megyében és környékén – a pirossal jelölt, kb. ${esc(contact.map_radius_km || "50")} km-es körzetben.</p>
      <div id="area-map" class="area-map"></div>
    </section></div>` : "";

  const billingNotice = `<div class="container"><section class="billing-notice">
      <h3 class="billing-notice__title">🧾 Számlázási tájékoztató</h3>
      <p>Vállalkozásunk <strong>minden értékesítésről és szolgáltatásról számlát állít ki</strong>. A számla kiállításához a megrendeléskor (személyesen, telefonon vagy e-mailben) az alábbi adatokat kérjük:</p>
      <ul class="billing-notice__list">
        <li><strong>Magánszemélyeknek:</strong> név és cím (lakcím).</li>
        <li><strong>Cégeknek / vállalkozóknak:</strong> cégnév, székhely (számlázási cím) és adószám.</li>
      </ul>
      <p>Ezen adatok hiányában a szolgáltatást nem áll módunkban teljesíteni. A szolgáltatás igénybevételével Ön hozzájárul a fenti adatok megadásához a számla kiállítása céljából.</p>
    </section></div>`;

  app.innerHTML = pageHead(contact.heading || "Kapcsolat", "") +
    `<div class="container"><div class="contact-layout">
       <div class="contact-layout__main">${bookingFormHTML(contact)}</div>
       ${aside}
     </div></div>` + billingNotice + mapSection;
  wireBookingForm(contact);
  wireMap(contact);
}

function loadLeaflet(cb) {
  if (window.L) { cb(); return; }
  if (!document.getElementById("leaflet-css")) {
    const l = document.createElement("link"); l.id = "leaflet-css"; l.rel = "stylesheet"; l.href = "css/leaflet.css";
    document.head.appendChild(l);
  }
  const existing = document.getElementById("leaflet-js");
  if (existing) { existing.addEventListener("load", cb); return; }
  const s = document.createElement("script"); s.id = "leaflet-js"; s.src = "js/leaflet.js"; s.onload = cb; s.onerror = cb;
  document.body.appendChild(s);
}

function wireMap(contact) {
  const el = document.getElementById("area-map");
  if (!el || !contact) return;
  const lat = parseFloat(contact.map_lat), lng = parseFloat(contact.map_lng);
  if (isNaN(lat) || isNaN(lng)) return;
  const km = parseFloat(contact.map_radius_km) || 50;
  loadLeaflet(() => {
    if (!window.L) { el.innerHTML = '<div class="area-map__err">A térkép most nem tölthető be.</div>'; return; }
    const map = L.map(el, { scrollWheelZoom: false }).setView([lat, lng], 9);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 18, attribution: "© OpenStreetMap közreműködők" }).addTo(map);
    const circle = L.circle([lat, lng], { radius: km * 1000, color: "#e01e1e", weight: 2, fillColor: "#e01e1e", fillOpacity: 0.12 }).addTo(map);
    L.circleMarker([lat, lng], { radius: 6, color: "#a00", weight: 2, fillColor: "#e01e1e", fillOpacity: 1 }).addTo(map).bindPopup("Horváth Lámpapolír – kb. " + km + " km-es körzet");
    setTimeout(() => { map.invalidateSize(); map.fitBounds(circle.getBounds(), { padding: [24, 24] }); }, 300);
  });
}

function bookingFormHTML(contact) {
  const groups = [
    ["Fényszóró-felújítás", ["Fényszóró-felújítás – ALAP", "Fényszóró-felújítás – STANDARD", "Fényszóró-felújítás – PRÉMIUM"]],
    ["Kombó csomagok (fényszóró + üveg)", ["Kombó: Fényszóró-felújítás + szélvédő-vízlepergető", "Kombó: Fényszóró-felújítás + teljes üvegkezelés"]],
    ["Egyéb szolgáltatás", ["Szélvédő- / üvegkezelés", "Egyéb – a megjegyzésbe írom"]],
  ];
  const opts = groups.map(([g, arr]) => `<optgroup label="${esc(g)}">${arr.map((s) => `<option value="${esc(s)}">${esc(s)}</option>`).join("")}</optgroup>`).join("");
  const dayparts = ["Bármelyik napszak jó", "Délelőtt", "Kora délután", "Késő délután / kora este"];
  const dayOpts = dayparts.map((s) => `<option value="${esc(s)}">${esc(s)}</option>`).join("");
  return `<section class="booking">
    <h2 class="booking__title">Időpont igénylése</h2>
    <p class="booking__lead">Töltsd ki pár másodperc alatt, és e-mailben elküldöd nekem az igényed. Sürgős esetben inkább <a href="${telHref(contact.phone)}">hívj</a>.</p>
    <form class="booking__form" id="booking-form" novalidate>
      <div class="booking__row">
        <label class="booking__field"><span>Neved *</span>
          <input type="text" name="name" required autocomplete="name" placeholder="pl. Kovács János" /></label>
        <label class="booking__field"><span>Telefonszámod *</span>
          <input type="tel" name="phone" required autocomplete="tel" placeholder="pl. +36 20 123 4567" /></label>
      </div>
      <div class="booking__row">
        <label class="booking__field"><span>Autó típusa</span>
          <input type="text" name="car" autocomplete="off" placeholder="pl. Opel Astra H, 2008" /></label>
        <label class="booking__field"><span>Mit szeretnél?</span>
          <select name="service">${opts}</select></label>
      </div>
      <label class="booking__field"><span>Település / helyszín</span>
        <input type="text" name="place" placeholder="pl. Szekszárd" /></label>
      <div class="booking__row">
        <label class="booking__field"><span>Kért időpont (nap)</span>
          <input type="date" name="date_pref" /></label>
        <label class="booking__field"><span>Napszak</span>
          <select name="daypart">${dayOpts}</select></label>
      </div>
      <label class="booking__field"><span>Megjegyzés</span>
        <textarea name="message" rows="4" placeholder="pl. Mindkét fényszóró homályos, hétvégén érek rá."></textarea></label>
      <p class="booking__info">ℹ️ Ez egy <strong>időpont-igénylő lap</strong>, nem végleges foglalás. Miután elküldted, <strong>rövid időn belül visszahívlak</strong>, és közösen egyeztetjük a pontos időpontot.</p>
      <div class="booking__actions">
        <button type="submit" class="btn btn--primary">Igénylés elküldése</button>
        <a class="btn btn--ghost" href="${telHref(contact.phone)}">Inkább hívlak</a>
      </div>
      <p class="booking__note" id="booking-note" hidden></p>
    </form>
  </section>`;
}

function wireBookingForm(contact) {
  const form = document.getElementById("booking-form");
  if (!form) return;
  const note = document.getElementById("booking-note");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const f = new FormData(form);
    const name = (f.get("name") || "").toString().trim();
    const phone = (f.get("phone") || "").toString().trim();
    if (!name || !phone) {
      if (note) { note.hidden = false; note.className = "booking__note booking__note--err"; note.textContent = "Kérlek add meg a neved és a telefonszámod."; }
      return;
    }
    const dateP = (f.get("date_pref") || "").toString().trim();
    const daypart = (f.get("daypart") || "").toString().trim();
    const idopont = [dateP, daypart].filter(Boolean).join(" – ") || "—";
    const lines = [
      "Időpont-igénylés a weboldalról",
      "",
      "Név: " + name,
      "Telefon: " + phone,
      "Autó: " + ((f.get("car") || "").toString().trim() || "—"),
      "Szolgáltatás: " + ((f.get("service") || "").toString().trim() || "—"),
      "Helyszín: " + ((f.get("place") || "").toString().trim() || "—"),
      "Kért időpont: " + idopont,
      "",
      "Megjegyzés:",
      (f.get("message") || "").toString().trim() || "—",
    ];
    const to = isSet(contact.email) ? contact.email : "";
    const subject = "Időpont-igénylés – " + name;
    const href = "mailto:" + encodeURIComponent(to) +
      "?subject=" + encodeURIComponent(subject) +
      "&body=" + encodeURIComponent(lines.join("\n"));
    window.location.href = href;
    if (note) { note.hidden = false; note.className = "booking__note booking__note--ok"; note.textContent = "Megnyílik a leveleződ a kész üzenettel – csak küldd el. Ezután rövid időn belül visszahívlak az egyeztetéshez. Ha a levelező nem nyílt meg, hívj a fenti számon."; }
  });
}

function renderFaq(app, data) {
  app.innerHTML = printLetterhead() + pageHead(data.heading || "Gyakori kérdések", data.intro || "");
  const cont = app.querySelector(".container");
  const items = (data.items || []).filter((it) => isSet(it.q));
  const list = el("div", "faq");
  items.forEach((it, i) => {
    const d = el("details", "faq__item");
    if (i === 0) d.open = true;
    const sum = el("summary", "faq__q", esc(it.q));
    const ans = el("div", "faq__a rich");
    ans.innerHTML = mdBlock(it.a || "");
    d.appendChild(sum); d.appendChild(ans);
    list.appendChild(d);
  });
  cont.appendChild(list);
  app.insertAdjacentHTML("beforeend", pdfBar("Letöltés PDF-ben"));
  // Nyomtatáskor / PDF-mentéskor minden kérdés legyen nyitva, utána álljon vissza
  if (!window.__faqPrintWired) {
    window.__faqPrintWired = true;
    window.addEventListener("beforeprint", () => {
      document.querySelectorAll(".faq__item").forEach((d) => { d.dataset.wasopen = d.open ? "1" : "0"; d.open = true; });
    });
    window.addEventListener("afterprint", () => {
      document.querySelectorAll(".faq__item").forEach((d) => { d.open = d.dataset.wasopen === "1"; });
    });
  }
  // FAQPage strukturált adat (Google gazdag találat)
  if (items.length) {
    const ld = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": items.map((it) => ({
        "@type": "Question",
        "name": it.q,
        "acceptedAnswer": { "@type": "Answer", "text": (it.a || "").replace(/[#*_`>]/g, "").trim() },
      })),
    };
    const s = document.createElement("script");
    s.type = "application/ld+json";
    s.textContent = JSON.stringify(ld);
    document.head.appendChild(s);
  }
}

// Kiszolgált települések (helyi keresésekhez és a kezdőlapi felsoroláshoz)
const TOWNS = ["Szekszárd", "Paks", "Bonyhád", "Dombóvár", "Tolna", "Tamási", "Bátaszék", "Simontornya", "Nagymányok"];
const TOWNS_UNIQUE = [...new Set(TOWNS)];

// Lebegő mobil gyorssáv (Hívás + WhatsApp) – csak mobilon látszik
function buildMobileBar(contact) {
  if (!contact || !isSet(contact.phone) || document.querySelector(".mbar")) return;
  const bar = document.createElement("div");
  bar.className = "mbar";
  bar.setAttribute("aria-label", "Gyors kapcsolat");
  const wa = whatsappHref(contact.phone);
  bar.innerHTML =
    `<a class="mbar__btn mbar__btn--call" href="${telHref(contact.phone)}">${ICON_PHONE}<span>Hívás</span></a>` +
    (wa ? `<a class="mbar__btn mbar__btn--wa" href="${wa}" target="_blank" rel="noopener">${ICON_WHATSAPP}<span>WhatsApp</span></a>` : "");
  document.body.appendChild(bar);
  document.body.classList.add("has-mbar");
}

// „Vissza a lap tetejére" gomb – görgetéskor jelenik meg
function buildToTop() {
  if (document.querySelector(".to-top")) return;
  const b = document.createElement("button");
  b.className = "to-top";
  b.type = "button";
  b.setAttribute("aria-label", "Vissza a lap tetejére");
  b.innerHTML = '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path fill="currentColor" d="M12 5.7l6.3 6.3-1.4 1.4L13 9.5V19h-2V9.5l-3.9 3.9-1.4-1.4z"/></svg>';
  b.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
  document.body.appendChild(b);
  const scrollPos = () => window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
  const onScroll = () => b.classList.toggle("to-top--show", scrollPos() > 250);
  window.addEventListener("scroll", onScroll, { passive: true });
  document.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
}

// LocalBusiness strukturált adat (Google helyi találat / térkép)
function injectLocalBusiness(contact) {
  if (!contact || document.getElementById("ld-localbusiness")) return;
  const base = "https://horvathlampapolir.hu/";
  const data = {
    "@context": "https://schema.org",
    "@type": "AutoRepair",
    "name": "Horváth Lámpapolír",
    "description": "Mobil fényszóró-felújítás – házhoz megyek Tolna megyében és környékén, kb. 50 km-es körzetben.",
    "url": base,
    "image": base + "images/og-cover.jpg",
    "priceRange": "12 000 Ft-tól",
    "areaServed": TOWNS_UNIQUE.map((t) => ({ "@type": "City", "name": t })),
    "address": { "@type": "PostalAddress", "addressRegion": "Tolna megye", "addressCountry": "HU" },
    "openingHoursSpecification": [{
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      "opens": "08:00", "closes": "16:00",
    }],
  };
  if (isSet(contact.phone)) data.telephone = contact.phone.replace(/\s+/g, "");
  if (isSet(contact.email)) data.email = contact.email;
  if (isSet(contact.facebook_url)) data.sameAs = [contact.facebook_url];
  const s = document.createElement("script");
  s.type = "application/ld+json";
  s.id = "ld-localbusiness";
  s.textContent = JSON.stringify(data);
  document.head.appendChild(s);
}

// Sötét / világos mód kapcsoló
function wireTheme() {
  const btn = document.getElementById("theme-toggle");
  if (!btn) return;
  btn.addEventListener("click", () => {
    const cur = document.documentElement.getAttribute("data-theme");
    const next = cur === "light" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", next);
    try { localStorage.setItem("hlp_theme", next); } catch (e) {}
  });
}

// Anonim (süti nélküli) látogatás-számláló – csak egy pinget küld a stats Workernek.
const STATS_URL = "https://horvath-stats.andras-horvat1989.workers.dev";
function trackVisit() {
  try {
    // Saját eszköz kihagyása: a „?notrack" megnyitás megjelöli a böngészőt, „?track=1" törli.
    var qs = location.search || "";
    if (/[?&]notrack/i.test(qs)) { try { localStorage.setItem("hlp_notrack", "1"); } catch (e) {} }
    if (/[?&]track=1/i.test(qs)) { try { localStorage.removeItem("hlp_notrack"); } catch (e) {} }
    try { if (localStorage.getItem("hlp_notrack") === "1") return; } catch (e) {} // saját látogatás – nem számít
    fetch(STATS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: location.pathname }),
      keepalive: true,
    }).catch(() => {});
  } catch (e) { /* semmi baj */ }
}

// „Fénypolír" hero-effekt: a homályos/oxidált fátyol ott fényesedik ki, ahol az egér/ujj elhalad
// (mint a fényszóró polírozásakor). Csak akkor fut, ha támogatott és nincs mozgáscsökkentés.
function wireHeroPolish() {
  const hero = document.querySelector(".hero");
  if (!hero) return;
  const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) return;

  // Az egeret/ujjat követő meleg fényfolt (interaktív) a hero fölött
  const glow = document.createElement("div"); glow.className = "hero-polish-glow";
  hero.appendChild(glow);

  let cx = 50, cy = 42, tx = 50, ty = 42, t = 0, auto = true, idle = 0, running = true;
  const set = (x, y) => { hero.style.setProperty("--mx", x.toFixed(2) + "%"); hero.style.setProperty("--my", y.toFixed(2) + "%"); };
  set(cx, cy);
  requestAnimationFrame(() => hero.classList.add("is-polishing"));

  hero.addEventListener("pointermove", (e) => {
    const r = hero.getBoundingClientRect();
    tx = ((e.clientX - r.left) / r.width) * 100;
    ty = ((e.clientY - r.top) / r.height) * 100;
    auto = false; idle = 0;
  });

  function loop() {
    if (!running) return;
    t += 0.016;
    if (auto) {                       // „bemutató" sarkanmozgás – lassú polírozó pálya
      tx = 50 + Math.cos(t * 0.62) * 30;
      ty = 44 + Math.sin(t * 0.97) * 20;
    } else {
      idle += 0.016;
      if (idle > 2.4) auto = true;     // ha megáll az egér, magától folytatja
    }
    cx += (tx - cx) * 0.11; cy += (ty - cy) * 0.11;
    set(cx, cy);
    requestAnimationFrame(loop);
  }
  loop();

  // Teljesítmény: ne pörögjön, ha a hero nincs a képernyőn
  if ("IntersectionObserver" in window) {
    new IntersectionObserver((es) => {
      const vis = es[0].isIntersecting;
      if (vis && !running) { running = true; loop(); }
      else if (!vis) running = false;
    }, { threshold: 0 }).observe(hero);
  }
}

// Képnagyító (lightbox): a nagyítható képek kattintásra nagy nézetben nyílnak meg.
function wireLightbox() {
  document.querySelectorAll(".hero__banner, .gallery img, .rich img, .prose img, .home-about img, .hero-flank img, .review-card img")
    .forEach((im) => im.classList.add("zoomable"));
  if (!document.querySelector("img.zoomable")) return;

  let lb = document.getElementById("lightbox");
  if (!lb) {
    lb = document.createElement("div");
    lb.id = "lightbox"; lb.className = "lightbox"; lb.setAttribute("aria-hidden", "true");
    lb.innerHTML = '<button class="lightbox__close" type="button" aria-label="Bezárás">✕</button><img class="lightbox__img" alt="">';
    document.body.appendChild(lb);
  }
  const lbImg = lb.querySelector(".lightbox__img");
  const open = (src, alt) => { lbImg.src = src; lbImg.alt = alt || ""; lb.classList.add("is-open"); document.body.style.overflow = "hidden"; };
  const close = () => { lb.classList.remove("is-open"); document.body.style.overflow = ""; };

  if (!lb.dataset.wired) {
    lb.dataset.wired = "1";
    document.addEventListener("click", (e) => {
      const im = e.target.closest && e.target.closest("img.zoomable");
      if (im) { open(im.currentSrc || im.src, im.alt); return; }
      if (e.target === lb || (e.target.closest && e.target.closest(".lightbox__close")) || e.target.classList.contains("lightbox__img")) close();
    });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
  }
}

// ---------- Indítás ----------
async function initSite() {
  trackVisit();
  buildStarfield();
  const page = document.body.dataset.page || "home";
  document.getElementById("site-header").innerHTML = buildHeader(page);
  document.getElementById("site-footer").innerHTML = buildFooter();
  wireNav();
  wireTheme();

  try { applyTheme(await loadJSON("content/theme.json")); } catch (e) { /* alap marad */ }

  // A topbar-hoz mindig kell a kapcsolat
  let contact = null;
  try { contact = await loadJSON("content/contact.json"); populateTopbar(contact); populateFooter(contact); } catch (e) {}
  try {
    const f = await loadJSON("content/footer.json");
    if (f) {
      const sub = document.getElementById("footer-subtitle"); if (sub && isSet(f.subtitle)) sub.textContent = f.subtitle;
      const tg = document.getElementById("footer-tags"); if (tg && isSet(f.tags)) tg.textContent = f.tags;
      const pay = document.getElementById("footer-pay-text"); if (pay && isSet(f.payment)) pay.textContent = f.payment;
    }
  } catch (e) { /* marad az alap szöveg */ }

  buildMobileBar(contact);
  buildToTop();
  injectLocalBusiness(contact);
  try { buildAiWidget(await loadJSON("content/ai.json")); } catch (e) { /* nincs AI beállítva */ }

  const app = document.getElementById("app");
  try {
    switch (page) {
      case "home": await renderHome(app, contact); break;
      case "csomagok": renderCardsPage(app, await loadJSON("content/packages.json"), "Csomagok", "packages", await loadJSON("content/promo.json").catch(() => null)); break;
      case "szolgaltatasok": renderCardsPage(app, await loadJSON("content/services.json"), "Szolgáltatások", "services"); break;
      case "kiszallas": renderCardsPage(app, await loadJSON("content/delivery.json"), "Kiszállási díj", "delivery"); break;
      case "galeria": renderGallery(app, await loadJSON("content/gallery.json")); break;
      case "gyik": renderFaq(app, await loadJSON("content/faq.json")); break;
      case "kapcsolat": renderContact(app, contact || (await loadJSON("content/contact.json"))); break;
      case "adatvedelem": renderDoc(app, await loadJSON("content/privacy.json"), "Adatvédelmi tájékoztató"); break;
      case "impresszum": renderDoc(app, await loadJSON("content/imprint.json"), "Impresszum"); break;
    }
  } catch (err) {
    console.error(err);
    app.innerHTML = `<div class="container"><p style="margin-top:30px;color:#ffbcbc;background:#2a0f0f;border:1px solid #a33;padding:14px 18px;border-radius:12px;">A tartalom betöltése nem sikerült. Helyi megnyitásnál indíts szervert (lásd README).</p></div>`;
  }

  initReveal();
  wireLightbox();
}

// Görgetéses beúszás: a szakaszok/kártyák finoman felúsznak, ahogy láthatóvá válnak.
function initReveal() {
  if (!("IntersectionObserver" in window)) return;
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const targets = document.querySelectorAll(
    ".home-about, .why, .areas, .promo, .reviews, .booking, .contact-aside, .page__head, .cards > *, .why-item, .gallery > figure, .faq__item, .trustbar__item"
  );
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("reveal--in"); io.unobserve(e.target); } });
  }, { threshold: 0.06, rootMargin: "0px 0px -50px 0px" });
  targets.forEach((elm) => {
    elm.classList.add("reveal");
    const sibs = elm.parentElement ? Array.prototype.filter.call(elm.parentElement.children, (c) => c.matches && c.matches(".cards > *, .why-item, .trustbar__item, .gallery > figure")) : [];
    const idx = sibs.indexOf(elm);
    if (idx > 0) elm.style.transitionDelay = Math.min(idx * 70, 350) + "ms";
    io.observe(elm);
  });
  // Biztonsági háló: ha 2.5s múlva bármi rejtve maradna (IO nem tüzelt), mutassuk meg.
  setTimeout(() => { document.querySelectorAll(".reveal:not(.reveal--in)").forEach((elm) => { if (elm.getBoundingClientRect().top < (window.innerHeight || 800)) elm.classList.add("reveal--in"); }); }, 2500);
}

document.addEventListener("DOMContentLoaded", initSite);
