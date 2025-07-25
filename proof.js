// proof.js (CommonJS version)
const express = require("express");
const fetch = require("node-fetch");

const router = express.Router();
const VAULT_ADDRESS = "7j5a96YFJ2DSCHvE7LFB9CZKtr42gpiSiMLQavd3CBB5";
const TREP_MINT = "Cf7r9JE9HcHSe1EN3hm6kEjGCyQuV3p6CjuwRx919Tka";
const MIN_AMOUNT = 1.0;
const HELIUS_API_KEY = process.env.HELIUS_API_KEY;

router.post("/proof", async (req, res) => {
  const { addressOrTx, telegramId } = req.body;

  if (!addressOrTx) {
    return res.status(400).json({ success: false, error: "Missing transaction ID" });
  }

  try {
    const txUrl = `https://mainnet.helius.xyz/v0/transactions/?api-key=${HELIUS_API_KEY}`;
    const txRes = await fetch(txUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transactions: [addressOrTx] })
    });

    const txData = await txRes.json();
    const parsedTx = txData[0];

    if (!parsedTx || parsedTx.description !== "SUCCESS") {
      return res.status(400).json({ success: false, error: "Invalid or unconfirmed transaction" });
    }

    const transfers = parsedTx.tokenTransfers || [];

    const validTransfer = transfers.find(t =>
      t.destination === VAULT_ADDRESS &&
      t.mint === TREP_MINT &&
      parseFloat(t.amount) >= MIN_AMOUNT
    );

    if (!validTransfer) {
      return res.status(400).json({ success: false, error: "No valid TREP transfer found" });
    }

    console.log("✅ Verified payment from:", validTransfer.source, "Telegram ID:", telegramId);

    return res.json({ success: true });
  } catch (err) {
    console.error("❌ Error verifying proof:", err);
    return res.status(500).json({ success: false, error: "Server error" });
  }
});

module.exports = router;
