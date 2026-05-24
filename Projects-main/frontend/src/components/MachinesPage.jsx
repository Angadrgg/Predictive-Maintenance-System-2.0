import React, { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";

const FLEET_API =
  "https://yck8dg2zo2.execute-api.ap-south-1.amazonaws.com/fleet";
const POLL_MS = 15_000;

// ── Helpers ───────────────────────────────────────────────────────────────────
function parseFleet(json) {
  if (Array.isArray(json))               return json;
  if (Array.isArray(json?.machines))     return json.machines;
  if (Array.isArray(json?.items))        return json.items;
  if (typeof json?.body === "string") {
    try { return parseFleet(JSON.parse(json.body)); } catch { return []; }
  }
  return [];
}

function deriveUrgency(rulHours) {
  if (rulHours === null || rulHours === undefined) return "unknown";
  if (rulHours <= 0)  return "critical";
  if (rulHours < 24)  return "critical";
  if (rulHours < 72)  return "warning";
  return "ok";
}

function rulTextColor(urgency) {
  if (urgency === "critical") return "text-red-400";
  if (urgency === "warning")  return "text-yellow-400";
  if (urgency === "ok")       return "text-green-400";
  return "text-slate-400";
}

function rulBarColor(urgency) {
  if (urgency === "critical") return "bg-red-500";
  if (urgency === "warning")  return "bg-yellow-400";
  if (urgency === "ok")       return "bg-green-500";
  return "bg-slate-600";
}

function rulBorderColor(urgency) {
  if (urgency === "critical") return "border-red-500";
  if (urgency === "warning")  return "border-yellow-500";
  if (urgency === "ok")       return "border-green-600";
  return "border-slate-700";
}

function statusColor(status) {
  if (status === "Critical") return "text-red-400 bg-red-900/30";
  if (status === "Warning")  return "text-yellow-400 bg-yellow-900/30";
  if (status === "Normal")   return "text-green-400 bg-green-900/30";
  return "text-slate-400 bg-slate-700";
}

// ── RUL Progress Bar ──────────────────────────────────────────────────────────
function RulBar({ rulHours, rulLabel, rulHealthy, urgency }) {
  const pct = rulHealthy || rulHours === null
    ? 100
    : Math.min(100, Math.max(2, (rulHours / 168) * 100));

  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-slate-400 text-xs">RUL</span>
        <span className={`text-xs font-semibold font-mono ${rulTextColor(urgency)}`}>
          {rulHours === null
            ? "Insufficient data"
            : rulHealthy
            ? "∞  Healthy"
            : rulLabel || `${rulHours.toFixed(1)} h`}
        </span>
      </div>
      <div className="w-full bg-slate-700 rounded-full h-1.5">
        <div
          className={`h-1.5 rounded-full transition-all duration-700 ${rulBarColor(urgency)}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ── Machine Card ──────────────────────────────────────────────────────────────
function MachineCard({ machine }) {
  const {
    deviceId, temperature, vibration, rpm,
    status, prediction, timestamp,
    rulHours, rulLabel, rulHealthy,
  } = machine;

  const urgency = machine.rulUrgency || deriveUrgency(rulHours);

  return (
    <div
      className={`bg-slate-800 rounded-lg border-2 ${rulBorderColor(urgency)} p-5 flex flex-col gap-3 shadow-lg`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-white font-semibold text-sm truncate max-w-[160px]">
            {deviceId}
          </p>
          <p className="text-slate-500 text-xs mt-0.5">
            {timestamp ? new Date(timestamp).toLocaleTimeString() : "—"}
          </p>
        </div>
        <span
          className={`text-xs font-bold px-2 py-1 rounded-full whitespace-nowrap ${statusColor(status)}`}
        >
          {status || "Unknown"}
        </span>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-2 text-center">
        {[
          {
            label: "Temp",
            value: `${temperature?.toFixed(1) ?? "—"}°C`,
            color: temperature > 40 ? "text-red-400" : "text-orange-400",
          },
          {
            label: "Vibration",
            value: `${vibration?.toFixed(3) ?? "—"} g`,
            color:
              vibration >= 1.0
                ? "text-red-400"
                : vibration >= 0.5
                ? "text-yellow-400"
                : "text-blue-400",
          },
          {
            label: "RPM",
            value: rpm ?? "—",
            color: "text-green-400",
          },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-slate-900 rounded-md p-2">
            <p className="text-slate-500 text-xs">{label}</p>
            <p className={`font-bold text-sm font-mono ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Prediction badge */}
      <div className="flex items-center justify-between">
        <span className="text-slate-400 text-xs">Prediction</span>
        <span
          className={`text-xs font-bold ${
            prediction === "HIGH RISK"
              ? "text-red-400"
              : prediction === "ELEVATED"
              ? "text-yellow-400"
              : "text-green-400"
          }`}
        >
          {prediction || "STABLE"}
        </span>
      </div>

      {/* RUL bar */}
      <RulBar
        rulHours={rulHours}
        rulLabel={rulLabel}
        rulHealthy={rulHealthy}
        urgency={urgency}
      />
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function MachinesPage() {
  const { motorData } = useOutletContext() || {};

  const [machines, setMachines] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [lastPoll, setLastPoll] = useState(null);

  // Urgency filter: "all" | "critical" | "warning" | "ok" | "unknown"
  const [filter, setFilter] = useState("all");

  // ── Fetch from API ─────────────────────────────────────────────────────────
  const fetchFleet = async () => {
    try {
      const res  = await fetch(FLEET_API);
      const json = await res.json();
      const arr  = parseFleet(json);
      setMachines(arr);
      setError(null);
      setLastPoll(new Date().toLocaleTimeString());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFleet();
    const id = setInterval(fetchFleet, POLL_MS);
    return () => clearInterval(id);
  }, []);

  // ── Merge live WebSocket data into the fleet list ──────────────────────────
  useEffect(() => {
    if (!motorData?.deviceId) return;
    setMachines((prev) => {
      const exists = prev.find((m) => m.deviceId === motorData.deviceId);
      if (exists) {
        return prev.map((m) =>
          m.deviceId === motorData.deviceId ? { ...m, ...motorData } : m
        );
      }
      return [...prev, motorData];
    });
  }, [motorData]);

  // ── Filter ─────────────────────────────────────────────────────────────────
  const filtered = machines.filter((m) => {
    if (filter === "all") return true;
    const urg = m.rulUrgency || deriveUrgency(m.rulHours);
    return urg === filter;
  });

  // ── Summary counts ─────────────────────────────────────────────────────────
  const counts = machines.reduce(
    (acc, m) => {
      const u = m.rulUrgency || deriveUrgency(m.rulHours);
      acc[u] = (acc[u] || 0) + 1;
      return acc;
    },
    { critical: 0, warning: 0, ok: 0, unknown: 0 }
  );

  return (
    <div className="p-6 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Machine Fleet</h1>
          <p className="text-slate-400 text-sm">
            Live status · RUL per device
            {lastPoll && (
              <span className="ml-2 text-slate-500 text-xs">
                · Last polled {lastPoll}
              </span>
            )}
          </p>
        </div>
        <button
          onClick={fetchFleet}
          className="bg-slate-700 hover:bg-slate-600 text-white text-sm px-4 py-2 rounded-md transition-colors"
        >
          ↻ Refresh
        </button>
      </div>

      {/* RUL summary strip */}
      {machines.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { key: "critical", label: "Critical (< 24 h)", color: "border-red-500 text-red-400" },
            { key: "warning",  label: "Warning (24–72 h)", color: "border-yellow-500 text-yellow-400" },
            { key: "ok",       label: "Healthy (> 72 h)",  color: "border-green-600 text-green-400" },
            { key: "unknown",  label: "No RUL data",       color: "border-slate-600 text-slate-400" },
          ].map(({ key, label, color }) => (
            <div
              key={key}
              className={`bg-slate-800 border-l-4 rounded-lg p-4 ${color}`}
            >
              <p className="text-2xl font-bold">{counts[key] || 0}</p>
              <p className="text-xs mt-1 text-slate-400">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {["all", "critical", "warning", "ok", "unknown"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold capitalize transition-colors ${
              filter === f
                ? "bg-blue-600 text-white"
                : "bg-slate-800 text-slate-400 hover:bg-slate-700"
            }`}
          >
            {f === "all" ? `All (${machines.length})` : `${f} (${counts[f] || 0})`}
          </button>
        ))}
      </div>

      {/* Cards */}
      {loading ? (
        <div className="text-slate-400 text-center py-12">Loading fleet…</div>
      ) : error ? (
        <div className="bg-red-900/20 border border-red-700 rounded-lg p-6 text-red-400">
          <p className="font-semibold">Failed to load fleet data</p>
          <p className="text-sm mt-1">{error}</p>
          <button
            onClick={fetchFleet}
            className="mt-3 text-sm underline"
          >
            Retry
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-slate-500 text-center py-12">
          {machines.length === 0
            ? "No machines registered yet."
            : `No machines match the "${filter}" filter.`}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((m) => (
            <MachineCard key={m.deviceId} machine={m} />
          ))}
        </div>
      )}
    </div>
  );
}
