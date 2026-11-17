import { SEED_TRIP, SEED_DAYS, SEED_ITEMS, SEED_CHECK } from "./seed.js";

/* =========================================================
   STATO
   ========================================================= */
const COLS = ["days", "itin", "book", "exp", "check", "people"];
const S = {
  trip: { ...SEED_TRIP }, days: [], itin: [], book: [], exp: [], check: [], people: [],
  view: "me", day: null, grp: "book", me: null, phq: "",
  wx: {}, fx: null, chat: [], aiBusy: false, replan: null, mode: "local", synced: false
};
const DEFAULT_WIDGETS = [
  { id: "count", on: true }, { id: "today", on: true }, { id: "wx", on: true }, { id: "fx", on: true },
  { id: "todo", on: true }, { id: "mybook", on: true }, { id: "money", on: true }, { id: "pack", on: true }, { id: "notes", on: true }
];
const WLABEL = { count: "Conto alla rovescia / giorno di viaggio", today: "Programma di oggi", wx: "Meteo in diretta", fx: "Cambio in diretta",
  todo: "Da prenotare", mybook: "Le mie prenotazioni", money: "Le mie spese", pack: "La mia valigia", notes: "Le mie note" };
const COLORS = ["#13965a", "#1f6fc0", "#7b3fa0", "#e2620e", "#c22d4a", "#16191d"];
const EMOJI = ["🙂", "😎", "🦊", "🐼", "🍣", "🍜", "🎌", "🗻", "⛩️", "🎮", "📸", "🌸"];

const CITY = {
  tokyo: { k: "東京", r: "Tōkyō", c: "--tokyo", code: "TY", lat: 35.6895, lon: 139.6917 },
  hakone: { k: "箱根", r: "Hakone", c: "--hakone", code: "HK", lat: 35.2324, lon: 139.1069 },
  kyoto: { k: "京都", r: "Kyōto", c: "--kyoto", code: "KY", lat: 35.0116, lon: 135.7681 },
  uji: { k: "宇治", r: "Uji", c: "--kyoto", code: "KY", lat: 34.8844, lon: 135.7997 },
  nara: { k: "奈良", r: "Nara", c: "--nara", code: "NR", lat: 34.6851, lon: 135.8048 },
  osaka: { k: "大阪", r: "Ōsaka", c: "--osaka", code: "OS", lat: 34.6937, lon: 135.5023 },
  hiroshima: { k: "広島", r: "Hiroshima", c: "--hiro", code: "HR", lat: 34.3853, lon: 132.4553 },
  miyajima: { k: "宮島", r: "Miyajima", c: "--hiro", code: "HR", lat: 34.296, lon: 132.3198 },
  kamakura: { k: "鎌倉", r: "Kamakura", c: "--hakone", code: "KM", lat: 35.3192, lon: 139.5467 },
  nikko: { k: "日光", r: "Nikkō", c: "--tokyo", code: "NK", lat: 36.7199, lon: 139.6982 },
  fuji: { k: "富士", r: "Fuji", c: "--hakone", code: "FJ", lat: 35.5, lon: 138.76 },
  kanazawa: { k: "金沢", r: "Kanazawa", c: "--hakone", code: "KZ", lat: 36.5613, lon: 136.6562 },
  nagoya: { k: "名古屋", r: "Nagoya", c: "--osaka", code: "NG", lat: 35.1815, lon: 136.9066 },
  kobe: { k: "神戸", r: "Kōbe", c: "--osaka", code: "KB", lat: 34.6901, lon: 135.1955 },
  sapporo: { k: "札幌", r: "Sapporo", c: "--hakone", code: "SP", lat: 43.0618, lon: 141.3545 },
  okinawa: { k: "沖縄", r: "Okinawa", c: "--hakone", code: "OK", lat: 26.2124, lon: 127.6809 }
};
function city(name) {
  const n = String(name || "").toLowerCase();
  for (const key in CITY) if (n.includes(key)) return { key, ...CITY[key] };
  return { key: null, k: "日本", r: name || "Da decidere", c: "--jp", code: "JP" };
}

/* =========================================================
   UTIL
   ========================================================= */
const $ = id => document.getElementById(id);
const h = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const pd = s => { if (!s) return null; const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
const iso = d => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
const fmt = (s, o = { weekday: "short", day: "numeric", month: "short" }) => { const d = pd(s); return d ? d.toLocaleDateString("it-IT", o) : ""; };
const jpToday = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tokyo" }).format(new Date());
const yen = n => "¥" + Math.round(n).toLocaleString("it-IT");
const eur = n => "€" + (Math.round(n * 100) / 100).toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const rate = () => (S.fx && S.fx.rate) || Number(S.trip.rate) || 177;
const maps = q => "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(q);
const route = q => "https://www.google.com/maps/dir/?api=1&travelmode=transit&destination=" + encodeURIComponent(q);
const slug = s => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "x";
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2)).replace(/-/g, "").slice(0, 20);
const safeUrl = u => { u = String(u || "").trim(); if (!u) return ""; return /^https?:\/\//i.test(u) ? u : "https://" + u; };
function tripDays() { const a = pd(S.trip.start), b = pd(S.trip.end), out = []; if (!a || !b || b < a) return out; for (let d = new Date(a); d <= b && out.length < 45; d.setDate(d.getDate() + 1)) out.push(iso(d)); return out; }
const dayInfo = d => S.days.find(x => x.id === d) || {};
const dayItems = d => S.itin.filter(i => i.date === d).sort((a, b) => (a.time || "99").localeCompare(b.time || "99"));
const ls = { get(k, d = null) { try { const v = localStorage.getItem("jp_" + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem("jp_" + k, JSON.stringify(v)); } catch (e) {} } };
function toast(m) { const t = document.createElement("div"); t.className = "toast"; t.textContent = m; document.body.appendChild(t); setTimeout(() => t.remove(), 2800); }
const myPerson = () => S.people.find(p => p.id === slug(S.me)) || null;
const myWidgets = () => { const p = myPerson(); const w = p && Array.isArray(p.widgets) ? p.widgets : DEFAULT_WIDGETS; const ids = w.map(x => x.id); return [...w, ...DEFAULT_WIDGETS.filter(d => !ids.includes(d.id))]; };
const tripPhase = () => { const days = tripDays(), t = jpToday(); if (!days.length) return "none"; if (t < days[0]) return "before"; if (t > days[days.length - 1]) return "after"; return "during"; };

/* =========================================================
   ARCHIVIO: locale (solo questo telefono) o Firebase (gruppo)
   ========================================================= */
const Store = {
  watchers: {}, api: null,
  emit(col, rows) { (this.watchers[col] || []).forEach(cb => cb(rows)); },
  watch(col, cb) { (this.watchers[col] = this.watchers[col] || []).push(cb); }
};

function localBackend() {
  let data = ls.get("data");
  if (!data) data = seedData();
  const save = () => ls.set("data", data);
  const rows = col => Object.entries(data[col] || {}).map(([id, v]) => ({ ...v, id }));
  const fire = col => { save(); Store.emit(col, col === "trip" ? data.trip : rows(col)); };
  return {
    start() { Store.emit("trip", data.trip); COLS.forEach(c => Store.emit(c, rows(c))); },
    async setTrip(t) { data.trip = { ...data.trip, ...t }; fire("trip"); },
    async add(col, v) { (data[col] = data[col] || {})[uid()] = v; fire(col); },
    async set(col, id, v) { (data[col] = data[col] || {})[id] = v; fire(col); },
    async update(col, id, v) { if (!data[col] || !data[col][id]) throw new Error("missing"); data[col][id] = { ...data[col][id], ...v }; fire(col); },
    async del(col, id) { if (data[col]) delete data[col][id]; fire(col); },
    dump() { return data; }
  };
}
function seedData() {
  const d = { trip: { ...SEED_TRIP }, days: {}, itin: {}, book: {}, exp: {}, check: {}, people: {} };
  SEED_DAYS.forEach(([date, city, title, sleep, move, note]) => d.days[date] = { city, title, sleep, move, note });
  SEED_ITEMS.forEach(([date, time, title, place, note], i) => d.itin["s" + String(i).padStart(3, "0")] = { date, time, title, place, note, done: false, ts: i });
  SEED_CHECK.forEach(([cat, text, when], i) => d.check["c" + String(i).padStart(3, "0")] = { cat, text, when, done: false, order: i });
  return d;
}

const FB = "https://www.gstatic.com/firebasejs/10.12.2/";
async function cloudBackend(cfg, tripId) {
  const { initializeApp } = await import(FB + "firebase-app.js");
  const fs = await import(FB + "firebase-firestore.js");
  const app = initializeApp(cfg, "trip-" + tripId);
  let db;
  try { db = fs.initializeFirestore(app, { localCache: fs.persistentLocalCache({ tabManager: fs.persistentMultipleTabManager() }) }); }
  catch (e) { db = fs.getFirestore(app); }
  const tdoc = fs.doc(db, "trips", tripId);
  const col = c => fs.collection(db, "trips", tripId, c);
  return {
    fs, db,
    start() {
      fs.onSnapshot(tdoc, { includeMetadataChanges: true }, s => { S.synced = !s.metadata.fromCache; if (s.exists()) Store.emit("trip", s.data()); else render(); }, e => { console.warn(e); toast("Non riesco a leggere il viaggio: controlla le regole di Firestore"); });
      COLS.forEach(c => fs.onSnapshot(col(c), q => Store.emit(c, q.docs.map(d => ({ ...d.data(), id: d.id }))), e => console.warn(e)));
    },
    async setTrip(t) { await fs.setDoc(tdoc, t, { merge: true }); },
    async add(c, v) { await fs.addDoc(col(c), v); },
    async set(c, id, v) { await fs.setDoc(fs.doc(db, "trips", tripId, c, id), v); },
    async update(c, id, v) { await fs.updateDoc(fs.doc(db, "trips", tripId, c, id), v); },
    async del(c, id) { await fs.deleteDoc(fs.doc(db, "trips", tripId, c, id)); },
    async upload(data) {
      const ops = [];
      ops.push(b => b.set(tdoc, data.trip));
      COLS.forEach(c => Object.entries(data[c] || {}).forEach(([id, v]) => ops.push(b => b.set(fs.doc(db, "trips", tripId, c, id), v))));
      for (let i = 0; i < ops.length; i += 400) { const b = fs.writeBatch(db); ops.slice(i, i + 400).forEach(f => f(b)); await b.commit(); }
    }
  };
}

const errMsg = e => (String(e && (e.code || e.message)).includes("permission") ? "Permesso negato: controlla le regole di Firestore." : "Salvataggio non riuscito. Riprova.");
async function dbAdd(c, v) { try { await Store.api.add(c, { ...v, ts: Date.now(), by: S.me || "" }); } catch (e) { toast(errMsg(e)); } }
async function dbSet(c, id, v) { try { await Store.api.set(c, id, v); } catch (e) { toast(errMsg(e)); } }
async function dbUpd(c, id, v) { try { await Store.api.update(c, id, v); } catch (e) { toast(errMsg(e)); } }
async function dbDel(c, id) { try { await Store.api.del(c, id); } catch (e) { toast(errMsg(e)); } }
async function saveTrip(t) { try { await Store.api.setTrip(t); } catch (e) { toast(errMsg(e)); } }
async function savePerson(patch) {
  if (!S.me) return;
  const id = slug(S.me), cur = myPerson() || { name: S.me, emoji: "🙂", color: COLORS[0], widgets: DEFAULT_WIDGETS, pack: [], notes: "", diet: "", budget: null };
  const { id: _drop, ...rest } = cur;
  const out = { ...rest, ...patch, name: S.me };
  Object.keys(out).forEach(k => out[k] === undefined && delete out[k]);
  await dbSet("people", id, out);
}

/* =========================================================
   AVVIO
   ========================================================= */
async function boot() {
  // link di invito: #join=...
  if (location.hash.startsWith("#join=")) {
    try { const j = JSON.parse(decodeURIComponent(escape(atob(decodeURIComponent(location.hash.slice(6)))))); if (j.c && j.t) { ls.set("cloud", { cfg: j.c, trip: j.t }); toast("Ti sei unito al viaggio del gruppo"); } } catch (e) { toast("Link di invito non valido"); }
    history.replaceState(null, "", location.pathname);
  }
  S.me = ls.get("me");
  S.chat = ls.get("chat_" + slug(S.me), []);
  S.fx = ls.get("fx");
  const wx = ls.get("wx"); if (wx) S.wx = wx.data || {};

  Store.watch("trip", t => { if (t) S.trip = { ...SEED_TRIP, ...t }; render(); });
  COLS.forEach(c => Store.watch(c, rows => { S[c] = rows; if (c === "days") loadWeather(); render(); }));

  const cloud = ls.get("cloud");
  if (cloud) {
    try { Store.api = await cloudBackend(cloud.cfg, cloud.trip); S.mode = "cloud"; }
    catch (e) { console.warn(e); toast("Non riesco a collegarmi al gruppo: uso i dati di questo telefono"); }
  }
  if (!Store.api) { Store.api = localBackend(); S.mode = "local"; }
  Store.api.start();
  render();
  loadFx(); loadWeather();
  setInterval(() => { loadFx(); loadWeather(); }, 30 * 60 * 1000);
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});
}

/* =========================================================
   DATI IN DIRETTA: cambio (BCE via Frankfurter) e meteo (Open-Meteo)
   ========================================================= */
async function loadFx(force) {
  if (!force && S.fx && Date.now() - S.fx.at < 3 * 3600e3) return;
  const urls = ["https://api.frankfurter.dev/v1/latest?base=EUR&symbols=JPY", "https://api.frankfurter.app/latest?from=EUR&to=JPY"];
  for (const u of urls) {
    try { const r = await fetch(u); if (!r.ok) continue; const j = await r.json(); const v = j.rates && j.rates.JPY; if (v) { S.fx = { rate: v, date: j.date, at: Date.now() }; ls.set("fx", S.fx); render(); return; } } catch (e) {}
  }
}
let wxLoading = false;
async function loadWeather(force) {
  if (wxLoading) return;
  const cache = ls.get("wx");
  if (!force && cache && Date.now() - cache.at < 45 * 60e3 && Object.keys(cache.data || {}).length) { S.wx = cache.data; return; }
  const keys = new Set(["tokyo"]);
  S.days.forEach(d => { const c = city(d.city); if (c.key && c.lat) keys.add(c.key); });
  wxLoading = true;
  const out = {};
  await Promise.all([...keys].map(async k => {
    const c = CITY[k];
    const u = `https://api.open-meteo.com/v1/forecast?latitude=${c.lat}&longitude=${c.lon}&timezone=Asia%2FTokyo&forecast_days=16`
      + `&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m`
      + `&daily=weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,precipitation_probability_max,uv_index_max`;
    try {
      const r = await fetch(u); if (!r.ok) return; const j = await r.json();
      const daily = {}; (j.daily.time || []).forEach((t, i) => daily[t] = { code: j.daily.weather_code[i], max: j.daily.temperature_2m_max[i], min: j.daily.temperature_2m_min[i], feel: j.daily.apparent_temperature_max[i], rain: j.daily.precipitation_probability_max[i], uv: j.daily.uv_index_max[i] });
      out[k] = { now: j.current, daily };
    } catch (e) {}
  }));
  wxLoading = false;
  if (Object.keys(out).length) { S.wx = out; ls.set("wx", { at: Date.now(), data: out }); render(); }
}
function wmo(code) {
  const c = Number(code);
  if (c === 0) return ["☀️", "Sereno"]; if (c <= 2) return ["🌤️", "Poco nuvoloso"]; if (c === 3) return ["☁️", "Nuvoloso"];
  if (c === 45 || c === 48) return ["🌫️", "Nebbia"]; if (c >= 51 && c <= 57) return ["🌦️", "Pioggerella"]; if (c >= 61 && c <= 67) return ["🌧️", "Pioggia"];
  if (c >= 71 && c <= 77) return ["🌨️", "Neve"]; if (c >= 80 && c <= 82) return ["🌧️", "Rovesci"]; if (c >= 95) return ["⛈️", "Temporale"]; return ["🌡️", "—"];
}
const wxFor = (date) => { const c = city(dayInfo(date).city); return c.key && S.wx[c.key] ? S.wx[c.key].daily[date] : null; };

/* =========================================================
   GEMINI (chiave condivisa dal gruppo)
   ========================================================= */
const GEM = "https://generativelanguage.googleapis.com/v1beta/models/";
function geminiErr(status, body) {
  const msg = (body && body.error && body.error.message) || "";
  if (status === 400 && /api key/i.test(msg)) return "La chiave Gemini non è valida. Controllala nelle impostazioni del gruppo.";
  if (status === 403) return "La chiave Gemini non ha accesso a questo servizio.";
  if (status === 404) return "Il modello indicato non esiste più. Cambialo nelle impostazioni (es. gemini-flash-latest).";
  if (status === 429) return "Limite di richieste Gemini raggiunto. Riprova tra un po'.";
  return "Gemini non ha risposto (" + status + "). " + msg.slice(0, 120);
}
async function gemini({ system, contents, json = false, search = false, onText, signal }) {
  const key = (S.trip.geminiKey || "").trim();
  if (!key) throw { friendly: "Manca la chiave Gemini: aggiungila in Gruppo → ⚙︎ Impostazioni." };
  const model = (S.trip.model || "gemini-flash-latest").trim();
  const body = { contents, systemInstruction: { parts: [{ text: system }] } };
  if (json) body.generationConfig = { responseMimeType: "application/json" };
  if (search && !json) body.tools = [{ google_search: {} }];
  const stream = !!onText && !json;
  const url = GEM + encodeURIComponent(model) + (stream ? ":streamGenerateContent?alt=sse" : ":generateContent");
  const r = await fetch(url, { method: "POST", signal, headers: { "Content-Type": "application/json", "x-goog-api-key": key }, body: JSON.stringify(body) });
  if (!r.ok) {
    let b = null; try { b = await r.json(); } catch (e) {}
    if (search && r.status === 400 && !/api key/i.test((b && b.error && b.error.message) || "")) return gemini({ system, contents, json, search: false, onText, signal });
    throw { friendly: geminiErr(r.status, b) };
  }
  let text = "", sources = [];
  const take = j => {
    const c = j.candidates && j.candidates[0]; if (!c) return;
    const parts = (c.content && c.content.parts) || [];
    text += parts.map(p => p.text || "").join("");
    const g = c.groundingMetadata; if (g && g.groundingChunks) g.groundingChunks.forEach(ch => { if (ch.web && ch.web.uri && !sources.some(s => s.uri === ch.web.uri)) sources.push({ uri: ch.web.uri, title: ch.web.title || ch.web.uri }); });
  };
  if (stream && r.body && r.body.getReader) {
    const rd = r.body.getReader(), dec = new TextDecoder(); let buf = "";
    for (;;) {
      const { value, done } = await rd.read(); if (done) break;
      buf += dec.decode(value, { stream: true });
      let i; while ((i = buf.indexOf("\n")) >= 0) {
        const line = buf.slice(0, i).trim(); buf = buf.slice(i + 1);
        if (line.startsWith("data:")) { try { take(JSON.parse(line.slice(5))); onText(text); } catch (e) {} }
      }
    }
  } else take(await r.json());
  if (!text.trim()) throw { friendly: "Gemini non ha dato una risposta. Riformula la domanda." };
  return { text, sources };
}
async function fileToPart(file) {
  const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = URL.createObjectURL(file); });
  const max = 1400, sc = Math.min(1, max / Math.max(img.width, img.height));
  const cv = document.createElement("canvas"); cv.width = Math.round(img.width * sc); cv.height = Math.round(img.height * sc);
  cv.getContext("2d").drawImage(img, 0, 0, cv.width, cv.height);
  const data = cv.toDataURL("image/jpeg", 0.85).split(",")[1];
  return { inline_data: { mime_type: "image/jpeg", data } };
}
function tripContext() {
  return tripDays().map((d, i) => { const inf = dayInfo(d); return `G${i + 1} ${d} — ${inf.city || "?"}: ${inf.title || ""}${inf.sleep ? " (dorme: " + inf.sleep + ")" : ""}\n` + dayItems(d).map(x => `  ${x.time || ""} ${x.title}${x.place ? " @" + x.place : ""}`).join("\n"); }).join("\n");
}
function systemPrompt() {
  const p = myPerson();
  return `Sei l'assistente di viaggio di un gruppo di amici italiani in Giappone. Rispondi SEMPRE in italiano, pratico e conciso (max ~150 parole salvo richiesta): linee, stazioni, uscite, piatti, frasi giapponesi con romaji. Niente premesse. Se non sei sicuro di orari, prezzi o aperture dillo e suggerisci di verificare.
Foto di menù: elenca piatti con nome giapponese, traduzione, cosa sono e prezzo; segnala carne, pesce, maiale, alcol${p && p.diet ? " e tutto ciò che va contro le esigenze di chi chiede" : ""}. Cartelli e biglietti: traduci e spiega cosa fare.
Chi scrive: ${S.me || "un membro del gruppo"}${p && p.diet ? ". Esigenze alimentari: " + p.diet : ""}.
Oggi in Giappone: ${jpToday()}. Viaggio: ${S.trip.start} → ${S.trip.end}. Gruppo: ${(S.trip.members || []).join(", ") || "da definire"}.
ITINERARIO:
${tripContext()}`;
}

/* =========================================================
   FORM
   ========================================================= */
function closeModal() { $("modal").innerHTML = ""; }
function fieldH(f, v) {
  const val = v[f.k] ?? f.def ?? ""; let inp;
  if (f.type === "textarea") inp = `<textarea name="${f.k}" placeholder="${h(f.ph || "")}">${h(val)}</textarea>`;
  else if (f.type === "select") inp = `<select name="${f.k}">${f.options.map(o => { const [a, b] = Array.isArray(o) ? o : [o, o]; return `<option value="${h(a)}" ${String(a) === String(val) ? "selected" : ""}>${h(b)}</option>`; }).join("")}</select>`;
  else if (f.type === "checks") { const sel = Array.isArray(val) ? val : f.options; inp = `<div class="checks">${f.options.map(o => `<label><input type="checkbox" name="${f.k}" value="${h(o)}" ${sel.includes(o) ? "checked" : ""}>${h(o)}</label>`).join("")}</div>`; }
  else inp = `<input name="${f.k}" type="${f.type === "number" ? "text" : f.type || "text"}" ${f.type === "number" ? 'inputmode="decimal"' : ""} ${f.type === "password" ? 'autocomplete="off"' : ""} value="${h(val)}" placeholder="${h(f.ph || "")}">`;
  return `<div class="f"><label>${h(f.label)}</label>${inp}${f.help ? `<div class="tiny sub" style="margin-top:4px">${f.help}</div>` : ""}</div>`;
}
function openForm({ title, fields, values = {}, onSave, onDelete, save = "Salva", extra = "" }) {
  $("modal").innerHTML = `<div class="ov" data-x="1"><form class="sheet" id="frm"><h4>${h(title)}</h4>${fields.map(f => f.html ? f.html : f.row ? `<div class="f2">${f.row.map(x => fieldH(x, values)).join("")}</div>` : fieldH(f, values)).join("")}${extra}
  <div class="row" style="margin-top:8px"><button type="button" class="btn soft" data-x="1">Annulla</button><span style="flex:1"></span>${onDelete ? `<button type="button" class="btn soft" id="del" style="color:var(--sos)">Elimina</button>` : ""}<button class="btn solid">${h(save)}</button></div></form></div>`;
  const frm = $("frm");
  $("modal").querySelector(".ov").addEventListener("click", e => { if (e.target.dataset.x) closeModal(); });
  frm.addEventListener("submit", e => {
    e.preventDefault(); const all = fields.filter(f => !f.html).flatMap(f => f.row || [f]), out = {};
    for (const f of all) {
      if (f.type === "checks") out[f.k] = [...frm.querySelectorAll(`[name="${f.k}"]:checked`)].map(i => i.value);
      else { const v = frm.elements[f.k].value; out[f.k] = f.type === "number" ? (v === "" ? null : Number(String(v).replace(",", "."))) : v.trim(); }
      if (f.req && (out[f.k] === "" || out[f.k] == null)) { toast("Manca: " + f.label); return; }
    }
    closeModal(); onSave(out, frm);
  });
  if (onDelete) { const b = $("del"); b.onclick = () => { if (b.dataset.s) { closeModal(); onDelete(); } else { b.dataset.s = 1; b.textContent = "Sicuro? Tocca ancora"; } }; }
}

function editTrip() {
  const cloud = ls.get("cloud");
  openForm({
    title: "Impostazioni del gruppo", values: { ...S.trip, members: (S.trip.members || []).join("\n") },
    fields: [
      { k: "name", label: "Nome del viaggio", req: 1 },
      { row: [{ k: "start", label: "Arrivo in Giappone", type: "date", req: 1 }, { k: "end", label: "Partenza", type: "date", req: 1 }] },
      { k: "members", label: "Chi viene (un nome per riga)", type: "textarea", ph: "Marco\nGiulia" },
      { html: `<h5>Intelligenza artificiale (Gemini)</h5>` },
      { k: "geminiKey", label: "Chiave API Gemini, condivisa con il gruppo", type: "password", ph: "AIza…", help: `Creala gratis su <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener">Google AI Studio</a>. La usano tutti: chi ha il link del gruppo può vederla, quindi imposta un limite di spesa o resta nel livello gratuito.` },
      { k: "model", label: "Modello", ph: "gemini-flash-latest", help: "Lascia gemini-flash-latest: segue sempre l'ultimo modello Flash di Google." },
      { html: `<h5>Sincronizzazione</h5><p class="small" style="margin:0 0 10px">${S.mode === "cloud" ? "✅ Collegato al gruppo: le modifiche arrivano a tutti." : "Ora i dati sono solo su questo telefono."}</p>
        <div class="row" style="flex-wrap:wrap">${S.mode === "cloud" ? `<button type="button" class="btn sm solid" data-act="invite">Copia link di invito</button><button type="button" class="btn sm soft" data-act="unlink">Scollega questo telefono</button>` : `<button type="button" class="btn sm solid" data-act="connect">Collega il gruppo (Firebase)</button>`}</div>` }
    ],
    onSave: o => {
      if (o.end < o.start) return toast("La partenza è prima dell'arrivo");
      const members = [...new Set(o.members.split(/\n|,/).map(s => s.trim()).filter(Boolean))];
      if (S.me && !members.includes(S.me)) members.unshift(S.me);
      saveTrip({ name: o.name, start: o.start, end: o.end, members, geminiKey: o.geminiKey, model: o.model || "gemini-flash-latest" });
    }
  });
}
function parseFirebaseConfig(txt) {
  const out = {}; const re = /["']?(\w+)["']?\s*:\s*["']([^"']+)["']/g; let m;
  while ((m = re.exec(txt))) out[m[1]] = m[2];
  return out.apiKey && out.projectId ? { apiKey: out.apiKey, authDomain: out.authDomain || out.projectId + ".firebaseapp.com", projectId: out.projectId, storageBucket: out.storageBucket, messagingSenderId: out.messagingSenderId, appId: out.appId } : null;
}
function connectCloud() {
  openForm({
    title: "Collega il gruppo", save: "Collega e carica i dati",
    fields: [
      { html: `<p class="small" style="margin-top:0">Serve un progetto Firebase gratuito (una volta sola, lo crea una persona del gruppo). Le istruzioni passo passo sono nel file README del progetto su GitHub.</p>` },
      { k: "cfg", label: "Incolla qui la configurazione Firebase", type: "textarea", ph: "const firebaseConfig = {\n  apiKey: \"…\",\n  projectId: \"…\",\n  …\n};" }
    ],
    onSave: async o => {
      const cfg = parseFirebaseConfig(o.cfg); if (!cfg) return toast("Configurazione non riconosciuta: servono almeno apiKey e projectId");
      const tripId = uid();
      try {
        toast("Collego il gruppo…");
        const api = await cloudBackend(cfg, tripId);
        const local = Store.api.dump ? Store.api.dump() : seedData();
        await api.upload(local);
        ls.set("cloud", { cfg, trip: tripId }); location.reload();
      } catch (e) { console.warn(e); toast("Non riesco a scrivere su Firebase: controlla di aver creato il database e le regole"); }
    }
  });
}
function inviteLink() {
  const c = ls.get("cloud"); if (!c) return "";
  const payload = btoa(unescape(encodeURIComponent(JSON.stringify({ c: c.cfg, t: c.trip }))));
  return location.origin + location.pathname + "#join=" + encodeURIComponent(payload);
}
function editDay(d) {
  openForm({
    title: "Tappa del " + fmt(d, { day: "numeric", month: "long" }), values: dayInfo(d),
    fields: [{ k: "city", label: "Città", ph: "Tokyo, Kyoto, Osaka…", help: "Decide colore, cartello e meteo della tappa." }, { k: "title", label: "Titolo della giornata" }, { k: "sleep", label: "Si dorme a" }, { k: "move", label: "Spostamento del giorno" }, { k: "note", label: "Da sapere", type: "textarea" }],
    onSave: o => dbSet("days", d, o)
  });
}
function editItem(it = {}, date) {
  openForm({
    title: it.id ? "Modifica" : "Aggiungi al giorno", values: { date: date || it.date || S.day, ...it },
    fields: [{ k: "title", label: "Cosa", req: 1 }, { row: [{ k: "time", label: "Ora", type: "time" }, { k: "date", label: "Giorno", type: "date", req: 1 }] }, { k: "place", label: "Luogo (per Maps)" }, { k: "note", label: "Note", type: "textarea" }],
    onDelete: it.id ? () => dbDel("itin", it.id) : null,
    onSave: o => it.id ? dbUpd("itin", it.id, o) : dbAdd("itin", { ...o, done: false })
  });
}
const BT = [["volo", "✈️ Volo"], ["alloggio", "🏨 Alloggio"], ["treno", "🚄 Treno"], ["biglietto", "🎟️ Biglietto"], ["ristorante", "🍣 Ristorante"], ["altro", "📄 Altro"]];
const BI = Object.fromEntries(BT.map(([k, l]) => [k, l.split(" ")[0]]));
function editBook(b = {}) {
  const mem = S.trip.members || [];
  openForm({
    title: b.id ? "Modifica prenotazione" : "Nuova prenotazione", values: { who: mem, ...b },
    fields: [{ k: "type", label: "Tipo", type: "select", options: BT }, { k: "title", label: "Cosa", req: 1 }, { row: [{ k: "date", label: "Dal", type: "date" }, { k: "end", label: "Al", type: "date" }] }, { row: [{ k: "time", label: "Ora", type: "time" }, { k: "code", label: "Codice" }] }, { k: "addr", label: "Indirizzo" }, { k: "link", label: "Link" },
      ...(mem.length ? [{ k: "who", label: "Per chi", type: "checks", options: mem }] : []), { k: "note", label: "Note", type: "textarea" }],
    onDelete: b.id ? () => dbDel("book", b.id) : null, onSave: o => b.id ? dbUpd("book", b.id, o) : dbAdd("book", o)
  });
}
const EC = ["🍜 Cibo", "🚃 Trasporti", "🏨 Alloggio", "🎟️ Ingressi", "🛍️ Shopping", "📦 Altro"];
function editExp(e = {}) {
  const mem = S.trip.members || []; if (!mem.length) { toast("Prima scrivi chi viene nelle impostazioni"); editTrip(); return; }
  openForm({
    title: e.id ? "Modifica spesa" : "Nuova spesa", values: { cur: "JPY", paidBy: S.me && mem.includes(S.me) ? S.me : mem[0], split: mem, date: jpToday(), cat: EC[0], ...e },
    fields: [{ k: "desc", label: "Per cosa", req: 1 }, { row: [{ k: "amount", label: "Importo", type: "number", req: 1 }, { k: "cur", label: "Valuta", type: "select", options: [["JPY", "¥"], ["EUR", "€"]] }] }, { row: [{ k: "paidBy", label: "Ha pagato", type: "select", options: mem }, { k: "cat", label: "Tipo", type: "select", options: EC }] }, { k: "split", label: "Si divide tra", type: "checks", options: mem }, { k: "date", label: "Data", type: "date" }],
    onDelete: e.id ? () => dbDel("exp", e.id) : null,
    onSave: o => { if (!o.split.length) return toast("Scegli almeno una persona"); const d = { ...o, rate: e.rate || rate() }; e.id ? dbUpd("exp", e.id, d) : dbAdd("exp", d); }
  });
}
function personalize() {
  const p = myPerson() || {}; let ws = myWidgets().map(w => ({ ...w })); let color = p.color || COLORS[0], emoji = p.emoji || "🙂";
  const list = () => ws.map((w, i) => `<div class="wl"><label><input type="checkbox" data-w="${w.id}" ${w.on ? "checked" : ""}>${h(WLABEL[w.id])}</label><button type="button" class="ic" style="width:32px;height:32px" data-up="${i}" aria-label="Su">↑</button><button type="button" class="ic" style="width:32px;height:32px" data-down="${i}" aria-label="Giù">↓</button></div>`).join("");
  openForm({
    title: "La mia pagina", values: { diet: p.diet || "", budget: p.budget ?? "" },
    fields: [
      { html: `<div class="f"><label>Icona</label><div class="swatches" id="emo">${EMOJI.map(x => `<button type="button" data-emo="${x}" class="${x === emoji ? "on" : ""}" style="font-size:20px;background:#fff">${x}</button>`).join("")}</div></div>
        <div class="f"><label>Colore</label><div class="swatches" id="col">${COLORS.map(x => `<button type="button" data-col="${x}" class="${x === color ? "on" : ""}" style="background:${x}" aria-label="Colore"></button>`).join("")}</div></div>` },
      { k: "diet", label: "Allergie o cose che non mangio", ph: "es. niente maiale, allergia ai crostacei", help: "L'AI ne tiene conto quando traduce i menù per te." },
      { k: "budget", label: "Il mio budget per le spese comuni (¥)", type: "number", ph: "es. 150000" },
      { html: `<div class="f"><label>Cosa vedo nella mia pagina</label><div id="wlist">${list()}</div></div>` }
    ],
    onSave: o => savePerson({ diet: o.diet, budget: o.budget, color, emoji, widgets: ws })
  });
  const m = $("modal");
  m.addEventListener("click", e => {
    const t = e.target.closest("[data-emo],[data-col],[data-up],[data-down]"); if (!t) return;
    if (t.dataset.emo) { emoji = t.dataset.emo; m.querySelectorAll("[data-emo]").forEach(b => b.classList.toggle("on", b === t)); }
    if (t.dataset.col) { color = t.dataset.col; m.querySelectorAll("[data-col]").forEach(b => b.classList.toggle("on", b === t)); }
    if (t.dataset.up || t.dataset.down) { const i = +(t.dataset.up ?? t.dataset.down), j = t.dataset.up != null ? i - 1 : i + 1; if (j >= 0 && j < ws.length) { [ws[i], ws[j]] = [ws[j], ws[i]]; $("wlist").innerHTML = list(); } }
  });
  m.addEventListener("change", e => { const t = e.target.closest("[data-w]"); if (t) { const w = ws.find(x => x.id === t.dataset.w); if (w) w.on = t.checked; } });
}

/* =========================================================
   VISTE
   ========================================================= */
const TABS = [["me", "私", "Io"], ["line", "線", "Viaggio"], ["ai", "AI", "Chiedi"], ["grp", "皆", "Gruppo"], ["kit", "助", "Kit"]];
const VIEWS = ["me", "line", "day", "ai", "grp", "kit"];
function render() {
  const t = location.hash.slice(1); if (VIEWS.includes(t)) S.view = t;
  const days = tripDays(); if (!S.day || !days.includes(S.day)) { const td = jpToday(); S.day = days.includes(td) ? td : days[0]; }
  const p = myPerson(); document.documentElement.style.setProperty("--me", (p && p.color) || COLORS[0]);
  const active = S.view === "day" ? "line" : S.view;
  $("tabs").innerHTML = TABS.map(([k, g, l]) => `<button class="${active === k ? "on" : ""}" data-tab="${k}"><span class="g">${g}</span>${l}</button>`).join("");
  const ae = document.activeElement, keepId = ae && ae.id, keepVal = ae && "value" in ae ? ae.value : null, selS = ae && ae.selectionStart;
  const y = window.scrollY;
  $("app").innerHTML = { me: vMe, line: vLine, day: vDay, ai: vAI, grp: vGrp, kit: vKit }[S.view]();
  if (keepId) { const x = $(keepId); if (x) { if (keepVal != null && x.value !== keepVal) x.value = keepVal; x.focus(); try { if (selS != null) x.setSelectionRange(selS, selS); } catch (e) {} } }
  window.scrollTo(0, y);
  if (S.view === "ai" && S._scrollChat) { const c = $("chatend"); if (c) c.scrollIntoView(); S._scrollChat = false; }
}
function syncLine() {
  if (S.mode === "local") return `<div class="status"><span class="dot w"></span>Solo su questo telefono · <a href="#" data-act="trip">collega il gruppo</a></div>`;
  return `<div class="status"><span class="dot ${S.synced ? "ok" : "w"}"></span>${S.synced ? "Sincronizzato con il gruppo" : "Offline: le modifiche partono appena torna la rete"}</div>`;
}

/* ---------- IO: pagina personale ---------- */
function vMe() {
  if (!S.me) {
    const mem = S.trip.members || [];
    return `<div class="top"><div><h1>Ciao! Chi sei?</h1><div class="lead">Ognuno ha la sua pagina: valigia, note, spese e prenotazioni personali.</div></div></div>
    ${mem.length ? `<div class="whobtns">${mem.map(m => `<button class="btn" data-iam="${h(m)}">${h(m)}</button>`).join("")}</div>` : ""}
    <form class="addrow" id="iamform"><input id="iamname" placeholder="${mem.length ? "Non ci sei? Scrivi il tuo nome" : "Il tuo nome"}"><button class="btn solid">Sono io</button></form>`;
  }
  const p = myPerson() || {};
  const widgets = myWidgets().filter(w => w.on).map(w => ({ count: wCount, today: wToday, wx: wWx, fx: wFx, todo: wTodo, mybook: wMyBook, money: wMoney, pack: wPack, notes: wNotes }[w.id] || (() => ""))()).join("");
  return `<div class="hello"><div class="avatar">${h(p.emoji || "🙂")}</div><div><div class="small sub">${h(S.trip.name)}</div><h1>Ciao ${h(S.me)}</h1></div><button class="sq" data-act="personalize" aria-label="Personalizza">✎</button></div>
  ${syncLine()}${widgets}
  <div class="pad tiny sub" style="margin:18px 0">Non sei ${h(S.me)}? <a href="#" data-act="switchme">Cambia persona</a></div>`;
}
function W(title, right, body, opts = "") { return `<section class="w" ${opts}><div class="wh"><b>${title}</b>${right ? `<span class="r">${right}</span>` : ""}</div><div class="wb">${body}</div></section>`; }
function wCount() {
  const days = tripDays(), t = jpToday(), ph = tripPhase();
  if (ph === "during") { const i = days.indexOf(t), c = city(dayInfo(t).city); return `<section class="w"><div class="count"><div class="n">${i + 1}</div><div class="l">giorno di ${days.length}<br>${h(c.r)}</div><div class="k">${h(c.k)}</div></div></section>`; }
  if (ph === "before") { const n = Math.round((pd(days[0]) - pd(t)) / 864e5); return `<section class="w"><div class="count"><div class="n num">${n}</div><div class="l">${n === 1 ? "giorno" : "giorni"} alla partenza<br>${h(fmt(days[0], { day: "numeric", month: "long" }))}</div><div class="k">旅</div></div></section>`; }
  return "";
}
function wToday() {
  const days = tripDays(), t = jpToday(), d = days.includes(t) ? t : (tripPhase() === "before" ? days[0] : null);
  if (!d) return "";
  const its = dayItems(d), inf = dayInfo(d), now = new Date().toLocaleTimeString("it-IT", { timeZone: "Asia/Tokyo", hour: "2-digit", minute: "2-digit" });
  const next = d === t ? its.filter(x => !x.done && (x.time || "99") >= now.slice(0, 5)) : its;
  return W(d === t ? "Oggi" : "Primo giorno", h(fmt(d)), `<div class="small" style="font-weight:700;margin-bottom:4px">${h(inf.title || "")}</div>${next.slice(0, 4).map(x => `<div class="mini"><span class="h num">${h(x.time || "—")}</span><span>${h(x.title)}</span></div>`).join("") || '<div class="sub small">Niente altro in programma.</div>'}
  <div style="margin-top:10px"><button class="btn sm soft" data-open="${d}">Apri la giornata</button></div>`);
}
function wWx() {
  const days = tripDays(), t = jpToday(), ph = tripPhase();
  const cur = ph === "during" ? city(dayInfo(t).city) : city(dayInfo(days[0]).city);
  const k = cur.key && S.wx[cur.key] ? cur.key : (S.wx.tokyo ? "tokyo" : null);
  if (!k) return W("Meteo", "", '<div class="sub small">Carico il meteo…</div>');
  const w = S.wx[k], n = w.now || {}, [e, lab] = wmo(n.weather_code);
  // giorni del viaggio già coperti dalle previsioni (fino a 16 giorni)
  const trip = days.map(d => ({ d, w: wxFor(d), c: city(dayInfo(d).city) })).filter(x => x.w);
  const nextDays = Object.entries(w.daily).slice(0, 6);
  const cards = trip.length
    ? trip.map(x => { const [ee] = wmo(x.w.code); return `<div class="wx-d trip" style="--c:var(${x.c.c})">${h(fmt(x.d, { weekday: "short", day: "numeric" }))}<span class="e">${ee}</span><b class="num">${Math.round(x.w.max)}°</b>${Math.round(x.w.min)}° · ${x.w.rain ?? 0}%<br>${h(x.c.r)}</div>`; }).join("")
    : nextDays.map(([d, x]) => { const [ee] = wmo(x.code); return `<div class="wx-d">${h(fmt(d, { weekday: "short", day: "numeric" }))}<span class="e">${ee}</span><b class="num">${Math.round(x.max)}°</b>${Math.round(x.min)}° · ${x.rain ?? 0}%</div>`; }).join("");
  const hotDay = trip.find(x => x.w.feel >= 35);
  return W("Meteo", `${h(CITY[k].r)} adesso`, `<div class="wx-now"><span class="e">${e}</span><span class="t num">${Math.round(n.temperature_2m)}°</span><div class="small"><b>${h(lab)}</b><br>percepita ${Math.round(n.apparent_temperature)}° · umidità ${Math.round(n.relative_humidity_2m)}%</div></div>
  ${hotDay ? `<div style="margin-top:8px"><span class="hot">🥵 ${h(fmt(hotDay.d))}: percepita ${Math.round(hotDay.w.feel)}°. Programmate le visite all'aperto la mattina.</span></div>` : ""}
  <div class="wx-days">${cards}</div>
  <div class="tiny sub" style="margin-top:8px">${trip.length ? "Previsioni per le vostre tappe." : `Le previsioni per le vostre tappe compaiono qui da 16 giorni prima della partenza.`} Fonte: Open-Meteo.</div>`);
}
function wFx() {
  const r = rate();
  return W("Cambio", S.fx ? `BCE · ${h(fmt(S.fx.date, { day: "numeric", month: "short" }))}` : "valore indicativo", `<div class="fxrow"><span class="big num">1 € = ${r.toLocaleString("it-IT", { maximumFractionDigits: 2 })} ¥</span></div>
  <div class="fxin"><label><span>¥</span><input id="wY" inputmode="decimal" placeholder="1.000"></label><label><span>€</span><input id="wE" inputmode="decimal" placeholder="${(1000 / r).toFixed(2).replace(".", ",")}"></label></div>
  <div class="tiny sub" style="margin-top:6px">¥1.000 ≈ ${eur(1000 / r)} · ¥10.000 ≈ ${eur(10000 / r)}</div>`);
}
function wTodo() {
  const b = S.check.filter(c => c.cat === "📅 Da prenotare" && !c.done).sort((a, b) => (a.order || 0) - (b.order || 0));
  if (!b.length) return "";
  return W("Da prenotare", `${b.length} cose`, `<div class="todo">${b.slice(0, 3).map(c => `<div class="it"><button class="cb" data-act="togglecheck" data-id="${c.id}" aria-label="Fatto"></button><div class="tx">${h(c.text)}${c.when ? `<span class="when">${h(c.when)}</span>` : ""}</div></div>`).join("")}</div>
  ${b.length > 3 ? `<button class="btn sm soft" style="margin-top:8px" data-go="grp:check">Vedi tutte</button>` : ""}`);
}
function wMyBook() {
  const t = jpToday();
  const mine = S.book.filter(b => !Array.isArray(b.who) || !b.who.length || b.who.includes(S.me)).filter(b => !b.date || (b.end || b.date) >= t).sort((a, b) => ((a.date || "9") + (a.time || "")).localeCompare((b.date || "9") + (b.time || "")));
  return W("Le mie prenotazioni", mine.length ? mine.length : "", mine.length ? mine.slice(0, 3).map(b => `<div class="mini" style="grid-template-columns:30px 1fr auto"><span>${BI[b.type] || "📄"}</span><span><b>${h(b.title)}</b><br><span class="tiny sub">${b.date ? h(fmt(b.date)) : "data da definire"}</span></span>${b.code ? `<button class="btn sm soft" data-copy="${h(b.code)}">${h(b.code)}</button>` : ""}</div>`).join("") + `<button class="btn sm soft" style="margin-top:8px" data-go="grp:book">Tutte le prenotazioni</button>`
    : `<div class="sub small">Nessuna prenotazione a tuo nome.</div><button class="btn sm soft" style="margin-top:8px" data-act="addbook">＋ Aggiungi</button>`);
}
function wMoney() {
  const me = S.me; let paid = 0, share = 0;
  S.exp.forEach(e => { const a = e.cur === "EUR" ? (+e.amount || 0) * (e.rate || rate()) : (+e.amount || 0); const sp = e.split && e.split.length ? e.split : (S.trip.members || []); if (e.paidBy === me) paid += a; if (sp.includes(me)) share += a / sp.length; });
  const bal = paid - share, p = myPerson() || {}, bud = +p.budget || 0;
  return W("Le mie spese", "", `<div class="row" style="justify-content:space-between"><div><div class="tiny sub">La mia quota</div><div class="big num">${yen(share)}</div><div class="tiny sub num">${eur(share / rate())}</div></div>
  <div style="text-align:right"><div class="tiny sub">${bal >= 0 ? "Devo ricevere" : "Devo dare"}</div><div class="${bal >= 0 ? "pos" : "neg"} num" style="font-size:20px">${yen(Math.abs(bal))}</div></div></div>
  ${bud ? `<div class="bar"><i style="width:${Math.min(100, share / bud * 100)}%"></i></div><div class="tiny sub" style="margin-top:4px">${Math.round(share / bud * 100)}% del mio budget di ${yen(bud)}</div>` : `<div class="tiny sub" style="margin-top:6px"><a href="#" data-act="personalize">Imposta un budget</a> per tenerlo d'occhio.</div>`}
  <button class="btn sm soft" style="margin-top:10px" data-act="addexp">＋ Spesa</button>`);
}
function wPack() {
  const p = myPerson() || {}, list = Array.isArray(p.pack) ? p.pack : [];
  const dn = list.filter(x => x.d).length;
  return W("La mia valigia", list.length ? `${dn}/${list.length}` : "", `${list.length ? `<div class="todo">${list.map((x, i) => `<div class="it ${x.d ? "done" : ""}"><button class="cb ${x.d ? "on" : ""}" data-pack="${i}">${x.d ? "✓" : ""}</button><div class="tx">${h(x.t)}</div><button class="ic" style="width:28px;height:28px;border:0" data-unpack="${i}" aria-label="Elimina">✕</button></div>`).join("")}</div>` : `<div class="sub small">Solo tua: gli altri non la vedono nella loro pagina.</div>`}
  <form class="addrow" id="packform"><input id="packin" placeholder="es. caricatore, crema solare"><button class="btn solid">＋</button></form>`);
}
function wNotes() {
  const p = myPerson() || {};
  return W("Le mie note", "", `<textarea class="notes" id="mynotes" placeholder="Indirizzi, regali da comprare, cose da ricordare…">${h(p.notes || "")}</textarea><div class="tiny sub">Si salvano da sole.</div>`);
}

/* ---------- VIAGGIO: la linea ---------- */
function vLine() {
  const days = tripDays(), td = jpToday(), T = S.trip; let prev = null;
  const stops = days.map((d, i) => {
    const inf = dayInfo(d), c = city(inf.city), n = String(i + 1).padStart(2, "0"), its = dayItems(d), w = wxFor(d);
    const tr = prev && prev !== c.r && inf.move ? `<div class="transfer"><span class="x">乗換</span><span class="l">${h(inf.move)}</span></div>` : ""; prev = c.r;
    return `${tr}<button class="stop ${i === 0 ? "first" : ""} ${i === days.length - 1 ? "last" : ""} ${d === td ? "today" : ""}" style="--c:var(${c.c})" data-open="${d}">
      <span class="code"><b>${c.code}</b><span>${n}</span></span>
      <span class="info"><span class="d">${h(fmt(d))} · ${h(c.r)}${w ? ` · ${wmo(w.code)[0]} ${Math.round(w.max)}°` : ""}</span><span class="t">${h(inf.title || "Giornata libera")}</span>
      <span class="meta">${its.length ? h(its.slice(0, 3).map(x => x.title).join(" · ")) : "Tocca per pianificare"}</span></span></button>`;
  }).join("");
  const nights = {}; days.slice(0, -1).forEach(d => { const c = city(dayInfo(d).city).r; nights[c] = (nights[c] || 0) + 1; });
  return `<div class="top"><div><h1>${h(T.name)}</h1><div class="lead num">${h(fmt(T.start, { day: "numeric", month: "long" }))} – ${h(fmt(T.end, { day: "numeric", month: "long", year: "numeric" }))} · ${days.length} giorni</div></div><button class="sq" data-act="trip" aria-label="Impostazioni">⚙︎</button></div>
  ${syncLine()}
  <div class="pad" style="margin-top:12px;display:flex;flex-wrap:wrap;gap:6px">${Object.entries(nights).map(([c, n]) => `<span class="fact" style="border-left:5px solid var(${city(c).c})">${h(c)} · ${n} nott${n > 1 ? "i" : "e"}</span>`).join("")}</div>
  <div class="line" style="margin-top:14px">${stops || '<div class="empty">Imposta le date del viaggio.</div>'}</div>`;
}

/* ---------- GIORNO ---------- */
function vDay() {
  const days = tripDays(), d = S.day; if (!d) return '<div class="empty">Imposta le date del viaggio.</div>';
  const i = days.indexOf(d), inf = dayInfo(d), c = city(inf.city), its = dayItems(d), pv = days[i - 1], nx = days[i + 1], w = wxFor(d);
  const lab = x => { const ii = dayInfo(x); return ii.title || city(ii.city).r; };
  const r = S.replan && S.replan.date === d ? S.replan : null;
  return `<div class="sign" style="--c:var(${c.c})">
    <div class="main"><div class="badge" style="--c:var(${c.c})"><b>${c.code}</b><span>${String(i + 1).padStart(2, "0")}</span></div>
      <div><div class="kanji">${h(c.k)}</div><div class="romaji">${h(c.r)}</div></div>
      ${w ? `<div class="wxs"><span class="e">${wmo(w.code)[0]}</span><br><b class="num">${Math.round(w.max)}° / ${Math.round(w.min)}°</b><br>pioggia ${w.rain ?? 0}%</div>` : ""}</div>
    <div class="nav"><button data-day="${pv || ""}" ${pv ? "" : "disabled"} aria-label="Giorno precedente">‹ <span>${pv ? h(lab(pv)) : ""}</span></button><span class="mid">${i + 1} / ${days.length}</span><button class="nx" data-day="${nx || ""}" ${nx ? "" : "disabled"} aria-label="Giorno successivo"><span>${nx ? h(lab(nx)) : ""}</span> ›</button></div></div>
  <div class="dayhead"><div class="sub small">${h(fmt(d, { weekday: "long", day: "numeric", month: "long" }))}</div><h2>${h(inf.title || "Giornata da pianificare")}</h2>
    <div class="facts">${inf.sleep ? `<span class="fact">🛏 ${h(inf.sleep)}</span>` : ""}${inf.move ? `<span class="fact">🚄 ${h(inf.move)}</span>` : ""}${w && w.feel >= 35 ? `<span class="fact hot">🥵 percepita ${Math.round(w.feel)}°</span>` : ""}${w && w.uv >= 8 ? `<span class="fact">UV ${Math.round(w.uv)}</span>` : ""}<button class="fact" data-act="editday" data-date="${d}">✎ Modifica tappa</button></div></div>
  ${inf.note ? `<div class="note">${h(inf.note)}</div>` : ""}
  <div class="tl" style="--c:var(${c.c})">${its.length ? its.map(e => `<div class="ev ${e.done ? "done" : ""}"><div class="h num">${h(e.time || "—")}</div>
    <div data-act="edititem" data-id="${e.id}" style="cursor:pointer"><div class="what">${h(e.title)}</div>${e.note ? `<div class="why">${h(e.note)}</div>` : ""}</div>
    <div class="acts">${e.place ? `<a class="ic" href="${route(e.place)}" target="_blank" rel="noopener" aria-label="Come arrivare">↗</a>` : ""}<button class="ic ${e.done ? "on" : ""}" data-act="toggleitem" data-id="${e.id}" aria-label="Fatto">✓</button></div></div>`).join("") : '<div class="empty">Niente in programma per ora.</div>'}</div>
  <div class="btns"><button class="btn wide" data-act="additem" data-date="${d}">＋ Aggiungi</button><button class="btn solid wide" data-act="replan">Cambia con l'AI</button></div>
  ${r ? replanBox(r) : ""}
  <p class="tiny sub pad" style="margin-top:14px">↗ apre il percorso con i mezzi in Google Maps. ✓ segna come fatto per tutti.</p>`;
}
function replanBox(r) {
  return `<div class="aibox"><div class="row"><span class="aim">AI</span><b>Cosa cambiamo?</b></div>
  <textarea id="rpq" placeholder="es. piove tutto il giorno · ritmo più lento · aggiungi un onsen">${h(r.q || "")}</textarea>
  <div class="chips" style="margin:0 0 10px">${["Piove tutto il giorno", "Ritmo più lento", "Più cibo di strada", "Fa troppo caldo"].map(x => `<button class="chip" data-rpq="${h(x)}">${h(x)}</button>`).join("")}</div>
  <div class="row"><button class="btn soft" data-act="rpclose">Chiudi</button><span style="flex:1"></span><button class="btn solid" data-act="rpgo" ${r.busy ? "disabled" : ""}>${r.busy ? '<span class="typing">Ci penso</span>' : "Proponi"}</button></div>
  ${r.err ? `<p class="small" style="color:var(--sos)">${h(r.err)}</p>` : ""}
  ${r.items ? `<div class="prev"><div class="small sub" style="margin:6px 0">Proposta (sostituisce il programma del giorno):</div>${r.items.map(x => `<div class="ev"><div class="h num">${h(x.time || "—")}</div><div><div class="what">${h(x.title)}</div>${x.note ? `<div class="why">${h(x.note)}</div>` : ""}</div><div></div></div>`).join("")}
  <div class="row" style="margin-top:8px"><button class="btn soft" data-act="rpgo">Un'altra proposta</button><span style="flex:1"></span><button class="btn solid" data-act="rpapply">Usa questa</button></div></div>` : ""}</div>`;
}
async function doReplan() {
  const r = S.replan, d = r.date, inf = dayInfo(d), q = ($("rpq") || {}).value || r.q || "";
  r.q = q; r.busy = true; r.err = null; render();
  const w = wxFor(d);
  const cur = dayItems(d).map(x => ({ time: x.time || "", title: x.title, place: x.place || "", note: x.note || "" }));
  const prompt = `Ripianifica UNA giornata di un viaggio di gruppo in Giappone (agosto: caldo e umido, tifoni possibili).
Giorno: ${d}, città: ${inf.city || "?"}, titolo: ${inf.title || ""}, si dorme a: ${inf.sleep || "?"}, spostamenti: ${inf.move || "nessuno"}.
${w ? `Meteo previsto: ${wmo(w.code)[1]}, max ${Math.round(w.max)}°, percepita ${Math.round(w.feel)}°, pioggia ${w.rain}%.` : ""}
Programma attuale: ${JSON.stringify(cur)}
Richiesta del gruppo: "${q || "migliora il programma"}"
Altri giorni (evita doppioni):
${tripContext().slice(0, 4000)}
Regole: posti reali e raggiungibili, orari realistici, all'aperto presto la mattina e pause al fresco nel primo pomeriggio. Note brevi e pratiche in italiano.
Rispondi SOLO con un array JSON di 4-7 oggetti {"time":"HH:MM","title":"...","place":"nome cercabile su Google Maps, città","note":"..."}.`;
  try {
    const { text } = await gemini({ system: "Sei un esperto organizzatore di viaggi in Giappone. Rispondi solo con JSON valido.", contents: [{ role: "user", parts: [{ text: prompt }] }], json: true });
    let arr = JSON.parse(text.replace(/^```(json)?|```$/g, "").trim()); if (!Array.isArray(arr)) arr = arr.items || arr.plan || [];
    r.items = arr.slice(0, 9).map(x => ({ time: String(x.time || "").slice(0, 5), title: String(x.title || "").slice(0, 120), place: String(x.place || "").slice(0, 160), note: String(x.note || "").slice(0, 300) })).filter(x => x.title);
    if (!r.items.length) throw { friendly: "Nessuna proposta valida. Riprova." };
  } catch (e) { r.err = (e && e.friendly) || "Non sono riuscito a fare una proposta. Riprova."; }
  r.busy = false; render();
}
async function applyReplan() {
  const { date, items } = S.replan; S.replan = null; render();
  for (const x of dayItems(date)) await dbDel("itin", x.id);
  for (const x of items) await dbAdd("itin", { ...x, date, done: false });
  toast("Programma aggiornato per tutti");
}

/* ---------- CHIEDI (Gemini) ---------- */
const SUGG = ["📷 Traduci un menù o un cartello", "Come andiamo da Shinjuku ad Hakone?", "Cosa ordino in un izakaya?", "Dove mangiamo stasera vicino all'hotel?", "Cosa facciamo se arriva un tifone?", "Il JR Pass ci conviene con questo itinerario?"];
let aiCtl = null, pendingImg = null;
function vAI() {
  const hasKey = !!(S.trip.geminiKey || "").trim();
  return `<div class="top"><div><h1>Chiedi</h1><div class="lead">Conosce il vostro itinerario e ${myPerson() && myPerson().diet ? "le tue esigenze alimentari" : "il gruppo"}. Può cercare sul web orari e aperture.</div></div>${S.chat.length ? `<button class="sq" data-act="clearchat" aria-label="Nuova conversazione">⟲</button>` : ""}</div>
  <div class="chat">${!hasKey ? `<div class="msg a">Per usare l'AI serve una chiave Gemini (gratuita). Chi organizza la crea su Google AI Studio e la incolla in Gruppo → ⚙︎ Impostazioni: da lì funziona per tutti.\n\n<button class="btn sm solid" data-act="trip">Apri impostazioni</button></div>` : ""}
  ${hasKey && !S.chat.length ? `<div class="msg a">Posso tradurre foto di menù e cartelli, spiegarvi come muovervi, consigliare cosa mangiare o cambiare il piano di un giorno.</div><div class="chips">${SUGG.map(s => `<button class="chip" data-sugg="${h(s)}">${h(s)}</button>`).join("")}</div>` : ""}
  ${S.chat.map(m => `<div class="msg ${m.role === "user" ? "u" : "a"}">${m.img ? `<div class="tiny" style="opacity:.8">📷 foto inviata</div>` : ""}${h(m.text)}${m.sources && m.sources.length ? `<span class="src">Fonti: ${m.sources.slice(0, 4).map(s => `<a href="${h(s.uri)}" target="_blank" rel="noopener">${h(s.title)}</a>`).join(" · ")}</span>` : ""}</div>`).join("")}
  ${S.aiBusy ? `<div class="msg a" id="live"><span class="typing">${pendingImg ? "Leggo la foto" : "Ci penso"}</span></div>` : ""}
  <div id="chatend"></div></div>
  ${hasKey ? `<div class="composer"><form id="ask"><label class="ic" style="flex:none;height:44px;width:44px" aria-label="Allega foto">📷<input type="file" accept="image/*" id="pic" hidden></label>
  <textarea id="q" rows="1" placeholder="${pendingImg ? "Foto pronta: cosa vuoi sapere?" : "Scrivi una domanda…"}"></textarea>
  ${S.aiBusy ? `<button type="button" class="btn solid" data-act="stop">Stop</button>` : `<button class="btn solid">Invia</button>`}</form></div>` : ""}`;
}
async function ask(text) {
  if (S.aiBusy) return;
  const img = pendingImg; if (!text && img) text = "Traduci e spiegami questa foto."; if (!text) return;
  S.chat.push({ role: "user", text, img: !!img }); S.aiBusy = true; S._scrollChat = true; render();
  aiCtl = new AbortController();
  const hist = S.chat.slice(-12).map(m => ({ role: m.role === "user" ? "user" : "model", parts: [{ text: m.text }] }));
  if (img) { try { hist[hist.length - 1].parts.push(await fileToPart(img)); } catch (e) { toast("Non riesco a leggere la foto"); } }
  try {
    const { text: ans, sources } = await gemini({ system: systemPrompt(), contents: hist, search: !img, signal: aiCtl.signal, onText: t => { const el = $("live"); if (el) { el.textContent = t; el.scrollIntoView({ block: "end" }); } } });
    S.chat.push({ role: "model", text: ans, sources });
  } catch (e) {
    if (e && e.name === "AbortError") S.chat.push({ role: "model", text: ($("live") || {}).textContent || "Interrotto." });
    else S.chat.push({ role: "model", text: (e && e.friendly) || "Connessione assente o errore. Riprova." });
  }
  pendingImg = null; S.aiBusy = false; S._scrollChat = true; ls.set("chat_" + slug(S.me), S.chat.slice(-30)); render();
}

/* ---------- GRUPPO ---------- */
function vGrp() {
  return `<div class="top"><div><h1>Gruppo</h1><div class="lead">${(S.trip.members || []).length ? h(S.trip.members.join(", ")) : "Prenotazioni, spese e cose da fare di tutti."}</div></div><button class="sq" data-act="trip" aria-label="Impostazioni">⚙︎</button></div>
  ${syncLine()}
  <div class="seg">${[["book", "Prenotazioni"], ["exp", "Spese"], ["check", "Da fare"]].map(([k, l]) => `<button class="${S.grp === k ? "on" : ""}" data-grp="${k}">${l}</button>`).join("")}</div>
  ${S.grp === "book" ? gBook() : S.grp === "exp" ? gExp() : gCheck()}`;
}
function gBook() {
  const list = [...S.book].sort((a, b) => ((a.date || "9") + (a.time || "")).localeCompare((b.date || "9") + (b.time || "")));
  return `<div class="pad" style="margin-top:12px"><button class="btn solid" data-act="addbook">＋ Prenotazione</button></div>
  ${list.length ? list.map(b => `<div class="card bk"><div class="e">${BI[b.type] || "📄"}</div><div style="flex:1;min-width:0">
    <div class="row" style="align-items:flex-start"><b style="flex:1">${h(b.title)}</b><button class="ic" style="width:32px;height:32px" data-act="editbook" data-id="${b.id}" aria-label="Modifica">✎</button></div>
    <div class="small sub num">${b.date ? h(fmt(b.date)) + (b.time ? " · " + h(b.time) : "") + (b.end && b.end !== b.date ? " → " + h(fmt(b.end)) : "") : "Data da definire"}${Array.isArray(b.who) && b.who.length && b.who.length < (S.trip.members || []).length ? " · " + h(b.who.join(", ")) : ""}</div>
    ${b.code ? `<div class="row" style="margin-top:6px"><span class="pnr">${h(b.code)}</span><button class="btn sm soft" data-copy="${h(b.code)}">Copia</button></div>` : ""}
    ${b.note ? `<div class="small" style="margin-top:6px">${h(b.note)}</div>` : ""}
    <div class="row" style="margin-top:8px;flex-wrap:wrap">${b.addr ? `<a class="btn sm soft" href="${route(b.addr)}" target="_blank" rel="noopener">↗ Portami qui</a><button class="btn sm soft" data-show="${h(b.addr)}">Mostra al taxi</button>` : ""}${b.link ? `<a class="btn sm soft" href="${h(safeUrl(b.link))}" target="_blank" rel="noopener">Apri</a>` : ""}</div>
  </div></div>`).join("") : `<div class="empty">Voli, hotel, treni e biglietti: aggiungili qui e ognuno avrà codici e indirizzi a portata di mano.</div>`}
  <p class="tiny sub pad">Non salvare numeri di passaporto o di carte: i dati sono visibili a chi ha il link del gruppo.</p>`;
}
function balances() {
  const mem = S.trip.members || [], bal = {}; mem.forEach(m => bal[m] = 0); let tot = 0;
  S.exp.forEach(e => { const a = e.cur === "EUR" ? (+e.amount || 0) * (e.rate || rate()) : (+e.amount || 0); tot += a; const sp = e.split && e.split.length ? e.split : mem; if (!sp.length) return; bal[e.paidBy] = (bal[e.paidBy] || 0) + a; sp.forEach(p => bal[p] = (bal[p] || 0) - a / sp.length); });
  const cr = [], de = []; Object.entries(bal).forEach(([k, v]) => { if (v > .5) cr.push([k, v]); else if (v < -.5) de.push([k, -v]); });
  cr.sort((a, b) => b[1] - a[1]); de.sort((a, b) => b[1] - a[1]); const tr = []; let i = 0, j = 0;
  while (i < de.length && j < cr.length) { const x = Math.min(de[i][1], cr[j][1]); tr.push([de[i][0], cr[j][0], x]); de[i][1] -= x; cr[j][1] -= x; if (de[i][1] < .5) i++; if (cr[j][1] < .5) j++; }
  return { tot, tr };
}
function gExp() {
  const mem = S.trip.members || [], { tot, tr } = balances();
  const list = [...S.exp].sort((a, b) => (b.date || "").localeCompare(a.date || "") || (b.ts || 0) - (a.ts || 0));
  return `${mem.length ? "" : `<div class="note">Scrivi prima chi viene (⚙︎ in alto), poi segnate qui le spese comuni.</div>`}
  <div class="card"><div class="small sub">Speso insieme finora</div><div class="big num">${yen(tot)}</div><div class="small sub num">${eur(tot / rate())}${mem.length && tot ? " · " + yen(tot / mem.length) + " a testa" : ""}</div></div>
  ${tr.length ? `<div class="card"><b>Per pareggiare</b>${tr.map(([a, b, x]) => `<div class="bal"><span>${h(a)} dà a ${h(b)}</span><span class="neg num">${yen(x)} <span class="tiny sub">${eur(x / rate())}</span></span></div>`).join("")}</div>` : tot ? `<div class="card"><b>Siete pari.</b></div>` : ""}
  <div class="pad"><button class="btn solid" data-act="addexp">＋ Spesa</button></div>
  ${list.map(e => `<div class="card" data-act="editexp" data-id="${e.id}" style="cursor:pointer;display:flex;gap:10px"><div style="flex:1"><b>${h(e.desc)}</b><div class="tiny sub">${h(fmt(e.date))} · ha pagato ${h(e.paidBy)}</div></div><b class="num">${e.cur === "EUR" ? eur(e.amount) : yen(e.amount)}</b></div>`).join("")}`;
}
function gCheck() {
  const cats = [...new Set(S.check.map(c => c.cat || "Altro"))].sort((a, b) => a === "📅 Da prenotare" ? -1 : b === "📅 Da prenotare" ? 1 : a.localeCompare(b));
  return `${cats.map(cat => { const its = S.check.filter(c => (c.cat || "Altro") === cat).sort((a, b) => (a.order ?? a.ts ?? 0) - (b.order ?? b.ts ?? 0)); const dn = its.filter(x => x.done).length;
    return `<div class="sec"><h3>${h(cat)}</h3><span class="r tiny sub">${dn}/${its.length}</span></div><div class="todo">${its.map(c => `<div class="it ${c.done ? "done" : ""}"><button class="cb ${c.done ? "on" : ""}" data-act="togglecheck" data-id="${c.id}" aria-label="Fatto">${c.done ? "✓" : ""}</button><div class="tx">${h(c.text)}${c.when && !c.done ? `<span class="when">${h(c.when)}</span>` : ""}</div><button class="ic" style="width:30px;height:30px;border:0" data-act="delcheck" data-id="${c.id}" aria-label="Elimina">✕</button></div>`).join("")}</div>`; }).join("") || '<div class="empty">Niente da fare, per ora.</div>'}
  <form class="addrow" id="addcheck"><input id="cktext" placeholder="Aggiungi una cosa da fare per il gruppo"><button class="btn solid">＋</button></form>`;
}

/* ---------- KIT ---------- */
const PH = {
  "Le indispensabili": [["すみません", "sumimasen", "Mi scusi / Permesso / Grazie (va bene quasi sempre)"], ["ありがとうございます", "arigatō gozaimasu", "Grazie mille"], ["これをください", "kore o kudasai", "Vorrei questo (indicando)"], ["いくらですか？", "ikura desu ka?", "Quanto costa?"], ["〜はどこですか？", "… wa doko desu ka?", "Dov'è …?"], ["トイレはどこですか？", "toire wa doko desu ka?", "Dov'è il bagno?"], ["英語を話せますか？", "eigo o hanasemasu ka?", "Parla inglese?"], ["大丈夫です", "daijōbu desu", "Va bene così / No grazie"]],
  "Al ristorante": [["四人です", "yonin desu", "Siamo in 4"], ["五人です", "gonin desu", "Siamo in 5"], ["六人です", "rokunin desu", "Siamo in 6"], ["英語のメニューはありますか？", "eigo no menyū wa arimasu ka?", "Avete un menù in inglese?"], ["おすすめは何ですか？", "osusume wa nan desu ka?", "Cosa mi consiglia?"], ["お水をください", "omizu o kudasai", "Dell'acqua, per favore"], ["お会計お願いします", "okaikei onegaishimasu", "Il conto, per favore"], ["別々に払えますか？", "betsubetsu ni haraemasu ka?", "Possiamo pagare separatamente?"], ["カードで払えますか？", "kādo de haraemasu ka?", "Posso pagare con carta?"], ["ごちそうさまでした", "gochisōsama deshita", "Grazie, era buonissimo (uscendo)"]],
  "In giro": [["この電車は〜に行きますか？", "kono densha wa … ni ikimasu ka?", "Questo treno va a …?"], ["ここに行きたいです", "koko ni ikitai desu", "Voglio andare qui (mostrando la mappa)"], ["この住所までお願いします", "kono jūsho made onegaishimasu", "A questo indirizzo, per favore (taxi)"], ["荷物を預かってもらえますか？", "nimotsu o azukatte moraemasu ka?", "Potete tenerci i bagagli?"], ["免税できますか？", "menzei dekimasu ka?", "Si può fare il tax free?"], ["袋はいりません", "fukuro wa irimasen", "Non serve la busta"]],
  "Problemi": [["助けて！", "tasukete!", "Aiuto!"], ["救急車を呼んでください", "kyūkyūsha o yonde kudasai", "Chiamate un'ambulanza"], ["気分が悪いです", "kibun ga warui desu", "Mi sento male"], ["道に迷いました", "michi ni mayoimashita", "Mi sono perso"], ["財布をなくしました", "saifu o nakushimashita", "Ho perso il portafoglio"], ["アレルギーがあります", "arerugī ga arimasu", "Ho un'allergia"]]
};
function vKit() {
  const r = rate(), q = S.phq.trim().toLowerCase();
  const phr = Object.entries(PH).map(([cat, l]) => { const f = l.filter(p => !q || p.join(" ").toLowerCase().includes(q)); if (!f.length) return "";
    return `<div class="phcat">${h(cat)}</div>${f.map(([ja, ro, it]) => `<div class="ph" data-show="${h(ja)}" data-sub="${h(it)}"><div style="flex:1"><div class="ja">${h(ja)}</div><div class="ro">${h(ro)}</div><div class="itx">${h(it)}</div></div><span class="tiny sub">Mostra</span></div>`).join("")}`; }).join("");
  return `<div class="top"><div><h1>Kit</h1><div class="lead">Cambio, frasi ed emergenze. Funziona anche senza rete.</div></div></div>
  <div class="sec" style="margin-top:6px"><h3>Cambio</h3><span class="r tiny sub">${S.fx ? `1 € = ${r.toLocaleString("it-IT", { maximumFractionDigits: 2 })} ¥ · BCE ${h(fmt(S.fx.date, { day: "numeric", month: "short" }))}` : "valore indicativo"}</span></div>
  <div class="conv"><label><span class="cur">¥</span><input id="cvY" inputmode="decimal" placeholder="1.000"></label><label><span class="cur">€</span><input id="cvE" inputmode="decimal" placeholder="${(1000 / r).toFixed(2).replace(".", ",")}"></label></div>
  <div class="qk">${[500, 1000, 3000, 5000, 10000, 20000, 50000, 100000].map(v => `<button data-yen="${v}"><b>${yen(v)}</b><br><span class="sub num">${eur(v / r)}</span></button>`).join("")}</div>
  <div class="sec"><h3>Frasi</h3><span class="r tiny sub">tocca per mostrarla grande</span></div>
  <input class="search" id="phq" placeholder="Cerca: conto, bagno, treno…" value="${h(S.phq)}">
  <div class="phs">${phr || `<div class="empty">Nessuna frase trovata. Chiedi all'AI!</div>`}</div>
  <div class="sec"><h3>Emergenze</h3></div>
  <div class="sos"><a href="tel:110"><b>110</b><span>Polizia</span></a><a href="tel:119"><b>119</b><span>Ambulanza e pompieri</span></a></div>
  <div class="rules" style="margin-top:10px">
    <p><b>Japan Visitor Hotline</b> · <a href="tel:+815038162787">050-3816-2787</a> · 24 ore, in inglese, per turisti in difficoltà.</p>
    <p><b>Ambasciata d'Italia</b> · <a href="tel:+81334535291">+81 3 3453 5291</a> · 2-5-4 Mita, Minato-ku, Tokyo · <a href="${maps("Embassy of Italy Tokyo 2-5-4 Mita")}" target="_blank" rel="noopener">mappa</a></p>
    <p><b>Terremoto</b> · sotto un tavolo, lontano dai vetri. Installate l'app <b>Safety tips</b> per gli allarmi in inglese.</p>
    <p><b>Tifone</b> · treni e voli si fermano anche per un giorno intero: restate in hotel e seguite JR e la compagnia aerea.</p>
  </div>
  <div class="sec"><h3>Regole d'oro</h3></div>
  <div class="rules">
    <p><b>Caldo</b> · fuori la mattina presto, al chiuso dalle 12 alle 16. Acqua e sali minerali dai konbini.</p>
    <p><b>Suica sul telefono</b> · metro, treni, bus, konbini e distributori. Si ricarica dal Wallet.</p>
    <p><b>Contanti</b> · alcuni ristorantini e templi li vogliono. Prelievi ai bancomat 7-Eleven.</p>
    <p><b>Tax free</b> · dal 1° novembre 2026 si paga il prezzo pieno e il rimborso si chiede alla dogana in aeroporto prima del check-in, con merce e ricevute.</p>
    <p><b>Valigie</b> · spedirle tra hotel con il takkyubin (1–2 giorni) vi salva sugli Shinkansen.</p>
    <p><b>Galateo</b> · niente mance, silenzio al telefono in treno, rifiuti in borsa (i cestini sono pochi), scarpe tolte dove c'è un gradino.</p>
    <p><b>Prese</b> · tipo A, 100V: serve l'adattatore.</p>
  </div><div style="height:20px"></div>`;
}
function showBig(ja, sub) {
  $("modal").innerHTML = `<div class="show" data-x="1"><div class="ja">${h(ja)}</div>${sub ? `<div class="itx">${h(sub)}</div>` : ""}<div class="row" style="margin-top:28px">${"speechSynthesis" in window ? `<button class="btn" id="say">Ascolta</button>` : ""}<button class="btn solid" data-x="1">Chiudi</button></div></div>`;
  $("modal").querySelector(".show").addEventListener("click", e => { if (e.target.dataset.x) closeModal(); });
  const s = $("say"); if (s) s.onclick = () => { try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(ja.replace(/〜|…/g, "")); u.lang = "ja-JP"; u.rate = .85; speechSynthesis.speak(u); } catch (e) {} };
}

/* =========================================================
   EVENTI
   ========================================================= */
document.addEventListener("click", async e => {
  const g = k => e.target.closest(k); let el;
  if ((el = g("[data-tab]"))) { location.hash = el.dataset.tab; return; }
  if ((el = g("[data-open]"))) { S.day = el.dataset.open; location.hash = "day"; return; }
  if ((el = g("[data-day]"))) { if (el.dataset.day) { S.day = el.dataset.day; S.replan = null; render(); window.scrollTo(0, 0); } return; }
  if ((el = g("[data-grp]"))) { S.grp = el.dataset.grp; render(); return; }
  if ((el = g("[data-go]"))) { const [t, s] = el.dataset.go.split(":"); S.grp = s; location.hash = t; return; }
  if ((el = g("[data-copy]"))) { try { await navigator.clipboard.writeText(el.dataset.copy); toast("Copiato"); } catch (x) { toast("Non riesco a copiare"); } return; }
  if ((el = g("[data-show]"))) { showBig(el.dataset.show, el.dataset.sub); return; }
  if ((el = g("[data-iam]"))) { setMe(el.dataset.iam); return; }
  if ((el = g("[data-sugg]"))) { const s = el.dataset.sugg; if (s.startsWith("📷")) { const p = $("pic"); if (p) p.click(); } else ask(s); return; }
  if ((el = g("[data-rpq]"))) { const t = $("rpq"); if (t) t.value = el.dataset.rpq; return; }
  if ((el = g("[data-yen]"))) { $("cvY").value = Number(el.dataset.yen).toLocaleString("it-IT"); $("cvE").value = (el.dataset.yen / rate()).toFixed(2).replace(".", ","); return; }
  if ((el = g("[data-pack]"))) { const p = myPerson() || {}, l = [...(p.pack || [])], i = +el.dataset.pack; if (l[i]) { l[i] = { ...l[i], d: !l[i].d }; savePerson({ pack: l }); } return; }
  if ((el = g("[data-unpack]"))) { const p = myPerson() || {}, l = [...(p.pack || [])]; l.splice(+el.dataset.unpack, 1); savePerson({ pack: l }); return; }
  if (!(el = g("[data-act]"))) return;
  const a = el.dataset.act, id = el.dataset.id, find = c => S[c].find(x => x.id === id);
  if (el.tagName === "A") e.preventDefault();
  switch (a) {
    case "trip": editTrip(); break;
    case "connect": closeModal(); connectCloud(); break;
    case "invite": { const l = inviteLink(); try { await navigator.clipboard.writeText(l); toast("Link copiato: mandalo nel gruppo WhatsApp"); } catch (x) { prompt("Copia questo link", l); } break; }
    case "unlink": if (el.dataset.s) { localStorage.removeItem("jp_cloud"); location.reload(); } else { el.dataset.s = 1; el.textContent = "Sicuro? Tocca ancora"; } break;
    case "personalize": personalize(); break;
    case "switchme": localStorage.removeItem("jp_me"); S.me = null; render(); break;
    case "editday": editDay(el.dataset.date); break;
    case "additem": editItem({}, el.dataset.date); break;
    case "edititem": editItem(find("itin")); break;
    case "toggleitem": { const x = find("itin"); if (x) dbUpd("itin", id, { done: !x.done }); break; }
    case "replan": if (!(S.trip.geminiKey || "").trim()) { toast("Serve la chiave Gemini nelle impostazioni"); editTrip(); break; } S.replan = { date: S.day }; render(); setTimeout(() => { const t = $("rpq"); if (t) t.focus(); }, 50); break;
    case "rpclose": S.replan = null; render(); break;
    case "rpgo": doReplan(); break;
    case "rpapply": applyReplan(); break;
    case "addbook": editBook(); break;
    case "editbook": editBook(find("book")); break;
    case "addexp": editExp(); break;
    case "editexp": editExp(find("exp")); break;
    case "togglecheck": { const x = find("check"); if (x) dbUpd("check", id, { done: !x.done }); break; }
    case "delcheck": if (el.dataset.s) dbDel("check", id); else { el.dataset.s = 1; el.textContent = "?"; el.style.color = "var(--sos)"; setTimeout(() => { if (el.isConnected) { delete el.dataset.s; el.textContent = "✕"; el.style.color = ""; } }, 2500); } break;
    case "stop": if (aiCtl) aiCtl.abort(); break;
    case "clearchat": S.chat = []; ls.set("chat_" + slug(S.me), []); render(); break;
  }
});
function setMe(name) {
  name = String(name || "").trim(); if (!name) return;
  S.me = name; ls.set("me", name); S.chat = ls.get("chat_" + slug(name), []);
  const mem = S.trip.members || []; if (!mem.includes(name)) saveTrip({ members: [...mem, name] });
  if (!myPerson()) savePerson({});
  render();
}
document.addEventListener("submit", e => {
  const id = e.target.id; if (!["ask", "addcheck", "packform", "iamform"].includes(id)) return; e.preventDefault();
  if (id === "ask") { const q = $("q"), v = q.value.trim(); q.value = ""; ask(v); }
  if (id === "addcheck") { const t = $("cktext"), v = t.value.trim(); if (v) { dbAdd("check", { text: v, cat: "Altro", done: false }); t.value = ""; } }
  if (id === "packform") { const t = $("packin"), v = t.value.trim(); if (v) { const p = myPerson() || {}; savePerson({ pack: [...(p.pack || []), { t: v, d: false }] }); t.value = ""; } }
  if (id === "iamform") setMe($("iamname").value);
});
document.addEventListener("keydown", e => { if (e.target.id === "q" && e.key === "Enter" && !e.shiftKey) { e.preventDefault(); $("ask").requestSubmit(); } });
document.addEventListener("change", e => {
  if (e.target.id === "pic" && e.target.files[0]) { pendingImg = e.target.files[0]; toast("Foto pronta: scrivi una domanda o premi Invia"); const q = $("q"); if (q) { q.placeholder = "Foto pronta: cosa vuoi sapere?"; q.focus(); } }
});
let notesT = null;
document.addEventListener("input", e => {
  const t = e.target, r = rate();
  const conv = (yId, eId) => { if (t.id === yId) { const v = parseFloat(t.value.replace(/\./g, "").replace(",", ".")); $(eId).value = isNaN(v) ? "" : (v / r).toFixed(2).replace(".", ","); } if (t.id === eId) { const v = parseFloat(t.value.replace(/\./g, "").replace(",", ".")); $(yId).value = isNaN(v) ? "" : Math.round(v * r).toLocaleString("it-IT"); } };
  conv("cvY", "cvE"); conv("wY", "wE");
  if (t.id === "phq") { S.phq = t.value; render(); }
  if (t.id === "q") { t.style.height = "auto"; t.style.height = Math.min(t.scrollHeight, 120) + "px"; }
  if (t.id === "mynotes") { clearTimeout(notesT); const v = t.value; notesT = setTimeout(() => savePerson({ notes: v }), 900); }
});
window.addEventListener("hashchange", () => { render(); window.scrollTo(0, 0); });
boot();
