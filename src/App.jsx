import React, { useMemo, useState } from "react";

// ===========================
// Demo Comparatore — Telco / Luce / Gas (con Upload Bollette + Copertura "API-like")
// ===========================
// NOTE: Demo con adapter simulati. Sostituisci i metodi in "// API ADAPTER" con
// chiamate reali (OCR, geocoding, coverage provider). Le UI sono già pronte.

// ---------------------------
// DATI DI ESEMPIO OFFERTE
// ---------------------------
const DATA = [
  // --- TELCO (Fibra) ---
  { id: "telco-iliad-fibra", category: "telco", provider: "iliad", plan: "iliadbox super (Fibra fino a 5 Gbps)", monthly: 25.99, promoNote: "21,99€/mese se anche cliente mobile TOP Plus (per sempre)", speed: "fino a 5 Gbps", lockin: 0, activation: "0€", type: "FTTH", source: "https://www.iliad.it/offerte-iliad-fibra.html", asOf: "2025-09-17" },
  { id: "telco-tim-wifi-casa", category: "telco", provider: "TIM", plan: "TIM WiFi Casa (opzioni fino a 10 Gbps)", monthly: 34.90, promoNote: "Da 24,90€ per clienti mobile; 34,90€ per 10 Gbps", speed: "fino a 10 Gbps", lockin: 24, activation: "39,90€", type: "FTTH", source: "https://www.tim.it/fisso-e-mobile/fibra-e-adsl/fibra-internet-casa", asOf: "2025-09-17" },
  { id: "telco-voda-internet-unlimited", category: "telco", provider: "Vodafone", plan: "Internet Unlimited Smart", monthly: 27.95, promoNote: "23,95€/mese se già cliente mobile", speed: "fino a 1 Gbps", lockin: 24, activation: "Gratis", type: "FTTH/FTTC", source: "https://www.vodafone.it/", asOf: "2025-09-07" },

  // --- LUCE ---
  { id: "luce-enel-formidabile", category: "luce", provider: "Enel Energia", plan: "Formidabile Luce (fasce – notte 0€ fino 140kWh)", monthly: 12.0, promoNote: "CCV 12€/POD/mese + energia: 0,00€/kWh 00:00–07:00 (fino 140kWh/mese), 0,162€/kWh altre ore (perdite incluse)", lockin: 12, activation: "Online", type: "Monoraria/Fasce", source: "https://www.enel.it/it-it/offerte-luce", asOf: "2025-09-17" },
  { id: "luce-edison-dynamic", category: "luce", provider: "Edison Energia", plan: "Dynamic Luce (indicizzata PUN)", monthly: 37.5, promoNote: "Indicizzata PUN + 0,026€/kWh (stima media, consumi dipendenti)", lockin: 0, activation: "Online", type: "Indicizzata", source: "https://luce-gas.it/fornitori/edison/offerte", asOf: "2025-07-31" },
  { id: "luce-a2a-full", category: "luce", provider: "A2A Energia", plan: "A2A Full (prezzo fisso 24 mesi)", monthly: 0.0, promoNote: "Prezzo fisso 24 mesi (valore da simulare) + promo fino a 120€", lockin: 24, activation: "Online", type: "Fissa 24 mesi", source: "https://www.a2a.it/casa/offerte-luce-gas", asOf: "2025-09-17" },

  // --- GAS ---
  { id: "gas-edison-dynamic", category: "gas", provider: "Edison Energia", plan: "Dynamic Gas (indicizzata PSV)", monthly: 21.6, promoNote: "Indicizzata PSV + 0,145€/Smc (stima media)", lockin: 0, activation: "Online", type: "Indicizzata", source: "https://luce-gas.it/fornitori/edison/offerte", asOf: "2025-07-31" },
  { id: "gas-a2a-noi2", category: "gas", provider: "A2A Energia", plan: "Noi2 (70% fisso 10 anni, 30% indicizzato)", monthly: 0.0, promoNote: "Struttura mista, valori da simulatore A2A", lockin: 0, activation: "Online", type: "Mista lunga durata", source: "https://www.a2a.it/casa/offerte-luce-gas", asOf: "2025-09-17" },
];

// ---------------------------
// API ADAPTER (DEMO)
// ---------------------------
// 🔁 Sostituisci le funzioni sottostanti con integrazioni reali.
// • parseBills(files): OCR delle bollette (estrai POD/PDR, kWh/anno, Smc/anno, fasce, CCV).
// • geocodeAddress(addr): geocoding per normalizzare indirizzo e ottenere coordinate.
// • lookupCoverage(coords): verifica copertura FTTH/FTTC e reti disponibili.
// • suggestBundle(input): algoritmo tariffario su PUN/PSV + profili consumo.

async function parseBills(files) {
  await sleep(800);
  const hasLuce = files.some((f) => /luce|energia/i.test(f.name));
  const hasGas = files.some((f) => /gas/i.test(f.name));
  return {
    pod: hasLuce ? "IT001E1234567890" : undefined,
    pdr: hasGas ? "IT50PDR123456789" : undefined,
    kwhAnno: hasLuce ? 2900 : undefined,
    smcAnno: hasGas ? 1000 : undefined,
    fasce: hasLuce ? { F1: 35, F23: 65 } : undefined,
    ccv: hasLuce ? 12 : undefined,
  };
}

async function geocodeAddress({ cap, comune, via, civico }) {
  await sleep(600);
  if (!cap || !/^[0-9]{5}$/.test(cap)) throw new Error("CAP non valido");
  const lat = 44.30 + Math.random() * 0.05;
  const lon = 8.48 + Math.random() * 0.05;
  return { lat, lon, normalized: `${via || "Via"} ${civico || "1"}, ${comune || "Comune"} ${cap}` };
}

async function lookupCoverage({ lat, lon }) {
  await sleep(900);
  const ftth = Math.random() < 0.6;
  return {
    tech: ftth ? "FTTH" : "FTTC/VDSL",
    providers: ftth
      ? [
          { name: "Open Fiber", note: "Rete wholesale FTTH" },
          { name: "Flash Fiber (TIM)", note: "Rete FTTH TIM/wholesale" },
        ]
      : [
          { name: "TIM", note: "VDSL profilo 35b" },
          { name: "Vodafone", note: "FTTC cabinet vicino" },
        ],
    maxSpeed: ftth ? "1000–5000 Mbps" : "100–200 Mbps",
    reliability: ftth ? "alta" : "media",
  };
}

async function suggestBundle({ preferFtth, kwhAnno, smcAnno }) {
  await sleep(500);
  const telco = DATA.filter((d) => d.category === "telco" && d.monthly > 0)
    .filter((d) => (preferFtth ? (d.type || "").toUpperCase().includes("FTTH") : true))
    .sort((a, b) => a.monthly - b.monthly)[0];
  const luce = DATA.filter((d) => d.category === "luce" && d.monthly > 0).sort((a, b) => a.monthly - b.monthly)[0];
  const gas = DATA.filter((d) => d.category === "gas" && d.monthly > 0).sort((a, b) => a.monthly - b.monthly)[0];
  return [telco?.id, luce?.id, gas?.id].filter(Boolean);
}

function sleep(ms) { return new Promise((res) => setTimeout(res, ms)); }

// ---------------------------
// UI HELPERS
// ---------------------------
const EUR = (n) => (n === 0 ? "—" : n.toLocaleString("it-IT", { style: "currency", currency: "EUR" }));

function Badge({ children, className = "" }) {
  return (<span className={`inline-flex items-center rounded-full px-3 py-0.5 text-xs font-semibold shadow-sm ${className}`}>{children}</span>);
}

function Section({ title, children, right }) {
  return (
    <div className="mb-10">
      <div className="flex items-center justify-between mb-4 border-b pb-2">
        <h2 className="text-xl font-bold text-gray-800 tracking-tight flex items-center gap-2">
          <span className="w-1.5 h-6 bg-indigo-600 rounded-full"></span>
          {title}
        </h2>
        {right}
      </div>
      {children}
    </div>
  );
}

function Spinner({ className = "w-4 h-4" }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
    </svg>
  );
}

export default function App() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [compareIds, setCompareIds] = useState([]);
  const [packageIds, setPackageIds] = useState([]);
  const [sortKey, setSortKey] = useState("monthly");

  // Dati cliente
  const [client, setClient] = useState({ nome: "", cap: "", comune: "", via: "", civico: "", pod: "", pdr: "", kwhAnno: "", smcAnno: "", note: "" });
  const [uploadedBills, setUploadedBills] = useState([]);
  const [isParsing, setIsParsing] = useState(false);

  // Copertura reale
  const [coverage, setCoverage] = useState({ status: "unknown", tech: null, providers: [], maxSpeed: null, reliability: null, note: "" });
  const [isCoverLoading, setIsCoverLoading] = useState(false);
  const [telcoOnlyFtth, setTelcoOnlyFtth] = useState(false);

  const filtered = useMemo(() => {
    let arr = DATA.filter((d) => (category === "all" ? true : d.category === category))
      .filter((d) => (d.plan + d.provider + d.type).toLowerCase().includes(query.toLowerCase()));
    if (category === "telco" && telcoOnlyFtth) arr = arr.filter((d) => (d.type || "").toUpperCase().includes("FTTH"));
    return arr.sort((a, b) => (sortKey === "monthly" ? (a.monthly || 0) - (b.monthly || 0) : (a.lockin || 0) - (b.lockin || 0)));
  }, [query, category, sortKey, telcoOnlyFtth]);

  const compare = useMemo(() => DATA.filter((d) => compareIds.includes(d.id)), [compareIds]);
  const bundle = useMemo(() => DATA.filter((d) => packageIds.includes(d.id)), [packageIds]);
  const bundleMonthly = useMemo(() => bundle.reduce((s, x) => s + (x.monthly || 0), 0), [bundle]);

  const toggleCompare = (id) => setCompareIds((p) => (p.includes(id) ? p.filter((x) => x !== id) : p.length >= 3 ? p : [...p, id]));
  const togglePackage = (id) => setPackageIds((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const proposeBest = async () => {
    const ids = await suggestBundle({ preferFtth: telcoOnlyFtth || (coverage.tech === 'FTTH'), kwhAnno: +client.kwhAnno || undefined, smcAnno: +client.smcAnno || undefined });
    setPackageIds(ids);
    alert("Pacchetto proposto (demo). Con algoritmi tariffari reali useremo PUN/PSV, CCV, fasce e promo.");
  };

  const onBillsUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    setUploadedBills(files);
    if (files.length === 0) return;
    try {
      setIsParsing(true);
      const res = await parseBills(files);
      setClient((c) => ({
        ...c,
        pod: res.pod || c.pod,
        pdr: res.pdr || c.pdr,
        kwhAnno: res.kwhAnno?.toString() || c.kwhAnno,
        smcAnno: res.smcAnno?.toString() || c.smcAnno,
        note: c.note || (res.fasce ? `Fasce: F1 ${res.fasce.F1}% / F23 ${res.fasce.F23}%` : c.note),
      }));
    } catch (err) {
      alert("Errore lettura bollette (demo): " + err.message);
    } finally {
      setIsParsing(false);
    }
  };

  const checkCoverage = async () => {
    try {
      setIsCoverLoading(true);
      const geo = await geocodeAddress({ cap: client.cap, comune: client.comune, via: client.via, civico: client.civico });
      const cov = await lookupCoverage(geo);
      setCoverage({ status: "ok", ...cov, note: `Indirizzo: ${geo.normalized}` });
      setCategory("telco");
      setTelcoOnlyFtth(cov.tech === 'FTTH');
    } catch (err) {
      setCoverage({ status: "error", tech: null, providers: [], maxSpeed: null, reliability: null, note: err.message || "Errore copertura" });
    } finally {
      setIsCoverLoading(false);
    }
  };

  const resetAll = () => {
    setClient({ nome: "", cap: "", comune: "", via: "", civico: "", pod: "", pdr: "", kwhAnno: "", smcAnno: "", note: "" });
    setUploadedBills([]);
    setCoverage({ status: "unknown", tech: null, providers: [], maxSpeed: null, reliability: null, note: "" });
    setTelcoOnlyFtth(false);
    setCompareIds([]);
    setPackageIds([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-slate-50 text-gray-900 font-sans">
      {/* HEADER */}
      <header className="sticky top-0 z-20 shadow">
        <div className="bg-gradient-to-r from-indigo-700 via-indigo-800 to-indigo-900">
          <div className="max-w-7xl mx-auto px-6 py-6 text-white">
            <div className="flex items-center gap-3">
              <div className="text-3xl font-extrabold tracking-tight drop-shadow">⚡ Comparatore Privato</div>
              <Badge className="bg-white/20 text-white">Demo</Badge>
              <div className="text-xs ml-2 opacity-80">Telco · Luce · Gas</div>
            </div>
            <div className="mt-2 text-sm opacity-90">Confronto rapido · Pacchetti personalizzati · Fonti verificate</div>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="🔍 Cerca provider o piano…" className="w-72 rounded-xl border border-white/20 bg-white/10 placeholder-white/70 px-3 py-2 text-sm focus:outline-none focus:ring focus:ring-white/30" />
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm">
                <option value="all">Tutte</option>
                <option value="telco">Internet Casa</option>
                <option value="luce">Luce</option>
                <option value="gas">Gas</option>
              </select>
              <select value={sortKey} onChange={(e) => setSortKey(e.target.value)} className="rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm">
                <option value="monthly">Ordina per costo mensile</option>
                <option value="lockin">Ordina per vincolo</option>
              </select>
              {category === 'telco' && (
                <label className="ml-2 text-xs flex items-center gap-2">
                  <input type="checkbox" checked={telcoOnlyFtth} onChange={(e)=>setTelcoOnlyFtth(e.target.checked)} />
                  Solo FTTH
                </label>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* MAIN */}
      <main className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* LISTA OFFERTE */}
        <div className="lg:col-span-2">
          <Section title={category === "all" ? "Tutte le offerte" : category === "telco" ? "Internet Casa" : category === "luce" ? "Luce" : "Gas"} right={<span className="text-sm text-gray-500">{filtered.length} risultati</span>}>
            <div className="grid sm:grid-cols-2 gap-6">
              {filtered.map((o) => (
                <div key={o.id} className="rounded-2xl border bg-white p-5 shadow-lg hover:shadow-2xl transition transform hover:-translate-y-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-semibold text-lg text-indigo-700">{o.provider}</div>
                      <div className="text-sm font-medium text-gray-800">{o.plan}</div>
                      <div className="text-xs text-gray-500 mt-1">{o.type} · {o.speed || "—"} · Agg.: {o.asOf}</div>
                    </div>
                    <button onClick={() => toggleCompare(o.id)} className={`text-xs rounded-full px-3 py-1 border transition-colors ${compareIds.includes(o.id) ? "bg-indigo-600 text-white border-indigo-600" : "bg-white hover:bg-gray-50"}`}>
                      {compareIds.includes(o.id) ? "In confronto" : "+ Confronta"}
                    </button>
                  </div>

                  <div className="flex items-end justify-between mt-4">
                    <div>
                      <div className="text-3xl font-extrabold text-gray-900 tracking-tight">{EUR(o.monthly)}/mese</div>
                      <div className="text-xs text-gray-600 mt-2 italic">{o.promoNote}</div>
                    </div>
                    <div className="text-right text-xs text-gray-600">
                      <div>Vincolo: {o.lockin ? `${o.lockin} mesi` : "nessuno"}</div>
                      <div>Attivazione: {o.activation}</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-4">
                    <a href={o.source} target="_blank" rel="noreferrer" className="text-sm text-indigo-600 underline">Fonte / Dettagli</a>
                    <button onClick={() => togglePackage(o.id)} className={`rounded-xl px-4 py-1.5 text-sm font-medium transition-colors ${packageIds.includes(o.id) ? "bg-green-600 text-white border border-green-600" : "bg-white border hover:bg-gray-50"}`}>
                      {packageIds.includes(o.id) ? "Nel pacchetto" : "Aggiungi al pacchetto"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        </div>

        {/* COLONNA DESTRA */}
        <div className="lg:col-span-1 space-y-8">
          {/* DATI CLIENTE + UPLOAD + COPERTURA */}
          <Section title="Dati cliente, bollette & copertura" right={<Badge className="bg-indigo-100 text-indigo-800">Demo</Badge>}>
            <div className="rounded-2xl border bg-white p-5 shadow-md space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-xs text-gray-600">Nome e Cognome</label>
                  <input value={client.nome} onChange={(e) => setClient({ ...client, nome: e.target.value })} className="mt-1 w-full rounded-xl border px-3 py-2 text-sm focus:ring focus:ring-indigo-200" placeholder="Mario Rossi" />
                </div>
                <div>
                  <label className="text-xs text-gray-600">CAP</label>
                  <input value={client.cap} onChange={(e) => setClient({ ...client, cap: e.target.value })} className="mt-1 w-full rounded-xl border px-3 py-2 text-sm focus:ring focus:ring-indigo-200" placeholder="17100" />
                </div>
                <div>
                  <label className="text-xs text-gray-600">Comune</label>
                  <input value={client.comune} onChange={(e) => setClient({ ...client, comune: e.target.value })} className="mt-1 w-full rounded-xl border px-3 py-2 text-sm focus:ring focus:ring-indigo-200" placeholder="Savona" />
                </div>
                <div>
                  <label className="text-xs text-gray-600">Via</label>
                  <input value={client.via} onChange={(e) => setClient({ ...client, via: e.target.value })} className="mt-1 w-full rounded-xl border px-3 py-2 text-sm focus:ring focus:ring-indigo-200" placeholder="Via Roma" />
                </div>
                <div>
                  <label className="text-xs text-gray-600">Civico</label>
                  <input value={client.civico} onChange={(e) => setClient({ ...client, civico: e.target.value })} className="mt-1 w-full rounded-xl border px-3 py-2 text-sm focus:ring focus:ring-indigo-200" placeholder="10" />
                </div>
                <div>
                  <label className="text-xs text-gray-600">POD (luce)</label>
                  <input value={client.pod} onChange={(e) => setClient({ ...client, pod: e.target.value })} className="mt-1 w-full rounded-xl border px-3 py-2 text-sm" placeholder="IT001E…" />
                </div>
                <div>
                  <label className="text-xs text-gray-600">PDR (gas)</label>
                  <input value={client.pdr} onChange={(e) => setClient({ ...client, pdr: e.target.value })} className="mt-1 w-full rounded-xl border px-3 py-2 text-sm" placeholder="IT50PDR…" />
                </div>
                <div>
                  <label className="text-xs text-gray-600">Consumo Luce (kWh/anno)</label>
                  <input value={client.kwhAnno} onChange={(e) => setClient({ ...client, kwhAnno: e.target.value })} className="mt-1 w-full rounded-xl border px-3 py-2 text-sm" placeholder="2700" />
                </div>
                <div>
                  <label className="text-xs text-gray-600">Consumo Gas (Smc/anno)</label>
                  <input value={client.smcAnno} onChange={(e) => setClient({ ...client, smcAnno: e.target.value })} className="mt-1 w-full rounded-xl border px-3 py-2 text-sm" placeholder="900" />
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-gray-600">Note</label>
                  <textarea value={client.note} onChange={(e) => setClient({ ...client, note: e.target.value })} className="mt-1 w-full rounded-xl border px-3 py-2 text-sm" placeholder="Tecnologia desiderata, operatore attuale, vincoli, ecc." />
                </div>
              </div>

              {/* Upload bollette + OCR */}
              <div className="space-y-2">
                <label className="text-xs text-gray-600">Carica bollette (PDF/JPG/PNG)</label>
                <input type="file" multiple accept="application/pdf,image/*" onChange={onBillsUpload} className="block w-full text-sm" />
                {uploadedBills.length > 0 && (
                  <div className="text-xs text-gray-600 flex items-center gap-2">
                    {isParsing ? (<><Spinner /> <span>Estrazione dati bollette…</span></>) : (<span>{uploadedBills.length} file selezionati · POD/PDR/consumi aggiornati</span>)}
                  </div>
                )}
              </div>

              {/* Copertura reale */}
              <div className="rounded-xl border bg-slate-50 p-3 space-y-2">
                <div className="text-sm font-medium">Verifica copertura Internet (geocoding + coverage)</div>
                <div className="flex items-center gap-2">
                  <button onClick={checkCoverage} disabled={isCoverLoading} className={`rounded-xl px-3 py-1.5 text-sm font-medium text-white ${isCoverLoading ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'}`}>
                    {isCoverLoading ? 'Verifico…' : 'Verifica copertura reale'}
                  </button>
                  {coverage.status !== 'unknown' && (
                    <>
                      {coverage.status === 'ok' ? (
                        <span className="text-xs px-2 py-1 rounded-full border bg-green-50 text-green-700 border-green-200">{coverage.tech}</span>
                      ) : (
                        <span className="text-xs px-2 py-1 rounded-full border bg-amber-50 text-amber-800 border-amber-200">Attenzione</span>
                      )}
                      <span className="text-xs text-gray-600">{coverage.note}</span>
                    </>
                  )}
                </div>
                {coverage.providers?.length > 0 && (
                  <ul className="mt-2 text-xs text-gray-700 list-disc pl-5">
                    {coverage.providers.map((p, i) => (
                      <li key={i}><span className="font-semibold">{p.name}</span>{p.note ? ` — ${p.note}` : ''}</li>
                    ))}
                  </ul>
                )}
                {coverage.maxSpeed && (
                  <div className="text-xs text-gray-600">Velocità stimata: <span className="font-semibold">{coverage.maxSpeed}</span> · Affidabilità: {coverage.reliability}</div>
                )}
                {category === 'telco' && (
                  <label className="mt-2 text-xs flex items-center gap-2">
                    <input type="checkbox" checked={telcoOnlyFtth} onChange={(e)=>setTelcoOnlyFtth(e.target.checked)} />
                    Filtra Telco: solo FTTH
                  </label>
                )}
              </div>

              <div className="flex gap-2 pt-1">
                <button onClick={proposeBest} className="flex-1 rounded-xl px-3 py-2 text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 shadow">Proponi offerta migliore</button>
                <button onClick={resetAll} className="rounded-xl px-3 py-2 text-sm border hover:bg-gray-50">Reset</button>
              </div>
            </div>
          </Section>

          {/* PACCHETTO */}
          <Section title="Pacchetto personalizzato" right={<Badge className="bg-indigo-100 text-indigo-800">{packageIds.length} offerte</Badge>}>
            <div className="rounded-2xl border bg-white p-5 shadow-md">
              {bundle.length === 0 ? (
                <div className="text-sm text-gray-500 italic">Aggiungi offerte per creare un pacchetto (es. 1 Telco + 1 Luce + 1 Gas).</div>
              ) : (
                <ul className="space-y-3">
                  {bundle.map((b) => (
                    <li key={b.id} className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{b.provider} · {b.plan}</div>
                        <div className="text-xs text-gray-500">{b.category.toUpperCase()} · {b.type}</div>
                      </div>
                      <div className="text-sm font-semibold text-indigo-700">{EUR(b.monthly)}</div>
                    </li>
                  ))}
                </ul>
              )}
              <hr className="my-4" />
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-gray-700">Totale mensile stimato</div>
                <div className="text-2xl font-extrabold text-indigo-700">{EUR(bundleMonthly)}</div>
              </div>
              <button className="mt-4 w-full rounded-xl border px-3 py-2 text-sm font-medium hover:bg-gray-50 transition" onClick={() => alert("Demo: qui potresti salvare il pacchetto o generare un preventivo PDF.")}>💾 Salva pacchetto / PDF</button>
            </div>
          </Section>

          {/* CONFRONTO */}
          <Section title="Confronto rapido" right={<Badge className="bg-indigo-100 text-indigo-800">{compareIds.length}/3</Badge>}>
            {compare.length === 0 ? (
              <div className="text-sm text-gray-500 italic">Seleziona fino a 3 offerte e confrontale qui.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm border rounded-lg overflow-hidden">
                  <thead>
                    <tr className="bg-indigo-50">
                      <th className="p-2 text-left">Caratteristica</th>
                      {compare.map((c) => (
                        <th key={c.id} className="p-2 text-left">
                          <div className="font-semibold text-indigo-700">{c.provider}</div>
                          <div className="text-xs text-gray-600">{c.plan}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="p-2">Categoria</td>
                      {compare.map((c) => (<td key={c.id} className="p-2">{c.category.toUpperCase()}</td>))}
                    </tr>
                    <tr className="border-b bg-gray-50">
                      <td className="p-2">Costo/mese</td>
                      {compare.map((c) => (<td key={c.id} className="p-2 font-semibold text-indigo-700">{EUR(c.monthly)}</td>))}
                    </tr>
                    <tr className="border-b">
                      <td className="p-2">Velocità / Tipo</td>
                      {compare.map((c) => (<td key={c.id} className="p-2">{c.speed || "—"} · {c.type}</td>))}
                    </tr>
                    <tr className="border-b bg-gray-50">
                      <td className="p-2">Vincolo</td>
                      {compare.map((c) => (<td key={c.id} className="p-2">{c.lockin ? `${c.lockin} mesi` : "Nessuno"}</td>))}
                    </tr>
                    <tr>
                      <td className="p-2">Fonte</td>
                      {compare.map((c) => (<td key={c.id} className="p-2 underline text-indigo-600"><a href={c.source} target="_blank" rel="noreferrer">Apri</a></td>))}
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </Section>

          {/* NOTE LEGALI */}
          <Section title="Note legali (demo)">
            <p className="text-xs text-gray-600 leading-relaxed italic">
              I prezzi e le condizioni sono indicativi e basati su fonti pubbliche al <strong>17/09/2025</strong>. Verifica sempre copertura, oneri,
              costi di attivazione, modem, contributi fissi (es. CCV/POD), imposte e IVA. Per l'energia, le stime dipendono dai consumi reali e dai valori PUN/PSV; l'andamento ARERA può influire sui costi finali.
            </p>
          </Section>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="border-t bg-white shadow-inner">
        <div className="max-w-7xl mx-auto px-6 py-6 text-xs text-gray-500 text-center">
          © {new Date().getFullYear()} Portal Demo · Multimandatario & Multibrand · <span className="text-indigo-600">Real‑time ready</span>
        </div>
      </footer>
    </div>
  );
}
