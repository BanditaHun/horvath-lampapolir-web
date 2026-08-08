# Horváth Lámpapolír – weboldal

Egyszerű, egyoldalas statikus weboldal (HTML/CSS/JS) **Sveltia CMS** admin felülettel.
A szövegek, árak, csomagok, szolgáltatások és a galéria a `content/` mappa JSON-fájljaiból
töltődnek be – így kódolás nélkül, a `/admin` felületen szerkeszthetők.

> **Miért Sveltia és nem Decap?** A Netlify Identity + Git Gateway (amit a Decap alapból
> használt) ki lett vezetve, új projekteknél nem kapcsolható be. Ezért a **Sveltia CMS**-t
> használjuk (a Decap modern, karbantartott utódja – ugyanaz a `config.yml`), **GitHub
> backenddel**, a hitelesítést pedig egy ingyenes **Cloudflare Worker** intézi.

## Mappaszerkezet

```
Horvath-Lampapolir-Web/
├─ index.html              # A weboldal
├─ css/style.css           # Dizájn (fekete–arany–króm)
├─ js/main.js              # Betölti a content/*.json tartalmakat
├─ content/                # SZERKESZTHETŐ tartalom (CMS)
│  ├─ hero.json            # Fejléc (cím + alcím)
│  ├─ about.json           # Bemutatkozás
│  ├─ packages.json        # Csomagok (ALAP / STANDARD / PRÉMIUM)
│  ├─ services.json        # Önálló szolgáltatások
│  ├─ delivery.json        # Kiszállási díj
│  ├─ contact.json         # Elérhetőség (telefon, Facebook)
│  └─ gallery.json         # Galéria képek
├─ admin/                  # Sveltia CMS admin felület
│  ├─ index.html
│  └─ config.yml
├─ images/logo.png         # A fejléc logója
├─ images/uploads/         # Ide kerülnek a CMS-ből feltöltött képek
└─ netlify.toml
```

## Helyi megtekintés (fejlesztés)

> **Fontos:** a `content/*.json` fájlokat a böngésző `fetch`-csel tölti be, ez pedig
> **nem működik**, ha az `index.html`-t dupla kattintással (`file://`) nyitod meg.
> Indíts egy egyszerű helyi szervert Node.js-szel:

```bash
npx serve -l 8080 "I:\Horvath-Lampapolir-Web"
```

Az oldal a <http://localhost:8080> címen jelenik meg.
(A `/admin` felület helyi belépése nem működik – éles belépés a Worker + GitHub OAuth-on
keresztül, lásd lentebb.)

---

## Élesítés lépésről lépésre

### 1. GitHubra feltöltés  ✅ KÉSZ
A projekt már fenn van privát repóban:
**https://github.com/BanditaHun/horvath-lampapolir-web**

Új változtatás feltöltése később:
```bash
cd "I:\Horvath-Lampapolir-Web"
git add .
git commit -m "Módosítás"
git push
```

### 2. Weboldal élesítése Netlify-on (statikus tárhely)
1. Lépj be: <https://app.netlify.com> (legegyszerűbb: **Log in with GitHub**).
2. **Add new site → Import an existing project → GitHub** → válaszd a
   `horvath-lampapolir-web` repót.
3. Build: **build command üres**, **publish directory: `.`** (a `netlify.toml` ezt már
   megadja) → **Deploy**.
4. Pár másodperc múlva megkapod az élő címet: `https://valami-nev.netlify.app`
   (Itt **nem** kell Identity-t bekapcsolni – a belépést a Worker intézi.)

### 3. GitHub OAuth App létrehozása
1. Menj ide: <https://github.com/settings/applications/new>
2. Töltsd ki:
   - **Application name:** Horváth Lámpapolír CMS (bármi lehet)
   - **Homepage URL:** a Netlify-címed (pl. `https://valami-nev.netlify.app`)
   - **Authorization callback URL:** *egyelőre* `https://example.com/callback`
     (a 4. lépés után visszajössz és beírod a valódi Worker-címet + `/callback`)
3. **Register application** → jegyezd fel a **Client ID**-t, majd **Generate a new client
   secret** → jegyezd fel a **Client Secret**-et is (csak egyszer látszik!).

### 4. Cloudflare Worker (a hitelesítő) telepítése
1. Regisztrálj (ingyenes): <https://dash.cloudflare.com/sign-up>
2. Nyisd meg a hitelesítő Workert: <https://github.com/sveltia/sveltia-cms-auth>
   és kövesd a README **„Deploy to Cloudflare"** gombját (vagy klónozd és `wrangler deploy`).
3. A telepítés után kapsz egy Worker-címet, kb.:
   `https://sveltia-cms-auth.<valami>.workers.dev` – **jegyezd fel.**
4. A Cloudflare dashboardon a Workernél: **Settings → Variables** – add hozzá:
   - `GITHUB_CLIENT_ID` = a 3. lépésből
   - `GITHUB_CLIENT_SECRET` = a 3. lépésből (kattints **Encrypt**)
   - `ALLOWED_DOMAINS` = a Netlify-hosted domain, pl. `valami-nev.netlify.app`
     (később a saját domain is ide vehető, vesszővel elválasztva)
   - majd **Deploy** / mentés.

### 5. A három cím összekötése
1. **GitHub OAuth App** (3. lépés) → szerkeszd, és a **Authorization callback URL**-t
   írd át a valódira: `https://sveltia-cms-auth.<valami>.workers.dev/callback` → mentés.
2. A projektben **`admin/config.yml`** → a `base_url` sort írd át a Worker-címedre:
   ```yaml
   backend:
     name: github
     repo: BanditaHun/horvath-lampapolir-web
     branch: main
     base_url: https://sveltia-cms-auth.<valami>.workers.dev
   ```
3. Mentsd, majd töltsd fel:
   ```bash
   cd "I:\Horvath-Lampapolir-Web"
   git add admin/config.yml
   git commit -m "CMS OAuth Worker cim beallitasa"
   git push
   ```

### 6. Első admin-belépés
1. Nyisd meg: `https://valami-nev.netlify.app/admin/`
2. Kattints **Login with GitHub** → engedélyezd → belépsz.
3. Kész! Megjelennek a szerkeszthető szekciók (Fejléc, Bemutatkozás, Csomagok, stb.).
   Mentés után a CMS közvetlenül commitol a GitHub-repóba, a Netlify pedig automatikusan
   újrapublikálja az oldalt.

> **Fontos:** a `github` backendnél minden CMS-felhasználónak **push-joga** kell legyen a
> repóhoz. A te fiókod (a repó tulajdonosa) automatikusan jó.

### 7. (Ajánlott) Egyedi domain
A Netlify-n **Domain management** alatt köthetsz saját domaint (pl. `horvathlampapolir.hu`),
ingyenes HTTPS-sel. Ha megvan, vedd fel a Worker `ALLOWED_DOMAINS` változójába is.

---

## Amit érdemes még kitölteni
- `content/contact.json` → **`phone`**: valódi telefonszám (a `[TELEFONSZÁM]` helyére).
- `content/contact.json` → **`facebook_url`**: a Facebook oldal linkje (`[FACEBOOK LINK]` helyére).
- Ezeket megteheted közvetlenül a fájlban **vagy** a `/admin` felület „Elérhetőség" menüjében.

## Galéria képek
A `/admin → Galéria` menüben tölthetsz fel képeket; a CMS az `images/uploads/`
mappába menti őket, és a galéria automatikusan megjeleníti.

## Logó
A fejléc a `images/logo.png` fájlt jeleníti meg (fekete-arany-króm címeres logó). Cseréhez
egyszerűen írd felül ezt a fájlt. Ha hiányzik, az oldal egy 💡 emoji + szöveges névre esik
vissza (nem törik el).

## Dizájn színek
- Háttér: `#0a0a0a` (fekete)
- Akcent: `#f0b429` (arany/sárga)
- Szöveg: ezüst/króm árnyalatok
