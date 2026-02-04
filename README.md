# ⚡ EnergyGrid Data Aggregator

A Node.js–based solution that simulates and consumes a legacy EnergyGrid API with **strict rate limits**, **batch constraints**, and **custom cryptographic authentication**.

This project includes:
- A **Mock API Server** (to simulate EnergyGrid)
- A **Client Aggregator** (to fetch data from 500 devices safely)

---

## 🚀 Features

- ⏱️ Enforces **1 request per second** rate limit
- 📦 Supports **batching (max 10 devices/request)**
- 🔐 Implements **MD5-based request signature**
- 🔁 Robust **retry handling** for network & rate-limit errors
- 📊 Aggregates telemetry data for **500 solar inverters**
- 🧹 Clean Git repository (no `node_modules`)

---

## 🛠️ Tech Stack

- **Node.js**
- **Express.js**
- **Crypto (MD5 hashing)**
- Native `fetch` API (Node 18+)

---

## 📁 Project Structure

