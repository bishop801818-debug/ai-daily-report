
new Chart(document.getElementById('chart_hl_price').getContext('2d'), {
  type: 'line',
  data: {
    labels: ['2025-12','2026-01','2026-02','2026-03','2026-04','2026-05','2026-06'],
    datasets: [
      {
        label: '56.5%粗颗粒',
        data: [8.58,13.73,14.75,14.89,15.36,16.81,16.21],
        borderColor: '#0a6e3f', backgroundColor:'transparent', borderWidth:2.5, tension:0.35, pointRadius:4, pointBackgroundColor:'#0a6e3f'
      },
      {
        label: '56.5%微粉级',
        data: [9.13,14.45,15.34,15.64,16.08,17.77,16.64],
        borderColor: '#35C8D4', backgroundColor:'transparent', borderWidth:2.5, tension:0.35, pointRadius:4, pointBackgroundColor:'#35C8D4'
      }
    ]
  },
  options: {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom', labels: { font: { size: 11 }, boxWidth: 12 } },
      tooltip: { callbacks: { label: ctx => ctx.dataset.label+': '+ctx.raw.toFixed(2)+' 万/吨' } }
    },
    scales: {
      y: { min: 7, title: { display:true, text:'万元/吨', font:{size:11} }, grid:{color:'rgba(0,0,0,0.06)'}, ticks:{font:{size:10}, callback: v=>v.toFixed(0)} },
      x: { grid:{color:'rgba(0,0,0,0.04)'}, ticks:{font:{size:10}} }
    }
  }
});
