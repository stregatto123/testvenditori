# Documento riassuntivo modifiche (changelog)
**Data:** 2025-09-18

- **UI Refresh**: header con gradiente, cards con hover e tipografia migliorata, layout max-w-7xl.
- **Offerte reali d'esempio**: iliad, TIM, Vodafone (Internet); Enel, Edison, A2A (Luce); Edison, A2A (Gas) con link fonte e note.
- **Confronto**: tabella a 3 colonne (fino a 3 offerte) con righe alternate.
- **Pacchetto personalizzato**: somma totale e CTA per salvataggio/PDF (mock).
- **Modulo cliente**: nome, CAP, comune, via, civico, POD/PDR, kWh/anno, Smc/anno, note.
- **Upload bollette**: multi-file con OCR **mock** che precompila POD/PDR/consumi/fasce/CCV.
- **Verifica copertura**: geocoding + coverage **mock** (API-like) con esito FTTH/FTTC, provider e velocità stimata; filtro “Solo FTTH” automatico.
- **Proposta automatica**: `suggestBundle()` scegliendo offerte minime per categoria (vincolabile a FTTH).
- **Reset** globale dello stato (cliente, bollette, copertura, filtri, pacchetto, confronto).
