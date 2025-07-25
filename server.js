const express = require("express");
const fs = require("fs");
const cors = require("cors");
require("dotenv").config();
const { verifyBurn } = require("./verifyBurn");
const proofRouter = require("./proof");

const app = express();
app.use(cors());
app.use(express.json());
app.use(proofRouter);

const PORT = process.env.PORT || 5000;
const DB_FILE = "./submissions.json";

// Load existing submissions from file
let submissions = [];
if (fs.existsSync(DB_FILE)) {
  try {
    submissions = JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
  } catch (err) {
    console.error("❌ Failed to load submissions.json:", err.message);
    submissions = [];
  }
}

// ✅ Simple GET /proof — for browser test
app.get("/proof", (req, res) => {
  res.send("✅ TREP backend is live and accepting POSTs at /proof");
});

// ✅ POST /proof — verify burn & log submission
app.post("/proof", async (req, res) => {
  try {
    const { addressOrTx, telegramId } = req.body;
    if (!addressOrTx || !telegramId) {
      return res.status(400).json({ success: false, reason: "Missing addressOrTx or telegramId" });
    }

    console.log("📩 Incoming /proof request:", { addressOrTx, telegramId });

    // ✅ Verify burn on-chain
    const result = await verifyBurn(addressOrTx);

    if (!result.success) {
      console.warn("❌ Burn verification failed:", result.reason);
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

    console.log("✅ Verified and saved entry:", entry);

    res.json({
      success: true,
      message: "✅ Burn verified!",
      usd: result.usd,
      trep: result.amount,
      entry,
    });
  } catch (error) {
    console.error("❌ Internal server error in /proof:", error);
    res.status(500).json({ success: false, error: "Internal Server Error", details: error.message });
  }
});

// ✅ GET /submissions — list all verified submissions
app.get("/submissions", (req, res) => {
  res.json(submissions);
});

// ✅ Start server
app.listen(PORT, () => {
  console.log(`🔥 TREP backend running on http://localhost:${PORT}`);
});
