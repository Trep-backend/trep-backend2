# TREP Backend

A simple Node.js backend for the TREP Telegram Mini App.

## Endpoints

- `/` – Health check
- `/price` – Fetch $TREP token price from GeckoTerminal
- `/proof` – Accepts burn proof submissions (Tx or wallet + Telegram ID)

## Setup

```bash
npm install
npm start