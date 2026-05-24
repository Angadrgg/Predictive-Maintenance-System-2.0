import React, { useState, useEffect, useRef } from "react";
import { useOutletContext } from "react-router-dom";
// 🟢 FIXED CASING: Matches your sidebar filename "Sensorchart.jsx" exactly
import SensorChart from "./Sensorchart"; 

// ── Helpers ───────────────────────────────────────────────────────────────────
function rulColor(urgency) {
  if (urgency === "critical") return "text-red-400";
  if (urgency === "warning")  return "text-yellow-400";
  if (urgency === "ok")       return "text-green-400";
  return "text-slate-400";
}

function rulBorder(urgency) {
  if (urgency === "critical") return "border-red-500";
  if (urgency === "warning")  return "border-yellow-500";
  if (urgency === "ok")       return "border-green-500";
  return "border-slate-600";
}

function deriveUrgency(rulHours, vibration) {
  // If the physical vibration hits threshold bounds, instantly override to critical
  if (vibration >= 1.0) return "critical";
  if (vibration >= 0.5) return "warning";
  
  if (rulHours === null || rulHours === undefined) return "unknown";
  if (rulHours <= 0 || rulHours < 24) return "critical";
  if (rulHours < 72) return "warning";
  return "ok";
}

function deriveRulLabel(rulHours, vibration) {
  if (vibration >= 1.0) return "IMMINENT BREAKDOWN DEGRADATION";
  if (rulHours === null || rulHours === undefined) return "Insufficient data";
  if (rulHours <= 0)   return "OVERDUE";
  if (rulHours < 24)   return `${rulHours.toFixed(1)} h  ⚠ CRITICAL`;
  if (rulHours < 72)   return `${rulHours.toFixed(1)} h  — WARNING`;
  return                      `${rulHours.toFixed(1)} h  — OK`;
}

// ── Sub-components ────────────────────────────────────────────────────────────
const KpiCard = ({ title, value, subtext, color, alert }) => (
  <div className={`bg-slate-800 p-6 rounded-lg shadow-lg border ${alert ? "border-red-500" : "border-slate-700"}`}>
    {alert && (
      <div className="text-red-400 text-xs font-bold mb-2 animate-pulse">
        ⚠ ALERT
      </div>
    )}
    <h3 className="text-slate-400 text-sm font-medium mb-1">{title}</h3>
    <div className={`text-3xl font-bold ${color}`}>{value}</div>
    {subtext && <p className="text-slate-500 text-xs mt-2">{subtext}</p>}
  </div>
);

const RulCard = ({ rulHours, rulLabel, rulHealthy, vibration }) => {
  const urgency = deriveUrgency(rulHours, vibration);
  const label   = vibration >= 1.0 ? "0.0 h ⚠ CRITICAL OVERDUE" : (rulLabel || deriveRulLabel(rulHours, vibration));

  return (
    <div className={`bg-slate-800 p-6 rounded-lg shadow-lg border-2 ${rulBorder(urgency)}`}>
      <h3 className="text-slate-400 text-sm font-medium mb-1">
        Remaining Useful Life
      </h3>

      <div className={`text-3xl font-bold font-mono ${rulColor(urgency)}`}>
        {vibration >= 1.0 ? "0.0 h" : (rulHours === null ? "—" : rulHealthy ? "∞" : `${rulHours.toFixed(1)} h`)}
      </div>

      <p className={`text-sm font-semibold mt-1 ${rulColor(urgency)}`}>
        {label}
      </p>

      {((rulHours !== null && !rulHealthy) || vibration >= 0.5) && (
        <div className="mt-3">
          <div className="w-full bg-slate-700 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-500 ${
                urgency === "critical" ? "bg-red-500" : urgency === "warning" ? "bg-yellow-400" : "bg-green-500"
              }`}
              style={{
                width: `${vibration >= 1.0 ? 0 : Math.min(100, Math.max(2, (rulHours / 168) * 100))}%`,
              }}
            />
          </div>
          <div className="flex justify-between text-xs text-slate-500 mt-1">
            <span>0 h</span>
            <span>168 h (1 week)</span>
          </div>
        </div>
      )}
    </div>
  );
};

const StatusBadge = ({ isConnected, motorData }) => {
  if (!isConnected)
    return (
      <span className="flex items-center gap-2 text-red-400 font-mono text-sm">
        <span className="w-2 h-2 rounded-full bg-red-400" />
        DISCONNECTED
      </span>
    );
  if (!motorData)
    return (
      <span className="flex items-center gap-2 text-yellow-400 font-mono text-sm">
        <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
        AWAITING DATA
      </span>
    );
  return (
    <span className="flex items-center gap-2 text-green-400 font-mono text-sm">
      <span className="w-2 h-2 rounded-full bg-green-400 animate-ping absolute" />
      <span className="w-2 h-2 rounded-full bg-green-400 relative" />
      LIVE
    </span>
  );
};

const MACHINES = ["Machine 1"];

export default function Dashboard() {
  const { motorData, isConnected } = useOutletContext();
  const [activeTab, setActiveTab]  = useState(0);
  const [history, setHistory]      = useState([]);
  const lastTs = useRef(null);

  useEffect(() => {
    if (!motorData || motorData.timestamp === lastTs.current) return;
    lastTs.current = motorData.timestamp;
    setHistory((prev) => [
      ...prev.slice(-59),
      {
        timestamp:   motorData.timestamp,
        time:        new Date(motorData.timestamp).toLocaleTimeString(),
        temperature: Number(motorData.temperature) || 0,
        vibration:   Number(motorData.vibration) || 0,
        rpm:         Number(motorData.rpm) || 0,
      },
    ]);
  }, [motorData]);

  const d = motorData || {};

  const rulHours   = d.rulHours   ?? null;
  const rulLabel   = d.rulLabel   ?? null;
  const rulHealthy = d.rulHealthy ?? false;
  
  // Extract clean number formats to ensure safety logic handles parameters flawlessly
  const liveVibration = Number(d.vibration) || 0;
  const urgency    = deriveUrgency(rulHours, liveVibration);

  const lastPacket = d.timestamp ? new Date(d.timestamp).toLocaleTimeString() : null;

  // 🔮 CORE PREDICTION STATE LOGIC MAP
  const isCritical = urgency === "critical" || liveVibration >= 1.0;
  const isWarning  = urgency === "warning"  || liveVibration >= 0.5;

  const calculatedPrediction = isCritical ? "HIGH RISK" : isWarning ? "ELEVATED" : "STABLE";
  const calculatedColor      = isCritical ? "text-red-400" : isWarning ? "text-yellow-400" : "text-green-400";

  return (
    <div className="p-6 space-y-6">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Live Monitor</h1>
          <p className="text-slate-400 text-sm">Real-time sensor data · RUL estimation</p>
        </div>
        <div className="flex items-center gap-4">
          {lastPacket && <span className="text-slate-500 text-xs">Last: {lastPacket}</span>}
          <div className="relative flex items-center">
            <StatusBadge isConnected={isConnected} motorData={motorData} />
          </div>
        </div>
      </div>

      {/* ── Tabs ───────────────────────────────────────────────────────────── */}
      <div className="flex gap-2">
        {MACHINES.map((m, i) => (
          <button
            key={i}
            onClick={() => setActiveTab(i)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === i ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400 hover:bg-slate-700"
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      {/* ── KPI cards ──────────────────────────────────────────────────────── */}
      {!isConnected ? (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-8 text-center text-slate-400">
          WebSocket disconnected — attempting reconnect…
        </div>
      ) : !motorData ? (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-8 text-center text-slate-400">
          Connected — waiting for first sensor packet…
        </div>
      ) : (
        <>
          {/* Row 1: Active Telemetry KPI Blocks */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <KpiCard
              title="Temperature"
              value={`${d.temperature?.toFixed(1) ?? "—"} °C`}
              subtext="DHT11 sensor"
              color={d.temperature > 40 ? "text-red-400" : "text-orange-400"}
              alert={d.temperature > 40}
            />
            <KpiCard
              title="Vibration"
              value={`${liveVibration.toFixed(3)} g`}
              subtext={`Status: ${d.status ?? "Normal"}`}
              color={isCritical ? "text-red-400" : isWarning ? "text-yellow-400" : "text-blue-400"}
              alert={isCritical}
            />
            <KpiCard title="Motor RPM" value={d.rpm ?? "0"} subtext="Hall-effect sensor" color="text-green-400" />
            <KpiCard
              title="Prediction"
              value={calculatedPrediction}
              subtext={`System State: ${isCritical ? "FAILING" : isWarning ? "DEGRADING" : "HEALTHY"}`}
              color={calculatedColor}
              alert={isCritical}
            />
          </div>

          {/* Row 2: Prognostic Evaluation Windows */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <div className="xl:col-span-1">
              <RulCard rulHours={rulHours} rulLabel={rulLabel} rulHealthy={rulHealthy} vibration={liveVibration} />
            </div>

            <div className="xl:col-span-2 bg-slate-800 border border-slate-700 rounded-lg p-6">
              <h3 className="text-slate-400 text-sm font-medium mb-4">Degradation Insight</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-slate-300 text-sm">Device ID</span>
                  <span className="text-white font-mono text-sm">{d.deviceId ?? "—"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-300 text-sm">Fault Classification</span>
                  <span className={`font-semibold text-sm ${isCritical ? "text-red-400" : isWarning ? "text-yellow-400" : "text-green-400"}`}>
                    {d.status ?? "—"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-300 text-sm">RUL Urgency</span>
                  <span className={`font-semibold text-sm capitalize ${rulColor(urgency)}`}>
                    {urgency === "unknown" ? "Collecting data…" : urgency}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-300 text-sm">Est. Time to Failure</span>
                  <span className={`font-mono text-sm ${rulColor(urgency)}`}>
                    {isCritical ? "IMMINENT BREAKDOWN" : (rulHours === null ? "—" : rulHealthy ? "No trend detected" : `${rulHours.toFixed(2)} hours`)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-300 text-sm">Last Updated</span>
                  <span className="text-slate-400 font-mono text-xs">{lastPacket ?? "—"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Row 3: Recharts Component Grid Frame */}
          {history.length > 1 && (
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
              <h3 className="text-white font-semibold mb-4">Live Telemetry History</h3>
              <div className="h-80 w-full">
                <SensorChart data={history} />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}