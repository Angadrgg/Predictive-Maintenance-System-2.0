import React, { useState, useEffect, useRef } from "react";
import { useOutletContext } from "react-router-dom";

const ANALYTICS_API =
  "https://yck8dg2zo2.execute-api.ap-south-1.amazonaws.com/analytics";

// ── Helpers ───────────────────────────────────────────────────────────────────
function unwrap(json) {
  if (json && typeof json.body === "string") {
    try { return JSON.parse(json.body); } catch { return json; }
  }
  return json;
}

function deriveUrgency(rulHours) {
  if (rulHours === null || rulHours === undefined) return "unknown";
  if (rulHours <= 0)  return "critical";
  if (rulHours < 24)  return "critical";
  if (rulHours < 72)  return "warning";
  return "ok";
}

function rulTextColor(urgency) {
  if (urgency === "critical") return "#f87171";
  if (urgency === "warning")  return "#facc15";
  if (urgency === "ok")       return "#4ade80";
  return "#94a3b8";
}

function rulLabel(rulHours, rulHealthy) {
  if (rulHours === null || rulHours === undefined) return "Insufficient data";
  if (rulHealthy) return "Healthy — no degradation trend";
  if (rulHours <= 0)  return "OVERDUE";
  if (rulHours < 24)  return `${rulHours.toFixed(1)} h  ⚠ CRITICAL`;
  if (rulHours < 72)  return `${rulHours.toFixed(1)} h  — WARNING`;
  return                     `${rulHours.toFixed(1)} h  — OK`;
}

// ── Sub-components ────────────────────────────────────────────────────────────
const StatRow = ({ label, value, highlight }) => (
  <div className="flex justify-between items-center py-1.5 border-b border-slate-700 last:border-0">
    <span className="text-slate-400 text-sm">{label}</span>
    <span className={`font-mono text-sm font-semibold ${highlight || "text-white"}`}>
      {value}
    </span>
  </div>
);

// ── Main page ─────────────────────────────────────────────────────────────────
export default function ReportsPage() {
  const { motorData } = useOutletContext() || {};

  const [analytics, setAnalytics] = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);

  // Live snapshots keyed by deviceId
  const snapshots = useRef({});

  // Update live snapshot from WebSocket
  useEffect(() => {
    if (!motorData?.deviceId) return;
    snapshots.current[motorData.deviceId] = {
      ...motorData,
      capturedAt: new Date().toLocaleTimeString(),
    };
  }, [motorData]);

  // Fetch analytics
  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res  = await fetch(ANALYTICS_API);
      const json = await res.json();
      setAnalytics(unwrap(json));
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAnalytics(); }, []);

  // ── Download TXT report ────────────────────────────────────────────────────
  const downloadTxt = () => {
    const now = new Date().toLocaleString();
    const lines = [
      "=".repeat(60),
      "  PREDICTIVE MAINTENANCE — CONDITION REPORT",
      `  Generated: ${now}`,
      "=".repeat(60),
      "",
      "── LIVE MACHINE CONDITIONS ──────────────────────────────────",
      "",
    ];

    Object.values(snapshots.current).forEach((s) => {
      const urgency = s.rulUrgency || deriveUrgency(s.rulHours);
      lines.push(`Device:       ${s.deviceId}`);
      lines.push(`Captured:     ${s.capturedAt}`);
      lines.push(`Status:       ${s.status}`);
      lines.push(`Temperature:  ${s.temperature?.toFixed(2)} °C`);
      lines.push(`Vibration:    ${s.vibration?.toFixed(4)} g`);
      lines.push(`RPM:          ${s.rpm}`);
      lines.push(`Prediction:   ${s.prediction}`);
      lines.push(`RUL:          ${rulLabel(s.rulHours, s.rulHealthy)}`);
      lines.push(`RUL Urgency:  ${urgency.toUpperCase()}`);
      lines.push("-".repeat(40));
    });

    if (analytics) {
      const a = analytics;
      lines.push("");
      lines.push("── HISTORICAL ANALYTICS ─────────────────────────────────────");
      lines.push("");
      lines.push(`Total Readings:      ${a.totalReadings}`);
      lines.push(`Total Devices:       ${a.totalDevices}`);
      lines.push(`Avg Temperature:     ${a.averageTemperature} °C`);
      lines.push(`Max Temperature:     ${a.maxTemperature} °C`);
      lines.push(`Avg Vibration:       ${a.averageVibration} g`);
      lines.push(`Max Vibration:       ${a.maxVibration} g`);
      lines.push(`Avg RPM:             ${a.averageRPM}`);
      lines.push(`Max RPM:             ${a.maxRPM}`);

      if (a.rul) {
        lines.push("");
        lines.push("── RUL FLEET SUMMARY ────────────────────────────────────────");
        lines.push(`Avg Fleet RUL:       ${a.rul.averageHours?.toFixed(2) ?? "N/A"} h`);
        lines.push(`Min Fleet RUL:       ${a.rul.minimumHours?.toFixed(2) ?? "N/A"} h`);
        lines.push(`Critical devices:    ${a.rul.criticalCount}  (< 24 h)`);
        lines.push(`Warning devices:     ${a.rul.warningCount}   (24–72 h)`);
        lines.push(`Healthy devices:     ${a.rul.healthyCount}   (> 72 h)`);
      }

      if (a.deviceSummaries?.length > 0) {
        lines.push("");
        lines.push("── PER-DEVICE RUL BREAKDOWN ─────────────────────────────────");
        a.deviceSummaries.forEach((d) => {
          lines.push(`  ${d.deviceId}:`);
          lines.push(`    Status:   ${d.status}`);
          lines.push(`    Vibration:${d.vibration?.toFixed(4)} g`);
          lines.push(`    RUL:      ${rulLabel(d.rulHours, false)}`);
          lines.push(`    Urgency:  ${(d.rulUrgency || deriveUrgency(d.rulHours)).toUpperCase()}`);
        });
      }
    }

    lines.push("");
    lines.push("=".repeat(60));
    lines.push("  End of Report");
    lines.push("=".repeat(60));

    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `maintenance_report_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Print-to-PDF report ────────────────────────────────────────────────────
  const downloadPdf = () => {
    const now = new Date().toLocaleString();
    const devices = Object.values(snapshots.current);

    const deviceRows = devices.map((s) => {
      const urgency = s.rulUrgency || deriveUrgency(s.rulHours);
      const color   = rulTextColor(urgency);
      return `
        <tr>
          <td>${s.deviceId}</td>
          <td>${s.status}</td>
          <td>${s.temperature?.toFixed(2)} °C</td>
          <td>${s.vibration?.toFixed(4)} g</td>
          <td>${s.rpm}</td>
          <td style="color:${color};font-weight:bold">
            ${rulLabel(s.rulHours, s.rulHealthy)}
          </td>
          <td style="color:${color};font-weight:bold;text-transform:uppercase">
            ${urgency}
          </td>
        </tr>`;
    }).join("");

    const rulSection = analytics?.rul ? `
      <h2>RUL Fleet Summary</h2>
      <div class="stat-grid">
        <div class="stat-box">
          <div class="stat-label">Avg Fleet RUL</div>
          <div class="stat-value">${analytics.rul.averageHours?.toFixed(1) ?? "N/A"} h</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">Min Fleet RUL</div>
          <div class="stat-value" style="color:#f87171">
            ${analytics.rul.minimumHours?.toFixed(1) ?? "N/A"} h
          </div>
        </div>
        <div class="stat-box">
          <div class="stat-label">Critical (&lt;24 h)</div>
          <div class="stat-value" style="color:#f87171">${analytics.rul.criticalCount}</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">Warning (24–72 h)</div>
          <div class="stat-value" style="color:#facc15">${analytics.rul.warningCount}</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">Healthy (&gt;72 h)</div>
          <div class="stat-value" style="color:#4ade80">${analytics.rul.healthyCount}</div>
        </div>
      </div>` : "";

    const analyticsSection = analytics ? `
      <h2>Historical Analytics</h2>
      <div class="stat-grid">
        <div class="stat-box"><div class="stat-label">Total Readings</div>
          <div class="stat-value">${analytics.totalReadings}</div></div>
        <div class="stat-box"><div class="stat-label">Total Devices</div>
          <div class="stat-value">${analytics.totalDevices}</div></div>
        <div class="stat-box"><div class="stat-label">Avg Temp</div>
          <div class="stat-value">${analytics.averageTemperature} °C</div></div>
        <div class="stat-box"><div class="stat-label">Max Temp</div>
          <div class="stat-value">${analytics.maxTemperature} °C</div></div>
        <div class="stat-box"><div class="stat-label">Avg Vibration</div>
          <div class="stat-value">${analytics.averageVibration} g</div></div>
        <div class="stat-box"><div class="stat-label">Max Vibration</div>
          <div class="stat-value">${analytics.maxVibration} g</div></div>
        <div class="stat-box"><div class="stat-label">Avg RPM</div>
          <div class="stat-value">${analytics.averageRPM}</div></div>
        <div class="stat-box"><div class="stat-label">Max RPM</div>
          <div class="stat-value">${analytics.maxRPM}</div></div>
      </div>` : "";

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Maintenance Report</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; padding: 32px; }
    h1   { font-size: 22px; color: #0f172a; margin-bottom: 4px; }
    h2   { font-size: 15px; color: #334155; margin: 24px 0 10px; border-bottom: 2px solid #e2e8f0; padding-bottom: 4px; }
    .meta { color: #64748b; font-size: 12px; margin-bottom: 24px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th    { background: #f1f5f9; padding: 8px 10px; text-align: left; font-weight: 600; color: #475569; }
    td    { padding: 7px 10px; border-bottom: 1px solid #e2e8f0; }
    tr:hover td { background: #f8fafc; }
    .stat-grid  { display: grid; grid-template-columns: repeat(4,1fr); gap: 12px; }
    .stat-box   { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; }
    .stat-label { font-size: 11px; color: #64748b; margin-bottom: 4px; }
    .stat-value { font-size: 20px; font-weight: 700; color: #0f172a; }
    @media print { body { padding: 16px; } }
  </style>
</head>
<body>
  <h1>Predictive Maintenance — Condition Report</h1>
  <p class="meta">Generated: ${now}</p>

  <h2>Live Machine Conditions</h2>
  ${devices.length === 0
    ? '<p style="color:#94a3b8;font-size:13px">No live data captured yet — open the dashboard first.</p>'
    : `<table>
        <thead>
          <tr>
            <th>Device</th><th>Status</th><th>Temp</th>
            <th>Vibration</th><th>RPM</th><th>RUL</th><th>Urgency</th>
          </tr>
        </thead>
        <tbody>${deviceRows}</tbody>
      </table>`}

  ${rulSection}
  ${analyticsSection}

  <p style="margin-top:32px;font-size:11px;color:#94a3b8;text-align:center">
    IoT Predictive Maintenance System · Auto-generated report
  </p>
  <script>window.onload = () => window.print();</script>
</body>
</html>`;

    const win = window.open("", "_blank");
    win.document.write(html);
    win.document.close();
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  const liveDevices = Object.values(snapshots.current);

  return (
    <div className="p-6 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Analytics & Reports</h1>
          <p className="text-slate-400 text-sm">
            Live condition · Historical analytics · RUL fleet summary
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={downloadTxt}
            className="bg-slate-700 hover:bg-slate-600 text-white text-sm px-4 py-2 rounded-md transition-colors"
          >
            ↓ Download TXT
          </button>
          <button
            onClick={downloadPdf}
            className="bg-blue-600 hover:bg-blue-500 text-white text-sm px-4 py-2 rounded-md transition-colors"
          >
            ↓ Download PDF
          </button>
        </div>
      </div>

      {/* Live condition cards */}
      {liveDevices.length > 0 ? (
        <div>
          <h2 className="text-white font-semibold text-lg mb-3">
            Live Machine Conditions
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {liveDevices.map((s) => {
              const urgency = s.rulUrgency || deriveUrgency(s.rulHours);
              const rulColor =
                urgency === "critical"
                  ? "text-red-400"
                  : urgency === "warning"
                  ? "text-yellow-400"
                  : urgency === "ok"
                  ? "text-green-400"
                  : "text-slate-400";

              return (
                <div
                  key={s.deviceId}
                  className="bg-slate-800 border border-slate-700 rounded-lg p-5 space-y-2"
                >
                  <div className="flex justify-between items-center">
                    <p className="text-white font-semibold text-sm">{s.deviceId}</p>
                    <p className="text-slate-500 text-xs">{s.capturedAt}</p>
                  </div>
                  <StatRow label="Status"      value={s.status}                                    highlight={s.status === "Critical" ? "text-red-400" : s.status === "Warning" ? "text-yellow-400" : "text-green-400"} />
                  <StatRow label="Temperature" value={`${s.temperature?.toFixed(2)} °C`} />
                  <StatRow label="Vibration"   value={`${s.vibration?.toFixed(4)} g`} />
                  <StatRow label="RPM"         value={s.rpm} />
                  <StatRow label="Prediction"  value={s.prediction} />
                  <StatRow
                    label="RUL"
                    value={rulLabel(s.rulHours, s.rulHealthy)}
                    highlight={rulColor}
                  />
                  <StatRow
                    label="RUL Urgency"
                    value={urgency.toUpperCase()}
                    highlight={rulColor}
                  />
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-8 text-center text-slate-400">
          No live data captured yet — open the Live Monitor first.
        </div>
      )}

      {/* RUL fleet summary */}
      {analytics?.rul && (
        <div>
          <h2 className="text-white font-semibold text-lg mb-3">
            RUL Fleet Summary
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { label: "Avg Fleet RUL",    value: analytics.rul.averageHours != null ? `${analytics.rul.averageHours.toFixed(1)} h` : "N/A", color: "text-white" },
              { label: "Min Fleet RUL",    value: analytics.rul.minimumHours != null ? `${analytics.rul.minimumHours.toFixed(1)} h` : "N/A", color: "text-red-400" },
              { label: "Critical (< 24 h)",value: analytics.rul.criticalCount, color: "text-red-400" },
              { label: "Warning (24–72 h)",value: analytics.rul.warningCount,  color: "text-yellow-400" },
              { label: "Healthy (> 72 h)", value: analytics.rul.healthyCount,  color: "text-green-400" },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-slate-800 border border-slate-700 rounded-lg p-4">
                <p className="text-slate-400 text-xs mb-1">{label}</p>
                <p className={`text-2xl font-bold font-mono ${color}`}>{value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Historical analytics */}
      <div>
        <h2 className="text-white font-semibold text-lg mb-3">
          Historical Analytics
        </h2>
        {loading ? (
          <div className="text-slate-400 text-center py-8">
            Loading analytics…
          </div>
        ) : error ? (
          <div className="bg-red-900/20 border border-red-700 rounded-lg p-6 text-red-400">
            <p className="font-semibold">Analytics unavailable</p>
            <p className="text-sm mt-1">{error}</p>
            <button onClick={fetchAnalytics} className="mt-3 text-sm underline">
              Retry
            </button>
          </div>
        ) : analytics ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {[
              { label: "Total Readings",   value: analytics.totalReadings },
              { label: "Total Devices",    value: analytics.totalDevices },
              { label: "Avg Temperature",  value: `${analytics.averageTemperature} °C` },
              { label: "Max Temperature",  value: `${analytics.maxTemperature} °C` },
              { label: "Avg Vibration",    value: `${analytics.averageVibration} g` },
              { label: "Max Vibration",    value: `${analytics.maxVibration} g` },
              { label: "Avg RPM",          value: analytics.averageRPM },
              { label: "Max RPM",          value: analytics.maxRPM },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="bg-slate-800 border border-slate-700 rounded-lg p-4"
              >
                <p className="text-slate-400 text-xs mb-1">{label}</p>
                <p className="text-white text-xl font-bold font-mono">{value}</p>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      {/* Per-device RUL breakdown from analytics */}
      {analytics?.deviceSummaries?.length > 0 && (
        <div>
          <h2 className="text-white font-semibold text-lg mb-3">
            Per-Device RUL Breakdown
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-800 text-slate-400 text-xs uppercase">
                  {["Device", "Status", "Vibration", "Temp", "RUL", "Urgency"].map(
                    (h) => (
                      <th key={h} className="text-left px-4 py-3 border-b border-slate-700">
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {analytics.deviceSummaries.map((d) => {
                  const urgency = d.rulUrgency || deriveUrgency(d.rulHours);
                  const color   =
                    urgency === "critical"
                      ? "text-red-400"
                      : urgency === "warning"
                      ? "text-yellow-400"
                      : urgency === "ok"
                      ? "text-green-400"
                      : "text-slate-400";
                  return (
                    <tr
                      key={d.deviceId}
                      className="border-b border-slate-800 hover:bg-slate-800/50"
                    >
                      <td className="px-4 py-3 text-white font-mono">{d.deviceId}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs font-bold ${
                            d.status === "Critical"
                              ? "text-red-400"
                              : d.status === "Warning"
                              ? "text-yellow-400"
                              : "text-green-400"
                          }`}
                        >
                          {d.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-300 font-mono">
                        {d.vibration?.toFixed(4)} g
                      </td>
                      <td className="px-4 py-3 text-slate-300 font-mono">
                        {d.temperature?.toFixed(2)} °C
                      </td>
                      <td className={`px-4 py-3 font-mono font-semibold ${color}`}>
                        {d.rulLabel || rulLabel(d.rulHours, false)}
                      </td>
                      <td className={`px-4 py-3 font-bold uppercase text-xs ${color}`}>
                        {urgency}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
