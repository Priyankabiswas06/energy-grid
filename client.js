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

    await sleep(1000);
  }

  console.log("🎉 All data fetched!");
  console.log("Total devices:", aggregatedResults.length);
}
