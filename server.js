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

    console.log("Incoming /proof request", { addressOr
