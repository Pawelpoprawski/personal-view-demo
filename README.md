# Personal View Demo

Prosta aplikacja demo: **React (Vite)** frontend + **Python (FastAPI)** backend.
Użytkownik loguje się i widzi dashboard dopasowany do swojej roli:
**Client Advisor**, **Management** lub **Specialist**. Wszystkie dane są zmyślone (dummy).

## Struktura

```
react/
├── backend/          # FastAPI: login + dane dashboardu
│   ├── main.py
│   ├── data.py       # dummy użytkownicy i klienci
│   └── requirements.txt
└── frontend/         # React + Vite
    ├── src/
    └── package.json
```

## Wymagania

- Python 3.10+
- Node.js 18+

## Jak uruchomić

Potrzebne są **dwa terminale**.

### 1. Backend (terminal 1)

```bash
cd backend
python -m venv .venv
# Windows:
.venv\Scripts\activate
# Mac/Linux:
# source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Backend działa na http://localhost:8000

### 2. Frontend (terminal 2)

```bash
cd frontend
npm install
npm run dev
```

Otwórz http://localhost:5173 — frontend proxuje `/api` do backendu na porcie 8000.

## Logowanie

Na ekranie startowym są **3 guziki** — Client Advisor, Specialist (Sales), Management.
Kliknięcie loguje na demo konto danej roli (bez hasła).

## Co pokazuje każda rola

- **Client Advisor** — zakładki: Overview, Clients, Revenues, Invested Assets.
  KPI: liczba klientów, invested assets, revenue YTD, NNM YTD, reviews pending.
- **Specialist (Sales)** — zakładki: Proposals (edytowalne pola: status, expected
  volume, comment — przycisk Save zapisuje do backendu), Pipeline (podsumowanie per status).
- **Management** — zakładki: Summary, By Advisor, By Segment — sumaryczne dane
  całego zespołu (AUM, revenues, NNM, pipeline sprzedażowy).

## Uwagi

- Logowanie jest uproszczone (token w pamięci serwera) — to demo, nie produkcja.
- Wszystkie nazwy klientów, kwoty i osoby są fikcyjne.
