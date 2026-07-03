
new Chart(document.getElementById('chart_lc_import').getContext('2d'), {
  type: 'bar',
  data: {
    labels: ['25-06','25-07','25-08','25-09','25-10','25-11','25-12','26-01','26-02','26-03','26-04','26-05'],
    datasets: [
      {
        label: '进口量（吨）',
        data: [17698,13845,21847,19597,23881,22055,23989,26858,26427,29974,32650,37555],
        backgroundColor: function(ctx) {
          const idx = ctx.dataIndex;
          return idx >= 7 ? 'rgba(10,110,63,0.7)' : 'rgba(10,110,63,0.3)';
        },
        borderColor: function(ctx) {
          return ctx.dataIndex >= 7 ? '#0a6e3f' : 'rgba(10,110,63,0.5)';
        },
        borderWidth: 1.5, borderRadius: 3, yAxisID: 'y'
      },
      {
        label: '进口均价（万元/吨）',
        data: [7.3,7.2,6.2,6.1,6.4,7.0,7.2,6.8,8.5,10.4,11.5,13.1],
        type: 'line', borderColor: '#E85B73', backgroundColor:'transparent',
        borderWidth: 2.5, pointRadius: 4, pointBackgroundColor: '#E85B73',
        tension: 0.4, fill: false, yAxisID: 'y1'
      }
    ]
  },
  options: {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top', labels: { font: { size: 11 }, boxWidth: 12 } },
      tooltip: { callbacks: { label: ctx => ctx.raw.toLocaleString()+(ctx.datasetIndex===0?' 吨':' 万/吨') } }
    },
    scales: {
      y: { position: 'left', title: { display:true, text:'进口量（吨）', font:{size:11} }, grid:{color:'rgba(0,0,0,0.06)'}, ticks:{font:{size:10}} },
      y1: { position: 'right', title: { display:true, text:'均价（万元/吨）', font:{size:11} }, grid:{display:false}, min:5, max:15, ticks:{font:{size:10}, callback: v=>v.toFixed(0)} }
    }
  }
});
