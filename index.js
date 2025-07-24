const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const fetch = require("node-fetch");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());

console.log("🔥 TREP backend running on port", PORT);

// ✅ Health check
app.get("/", (req, res) => {
  res.send("✅ TREP backend is running.");
});

// ✅ Updated endpoint to fetch TREP/USD from GeckoTerminal using token address
app.get("/price", async (req, res) => {
  try {
    const response = await fetch(
      "https://api.geckoterminal.com/api/v2/simple/networks/solana/token_price/Cf7r9JE9HcHSe1EN3hm6kEjGCyQuV3p6CjuwRx919Tka"
    );
    const json = await response.json();

    const price = parseFloat(
      json.data?.attributes?.token_prices?.Cf7r9JE9HcHSe1EN3hm6kEjGCyQuV3p6CjuwRx919Tka
    );

    if (!price) throw new Error("Price unavailable");
    res.json({ success: true, trepUsd: price });
  } catch (err) {
    console.error("❌ GeckoTerminal fetch failed:", err.message);
    res.json({ success: false, error: "Failed to fetch TREP price" });
  }
});

// ✅ Submit proof (burn TX or wallet)
app.post("/proof", async (req, res) => {
  const { addressOrTx, telegramId } = req.body;

  console.log("🆕 New submission:");
  console.log("Wallet or Tx:", addressOrTx);
  console.log("Telegram ID:", telegramId || "unknown");

  res.json({ success: true });
});

app.listen(PORT);
