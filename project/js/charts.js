export const ChartUtils = {
  palette: [
    "var(--chart-orange)", "var(--chart-red)", "var(--chart-amber)",
    "var(--chart-violet)", "var(--chart-teal)", "var(--chart-gold)"
  ],

  renderLineChart(canvasId, series, labels, opts={}) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    if (ctx._chart) ctx._chart.destroy();

    ctx._chart = new Chart(ctx, {
      type: "line",
      data: {
        labels,
        datasets: series.map((s, idx) => ({
          label: s.label,
          data: s.data,
          borderColor: this.palette[idx % this.palette.length],
          backgroundColor: this.palette[idx % this.palette.length] + "33",
          tension: 0.25,
          borderWidth: 2
        }))
      },
      options: {
        responsive: true,
        scales: {
          y: { title: { display: true, text: opts.yTitle || "" }},
          x: { title: { display: true, text: opts.xTitle || "" }}
        }
      }
    });
  }
};