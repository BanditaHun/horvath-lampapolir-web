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
function mdBlock(str) {
  if (str == null || str === "") return "";
  return window.marked ? window.marked.parse(String(str)) : esc(str);
}
function mdInline(str) {
  if (str == null || str === "") return "";
  return window.marked ? window.marked.parseInline(String(str)) : esc(str);
}
const isSet = (v) => typeof v === "string" && v.trim() && v.trim() !== "#";

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
const ICON_IG = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M12 2.2c3.2 0 3.6 0 4.9.1 1.2.1 1.8.3 2.2.4.6.2 1 .5 1.4.9.4.4.7.8.9 1.4.2.4.4 1 .4 2.2.1 1.3.1 1.7.1 4.9s0 3.6-.1 4.9c-.1 1.2-.3 1.8-.4 2.2-.2.6-.5 1-.9 1.4-.4.4-.8.7-1.4.9-.4.2-1 .4-2.2.4-1.3.1-1.7.1-4.9.1s-3.6 0-4.9-.1c-1.2-.1-1.8-.3-2.2-.4-.6-.2-1-.5-1.4-.9-.4-.4-.7-.8-.9-1.4-.2-.4-.4-1-.4-2.2-.1-1.3-.1-1.7-.1-4.9s0-3.6.1-4.9c.1-1.2.3-1.8.4-2.2.2-.6.5-1 .9-1.4.4-.4.8-.7 1.4-.9.4-.2 1-.4 2.2-.4 1.3-.1 1.7-.1 4.9-.1zm0 1.8c-3.1 0-3.5 0-4.7.1-1.1.1-1.7.2-2.1.4-.5.2-.9.4-1.3.8-.4.4-.6.8-.8 1.3-.2.4-.3 1-.4 2.1C4 8.5 4 8.9 4 12s0 3.5.1 4.7c.1 1.1.2 1.7.4 2.1.2.5.4.9.8 1.3.4.4.8.6 1.3.8.4.2 1 .3 2.1.4 1.2.1 1.6.1 4.7.1s3.5 0 4.7-.1c1.1-.1 1.7-.2 2.1-.4.5-.2.9-.4 1.3-.8.4-.4.6-.8.8-1.3.2-.4.3-1 .4-2.1.1-1.2.1-1.6.1-4.7s0-3.5-.1-4.7c-.1-1.1-.2-1.7-.4-2.1-.2-.5-.4-.9-.8-1.3-.4-.4-.8-.6-1.3-.8-.4-.2-1-.3-2.1-.4-1.2-.1-1.6-.1-4.7-.1zm0 3.1a4.9 4.9 0 1 1 0 9.8 4.9 4.9 0 0 1 0-9.8zm0 8.1a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4zm6.3-8.3a1.1 1.1 0 1 1-2.3 0 1.1 1.1 0 0 1 2.3 0z"/></svg>';

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
        <a class="topbar__social" id="top-fb" href="#" target="_blank" rel="noopener" aria-label="Facebook" hidden>${ICON_FB}</a>
        <a class="topbar__social" id="top-ig" href="#" target="_blank" rel="noopener" aria-label="Instagram" hidden>${ICON_IG}</a>
        <button class="nav__toggle" id="nav-toggle" aria-label="Menü" aria-expanded="false"><span></span><span></span><span></span></button>
      </div>
    </div>
    <ul class="nav__links" id="nav-links">${links}</ul>
  </nav>`;
}
function buildFooter() {
  return `<footer>© <span id="year"></span> Horváth Lámpapolír – mobil fényszóró-felújítás</footer>`;
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
  if (isSet(contact.facebook_url)) { const t = document.getElementById("top-fb"); t.href = contact.facebook_url; t.hidden = false; }
  if (isSet(contact.instagram_url)) { const t = document.getElementById("top-ig"); t.href = contact.instagram_url; t.hidden = false; }
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
function reviewCardHTML(r, i) {
  return `<article class="neon-card review-card" style="animation-delay:${(i % 6) * 0.35}s">
    ${starsHTML(r.rating)}
    <div class="review-card__text rich">${mdBlock(r.text || "")}</div>
    <div class="review-card__meta">— ${esc(r.name || "Névtelen")}${r.date ? " · " + esc(r.date) : ""}</div>
  </article>`;
}
function reviewsSectionHTML(reviews, contact) {
  const items = (reviews && reviews.items) || [];
  const list = items.length
    ? `<div class="cards reviews__list">${items.map(reviewCardHTML).join("")}</div>`
    : `<p class="gallery__empty">Legyél te az első, aki értékel minket!</p>`;
  const key = reviews && reviews.form_access_key;
  let form = "";
  if (isSet(key)) {
    form = `<form class="review-form" action="https://api.web3forms.com/submit" method="POST">
      <input type="hidden" name="access_key" value="${esc(key)}" />
      <input type="hidden" name="subject" value="Új vélemény – Horváth Lámpapolír weboldal" />
      <input type="checkbox" name="botcheck" class="hp" tabindex="-1" autocomplete="off" />
      <div class="form-row"><label for="rv-name">Neved</label><input id="rv-name" type="text" name="name" required maxlength="60" /></div>
      <div class="form-row"><span class="form-label">Értékelés</span>
        <div class="star-input" id="star-input">${[1, 2, 3, 4, 5].map((i) => `<button type="button" class="star-btn" data-v="${i}" aria-label="${i} csillag">★</button>`).join("")}</div>
        <input type="hidden" name="rating" id="rating-input" value="5" />
      </div>
      <div class="form-row"><label for="rv-msg">Véleményed</label><textarea id="rv-msg" name="message" rows="4" required maxlength="1000"></textarea></div>
      <button type="submit" class="btn btn--primary">Vélemény küldése</button>
      <p class="review-form__note">A beküldött vélemények <strong>moderálás után</strong> jelennek meg az oldalon.</p>
    </form>`;
  } else if (contact && isSet(contact.facebook_url)) {
    form = `<div class="review-cta"><p>Örülnénk a véleményednek! Értékelj minket a Facebook-oldalunkon:</p>
      <a class="btn btn--primary" href="${esc(contact.facebook_url)}" target="_blank" rel="noopener">Értékelés a Facebookon</a></div>`;
  }
  return `<section class="reviews" id="velemenyek"><div class="container">
    <h2 class="page__title">${esc((reviews && reviews.heading) || "Vélemények")}</h2>
    ${reviews && reviews.intro ? `<div class="rich page__intro">${mdBlock(reviews.intro)}</div>` : ""}
    ${list}
    <div class="review-form-wrap">${form}</div>
  </div></section>`;
}
function wireReviewForm(scope) {
  const form = scope.querySelector(".review-form");
  if (!form) return;
  const starBtns = [...scope.querySelectorAll(".star-btn")];
  const ratingInput = scope.querySelector("#rating-input");
  const paint = (v) => starBtns.forEach((s) => s.classList.toggle("on", Number(s.dataset.v) <= v));
  paint(Number(ratingInput.value) || 5);
  starBtns.forEach((s) => s.addEventListener("click", () => { ratingInput.value = s.dataset.v; paint(Number(s.dataset.v)); }));
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    const orig = btn.textContent; btn.disabled = true; btn.textContent = "Küldés…";
    try {
      const res = await fetch(form.action, { method: "POST", body: new FormData(form), headers: { Accept: "application/json" } });
      const data = await res.json();
      if (data.success) {
        form.innerHTML = '<p class="review-form__ok">Köszönjük a véleményed! Moderálás után megjelenik az oldalon. 🙏</p>';
      } else { throw new Error(data.message || "hiba"); }
    } catch (err) {
      btn.disabled = false; btn.textContent = orig;
      alert("Nem sikerült elküldeni a véleményt. Kérlek, próbáld újra később.");
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
  const one = list.map((t) => `<span class="ticker__item">✦ ${esc(t)}</span>`).join("");
  return `<div class="ticker" aria-hidden="true"><div class="ticker__track">${one}${one}</div></div>`;
}

// Oldalsó elem: a feltöltött kép(ek) egymás alatt; ha egy sincs, az animált buborékok
function flankSide(side, imgs, chips) {
  const pics = (Array.isArray(imgs) ? imgs : [imgs]).filter(isSet);
  const inner = pics.length
    ? pics.map((src) => `<figure class="flank-imgwrap"><img class="flank-img" src="${esc(src)}" alt="" loading="lazy" /></figure>`).join("")
    : flankChips(chips);
  return `<aside class="hero-flank hero-flank--${side}" aria-hidden="true">${inner}</aside>`;
}

async function renderHome(app, contact) {
  const [hero, about, reviews] = await Promise.all([
    loadJSON("content/hero.json"),
    loadJSON("content/about.json").catch(() => null),
    loadJSON("content/reviews.json").catch(() => null),
  ]);

  let h = `<header class="hero${hero.banner ? " hero--banner" : ""}">
    <div class="hero__overlay"></div>`;
  if (hero.banner) {
    h += `<div class="hero-stage">
        ${flankSide("left", [hero.side_left, hero.side_left_2], FLANK_LEFT)}
        <img class="hero__banner" src="${esc(hero.banner)}" alt="${esc(hero.title || "")}" />
        ${flankSide("right", [hero.side_right, hero.side_right_2], FLANK_RIGHT)}
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

  const quick = `<div class="container"><div class="cards cards--3">
    <a class="neon-card neon-card--link" href="csomagok.html" style="animation-delay:0s"><h3 class="neon-card__title">Csomagok &amp; árak</h3><p class="neon-card__desc">ALAP · STANDARD · PRÉMIUM csomagok: csiszolás, polírozás, UV-védelem és garancia – már 10 000 Ft-tól, minden autótípusra.</p><span class="neon-card__more">Megnézem →</span></a>
    <a class="neon-card neon-card--link" href="szolgaltatasok.html" style="animation-delay:.35s"><h3 class="neon-card__title">Szolgáltatások</h3><p class="neon-card__desc">A fényszóró-felújítás mellett szélvédőmosó, fagyálló, ablaktörlő-csere, vízlepergető kezelés és ingyenes állapotfelmérés – mind helyben.</p><span class="neon-card__more">Megnézem →</span></a>
    <a class="neon-card neon-card--link" href="kapcsolat.html" style="animation-delay:.7s"><h3 class="neon-card__title">Kapcsolat</h3><p class="neon-card__desc">Hívj vagy írj, és egyeztetünk egy időpontot – házhoz megyünk Tolna megyében, 50 km-es körzetben.</p><span class="neon-card__more">Kapcsolat →</span></a>
  </div></div>`;

  app.innerHTML = h + tickerBand(hero.ticker) + aboutHTML + quick + reviewsSectionHTML(reviews, contact);
  wireReviewForm(app);
}

function renderCardsPage(app, data, defTitle, kind) {
  app.innerHTML = pageHead(data.heading || defTitle, data.intro || "");
  const cont = app.querySelector(".container");
  const grid = el("div", "cards");
  (data.items || []).forEach((it, i) => {
    let inner = "";
    if (kind === "delivery") {
      inner = `<h3 class="neon-card__title">${esc(it.range || "")}</h3>
        ${it.description ? `<div class="neon-card__desc rich">${mdBlock(it.description)}</div>` : ""}
        <div class="neon-card__price">${esc(it.fee || "")}</div>`;
    } else {
      const featured = kind === "packages" && i === (data.items.length - 1);
      inner = `${featured ? '<span class="neon-card__badge">Ajánlott</span>' : ""}
        <h3 class="neon-card__title">${esc(it.name || "")}</h3>
        ${it.description ? `<div class="neon-card__desc rich">${mdBlock(it.description)}</div>` : ""}
        <div class="neon-card__price">${esc(it.price || "")}</div>`;
    }
    grid.appendChild(neonCard(i, inner));
  });
  cont.appendChild(grid);
}

function renderGallery(app, gallery) {
  app.innerHTML = pageHead(gallery.heading || "Munkáink", "");
  const cont = app.querySelector(".container");
  if (gallery.items && gallery.items.length) {
    const grid = el("div", "gallery");
    gallery.items.forEach((g) => {
      const fig = el("figure");
      const img = el("img"); img.src = g.image; img.alt = g.caption || "Munka"; img.loading = "lazy";
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
  const parts = [];
  parts.push(`<div class="neon-card"><h3 class="neon-card__title">Telefon</h3>
    ${phone ? `<a class="neon-card__price" href="${telHref(phone)}">${esc(phone)}</a>` : "<p>—</p>"}
    ${contact.note ? `<div class="neon-card__desc rich">${mdBlock(contact.note)}</div>` : ""}</div>`);
  const links = [];
  if (isSet(contact.facebook_url)) links.push(`<a class="btn btn--ghost" href="${esc(contact.facebook_url)}" target="_blank" rel="noopener">Facebook</a>`);
  if (isSet(contact.instagram_url)) links.push(`<a class="btn btn--ghost" href="${esc(contact.instagram_url)}" target="_blank" rel="noopener">Instagram</a>`);
  if (isSet(contact.email)) links.push(`<a class="btn btn--ghost" href="mailto:${esc(contact.email)}">${esc(contact.email)}</a>`);
  if (links.length) parts.push(`<div class="neon-card"><h3 class="neon-card__title">Kövess / írj</h3><div class="neon-card__links">${links.join("")}</div></div>`);
  app.innerHTML = pageHead(contact.heading || "Elérhetőség", "") +
    `<div class="container"><div class="cards cards--2">${parts.join("")}</div></div>`;
}

// ---------- Indítás ----------
async function initSite() {
  buildStarfield();
  const page = document.body.dataset.page || "home";
  document.getElementById("site-header").innerHTML = buildHeader(page);
  document.getElementById("site-footer").innerHTML = buildFooter();
  wireNav();

  try { applyTheme(await loadJSON("content/theme.json")); } catch (e) { /* alap marad */ }

  // A topbar-hoz mindig kell a kapcsolat
  let contact = null;
  try { contact = await loadJSON("content/contact.json"); populateTopbar(contact); } catch (e) {}

  const app = document.getElementById("app");
  try {
    switch (page) {
      case "home": await renderHome(app, contact); break;
      case "csomagok": renderCardsPage(app, await loadJSON("content/packages.json"), "Csomagok", "packages"); break;
      case "szolgaltatasok": renderCardsPage(app, await loadJSON("content/services.json"), "Szolgáltatások", "services"); break;
      case "kiszallas": renderCardsPage(app, await loadJSON("content/delivery.json"), "Kiszállási díj", "delivery"); break;
      case "galeria": renderGallery(app, await loadJSON("content/gallery.json")); break;
      case "kapcsolat": renderContact(app, contact || (await loadJSON("content/contact.json"))); break;
    }
  } catch (err) {
    console.error(err);
    app.innerHTML = `<div class="container"><p style="margin-top:30px;color:#ffbcbc;background:#2a0f0f;border:1px solid #a33;padding:14px 18px;border-radius:12px;">A tartalom betöltése nem sikerült. Helyi megnyitásnál indíts szervert (lásd README).</p></div>`;
  }
}

document.addEventListener("DOMContentLoaded", initSite);
