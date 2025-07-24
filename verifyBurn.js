const fetch = require("node-fetch");

const HELIUS_API_KEY = process.env.HELIUS_API_KEY;
const TREP_MINT = "Cf7r9JE9HcHSe1EN3hm6kEjGCyQuV3p6CjuwRx919Tka";
const BURN_ADDRESS = "8LnWsg2pycEZHgvRFF91YrVVv3LDpuxU1i7ECATD9bxF"; // ✅ Updated burn address

async function verifyTrepBurn(txId, minUsd = 1.0) {
  try {
    const txUrl = `https://mainnet.helius.xyz/v0/transactions/?api-key=${HELIUS_API_KEY}`;
    const response = await fetch(txUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transactions: [txId] }),
    });

    const result = await response.json();
    const tx = result[0];
    if (!tx) throw new Error("Transaction not found");

    const transfers = tx.tokenTransfers || [];

    const burn = transfers.find(
      (t) =>
        t.mint === TREP_MINT &&
        t.toUserAccount === BURN_ADDRESS &&
        parseFloat(t.amount) > 0
    );

    if (!burn) {
      return { success: false, reason: "No valid TREP burn found." };
    }

    // ✅ Fetch live TREP price
    const priceRes = await fetch(`https://api.geckoterminal.com/api/v2/simple/networks/solana/token_price/${TREP_MINT}`);
    const priceJson = await priceRes.json();
    const trepUsd = parseFloat(priceJson.data?.attributes?.token_prices?.[TREP_MINT]);

    if (!trepUsd || isNaN(trepUsd)) {
      throw new Error("Could not fetch TREP price");
    }

    const amount = parseFloat(burn.amount);
    const usdValue = amount * trepUsd;

    if (usdValue >= minUsd) {
      return { success: true, amount, usd: parseFloat(usdValue.toFixed(4)) };
    } else {
      return {
        success: false,
        reason: `Burned TREP is only worth $${usdValue.toFixed(2)}. Minimum is $${minUsd}.`,
      };
    }

  } catch (err) {
    console.error("❌ Burn verification failed:", err.message);
    return { success: false, reason: err.message };
  }
}

// ✅ Export it under the name `verifyBurn`
module.exports = { verifyBurn: verifyTrepBurn };
