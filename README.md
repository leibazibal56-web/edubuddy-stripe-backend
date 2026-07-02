# Server Stripe - EduBuddy

Acesta este un backend simplu în Node.js conceput pentru a genera tranzacții securizate Stripe (Payment Intent) pentru aplicația de mobil EduBuddy.

---

## Cum îl găzduiți gratuit pe Render (Pas cu Pas)

[Render](https://render.com/) este o platformă cloud care permite găzduirea gratuită a serviciilor web de tip Node.js.

### Pasul 1: Creați un cont pe Render
1. Mergeți pe **[Render.com](https://render.com/)** și creați un cont gratuit.
2. Vă puteți autentifica instant folosind contul dumneavoastră Google sau GitHub.

### Pasul 2: Încărcați codul pe GitHub
Render se conectează la contul dumneavoastră de GitHub pentru a prelua codul și a-l pune online.
1. Creați un repository nou public sau privat pe contul dvs. GitHub, denumit `edubuddy-stripe-backend`.
2. Încărcați cele două fișiere (`index.js` și `package.json`) în acel repository.

### Pasul 3: Creați serviciul web pe Render
1. În panoul principal Render (*Dashboard*), apăsați pe **New +** (în dreapta-sus) și alegeți **Web Service**.
2. Conectați contul dumneavoastră de GitHub și selectați repository-ul `edubuddy-stripe-backend` creat anterior.
3. Completați setările:
   * **Name:** `edubuddy-stripe-backend`
   * **Region:** Alegeți una din Europa (de exemplu, *Frankfurt*).
   * **Runtime:** *Node*
   * **Build Command:** `npm install`
   * **Start Command:** `node index.js`
   * **Instance Type:** Selectați **Free** (Gratuit).

### Pasul 4: Configurați Cheile Stripe ca variabile de mediu (Environment)
Pentru ca serverul să se poată conecta la contul dumneavoastră Stripe, trebuie să îi dați cheile dumneavoastră:
1. În meniul serviciului creat pe Render, dați click pe tab-ul **Environment** (în stânga).
2. Apăsați **Add Environment Variable** și adăugați următoarele chei (pe care le luați din contul dvs. Stripe online):
   * `STRIPE_SECRET_KEY` = `sk_live_...` (Cheia dumneavoastră secretă Stripe din panoul Stripe Developers -> API Keys).
   * `STRIPE_PUBLISHABLE_KEY` = `pk_live_...` (Cheia dumneavoastră publică Stripe).
3. Apăsați **Save Changes**.

---

## Finalizarea integrării:

După ce Render termină publicarea (durează 1-2 minute), vă va afișa în colțul din stânga-sus adresa web a serverului dumneavoastră online, care va arăta astfel:
`https://edubuddy-stripe-backend.onrender.com/`

Copiați această adresă și puneți-o în fișierul `.env` al aplicației de mobil Android înainte de a compila APK-ul:
`STRIPE_BACKEND_URL=https://edubuddy-stripe-backend.onrender.com/`
*(Atenție: adresa trebuie să se termine cu `/` la final!)*
