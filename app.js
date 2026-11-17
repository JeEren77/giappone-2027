import { SEED_TRIP, SEED_DAYS, SEED_ITEMS, SEED_CHECK } from "./seed.js";

/* ============================================================
   STATO
   ============================================================ */
const COLS = ["days", "itin", "book", "exp", "check", "votes", "people"];
const S = {
  trip: { ...SEED_TRIP }, days: [], itin: [], book: [], exp: [], check: [], votes: [], people: [],
  view: "today", day: null, grp: "book", mapDay: "all", phq: "",
  wx: {}, fx: null, chat: [], aiBusy: false, replan: null,
  mode: "local", phase: "boot", user: null, meId: null, synced: false
};
const WIDGETS = [
  ["hero", "Conto alla rovescia / giorno di viaggio"], ["next", "Prossima attività"], ["wx", "Meteo"], ["fx", "Cambio"],
  ["remind", "Promemoria e scadenze"], ["money", "Le mie spese"]
];
const COLORS = ["#E2421F", "#13965A", "#1F6FC0", "#7B3FA0", "#E2620E", "#C22D4A", "#8E8E93"];
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
function city(name) { const n = String(name || "").toLowerCase(); for (const key in CITY) if (n.includes(key)) return { key, ...CITY[key] }; return { key: null, k: "日本", r: name || "Da decidere", c: "--jp", code: "JP" }; }

/* ============================================================
   UTIL
   ============================================================ */
const $ = id => document.getElementById(id);
const h = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const pd = s => { if (!s) return null; const [y, m, d] = s.slice(0, 10).split("-").map(Number); return new Date(y, m - 1, d); };
const iso = d => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
const fmt = (s, o = { weekday: "short", day: "numeric", month: "short" }) => { const d = pd(s); return d ? d.toLocaleDateString("it-IT", o) : ""; };
const jpToday = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tokyo" }).format(new Date());
const itToday = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Rome" }).format(new Date());
const yen = n => "¥" + Math.round(n).toLocaleString("it-IT");
const eur = n => "€" + (Math.round(n * 100) / 100).toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const rate = () => (S.fx && S.fx.rate) || 177;
const route = q => "https://www.google.com/maps/dir/?api=1&travelmode=transit&destination=" + encodeURIComponent(q);
const routeLL = (lat, lon) => `https://www.google.com/maps/dir/?api=1&travelmode=transit&destination=${lat},${lon}`;
const slug = s => String(s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "x";
const rid = (n = 20) => { const a = new Uint8Array(n); crypto.getRandomValues(a); return Array.from(a, b => "abcdefghijklmnopqrstuvwxyz0123456789"[b % 36]).join(""); };
const safeUrl = u => { u = String(u || "").trim(); if (!u) return ""; return /^https?:\/\//i.test(u) ? u : "https://" + u; };
const ls = { get(k, d = null) { try { const v = localStorage.getItem("jp2_" + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem("jp2_" + k, JSON.stringify(v)); } catch (e) {} }, del(k) { try { localStorage.removeItem("jp2_" + k); } catch (e) {} } };
function toast(m) { document.querySelectorAll(".toast").forEach(t => t.remove()); const t = document.createElement("div"); t.className = "toast"; t.textContent = m; document.body.appendChild(t); setTimeout(() => t.remove(), 2800); }
function tripDays() { const a = pd(S.trip.start), b = pd(S.trip.end), out = []; if (!a || !b || b < a) return out; for (let d = new Date(a); d <= b && out.length < 45; d.setDate(d.getDate() + 1)) out.push(iso(d)); return out; }
const dayInfo = d => S.days.find(x => x.id === d) || {};
const dayItems = d => S.itin.filter(i => i.date === d).sort((a, b) => (a.time || "99").localeCompare(b.time || "99"));
const phase = () => { const days = tripDays(), t = jpToday(); if (!days.length) return "none"; if (t < days[0]) return "before"; if (t > days[days.length - 1]) return "after"; return "during"; };
const me = () => S.people.find(p => p.id === S.meId) || null;
const nameOf = id => (S.people.find(p => p.id === id) || {}).name || "Qualcuno";
const memberIds = () => S.people.map(p => p.id);
const myWidgets = () => { const p = me(), saved = p && Array.isArray(p.widgets) ? p.widgets : []; const ids = saved.map(w => w.id); return [...saved.filter(w => WIDGETS.some(x => x[0] === w.id)), ...WIDGETS.filter(x => !ids.includes(x[0])).map(x => ({ id: x[0], on: true }))]; };

/* ---------- icone (stile SF Symbols) ---------- */
const I = {
  today: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6"/></svg>',
  trip: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="3" width="14" height="14" rx="4"/><path d="M5 10h14M9 21l1.5-3M15 21l-1.5-3"/><circle cx="9" cy="13.5" r=".6" fill="currentColor"/><circle cx="15" cy="13.5" r=".6" fill="currentColor"/></svg>',
  map: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M9 4 3.5 6v14L9 18l6 2 5.5-2V4L15 6 9 4Z"/><path d="M9 4v14M15 6v14"/></svg>',
  ai: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><path d="M11 3.5l1.9 5 5 1.9-5 1.9-1.9 5-1.9-5-5-1.9 5-1.9z"/><path d="M18.5 14.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z"/></svg>',
  group: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="9" cy="8" r="3.3"/><path d="M2.8 19.5c.6-3.3 3.2-5.3 6.2-5.3s5.6 2 6.2 5.3"/><circle cx="17" cy="9" r="2.6"/><path d="M16.5 14.3c2.6.2 4.3 1.9 4.8 4.6"/></svg>',
  chev: '<svg class="chev" viewBox="0 0 8 13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1.5 1.5 6.5 6.5 1.5 11.5"/></svg>',
  back: '<svg viewBox="0 0 12 21" style="width:12px;height:21px" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M10 2 2 10.5 10 19"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  gear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/></svg>',
  go: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11 21 3l-8 18-2-8-8-2Z"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5 10 17 19 7"/></svg>',
  cal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4"/></svg>',
  send: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M5.5 11.5 12 5l6.5 6.5"/></svg>',
  cam: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M4 8h3l2-2.5h6L17 8h3v11H4z"/><circle cx="12" cy="13.3" r="3.4"/></svg>',
  yen: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 4l6 8 6-8M12 12v8M7.5 13.5h9M7.5 17h9"/></svg>',
  speak: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M4 5h16v11H9l-5 4z"/><path d="M8.5 9.5h7M8.5 12.5h4" stroke-linecap="round"/></svg>',
  sos: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1Z"/></svg>',
  taxi: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M4 16v-4l2-5h12l2 5v4z"/><path d="M4 16v2.5M20 16v2.5M9 4.5h6" stroke-linecap="round"/><circle cx="7.5" cy="13" r=".8" fill="currentColor"/><circle cx="16.5" cy="13" r=".8" fill="currentColor"/></svg>'
};
const G_LOGO = '<svg width="20" height="20" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>';

/* ============================================================
   ARCHIVIO: locale oppure Firebase con accesso Google
   ============================================================ */
const Store = { watchers: {}, api: null, emit(c, v) { (this.watchers[c] || []).forEach(f => f(v)); }, watch(c, f) { (this.watchers[c] = this.watchers[c] || []).push(f); } };

function seedData(meName) {
  const d = { trip: { ...SEED_TRIP }, days: {}, itin: {}, book: {}, exp: {}, check: {}, votes: {}, people: {} };
  SEED_DAYS.forEach(([date, c, title, sleep, move, note]) => d.days[date] = { city: c, title, sleep, move, note });
  SEED_ITEMS.forEach(([date, time, title, place, note, lat, lon], i) => d.itin["s" + String(i).padStart(3, "0")] = { date, time, title, place, note, lat, lon, done: false, ts: i });
  SEED_CHECK.forEach(([cat, text, when, due], i) => d.check["c" + String(i).padStart(3, "0")] = { cat, text, when, due, done: false, order: i });
  if (meName) d.people.me = { name: meName, emoji: "🙂", color: COLORS[0] };
  return d;
}
function localBackend() {
  let data = ls.get("data");
  const save = () => ls.set("data", data);
  const rows = c => Object.entries(data[c] || {}).map(([id, v]) => ({ ...v, id }));
  const fire = c => { save(); Store.emit(c, c === "trip" ? data.trip : rows(c)); };
  return {
    ready: () => !!data,
    init(name) { data = seedData(name); save(); },
    start() { if (!data) return; Store.emit("trip", data.trip); COLS.forEach(c => Store.emit(c, rows(c))); },
    async setTrip(t) { data.trip = { ...data.trip, ...t }; fire("trip"); },
    async add(c, v) { (data[c] = data[c] || {})[rid(16)] = v; fire(c); },
    async set(c, id, v) { (data[c] = data[c] || {})[id] = v; fire(c); },
    async update(c, id, v) { if (!data[c] || !data[c][id]) throw new Error("missing"); data[c][id] = { ...data[c][id], ...v }; fire(c); },
    async del(c, id) { if (data[c]) delete data[c][id]; fire(c); },
    dump: () => data
  };
}

const FB = "https://www.gstatic.com/firebasejs/10.12.2/";
let F = null; // moduli Firebase
async function loadFirebase(cfg) {
  const [appM, authM, fsM] = await Promise.all([import(FB + "firebase-app.js"), import(FB + "firebase-auth.js"), import(FB + "firebase-firestore.js")]);
  const app = appM.initializeApp(cfg);
  const auth = authM.getAuth(app);
  try { await authM.setPersistence(auth, authM.indexedDBLocalPersistence); } catch (e) {}
  let db; try { db = fsM.initializeFirestore(app, { localCache: fsM.persistentLocalCache({ tabManager: fsM.persistentMultipleTabManager() }) }); } catch (e) { db = fsM.getFirestore(app); }
  F = { ...authM, ...fsM, app, auth, db };
  return F;
}
function cloudBackend(tripId) {
  const tdoc = F.doc(F.db, "trips", tripId), col = c => F.collection(F.db, "trips", tripId, c), dref = (c, id) => F.doc(F.db, "trips", tripId, c, id);
  return {
    ready: () => true,
    start() {
      F.onSnapshot(tdoc, { includeMetadataChanges: true }, s => { S.synced = !s.metadata.fromCache; if (s.exists()) Store.emit("trip", s.data()); }, e => { console.warn(e); toast("Non hai accesso a questo viaggio."); });
      COLS.forEach(c => F.onSnapshot(col(c), q => Store.emit(c, q.docs.map(d => ({ ...d.data(), id: d.id }))), e => console.warn(c, e)));
    },
    async setTrip(t) { await F.setDoc(tdoc, t, { merge: true }); },
    async add(c, v) { await F.addDoc(col(c), v); },
    async set(c, id, v) { await F.setDoc(dref(c, id), v); },
    async update(c, id, v) { await F.updateDoc(dref(c, id), v); },
    async del(c, id) { await F.deleteDoc(dref(c, id)); }
  };
}
async function createCloudTrip(local) {
  const uid = S.user.uid, tripId = rid(20), invite = rid(24);
  const { geminiKey, ...rest } = local.trip || {};
  await F.setDoc(F.doc(F.db, "trips", tripId), { ...SEED_TRIP, ...rest, geminiKey: geminiKey || "", ownerUid: uid, memberUids: [uid], createdAt: Date.now() });
  const ops = [];
  COLS.filter(c => c !== "people").forEach(c => Object.entries(local[c] || {}).forEach(([id, v]) => ops.push([c, id, v])));
  // persone senza app (ospiti) del telefono: diventano "g-..."; io divento il mio uid
  Object.entries(local.people || {}).forEach(([id, v]) => { if (id !== "me") ops.push(["people", id.startsWith("g-") ? id : "g-" + slug(v.name), v]); });
  const mine = (local.people && local.people.me) || {};
  ops.push(["people", uid, { emoji: "🙂", color: COLORS[0], ...mine, name: mine.name || firstName(S.user), photo: S.user.photoURL || "" }]);
  ops.push(["invites", invite, { by: uid, at: Date.now() }]);
  // riferimenti a "me" in spese, voti, prenotazioni
  const fix = v => JSON.parse(JSON.stringify(v).replace(/"me"/g, JSON.stringify(uid)));
  for (let i = 0; i < ops.length; i += 400) {
    const b = F.writeBatch(F.db);
    ops.slice(i, i + 400).forEach(([c, id, v]) => b.set(F.doc(F.db, "trips", tripId, c, id), ["exp", "votes", "book"].includes(c) ? fix(v) : v));
    await b.commit();
  }
  return { tripId, invite };
}
const firstName = u => ((u && u.displayName) || "").split(" ")[0] || "Io";

const errMsg = e => String(e && (e.code || e.message)).includes("permission") ? "Permesso negato: non fai parte di questo viaggio." : "Salvataggio non riuscito. Riprova.";
async function dbAdd(c, v) { try { await Store.api.add(c, { ...v, ts: Date.now(), by: S.meId || "" }); } catch (e) { toast(errMsg(e)); } }
async function dbSet(c, id, v) { try { await Store.api.set(c, id, v); } catch (e) { toast(errMsg(e)); } }
async function dbUpd(c, id, v) { try { await Store.api.update(c, id, v); } catch (e) { toast(errMsg(e)); } }
async function dbDel(c, id) { try { await Store.api.del(c, id); } catch (e) { toast(errMsg(e)); } }
async function saveTrip(t) { try { await Store.api.setTrip(t); } catch (e) { toast(errMsg(e)); } }
async function saveMe(patch) { const cur = me() || { name: "Io" }; const { id, ...rest } = cur; const out = { ...rest, ...patch }; Object.keys(out).forEach(k => out[k] === undefined && delete out[k]); await dbSet("people", S.meId, out); }

/* ============================================================
   AVVIO
   ============================================================ */
async function boot() {
  if (location.hash.startsWith("#join=")) {
    try { const j = JSON.parse(decodeURIComponent(escape(atob(decodeURIComponent(location.hash.slice(6)))))); if (j.c && j.t) ls.set("cloud", { cfg: j.c, trip: j.t, invite: j.i || null }); } catch (e) { toast("Link di invito non valido"); }
    history.replaceState(null, "", location.pathname);
  }
  S.fx = ls.get("fx"); const wx = ls.get("wx"); if (wx) S.wx = wx.data || {};
  Store.watch("trip", t => { if (t) S.trip = { ...SEED_TRIP, ...t }; render(); });
  COLS.forEach(c => Store.watch(c, rows => { S[c] = rows; if (c === "days") loadWeather(); render(); }));
  addEventListener("scroll", onScroll, { passive: true });
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});
  loadFx(); setInterval(() => { loadFx(); loadWeather(); }, 30 * 60e3);

  const cloud = ls.get("cloud");
  if (cloud && cloud.cfg) {
    S.mode = "cloud"; S.phase = "boot"; render();
    try { await loadFirebase(cloud.cfg); }
    catch (e) { console.warn(e); toast("Non riesco a caricare Firebase: controlla la connessione"); return startLocal(); }
    try { await F.getRedirectResult(F.auth); } catch (e) { if (e && e.code !== "auth/no-auth-event") console.warn(e); }
    F.onAuthStateChanged(F.auth, async u => {
      S.user = u;
      if (!u) { S.phase = "login"; render(); return; }
      S.meId = u.uid;
      try { await enterTrip(); } catch (e) { console.warn(e); S.phase = "noaccess"; S.err = (e && e.message) || String(e); render(); }
    });
  } else startLocal();
}
function startLocal() {
  S.mode = "local"; S.meId = "me"; Store.api = localBackend();
  if (!Store.api.ready()) { S.phase = "welcome"; render(); return; }
  S.phase = "ready"; Store.api.start(); render(); loadWeather();
}
async function enterTrip() {
  const cloud = ls.get("cloud");
  if (!cloud.trip) { // l'organizzatore ha appena collegato Firebase: carico i dati del telefono
    S.phase = "boot"; render();
    const local = ls.get("data") || seedData(firstName(S.user));
    const { tripId, invite } = await createCloudTrip(local);
    ls.set("cloud", { ...cloud, trip: tripId, invite, owner: true });
    toast("Viaggio caricato online. Ora invita il gruppo!");
  } else {
    const tref = F.doc(F.db, "trips", cloud.trip);
    let ok = false;
    try { const s = await F.getDoc(tref); ok = s.exists(); } catch (e) { ok = false; }
    if (!ok) {
      if (!cloud.invite) throw new Error("Non fai parte di questo viaggio. Chiedi un link di invito a chi lo organizza.");
      await F.updateDoc(tref, { memberUids: F.arrayUnion(S.user.uid), joinWith: cloud.invite });
    }
    const pref = F.doc(F.db, "trips", cloud.trip, "people", S.user.uid);
    const ps = await F.getDoc(pref);
    if (!ps.exists()) await F.setDoc(pref, { name: firstName(S.user), photo: S.user.photoURL || "", emoji: "🙂", color: COLORS[Math.floor(Math.random() * 6)] });
  }
  Store.api = cloudBackend(ls.get("cloud").trip);
  S.phase = "ready"; Store.api.start(); render(); loadWeather();
}
async function signIn() {
  const p = new F.GoogleAuthProvider(); p.setCustomParameters({ prompt: "select_account" });
  try { await F.signInWithPopup(F.auth, p); }
  catch (e) {
    if (["auth/popup-blocked", "auth/operation-not-supported-in-this-environment", "auth/cancelled-popup-request"].includes(e.code)) { try { await F.signInWithRedirect(F.auth, p); } catch (x) { toast("Accesso non riuscito: " + x.code); } }
    else if (e.code === "auth/unauthorized-domain") toast("Dominio non autorizzato: aggiungi questo sito in Firebase → Authentication → Settings.");
    else if (e.code !== "auth/popup-closed-by-user") toast("Accesso non riuscito: " + (e.code || e.message));
  }
}
function inviteLink() {
  const c = ls.get("cloud"); if (!c || !c.trip) return "";
  const payload = btoa(unescape(encodeURIComponent(JSON.stringify({ c: c.cfg, t: c.trip, i: c.invite }))));
  return location.origin + location.pathname + "#join=" + encodeURIComponent(payload);
}

/* ============================================================
   DATI IN DIRETTA
   ============================================================ */
async function loadFx(force) {
  if (!force && S.fx && Date.now() - S.fx.at < 3 * 3600e3) return;
  for (const u of ["https://api.frankfurter.dev/v1/latest?base=EUR&symbols=JPY", "https://api.frankfurter.app/latest?from=EUR&to=JPY"]) {
    try { const r = await fetch(u); if (!r.ok) continue; const j = await r.json(); const v = j.rates && j.rates.JPY; if (v) { S.fx = { rate: v, date: j.date, at: Date.now() }; ls.set("fx", S.fx); render(); return; } } catch (e) {}
  }
}
let wxBusy = false;
async function loadWeather(force) {
  if (wxBusy) return; const cache = ls.get("wx");
  const keys = new Set(["tokyo"]); S.days.forEach(d => { const c = city(d.city); if (c.key) keys.add(c.key); });
  if (!force && cache && Date.now() - cache.at < 45 * 60e3 && [...keys].every(k => cache.data[k])) { S.wx = cache.data; return; }
  wxBusy = true; const out = {};
  await Promise.all([...keys].map(async k => {
    const c = CITY[k];
    const u = `https://api.open-meteo.com/v1/forecast?latitude=${c.lat}&longitude=${c.lon}&timezone=Asia%2FTokyo&forecast_days=16&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,precipitation_probability_max,uv_index_max`;
    try { const r = await fetch(u); if (!r.ok) return; const j = await r.json(); const daily = {}; (j.daily.time || []).forEach((t, i) => daily[t] = { code: j.daily.weather_code[i], max: j.daily.temperature_2m_max[i], min: j.daily.temperature_2m_min[i], feel: j.daily.apparent_temperature_max[i], rain: j.daily.precipitation_probability_max[i], uv: j.daily.uv_index_max[i] }); out[k] = { now: j.current, daily }; } catch (e) {}
  }));
  wxBusy = false;
  if (Object.keys(out).length) { S.wx = { ...S.wx, ...out }; ls.set("wx", { at: Date.now(), data: S.wx }); render(); }
}
function wmo(c) { c = Number(c); if (c === 0) return ["☀️", "Sereno"]; if (c <= 2) return ["🌤️", "Poco nuvoloso"]; if (c === 3) return ["☁️", "Nuvoloso"]; if (c === 45 || c === 48) return ["🌫️", "Nebbia"]; if (c >= 51 && c <= 57) return ["🌦️", "Pioggerella"]; if (c >= 61 && c <= 67) return ["🌧️", "Pioggia"]; if (c >= 71 && c <= 77) return ["🌨️", "Neve"]; if (c >= 80 && c <= 82) return ["🌧️", "Rovesci"]; if (c >= 95) return ["⛈️", "Temporale"]; return ["🌡️", "—"]; }
const wxFor = d => { const c = city(dayInfo(d).city); return c.key && S.wx[c.key] ? S.wx[c.key].daily[d] : null; };
async function geocode(q) {
  try { const ctl = new AbortController(); setTimeout(() => ctl.abort(), 5000);
    const r = await fetch("https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=jp&accept-language=it&q=" + encodeURIComponent(q), { signal: ctl.signal });
    const j = await r.json(); if (j[0]) return { lat: +(+j[0].lat).toFixed(5), lon: +(+j[0].lon).toFixed(5) };
  } catch (e) {} return null;
}

/* ============================================================
   CALENDARIO (.ics) per i promemoria
   ============================================================ */
function icsEvent({ title, start, end, allDay, alarm = 60, desc = "", loc = "" }) {
  const esc = s => String(s || "").replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
  const dt = s => s.replace(/[-:]/g, "").slice(0, 13) + "00";
  const lines = ["BEGIN:VEVENT", "UID:" + rid(16) + "@giappone2027", "DTSTAMP:" + new Date().toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z", "SUMMARY:" + esc(title)];
  if (allDay) { const d = start.slice(0, 10).replace(/-/g, ""); const n = new Date(pd(start)); n.setDate(n.getDate() + 1); lines.push("DTSTART;VALUE=DATE:" + d, "DTEND;VALUE=DATE:" + iso(n).replace(/-/g, "")); }
  else { lines.push("DTSTART:" + dt(start), "DTEND:" + dt(end || start)); }
  if (desc) lines.push("DESCRIPTION:" + esc(desc)); if (loc) lines.push("LOCATION:" + esc(loc));
  lines.push("BEGIN:VALARM", "ACTION:DISPLAY", "DESCRIPTION:" + esc(title), "TRIGGER:-PT" + alarm + "M", "END:VALARM", "END:VEVENT");
  return lines.join("\r\n");
}
function downloadIcs(events, name) {
  const txt = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Giappone 2027//IT", "CALSCALE:GREGORIAN", ...events, "END:VCALENDAR"].join("\r\n");
  const url = URL.createObjectURL(new Blob([txt], { type: "text/calendar;charset=utf-8" }));
  const a = document.createElement("a"); a.href = url; a.download = name + ".ics"; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
  toast("Apri il file per aggiungerlo al calendario");
}
const remindEvent = c => icsEvent({ title: "🇯🇵 " + c.text, start: c.due, end: c.due, alarm: c.due.endsWith("02:45") ? 10 : 60, desc: (c.when || "") + "\nDall'app Giappone 2027" });

/* ============================================================
   GEMINI
   ============================================================ */
const GEM = "https://generativelanguage.googleapis.com/v1beta/models/";
function gemErr(st, b) { const m = (b && b.error && b.error.message) || ""; if (st === 400 && /api key/i.test(m)) return "La chiave Gemini non è valida. Controllala nelle impostazioni."; if (st === 403) return "La chiave Gemini non è autorizzata per questo sito. Controlla le restrizioni della chiave."; if (st === 404) return "Il modello indicato non esiste più. Cambialo nelle impostazioni (es. gemini-flash-latest)."; if (st === 429) return "Limite di richieste Gemini raggiunto. Riprova tra un po'."; return "Gemini non ha risposto (" + st + "). " + m.slice(0, 120); }
async function gemini({ system, contents, json = false, search = false, onText, signal }) {
  const key = (S.trip.geminiKey || "").trim(); if (!key) throw { friendly: "Manca la chiave Gemini: aggiungila in Impostazioni." };
  const model = (S.trip.model || "gemini-flash-latest").trim();
  const body = { contents, systemInstruction: { parts: [{ text: system }] } };
  if (json) body.generationConfig = { responseMimeType: "application/json" };
  if (search && !json) body.tools = [{ google_search: {} }];
  const stream = !!onText && !json;
  const r = await fetch(GEM + encodeURIComponent(model) + (stream ? ":streamGenerateContent?alt=sse" : ":generateContent"), { method: "POST", signal, headers: { "Content-Type": "application/json", "x-goog-api-key": key }, body: JSON.stringify(body) });
  if (!r.ok) { let b = null; try { b = await r.json(); } catch (e) {} if (search && r.status === 400 && !/api key/i.test((b && b.error && b.error.message) || "")) return gemini({ system, contents, json, search: false, onText, signal }); throw { friendly: gemErr(r.status, b) }; }
  let text = "", sources = [];
  const take = j => { const c = j.candidates && j.candidates[0]; if (!c) return; text += ((c.content && c.content.parts) || []).map(p => p.text || "").join(""); const g = c.groundingMetadata; if (g && g.groundingChunks) g.groundingChunks.forEach(ch => { if (ch.web && ch.web.uri && !sources.some(s => s.uri === ch.web.uri)) sources.push({ uri: ch.web.uri, title: ch.web.title || ch.web.uri }); }); };
  if (stream && r.body && r.body.getReader) {
    const rd = r.body.getReader(), dec = new TextDecoder(); let buf = "";
    for (;;) { const { value, done } = await rd.read(); if (done) break; buf += dec.decode(value, { stream: true }); let i; while ((i = buf.indexOf("\n")) >= 0) { const line = buf.slice(0, i).trim(); buf = buf.slice(i + 1); if (line.startsWith("data:")) { try { take(JSON.parse(line.slice(5))); onText(text); } catch (e) {} } } }
  } else take(await r.json());
  if (!text.trim()) throw { friendly: "Gemini non ha dato una risposta. Riformula la domanda." };
  return { text, sources };
}
async function fileToPart(file) {
  const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = URL.createObjectURL(file); });
  const sc = Math.min(1, 1400 / Math.max(img.width, img.height)), cv = document.createElement("canvas"); cv.width = Math.round(img.width * sc); cv.height = Math.round(img.height * sc);
  cv.getContext("2d").drawImage(img, 0, 0, cv.width, cv.height);
  return { inline_data: { mime_type: "image/jpeg", data: cv.toDataURL("image/jpeg", .85).split(",")[1] } };
}
const tripContext = () => tripDays().map((d, i) => { const f = dayInfo(d); return `G${i + 1} ${d} — ${f.city || "?"}: ${f.title || ""}${f.sleep ? " (dorme: " + f.sleep + ")" : ""}\n` + dayItems(d).map(x => `  ${x.time || ""} ${x.title}${x.place ? " @" + x.place : ""}`).join("\n"); }).join("\n");
function systemPrompt() {
  const p = me() || {};
  return `Sei l'assistente di viaggio di un gruppo di amici italiani in Giappone. Rispondi SEMPRE in italiano, pratico e conciso (max ~150 parole salvo richiesta): linee, stazioni, uscite, piatti, frasi giapponesi con romaji. Niente premesse. Se non sei sicuro di orari, prezzi o aperture dillo.
Foto di menù: piatti con nome giapponese, traduzione, cosa sono e prezzo; segnala carne, pesce, maiale, alcol${p.diet ? " e ciò che va contro le esigenze di chi chiede" : ""}. Cartelli e biglietti: traduci e spiega cosa fare.
Chi scrive: ${p.name || "un membro del gruppo"}${p.diet ? ". Esigenze alimentari: " + p.diet : ""}.
Oggi in Giappone: ${jpToday()}. Viaggio: ${S.trip.start} → ${S.trip.end}. Gruppo: ${S.people.map(x => x.name).join(", ")}.
ITINERARIO:
${tripContext()}`;
}

/* ============================================================
   FOGLI E MODULI (stile iOS)
   ============================================================ */
function closeModal() { const o = document.querySelector("#modal .ov"); if (o) { o.style.transition = "opacity .18s"; o.style.opacity = "0"; setTimeout(() => $("modal").innerHTML = "", 180); } else $("modal").innerHTML = ""; }
function fld(f, v) {
  const val = v[f.k] ?? f.def ?? "";
  if (f.html) return f.html;
  if (f.type === "textarea") return `<label class="fld col"><span>${h(f.label)}</span><textarea name="${f.k}" placeholder="${h(f.ph || "")}">${h(val)}</textarea></label>`;
  if (f.type === "select") return `<label class="fld"><span>${h(f.label)}</span><select name="${f.k}" dir="rtl">${f.options.map(o => { const [a, b] = Array.isArray(o) ? o : [o, o]; return `<option value="${h(a)}" ${String(a) === String(val) ? "selected" : ""}>${h(b)}</option>`; }).join("")}</select></label>`;
  if (f.type === "checks") { const sel = Array.isArray(val) ? val : f.options.map(o => o[0]); return `<div class="fld"><span>${h(f.label)}</span><div class="chk">${f.options.map(([a, b]) => `<label><input type="checkbox" name="${f.k}" value="${h(a)}" ${sel.includes(a) ? "checked" : ""}>${h(b)}</label>`).join("") || '<span class="l2 sub">Nessuno</span>'}</div></div>`; }
  return `<label class="fld"><span>${h(f.label)}</span><input name="${f.k}" type="${f.type === "number" ? "text" : f.type || "text"}" ${f.type === "number" ? 'inputmode="decimal"' : ""} ${f.type === "password" ? 'autocomplete="off" autocapitalize="off"' : ""} value="${h(val)}" placeholder="${h(f.ph || "")}"></label>`;
}
function openSheet({ title, sections, values = {}, onSave, onDelete, save = "Salva", delLabel = "Elimina", after }) {
  $("modal").innerHTML = `<div class="ov" data-x="1"><form class="sheet" id="frm"><div class="grab"></div><div class="hd"><button type="button" class="navbtn" data-x="1">Annulla</button><span class="t">${h(title)}</span>${onSave ? `<button class="navbtn r">${h(save)}</button>` : `<button type="button" class="navbtn r" data-x="1">Fine</button>`}</div>
  ${sections.map(s => `${s.header ? `<div class="sh">${h(s.header)}</div>` : '<div style="height:18px"></div>'}${s.raw ? s.raw : `<div class="group">${s.fields.map(f => fld(f, values)).join("")}</div>`}${s.footer ? `<div class="sf">${s.footer}</div>` : ""}`).join("")}
  ${onDelete ? `<button type="button" class="delb" id="del">${h(delLabel)}</button>` : ""}</form></div>`;
  const frm = $("frm");
  $("modal").querySelector(".ov").addEventListener("click", e => { if (e.target.closest("[data-x]") && (e.target.dataset.x || e.target.closest("button[data-x]"))) closeModal(); });
  frm.addEventListener("submit", e => {
    e.preventDefault(); if (!onSave) return;
    const all = sections.flatMap(s => s.fields || []).filter(f => f.k), out = {};
    for (const f of all) {
      if (f.type === "checks") out[f.k] = [...frm.querySelectorAll(`[name="${f.k}"]:checked`)].map(i => i.value);
      else { const el = frm.elements[f.k]; if (!el) continue; const v = el.value; out[f.k] = f.type === "number" ? (v === "" ? null : Number(String(v).replace(/\./g, "").replace(",", "."))) : v.trim(); }
      if (f.req && (out[f.k] === "" || out[f.k] == null)) { toast("Manca: " + f.label); return; }
    }
    closeModal(); onSave(out);
  });
  if (onDelete) { const b = $("del"); b.onclick = () => { if (b.dataset.s) { closeModal(); onDelete(); } else { b.dataset.s = 1; b.textContent = "Tocca di nuovo per confermare"; } }; }
  if (after) after($("modal"));
}

function editSettings() {
  const cloud = ls.get("cloud"), guests = S.people.filter(p => p.id.startsWith("g-")).map(p => p.name).join("\n");
  const members = S.people.filter(p => !p.id.startsWith("g-"));
  openSheet({
    title: "Impostazioni", values: { ...S.trip, guests },
    sections: [
      { header: "Viaggio", fields: [{ k: "name", label: "Nome", req: 1 }, { k: "start", label: "Arrivo", type: "date", req: 1 }, { k: "end", label: "Partenza", type: "date", req: 1 }] },
      { header: "Persone", raw: `<div class="group">${members.map(p => `<div class="cell"><span class="avatar" style="width:30px;height:30px;font-size:16px;margin:0;background:${h(p.color || COLORS[0])}">${h(p.emoji || "🙂")}</span><div class="body"><div class="t1">${h(p.name)}${p.id === S.meId ? " <span class='l2'>(tu)</span>" : ""}</div></div></div>`).join("")}
        ${S.mode === "cloud" ? `<button type="button" class="cell" data-act="invite"><div class="body"><div class="t1" style="color:var(--tint)">Copia link di invito</div></div></button>` : ""}</div>`, footer: S.mode === "cloud" ? "Chi apre il link entra con Google e vede il viaggio. Mandalo solo nel gruppo." : "Collega il gruppo qui sotto per invitare gli amici." },
      { header: "Persone senza app", fields: [{ k: "guests", label: "Una per riga (per dividere le spese)", type: "textarea", ph: "es. Nonna Pina" }] },
      { header: "Intelligenza artificiale", fields: [{ k: "geminiKey", label: "Chiave", type: "password", ph: "AIza…" }, { k: "model", label: "Modello", ph: "gemini-flash-latest" }],
        footer: `Una chiave per tutto il gruppo, creata su <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener">Google AI Studio</a>. La vedono solo i membri del viaggio. Il modello <code>gemini-flash-latest</code> segue sempre l'ultimo Flash.` },
      { header: "Sincronizzazione", raw: `<div class="group">${S.mode === "cloud" ? `<div class="cell"><div class="body"><div class="t1">Collegato con Google</div><div class="t2">${h((S.user && S.user.email) || "")}</div></div><span class="acc" style="color:var(--green)">●</span></div><button type="button" class="cell" data-act="signout"><div class="body"><div class="t1" style="color:var(--red)">Esci</div></div></button>`
        : `<button type="button" class="cell" data-act="connect"><div class="body"><div class="t1" style="color:var(--tint)">Collega il gruppo con Firebase</div><div class="t2">I dati di questo telefono vengono caricati online</div></div>${I.chev}</button>`}</div>` }
    ],
    onSave: async o => {
      if (o.end < o.start) return toast("La partenza è prima dell'arrivo");
      await saveTrip({ name: o.name, start: o.start, end: o.end, geminiKey: o.geminiKey, model: o.model || "gemini-flash-latest" });
      const want = o.guests.split(/\n|,/).map(s => s.trim()).filter(Boolean), have = S.people.filter(p => p.id.startsWith("g-"));
      for (const n of want) if (!have.some(p => p.name === n)) await dbSet("people", "g-" + slug(n), { name: n, emoji: "👤", color: "#8E8E93", guest: true });
      for (const p of have) if (!want.includes(p.name)) await dbDel("people", p.id);
    }
  });
}
function parseCfg(t) { const o = {}; const re = /["']?(\w+)["']?\s*:\s*["']([^"']+)["']/g; let m; while ((m = re.exec(t))) o[m[1]] = m[2]; return o.apiKey && o.projectId ? { apiKey: o.apiKey, authDomain: o.authDomain || o.projectId + ".firebaseapp.com", projectId: o.projectId, storageBucket: o.storageBucket, messagingSenderId: o.messagingSenderId, appId: o.appId } : null; }
function connectSheet() {
  openSheet({
    title: "Collega il gruppo", save: "Collega",
    sections: [{ header: "Configurazione Firebase", fields: [{ k: "cfg", label: "Incolla qui il blocco firebaseConfig", type: "textarea", ph: "const firebaseConfig = {\n  apiKey: \"…\",\n  authDomain: \"…\",\n  projectId: \"…\",\n  …\n};" }],
      footer: "La trovi in Firebase → Impostazioni progetto → Le tue app. Dopo accederai con Google e i dati di questo telefono verranno caricati nel viaggio del gruppo. Le istruzioni complete sono nel README del progetto." }],
    onSave: o => { const cfg = parseCfg(o.cfg); if (!cfg) return toast("Configurazione non riconosciuta: servono apiKey e projectId"); ls.set("cloud", { cfg, trip: null }); location.reload(); }
  });
}
function editDay(d) {
  openSheet({ title: fmt(d, { weekday: "long", day: "numeric", month: "long" }), values: dayInfo(d),
    sections: [{ fields: [{ k: "city", label: "Città", ph: "Tokyo, Kyoto…" }, { k: "title", label: "Titolo", ph: "es. Asakusa e Ueno" }, { k: "sleep", label: "Si dorme a" }, { k: "move", label: "Spostamento" }, { k: "note", label: "Da sapere", type: "textarea" }], footer: "La città decide colore, cartello e meteo della tappa." }],
    onSave: o => dbSet("days", d, o) });
}
function editItem(it = {}, date) {
  openSheet({ title: it.id ? "Attività" : "Nuova attività", values: { date: date || it.date || S.day, ...it },
    sections: [{ fields: [{ k: "title", label: "Cosa", req: 1, ph: "es. Tempio Senso-ji" }, { k: "date", label: "Giorno", type: "date", req: 1 }, { k: "time", label: "Ora", type: "time" }, { k: "place", label: "Luogo", ph: "per mappa e percorso" }, { k: "note", label: "Note", type: "textarea" }] }],
    onDelete: it.id ? () => dbDel("itin", it.id) : null,
    onSave: async o => {
      if (o.place && (o.place !== it.place || it.lat == null)) { const g = await geocode(o.place + ", Japan"); o.lat = g ? g.lat : null; o.lon = g ? g.lon : null; }
      it.id ? dbUpd("itin", it.id, o) : dbAdd("itin", { ...o, done: false });
    } });
}
const BT = [["volo", "✈️ Volo"], ["alloggio", "🏨 Alloggio"], ["treno", "🚄 Treno"], ["biglietto", "🎟️ Biglietto"], ["ristorante", "🍣 Ristorante"], ["altro", "📄 Altro"]];
const BI = Object.fromEntries(BT.map(([k, l]) => [k, l.split(" ")[0]]));
const peopleOpts = () => S.people.map(p => [p.id, p.name]);
function editBook(b = {}) {
  openSheet({ title: b.id ? "Prenotazione" : "Nuova prenotazione", values: { type: "alloggio", who: memberIds(), ...b },
    sections: [{ fields: [{ k: "type", label: "Tipo", type: "select", options: BT }, { k: "title", label: "Cosa", req: 1, ph: "es. Hotel Gracery Shinjuku" }, { k: "date", label: "Dal", type: "date" }, { k: "time", label: "Ora", type: "time" }, { k: "end", label: "Al", type: "date" }, { k: "code", label: "Codice", ph: "ABC123" }] },
      { fields: [{ k: "addr", label: "Indirizzo", ph: "anche in giapponese" }, { k: "link", label: "Link" }, { k: "who", label: "Per chi", type: "checks", options: peopleOpts() }, { k: "note", label: "Note", type: "textarea" }], footer: "Non salvare numeri di passaporto o di carte." }],
    onDelete: b.id ? () => dbDel("book", b.id) : null, onSave: o => b.id ? dbUpd("book", b.id, o) : dbAdd("book", o) });
}
const EC = ["🍜 Cibo", "🚃 Trasporti", "🏨 Alloggio", "🎟️ Ingressi", "🛍️ Shopping", "📦 Altro"];
function editExp(e = {}) {
  if (!S.people.length) return toast("Aggiungi prima le persone nelle impostazioni");
  openSheet({ title: e.id ? "Spesa" : "Nuova spesa", values: { cur: "JPY", paidBy: S.meId, split: memberIds(), date: jpToday(), cat: EC[0], ...e },
    sections: [{ fields: [{ k: "desc", label: "Per cosa", req: 1, ph: "es. Cena ramen" }, { k: "amount", label: "Importo", type: "number", req: 1, ph: "0" }, { k: "cur", label: "Valuta", type: "select", options: [["JPY", "¥ Yen"], ["EUR", "€ Euro"]] }, { k: "cat", label: "Tipo", type: "select", options: EC }, { k: "date", label: "Data", type: "date" }] },
      { fields: [{ k: "paidBy", label: "Ha pagato", type: "select", options: peopleOpts() }, { k: "split", label: "Si divide tra", type: "checks", options: peopleOpts() }] }],
    onDelete: e.id ? () => dbDel("exp", e.id) : null,
    onSave: o => { if (!o.split.length) return toast("Scegli almeno una persona"); const d = { ...o, rate: e.rate || rate() }; e.id ? dbUpd("exp", e.id, d) : dbAdd("exp", d); } });
}
const VK = [["attività", "🎯 Attività"], ["cibo", "🍣 Dove mangiare"], ["posto", "📍 Posto da vedere"], ["altro", "💬 Altro"]];
function editVote(v = {}) {
  openSheet({ title: v.id ? "Proposta" : "Nuova proposta", values: { kind: "attività", ...v },
    sections: [{ fields: [{ k: "title", label: "Proposta", req: 1, ph: "es. Cena di kaiseki a Gion" }, { k: "kind", label: "Tipo", type: "select", options: VK }, { k: "date", label: "Giorno (facoltativo)", type: "date" }, { k: "place", label: "Luogo" }, { k: "link", label: "Link" }, { k: "note", label: "Perché", type: "textarea" }] }],
    onDelete: v.id ? () => dbDel("votes", v.id) : null,
    onSave: o => v.id ? dbUpd("votes", v.id, o) : dbAdd("votes", { ...o, yes: [S.meId] }) });
}
function voteToPlan(v) {
  openSheet({ title: "Metti nel piano", save: "Aggiungi", values: { date: v.date || S.day, title: v.title, place: v.place || "" },
    sections: [{ fields: [{ k: "title", label: "Cosa", req: 1 }, { k: "date", label: "Giorno", type: "date", req: 1 }, { k: "time", label: "Ora", type: "time" }, { k: "place", label: "Luogo" }] }],
    onSave: async o => { const g = o.place ? await geocode(o.place + ", Japan") : null; await dbAdd("itin", { ...o, note: v.note || "", lat: g ? g.lat : null, lon: g ? g.lon : null, done: false }); await dbUpd("votes", v.id, { planned: o.date }); toast("Aggiunta al " + fmt(o.date)); } });
}
function editCheck(c = {}) {
  openSheet({ title: c.id ? "Cosa da fare" : "Nuova cosa da fare", values: { cat: "Da prenotare", ...c, due: c.due ? c.due.slice(0, 10) : "", dueTime: c.due ? c.due.slice(11, 16) : "" },
    sections: [{ fields: [{ k: "text", label: "Cosa", req: 1 }, { k: "cat", label: "Gruppo", type: "select", options: ["Da prenotare", "Prima di partire", "Altro"] }, { k: "when", label: "Nota", ph: "es. Appena fissate le date" }] },
      { header: "Promemoria", fields: [{ k: "due", label: "Data", type: "date" }, { k: "dueTime", label: "Ora", type: "time" }], footer: "Con una data compare tra i promemoria e si può aggiungere al calendario del telefono." }],
    onDelete: c.id ? () => dbDel("check", c.id) : null,
    onSave: o => { const d = { text: o.text, cat: o.cat, when: o.when, due: o.due ? o.due + "T" + (o.dueTime || "20:00") : "" }; c.id ? dbUpd("check", c.id, d) : dbAdd("check", { ...d, done: false, order: Date.now() }); } });
}

/* ============================================================
   VISTE
   ============================================================ */
const TABS = [["today", "Oggi", I.today], ["trip", "Viaggio", I.trip], ["map", "Mappa", I.map], ["ai", "Chiedi", I.ai], ["group", "Gruppo", I.group]];
const VIEWS = ["today", "trip", "day", "map", "ai", "group", "me", "phrases", "sos"];
let lastView = null;
function render() {
  const t = location.hash.slice(1); if (VIEWS.includes(t)) S.view = t;
  const days = tripDays(); if (!S.day || !days.includes(S.day)) { const td = jpToday(); S.day = days.includes(td) ? td : days[0]; }
  if (S.meId && S._chatFor !== S.meId) { S.chat = ls.get("chat_" + S.meId, []); S._chatFor = S.meId; }
  document.documentElement.style.setProperty("--me", (me() && me().color) || COLORS[0]);
  const ready = S.phase === "ready";
  const parent = { day: "trip", me: "today", phrases: "today", sos: "today" }[S.view] || S.view;
  $("tabbar").style.display = ready ? "" : "none";
  $("tabbar").innerHTML = `<div class="in">${TABS.map(([k, l, ic]) => `<button class="${parent === k ? "on" : ""}" data-tab="${k}" aria-label="${l}">${ic}<span>${l}</span></button>`).join("")}</div>`;
  const ae = document.activeElement, keepId = ae && ae.id, keepVal = ae && "value" in ae ? ae.value : null;
  let selS = null; try { selS = ae && ae.selectionStart; } catch (e) {}
  const y = window.scrollY, changed = lastView !== S.view; lastView = S.view;
  let html;
  if (!ready) html = { boot: vBoot, login: vLogin, welcome: vWelcome, noaccess: vNoAccess }[S.phase]();
  else html = { today: vToday, trip: vTrip, day: vDay, map: vMap, ai: vAI, group: vGroup, me: vMe, phrases: vPhrases, sos: vSos }[S.view]();
  $("app").innerHTML = html;
  if (keepId) { const x = $(keepId); if (x) { if (keepVal != null && x.value !== keepVal) x.value = keepVal; x.focus(); try { if (selS != null) x.setSelectionRange(selS, selS); } catch (e) {} } }
  if (!changed) window.scrollTo(0, y); else window.scrollTo(0, 0);
  onScroll();
  toggleMap(ready && S.view === "map");
  if (S.view === "ai" && S._scrollChat) { const c = $("chatend"); if (c) c.scrollIntoView(); S._scrollChat = false; }
}
function onScroll() { const n = document.querySelector(".nav"); if (n) n.classList.toggle("solid", window.scrollY > 30 || n.dataset.always === "1"); }
const nav = (title, { back, right = "", always } = {}) => `<header class="nav" ${always ? 'data-always="1"' : ""}><div class="in"><div class="lft">${back ? `<a class="navbtn" href="#${back[0]}">${I.back}<span>${h(back[1])}</span></a>` : ""}</div><div class="t">${h(title)}</div><div class="rgt">${right}</div></div></header>`;
const plusBtn = act => `<button class="navbtn" data-act="${act}" aria-label="Aggiungi">${I.plus}</button>`;
const sq = (bg, inner) => `<span class="sq" style="background:${bg}">${inner}</span>`;

/* ---------- schermate prima dell'accesso ---------- */
const vBoot = () => `<div class="empty" style="padding-top:42vh">Carico il viaggio…</div>`;
function vLogin() {
  return `<div class="login"><img class="logo" src="icons/icon-192.png" alt=""><h1>Giappone 2027</h1><p class="l2" style="margin:0 0 28px;line-height:1.45">Accedi con Google per vedere l'itinerario, le prenotazioni e le spese del gruppo.</p>
  <button class="gbtn" data-act="signin">${G_LOGO}Continua con Google</button>
  <p class="fn l2" style="margin-top:22px">Solo chi ha ricevuto il link di invito può entrare nel viaggio.</p>
  <button class="fn" style="color:var(--tint);margin-top:8px" data-act="unlink">Usa senza account su questo telefono</button></div>`;
}
function vWelcome() {
  return `<div class="login"><img class="logo" src="icons/icon-192.png" alt=""><h1>Benvenuto!</h1><p class="l2" style="margin:0 0 24px;line-height:1.45">È già pronto un itinerario di 14 giorni: Tokyo, Hakone, Kyoto, Nara, Hiroshima e Osaka. Puoi cambiarlo come vuoi.</p>
  <form id="welcome"><div class="group" style="margin:0 0 14px"><label class="fld"><span>Il tuo nome</span><input id="wname" placeholder="es. Marco" autocomplete="given-name"></label></div><button class="btn full">Inizia</button></form>
  <p class="fn l2" style="margin-top:18px">Hai ricevuto un link di invito? Aprilo dal telefono e sarai collegato al gruppo.</p></div>`;
}
const vNoAccess = () => `<div class="login"><h1>Niente accesso</h1><p class="l2" style="line-height:1.45">${h(S.err || "Non fai parte di questo viaggio.")}</p><button class="btn full" data-act="signout" style="margin-top:20px">Esci e cambia account</button><button class="fn" style="color:var(--tint);margin-top:14px" data-act="unlink">Usa senza account</button></div>`;

/* ---------- OGGI ---------- */
function vToday() {
  const p = me() || {}, d = new Date().toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" });
  const ws = myWidgets().filter(w => w.on).map(w => ({ hero: wHero, next: wNext, wx: wWx, fx: wFx, remind: wRemind, money: wMoney }[w.id] || (() => ""))());
  return `${nav("Oggi")}
  <div class="lt"><div style="flex:1"><div class="date">${h(d)}</div><h1>Oggi</h1></div><a href="#me" class="avatar" style="background:${h(p.color || COLORS[0])}" aria-label="La mia pagina">${h(p.emoji || "🙂")}</a></div>
  ${ws[0] || ""}
  <div class="tools">
    <a class="tool" href="#phrases">${sq("var(--kyoto)", I.speak)}<span style="color:var(--label)">Frasi</span></a>
    <button class="tool" data-act="taxi">${sq("var(--orange)", I.taxi)}<span>Taxi</span></button>
    <button class="tool" data-act="conv">${sq("var(--tokyo)", I.yen)}<span>Cambio</span></button>
    <a class="tool" href="#sos">${sq("var(--red)", I.sos)}<span style="color:var(--label)">SOS</span></a>
  </div>
  ${ws.slice(1).join("")}
  ${S.mode === "local" ? `<div class="sf" style="margin:18px 32px 0">Stai usando l'app solo su questo telefono. <a href="#" data-act="settings">Collega il gruppo</a> per condividerla.</div>` : (!S.synced ? `<div class="sf" style="margin:18px 32px 0">Offline: le modifiche partono appena torna la rete.</div>` : "")}
  <div style="height:16px"></div>`;
}
function wHero() {
  const days = tripDays(), t = jpToday(), ph = phase();
  if (ph === "during") { const i = days.indexOf(t), c = city(dayInfo(t).city), w = wxFor(t);
    return `<a class="hero" href="#day" data-open="${t}" style="--hc:var(${c.c})"><div class="kj">${h(c.k)}</div><div class="cap" style="opacity:.85;font-weight:600">GIORNO ${i + 1} DI ${days.length}</div><div class="n" style="font-size:44px">${h(c.r)}</div><div class="l">${h(dayInfo(t).title || "")}</div>${w ? `<div class="s">${wmo(w.code)[0]} ${Math.round(w.max)}° · pioggia ${w.rain ?? 0}%</div>` : ""}</a>`; }
  if (ph === "before") { const n = Math.round((pd(days[0]) - pd(t)) / 864e5);
    return `<div class="hero"><div class="kj">旅</div><div class="n num">${n}</div><div class="l">${n === 1 ? "giorno" : "giorni"} alla partenza</div><div class="s">${h(fmt(days[0], { weekday: "long", day: "numeric", month: "long" }))} · ${h(S.trip.name)}</div></div>`; }
  return "";
}
function wNext() {
  const days = tripDays(), t = jpToday(), ph = phase();
  const d = ph === "during" ? t : ph === "before" ? days[0] : null; if (!d) return "";
  const now = new Date().toLocaleTimeString("it-IT", { timeZone: "Asia/Tokyo", hour: "2-digit", minute: "2-digit" });
  const its = dayItems(d), nx = (d === t ? its.filter(x => !x.done && (x.time || "99") >= now) : its)[0];
  if (!nx) return `<div class="card"><div class="ch"><span class="k">Prossima attività</span></div><div class="l2">Niente altro in programma per oggi.</div></div>`;
  const dest = nx.lat != null ? routeLL(nx.lat, nx.lon) : nx.place ? route(nx.place) : "";
  return `<div class="card"><div class="ch"><span class="k">${d === t ? "Prossima attività" : "Primo giorno · " + h(fmt(d))}</span><a class="r" href="#day" data-open="${d}">Tutto il giorno</a></div>
  <div class="next"><div class="tm num">${h(nx.time || "—")}</div><div class="w"><b>${h(nx.title)}</b>${nx.note ? `<div class="sub l2" style="margin-top:3px">${h(nx.note)}</div>` : ""}</div></div>
  ${dest ? `<div class="pills"><a class="pill fill" href="${dest}" target="_blank" rel="noopener">${I.go.replace("<svg", '<svg width="15" height="15"')} Indicazioni</a></div>` : ""}</div>`;
}
function wWx() {
  const days = tripDays(), t = jpToday(), ph = phase();
  const cc = city(dayInfo(ph === "during" ? t : days[0]).city), k = cc.key && S.wx[cc.key] ? cc.key : (S.wx.tokyo ? "tokyo" : null);
  if (!k) return `<div class="card"><div class="ch"><span class="k">Meteo</span></div><div class="l2 sub">Carico il meteo…</div></div>`;
  const w = S.wx[k], n = w.now || {}, [e, lab] = wmo(n.weather_code);
  const trip = days.map(d => ({ d, w: wxFor(d), c: city(dayInfo(d).city) })).filter(x => x.w);
  const list = trip.length ? trip.map(x => ({ d: x.d, w: x.w, c: x.c, trip: true })) : Object.entries(w.daily).slice(0, 7).map(([d, x]) => ({ d, w: x }));
  const hot = trip.find(x => x.w.feel >= 35);
  return `<div class="card"><div class="ch"><span class="k">Meteo · ${h(CITY[k].r)}</span><span class="r">Open-Meteo</span></div>
  <div class="wx"><span class="e">${e}</span><span class="tp num">${Math.round(n.temperature_2m)}°</span><div class="sub"><b>${h(lab)}</b><br><span class="l2">Percepita ${Math.round(n.apparent_temperature)}° · umidità ${Math.round(n.relative_humidity_2m)}%</span></div></div>
  ${hot ? `<div class="alert">🥵 <span>${h(fmt(hot.d))} a ${h(hot.c.r)}: percepita ${Math.round(hot.w.feel)}°. Visite all'aperto solo la mattina.</span></div>` : ""}
  <div class="wxd">${list.map(x => `<div class="d ${x.trip ? "trip" : ""}">${h(fmt(x.d, { weekday: "short" }))}<span class="e">${wmo(x.w.code)[0]}</span><b class="num">${Math.round(x.w.max)}°</b><span class="l2 num">${Math.round(x.w.min)}°</span>${x.c ? `<br><span class="dotc" style="--c:var(${x.c.c})"></span>` : ""}</div>`).join("")}</div>
  ${trip.length ? "" : `<div class="fn l2" style="margin-top:10px">Le previsioni per le vostre tappe compaiono da 16 giorni prima della partenza.</div>`}</div>`;
}
function wFx() {
  const r = rate();
  return `<div class="card"><div class="ch"><span class="k">Cambio</span><span class="r">${S.fx ? "BCE · " + h(fmt(S.fx.date, { day: "numeric", month: "short" })) : "indicativo"}</span></div>
  <div class="fxbig num">1 € = ${r.toLocaleString("it-IT", { maximumFractionDigits: 2 })} ¥</div>
  <div class="conv"><label><span>¥</span><input id="cvY" inputmode="decimal" placeholder="1.000"></label><span class="l3">⇄</span><label><span>€</span><input id="cvE" inputmode="decimal" placeholder="${(1000 / r).toFixed(2).replace(".", ",")}"></label></div></div>`;
}
function upcomingReminders() { const now = itToday(); return S.check.filter(c => c.due && !c.done && c.due.slice(0, 10) >= now).sort((a, b) => a.due.localeCompare(b.due)); }
function wRemind() {
  const list = upcomingReminders(); if (!list.length) return "";
  const days = c => Math.round((pd(c.due) - pd(itToday())) / 864e5);
  return `<div class="sh">Promemoria<span class="r"><a href="#" data-act="icsall">Aggiungi tutti al calendario</a></span></div>
  <div class="group">${list.slice(0, 4).map(c => { const n = days(c); return `<div class="cell ic"><button class="check" data-act="togglecheck" data-id="${c.id}" aria-label="Fatto"></button><div class="body"><div class="t1">${h(c.text)}</div><div class="t2">${h(fmt(c.due, { day: "numeric", month: "long" }))}${c.due.endsWith("02:45") ? " · ore 3:00" : ""} · ${n === 0 ? "oggi" : n === 1 ? "domani" : "tra " + n + " giorni"}</div></div><button class="ib" data-act="ics" data-id="${c.id}" aria-label="Aggiungi al calendario">${I.cal}</button></div>`; }).join("")}
  ${list.length > 4 ? `<a class="cell" href="#group" data-grp="check"><div class="body"><div class="t1" style="color:var(--tint)">Altri ${list.length - 4}</div></div>${I.chev}</a>` : ""}</div>`;
}
function myMoney() { let paid = 0, share = 0; S.exp.forEach(e => { const a = e.cur === "EUR" ? (+e.amount || 0) * (e.rate || rate()) : (+e.amount || 0); const sp = e.split && e.split.length ? e.split : memberIds(); if (e.paidBy === S.meId) paid += a; if (sp.includes(S.meId)) share += a / sp.length; }); return { paid, share, bal: paid - share }; }
function wMoney() {
  if (!S.exp.length) return ""; const { share, bal } = myMoney(), bud = +((me() || {}).budget) || 0;
  return `<div class="card"><div class="ch"><span class="k">Le mie spese</span><a class="r" href="#group" data-grp="exp">Dettagli</a></div>
  <div class="row" style="justify-content:space-between;align-items:flex-end"><div><div class="fxbig num">${yen(share)}</div><div class="sub l2 num">${eur(share / rate())}</div></div><div style="text-align:right"><div class="fn l2">${bal >= 0 ? "Devi ricevere" : "Devi dare"}</div><div class="bb num" style="font-size:20px;color:${bal >= 0 ? "var(--green)" : "var(--red)"}">${yen(Math.abs(bal))}</div></div></div>
  ${bud ? `<div class="bar2"><i style="width:${Math.min(100, share / bud * 100)}%"></i></div><div class="fn l2" style="margin-top:4px">${Math.round(share / bud * 100)}% del budget di ${yen(bud)}</div>` : ""}</div>`;
}

/* ---------- IO ---------- */
function vMe() {
  const p = me() || {}, pack = Array.isArray(p.pack) ? p.pack : [], { share, bal } = myMoney(), ws = myWidgets();
  return `${nav("La mia pagina", { back: ["today", "Oggi"] })}
  <div style="text-align:center;padding:4px 16px 8px"><div class="avatar" style="width:84px;height:84px;font-size:44px;margin:0 auto 10px;background:${h(p.color || COLORS[0])}">${h(p.emoji || "🙂")}</div><h1 style="margin:0;font-size:28px">${h(p.name || "Io")}</h1>${S.user ? `<div class="sub l2">${h(S.user.email || "")}</div>` : ""}</div>
  <div class="sh">Profilo</div>
  <div class="group"><button class="cell" data-act="profile"><div class="body"><div class="t1">Nome, icona e colore</div></div>${I.chev}</button>
  <button class="cell" data-act="profile"><div class="body"><div class="t1">Cosa non mangio</div><div class="t2">${h(p.diet || "Niente di particolare")}</div></div>${I.chev}</button></div>
  <div class="sf">L'assistente ne tiene conto quando traduce i menù per te.</div>
  <div class="sh">La mia schermata Oggi</div>
  <div class="group">${ws.map((w, i) => `<div class="cell"><div class="body"><div class="t1">${h((WIDGETS.find(x => x[0] === w.id) || [])[1])}</div></div><button class="ib" style="width:30px;height:30px" data-wup="${i}" aria-label="Sposta su" ${i ? "" : "disabled"}>↑</button><label class="sw"><input type="checkbox" data-wtog="${w.id}" ${w.on ? "checked" : ""}><i></i></label></div>`).join("")}</div>
  <div class="sh">La mia valigia<span class="r l2">${pack.filter(x => x.d).length}/${pack.length}</span></div>
  <div class="group">${pack.map((x, i) => `<div class="cell ic ${x.d ? "done" : ""}"><button class="check ${x.d ? "on" : ""}" data-pack="${i}" aria-label="Preso">${x.d ? I.check : ""}</button><div class="body"><div class="t1">${h(x.t)}</div></div><button class="l3" data-unpack="${i}" aria-label="Elimina" style="font-size:20px;padding:6px">×</button></div>`).join("")}
  <form class="cell" id="packform"><span style="color:var(--tint);display:flex">${I.plus.replace("<svg", '<svg width="22" height="22"')}</span><input id="packin" placeholder="Aggiungi alla valigia" style="flex:1;border:0;background:transparent;font-size:17px;padding:11px 0"></form></div>
  <div class="sf">Solo tua: gli altri non la vedono.</div>
  <div class="sh">Le mie note</div>
  <div class="group"><textarea id="mynotes" placeholder="Indirizzi, regali da comprare, cose da ricordare…" style="width:100%;border:0;background:transparent;padding:12px 16px;min-height:110px;font-size:17px;resize:vertical">${h(p.notes || "")}</textarea></div>
  <div class="sf">Si salvano da sole.</div>
  <div class="sh">Spese</div>
  <div class="group"><div class="cell"><div class="body"><div class="t1">La mia quota</div></div><span class="acc num">${yen(share)}</span></div><div class="cell"><div class="body"><div class="t1">${bal >= 0 ? "Devo ricevere" : "Devo dare"}</div></div><span class="acc num" style="color:${bal >= 0 ? "var(--green)" : "var(--red)"}">${yen(Math.abs(bal))}</span></div>
  <button class="cell" data-act="profile"><div class="body"><div class="t1">Budget</div></div><span class="acc num">${p.budget ? yen(p.budget) : "Nessuno"}</span>${I.chev}</button></div>
  <div class="sh">Gruppo</div>
  <div class="group"><button class="cell ic" data-act="settings">${sq("#8E8E93", I.gear)}<div class="body"><div class="t1">Impostazioni del viaggio</div></div>${I.chev}</button>
  ${S.mode === "cloud" ? `<button class="cell ic" data-act="invite">${sq("var(--blue)", I.group)}<div class="body"><div class="t1">Invita qualcuno</div></div>${I.chev}</button>` : ""}</div>
  <div style="height:30px"></div>`;
}
function profileSheet() {
  const p = me() || {}; let color = p.color || COLORS[0], emoji = p.emoji || "🙂";
  openSheet({ title: "Profilo", values: { name: p.name || "", diet: p.diet || "", budget: p.budget ?? "" },
    sections: [{ fields: [{ k: "name", label: "Nome", req: 1 }] },
      { header: "Icona", raw: `<div class="group"><div class="swatches">${EMOJI.map(x => `<button type="button" data-emo="${x}" class="${x === emoji ? "on" : ""}">${x}</button>`).join("")}</div></div>` },
      { header: "Colore", raw: `<div class="group"><div class="swatches">${COLORS.map(x => `<button type="button" data-col="${x}" class="${x === color ? "on" : ""}" style="background:${x}" aria-label="Colore"></button>`).join("")}</div></div>` },
      { fields: [{ k: "diet", label: "Cosa non mangio", type: "textarea", ph: "es. niente maiale, allergia ai crostacei" }, { k: "budget", label: "Budget (¥)", type: "number", ph: "es. 150000" }] }],
    onSave: o => saveMe({ name: o.name, diet: o.diet, budget: o.budget, color, emoji }),
    after: m => m.addEventListener("click", e => { const t = e.target.closest("[data-emo],[data-col]"); if (!t) return; if (t.dataset.emo) { emoji = t.dataset.emo; m.querySelectorAll("[data-emo]").forEach(b => b.classList.toggle("on", b === t)); } else { color = t.dataset.col; m.querySelectorAll("[data-col]").forEach(b => b.classList.toggle("on", b === t)); } })
  });
}

/* ---------- VIAGGIO ---------- */
function vTrip() {
  const days = tripDays(), td = jpToday(); let prev = null, out = "";
  const nights = {}; days.slice(0, -1).forEach(d => { const c = city(dayInfo(d).city).r; nights[c] = (nights[c] || 0) + 1; });
  days.forEach((d, i) => {
    const inf = dayInfo(d), c = city(inf.city), w = wxFor(d), its = dayItems(d);
    if (prev !== c.r) { out += (prev ? "</div>" : "") + `${prev && inf.move ? `<div class="transfer"><b>乗換</b>${h(inf.move)}</div>` : ""}<div class="sh"><span class="dotc" style="--c:var(${c.c});margin-right:6px"></span>${h(c.r)} ${h(c.k)}<span class="r l2">${nights[c.r] ? nights[c.r] + (nights[c.r] > 1 ? " notti" : " notte") : ""}</span></div><div class="group dl">`; prev = c.r; }
    out += `<a class="cell ${d === td ? "today" : ""}" href="#day" data-open="${d}" style="--c:var(${c.c})"><span class="badge sm"><b>${c.code}</b><span>${String(i + 1).padStart(2, "0")}</span></span><div class="body"><div class="t1 b">${h(inf.title || "Giornata libera")}</div><div class="t2">${h(fmt(d))} · ${its.length} attività${w ? ` · ${wmo(w.code)[0]} ${Math.round(w.max)}°` : ""}</div></div>${I.chev}</a>`;
  });
  return `${nav(S.trip.name, { right: `<button class="navbtn" data-act="settings" aria-label="Impostazioni">${I.gear}</button>` })}
  <div class="lt"><div style="flex:1"><div class="date">${h(fmt(S.trip.start, { day: "numeric", month: "long" }))} – ${h(fmt(S.trip.end, { day: "numeric", month: "long" }))}</div><h1>Viaggio</h1></div></div>
  ${out ? out + "</div>" : '<div class="empty">Imposta le date nelle impostazioni.</div>'}<div style="height:24px"></div>`;
}
function vDay() {
  const days = tripDays(), d = S.day; if (!d) return nav("Giorno", { back: ["trip", "Viaggio"] }) + '<div class="empty">Imposta le date.</div>';
  const i = days.indexOf(d), inf = dayInfo(d), c = city(inf.city), its = dayItems(d), pv = days[i - 1], nx = days[i + 1], w = wxFor(d), r = S.replan && S.replan.date === d ? S.replan : null;
  const lab = x => dayInfo(x).title || city(dayInfo(x).city).r;
  return `${nav(fmt(d, { weekday: "short", day: "numeric", month: "short" }), { back: ["trip", "Viaggio"], right: `<button class="navbtn" data-act="editday" data-date="${d}">Modifica</button>`, always: true })}
  <div class="sign" style="--c:var(${c.c})"><div class="m"><span class="badge"><b>${c.code}</b><span>${String(i + 1).padStart(2, "0")}</span></span><div><div class="kanji">${h(c.k)}</div><div class="romaji">${h(c.r)}</div></div>${w ? `<div class="wxs"><span class="e">${wmo(w.code)[0]}</span><br><b class="num" style="color:var(--label)">${Math.round(w.max)}° / ${Math.round(w.min)}°</b><br>pioggia ${w.rain ?? 0}%</div>` : ""}</div>
  <div class="bar"><button data-day="${pv || ""}" ${pv ? "" : "disabled"} aria-label="Giorno prima">‹ <span>${pv ? h(lab(pv)) : ""}</span></button><span class="mid">${i + 1} / ${days.length}</span><button class="nx" data-day="${nx || ""}" ${nx ? "" : "disabled"} aria-label="Giorno dopo"><span>${nx ? h(lab(nx)) : ""}</span> ›</button></div></div>
  <div class="dayh"><div class="fn l2 b" style="text-transform:uppercase">${h(fmt(d, { weekday: "long", day: "numeric", month: "long" }))}</div><h2>${h(inf.title || "Giornata da pianificare")}</h2></div>
  <div class="chips">${inf.sleep ? `<span class="pill gray">🛏 ${h(inf.sleep)}</span>` : ""}${inf.move ? `<span class="pill gray">🚄 ${h(inf.move)}</span>` : ""}${w && w.feel >= 35 ? `<span class="pill" style="background:rgba(255,59,48,.12);color:var(--red)">🥵 ${Math.round(w.feel)}° percepiti</span>` : ""}${w && w.uv >= 8 ? `<span class="pill gray">UV ${Math.round(w.uv)}</span>` : ""}</div>
  ${inf.note ? `<div class="note">${h(inf.note)}</div>` : ""}
  <div class="sh">Programma<span class="r"><a href="#map" data-mapday="${d}">Sulla mappa</a></span></div>
  <div class="group tl" style="--c:var(${c.c})">${its.length ? its.map(e => { const dest = e.lat != null ? routeLL(e.lat, e.lon) : e.place ? route(e.place) : ""; return `<div class="cell ${e.done ? "done" : ""}" style="padding-right:12px"><span class="tm num">${h(e.time || "—")}</span><div class="body" data-act="edititem" data-id="${e.id}" style="cursor:pointer"><div class="t1">${h(e.title)}</div>${e.note ? `<div class="t2">${h(e.note)}</div>` : ""}</div><div class="acts">${dest ? `<a class="ib" href="${dest}" target="_blank" rel="noopener" aria-label="Indicazioni">${I.go}</a>` : ""}<button class="ib ${e.done ? "on" : ""}" data-act="toggleitem" data-id="${e.id}" aria-label="Fatto">${I.check}</button></div></div>`; }).join("") : '<div class="empty">Niente in programma.</div>'}
  <button class="cell" data-act="additem" data-date="${d}"><div class="body"><div class="t1" style="color:var(--tint)">Aggiungi attività</div></div></button></div>
  <div class="btns"><button class="btn tinted" data-act="replan">${I.ai.replace("<svg", '<svg width="20" height="20"')} Cambia questo giorno con l'AI</button></div>
  ${r ? replanBox(r) : ""}<div style="height:24px"></div>`;
}
function replanBox(r) {
  return `<div class="sh">Cosa cambiamo?</div><div class="group"><textarea id="rpq" placeholder="es. piove tutto il giorno · ritmo più lento · aggiungi un onsen" style="width:100%;border:0;background:transparent;padding:12px 16px;min-height:76px;font-size:17px">${h(r.q || "")}</textarea></div>
  <div class="chips">${["Piove tutto il giorno", "Ritmo più lento", "Più cibo di strada", "Fa troppo caldo"].map(x => `<button class="pill gray" data-rpq="${h(x)}">${h(x)}</button>`).join("")}</div>
  <div class="btns"><button class="btn gray" data-act="rpclose">Chiudi</button><button class="btn" data-act="rpgo" ${r.busy ? "disabled" : ""}>${r.busy ? '<span class="typing">Ci penso</span>' : "Proponi"}</button></div>
  ${r.err ? `<div class="sf" style="color:var(--red)">${h(r.err)}</div>` : ""}
  ${r.items ? `<div class="sh">Proposta</div><div class="group tl">${r.items.map(x => `<div class="cell"><span class="tm num">${h(x.time || "—")}</span><div class="body"><div class="t1">${h(x.title)}</div>${x.note ? `<div class="t2">${h(x.note)}</div>` : ""}</div></div>`).join("")}</div><div class="sf">Sostituisce il programma di questo giorno per tutto il gruppo.</div>
  <div class="btns"><button class="btn gray" data-act="rpgo">Un'altra</button><button class="btn" data-act="rpapply">Usa questa</button></div>` : ""}`;
}
async function doReplan() {
  const r = S.replan, d = r.date, inf = dayInfo(d), w = wxFor(d); r.q = ($("rpq") || {}).value || r.q || ""; r.busy = true; r.err = null; render();
  const cur = dayItems(d).map(x => ({ time: x.time || "", title: x.title, place: x.place || "", note: x.note || "" }));
  const prompt = `Ripianifica UNA giornata di un viaggio di gruppo in Giappone (agosto: caldo e umido).
Giorno ${d}, città ${inf.city || "?"}, titolo "${inf.title || ""}", si dorme a ${inf.sleep || "?"}, spostamenti: ${inf.move || "nessuno"}.
${w ? `Meteo previsto: ${wmo(w.code)[1]}, max ${Math.round(w.max)}°, percepita ${Math.round(w.feel)}°, pioggia ${w.rain}%.` : ""}
Programma attuale: ${JSON.stringify(cur)}
Richiesta: "${r.q || "migliora il programma"}"
Altri giorni (evita doppioni):
${tripContext().slice(0, 4000)}
Posti reali, orari realistici, all'aperto presto la mattina e pause al fresco nel primo pomeriggio. Note brevi in italiano.
Rispondi SOLO con un array JSON di 4-7 oggetti {"time":"HH:MM","title":"...","place":"nome per Google Maps, città","note":"...","lat":numero,"lon":numero}.`;
  try {
    const { text } = await gemini({ system: "Sei un esperto organizzatore di viaggi in Giappone. Rispondi solo con JSON valido.", contents: [{ role: "user", parts: [{ text: prompt }] }], json: true });
    let arr = JSON.parse(text.replace(/^```(json)?|```$/g, "").trim()); if (!Array.isArray(arr)) arr = arr.items || arr.plan || [];
    r.items = arr.slice(0, 9).map(x => ({ time: String(x.time || "").slice(0, 5), title: String(x.title || "").slice(0, 120), place: String(x.place || "").slice(0, 160), note: String(x.note || "").slice(0, 300), lat: isFinite(+x.lat) && +x.lat ? +x.lat : null, lon: isFinite(+x.lon) && +x.lon ? +x.lon : null })).filter(x => x.title);
    if (!r.items.length) throw { friendly: "Nessuna proposta valida. Riprova." };
  } catch (e) { r.err = (e && e.friendly) || "Non sono riuscito a fare una proposta. Riprova."; }
  r.busy = false; render();
}
async function applyReplan() { const { date, items } = S.replan; S.replan = null; render(); for (const x of dayItems(date)) await dbDel("itin", x.id); for (const x of items) await dbAdd("itin", { ...x, date, done: false }); toast("Programma aggiornato per tutti"); }

/* ---------- MAPPA ---------- */
let MAP = null, LAYER = null;
function vMap() {
  const days = tripDays();
  return `<div class="mapui"><button class="${S.mapDay === "all" ? "on" : ""}" data-mapday="all">Tutto il viaggio</button>${days.map((d, i) => { const c = city(dayInfo(d).city); return `<button class="${S.mapDay === d ? "on" : ""}" data-mapday="${d}"><span class="dotc" style="--c:var(${c.c})"></span>G${i + 1} ${h(fmt(d, { day: "numeric", month: "short" }))}</button>`; }).join("")}</div>`;
}
function toggleMap(show) {
  let el = $("map");
  if (!show) { if (el) el.style.display = "none"; return; }
  if (!window.L) { $("app").insertAdjacentHTML("beforeend", '<div class="empty" style="padding-top:40vh">La mappa ha bisogno della connessione la prima volta.</div>'); return; }
  if (!el) { el = document.createElement("div"); el.id = "map"; document.body.appendChild(el); }
  el.style.display = "";
  if (!MAP) {
    MAP = L.map(el, { zoomControl: false, attributionControl: true }).setView([35.2, 137.5], 6);
    const dark = matchMedia("(prefers-color-scheme: dark)").matches;
    L.tileLayer(`https://{s}.basemaps.cartocdn.com/${dark ? "dark_all" : "rastertiles/voyager"}/{z}/{x}/{y}{r}.png`, { maxZoom: 19, subdomains: "abcd", attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> © <a href="https://carto.com/">CARTO</a>' }).addTo(MAP);
    LAYER = L.layerGroup().addTo(MAP);
  }
  setTimeout(() => { MAP.invalidateSize(); drawMap(); }, 30);
}
function drawMap() {
  if (!MAP) return; LAYER.clearLayers();
  const days = tripDays(), sel = S.mapDay === "all" ? days : [S.mapDay], pts = [];
  sel.forEach(d => {
    const i = days.indexOf(d), c = city(dayInfo(d).city), col = getComputedStyle(document.documentElement).getPropertyValue(c.c).trim() || "#E2421F";
    const its = dayItems(d).filter(x => x.lat != null && x.lon != null), line = [];
    its.forEach((x, j) => {
      const ll = [x.lat, x.lon]; pts.push(ll); line.push(ll);
      const icon = L.divIcon({ className: "", html: `<div class="mk" style="--c:${col}">${S.mapDay === "all" ? i + 1 : j + 1}</div>`, iconSize: [28, 28], iconAnchor: [14, 14] });
      L.marker(ll, { icon }).addTo(LAYER).bindPopup(`<b>${h(x.title)}</b><br><span style="color:var(--label2)">${h(fmt(d))}${x.time ? " · " + h(x.time) : ""}</span><div style="margin-top:8px;display:flex;gap:8px"><a class="pill fill" href="${routeLL(x.lat, x.lon)}" target="_blank" rel="noopener">Indicazioni</a><a class="pill" href="#day" data-open="${d}">Giorno</a></div>`);
    });
    if (line.length > 1) L.polyline(line, { color: col, weight: 4, opacity: .7, dashArray: S.mapDay === "all" ? "1 8" : null, lineCap: "round" }).addTo(LAYER);
  });
  if (pts.length) MAP.fitBounds(pts, { padding: [60, 40], maxZoom: 15 });
}

/* ---------- CHIEDI ---------- */
const SUGG = [["📷", "Traduci un menù o un cartello"], ["🚄", "Come andiamo da Shinjuku ad Hakone?"], ["🍶", "Cosa ordino in un izakaya?"], ["🌀", "Cosa facciamo se arriva un tifone?"], ["🎫", "Il JR Pass ci conviene con questo itinerario?"]];
let aiCtl = null, pendingImg = null;
function vAI() {
  const key = !!(S.trip.geminiKey || "").trim();
  return `${nav("Chiedi", { right: S.chat.length ? `<button class="navbtn" data-act="clearchat">Nuova</button>` : "" })}
  <div class="lt"><h1>Chiedi</h1></div>
  <div class="chat">${!key ? `<div class="card" style="margin:0"><b>Attiva l'assistente</b><p class="sub l2" style="margin:6px 0 12px;line-height:1.4">Serve una chiave Gemini gratuita. Chi organizza la crea su Google AI Studio e la incolla nelle impostazioni: da lì funziona per tutti.</p><button class="btn sm" data-act="settings">Apri impostazioni</button></div>` : ""}
  ${key && !S.chat.length ? `<p class="sub l2" style="margin:0 4px;line-height:1.45">Conosce il vostro itinerario${me() && me().diet ? " e cosa non mangi" : ""}, legge le foto e cerca sul web orari e aperture.</p><div class="sugg">${SUGG.map(([e, s]) => `<button data-sugg="${h(s)}"><span style="font-size:22px">${e}</span>${h(s)}</button>`).join("")}</div>` : ""}
  ${S.chat.map(m => `<div class="msg ${m.role === "user" ? "u" : "a"}">${m.img ? "📷 " : ""}${h(m.text)}${m.sources && m.sources.length ? `<span class="src">${m.sources.slice(0, 3).map(s => `<a href="${h(s.uri)}" target="_blank" rel="noopener">${h(s.title)}</a>`).join(" · ")}</span>` : ""}</div>`).join("")}
  ${S.aiBusy ? `<div class="msg a" id="live"><span class="typing">${pendingImg ? "Leggo la foto" : "Sto pensando"}</span></div>` : ""}<div id="chatend"></div></div>
  ${key ? `<div class="composer"><form id="ask"><label class="ib" style="width:36px;height:36px;margin-bottom:1px" aria-label="Foto">${I.cam}<input type="file" accept="image/*" id="pic" hidden></label><textarea id="q" rows="1" placeholder="${pendingImg ? "Foto pronta: cosa vuoi sapere?" : "Messaggio"}"></textarea>${S.aiBusy ? `<button type="button" class="send" data-act="stop" aria-label="Stop" style="font-size:12px">■</button>` : `<button class="send" aria-label="Invia">${I.send}</button>`}</form></div>` : ""}`;
}
async function ask(text) {
  if (S.aiBusy) return; const img = pendingImg; if (!text && img) text = "Traduci e spiegami questa foto."; if (!text) return;
  S.chat.push({ role: "user", text, img: !!img }); S.aiBusy = true; S._scrollChat = true; render(); aiCtl = new AbortController();
  const hist = S.chat.slice(-12).map(m => ({ role: m.role === "user" ? "user" : "model", parts: [{ text: m.text }] }));
  if (img) { try { hist[hist.length - 1].parts.push(await fileToPart(img)); } catch (e) { toast("Non riesco a leggere la foto"); } }
  try { const { text: a, sources } = await gemini({ system: systemPrompt(), contents: hist, search: !img, signal: aiCtl.signal, onText: t => { const el = $("live"); if (el) { el.textContent = t; el.scrollIntoView({ block: "end" }); } } }); S.chat.push({ role: "model", text: a, sources }); }
  catch (e) { S.chat.push({ role: "model", text: e && e.name === "AbortError" ? (($("live") || {}).textContent || "Interrotto.") : (e && e.friendly) || "Connessione assente o errore. Riprova." }); }
  pendingImg = null; S.aiBusy = false; S._scrollChat = true; ls.set("chat_" + S.meId, S.chat.slice(-30)); render();
}

/* ---------- GRUPPO ---------- */
function vGroup() {
  const add = { book: "addbook", exp: "addexp", votes: "addvote", check: "addcheck" }[S.grp];
  return `${nav("Gruppo", { right: plusBtn(add) })}
  <div class="lt"><h1>Gruppo</h1></div>
  <div class="seg">${[["book", "Prenotazioni"], ["exp", "Spese"], ["votes", "Proposte"], ["check", "Da fare"]].map(([k, l]) => `<button class="${S.grp === k ? "on" : ""}" data-grp="${k}">${l}</button>`).join("")}</div>
  ${{ book: gBook, exp: gExp, votes: gVotes, check: gCheck }[S.grp]()}<div style="height:24px"></div>`;
}
function gBook() {
  const list = [...S.book].sort((a, b) => ((a.date || "9") + (a.time || "")).localeCompare((b.date || "9") + (b.time || "")));
  if (!list.length) return `<div class="empty">Voli, hotel, treni e biglietti di tutti, con codici e indirizzi sempre a portata di mano.<br><br><button class="btn sm" data-act="addbook">Aggiungi prenotazione</button></div>`;
  return list.map(b => `<div class="card"><div class="row" style="align-items:flex-start"><span style="font-size:26px">${BI[b.type] || "📄"}</span><div style="flex:1;min-width:0"><div class="b" style="font-size:17px">${h(b.title)}</div><div class="sub l2 num">${b.date ? h(fmt(b.date)) + (b.time ? " · " + h(b.time) : "") + (b.end && b.end !== b.date ? " → " + h(fmt(b.end)) : "") : "Data da definire"}${Array.isArray(b.who) && b.who.length && b.who.length < S.people.length ? " · " + h(b.who.map(nameOf).join(", ")) : ""}</div></div><button class="navbtn" style="padding:0 4px;min-height:0" data-act="editbook" data-id="${b.id}">Modifica</button></div>
  ${b.note ? `<div class="sub" style="margin-top:8px">${h(b.note)}</div>` : ""}
  <div class="pills">${b.code ? `<button class="pill gray num" data-copy="${h(b.code)}">${h(b.code)} · Copia</button>` : ""}${b.addr ? `<a class="pill" href="${route(b.addr)}" target="_blank" rel="noopener">Indicazioni</a><button class="pill" data-show="${h(b.addr)}">Mostra al taxi</button>` : ""}${b.link ? `<a class="pill" href="${h(safeUrl(b.link))}" target="_blank" rel="noopener">Apri</a>` : ""}${b.date ? `<button class="pill" data-act="icsbook" data-id="${b.id}">Calendario</button>` : ""}</div></div>`).join("");
}
function balances() {
  const bal = {}; S.people.forEach(p => bal[p.id] = 0); let tot = 0;
  S.exp.forEach(e => { const a = e.cur === "EUR" ? (+e.amount || 0) * (e.rate || rate()) : (+e.amount || 0); tot += a; const sp = e.split && e.split.length ? e.split : memberIds(); if (!sp.length) return; bal[e.paidBy] = (bal[e.paidBy] || 0) + a; sp.forEach(p => bal[p] = (bal[p] || 0) - a / sp.length); });
  const cr = [], de = []; Object.entries(bal).forEach(([k, v]) => { if (v > .5) cr.push([k, v]); else if (v < -.5) de.push([k, -v]); });
  cr.sort((a, b) => b[1] - a[1]); de.sort((a, b) => b[1] - a[1]); const tr = []; let i = 0, j = 0;
  while (i < de.length && j < cr.length) { const x = Math.min(de[i][1], cr[j][1]); tr.push([de[i][0], cr[j][0], x]); de[i][1] -= x; cr[j][1] -= x; if (de[i][1] < .5) i++; if (cr[j][1] < .5) j++; }
  return { tot, tr };
}
function gExp() {
  const { tot, tr } = balances(), list = [...S.exp].sort((a, b) => (b.date || "").localeCompare(a.date || "") || (b.ts || 0) - (a.ts || 0));
  return `<div class="card"><div class="ch"><span class="k">Speso insieme</span></div><div class="fxbig num">${yen(tot)}</div><div class="sub l2 num">${eur(tot / rate())}${S.people.length && tot ? " · " + yen(tot / S.people.length) + " a testa" : ""}</div></div>
  ${tr.length ? `<div class="sh">Per pareggiare</div><div class="group">${tr.map(([a, b, x]) => `<div class="cell"><div class="body"><div class="t1">${h(nameOf(a))} → ${h(nameOf(b))}</div></div><span class="acc num" style="color:var(--label)">${yen(x)}</span></div>`).join("")}</div>` : tot ? `<div class="sf" style="margin-top:0">Siete pari. 🎉</div>` : ""}
  <div class="sh">Movimenti</div>
  ${list.length ? `<div class="group">${list.map(e => `<button class="cell" data-act="editexp" data-id="${e.id}"><span style="font-size:22px">${h((e.cat || "📦").split(" ")[0])}</span><div class="body"><div class="t1">${h(e.desc)}</div><div class="t2">${h(fmt(e.date))} · ${h(nameOf(e.paidBy))}</div></div><span class="acc num" style="color:var(--label)">${e.cur === "EUR" ? eur(e.amount) : yen(e.amount)}</span></button>`).join("")}</div>` : `<div class="empty">Segnate qui cene, taxi e biglietti pagati da uno per tutti.</div>`}`;
}
function gVotes() {
  const list = [...S.votes].sort((a, b) => (b.yes || []).length - (a.yes || []).length || (b.ts || 0) - (a.ts || 0));
  if (!list.length) return `<div class="empty">Proponete attività, ristoranti o posti da vedere e votateli insieme. Le più votate finiscono nel piano con un tocco.<br><br><button class="btn sm" data-act="addvote">Nuova proposta</button></div>`;
  return `<div class="sf" style="margin:10px 32px 8px">Tocca il pollice per votare. Tieni premuto su una proposta per modificarla.</div>` + list.map(v => { const y = v.yes || [], mine = y.includes(S.meId), k = (VK.find(x => x[0] === v.kind) || VK[3])[1];
    return `<div class="card"><div class="row" style="align-items:flex-start"><button class="vote ${mine ? "on" : ""}" data-act="vote" data-id="${v.id}" aria-label="Vota"><span>👍</span>${y.length}</button><div style="flex:1;min-width:0" data-act="editvote" data-id="${v.id}"><div class="b" style="font-size:17px">${h(v.title)}</div><div class="sub l2">${h(k)}${v.date ? " · " + h(fmt(v.date)) : ""} · di ${h(nameOf(v.by))}</div>${v.note ? `<div class="sub" style="margin-top:6px">${h(v.note)}</div>` : ""}${y.length ? `<div class="fn l2" style="margin-top:6px">Sì: ${h(y.map(nameOf).join(", "))}</div>` : ""}</div></div>
    <div class="pills">${v.planned ? `<span class="pill gray">✓ Nel piano il ${h(fmt(v.planned))}</span>` : `<button class="pill fill" data-act="vplan" data-id="${v.id}">Metti nel piano</button>`}${v.link ? `<a class="pill" href="${h(safeUrl(v.link))}" target="_blank" rel="noopener">Link</a>` : ""}<button class="pill gray" data-act="editvote" data-id="${v.id}">Modifica</button></div></div>`; }).join("");
}
function gCheck() {
  const cats = [...new Set(S.check.map(c => c.cat || "Altro"))].sort((a, b) => (a === "Da prenotare" ? -1 : b === "Da prenotare" ? 1 : a.localeCompare(b)));
  return cats.map(cat => { const its = S.check.filter(c => (c.cat || "Altro") === cat).sort((a, b) => (a.done - b.done) || (a.due || "z").localeCompare(b.due || "z") || (a.order ?? 0) - (b.order ?? 0));
    return `<div class="sh">${h(cat)}<span class="r l2">${its.filter(x => x.done).length}/${its.length}</span></div><div class="group">${its.map(c => `<div class="cell ic ${c.done ? "done" : ""}"><button class="check ${c.done ? "on" : ""}" data-act="togglecheck" data-id="${c.id}" aria-label="Fatto">${c.done ? I.check : ""}</button><div class="body" data-act="editcheck" data-id="${c.id}" style="cursor:pointer"><div class="t1">${h(c.text)}</div>${!c.done && (c.due || c.when) ? `<div class="t2">${c.due ? `<span style="color:var(--orange)">${h(fmt(c.due, { day: "numeric", month: "short", year: "numeric" }))}</span>` : ""}${c.due && c.when ? " · " : ""}${h(c.when || "")}</div>` : ""}</div>${c.due && !c.done ? `<button class="ib" data-act="ics" data-id="${c.id}" aria-label="Calendario">${I.cal}</button>` : ""}</div>`).join("")}</div>`; }).join("") || '<div class="empty">Niente da fare, per ora.</div>';
}

/* ---------- FRASI, SOS, TAXI ---------- */
const PH = {
  "Le indispensabili": [["すみません", "sumimasen", "Mi scusi / Permesso / Grazie"], ["ありがとうございます", "arigatō gozaimasu", "Grazie mille"], ["これをください", "kore o kudasai", "Vorrei questo (indicando)"], ["いくらですか？", "ikura desu ka?", "Quanto costa?"], ["トイレはどこですか？", "toire wa doko desu ka?", "Dov'è il bagno?"], ["英語を話せますか？", "eigo o hanasemasu ka?", "Parla inglese?"], ["大丈夫です", "daijōbu desu", "Va bene così / No grazie"]],
  "Al ristorante": [["四人です", "yonin desu", "Siamo in 4"], ["五人です", "gonin desu", "Siamo in 5"], ["六人です", "rokunin desu", "Siamo in 6"], ["英語のメニューはありますか？", "eigo no menyū wa arimasu ka?", "Avete un menù in inglese?"], ["おすすめは何ですか？", "osusume wa nan desu ka?", "Cosa mi consiglia?"], ["お水をください", "omizu o kudasai", "Dell'acqua, per favore"], ["お会計お願いします", "okaikei onegaishimasu", "Il conto, per favore"], ["別々に払えますか？", "betsubetsu ni haraemasu ka?", "Possiamo pagare separatamente?"], ["カードで払えますか？", "kādo de haraemasu ka?", "Posso pagare con carta?"], ["ごちそうさまでした", "gochisōsama deshita", "Grazie, era buonissimo"]],
  "In giro": [["この電車は〜に行きますか？", "kono densha wa … ni ikimasu ka?", "Questo treno va a …?"], ["ここに行きたいです", "koko ni ikitai desu", "Voglio andare qui (mostrando la mappa)"], ["この住所までお願いします", "kono jūsho made onegaishimasu", "A questo indirizzo, per favore"], ["荷物を預かってもらえますか？", "nimotsu o azukatte moraemasu ka?", "Potete tenerci i bagagli?"], ["免税できますか？", "menzei dekimasu ka?", "Si può fare il tax free?"], ["袋はいりません", "fukuro wa irimasen", "Non serve la busta"]],
  "Problemi": [["助けて！", "tasukete!", "Aiuto!"], ["救急車を呼んでください", "kyūkyūsha o yonde kudasai", "Chiamate un'ambulanza"], ["気分が悪いです", "kibun ga warui desu", "Mi sento male"], ["道に迷いました", "michi ni mayoimashita", "Mi sono perso"], ["財布をなくしました", "saifu o nakushimashita", "Ho perso il portafoglio"], ["アレルギーがあります", "arerugī ga arimasu", "Ho un'allergia"]]
};
function vPhrases() {
  const q = S.phq.trim().toLowerCase();
  const body = Object.entries(PH).map(([cat, l]) => { const f = l.filter(p => !q || p.join(" ").toLowerCase().includes(q)); if (!f.length) return "";
    return `<div class="sh">${h(cat)}</div><div class="group">${f.map(([ja, ro, it]) => `<button class="cell ph" data-show="${h(ja)}" data-sub="${h(it)}"><div class="body"><div class="ja">${h(ja)}</div><div class="ro">${h(ro)}</div><div class="t2">${h(it)}</div></div>${I.chev}</button>`).join("")}</div>`; }).join("");
  return `${nav("Frasi", { back: ["today", "Oggi"] })}<div class="lt"><h1>Frasi</h1></div>
  <div style="margin:0 16px"><input id="phq" value="${h(S.phq)}" placeholder="Cerca: conto, bagno, treno…" style="width:100%;border:0;background:var(--fill);border-radius:10px;padding:9px 12px;font-size:17px"></div>
  ${body || `<div class="empty">Nessuna frase trovata. Chiedila all'assistente!</div>`}<div class="sf">Tocca una frase per mostrarla a tutto schermo.</div><div style="height:24px"></div>`;
}
function vSos() {
  return `${nav("SOS", { back: ["today", "Oggi"] })}<div class="lt"><h1>Emergenze</h1></div>
  <div class="sos"><a href="tel:110"><b>110</b><span>Polizia</span></a><a href="tel:119"><b>119</b><span>Ambulanza e pompieri</span></a></div>
  <div class="sh">Aiuto in inglese o italiano</div>
  <div class="group"><a class="cell" href="tel:+815038162787"><div class="body"><div class="t1">Japan Visitor Hotline</div><div class="t2">050-3816-2787 · 24 ore, in inglese</div></div>${I.chev}</a>
  <a class="cell" href="tel:+81334535291"><div class="body"><div class="t1">Ambasciata d'Italia a Tokyo</div><div class="t2">+81 3 3453 5291 · 2-5-4 Mita, Minato-ku</div></div>${I.chev}</a></div>
  <div class="sh">Se succede…</div>
  <div class="group"><div class="cell"><div class="body"><div class="t1">Terremoto</div><div class="t2">Sotto un tavolo, lontano dai vetri. Installate l'app "Safety tips" per gli allarmi in inglese.</div></div></div>
  <div class="cell"><div class="body"><div class="t1">Tifone</div><div class="t2">Treni e voli si fermano anche per un giorno: restate in hotel e seguite JR e la compagnia aerea.</div></div></div>
  <div class="cell"><div class="body"><div class="t1">Colpo di calore</div><div class="t2">All'ombra, acqua e sali minerali. Se peggiora, chiamate il 119.</div></div></div></div>
  <div class="sh">Mostra al personale</div>
  <div class="group"><button class="cell" data-show="救急車を呼んでください" data-sub="Chiamate un'ambulanza"><div class="body"><div class="t1">Chiamate un'ambulanza</div></div>${I.chev}</button><button class="cell" data-show="助けてください" data-sub="Aiutatemi, per favore"><div class="body"><div class="t1">Aiutatemi, per favore</div></div>${I.chev}</button></div><div style="height:24px"></div>`;
}
function taxiSheet() {
  const t = jpToday(), d = tripDays().includes(t) ? t : tripDays()[0];
  const hotels = S.book.filter(b => b.type === "alloggio" && b.addr).sort((a, b) => Math.abs(pd(a.date || d) - pd(d)) - Math.abs(pd(b.date || d) - pd(d)));
  openSheet({ title: "Taxi", sections: [{ header: "Mostra l'indirizzo all'autista", raw: hotels.length ? `<div class="group">${hotels.map(b => `<button type="button" class="cell" data-show="${h(b.addr)}" data-sub="この住所までお願いします (A questo indirizzo, per favore)"><span style="font-size:22px">🏨</span><div class="body"><div class="t1">${h(b.title)}</div><div class="t2">${h(b.addr)}</div></div>${I.chev}</button>`).join("")}</div>` : `<div class="empty">Aggiungi gli hotel con l'indirizzo in Gruppo → Prenotazioni.</div>` },
    { header: "Utile", raw: `<div class="group"><button type="button" class="cell" data-show="この住所までお願いします" data-sub="A questo indirizzo, per favore"><div class="body"><div class="t1">“A questo indirizzo, per favore”</div></div>${I.chev}</button></div>`, footer: "L'app GO è la più usata per chiamare un taxi in Giappone." }] });
}
function convSheet() {
  const r = rate();
  openSheet({ title: "Cambio", sections: [{ raw: `<div class="card" style="margin:0 16px">${wFx().replace(/^<div class="card">|<\/div>$/g, "")}</div>` }, { header: "Riferimenti veloci", raw: `<div class="group">${[500, 1000, 3000, 5000, 10000, 30000, 100000].map(v => `<div class="cell"><div class="body"><div class="t1 num">${yen(v)}</div></div><span class="acc num">${eur(v / r)}</span></div>`).join("")}</div>` }] });
}
function showBig(ja, sub) {
  $("modal").innerHTML = `<div class="show" data-x="1"><div class="ja">${h(ja)}</div>${sub ? `<div class="l2" style="margin-top:18px">${h(sub)}</div>` : ""}<div class="row" style="margin-top:30px">${"speechSynthesis" in window ? `<button class="btn tinted" id="say">Ascolta</button>` : ""}<button class="btn" data-x="1">Chiudi</button></div></div>`;
  $("modal").querySelector(".show").addEventListener("click", e => { if (e.target.dataset.x) closeModal(); });
  const s = $("say"); if (s) s.onclick = () => { try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(ja.replace(/〜|…/g, "")); u.lang = "ja-JP"; u.rate = .85; speechSynthesis.speak(u); } catch (e) {} };
}

/* ============================================================
   EVENTI
   ============================================================ */
document.addEventListener("click", async e => {
  const g = k => e.target.closest(k); let el;
  if ((el = g("[data-tab]"))) { location.hash = el.dataset.tab; return; }
  if ((el = g("[data-open]"))) { e.preventDefault(); S.day = el.dataset.open; S.replan = null; if (MAP) MAP.closePopup(); location.hash === "#day" ? render() : (location.hash = "day"); return; }
  if ((el = g("[data-day]"))) { if (el.dataset.day) { S.day = el.dataset.day; S.replan = null; render(); window.scrollTo(0, 0); } return; }
  if ((el = g("[data-mapday]"))) { e.preventDefault(); S.mapDay = el.dataset.mapday; location.hash === "#map" ? (render(), drawMap()) : (location.hash = "map"); return; }
  if ((el = g("[data-grp]"))) { S.grp = el.dataset.grp; if (el.tagName === "A") return; render(); return; }
  if ((el = g("[data-copy]"))) { try { await navigator.clipboard.writeText(el.dataset.copy); toast("Copiato"); } catch (x) { toast("Non riesco a copiare"); } return; }
  if ((el = g("[data-show]"))) { showBig(el.dataset.show, el.dataset.sub); return; }
  if ((el = g("[data-sugg]"))) { const s = el.dataset.sugg; if (s.startsWith("Traduci")) { const p = $("pic"); if (p) p.click(); } else ask(s); return; }
  if ((el = g("[data-rpq]"))) { const t = $("rpq"); if (t) t.value = el.dataset.rpq; return; }
  if ((el = g("[data-pack]"))) { const l = [...((me() || {}).pack || [])], i = +el.dataset.pack; if (l[i]) { l[i] = { ...l[i], d: !l[i].d }; saveMe({ pack: l }); } return; }
  if ((el = g("[data-unpack]"))) { const l = [...((me() || {}).pack || [])]; l.splice(+el.dataset.unpack, 1); saveMe({ pack: l }); return; }
  if ((el = g("[data-wup]"))) { const ws = myWidgets(), i = +el.dataset.wup; if (i > 0) { [ws[i - 1], ws[i]] = [ws[i], ws[i - 1]]; saveMe({ widgets: ws }); } return; }
  if (!(el = g("[data-act]"))) return;
  const a = el.dataset.act, id = el.dataset.id, find = c => S[c].find(x => x.id === id);
  if (el.tagName === "A") e.preventDefault();
  switch (a) {
    case "signin": signIn(); break;
    case "signout": try { await F.signOut(F.auth); } catch (x) {} location.reload(); break;
    case "unlink": ls.del("cloud"); location.reload(); break;
    case "settings": editSettings(); break;
    case "connect": closeModal(); setTimeout(connectSheet, 200); break;
    case "invite": { const l = inviteLink(); if (!l) break; try { if (navigator.share) await navigator.share({ title: "Giappone 2027", text: "Entra nel viaggio del gruppo:", url: l }); else { await navigator.clipboard.writeText(l); toast("Link copiato: mandalo nel gruppo"); } } catch (x) { if (x && x.name !== "AbortError") { try { await navigator.clipboard.writeText(l); toast("Link copiato"); } catch (y) {} } } break; }
    case "profile": profileSheet(); break;
    case "taxi": taxiSheet(); break;
    case "conv": convSheet(); break;
    case "editday": editDay(el.dataset.date); break;
    case "additem": editItem({}, el.dataset.date); break;
    case "edititem": editItem(find("itin")); break;
    case "toggleitem": { const x = find("itin"); if (x) dbUpd("itin", id, { done: !x.done }); break; }
    case "replan": if (!(S.trip.geminiKey || "").trim()) { toast("Serve la chiave Gemini nelle impostazioni"); editSettings(); break; } S.replan = { date: S.day }; render(); setTimeout(() => { const t = $("rpq"); if (t) { t.focus(); t.scrollIntoView({ block: "center" }); } }, 60); break;
    case "rpclose": S.replan = null; render(); break;
    case "rpgo": doReplan(); break;
    case "rpapply": applyReplan(); break;
    case "addbook": editBook(); break;
    case "editbook": editBook(find("book")); break;
    case "icsbook": { const b = find("book"); if (b) downloadIcs([icsEvent({ title: (BI[b.type] || "") + " " + b.title, start: b.date + (b.time ? "T" + b.time : ""), end: (b.end || b.date) + (b.time ? "T" + b.time : ""), allDay: !b.time, alarm: 120, desc: [b.code ? "Codice: " + b.code : "", b.note || ""].filter(Boolean).join("\n"), loc: b.addr || "" })], "prenotazione"); break; }
    case "addexp": editExp(); break;
    case "editexp": editExp(find("exp")); break;
    case "addvote": editVote(); break;
    case "editvote": editVote(find("votes")); break;
    case "vote": { const v = find("votes"); if (!v) break; const y = new Set(v.yes || []); y.has(S.meId) ? y.delete(S.meId) : y.add(S.meId); dbUpd("votes", id, { yes: [...y] }); break; }
    case "vplan": { const v = find("votes"); if (v) voteToPlan(v); break; }
    case "addcheck": editCheck(); break;
    case "editcheck": editCheck(find("check")); break;
    case "togglecheck": { const x = find("check"); if (x) dbUpd("check", id, { done: !x.done }); break; }
    case "ics": { const c = find("check"); if (c && c.due) downloadIcs([remindEvent(c)], "promemoria"); break; }
    case "icsall": { const l = upcomingReminders(); if (l.length) downloadIcs(l.map(remindEvent), "promemoria-giappone"); break; }
    case "stop": if (aiCtl) aiCtl.abort(); break;
    case "clearchat": S.chat = []; ls.set("chat_" + S.meId, []); render(); break;
  }
});
document.addEventListener("change", e => {
  const t = e.target;
  if (t.id === "pic" && t.files[0]) { pendingImg = t.files[0]; toast("Foto pronta: scrivi una domanda o premi invio"); const q = $("q"); if (q) { q.placeholder = "Foto pronta: cosa vuoi sapere?"; q.focus(); } }
  if (t.dataset && t.dataset.wtog) { const ws = myWidgets().map(w => w.id === t.dataset.wtog ? { ...w, on: t.checked } : w); saveMe({ widgets: ws }); }
});
document.addEventListener("submit", e => {
  const id = e.target.id; if (!["ask", "packform", "welcome"].includes(id)) return; e.preventDefault();
  if (id === "ask") { const q = $("q"), v = q.value.trim(); q.value = ""; ask(v); }
  if (id === "packform") { const t = $("packin"), v = t.value.trim(); if (v) { saveMe({ pack: [...((me() || {}).pack || []), { t: v, d: false }] }); t.value = ""; } }
  if (id === "welcome") { const n = $("wname").value.trim() || "Io"; Store.api.init(n); S.phase = "ready"; Store.api.start(); render(); loadWeather(); }
});
document.addEventListener("keydown", e => { if (e.target.id === "q" && e.key === "Enter" && !e.shiftKey) { e.preventDefault(); $("ask").requestSubmit(); } });
let notesT = null;
document.addEventListener("input", e => {
  const t = e.target, r = rate(), num = v => parseFloat(String(v).replace(/\./g, "").replace(",", "."));
  if (t.id === "cvY") { const v = num(t.value), o = document.querySelectorAll("#cvE"); o.forEach(x => x.value = isNaN(v) ? "" : (v / r).toFixed(2).replace(".", ",")); }
  if (t.id === "cvE") { const v = num(t.value), o = document.querySelectorAll("#cvY"); o.forEach(x => x.value = isNaN(v) ? "" : Math.round(v * r).toLocaleString("it-IT")); }
  if (t.id === "phq") { S.phq = t.value; render(); }
  if (t.id === "q") { t.style.height = "auto"; t.style.height = Math.min(t.scrollHeight, 120) + "px"; }
  if (t.id === "mynotes") { clearTimeout(notesT); const v = t.value; notesT = setTimeout(() => saveMe({ notes: v }), 900); }
});
window.addEventListener("hashchange", () => { render(); });
boot();
