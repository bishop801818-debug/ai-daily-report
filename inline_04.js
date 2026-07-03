
new Chart(document.getElementById('chart_lc_price_main').getContext('2d'), {
  type: 'line',
  data: {
    labels: ['2025-12','2026-01','2026-02','2026-03','2026-04','2026-05','2026-06'],
    datasets: [{
      label: '电池级99.5% 矿石',
      data: [10.20,15.23,15.25,15.75,16.51,18.66,17.15],
      borderColor: '#0a6e3f',
      backgroundColor: 'rgba(10,110,63,0.1)',
      borderWidth: 2.5,
      fill: true,
      tension: 0.35,
      pointRadius: 5,
      pointBackgroundColor: '#0a6e3f',
      pointBorderColor: '#fff',
      pointBorderWidth: 2
    }]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: ctx => ctx.raw.toFixed(2)+' 万/吨' } }
    },
    scales: {
      y: { min: 9, title: { display:true, text:'万元/吨', font:{size:11} }, grid:{color:'rgba(0,0,0,0.06)'}, ticks:{font:{size:10}, callback: v=>v.toFixed(0)} },
      x: { grid:{color:'rgba(0,0,0,0.04)'}, ticks:{font:{size:10}} }
    }
  }
});
