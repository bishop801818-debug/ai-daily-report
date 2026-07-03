
new Chart(document.getElementById('chart_capacity').getContext('2d'), {
  type: 'line',
  data: {
    labels: ['25-06','25-07','25-08','25-09','25-10','25-11','25-12','26-01','26-02','26-03','26-04','26-05'],
    datasets: [
      {
        label: '碳酸锂产能利用率',
        data: [78.5,75.9,77.6,76.8,79.1,81.3,85.3,86.4,75.6,89.9,93.3,91.8],
        borderColor: '#0a6e3f', backgroundColor:'rgba(10,110,63,0.08)',
        borderWidth: 2.5, tension: 0.4, fill: true, pointRadius: 4, pointBackgroundColor:'#0a6e3f'
      },
      {
        label: '氢氧化锂产能利用率',
        data: [55,51,52,57,57,51,54,54,49,56,55,55],
        borderColor: '#35C8D4', backgroundColor:'rgba(53,200,212,0.08)',
        borderWidth: 2.5, tension: 0.4, fill: true, pointRadius: 4, pointBackgroundColor:'#35C8D4'
      }
    ]
  },
  options: {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom', labels: { font: { size: 11 }, boxWidth: 12 } },
      tooltip: { callbacks: { label: ctx => ctx.dataset.label+': '+ctx.raw+'%' } }
    },
    scales: {
      y: { min: 40, title: { display:true, text:'产能利用率（%）', font:{size:11} }, grid:{color:'rgba(0,0,0,0.06)'}, ticks:{font:{size:10}} },
      x: { grid:{color:'rgba(0,0,0,0.04)'}, ticks:{font:{size:10}} }
    }
  }
});
