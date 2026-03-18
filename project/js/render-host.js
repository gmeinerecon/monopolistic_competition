/* Host Rendering Engine */

import { State } from "./state.js";
import { Progress } from "./progress.js";
import { AudioCue } from "./audio.js";
import { ChartUtils } from "./charts.js";

export const HostRenderer = {
  init(ws) {
    this.ws = ws;
    AudioCue.init();
    State.isHost = true;
    State.subscribe(() => this.render());
    this.bindUI();
  },

  bindUI() {
    const id = x => document.getElementById(x);

    id("resetBtn").addEventListener("click", () => {
      this.ws.send("reset_game", { hard: false });
      AudioCue.reset();
    });

    id("hardResetBtn").addEventListener("click", () => {
      this.ws.send("reset_game", { hard: true });
      AudioCue.reset();
    });

    id("computeBtn").addEventListener("click", () => {
      this.ws.send("compute_round");
      AudioCue.reset();
    });

    id("downloadCsvBtn").addEventListener("click", () => {
      this.ws.send("export_csv");
    });

    id("clearChartsBtn").addEventListener("click", () => {
      State.history = [];
      State.lastResults = null;
      State.notify();
    });

    document.addEventListener("click", (e) => {
      const btn = e.target.closest(".kickBtn");
      if (!btn) return;
      this.ws.send("kick_firm", { id: Number(btn.dataset.id) });
    });
  },

  render() {
    this.renderRoster();
    const pct = Progress.renderProgress();
    if (pct === 100) AudioCue.playOnce();

    if (State.lastResults) this.renderResults();
    if (State.history.length) this.renderCharts();
  },

  renderRoster() {
    const roster = document.getElementById("roster");
    const connected = State.firms.filter(f => f.connected).length;

    roster.innerHTML = `
      <div class="muted">Firms connected: ${connected}/${State.firms.length}</div>
      <div class="grid-auto" style="margin-top:8px">
        ${State.firms.map(f => `
          <div class="card">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <div style="display:flex;align-items:center;gap:8px;">
                <div style="width:14px;height:14px;border-radius:3px;background:${f.color};"></div>
                <div><strong>${f.name}</strong> 
                  <span class="muted">(ID ${f.id}${f.connected ? " · online" : " · offline"})</span>
                </div>
              </div>
              <button class="btn secondary kickBtn" data-id="${f.id}">
                Kick team
              </button>
            </div>
            <div class="muted" style="margin-top:6px;">
              Brand capital B: ${Number(f.brandStock || 0).toFixed(2)}
            </div>
          </div>
        `).join("")}
      </div>
    `;
  },

  renderResults() {
    const m = State.lastResults;

    const metrics = document.getElementById("marketMetrics");
    const add = (l, v) => `<div class="metric"><strong>${l}</strong><div>${v}</div></div>`;

    metrics.innerHTML = [
      add("Avg Price", m.avgPrice),
      add("Avg Effective Brand", m.avgBrandEff),
      add("Baseline Demand", m.demandBaseline),
      add("Shock ε", m.shock),
      add("Market Demand", m.marketDemand),
      add("Avg Profit", m.avgProfit)
    ].join("");

    const container = document.getElementById("firmOutcomes");
    container.innerHTML = m.firmOutcomes.map(o => this.renderFirmOutcome(o)).join("");
  },

  renderFirmOutcome(o) {
    const f = State.firms.find(x => x.id === o.id);
    return `
      <div class="card">
        <div style="display:flex;align-items:center;gap:8px;font-weight:700;">
          <div style="width:14px;height:14px;border-radius:3px;background:${f.color};"></div>
          <div>${o.name} (Firm ${o.id})</div>
        </div>

        <div class="grid-2" style="margin-top:8px;">
          <div>
            <div class="muted">Price</div><div>${o.p}</div>
            <div class="muted">Brand invest</div><div>${o.bInvest}</div>
            <div class="muted">Effective brand</div><div>${o.bEff}</div>
            <div class="muted">Market share</div><div>${(o.share * 100).toFixed(1)}%</div>
          </div>

          <div>
            <div class="muted">Production</div><div>${o.q}</div>
            <div class="muted">Demanded</div><div>${o.demanded.toFixed(2)}</div>
            <div class="muted">Sales</div><div>${o.sales.toFixed(2)}</div>
            <div class="muted">Leftover</div><div>${o.leftover.toFixed(2)}</div>
          </div>
        </div>

        <div class="grid-3" style="margin-top:8px;">
          <div><div class="muted">Revenue</div><div>${o.revenue}</div></div>
          <div><div class="muted">Cost</div><div>${o.cost}</div></div>
          <div><div class="muted">Profit</div>
            <div class="${o.profit >= 0 ? "profit-pos" : "profit-neg"}">${o.profit}</div>
          </div>
        </div>
      </div>
    `;
  },

  renderCharts() {
    const h = State.history;
    const labels = h.map(r => r.round);

    ChartUtils.renderLineChart(
      "chartDemand",
      [{ label: "Market Demand", data: h.map(r => r.summary.marketDemand) }],
      labels,
      { yTitle: "Units", xTitle: "Round" }
    );

    ChartUtils.renderLineChart(
      "chartAvgProfit",
      [{ label: "Average Profit", data: h.map(r => r.summary.avgProfit) }],
      labels,
      { yTitle: "$", xTitle: "Round" }
    );

    const ids = h[h.length - 1]?.firmOutcomes.map(o => o.id) || [];
    const firms = Object.fromEntries(State.firms.map(f => [f.id, f]));

    const profitDatasets = ids.map(id => ({
      label: firms[id].name,
      data: h.map(rd => {
        const fo = rd.firmOutcomes.find(x => x.id === id);
        return fo ? fo.profit : NaN;
      })
    }));

    ChartUtils.renderLineChart(
      "chartFirmProfit",
      profitDatasets,
      labels,
      { yTitle: "Profit $", xTitle: "Round" }
    );

    const cum = {};
    const run = {};
    ids.forEach(id => { cum[id] = []; run[id] = 0; });

    h.forEach(rd => {
      ids.forEach(id => {
        const fo = rd.firmOutcomes.find(x => x.id === id);
        run[id] += fo ? fo.profit : 0;
        cum[id].push(run[id]);
      });
    });

    ChartUtils.renderLineChart(
      "chartCumProfit",
      ids.map(id => ({ label: firms[id].name, data: cum[id] })),
      labels,
      { yTitle: "Cumulative $", xTitle: "Round" }
    );

    ChartUtils.renderLineChart(
      "chartMarketShare",
      ids.map(id => ({
        label: firms[id].name,
        data: h.map(rd => {
          const fo = rd.firmOutcomes.find(x => x.id === id);
          return fo ? +(fo.share * 100).toFixed(1) : NaN;
        })
      })),
      labels,
      { yTitle: "%", xNTitle: "Round" }
    );
  }
};