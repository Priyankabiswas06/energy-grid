const express = require("express");
const crypto = require("crypto");

const app = express();
app.use(express.json());

const SECRET_TOKEN = "interview_token_123";
let lastRequestTime = 0;

/**
 * Rate Limiter Middleware
 * Allows only 1 request per second
 */
app.use((req, res, next) => {
  const now = Date.now();
  if (now - lastRequestTime < 950) {
    return res
      .status(429)
      .json({ error: "Too Many Requests. Limit: 1 req/sec." });
  }
  lastRequestTime = now;
  next();
});

/**
 * Signature Validation Middleware
 * signature = MD5(url + token + timestamp)
 */
app.use((req, res, next) => {
  const signature = req.headers["signature"];
  const timestamp = req.headers["timestamp"];
  const url = req.originalUrl;

  if (!signature || !timestamp) {
    return res
      .status(401)
      .json({ error: "Missing signature or timestamp header" });
  }

  const expectedSignature = crypto
    .createHash("md5")
    .update(url + SECRET_TOKEN + timestamp)
    .digest("hex");

  if (signature !== expectedSignature) {
    return res.status(401).json({ error: "Invalid Signature" });
  }

  next();
});

/**
 * API Endpoint
 * POST /device/real/query
 */
app.post("/device/real/query", (req, res) => {
  const { sn_list } = req.body;

  if (!Array.isArray(sn_list)) {
    return res.status(400).json({ error: "sn_list must be an array" });
  }

  if (sn_list.length > 10) {
    return res
      .status(400)
      .json({ error: "Batch size exceeded (Max 10)" });
  }

  const results = sn_list.map((sn) => ({
    sn,
    power: (Math.random() * 5).toFixed(2) + " kW",
    status: Math.random() > 0.1 ? "Online" : "Offline",
    last_updated: new Date().toISOString(),
  }));

  res.json({ data: results });
});

app.listen(3000, () => {
  console.log("⚡ EnergyGrid Mock API running on port 3000");
  console.log("   Constraints: 1 req/sec, Max 10 items/batch");
});
