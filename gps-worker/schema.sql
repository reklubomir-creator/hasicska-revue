-- Hasičská revue GPS v2.0.0 — Cloudflare D1
CREATE TABLE IF NOT EXISTS gps_devices (
 device_id TEXT PRIMARY KEY,
 unit_name TEXT NOT NULL,
 token_hash TEXT NOT NULL UNIQUE,
 enabled INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE IF NOT EXISTS gps_latest (
 device_id TEXT PRIMARY KEY REFERENCES gps_devices(device_id),
 latitude REAL NOT NULL,
 longitude REAL NOT NULL,
 accuracy REAL,
 speed REAL,
 recorded_at TEXT NOT NULL,
 received_at TEXT NOT NULL
);
