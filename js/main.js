// Tartalom + megjelenés betöltése a content/*.json fájlokból és az oldal felépítése.
// A szövegek/árak és a tipográfia a CMS-ből szerkeszthetők, nincsenek a HTML-be kódolva.

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

function telHref(phone) {
  const digits = (phone || "").replace(/[^\d+]/g, "");
  return digits ? "tel:" + digits : "#kapcsolat";
}

// ---- Betűtípusok (a CMS „Megjelenés" választható értékei) ----
const SYSTEM_FONT = '"Segoe UI", system-ui, -apple-system, Roboto, Arial, sans-serif';
const FONT_MAP = {
  "Rendszer (alap)": { css: SYSTEM_FONT, g: null },
  "Montserrat": { css: "'Montserrat', sans-serif", g: "Montserrat:wght@400;600;800" },
  "Poppins": { css: "'Poppins', sans-serif", g: "Poppins:wght@400;600;800" },
  "Roboto": { css: "'Roboto', sans-serif", g: "Roboto:wght@400;700;900" },
  "Inter": { css: "'Inter', sans-serif", g: "Inter:wght@400;600;800" },
  "Oswald": { css: "'Oswald', sans-serif", g: "Oswald:wght@400;600;700" },
  "Rajdhani": { css: "'Rajdhani', sans-serif", g: "Rajdhani:wght@500;600;700" },
  "Bebas Neue": { css: "'Bebas Neue', sans-serif", g: "Bebas+Neue" },
  "Anton": { css: "'Anton', sans-serif", g: "Anton" },
};

function loadGoogleFonts(specs) {
  const families = specs.filter(Boolean);
  if (!families.length) return;
  const pre1 = el("link"); pre1.rel = "preconnect"; pre1.href = "https://fonts.googleapis.com";
  const pre2 = el("link"); pre2.rel = "preconnect"; pre2.href = "https://fonts.gstatic.com"; pre2.crossOrigin = "anonymous";
  const link = el("link"); link.rel = "stylesheet";
  link.href = "https://fonts.googleapis.com/css2?" + families.map((f) => "family=" + f).join("&") + "&display=swap";
  document.head.append(pre1, pre2, link);
}

function applyTheme(theme) {
  if (!theme) return;
  const root = document.documentElement.style;

  const body = FONT_MAP[theme.font_family] || FONT_MAP["Rendszer (alap)"];
  const heading = FONT_MAP[theme.heading_font_family] || body;

  root.setProperty("--font-body", body.css);
  root.setProperty("--font-heading", heading.css);

  // Egyedi Google Fontok betöltése (duplikátumok kiszűrve)
  loadGoogleFonts([...new Set([body.g, heading.g])]);

  if (theme.base_font_size) root.setProperty("--base-font-size", theme.base_font_size);
  if (theme.heading_scale) root.setProperty("--heading-scale", String(theme.heading_scale));
  if (theme.accent_color) {
    root.setProperty("--gold", theme.accent_color);
    root.setProperty("--gold-dim", theme.accent_color);
  }
}

function initNav() {
  const nav = document.getElementById("nav");
  const toggle = document.getElementById("nav-toggle");
  const links = document.getElementById("nav-links");
  if (!nav || !toggle || !links) return;
  toggle.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(open));
  });
  // Mobil menü bezárása kattintás után
  links.querySelectorAll("a").forEach((a) =>
    a.addEventListener("click", () => {
      nav.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
    })
  );
}

async function init() {
  initNav();

  // Megjelenés (nem kritikus – ha hiányzik, marad az alap)
  try {
    applyTheme(await loadJSON("content/theme.json"));
  } catch (e) {
    console.warn("theme.json nem tölthető, alap megjelenés marad", e);
  }

  try {
    const [hero, about, packages, services, delivery, contact, gallery] = await Promise.all([
      loadJSON("content/hero.json"),
      loadJSON("content/about.json"),
      loadJSON("content/packages.json"),
      loadJSON("content/services.json"),
      loadJSON("content/delivery.json"),
      loadJSON("content/contact.json"),
      loadJSON("content/gallery.json"),
    ]);

    // --- Hero ---
    document.getElementById("hero-title").textContent = hero.title;
    document.getElementById("hero-subtitle").textContent = hero.subtitle;
    document.title = hero.title + " – mobil fényszóró-felújítás";
    if (hero.banner) {
      document.querySelector(".hero").style.setProperty("--hero-banner", `url("${hero.banner}")`);
    }

    // --- Bemutatkozás ---
    document.getElementById("about-heading").textContent = about.heading;
    document.getElementById("about-text").textContent = about.text;

    // --- Csomagok ---
    document.getElementById("packages-heading").textContent = packages.heading;
    const pkgWrap = document.getElementById("packages-list");
    packages.items.forEach((p, i) => {
      const featured = i === packages.items.length - 1;
      const card = el("article", "pkg" + (featured ? " pkg--featured" : ""));
      if (featured) card.appendChild(el("span", "pkg__badge", "Ajánlott"));
      card.appendChild(el("h3", "pkg__name", p.name));
      card.appendChild(el("p", "pkg__desc", p.description));
      card.appendChild(el("div", "pkg__price", p.price));
      pkgWrap.appendChild(card);
    });

    // --- Önálló szolgáltatások ---
    document.getElementById("services-heading").textContent = services.heading;
    const svcWrap = document.getElementById("services-list");
    services.items.forEach((s) => {
      const row = el("div", "row");
      row.appendChild(el("span", "row__name", s.name));
      row.appendChild(el("span", "row__price", s.price));
      svcWrap.appendChild(row);
    });

    // --- Kiszállási díj ---
    document.getElementById("delivery-heading").textContent = delivery.heading;
    const delWrap = document.getElementById("delivery-list");
    delivery.items.forEach((d) => {
      const row = el("div", "row");
      row.appendChild(el("span", "row__name", d.range));
      row.appendChild(el("span", "row__price", d.fee));
      delWrap.appendChild(row);
    });

    // --- Elérhetőség ---
    document.getElementById("contact-heading").textContent = contact.heading;
    const phoneEl = document.getElementById("contact-phone");
    phoneEl.textContent = contact.phone;
    phoneEl.href = telHref(contact.phone);
    document.getElementById("contact-note").textContent = contact.note;
    const fb = document.getElementById("contact-facebook");
    fb.href = contact.facebook_url || "#";
    fb.textContent = contact.facebook_label || "Facebook";

    // --- Galéria ---
    document.getElementById("gallery-heading").textContent = gallery.heading;
    const galWrap = document.getElementById("gallery-list");
    if (gallery.items && gallery.items.length) {
      gallery.items.forEach((g) => {
        const fig = el("figure");
        const img = el("img");
        img.src = g.image;
        img.alt = g.caption || "Munka";
        img.loading = "lazy";
        fig.appendChild(img);
        if (g.caption) fig.appendChild(el("figcaption", null, g.caption));
        galWrap.appendChild(fig);
      });
    } else {
      galWrap.parentElement.appendChild(
        el("p", "gallery__empty", "Hamarosan feltöltjük az elkészült munkák képeit.")
      );
    }
  } catch (err) {
    console.error(err);
    const box = document.getElementById("error-box");
    if (box) {
      box.style.display = "block";
      box.textContent =
        "A tartalom betöltése nem sikerült. Ha a fájlt közvetlenül (file://) nyitottad meg, indíts helyi szervert – lásd a README-t.";
    }
  }
}

document.addEventListener("DOMContentLoaded", init);
