
new Chart(document.getElementById('chart_top15').getContext('2d'), {
  type: 'bar',
  data: {
    labels: ['其它','九岭锂业','蓝科锂业','四川雅化','新疆西海','赣锋锂业','盛新锂能','广西华友','天齐锂业','中信国安','中矿资源','龙蟠时代','银锂','融捷股份','永兴材料'],
    datasets: [{
      label: '产量（吨）',
      data: [22100,7500,6650,4600,4500,4500,4400,4300,4300,3250,2500,2302,2300,2000,2000],
      backgroundColor: function(ctx) {
        return ctx.dataIndex === 11 ? 'rgba(213,168,88,0.85)' : 'rgba(10,110,63,0.65)';
      },
      borderColor: function(ctx) {
        return ctx.dataIndex === 11 ? '#D5A858' : '#0a6e3f';
      },
      borderWidth: 1.5,
      borderRadius: 3
    }]
  },
  options: {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: function(ctx) {
            return ctx.raw.toLocaleString()+' 吨  排名#'+(ctx.dataIndex+1);
          },
          afterLabel: function(ctx) {
            if(ctx.dataIndex === 11) return '★ 龙蟠时代';
            return '';
          }
        }
      }
    },
    scales: {
      x: { title: { display:true, text:'产量（吨）', font:{size:11} }, grid:{color:'rgba(0,0,0,0.06)'}, ticks:{font:{size:10}, callback: v=>v.toLocaleString()} },
      y: { grid:{display:false}, ticks:{font:{size:10}} }
    }
  }
});
