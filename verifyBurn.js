const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const HELIUS_API_KEY = process.env.HELIUS_API_KEY;
const TREP_MINT = "Cf7r9JE9HcHSe1EN3hm6kEjGCyQuV3p6CjuwRx919Tka";
const BURN_ADDRESS = "8LnWsg2pycEZHgvRFF91YrVVv3LDpuxU1i7ECATD9bxF"; // ✅ Correct burn address

async function verifyBurn(txId, minUsd = 1.0) {
  try {
    // ✅ 1. Corrected Helius endpoint
    const heliusUrl = `https://api.helius.xyz/v0/transactions/?api-key=${HELIUS_API_KEY}`;
    const txRes = await fetch(heliusUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transactions: [txId] }),
    });

    if (!txRes.ok) {
      throw new Error(`Helius error: ${txRes.status} ${txRes.statusText}`);
    }

    const txJson = await txRes.json();

if (!Array.isArray(txJson) || txJson.length === 0) {
  console.error("❌ Helius returned empty or invalid response:", JSON.stringify(txJson));
  throw new Error("Transaction not found or missing in Helius response");
}

const tx = txJson[0];

    const transfers = tx.tokenTransfers || [];
    const burnTransfer = transfers.find(
      (t) =>
        t.mint === TREP_MINT &&
        t.toUserAccount === BURN_ADDRESS &&
        parseFloat(t.amount) > 0
    );

    if (!burnTransfer) {
      return { success: false, reason: "No valid TREP burn found in transaction." };
    }

    const amount = parseFloat(burnTransfer.amount);

    // ✅ 2. Live TREP price from GeckoTerminal
    const priceUrl = `https://api.geckoterminal.com/api/v2/simple/networks/solana/token_price/${TREP_MINT}`;
    const priceRes = await fetch(priceUrl);

    if (!priceRes.ok) {
      throw new Error(`Failed to fetch price: ${priceRes.status}`);
    }

    const priceJson = await priceRes.json();
    const trepUsd = parseFloat(
      priceJson?.data?.attributes?.token_prices?.[TREP_MINT]
    );

    if (!trepUsd || isNaN(trepUsd)) {
      throw new Error("TREP price unavailable or invalid");
    }

    const usdValue = amount * trepUsd;

    if (usdValue >= minUsd) {
      return {
        success: true,
        amount,
        usd: parseFloat(usdValue.toFixed(4)),
      };
    } else {
      return {
        success: false,
        reason: `Burned TREP value is $${usdValue.toFixed(
          2
        )}, which is below the $${minUsd} minimum.`,
      };
    }
  } catch (err) {
    console.error("❌ Burn verification failed:", err.message);
    return { success: false, reason: err.message };
  }
}

module.exports = { verifyBurn };
