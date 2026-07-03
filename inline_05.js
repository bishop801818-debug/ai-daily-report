
new Chart(document.getElementById('chart_lc_price_all').getContext('2d'), {
  type: 'line',
  data: {
    labels: ['2025-12','2026-01','2026-02','2026-03','2026-04','2026-05','2026-06'],
    datasets: [
      {
        label: '矿石电池级99.5%',
        data: [10.20,15.23,15.25,15.75,16.51,18.66,17.15],
        borderColor: '#0a6e3f', backgroundColor:'transparent', borderWidth:2, tension:0.35, pointRadius:3, pointBackgroundColor:'#0a6e3f'
      },
      {
        label: '盐湖电池级99.5%',
        data: [9.97,14.68,14.70,15.20,15.96,18.11,16.77],
        borderColor: '#35C8D4', backgroundColor:'transparent', borderWidth:2, tension:0.35, pointRadius:3, pointBackgroundColor:'#35C8D4'
      },
      {
        label: '工业级98.5%',
        data: [9.50,13.32,13.24,13.80,14.55,16.71,15.89],
        borderColor: '#D5A858', backgroundColor:'transparent', borderWidth:2, tension:0.35, pointRadius:3, pointBackgroundColor:'#D5A858'
      },
      {
        label: '再生电池级99.5%',
        data: [9.92,14.48,14.50,15.00,15.75,17.87,16.62],
        borderColor: '#5B8DEF', backgroundColor:'transparent', borderWidth:2, tension:0.35, pointRadius:3, pointBackgroundColor:'#5B8DEF'
      }
    ]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom', labels: { font: { size: 10 }, boxWidth: 10 } },
      tooltip: { callbacks: { label: ctx => ctx.dataset.label+': '+ctx.raw.toFixed(2)+' 万' } }
    },
    scales: {
      y: { min: 8, title: { display:true, text:'万元/吨', font:{size:11} }, grid:{color:'rgba(0,0,0,0.06)'}, ticks:{font:{size:10}, callback: v=>v.toFixed(0)} },
      x: { grid:{color:'rgba(0,0,0,0.04)'}, ticks:{font:{size:10}} }
    }
  }
});
