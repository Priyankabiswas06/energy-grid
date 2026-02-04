const crypto = require("crypto");
const fs = require("fs");

const API_URL = "http://localhost:3000/device/real/query";
const TOKEN = "interview_token_123";

console.log("🚀 Client started");

/**
 * Generate MD5 signature
 */
function generateSignature(url, token, timestamp) {
  return crypto
    .createHash("md5")
    .update(url + token + timestamp)
    .digest("hex");
}

/**
 * Generate 500 serial numbers
 */
function generateSerialNumbers() {
  const list = [];
  for (let i = 0; i < 500; i++) {
    list.push(`SN-${i.toString().padStart(3, "0")}`);
  }
  return list;
}

/**
 * Split array into chunks of 10
 */
function chunkArray(array, size) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Sleep helper
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * MAIN FUNCTION
 */
async function fetchAllData() {
  const serialNumbers = generateSerialNumbers();
  const batches = chunkArray(serialNumbers, 10);

  const aggregatedResults = [];

  for (let i = 0; i < batches.length; i++) {
    let attempts = 0;
    let batchFetched = false;

    while (!batchFetched && attempts < 5) {
      attempts++;

      const timestamp = Date.now().toString();
      const signature = generateSignature(
        "/device/real/query",
        TOKEN,
        timestamp
      );

      try {
        const response = await fetch(API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            timestamp,
            signature,
          },
          body: JSON.stringify({ sn_list: batches[i] }),
        });

        if (response.status === 429) {
          console.log(`⏳ Rate limit hit. Retrying batch ${i + 1}`);
          await sleep(1500);
          continue;
        }

        if (!response.ok) {
          console.log(`❌ Server error on batch ${i + 1}`);
          await sleep(1500);
          continue;
        }

        const data = await response.json();
        aggregatedResults.push(...data.data);

        console.log(`✅ Batch ${i + 1}/50 fetched`);
        batchFetched = true;
      } catch (error) {
        console.log(`🌐 Network error on batch ${i + 1}, retrying...`);
        await sleep(1500);
      }
    }

    if (!batchFetched) {
      console.log(`🚨 Batch ${i + 1} permanently failed`);
    }

    await sleep(1000); // strict 1 req/sec
  }

  // ===== AGGREGATION =====
  console.log("🎉 All data fetched!");
  console.log("Total devices:", aggregatedResults.length);

  let onlineCount = 0;
  let offlineCount = 0;
  let totalPower = 0;

  for (const device of aggregatedResults) {
    if (device.status === "Online") onlineCount++;
    else offlineCount++;

    const powerValue = parseFloat(device.power.replace(" kW", ""));
    totalPower += powerValue;
  }

  const averagePower =
    aggregatedResults.length > 0
      ? totalPower / aggregatedResults.length
      : 0;

  // ===== PRINT SUMMARY =====
  console.log("🟢 Online devices:", onlineCount);
  console.log("🔴 Offline devices:", offlineCount);
  console.log("⚡ Total power (kW):", totalPower.toFixed(2));
  console.log("📊 Average power (kW):", averagePower.toFixed(2));

  // ===== SAVE FILES =====
  fs.writeFileSync(
    "report.json",
    JSON.stringify(aggregatedResults, null, 2)
  );

  fs.writeFileSync(
    "summary.json",
    JSON.stringify(
      {
        total_devices: aggregatedResults.length,
        online_devices: onlineCount,
        offline_devices: offlineCount,
        total_power_kw: totalPower.toFixed(2),
        average_power_kw: averagePower.toFixed(2),
        generated_at: new Date().toISOString(),
      },
      null,
      2
    )
  );

  console.log("📄 report.json saved");
  console.log("📊 summary.json saved");
  console.log("✅ Client finished successfully");
}

// ✅ SINGLE SAFE CALL
fetchAllData().catch((err) => {
  console.error("❌ Fatal error:", err);
});
