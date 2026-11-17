# 旅 Giappone 2027

L'app del nostro viaggio di gruppo in Giappone (16–29 agosto 2027, date provvisorie).
Stile iOS, chiara o scura in base al telefono, si installa come un'app vera e funziona anche senza rete.

**Apri l'app:** https://jeeren77.github.io/giappone-2027/

## Cosa fa

- **Oggi** – conto alla rovescia (durante il viaggio diventa "giorno 3 di 14"), prossima attività con indicazioni, meteo e cambio in diretta, promemoria delle scadenze, le mie spese. Frasi, taxi, cambio e SOS a un tocco. Ognuno sceglie cosa vedere e in che ordine.
- **Viaggio** – i 14 giorni divisi per città, con un cartello di stazione per ogni giorno, meteo della tappa e "Cambia questo giorno con l'AI".
- **Mappa** – tutte le attività sulla mappa, giorno per giorno, con il percorso.
- **Chiedi** – assistente Gemini: traduce foto di menù e cartelli (tenendo conto di cosa non mangi), conosce l'itinerario, cerca sul web orari e aperture.
- **Gruppo** – prenotazioni (codici, "mostra al taxi", calendario), spese divise con "chi deve dare a chi", proposte da votare, cose da fare con promemoria.
- **La mia pagina** (tocca la tua icona in Oggi) – profilo, cosa non mangio, la mia valigia, le mie note, budget.

Dati in diretta gratuiti e senza chiave: meteo da [Open-Meteo](https://open-meteo.com), cambio BCE da [Frankfurter](https://frankfurter.dev), mappe © OpenStreetMap e CARTO.

## Installarla

- **iPhone:** apri il link con Safari → Condividi → *Aggiungi alla schermata Home*.
- **Android:** apri il link con Chrome → menu ⋮ → *Installa app*.

## Collegare il gruppo con Firebase (lo fa una persona, una volta sola)

Finché non la colleghi, i dati restano solo sul tuo telefono. Ci vogliono circa 10 minuti, da computer è più comodo.

### 1. Crea il progetto
1. Vai su <https://console.firebase.google.com> e premi **Crea un progetto**.
2. Nome: `giappone-2027`. Google Analytics non serve: disattivalo. Premi **Crea progetto**.

### 2. Attiva l'accesso con Google
1. Nel menu a sinistra: **Build → Authentication → Inizia**.
2. Scheda **Metodo di accesso** → **Google** → attiva l'interruttore, scegli la tua email di assistenza → **Salva**.
3. Scheda **Impostazioni → Domini autorizzati → Aggiungi dominio** → scrivi `jeeren77.github.io` → **Aggiungi**.

### 3. Crea il database
1. Menu: **Build → Firestore Database → Crea database**.
2. Posizione: una europea (es. `eur3`). Modalità: **produzione**. Premi **Crea**.
3. Scheda **Regole**: cancella tutto, incolla il contenuto del file [`firestore.rules`](firestore.rules) e premi **Pubblica**.

### 4. Copia la configurazione
1. Ingranaggio in alto a sinistra → **Impostazioni progetto** → in fondo, **Le tue app** → icona **`</>`** (Web).
2. Nome: `app`. Non spuntare Firebase Hosting. Premi **Registra app**.
3. Copia tutto il blocco `const firebaseConfig = { … };`.

> Questa configurazione non è una password: identifica solo il progetto. A proteggere i dati sono l'accesso con Google e le regole del database. Non va comunque scritta nel codice: si incolla nell'app.

### 5. Collega l'app
1. Apri l'app → tocca la tua icona in **Oggi** → **Impostazioni del viaggio** → **Collega il gruppo con Firebase**.
2. Incolla la configurazione → **Collega** → **Continua con Google**.
3. L'itinerario e tutto quello che hai già inserito vengono caricati online.
4. **Invita qualcuno** e manda il link nel gruppo. Chi lo apre entra con il suo account Google ed è dentro.

Solo chi ha fatto l'accesso **ed** è stato invitato può vedere o modificare il viaggio.

## Attivare Gemini per tutti

1. Vai su <https://aistudio.google.com/apikey> → **Crea chiave API** (puoi sceglierla dentro il progetto `giappone-2027`).
2. **Proteggila** su <https://console.cloud.google.com/apis/credentials>: apri la chiave →
   - *Restrizioni delle applicazioni*: **Siti web** → aggiungi `https://jeeren77.github.io/*`
   - *Restrizioni delle API*: **Generative Language API**
   - **Salva**. Così funziona solo dentro la vostra app.
3. Nell'app: **Impostazioni del viaggio → Chiave**, incollala e **Salva**. La vedono solo i membri del viaggio, mai GitHub.
4. Modello: lascia `gemini-flash-latest`, segue sempre l'ultimo Flash di Google.

> Nel livello gratuito di Gemini, Google può usare i contenuti inviati per migliorare i suoi prodotti: non mandate foto di documenti personali.

## Promemoria

Le scadenze (biglietti Ghibli, lotteria Nintendo Museum, hotel…) hanno una data. Il pulsante calendario le aggiunge al calendario del telefono con un avviso: è il modo più affidabile su iPhone, senza bisogno di server.

## Struttura

| File | Cosa contiene |
|---|---|
| `index.html` | pagina e grafica |
| `app.js` | logica dell'app |
| `seed.js` | itinerario iniziale proposto |
| `sw.js` | funzionamento offline |
| `manifest.webmanifest`, `icons/` | installazione come app |
| `firestore.rules` | regole di sicurezza del database |

HTML e JavaScript puro, pubblicato con GitHub Pages. Nessuna chiave nel codice.
