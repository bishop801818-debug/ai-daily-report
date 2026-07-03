
window.__EMBEDDED__ = null

(function() {
  var _orig = window.fetch;
  window.fetch = function(url, opts) {
    var s = typeof url === 'string' ? url : (url.url || String(url));

    // market_lc.json
    if (s.includes('market_lc.json')) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: function() {
          return Promise.resolve(window.__EMBEDDED__.marketLc || {});
        }
      });
    }

    // market_lfp.json
    if (s.includes('market_lfp.json')) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: function() {
          return Promise.resolve(window.__EMBEDDED__.marketLfp || {});
        }
      });
    }

    // index.json
    if (s.includes('index.json')) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: function() {
          return Promise.resolve(window.__EMBEDDED__.index || {});
        }
      });
    }

    // policies.json → 返回清洗后的 policies 数组
    if (s.includes('policies.json') || s.includes('policies_clean')) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: function() {
          var p = window.__EMBEDDED__.policies;
          // 支持新旧两种格式
          var arr = (p && p.policies) ? p.policies : (Array.isArray(p) ? p : []);
          return Promise.resolve({ policies: arr });
        }
      });
    }

    // reports/YYYY-MM-DD.json
    var m = s.match(/reports\/(\d{4}-\d{2}-\d{2})\.json/);
    if (m) {
      var date = m[1];
      if (date === window.__EMBEDDED__.today && window.__EMBEDDED__.report) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: function() { return Promise.resolve(window.__EMBEDDED__.report); }
        });
      }
      // 其他日期返回空结构
      return Promise.resolve({
        ok: true,
        status: 200,
        json: function() { return Promise.resolve({departments: {}}); }
      });
    }

    return _orig.apply(window, arguments);
  };
})();

