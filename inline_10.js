
(function() {
  function dl(x, y, text, color, size, align) {
    var ctx = this;
    ctx.save();
    ctx.font = 'bold ' + (size || 9) + 'px system-ui,sans-serif';
    ctx.fillStyle = color;
    if (align === 'right') {
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, x + 3, y);
    } else {
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(text, x, y - 2);
    }
    ctx.restore();
  }

  function fmtK(v) { return (v / 1000).toFixed(0) + 'k'; }
  function fmt1(v) { return v.toFixed(1); }
  function fmt0(v) { return v.toFixed(0); }

  // ── helper: draw labels on bar chart ──────────────────────────────────────
  function drawBars(chart, di, colorFn, fmtFn) {
    var ctx = chart.ctx;
    var yS = chart.scales.y;
    var xS = chart.scales.x;
    var meta = chart.getDatasetMeta(di);
    meta.data.forEach(function(bar, i) {
      var v = chart.data.datasets[di].data[i];
      if (v === null || v === undefined) return;
      var x = xS.getPixelForValue(i);
      var y = yS.getPixelForValue(v);
      dl.call(ctx, x, y, fmtFn(v), colorFn(v, i), 9, 'center');
    });
  }

  // ── helper: draw labels on line chart ────────────────────────────────────
  function drawLine(chart, di, colorFn, fmtFn) {
    var ctx = chart.ctx;
    var yS = chart.scales.y;
    var xS = chart.scales.x;
    var meta = chart.getDatasetMeta(di);
    meta.data.forEach(function(pt, i) {
      var v = chart.data.datasets[di].data[i];
      if (v === null || v === undefined) return;
      var x = xS.getPixelForValue(i);
      var y = yS.getPixelForValue(v);
      dl.call(ctx, x, y, fmtFn(v), colorFn(v, i), 9, 'center');
    });
  }

  // ── helper: draw labels on horizontal bar chart ──────────────────────────
  function drawHBar(chart, di, colorFn, fmtFn) {
    var ctx = chart.ctx;
    var xS = chart.scales.x;
    var yS = chart.scales.y;
    var meta = chart.getDatasetMeta(di);
    meta.data.forEach(function(bar, i) {
      var v = chart.data.datasets[di].data[i];
      if (v === null || v === undefined) return;
      var x = xS.getPixelForValue(v);
      var y = yS.getPixelForValue(i);
      dl.call(ctx, x, y, fmtFn(v), colorFn(v, i), 9, 'right');
    });
  }

  // ── Chart 1: 碳酸锂产量 bar+line ─────────────────────────────────────────
  Chart.register({
    id: 'dl_lc_prod',
    afterDraw: function(chart) {
      if (chart.canvas.id !== 'chart_lc_prod') return;
      drawBars(chart, 0, function() { return '#0a6e3f'; }, fmtK);
    }
  });

  // ── Chart 2: TOP15 horizontal bar ────────────────────────────────────────
  Chart.register({
    id: 'dl_top15',
    afterDraw: function(chart) {
      if (chart.canvas.id !== 'chart_top15') return;
      drawHBar(chart, 0, function(v, i) { return i === 11 ? '#D5A858' : '#0a6e3f'; },
        function(v) { return v >= 1000 ? (v / 1000).toFixed(1) + 'k' : v; });
    }
  });

  // ── Chart 3: 碳酸锂YoY dual bar ──────────────────────────────────────────
  Chart.register({
    id: 'dl_lc_yoy',
    afterDraw: function(chart) {
      if (chart.canvas.id !== 'chart_lc_yoy') return;
      var ctx = chart.ctx;
      var yS = chart.scales.y;
      var xS = chart.scales.x;
      // 2025 bars (dataset 0) — dimmed
      var meta0 = chart.getDatasetMeta(0);
      meta0.data.forEach(function(bar, i) {
        var v = chart.data.datasets[0].data[i];
        if (v === null) return;
        var x = xS.getPixelForValue(i);
        var y = yS.getPixelForValue(v);
        dl.call(ctx, x, y, fmtK(v), 'rgba(10,110,63,0.4)', 8, 'center');
      });
      // 2026 bars (dataset 1) — solid
      var meta1 = chart.getDatasetMeta(1);
      meta1.data.forEach(function(bar, i) {
        var v = chart.data.datasets[1].data[i];
        if (v === null) return;
        var x = xS.getPixelForValue(i);
        var y = yS.getPixelForValue(v);
        dl.call(ctx, x, y, fmtK(v), '#0a6e3f', 9, 'center');
      });
    }
  });

  // ── Chart 4: 产能利用率 dual line ────────────────────────────────────────
  Chart.register({
    id: 'dl_capacity',
    afterDraw: function(chart) {
      if (chart.canvas.id !== 'chart_capacity') return;
      [0, 1].forEach(function(di) {
        var color = di === 0 ? '#0a6e3f' : '#35C8D4';
        drawLine(chart, di, function() { return color; }, function(v) { return fmt0(v) + '%'; });
      });
    }
  });

  // ── Chart 5: 矿石价格单线 ─────────────────────────────────────────────────
  Chart.register({
    id: 'dl_lc_price_main',
    afterDraw: function(chart) {
      if (chart.canvas.id !== 'chart_lc_price_main') return;
      drawLine(chart, 0, function() { return '#0a6e3f'; }, fmt1);
    }
  });

  // ── Chart 6: 多规格价格多线（仅标注第1条） ────────────────────────────────
  Chart.register({
    id: 'dl_lc_price_all',
    afterDraw: function(chart) {
      if (chart.canvas.id !== 'chart_lc_price_all') return;
      drawLine(chart, 0, function() { return '#0a6e3f'; }, fmt1);
    }
  });

  // ── Chart 7: 碳酸锂进口 bar+line ─────────────────────────────────────────
  Chart.register({
    id: 'dl_lc_import',
    afterDraw: function(chart) {
      if (chart.canvas.id !== 'chart_lc_import') return;
      drawBars(chart, 0, function(v, i) { return i >= 7 ? '#0a6e3f' : 'rgba(10,110,63,0.35)'; }, fmtK);
    }
  });

  // ── Chart 8: 锂辉石进口 bar+line ──────────────────────────────────────────
  Chart.register({
    id: 'dl_lx_import',
    afterDraw: function(chart) {
      if (chart.canvas.id !== 'chart_lx_import') return;
      drawBars(chart, 0, function() { return '#5B8DEF'; }, fmtK);
    }
  });

  // ── Chart 9: 氢氧化锂产量 bar+line ───────────────────────────────────────
  Chart.register({
    id: 'dl_hl_prod',
    afterDraw: function(chart) {
      if (chart.canvas.id !== 'chart_hl_prod') return;
      drawBars(chart, 0, function() { return '#35C8D4'; }, fmtK);
    }
  });

  // ── Chart 10: 氢氧化锂价格双线（仅标注第1条） ──────────────────────────────
  Chart.register({
    id: 'dl_hl_price',
    afterDraw: function(chart) {
      if (chart.canvas.id !== 'chart_hl_price') return;
      drawLine(chart, 0, function() { return '#0a6e3f'; }, fmt1);
    }
  });

})();
