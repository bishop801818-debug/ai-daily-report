
new Chart(document.getElementById('chart_lx_import').getContext('2d'), {
  type: 'bar',
  data: {
    labels: ['25-06','25-07','25-08','25-09','25-10','25-11','25-12','26-01','26-02','26-03','26-04','26-05'],
    datasets: [
      {
        label: '锂辉石进口量（吨）',
        data: [575727,751489,620729,710845,651116,729691,788494,831919,557722,837424,757975,680776],
        backgroundColor: 'rgba(91,141,239,0.65)',
        borderColor: '#5B8DEF',
        borderWidth: 1.5,
        borderRadius: 3,
        yAxisID: 'y'
      },
      {
        label: '折碳酸锂当量（右轴，万吨）',
        data: [5.4,7.0,5.8,6.7,6.1,6.9,7.4,7.8,5.2,7.9,7.1,6.4],
        type: 'line',
        borderColor: '#D5A858',
        backgroundColor: 'rgba(213,168,88,0.1)',
        borderWidth: 2.5,
        pointRadius: 4,
        pointBackgroundColor: '#D5A858',
        tension: 0.4,
        fill: false,
        yAxisID: 'y1'
      }
    ]
  },
  options: {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top', labels: { font: { size: 11 }, boxWidth: 12 } },
      tooltip: { callbacks: { label: ctx => ctx.raw.toLocaleString()+(ctx.datasetIndex===0?' 吨':'') } }
    },
    scales: {
      y: { position: 'left', title: { display:true, text:'进口量（吨）', font:{size:11} }, grid:{color:'rgba(0,0,0,0.06)'}, ticks:{font:{size:10}, callback: v=>(v/1000).toFixed(0)+'k'} },
      y1: { position: 'right', title: { display:true, text:'LCE当量（万吨）', font:{size:11} }, grid:{display:false}, min:4, max:10, ticks:{font:{size:10}} }
    }
  }
});
