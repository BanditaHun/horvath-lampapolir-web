// horvath-fuel — napi átlagos magyar üzemanyagár (holtankoljak.hu), CORS-szal.
// A weboldal Kiszállási kalkulátora kéri le tájékoztató jelleggel.
// Telepítés: lásd a mappában lévő README.md-t (npx wrangler deploy).

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "public, max-age=10800", // 3 óra
};

// A holtankoljak.hu forrásból kiolvassa az adott üzemanyag ÁTLAG árát.
// Szerkezet: <img src="images/ua_pin/<marker>"> ... "Átlag - Ft/l" ... <span class="ar">616.5</span>
function parseAvg(html, marker) {
  const i = html.indexOf(marker);
  if (i < 0) return null;
  const seg = html.slice(i, i + 2500);
  const m = seg.match(/Átlag[^<]*<[^>]*>\s*<span[^>]*class="ar"[^>]*>\s*([\d.,]+)/i);
  if (!m) return null;
  const v = parseFloat(m[1].replace(",", "."));
  return isFinite(v) ? Math.round(v) : null;
}

export default {
  async fetch(request) {
    if (request.method === "OPTIONS") return new Response(null, { headers: CORS });

    // Tartalék értékek, ha a forrás épp nem elérhető (frissítsd, ha szükséges)
    let benzin = 617, gazolaj = 696, source = "becsült";

    try {
      const r = await fetch("https://holtankoljak.hu/", {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; HorvathLampapolir/1.0; +https://horvathlampapolir.hu)" },
        cf: { cacheTtl: 10800, cacheEverything: true },
      });
      if (r.ok) {
        const html = await r.text();
        const b = parseAvg(html, "95-benzin-e10.png");
        const g = parseAvg(html, "gazolaj.png");
        if (b) benzin = b;
        if (g) gazolaj = g;
        if (b || g) source = "holtankoljak.hu";
      }
    } catch (e) { /* marad a tartalék érték */ }

    const updated = new Date().toLocaleDateString("hu-HU", { timeZone: "Europe/Budapest" });
    return new Response(JSON.stringify({ benzin, gazolaj, source, updated }), { headers: CORS });
  },
};
