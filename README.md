# Horváth Lámpapolír – weboldal

Egyszerű, egyoldalas statikus weboldal (HTML/CSS/JS) **Decap CMS** admin felülettel.
A szövegek, árak, csomagok, szolgáltatások és a galéria a `content/` mappa JSON-fájljaiból
töltődnek be – így kódolás nélkül, a `/admin` felületen szerkeszthetők.

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
├─ admin/                  # Decap CMS admin felület
│  ├─ index.html
│  └─ config.yml
├─ images/uploads/         # Ide kerülnek a CMS-ből feltöltött képek
└─ netlify.toml
```

## Helyi megtekintés (fejlesztés)

> **Fontos:** a `content/*.json` fájlokat a böngésző `fetch`-csel tölti be, ez pedig
> **nem működik**, ha az `index.html`-t dupla kattintással (`file://`) nyitod meg.
> Indíts egy egyszerű helyi szervert:

**Python (ha van telepítve):**
```bash
cd "I:\Horvath-Lampapolir-Web"
python -m http.server 8080
```
Majd nyisd meg: <http://localhost:8080>

**Vagy Node.js-szel:**
```bash
npx serve -l 8080 "I:\Horvath-Lampapolir-Web"
```

Az oldal a <http://localhost:8080> címen jelenik meg.
(A `/admin` felület helyben csak korlátozottan működik – éles belépés a Netlify-n keresztül,
lásd lentebb.)

---

## Élesítés + Decap CMS bekapcsolása (lépésről lépésre)

A Decap CMS `git-gateway` backendet és **Netlify Identity**-t használ. Ehhez a projektnek
egy Git-repóban (GitHub/GitLab) kell lennie, és a Netlify-ra kell publikálni.

### 1. Töltsd fel a projektet GitHubra
1. Hozz létre egy új privát repót a GitHubon (pl. `horvath-lampapolir-web`).
2. A projekt mappájában:
   ```bash
   cd "I:\Horvath-Lampapolir-Web"
   git init
   git add .
   git commit -m "Első verzió"
   git branch -M main
   git remote add origin https://github.com/<felhasznalonev>/horvath-lampapolir-web.git
   git push -u origin main
   ```

### 2. Kösd össze a Netlify-vel
1. Lépj be a <https://app.netlify.com> oldalra.
2. **Add new site → Import an existing project → GitHub**, válaszd ki a repót.
3. Build beállítás: **build command üres**, **publish directory: `.`** (a `netlify.toml`
   ezt már tartalmazza) → **Deploy**.
4. Pár másodperc után kapsz egy `https://valami-nev.netlify.app` címet.

### 3. Kapcsold be a Netlify Identity-t
1. A Netlify vezérlőpultján a site-nál: **Site configuration → Identity → Enable Identity**.
2. **Registration preferences**: állítsd **Invite only**-ra (csak meghívott
   felhasználó léphet be – ez a biztonságos).
3. Görgess a **Services → Git Gateway** részhez, és kattints **Enable Git Gateway**.
   (Ez engedi, hogy a CMS a te nevedben mentse a módosításokat a repóba.)

### 4. Első admin-belépés
1. Ugyanitt: **Identity → Invite users**, írd be a saját e-mail-címed → **Send**.
2. Az e-mailben kapott linkre kattintva állíts be jelszót.
   - Ha a link a főoldalra vinne `#invite_token=...` résszel a címben, az oldal
     automatikusan felajánlja a jelszó beállítását (ezt a beépített Netlify Identity
     widget kezeli).
3. Ezután lépj a `https://valami-nev.netlify.app/admin/` címre, és jelentkezz be a
   most beállított e-mail + jelszó párossal.
4. Kész! Bal oldalt megjelennek a szerkeszthető szekciók (Fejléc, Bemutatkozás,
   Csomagok, stb.). Módosítás után a **Publish** gombbal élesíthetsz – a CMS commitol
   a repóba, a Netlify pedig automatikusan újrapubliká az oldalt.

### 5. (Ajánlott) Egyedi domain
A Netlify-n **Domain management** alatt köthetsz saját domaint (pl. `horvathlampapolir.hu`),
és ingyenes HTTPS-t kapsz hozzá.

---

## Amit érdemes még kitölteni
- `content/contact.json` → **`phone`**: valódi telefonszám (a `[TELEFONSZÁM]` helyére).
- `content/contact.json` → **`facebook_url`**: a Facebook oldal linkje (`[FACEBOOK LINK]` helyére).
- Ezeket megteheted közvetlenül a fájlban **vagy** a `/admin` felület „Elérhetőség” menüjében.

## Galéria képek
A `/admin → Galéria` menüben tölthetsz fel képeket; a CMS az `images/uploads/`
mappába menti őket, és a galéria automatikusan megjeleníti.

## Dizájn színek
- Háttér: `#0a0a0a` (fekete)
- Akcent: `#f0b429` (arany/sárga)
- Szöveg: ezüst/króm árnyalatok
Illeszkedik a fekete-arany-króm színvilágú fényszóró-logóhoz. A logó helye jelenleg egy
💡 emoji a fejlécben – cseréld le valódi logóra: tedd a képet pl. `images/logo.png` néven,
és az `index.html`-ben a `.hero__logo` div tartalmát írd át `<img src="images/logo.png" alt="Logó">`-ra.
