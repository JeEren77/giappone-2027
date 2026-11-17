# 旅 Giappone 2027

L'app del nostro viaggio di gruppo in Giappone (16–29 agosto 2027, date provvisorie).
Si installa sul telefono come un'app vera e funziona anche senza rete.

**Apri l'app:** https://jeeren77.github.io/giappone-2027/

## Cosa fa

- **Io** – la pagina di ognuno, personalizzabile: conto alla rovescia (diventa "giorno 3 di 14" durante il viaggio), programma di oggi, meteo e cambio in diretta, cose da prenotare, le mie prenotazioni, le mie spese con budget, la mia valigia, le mie note. Si scelgono icona, colore e quali riquadri vedere e in che ordine.
- **Viaggio** – l'itinerario come una linea della metro, con un cartello di stazione per ogni giorno, il meteo della tappa e il percorso con i mezzi in Google Maps.
- **Chiedi** – assistente AI con Gemini: traduce foto di menù e cartelli (tenendo conto di allergie e cose che non mangi), risponde alle domande conoscendo l'itinerario, cerca sul web orari e aperture e rifà un giorno se piove o siete stanchi.
- **Gruppo** – prenotazioni con codici e indirizzi da mostrare al taxi, spese divise con "chi deve dare a chi", cose da fare.
- **Kit** – convertitore yen/euro, frasi giapponesi da mostrare a schermo intero, numeri di emergenza.

Dati in diretta: meteo da [Open-Meteo](https://open-meteo.com) e cambio della Banca Centrale Europea da [Frankfurter](https://frankfurter.dev). Sono gratuiti e non serve nessuna chiave.

## Installarla sul telefono

- **iPhone:** apri il link con Safari → tasto Condividi → *Aggiungi alla schermata Home*.
- **Android:** apri il link con Chrome → menu ⋮ → *Installa app*.

## Collegare il gruppo (una volta sola, lo fa una persona)

Finché non la colleghi, i dati restano solo sul tuo telefono. Per condividerli con tutti serve un database Firebase gratuito:

1. Vai su <https://console.firebase.google.com> e crea un progetto (Google Analytics non serve).
2. Nel menu a sinistra: **Build → Firestore Database → Crea database**. Scegli una zona europea (es. `eur3`) e la modalità di produzione.
3. Nella scheda **Regole** del database, sostituisci tutto con il contenuto del file [`firestore.rules`](firestore.rules) e premi **Pubblica**.
4. Torna alla home del progetto, premi l'icona **`</>`** (app web), dai un nome qualsiasi e registra l'app. Copia il blocco `const firebaseConfig = { … }`.
5. Nell'app: **Gruppo → ⚙︎ → Collega il gruppo**, incolla la configurazione e conferma. I tuoi dati (itinerario compreso) vengono caricati online.
6. Premi **Copia link di invito** e mandalo nel gruppo WhatsApp. Chi lo apre è già collegato.

> Chi ha il link di invito può leggere e modificare il viaggio: non condividerlo fuori dal gruppo. Non salvate numeri di passaporto o di carte.

## Attivare l'AI con Gemini (per tutti)

1. Vai su <https://aistudio.google.com/apikey> e crea una chiave API.
2. Nell'app: **Gruppo → ⚙︎ → Chiave API Gemini**, incollala e salva. Da quel momento l'AI funziona per tutti i membri.
3. Il modello predefinito è `gemini-flash-latest`, che segue sempre l'ultimo modello Flash di Google. Si può cambiare dalle stesse impostazioni.

> La chiave è visibile a chi ha il link del gruppo. Restate nel livello gratuito o impostate un limite di spesa su Google Cloud. Nel livello gratuito Google può usare i contenuti inviati per migliorare i suoi prodotti: non mandate foto di documenti.

## Struttura

| File | Cosa contiene |
|---|---|
| `index.html` | pagina e grafica |
| `app.js` | logica dell'app |
| `seed.js` | itinerario iniziale proposto |
| `sw.js` | funzionamento offline |
| `manifest.webmanifest`, `icons/` | installazione come app |
| `firestore.rules` | regole di sicurezza del database |

Nessun passaggio di build: è HTML e JavaScript puro, pubblicato con GitHub Pages.
