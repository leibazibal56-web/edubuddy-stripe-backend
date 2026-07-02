# Server Stripe - EduBuddy (Vercel Edition)

Acesta este un backend simplu în Node.js conceput pentru a genera tranzacții securizate Stripe (Payment Intent) pentru aplicația de mobil EduBuddy, pregătit pentru găzduire pe **Vercel**.

---

## De ce Vercel?
1. **100% Gratuit și Fără Card Bancar:** Vercel nu solicită adăugarea unui card bancar pentru conturile personale (Hobby).
2. **Performanță maximă (Serverless):** Spre deosebire de Render, serviciul nu "adoarme". Plățile se vor deschide instant pe telefon, fără acea întârziere de 50 de secunde la prima pornire.

---

## Cum îl găzduiți gratuit pe Vercel (Pas cu Pas)

### Pasul 1: Creați un cont pe Vercel
1. Accesați **[Vercel.com](https://vercel.com/)** și apăsați pe **Sign Up**.
2. Selectați contul de tip **Hobby** (este cel gratuit).
3. Autentificați-vă folosind contul dumneavoastră **GitHub** (aceasta va conecta direct proiectele).

### Pasul 2: Actualizați codul pe GitHub
Asigurați-vă că repository-ul dumneavoastră de pe GitHub (`edubuddy-stripe-backend`) conține acum următoarele fișiere și structură:
* 📁 **`api/`**
  * 📄 **`index.js`**
* 📄 **`package.json`**
* 📄 **`vercel.json`**
*(Dacă mai aveți vechiul `index.js` în afara folderului `api/`, ștergeți-l de pe GitHub).*

### Pasul 3: Importați proiectul în Vercel
1. În panoul principal Vercel (*Dashboard*), apăsați pe butonul albastru **Add New...** -> **Project**.
2. În lista de repository-uri GitHub afișată, veți vedea `edubuddy-stripe-backend`. Apăsați pe butonul **Import** din dreptul lui.
3. Se va deschide pagina de configurare a proiectului.

### Pasul 4: Configurați variabilele de mediu și publicați
1. Derulați în jos la secțiunea **Environment Variables** (Variabile de mediu).
2. Adăugați cele două chei din contul dumneavoastră Stripe:
   * **Name:** `STRIPE_SECRET_KEY` | **Value:** `sk_live_...` (Cheia dumneavoastră secretă din contul Stripe Developers -> API Keys).
   * **Name:** `STRIPE_PUBLISHABLE_KEY` | **Value:** `pk_live_...` (Cheia dumneavoastră publică Stripe).
   *(Apăsați pe butonul **Add** după fiecare).*
3. Apăsați pe butonul mare albastru **Deploy** (Publicare).

---

## Finalizarea integrării:

În câteva secunde, Vercel va compila proiectul și vă va afișa un ecran de felicitare (cu confetti). 

Sub ecranul de preview al site-ului, veți vedea link-ul URL generat de Vercel pentru serverul dumneavoastră online, care va arăta astfel:
`https://edubuddy-stripe-backend.vercel.app`

Copiați această adresă și puneți-o în fișierul `.env` sau `local.properties` al aplicației de mobil Android înainte de a genera APK-ul:
`STRIPE_BACKEND_URL=https://edubuddy-stripe-backend.vercel.app/`
*(Atenție: adresa trebuie să înceapă cu `https://` și să se termine cu `/` la final!)*
