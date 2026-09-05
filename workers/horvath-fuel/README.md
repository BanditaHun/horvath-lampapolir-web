# horvath-fuel Worker – napi üzemanyagár

Ez a kis Cloudflare Worker naponta lekéri a **holtankoljak.hu** átlagos
üzemanyagárait (95-ös benzin, gázolaj), és a weboldal **Kiszállási
kalkulátora** ezt mutatja tájékoztató jelleggel.

## Telepítés (egyszer kell)

A `workers/horvath-fuel` mappában:

```bash
npx wrangler deploy
```

Ha még nem vagy bejelentkezve:

```bash
npx wrangler login
```

A telepítés után a Worker elérhető lesz itt:

```
https://horvath-fuel.andras-horvat1989.workers.dev
```

Ez pontosan az az URL, amit a weboldal (`js/site.js` → `FUEL_URL`) hív.
Ha a te workers.dev aldomained más, írd át a `FUEL_URL`-t a `js/site.js`-ben.

## Mit ad vissza

```json
{ "benzin": 617, "gazolaj": 696, "source": "holtankoljak.hu", "updated": "2026. 09. 05." }
```

- Az árak Ft/l-ben, egész számra kerekítve.
- Ha a forrás épp nem elérhető, tartalék („becsült") értéket ad vissza –
  ezt a `worker.js` tetején tudod frissíteni.
- 3 óránként frissül (gyorsítótárazott).

## Megjegyzés

Az üzemanyagár **csak tájékoztató** az oldalon; a ténylegesen felszámított
kiszállási díjat a fix díjszabás (delivery.json) adja, nem az üzemanyagár.
