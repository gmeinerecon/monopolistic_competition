import { State } from "./state.js";

export const Progress = {
  compute() {
    const total = State.firms.length;
    const submitted = State.firms.filter(
      f => State.choices[f.id]?.submitted === true
    ).map(f => f.id);

    return {
      totalCount: total,
      submittedCount: submitted.length,
      unsubmittedIds: State.firms
        .filter(f => !submitted.includes(f.id))
        .map(f => f.id)
    };
  },

  renderProgress() {
    const p = this.compute();
    const pct = (p.submittedCount / Math.max(p.totalCount, 1)) * 100;

    const fill = document.querySelector(".progress-fill");
    const label = document.getElementById("progress-label");
    const list = document.getElementById("unsubmitted-list");

    fill.style.width = pct + "%";
    fill.style.background =
      pct < 50 ? "var(--warm-red)" :
      pct < 100 ? "var(--warm-amber)" :
      "var(--warm-orange)";

    label.textContent = `${p.submittedCount} of ${p.totalCount} teams submitted`;

    if (p.unsubmittedIds.length === 0) {
      list.innerHTML = `<div class="unsubmitted-list"><strong>All teams have submitted!</strong></div>`;
    } else {
      list.innerHTML = `
        <div class="unsubmitted-list">
          <strong>Teams not submitted:</strong>
          ${p.unsubmittedIds.map(id => {
            const f = State.firms.find(x => x.id === id);
            return `<div>${f.name} (ID ${id})</div>`;
          }).join("")}
        </div>`;
    }

    return pct;
  }
};