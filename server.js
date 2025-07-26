const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

const { verifyTransfer } = require("./verifyTransfer");
const fs = require("fs");
const path = require("path");

require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000; // ✅ This line fixes the Render port issue

app.use(cors());
app.use(bodyParser.json());

app.post("/proof", async (req, res) => {
  const { addressOrTx, telegramId } = req.body;

  if (!addressOrTx || !telegramId) {
    return res.status(400).json({ success: false, error: "Missing fields" });
  }

  try {
    const result = await verifyTransfer(addressOrTx);
    if (result.success) {
      // Optionally log success
    }
    res.json(result);
  } catch (err) {
    console.error("❌ Error in /proof:", err);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
