const express = require("express");
const fs = require("fs");
const cors = require("cors");
require("dotenv").config();
const { verifyTrepBurn } = require("./verifyBurn");

const app = express();
const PORT = process.env.PORT || 5000;
const DB_FILE = "./submissions.json";

app.use(cors());
app.use(express.json());

let submissions = [];
if (fs.existsSync(DB_FILE)) {
  submissions = JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
}

app.post("/proof", async (req, res) => {
  try {
    const { addressOrTx, telegramId } = req.body;

    console.log("Incoming /proof request", { addressOrTx, telegramId });

    const result = await verifyBurnProof(addressOrTx, telegramId);

    console.log("Verification result:", result);

    res.json(result);
  } catch (error) {
    console.error("Error in /proof handler:", error);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
});

  // ✅ Verify burn on-chain
  const result = await verifyTrepBurn(addressOrTx);

  if (!result.success) {
    console.log("❌ Burn verification failed:", result.reason);
    return res.json({ success: false, reason: result.reason });
  }

  // ✅ Save verified submission
  const entry = {
    id: Date.now(),
    addressOrTx,
    telegramId,
    verified: true,
    usdValue: result.usd,
    trepAmount: result.amount,
    submittedAt: new Date().toISOString(),
  };

  submissions.push(entry);
  fs.writeFileSync(DB_FILE, JSON.stringify(submissions, null, 2));

  res.json({
    success: true,
    message: "✅ Burn verified!",
    usd: result.usd,
    trep: result.amount,
    entry,
  });
});

app.get("/submissions", (req, res) => {
  res.json(submissions);
});

app.listen(PORT, () => {
  console.log(`🔥 TREP backend running on http://localhost:${PORT}`);
});
