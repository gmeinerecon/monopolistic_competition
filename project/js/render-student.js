import { State } from "./state.js";
import { ChartUtils } from "./charts.js";

export const StudentRenderer = {
  init(ws) {
    this.ws = ws;
    State.isHost = false;
    State.subscribe(() => this.render());
  },

  render() {
    this.renderStatus();
    this.renderResults();
    this.renderCharts();
  },

  renderStatus() {
    const badge = document.getElementById("statusBadge");
    if (!badge || !State.myFirmId) return;
    const ch = State.choices[State.myFirmId];
    badge.textContent = ch && ch.submitted ? "Submitted" : "Not submitted";
  },

  renderResults() {
    const m = State.lastResults;
    const metrics = document.getElementById("marketMetrics");
    const outcomes = document.getElementById("firmOutcomes");

    if (!m) {
      document.getElementById("results-card").style.display = "none";
      return;
    }

    document.getElementById("results-card").style.display = "block";

    const metric = (l, v) => `<div class="metric"><strong>${l}</strong><div>${v}</div></div>`;
    metrics.innerHTML = [
      metric("Avg Price", m.avgPrice),
      metric("Avg Effective Brand", m.avgBrandEff),
      metric("Baseline Demand", m.demandBaseline),
      metric("Shock ε", m.shock),
      metric("Market Demand", m.marketDemand),
      metric("Avg Profit", m.avgProfit)
    ].join("");

    outcomes.innerHTML = m.firmOutcomes.map(o => this.renderFirmOutcome(o)).join("");
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
    if (!State.history.length) {
      document.getElementById("charts-card").style.display = "none";
      return;
    }

    document.getElementById("charts-card").style.display = "block";

    const h = State.history;
    const labels = h.map(r => r.round);

    const ids = h[h.length - 1]?.firmOutcomes.map(o => o.id) || [];
    const firms = Object.fromEntries(State.firms.map(f => [f.id, f]));

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
      { yTitle: "%", xTitle: "Round" }
    );
  }
};