const fs = require('fs');
const path = require('path');
const acorn = require('C:/Users/1/.workbuddy/binaries/node/workspace/node_modules/acorn');

const ROOT = 'D:/trae/AI Daily report';
// classic <script src> in document order from index_v3.html
const rel = [
  'auth_policy.js',
  'inline_auth.js',
  'embedded_data.gz.js',
  'assets/echarts.min.js',
  'electrolyte_data.js',
  'recycling_data_v3.js',
  'chemical_data.js',
  '_radar_scoring_config.js',
  'reports/radar_history.js',
  'portal-bundle.js',
  'bu_gate.js',
  'recycling_gantt.js',
  'inline_03.min.js',
  'inline_04.js',
  'inline_05.js',
  'inline_06.js',
  'inline_07.js',
  'inline_08.js',
  'inline_09.js',
  'assets/ai_fab_inject.js',
  'feishu-jsapi.js',
];

function collect(file) {
  const abs = path.join(ROOT, file);
  if (!fs.existsSync(abs)) return null;
  const src = fs.readFileSync(abs, 'utf8');
  let ast;
  try {
    ast = acorn.parse(src, { ecmaVersion: 'latest', sourceType: 'script' });
  } catch (e) {
    return { error: e.message, src };
  }
  const decls = []; // {name, start, kind, line}
  let depth = 0;
  function lineOf(offset) {
    return src.slice(0, offset).split('\n').length;
  }
  function walk(node) {
    if (!node || typeof node !== 'object') return;
    const enterFn = node.type === 'FunctionDeclaration' || node.type === 'FunctionExpression' || node.type === 'ArrowFunctionExpression';
    if (enterFn) depth++;
    // top-level (function-depth 0) declarations
    if (depth === 0) {
      if (node.type === 'VariableDeclaration') {
        for (const d of node.declarations) {
          const name = d.id && d.id.type === 'Identifier' ? d.id.name : (d.id && d.id.type === 'ObjectPattern' ? '<pattern>' : (d.id && d.id.type === 'ArrayPattern' ? '<array>' : '?'));
          if (name && name[0] !== '<') {
            decls.push({ name, start: node.start, kind: node.kind, line: lineOf(node.start) });
          }
        }
      } else if (node.type === 'FunctionDeclaration' && node.id) {
        decls.push({ name: node.id.name, start: node.start, kind: 'function', line: lineOf(node.start) });
      } else if (node.type === 'ClassDeclaration' && node.id) {
        decls.push({ name: node.id.name, start: node.start, kind: 'class', line: lineOf(node.start) });
      }
    }
    for (const k of Object.keys(node)) {
      if (k === 'type' || k === 'start' || k === 'end') continue;
      const v = node[k];
      if (Array.isArray(v)) { for (const c of v) if (c && typeof c.type === 'string') walk(c); }
      else if (v && typeof v.type === 'string') walk(v);
    }
    if (enterFn) depth--;
  }
  walk(ast);
  return { decls, src };
}

const byName = {};
const meta = {};
for (const f of rel) {
  const r = collect(f);
  if (!r) { console.log(`MISSING: ${f}`); continue; }
  if (r.error) { console.log(`PARSE_ERR ${f}: ${r.error}`); continue; }
  meta[f] = r;
  for (const d of r.decls) {
    (byName[d.name] = byName[d.name] || []).push({ file: f, ...d });
  }
}

console.log('=== COLLISIONS (top-level name declared in >1 script, not all var) ===');
let count = 0;
for (const name of Object.keys(byName)) {
  const list = byName[name];
  if (list.length < 2) continue;
  const nonVar = list.filter(x => x.kind !== 'var' && x.kind !== 'function' && x.kind !== 'class');
  if (nonVar.length === 0) continue; // all var OR function/class (functions/classes don't collide like let/const across scripts? actually class does, but skip for now)
  count++;
  const locs = list.map(x => `${x.file}:${x.line}(${x.kind})`).join('  ');
  console.log(`* ${name}  =>  ${locs}`);
}
console.log(`TOTAL colliding names: ${count}`);
