# Comparatore Privato — Telco / Luce / Gas (Demo)

Demo React + Vite + Tailwind per un portale privato di confronto offerte (telefonia/Internet, luce, gas) per agente multimandatario & multibrand.

## Avvio rapido
```bash
npm i
npm run dev
```
Apri l'URL locale indicato da Vite.

## Funzioni incluse
- Lista offerte (filtri categoria, ricerca testuale, ordinamento).
- Confronto fino a 3 offerte affiancate.
- Costruttore **Pacchetto** con totale mensile.
- **Upload bollette** (PDF/JPG/PNG) con OCR mock → precompila POD/PDR, kWh/anno, Smc/anno, fasce, CCV.
- **Verifica copertura** con geocoding + coverage mock (API-like).
- **Proposta automatica** di pacchetto (euristica demo).

## Adattatori da collegare in produzione
Vedi `src/App.jsx` sezione `// API ADAPTER (DEMO)`:
- `parseBills(files)` → OCR (Vision/Tesseract) + regex per estrazione.
- `geocodeAddress(addr)` → geocoder (Nominatim/Google/Here).
- `lookupCoverage(coords)` → API copertura (Open Fiber / Flash Fiber / altri).
- `suggestBundle(input)` → motore tariffario con PUN/PSV, CCV, fasce, promo.
