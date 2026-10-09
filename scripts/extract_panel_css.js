#!/usr/bin/env node
/**
 * 从 DS-Whalegirl.user.js 的面板 CSS 装配区真求值，提取真实设计 token。
 *
 * 为什么需要它：落地页要与脚本面板「风格完全一致」，
 * 手抄变量一定会漂移（脚本改了就对不上）。
 * 本脚本直接 eval 脚本里的 LAYOUT_CSS_PARTS 数组字面量与全部 .push() 调用，
 * 拼出与运行时完全相同的 CSS，再把关键 token 打印出来供比对。
 *
 * 用法：
 *   node scripts/extract_panel_css.js             # 打印 token
 *   node scripts/extract_panel_css.js --dump      # 同时写出 ./_real_panel.css
 *
 * 注意：脚本源码改动后请重跑本文件，并同步 landing/landing.css 的注释。
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const SRC = path.join(ROOT, "DS-Whalegirl.user.js");

if (!fs.existsSync(SRC)) {
  console.error("找不到脚本文件：" + SRC);
  process.exit(2);
}
const s = fs.readFileSync(SRC, "utf8");

/* 抓取 `const NAME = [ ... ]` 的数组字面量（括号配平，跳过字符串内的括号） */
function grabArray(varname) {
  const m = s.match(new RegExp("const\\s+" + varname + "\\s*=\\s*\\["));
  if (!m) return null;
  const i = s.indexOf("[", m.index);
  let depth = 0, inStr = false, quote = "", esc = false;
  for (let j = i; j < s.length; j++) {
    const c = s[j];
    if (esc) { esc = false; continue; }
    if (c === "\\") { esc = true; continue; }
    if (!inStr) {
      if (c === '"' || c === "'" || c === "`") { inStr = true; quote = c; }
      else if (c === "[") depth++;
      else if (c === "]") { depth--; if (depth === 0) return s.slice(i, j + 1); }
    } else if (c === quote) inStr = false;
  }
  return null;
}

/* 抓取 NAME.push( "..." + "..." ) 的实参 */
function grabPushArgs(varname) {
  const out = [];
  const re = new RegExp(varname + "\\.push\\(", "g");
  let m;
  while ((m = re.exec(s))) {
    const i = s.indexOf("(", m.index);
    let depth = 0, inStr = false, quote = "", esc = false, hit = false;
    for (let j = i; j < s.length; j++) {
      const c = s[j];
      if (esc) { esc = false; continue; }
      if (c === "\\") { esc = true; continue; }
      if (!inStr) {
        if (c === '"' || c === "'" || c === "`") { inStr = true; quote = c; }
        else if (c === "(") depth++;
        else if (c === ")") { depth--; if (depth === 0) { out.push(s.slice(i + 1, j)); hit = true; break; } }
      } else if (c === quote) inStr = false;
    }
    if (!hit) break;
  }
  return out;
}

function evalSafe(expr) {
  try { return eval(expr); } catch (e) { return null; }
}

const parts = [];
const init = grabArray("LAYOUT_CSS_PARTS");
if (init) parts.push(evalSafe(init) || "");
for (const args of grabPushArgs("LAYOUT_CSS_PARTS")) {
  const v = evalSafe(args);
  if (v) parts.push(v);
}
const popInit = grabArray("POPPER_CSS");
if (popInit) parts.push(evalSafe(popInit) || "");
for (const args of grabPushArgs("POPPER_CSS")) {
  const v = evalSafe(args);
  if (v) parts.push(v);
}

const css = parts.join("");
console.log("拼出CSS 长度：" + css.length + " 字符");

function collectVars(prefix) {
  const out = {};
  const re = new RegExp("(" + prefix + "[\\w-]+)\\s*:\\s*([^;}\\n]{2,180})", "g");
  let m;
  while ((m = re.exec(css))) if (!(m[1] in out)) out[m[1]] = m[2].trim();
  return out;
}

for (const [label, prefix] of [["--hx-*", "--hx-[a-z-]+"], ["--lg-*", "--lg-[a-z-]+"]]) {
  const vars = collectVars(prefix);
  console.log("\n=== " + label + "（" + Object.keys(vars).length + "）===");
  for (const [k, v] of Object.entries(vars)) console.log("  " + k + ": " + v);
}

const kf = [...new Set([...css.matchAll(/@keyframes\s+([\w-]+)/g)].map(x => x[1]))];
console.log("\n=== 关键帧（" + kf.length + "）===\n  " + kf.join(", "));

const rr = {};
for (const x of css.matchAll(/border-radius:\s*([0-9.]+(?:px|%|em))/g)) rr[x[1]] = (rr[x[1]] || 0) + 1;
console.log("\n=== 圆角频次（脚本内实际取值）===");
Object.entries(rr).sort((a, b) => b[1] - a[1]).slice(0, 12)
  .forEach(([k, n]) => console.log("  " + k.padEnd(9) + " x" + n));

const bf = [...new Set([...css.matchAll(/backdrop-filter:\s*([^;}]{3,60})/g)].map(x => x[1].trim()))];
console.log("\n=== backdrop-filter ===\n  " + bf.join("\n  "));

if (process.argv.includes("--dump")) {
  const out = path.join(ROOT, "_real_panel.css");
  fs.writeFileSync(out, css, "utf8");
  console.log("\n已写出：" + out);
}