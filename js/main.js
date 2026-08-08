// Tartalom betöltése a content/*.json fájlokból és az oldal felépítése.
// Így a szövegek/árak a Decap CMS-ből szerkeszthetők, nincsenek a HTML-be kódolva.

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

async function init() {
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
