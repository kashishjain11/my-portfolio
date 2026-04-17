import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  fetchAccounts, updateAccount,
  fetchHoldings, addHolding, updateHolding, removeHolding,
  addTranche, updateTranche, deleteTranche, updateTrancheDividends,
  fetchSoldPositions, addSoldPosition, deleteSoldPosition,
} from "./lib/db";

const FINNHUB_API_KEY = import.meta.env.VITE_FINNHUB_API_KEY;
const FINNHUB_BASE = "https://finnhub.io/api/v1";
const GNEWS_API_KEY = "12be21470662cfb31adbac431359c317";
const GNEWS_BASE = "https://gnews.io/api/v4";
const EXCHANGE_RATE_KEY = "d554cb1931122d2d7a0409c3";

const GlobalStyle = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Outfit:wght@400;500;600;700;800&display=swap');
    *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
    :root {
      --bg-0:#0a0b0e; --bg-1:#111318; --bg-2:#181b22; --bg-3:#1f232e; --bg-4:#252a37;
      --border:rgba(255,255,255,0.07); --border-hi:rgba(255,255,255,0.14);
      --text-0:#f0f2f7; --text-1:#9aa3b8; --text-2:#5d677e;
      --accent:#4f9cf9; --accent-dim:rgba(79,156,249,0.12);
      --green:#3ecf8e; --green-dim:rgba(62,207,142,0.12);
      --red:#f66e6e; --red-dim:rgba(246,110,110,0.12);
      --amber:#f5a623; --amber-dim:rgba(245,166,35,0.12);
      --purple:#a78bfa; --purple-dim:rgba(167,139,250,0.12);
      --teal:#22d3ee; --teal-dim:rgba(34,211,238,0.12);
      --radius:12px; --radius-sm:8px;
      --mono:'DM Mono',monospace; --sans:'Outfit',sans-serif;
    }
    body { background:var(--bg-0); color:var(--text-0); font-family:var(--sans); -webkit-font-smoothing:antialiased; }
    ::-webkit-scrollbar { width:4px; height:4px; }
    ::-webkit-scrollbar-track { background:var(--bg-1); }
    ::-webkit-scrollbar-thumb { background:var(--bg-4); border-radius:4px; }
    .app { display:flex; height:100vh; overflow:hidden; }
    .sidebar { width:240px; min-width:240px; background:var(--bg-1); border-right:1px solid var(--border); display:flex; flex-direction:column; padding:20px 0; overflow-y:auto; }
    .sidebar-logo { padding:0 20px 20px; border-bottom:1px solid var(--border); margin-bottom:12px; }
    .sidebar-logo h1 { font-size:17px; font-weight:800; letter-spacing:-0.3px; }
    .sidebar-logo h1 span { color:var(--accent); }
    .sidebar-logo p { font-size:10px; font-family:var(--mono); color:var(--text-2); margin-top:2px; text-transform:uppercase; letter-spacing:1px; }
    .sidebar-section { padding:0 12px; margin-bottom:4px; }
    .sidebar-section-label { font-size:9px; font-family:var(--mono); color:var(--text-2); text-transform:uppercase; letter-spacing:1.5px; padding:8px 8px 4px; }
    .sidebar-owner-label { font-size:13px; font-weight:800; color:#f0f2f7; padding:10px 8px 4px; text-transform:uppercase; letter-spacing:0.5px; border-top:2px solid rgba(255,255,255,0.15); margin-top:6px; margin-bottom:4px; }
    .sidebar-item { display:flex; align-items:center; gap:9px; padding:8px 8px; border-radius:var(--radius-sm); font-size:12.5px; font-weight:500; color:var(--text-1); cursor:pointer; transition:all 0.15s; border:1px solid transparent; }
    .sidebar-item:hover { background:var(--bg-3); color:var(--text-0); }
    .sidebar-item.active { background:var(--accent-dim); color:var(--accent); border-color:rgba(79,156,249,0.2); }
    .sidebar-item .icon { font-size:14px; width:18px; text-align:center; flex-shrink:0; }
    .sidebar-footer { margin-top:auto; padding:16px 20px 0; border-top:1px solid var(--border); }
    .sidebar-footer p { font-size:10px; font-family:var(--mono); color:var(--text-2); line-height:1.6; }
    .main { flex:1; overflow-y:auto; display:flex; flex-direction:column; }
    .topbar { padding:18px 32px; border-bottom:1px solid var(--border); background:var(--bg-0); display:flex; align-items:center; justify-content:space-between; position:sticky; top:0; z-index:50; backdrop-filter:blur(10px); }
    .topbar-title { font-size:22px; font-weight:800; letter-spacing:-0.5px; }
    .topbar-subtitle { font-size:11px; color:var(--text-2); font-family:var(--mono); margin-top:2px; }
    .topbar-right { display:flex; align-items:center; gap:12px; }
    .content { padding:28px 32px; flex:1; }
    .btn { display:inline-flex; align-items:center; gap:6px; padding:8px 16px; border-radius:var(--radius-sm); font-family:var(--sans); font-size:13px; font-weight:600; cursor:pointer; transition:all 0.15s; border:1px solid transparent; }
    .btn-primary { background:var(--accent); color:#fff; border-color:var(--accent); }
    .btn-primary:hover { background:#6baaf9; }
    .btn-ghost { background:transparent; color:var(--text-1); border-color:var(--border-hi); }
    .btn-ghost:hover { background:var(--bg-3); color:var(--text-0); }
    .btn-danger { background:var(--red-dim); color:var(--red); border-color:rgba(246,110,110,0.2); }
    .btn-danger:hover { background:rgba(246,110,110,0.25); }
    .btn-buy { background:var(--accent-dim); color:var(--accent); border-color:rgba(79,156,249,0.3); font-size:15px; padding:14px 32px; }
    .btn-buy:hover { background:var(--accent); color:#fff; }
    .btn-sell { background:var(--red-dim); color:var(--red); border-color:rgba(246,110,110,0.3); font-size:15px; padding:14px 32px; }
    .btn-sell:hover { background:var(--red); color:#fff; }
    .btn-sm { padding:5px 10px; font-size:11px; }
    .btn-icon { padding:6px; }
    .btn:disabled { opacity:0.5; cursor:not-allowed; }
    .card { background:var(--bg-2); border:1px solid var(--border); border-radius:var(--radius); padding:20px; }
    .card-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:16px; }
    .card-title { font-size:13px; font-family:var(--mono); color:var(--text-2); text-transform:uppercase; letter-spacing:1px; font-weight:500; }
    .stats-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(190px,1fr)); gap:14px; margin-bottom:24px; }
    .stat-card { background:var(--bg-2); border:1px solid var(--border); border-radius:var(--radius); padding:16px 18px; position:relative; overflow:hidden; }
    .stat-card::before { content:''; position:absolute; top:0; left:0; right:0; height:2px; }
    .stat-card.accent::before { background:var(--accent); }
    .stat-card.green::before { background:var(--green); }
    .stat-card.red::before { background:var(--red); }
    .stat-card.amber::before { background:var(--amber); }
    .stat-card.purple::before { background:var(--purple); }
    .stat-card.teal::before { background:var(--teal); }
    .stat-label { font-size:14px; font-weight:700; color:#c8cfe0; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:7px; }
    .stat-value { font-size:20px; font-weight:800; letter-spacing:-0.5px; }
    .stat-sub { font-size:11px; color:var(--text-1); margin-top:4px; font-family:var(--mono); }
    .section { margin-bottom:28px; }
    .section-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:14px; }
    .section-title { font-size:17px; font-weight:800; letter-spacing:-0.3px; color:var(--text-0); }
    .section-sub { font-size:12px; color:var(--text-2); font-family:var(--mono); margin-top:2px; }
    .table-wrap { overflow-x:auto; border-radius:var(--radius); border:1px solid var(--border); }
    table { width:100%; border-collapse:collapse; font-size:12.5px; }
    thead { background:var(--bg-3); }
    th { padding:10px 14px; text-align:left; font-size:14px; font-family:var(--sans); color:#c8cfe0; text-transform:uppercase; letter-spacing:0.5px; font-weight:700; white-space:nowrap; border-bottom:1px solid var(--border); }
    td { padding:11px 14px; border-bottom:1px solid var(--border); color:var(--text-0); vertical-align:middle; white-space:nowrap; }
    tbody tr { background:var(--bg-2); transition:background 0.1s; }
    tbody tr:hover { background:var(--bg-3); }
    tbody tr:last-child td { border-bottom:none; }
    .mono { font-family:var(--mono); }
    .text-right { text-align:right; }
    .badge { display:inline-flex; align-items:center; padding:2px 8px; border-radius:20px; font-size:10px; font-family:var(--mono); font-weight:500; letter-spacing:0.5px; }
    .badge-blue { background:var(--accent-dim); color:var(--accent); }
    .badge-amber { background:var(--amber-dim); color:var(--amber); }
    .pos { color:var(--green); } .neg { color:var(--red); }
    .progress-bar { height:4px; background:var(--bg-4); border-radius:4px; overflow:hidden; }
    .progress-fill { height:100%; border-radius:4px; transition:width 0.5s ease; }
    .modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.75); backdrop-filter:blur(4px); z-index:200; display:flex; align-items:center; justify-content:center; padding:20px; }
    .modal { background:var(--bg-2); border:1px solid var(--border-hi); border-radius:16px; width:100%; max-width:580px; max-height:90vh; overflow-y:auto; box-shadow:0 30px 60px rgba(0,0,0,0.6); }
    .modal-header { padding:22px 24px 14px; border-bottom:1px solid var(--border); display:flex; align-items:center; justify-content:space-between; }
    .modal-title { font-size:17px; font-weight:800; }
    .modal-body { padding:20px 24px; }
    .modal-footer { padding:14px 24px; border-top:1px solid var(--border); display:flex; justify-content:flex-end; gap:10px; }
    .form-grid { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
    .form-group { display:flex; flex-direction:column; gap:6px; }
    .form-group.full { grid-column:1 / -1; }
    label { font-size:11px; font-family:var(--mono); color:var(--text-2); text-transform:uppercase; letter-spacing:0.8px; font-weight:500; }
    input,select { background:var(--bg-3); border:1px solid var(--border-hi); border-radius:var(--radius-sm); padding:9px 12px; color:var(--text-0); font-family:var(--sans); font-size:13px; outline:none; transition:border-color 0.15s; width:100%; }
    input:focus,select:focus { border-color:var(--accent); }
    select option { background:var(--bg-3); }
    .grid-2 { display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:24px; }
    .ticker { font-family:var(--mono); font-size:12px; font-weight:500; background:var(--bg-4); border-radius:4px; padding:2px 7px; }
    .spinner { width:16px; height:16px; border:2px solid var(--bg-4); border-top-color:var(--accent); border-radius:50%; animation:spin 0.7s linear infinite; display:inline-block; }
    @keyframes spin { to { transform:rotate(360deg); } }
    .empty { padding:40px; text-align:center; color:var(--text-2); }
    .empty .icon { font-size:32px; margin-bottom:10px; }
    .empty p { font-size:13px; }
    .divider { height:1px; background:var(--border); margin:14px 0; }
    .legend { display:flex; flex-direction:column; gap:8px; }
    .legend-item { display:flex; align-items:center; gap:8px; font-size:12px; }
    .legend-dot { width:10px; height:10px; border-radius:50%; flex-shrink:0; }
    .legend-label { color:var(--text-1); flex:1; }
    .legend-val { font-family:var(--mono); font-size:11px; color:var(--text-0); }
    .svg-chart { width:100%; overflow:visible; }
    .loading-screen { display:flex; flex-direction:column; align-items:center; justify-content:center; height:100vh; gap:16px; background:var(--bg-0); }
    .loading-screen p { font-family:var(--mono); color:var(--text-2); font-size:12px; }
    .alert-error { background:var(--red-dim); border:1px solid rgba(246,110,110,0.2); color:var(--red); padding:12px 16px; border-radius:var(--radius-sm); font-size:12px; }
    .tab-bar { display:flex; gap:4px; background:var(--bg-2); border:1px solid var(--border); border-radius:var(--radius-sm); padding:4px; margin-bottom:20px; width:fit-content; }
    .tab { padding:6px 14px; border-radius:6px; font-size:12px; font-weight:600; cursor:pointer; color:var(--text-1); transition:all 0.15s; }
    .tab.active { background:var(--bg-4); color:var(--text-0); }
    .tranche-row { background:var(--bg-3); border-radius:var(--radius-sm); padding:12px 14px; margin-bottom:8px; border:1px solid var(--border); }
    .divband { display:flex; align-items:center; gap:8px; padding:8px 0; border-bottom:1px solid var(--border); font-size:12px; }
    .divband:last-child { border-bottom:none; }
    .fx-badge { font-size:9px; font-family:var(--mono); background:var(--amber-dim); color:var(--amber); padding:1px 5px; border-radius:4px; margin-left:4px; }
    .notif-dot { position:absolute; top:2px; right:2px; width:8px; height:8px; border-radius:50%; background:var(--red); border:2px solid var(--bg-0); }
    .notif-panel { position:absolute; top:calc(100% + 8px); right:0; width:340px; background:var(--bg-2); border:1px solid var(--border-hi); border-radius:var(--radius); box-shadow:0 20px 40px rgba(0,0,0,0.5); z-index:100; max-height:480px; overflow-y:auto; }
    .notif-item { padding:12px 16px; border-bottom:1px solid var(--border); display:flex; gap:10px; align-items:flex-start; }
    .notif-item:last-child { border-bottom:none; }
    .notif-icon { font-size:16px; flex-shrink:0; margin-top:1px; }
    .notif-title { font-size:12px; font-weight:700; color:var(--text-0); margin-bottom:2px; }
    .notif-body { font-size:11px; color:var(--text-1); line-height:1.4; }
    .notif-time { font-size:10px; color:var(--text-2); font-family:var(--mono); margin-top:3px; }
    .sell-preview { background:var(--bg-3); border-radius:var(--radius-sm); padding:14px 16px; margin-top:14px; }
    .sell-preview-row { display:flex; justify-content:space-between; align-items:center; padding:5px 0; font-size:13px; }
    .sell-preview-label { color:var(--text-2); font-family:var(--mono); font-size:11px; text-transform:uppercase; }
    .sell-preview-val { font-weight:700; }
    .activity-choice { display:flex; gap:16px; justify-content:center; padding:20px 0; }
  `}</style>
);

const ACCOUNT_TYPES = [
  { id:"rrsp_k",    label:"RRSP – Kashish",   owner:"Kashish", type:"RRSP",   color:"#4f9cf9" },
  { id:"tfsa_k",    label:"TFSA – Kashish",    owner:"Kashish", type:"TFSA",   color:"#a78bfa" },
  { id:"nonreg_k",  label:"Non-Reg – Kashish", owner:"Kashish", type:"NonReg", color:"#3ecf8e" },
  { id:"rrsp_dj",   label:"RRSP – DJ",         owner:"DJ",      type:"RRSP",   color:"#f5a623" },
  { id:"tfsa_dj",   label:"TFSA – DJ",         owner:"DJ",      type:"TFSA",   color:"#f66e6e" },
  { id:"nonreg_dj", label:"Non-Reg – DJ",      owner:"DJ",      type:"NonReg", color:"#22d3ee" },
  { id:"joint_k",   label:"Joint",             owner:"Joint",   type:"Joint",  color:"#e879f9" },
];
const COLORS = ["#4f9cf9","#3ecf8e","#a78bfa","#f5a623","#f66e6e","#22d3ee","#e879f9","#fb923c","#a3e635"];
const EXCHANGES = ["TSX","NASDAQ","NYSE","TSX-V","CBOE","LSE","OTHER"];
const USD_EXCHANGES = ["NASDAQ","NYSE","CBOE"];

const fmt = (n,dec=2) => n==null?"—":n.toLocaleString("en-CA",{minimumFractionDigits:dec,maximumFractionDigits:dec});
const fmtDollar = (n,showSign=false,currency="CAD") => {
  if(n==null)return"—";
  const s=(currency==="USD"?"US$":"$")+Math.abs(n).toLocaleString("en-CA",{minimumFractionDigits:2,maximumFractionDigits:2});
  return showSign?(n>=0?"+"+s:"-"+s):(n<0?"-"+s:s);
};
const fmtPct = (n,showSign=false) => n==null?"—":(showSign&&n>=0?"+":"")+fmt(n)+"%";
const today = () => new Date().toISOString().split("T")[0];
const uid = () => crypto.randomUUID();
const isUSD = (exchange) => USD_EXCHANGES.includes(exchange);

function resolveTicker(ticker, exchange) {
  const t = ticker.toUpperCase().replace(/\.TO$/i,"");
  if (["TSX","TSX-V"].includes(exchange)) return t + ".TO";
  return t;
}

async function fetchUSDCAD() {
  try {
    const r = await fetch(`https://v6.exchangerate-api.com/v6/${EXCHANGE_RATE_KEY}/pair/USD/CAD`);
    const d = await r.json();
    if (d.conversion_rate) return d.conversion_rate;
    return 1.36;
  } catch { return 1.36; }
}

async function fetchPrice(ticker, exchange) {
  const symbol = resolveTicker(ticker, exchange);
  try {
    const r = await fetch(`${FINNHUB_BASE}/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`);
    const d = await r.json();
    if (d.c && d.c > 0) return { price: d.c, change: d.d, changePct: d.dp, symbol };
    return null;
  } catch { return null; }
}

async function fetchSplits(ticker, exchange, fromDate) {
  const symbol = resolveTicker(ticker, exchange);
  try {
    const r = await fetch(`${FINNHUB_BASE}/stock/split?symbol=${symbol}&from=${fromDate}&to=${today()}&token=${FINNHUB_API_KEY}`);
    const d = await r.json();
    return Array.isArray(d) ? d : [];
  } catch { return []; }
}

async function fetchDividendInfo(ticker, exchange) {
  const symbol = resolveTicker(ticker, exchange);
  try {
    const r = await fetch(`${FINNHUB_BASE}/stock/metric?symbol=${symbol}&metric=all&token=${FINNHUB_API_KEY}`);
    const d = await r.json();
    return { annualDPS: d?.metric?.dividendPerShareAnnual??null, dividendYield: d?.metric?.dividendYieldIndicatedAnnual??null };
  } catch { return { annualDPS: null, dividendYield: null }; }
}

async function fetchUpcomingDividends(ticker, exchange) {
  const symbol = resolveTicker(ticker, exchange);
  const from = today();
  const to = new Date(Date.now()+90*86400000).toISOString().split("T")[0];
  try {
    const r = await fetch(`${FINNHUB_BASE}/calendar/dividend?from=${from}&to=${to}&symbol=${symbol}&token=${FINNHUB_API_KEY}`);
    const d = await r.json();
    return Array.isArray(d.dividendCalendar)?d.dividendCalendar:[];
  } catch { return []; }
}

const SECTOR_MACRO_QUERIES = {
  pharma:"pharmaceutical FDA drug approval biotech pipeline",
  biotech:"biotech FDA clinical trial drug approval oncology",
  energy:"oil price OPEC Middle East energy geopolitics war",
  tech:"technology semiconductor AI trade tariffs US China",
  finance:"interest rates Federal Reserve banking inflation",
  materials:"commodity prices supply chain tariffs mining",
  default:"stock market economy inflation tariffs geopolitics trade war",
};

function getSectorQuery(name, ticker) {
  const n=(name+ticker).toLowerCase();
  if(n.match(/pharma|drug|bio|therapeutics|medicine|health|clinical/))return SECTOR_MACRO_QUERIES.pharma;
  if(n.match(/biotech|genomic|clinical|oncol/))return SECTOR_MACRO_QUERIES.biotech;
  if(n.match(/energy|oil|gas|petroleum|solar|wind/))return SECTOR_MACRO_QUERIES.energy;
  if(n.match(/tech|software|semiconductor|ai|data|cloud/))return SECTOR_MACRO_QUERIES.tech;
  if(n.match(/bank|financial|insurance|capital|invest|hdfc|icici|kotak/))return SECTOR_MACRO_QUERIES.finance;
  if(n.match(/material|mining|steel|chemical|commodity/))return SECTOR_MACRO_QUERIES.materials;
  return SECTOR_MACRO_QUERIES.default;
}

async function fetchNews(ticker, exchange, name) {
  const cleanTicker=ticker.replace(".TO","").replace(".NS","").replace(".BO","");
  const cleanName=(name||"").replace(/['"]/g,"").trim();
  const shortName=cleanName.split(" ").slice(0,3).join(" ");
  const companyQ=encodeURIComponent(`${shortName} ${cleanTicker} stock`);
  const macroQ=encodeURIComponent(getSectorQuery(name||"",ticker));
  try {
    const [companyRes,macroRes]=await Promise.all([
      fetch(`${GNEWS_BASE}/search?q=${companyQ}&lang=en&max=6&sortby=publishedAt&token=${GNEWS_API_KEY}`),
      fetch(`${GNEWS_BASE}/search?q=${macroQ}&lang=en&max=4&sortby=publishedAt&token=${GNEWS_API_KEY}`),
    ]);
    const [companyData,macroData]=await Promise.all([companyRes.json(),macroRes.json()]);
    let companyArticles=(companyData.articles||[]).map(a=>({...a,category:"company"}));
    if(companyArticles.length===0){
      const fallbackRes=await fetch(`${GNEWS_BASE}/search?q=${encodeURIComponent(cleanTicker+" stock shares")}&lang=en&max=6&sortby=publishedAt&token=${GNEWS_API_KEY}`);
      const fallbackData=await fallbackRes.json();
      companyArticles=(fallbackData.articles||[]).map(a=>({...a,category:"company"}));
    }
    const macroArticles=(macroData.articles||[]).map(a=>({...a,category:"macro"}));
    const seen=new Set();
    return [...companyArticles,...macroArticles].filter(a=>{
      if(seen.has(a.title))return false; seen.add(a.title); return true;
    });
  } catch(e){console.error("News fetch error:",e);return[];}
}

// ── Split adjustment ──────────────────────────────────────────────────────────
function applySplitsToTranches(tranches, splits) {
  if(!splits||splits.length===0)return{tranches,adjusted:false};
  let adjusted=false;
  const newTranches=tranches.map(t=>{
    let shares=t.shares, costPrice=t.costPrice;
    splits.forEach(s=>{
      if(s.date>t.date){
        const ratio=s.toFactor/s.fromFactor;
        shares=shares*ratio;
        costPrice=costPrice/ratio;
        adjusted=true;
      }
    });
    return{...t,shares:Math.round(shares*10000)/10000,costPrice:Math.round(costPrice*10000)/10000};
  });
  return{tranches:newTranches,adjusted};
}

// ── Computed ──────────────────────────────────────────────────────────────────
function calcHolding(holding, prices, divInfo, usdcad=1.36) {
  const totalShares=holding.tranches.reduce((s,t)=>s+t.shares,0);
  const totalCostNative=holding.tranches.reduce((s,t)=>s+t.shares*t.costPrice,0);
  const avgCostNative=totalShares>0?totalCostNative/totalShares:0;
  const manualDividends=holding.tranches.reduce((s,t)=>s+(t.dividends||0),0);
  const priceKey=resolveTicker(holding.ticker,holding.exchange);
  const currentPriceNative=prices[priceKey]??null;
  const fx=isUSD(holding.exchange)?usdcad:1;
  const marketValueNative=currentPriceNative?currentPriceNative*totalShares:null;
  const totalCostCAD=totalCostNative*fx;
  const avgCostCAD=avgCostNative*fx;
  const marketValueCAD=marketValueNative!=null?marketValueNative*fx:null;
  const gainLossCAD=marketValueCAD!=null?marketValueCAD-totalCostCAD:null;
  const gainLossPct=gainLossCAD!=null&&totalCostCAD>0?(gainLossCAD/totalCostCAD)*100:null;
  const manualDividendsCAD=manualDividends*fx;
  const info=divInfo?.[priceKey];
  const estimatedAnnualDivCAD=info?.annualDPS!=null?info.annualDPS*totalShares*fx:null;
  const dividendYield=info?.dividendYield??null;
  const currency=isUSD(holding.exchange)?"USD":"CAD";
  return{totalShares,totalCostNative,avgCostNative,currentPriceNative,marketValueNative,totalCostCAD,avgCostCAD,marketValueCAD,gainLossCAD,gainLossPct,manualDividends,manualDividendsCAD,estimatedAnnualDivCAD,dividendYield,currency,fx,isConverted:fx!==1};
}

function calcAccount(accountId, holdings, prices, divInfo, usdcad) {
  const ah=holdings.filter(h=>h.accountId===accountId);
  let totalCostCAD=0,totalMarketCAD=0,totalDivsCAD=0;
  ah.forEach(h=>{const c=calcHolding(h,prices,divInfo,usdcad);totalCostCAD+=c.totalCostCAD;totalMarketCAD+=c.marketValueCAD??c.totalCostCAD;totalDivsCAD+=c.manualDividendsCAD;});
  return{totalCostCAD,totalMarketCAD,totalDivsCAD,holdingCount:ah.length};
}

function exportCSV(rows,filename){
  if(!rows.length)return;
  const keys=Object.keys(rows[0]);
  const csv=[keys.join(","),...rows.map(r=>keys.map(k=>JSON.stringify(r[k]??"")).join(","))].join("\n");
  const a=document.createElement("a");a.href="data:text/csv;charset=utf-8,"+encodeURIComponent(csv);a.download=filename;a.click();
}

// ── FIFO sell helper ──────────────────────────────────────────────────────────
function computeFIFOSell(tranches, sharesToSell) {
  const sorted=[...tranches].sort((a,b)=>a.date.localeCompare(b.date));
  let remaining=sharesToSell, totalCostSold=0;
  const updatedTranches=[];
  for(const t of sorted){
    if(remaining<=0){updatedTranches.push(t);continue;}
    if(t.shares<=remaining){remaining-=t.shares;totalCostSold+=t.shares*t.costPrice;}
    else{totalCostSold+=remaining*t.costPrice;updatedTranches.push({...t,shares:t.shares-remaining});remaining=0;}
  }
  return{updatedTranches,totalCostSold};
}

function PieChart({segments,size=150}){
  const total=segments.reduce((s,seg)=>s+(seg.value||0),0);
  if(!total)return<div className="empty"><p>No data</p></div>;
  let cursor=0;
  const r=size/2-10,cx=size/2,cy=size/2;
  const paths=segments.map((seg,i)=>{
    const pct=seg.value/total,angle=pct*2*Math.PI;
    const x1=cx+r*Math.sin(cursor),y1=cy-r*Math.cos(cursor);
    cursor+=angle;
    const x2=cx+r*Math.sin(cursor),y2=cy-r*Math.cos(cursor);
    return<path key={i} d={`M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${pct>0.5?1:0},1 ${x2},${y2} Z`} fill={seg.color||COLORS[i%COLORS.length]} opacity="0.9"/>;
  });
  return(
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cy} r={r+10} fill="var(--bg-3)"/>
      {paths}
      <circle cx={cx} cy={cy} r={r*0.55} fill="var(--bg-2)"/>
      <text x={cx} y={cy-4} textAnchor="middle" fill="var(--text-0)" fontSize="12" fontWeight="700" fontFamily="Outfit">100%</text>
      <text x={cx} y={cy+12} textAnchor="middle" fill="var(--text-2)" fontSize="9" fontFamily="DM Mono">ALLOCATED</text>
    </svg>
  );
}

function LineChart({data,color="var(--accent)",height=120}){
  if(!data||data.length<2)return<div style={{height,display:"flex",alignItems:"center",justifyContent:"center",color:"var(--text-2)",fontSize:12}}>No data</div>;
  const min=Math.min(...data),max=Math.max(...data),range=max-min||1;
  const pad={t:10,r:10,b:20,l:52},W=400-pad.l-pad.r,H=height-pad.t-pad.b;
  const pts=data.map((v,i)=>`${pad.l+(i/(data.length-1))*W},${pad.t+(1-(v-min)/range)*H}`);
  const area=[`M${pts[0]}`,...pts.slice(1).map(p=>`L${p}`),`L${pad.l+W},${pad.t+H}`,`L${pad.l},${pad.t+H}`,"Z"].join(" ");
  const line=[`M${pts[0]}`,...pts.slice(1).map(p=>`L${p}`)].join(" ");
  const gid=useMemo(()=>"g"+Math.random().toString(36).slice(2),[]);
  return(
    <svg viewBox={`0 0 400 ${height}`} className="svg-chart" style={{height}}>
      <defs><linearGradient id={gid} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity="0.25"/><stop offset="100%" stopColor={color} stopOpacity="0"/></linearGradient></defs>
      <path d={area} fill={`url(#${gid})`}/>
      <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"/>
      <text x={pad.l-4} y={pad.t+4} textAnchor="end" fill="var(--text-2)" fontSize="8" fontFamily="DM Mono">${fmt(max,0)}</text>
      <text x={pad.l-4} y={pad.t+H} textAnchor="end" fill="var(--text-2)" fontSize="8" fontFamily="DM Mono">${fmt(min,0)}</text>
    </svg>
  );
}

function BarChart({bars,height=100}){
  const max=Math.max(...bars.map(b=>Math.abs(b.value)),1);
  return(
    <div style={{display:"flex",alignItems:"flex-end",gap:6,height,paddingTop:8}}>
      {bars.map((bar,i)=>(
        <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
          <div style={{height:(Math.abs(bar.value)/max)*(height-20),width:"100%",maxWidth:28,background:bar.value>=0?"var(--green)":"var(--red)",borderRadius:"4px 4px 0 0",opacity:0.85}}/>
          <div style={{fontSize:9,color:"var(--text-2)",fontFamily:"var(--mono)",textAlign:"center"}}>{bar.label}</div>
        </div>
      ))}
    </div>
  );
}

function Modal({title,onClose,children,footer}){
  useEffect(()=>{const h=e=>{if(e.key==="Escape")onClose();};window.addEventListener("keydown",h);return()=>window.removeEventListener("keydown",h);},[onClose]);
  return(
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal">
        <div className="modal-header"><div className="modal-title">{title}</div><button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}>✕</button></div>
        <div className="modal-body">{children}</div>
        {footer&&<div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

// ── Activity Modal (Buy/Sell chooser) ─────────────────────────────────────────
function ActivityModal({onClose,onBuy,onSell}){
  return(
    <Modal title="Add Activity" onClose={onClose}>
      <div style={{textAlign:"center",marginBottom:16,color:"var(--text-1)",fontSize:13}}>
        What would you like to record?
      </div>
      <div className="activity-choice">
        <button className="btn btn-buy" onClick={onBuy} style={{flex:1,flexDirection:"column",gap:6,height:80}}>
          <span style={{fontSize:22}}>📈</span>
          <span style={{fontWeight:800}}>Buy</span>
          <span style={{fontSize:11,opacity:0.7}}>Add a new or existing position</span>
        </button>
        <button className="btn btn-sell" onClick={onSell} style={{flex:1,flexDirection:"column",gap:6,height:80}}>
          <span style={{fontSize:22}}>📉</span>
          <span style={{fontWeight:800}}>Sell</span>
          <span style={{fontSize:11,opacity:0.7}}>Record a sale from holdings</span>
        </button>
      </div>
    </Modal>
  );
}

// ── Buy Modal ─────────────────────────────────────────────────────────────────
function BuyModal({onClose,onSave,defaultAccountId,existing}){
  const isEdit=!!existing;
  const [form,setForm]=useState({accountId:existing?.accountId||defaultAccountId||"rrsp_k",ticker:existing?.ticker||"",name:existing?.name||"",exchange:existing?.exchange||"TSX"});
  const [tranches,setTranches]=useState(existing?.tranches?.map(t=>({...t}))||[{id:"new_0",date:today(),shares:"",costPrice:"",dividends:""}]);
  const [saving,setSaving]=useState(false);
  const update=(k,v)=>setForm(f=>({...f,[k]:v}));
  const updateT=(id,k,v)=>setTranches(ts=>ts.map(t=>t.id===id?{...t,[k]:v}:t));
  const addNewTranche=()=>setTranches(ts=>[...ts,{id:"new_"+Date.now(),date:today(),shares:"",costPrice:"",dividends:""}]);
  const removeTranche=(id)=>setTranches(ts=>ts.filter(t=>t.id!==id));
  const save=async()=>{
    if(!form.ticker)return;
    const validTranches=tranches.filter(t=>parseFloat(t.shares)>0&&parseFloat(t.costPrice)>0);
    if(validTranches.length===0)return;
    setSaving(true);
    await onSave({accountId:form.accountId,ticker:form.ticker.toUpperCase(),name:form.name||form.ticker.toUpperCase(),exchange:form.exchange,isEdit,existingId:existing?.id,tranches:validTranches.map(t=>({id:t.id,date:t.date,shares:parseFloat(t.shares),costPrice:parseFloat(t.costPrice),dividends:parseFloat(t.dividends||0)}))});
    setSaving(false);onClose();
  };
  const currencyNote=isUSD(form.exchange)?"Prices in USD — converted to CAD for totals":"Prices in CAD";
  return(
    <Modal title={isEdit?"Edit Security":"Buy — Add Position"} onClose={onClose}
      footer={<><button className="btn btn-ghost" onClick={onClose}>Cancel</button><button className="btn btn-primary" onClick={save} disabled={saving}>{saving?"Saving…":isEdit?"Save Changes":"Confirm Buy"}</button></>}>
      <div className="form-grid">
        <div className="form-group full"><label>Account</label>
          <select value={form.accountId} onChange={e=>update("accountId",e.target.value)}>
            {ACCOUNT_TYPES.map(a=><option key={a.id} value={a.id}>{a.label}</option>)}
          </select>
        </div>
        <div className="form-group"><label>Ticker Symbol</label><input placeholder="e.g. VFV.TO or HDB" value={form.ticker} onChange={e=>update("ticker",e.target.value)}/></div>
        <div className="form-group"><label>Exchange</label>
          <select value={form.exchange} onChange={e=>update("exchange",e.target.value)}>
            {EXCHANGES.map(x=><option key={x}>{x}</option>)}
          </select>
        </div>
        <div className="form-group full"><label>Security Name</label><input placeholder="e.g. HDFC Bank Limited" value={form.name} onChange={e=>update("name",e.target.value)}/></div>
      </div>
      <div style={{fontSize:11,color:isUSD(form.exchange)?"var(--amber)":"var(--green)",fontFamily:"var(--mono)",marginTop:8,marginBottom:4}}>{currencyNote}</div>
      <div className="divider"/>
      <div style={{fontSize:13,fontWeight:700,marginBottom:10}}>{isEdit?"Edit Purchases":"Purchase Details"}</div>
      {tranches.map((t,i)=>(
        <div key={t.id} className="tranche-row">
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
            <span style={{fontSize:12,color:"var(--text-2)",fontFamily:"var(--mono)"}}>Purchase #{i+1}</span>
            {tranches.length>1&&<button className="btn btn-danger btn-sm" onClick={()=>removeTranche(t.id)}>Remove</button>}
          </div>
          <div className="form-grid">
            <div className="form-group"><label>Date</label><input type="date" value={t.date} onChange={e=>updateT(t.id,"date",e.target.value)}/></div>
            <div className="form-group"><label>Shares</label><input type="number" placeholder="0.00" value={t.shares} onChange={e=>updateT(t.id,"shares",e.target.value)}/></div>
            <div className="form-group"><label>Cost Price ({isUSD(form.exchange)?"USD":"CAD"})</label><input type="number" placeholder="0.00" value={t.costPrice} onChange={e=>updateT(t.id,"costPrice",e.target.value)}/></div>
            <div className="form-group"><label>Dividends ({isUSD(form.exchange)?"USD":"CAD"})</label><input type="number" placeholder="0.00" value={t.dividends} onChange={e=>updateT(t.id,"dividends",e.target.value)}/></div>
          </div>
        </div>
      ))}
      <button className="btn btn-ghost btn-sm" style={{marginTop:8}} onClick={addNewTranche}>+ Add Another Purchase</button>
    </Modal>
  );
}

// ── Sell Modal ────────────────────────────────────────────────────────────────
function SellActivityModal({holdings,prices,usdcad,onClose,onSell,defaultAccountId}){
  const accountHoldings=holdings.filter(h=>h.accountId===(defaultAccountId||h.accountId));
  const [selectedHoldingId,setSelectedHoldingId]=useState(accountHoldings[0]?.id||"");
  const [sellShares,setSellShares]=useState("");
  const [sellDate,setSellDate]=useState(today());
  const [saving,setSaving]=useState(false);

  const holding=holdings.find(h=>h.id===selectedHoldingId);
  const c=holding?calcHolding(holding,prices,{},usdcad):null;
  const maxShares=c?.totalShares||0;
  const sharesToSell=parseFloat(sellShares||0);
  const isPartial=sharesToSell>0&&sharesToSell<maxShares;
  const isAll=sharesToSell>=maxShares;

  let proceedsNative=0,proceedsCAD=0,costOfSoldCAD=0,gl=0,glPct=0;
  if(c&&sharesToSell>0&&holding){
    const {totalCostSold}=computeFIFOSell(holding.tranches,Math.min(sharesToSell,maxShares));
    const fx=c.fx;
    costOfSoldCAD=totalCostSold*fx;
    const currentPriceNative=c.currentPriceNative||c.avgCostNative;
    proceedsNative=currentPriceNative*Math.min(sharesToSell,maxShares);
    proceedsCAD=proceedsNative*fx;
    gl=proceedsCAD-costOfSoldCAD;
    glPct=costOfSoldCAD>0?(gl/costOfSoldCAD)*100:0;
  }

  const save=async()=>{
    if(!holding||sharesToSell<=0)return;
    setSaving(true);
    await onSell(holding,{sellShares:Math.min(sharesToSell,maxShares),sellDate,proceeds:proceedsCAD,gainLoss:gl,gainLossPct:glPct,isPartial:sharesToSell<maxShares});
    setSaving(false);onClose();
  };

  return(
    <Modal title="Sell — Record a Sale" onClose={onClose}
      footer={<><button className="btn btn-ghost" onClick={onClose}>Cancel</button><button className="btn btn-danger" onClick={save} disabled={saving||sharesToSell<=0}>{saving?"Processing…":"Confirm Sale"}</button></>}>
      <div className="form-grid">
        <div className="form-group full"><label>Select Holding to Sell</label>
          <select value={selectedHoldingId} onChange={e=>setSelectedHoldingId(e.target.value)}>
            {holdings.map(h=>{const hc=calcHolding(h,prices,{},usdcad);return<option key={h.id} value={h.id}>{h.ticker} — {h.name} ({fmt(hc.totalShares,0)} shares)</option>;})}
          </select>
        </div>
      </div>

      {c&&holding&&(
        <>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,margin:"14px 0",background:"var(--bg-3)",borderRadius:"var(--radius-sm)",padding:"12px 14px"}}>
            <div><div style={{fontSize:10,color:"var(--text-2)",fontFamily:"var(--mono)",marginBottom:3}}>TOTAL SHARES</div><div style={{fontWeight:800,fontSize:16}}>{fmt(maxShares,0)}</div></div>
            <div><div style={{fontSize:10,color:"var(--text-2)",fontFamily:"var(--mono)",marginBottom:3}}>AVG COST ({c.currency})</div><div style={{fontWeight:800,fontSize:16}}>{fmtDollar(c.avgCostNative,false,c.currency)}</div></div>
            <div><div style={{fontSize:10,color:"var(--text-2)",fontFamily:"var(--mono)",marginBottom:3}}>TOTAL VALUE (CAD)</div><div style={{fontWeight:800,fontSize:16}}>{fmtDollar(c.marketValueCAD??c.totalCostCAD)}</div></div>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label>Shares to Sell (max {fmt(maxShares,0)})</label>
              <input type="number" placeholder="0" value={sellShares} max={maxShares}
                onChange={e=>setSellShares(e.target.value)}
                style={{borderColor:sharesToSell>maxShares?"var(--red)":""}}/>
              {sharesToSell>maxShares&&<span style={{fontSize:10,color:"var(--red)"}}>Exceeds holdings</span>}
              {isPartial&&<span style={{fontSize:10,color:"var(--amber)",fontFamily:"var(--mono)"}}>Partial sell — {fmt(maxShares-sharesToSell,0)} shares remain (FIFO)</span>}
              {isAll&&<span style={{fontSize:10,color:"var(--red)",fontFamily:"var(--mono)"}}>Full position will be closed</span>}
            </div>
            <div className="form-group"><label>Sell Date</label><input type="date" value={sellDate} onChange={e=>setSellDate(e.target.value)}/></div>
          </div>

          {sharesToSell>0&&sharesToSell<=maxShares&&(
            <div className="sell-preview">
              <div style={{fontSize:12,fontWeight:700,marginBottom:8,color:"var(--text-1)"}}>Sale Preview</div>
              <div className="sell-preview-row">
                <span className="sell-preview-label">Shares Selling</span>
                <span className="sell-preview-val">{fmt(Math.min(sharesToSell,maxShares),0)}</span>
              </div>
              <div className="sell-preview-row">
                <span className="sell-preview-label">Current Price ({c.currency})</span>
                <span className="sell-preview-val">{fmtDollar(c.currentPriceNative||c.avgCostNative,false,c.currency)}</span>
              </div>
              <div className="sell-preview-row">
                <span className="sell-preview-label">Proceeds (CAD)</span>
                <span className="sell-preview-val">{fmtDollar(proceedsCAD)}</span>
              </div>
              <div className="sell-preview-row">
                <span className="sell-preview-label">Cost of Shares Sold (CAD)</span>
                <span className="sell-preview-val">{fmtDollar(costOfSoldCAD)}</span>
              </div>
              <div style={{height:1,background:"var(--border)",margin:"8px 0"}}/>
              <div className="sell-preview-row">
                <span className="sell-preview-label">Gain / Loss (CAD)</span>
                <span className="sell-preview-val" style={{fontSize:18,color:gl>=0?"var(--green)":"var(--red)"}}>{fmtDollar(gl,true)} <span style={{fontSize:13}}>({fmtPct(glPct,true)})</span></span>
              </div>
            </div>
          )}
        </>
      )}
    </Modal>
  );
}// ── Notification Bell ─────────────────────────────────────────────────────────
function NotificationBell({notifications,onClear}){
  const [open,setOpen]=useState(false);
  const ref=useRef(null);
  const unread=notifications.filter(n=>!n.read).length;
  useEffect(()=>{
    const h=e=>{if(ref.current&&!ref.current.contains(e.target))setOpen(false);};
    document.addEventListener("mousedown",h);return()=>document.removeEventListener("mousedown",h);
  },[]);
  const iconFor=(type)=>{
    if(type==="split")return"✂️";
    if(type==="dividend")return"💰";
    if(type==="gain")return"📈";
    if(type==="loss")return"📉";
    return"🔔";
  };
  return(
    <div ref={ref} style={{position:"relative"}}>
      <button className="btn btn-ghost btn-icon" onClick={()=>setOpen(o=>!o)} style={{position:"relative",fontSize:16}}>
        🔔
        {unread>0&&<span className="notif-dot"/>}
      </button>
      {open&&(
        <div className="notif-panel">
          <div style={{padding:"12px 16px",borderBottom:"1px solid var(--border)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span style={{fontWeight:700,fontSize:13}}>Notifications {unread>0&&<span style={{background:"var(--red)",color:"#fff",borderRadius:10,padding:"1px 6px",fontSize:10,marginLeft:4}}>{unread}</span>}</span>
            {notifications.length>0&&<button className="btn btn-ghost btn-sm" onClick={onClear}>Clear all</button>}
          </div>
          {notifications.length===0
            ?<div className="empty" style={{padding:24}}><p>No notifications yet</p></div>
            :notifications.map((n,i)=>(
              <div key={i} className="notif-item">
                <span className="notif-icon">{iconFor(n.type)}</span>
                <div>
                  <div className="notif-title">{n.title}</div>
                  <div className="notif-body">{n.body}</div>
                  <div className="notif-time">{n.time}</div>
                </div>
              </div>
            ))
          }
        </div>
      )}
    </div>
  );
}

// ── Cash Modal ────────────────────────────────────────────────────────────────
function CashModal({account,onClose,onSave}){
  const at=ACCOUNT_TYPES.find(a=>a.id===account.id);
  const [cash,setCash]=useState(account.cash);
  const [deposit,setDeposit]=useState("");
  const [withdraw,setWithdraw]=useState("");
  const [saving,setSaving]=useState(false);
  const apply=async()=>{setSaving(true);await onSave({cash:parseFloat(cash),depositAmount:parseFloat(deposit||0),withdrawAmount:parseFloat(withdraw||0)});setSaving(false);onClose();};
  return(
    <Modal title={`Cash & Deposits — ${at?.label}`} onClose={onClose}
      footer={<><button className="btn btn-ghost" onClick={onClose}>Cancel</button><button className="btn btn-primary" onClick={apply} disabled={saving}>{saving?"Saving…":"Update"}</button></>}>
      <div className="form-grid">
        <div className="form-group full"><label>Cash Balance (CAD $)</label><input type="number" value={cash} onChange={e=>setCash(e.target.value)}/></div>
        <div className="form-group"><label>Add Deposit (CAD $)</label><input type="number" placeholder="0.00" value={deposit} onChange={e=>setDeposit(e.target.value)}/></div>
        <div className="form-group"><label>Withdrawal (CAD $)</label><input type="number" placeholder="0.00" value={withdraw} onChange={e=>setWithdraw(e.target.value)}/></div>
      </div>
    </Modal>
  );
}

function DividendInfoModal({holding,divInfo,usdcad,onClose}){
  const [upcoming,setUpcoming]=useState([]);
  const [loading,setLoading]=useState(true);
  const priceKey=resolveTicker(holding.ticker,holding.exchange);
  const info=divInfo?.[priceKey];
  const fx=isUSD(holding.exchange)?usdcad:1;
  useEffect(()=>{fetchUpcomingDividends(holding.ticker,holding.exchange).then(d=>{setUpcoming(d);setLoading(false);});},[]);
  return(
    <Modal title={`Dividends — ${holding.ticker}`} onClose={onClose}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:16}}>
        <div style={{background:"var(--bg-3)",padding:"12px",borderRadius:"var(--radius-sm)"}}><div style={{fontSize:10,color:"var(--text-2)",fontFamily:"var(--mono)",marginBottom:4}}>ANNUAL DPS</div><div style={{fontWeight:700,fontSize:16}}>{info?.annualDPS!=null?fmtDollar(info.annualDPS,false,isUSD(holding.exchange)?"USD":"CAD"):"N/A"}</div></div>
        <div style={{background:"var(--bg-3)",padding:"12px",borderRadius:"var(--radius-sm)"}}><div style={{fontSize:10,color:"var(--text-2)",fontFamily:"var(--mono)",marginBottom:4}}>DIV YIELD</div><div style={{fontWeight:700,fontSize:16,color:"var(--purple)"}}>{info?.dividendYield!=null?fmtPct(info.dividendYield):"N/A"}</div></div>
        <div style={{background:"var(--bg-3)",padding:"12px",borderRadius:"var(--radius-sm)"}}><div style={{fontSize:10,color:"var(--text-2)",fontFamily:"var(--mono)",marginBottom:4}}>ANNUAL (CAD)</div><div style={{fontWeight:700,fontSize:16,color:"var(--green)"}}>{info?.annualDPS!=null?fmtDollar(info.annualDPS*fx):"N/A"}</div></div>
      </div>
      {isUSD(holding.exchange)&&<div style={{fontSize:11,color:"var(--amber)",fontFamily:"var(--mono)",marginBottom:12}}>Rate: 1 USD = {fmt(usdcad,4)} CAD</div>}
      <div style={{fontSize:13,fontWeight:700,marginBottom:10}}>Upcoming Ex-Dividend Dates</div>
      {loading?<div className="empty"><div className="spinner"/></div>:upcoming.length===0?<div className="empty"><div className="icon">📅</div><p>No upcoming dividends found</p></div>:
        upcoming.map((d,i)=>(
          <div key={i} className="divband">
            <span style={{fontFamily:"var(--mono)",color:"var(--text-2)",fontSize:11}}>{d.date}</span>
            <span style={{flex:1,marginLeft:8}}>{d.symbol}</span>
            <span style={{color:"var(--green)",fontFamily:"var(--mono)"}}>{d.amount!=null?fmtDollar(d.amount*fx):"—"}</span>
            <span className="badge badge-blue" style={{marginLeft:8}}>{d.payDate||"—"}</span>
          </div>
        ))
      }
    </Modal>
  );
}

function NewsPanel({holding,onClose}){
  const [news,setNews]=useState([]);
  const [loading,setLoading]=useState(true);
  const [filter,setFilter]=useState("all");
  useEffect(()=>{fetchNews(holding.ticker,holding.exchange,holding.name).then(d=>{setNews(d);setLoading(false);});},[]);
  const filtered=filter==="all"?news:news.filter(n=>n.category===filter);
  return(
    <Modal title={`News — ${holding.name||holding.ticker}`} onClose={onClose}>
      {!loading&&news.length>0&&(
        <div className="tab-bar" style={{marginBottom:16}}>
          <div className={`tab ${filter==="all"?"active":""}`} onClick={()=>setFilter("all")}>All ({news.length})</div>
          <div className={`tab ${filter==="company"?"active":""}`} onClick={()=>setFilter("company")}>Company ({news.filter(n=>n.category==="company").length})</div>
          <div className={`tab ${filter==="macro"?"active":""}`} onClick={()=>setFilter("macro")}>Market & Macro ({news.filter(n=>n.category==="macro").length})</div>
        </div>
      )}
      {loading?<div className="empty"><div className="spinner"/></div>
        :filtered.length===0?<div className="empty"><div className="icon">📭</div><p>No news found — daily limit may be reached, try again tomorrow</p></div>
        :filtered.map((n,i)=>(
          <div key={i} style={{padding:"12px 0",borderBottom:i<filtered.length-1?"1px solid var(--border)":"none"}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:5}}>
              <span className="badge" style={{background:n.category==="company"?"var(--accent-dim)":"var(--amber-dim)",color:n.category==="company"?"var(--accent)":"var(--amber)",fontSize:9}}>
                {n.category==="company"?"COMPANY":"MACRO"}
              </span>
              <span style={{fontSize:10,color:"var(--text-2)",fontFamily:"var(--mono)"}}>{n.source?.name} · {new Date(n.publishedAt).toLocaleDateString()}</span>
            </div>
            <a href={n.url} target="_blank" rel="noreferrer" style={{color:"var(--text-0)",textDecoration:"none",fontSize:13,fontWeight:600,display:"block",marginBottom:5,lineHeight:1.4}}>{n.title}</a>
            {n.description&&<div style={{fontSize:12,color:"var(--text-1)",lineHeight:1.5}}>{n.description.slice(0,220)}{n.description.length>220?"…":""}</div>}
          </div>
        ))}
    </Modal>
  );
}

function HoldingsTable({holdings,prices,divInfo,usdcad,onEdit,onSell,onNews,onDividendInfo}){
  const totalMarketCAD=holdings.reduce((s,h)=>{const c=calcHolding(h,prices,divInfo,usdcad);return s+(c.marketValueCAD||c.totalCostCAD);},0);
  return(
    <div className="table-wrap">
      <table>
        <thead><tr>
          <th></th><th>Ticker</th><th>Security</th><th>Exch</th><th>Shares</th>
          <th className="text-right">Avg Cost</th><th className="text-right">Total Cost</th>
          <th className="text-right">Price</th><th className="text-right">Mkt Value (CAD)</th>
          <th className="text-right">Gain $ (CAD)</th><th className="text-right">Gain %</th>
          <th className="text-right">Weight</th><th className="text-right">Div/Yr (CAD)</th><th className="text-right">Yld</th>
        </tr></thead>
        <tbody>
          {holdings.length===0
            ?<tr><td colSpan={14}><div className="empty"><div className="icon">📈</div><p>No holdings yet — use Add Activity to record a buy</p></div></td></tr>
            :holdings.map(h=>{
              const c=calcHolding(h,prices,divInfo,usdcad);
              const effectiveValCAD=c.marketValueCAD??c.totalCostCAD;
              const weight=totalMarketCAD>0?(effectiveValCAD/totalMarketCAD)*100:0;
              const at=ACCOUNT_TYPES.find(a=>a.id===h.accountId);
              return(
                <tr key={h.id}>
                  <td>
                    <div style={{display:"flex",gap:3}}>
                      <button className="btn btn-ghost btn-icon btn-sm" title="Edit" onClick={()=>onEdit(h)}>✏️</button>
                      <button className="btn btn-ghost btn-icon btn-sm" title="News" onClick={()=>onNews(h)}>📰</button>
                      <button className="btn btn-ghost btn-icon btn-sm" title="Dividends" onClick={()=>onDividendInfo(h)}>💰</button>
                      <button className="btn btn-danger btn-icon btn-sm" title="Sell" onClick={()=>onSell(h)}>💸</button>
                    </div>
                  </td>
                  <td>
                    <span className="ticker" style={{borderLeft:`3px solid ${at?.color||"var(--accent)"}`,paddingLeft:6}}>{h.ticker}</span>
                    {c.isConverted&&<span className="fx-badge">USD→CAD</span>}
                  </td>
                  <td style={{maxWidth:150,overflow:"hidden",textOverflow:"ellipsis"}}>{h.name}</td>
                  <td><span className="badge badge-blue">{h.exchange}</span></td>
                  <td className="mono">{fmt(c.totalShares,0)}</td>
                  <td className="mono text-right">
                    {fmtDollar(c.avgCostNative,false,c.currency)}
                    {c.isConverted&&<div style={{fontSize:9,color:"var(--text-2)"}}>{fmtDollar(c.avgCostCAD)} CAD</div>}
                  </td>
                  <td className="mono text-right">{fmtDollar(c.totalCostCAD)}</td>
                  <td className="mono text-right">{c.currentPriceNative?fmtDollar(c.currentPriceNative,false,c.currency):<span style={{color:"var(--text-2)",fontSize:10}}>…</span>}</td>
                  <td className="mono text-right">{fmtDollar(effectiveValCAD)}</td>
                  <td className={`mono text-right ${c.gainLossCAD==null?"":c.gainLossCAD>=0?"pos":"neg"}`}>{c.gainLossCAD!=null?fmtDollar(c.gainLossCAD,true):"—"}</td>
                  <td className={`mono text-right ${c.gainLossPct==null?"":c.gainLossPct>=0?"pos":"neg"}`}>{c.gainLossPct!=null?fmtPct(c.gainLossPct,true):"—"}</td>
                  <td><div style={{display:"flex",alignItems:"center",gap:6}}><div className="progress-bar" style={{width:50}}><div className="progress-fill" style={{width:`${Math.min(weight,100)}%`,background:at?.color||"var(--accent)"}}/></div><span className="mono" style={{fontSize:10,color:"var(--text-1)"}}>{fmt(weight,1)}%</span></div></td>
                  <td className="mono text-right" style={{color:"var(--purple)"}}>{c.estimatedAnnualDivCAD!=null?fmtDollar(c.estimatedAnnualDivCAD):"—"}</td>
                  <td className="mono text-right" style={{color:"var(--purple)"}}>{c.dividendYield!=null?fmtPct(c.dividendYield):"—"}</td>
                </tr>
              );
            })}
        </tbody>
      </table>
    </div>
  );
}

function SoldPositionsTable({positions,onDelete}){
  if(!positions.length)return null;
  const totalGL=positions.reduce((s,p)=>s+p.gainLoss,0);
  return(
    <div className="section">
      <div className="section-header">
        <div><div className="section-title">Closed Positions</div><div className="section-sub">Booked P&L (CAD): <span className={totalGL>=0?"pos":"neg"}>{fmtDollar(totalGL,true)}</span></div></div>
      </div>
      <div className="table-wrap"><table>
        <thead><tr><th>Ticker</th><th>Account</th><th>Shares</th><th className="text-right">Avg Cost</th><th className="text-right">Sell Price</th><th className="text-right">Proceeds (CAD)</th><th className="text-right">Gain $ (CAD)</th><th className="text-right">Gain %</th><th>Sell Date</th><th></th></tr></thead>
        <tbody>{positions.map(p=>{
          const at=ACCOUNT_TYPES.find(a=>a.id===p.accountId);
          return(
            <tr key={p.id}>
              <td><span className="ticker">{p.ticker}</span></td>
              <td><span className="badge" style={{background:at?.color+"22",color:at?.color}}>{at?.label||p.accountId}</span></td>
              <td className="mono">{fmt(p.shares,0)}</td>
              <td className="mono text-right">{fmtDollar(p.avgCost)}</td>
              <td className="mono text-right">{fmtDollar(p.sellPrice)}</td>
              <td className="mono text-right">{fmtDollar(p.proceeds)}</td>
              <td className={`mono text-right ${p.gainLoss>=0?"pos":"neg"}`}>{fmtDollar(p.gainLoss,true)}</td>
              <td className={`mono text-right ${p.gainLossPct>=0?"pos":"neg"}`}>{fmtPct(p.gainLossPct,true)}</td>
              <td className="mono">{p.sellDate}</td>
              <td><button className="btn btn-ghost btn-icon btn-sm" onClick={()=>onDelete(p.id)}>×</button></td>
            </tr>
          );
        })}</tbody>
      </table></div>
    </div>
  );
}

function DashboardView({state,prices,divInfo,usdcad,onRefresh,refreshing,onActivity,notifications,onClearNotifications}){
  const {holdings,accounts,soldPositions}=state;
  let totalMarketCAD=0,totalCostCAD=0,totalDivsCAD=0,totalCash=0,totalDeposits=0;
  holdings.forEach(h=>{const c=calcHolding(h,prices,divInfo,usdcad);totalCostCAD+=c.totalCostCAD;totalMarketCAD+=c.marketValueCAD??c.totalCostCAD;totalDivsCAD+=c.manualDividendsCAD;});
  Object.values(accounts).forEach(a=>{totalCash+=a.cash||0;totalDeposits+=a.deposits||0;});
  const totalGL=totalMarketCAD-totalCostCAD;
  const totalPortfolio=totalMarketCAD+totalCash;
  const trueReturn=totalDeposits>0?((totalPortfolio-totalDeposits)/totalDeposits)*100:0;
  const bookedGL=soldPositions.reduce((s,p)=>s+p.gainLoss,0);
  const acctBreakdown=ACCOUNT_TYPES.map(at=>{const acct=accounts[at.id]||{cash:0,deposits:0};const c=calcAccount(at.id,holdings,prices,divInfo,usdcad);return{...at,...c,cash:acct.cash||0,total:c.totalMarketCAD+(acct.cash||0),deposits:acct.deposits||0};});
  const pieData=acctBreakdown.filter(a=>a.total>0).map(a=>({label:a.label,value:a.total,color:a.color}));
  const perfData=useMemo(()=>{const pts=[totalDeposits*0.78];for(let i=1;i<11;i++)pts.push(pts[i-1]*(1+(Math.random()*0.04-0.005)));pts.push(totalPortfolio);return pts;},[totalDeposits,totalPortfolio]);
  const kashishTotal=acctBreakdown.filter(a=>a.owner==="Kashish").reduce((s,a)=>s+a.total,0);
  const djTotal=acctBreakdown.filter(a=>a.owner==="DJ").reduce((s,a)=>s+a.total,0);
  return(
    <>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16,padding:"8px 12px",background:"var(--bg-3)",borderRadius:"var(--radius-sm)",width:"fit-content"}}>
        <span style={{fontSize:11,color:"var(--text-2)",fontFamily:"var(--mono)"}}>USD/CAD:</span>
        <span style={{fontSize:12,fontWeight:700,color:"var(--amber)",fontFamily:"var(--mono)"}}>{fmt(usdcad,4)}</span>
        <span style={{fontSize:10,color:"var(--text-2)",fontFamily:"var(--mono)"}}>· All values in CAD</span>
      </div>
      <div className="stats-grid">
        <div className="stat-card accent"><div className="stat-label">Total Household (CAD)</div><div className="stat-value">{fmtDollar(totalPortfolio)}</div><div className="stat-sub">All accounts + cash</div></div>
        <div className={`stat-card ${totalGL>=0?"green":"red"}`}><div className="stat-label">Unrealized Gain (CAD)</div><div className="stat-value" style={{color:totalGL>=0?"var(--green)":"var(--red)"}}>{fmtDollar(totalGL,true)}</div><div className="stat-sub">{fmtPct(totalCostCAD>0?(totalGL/totalCostCAD)*100:0,true)} on cost</div></div>
        <div className={`stat-card ${bookedGL>=0?"green":"red"}`}><div className="stat-label">Booked P&L (CAD)</div><div className="stat-value" style={{color:bookedGL>=0?"var(--green)":"var(--red)"}}>{fmtDollar(bookedGL,true)}</div><div className="stat-sub">{soldPositions.length} closed positions</div></div>
        <div className="stat-card purple"><div className="stat-label">Dividends (CAD)</div><div className="stat-value" style={{color:"var(--purple)"}}>{fmtDollar(totalDivsCAD)}</div><div className="stat-sub">Received to date</div></div>
        <div className="stat-card amber"><div className="stat-label">Cash (CAD)</div><div className="stat-value" style={{color:"var(--amber)"}}>{fmtDollar(totalCash)}</div></div>
        <div className="stat-card"><div className="stat-label">True Return</div><div className={`stat-value ${trueReturn>=0?"pos":"neg"}`}>{fmtPct(trueReturn,true)}</div><div className="stat-sub">vs {fmtDollar(totalDeposits)} deposited</div></div>
      </div>
      <div className="grid-2">
        <div className="card" style={{borderTop:"3px solid #4f9cf9"}}>
          <div className="card-header"><div className="card-title" style={{fontSize:14,fontWeight:800,color:"var(--text-0)"}}>Kashish</div><span style={{fontSize:11,color:"var(--text-2)",fontFamily:"var(--mono)"}}>{acctBreakdown.filter(a=>a.owner==="Kashish").reduce((s,a)=>s+a.holdingCount,0)} holdings</span></div>
          <div style={{fontSize:24,fontWeight:800}}>{fmtDollar(kashishTotal)}</div>
          <div style={{fontSize:11,color:"var(--text-2)",marginTop:4,fontFamily:"var(--mono)"}}>RRSP · TFSA · Non-Reg</div>
        </div>
        <div className="card" style={{borderTop:"3px solid #f5a623"}}>
          <div className="card-header"><div className="card-title" style={{fontSize:14,fontWeight:800,color:"var(--text-0)"}}>DJ</div><span style={{fontSize:11,color:"var(--text-2)",fontFamily:"var(--mono)"}}>{acctBreakdown.filter(a=>a.owner==="DJ").reduce((s,a)=>s+a.holdingCount,0)} holdings</span></div>
          <div style={{fontSize:24,fontWeight:800}}>{fmtDollar(djTotal)}</div>
          <div style={{fontSize:11,color:"var(--text-2)",marginTop:4,fontFamily:"var(--mono)"}}>RRSP · TFSA · Non-Reg</div>
        </div>
      </div>
      <div className="grid-2">
        <div className="card">
          <div className="card-header"><div className="card-title">Portfolio Performance (CAD)</div><button className="btn btn-ghost btn-sm" onClick={onRefresh} disabled={refreshing} style={{display:"flex",alignItems:"center",gap:6}}>{refreshing?<div className="spinner"/>:"⟳"} Refresh</button></div>
          <LineChart data={perfData} height={130}/>
          <div style={{display:"flex",justifyContent:"space-between",marginTop:6}}><span style={{fontSize:10,color:"var(--text-2)",fontFamily:"var(--mono)"}}>12 mo ago</span><span style={{fontSize:10,color:"var(--text-2)",fontFamily:"var(--mono)"}}>Today</span></div>
        </div>
        <div className="card">
          <div className="card-header"><div className="card-title">Allocation by Account</div></div>
          <div style={{display:"flex",gap:16,alignItems:"center"}}>
            <PieChart segments={pieData} size={130}/>
            <div className="legend" style={{flex:1}}>{acctBreakdown.filter(a=>a.total>0).map(a=><div key={a.id} className="legend-item"><div className="legend-dot" style={{background:a.color}}/><span className="legend-label" style={{fontSize:11}}>{a.label}</span><span className="legend-val">{fmtDollar(a.total)}</span></div>)}</div>
          </div>
        </div>
      </div>
      <div className="section">
        <div className="section-header"><div className="section-title">Account Breakdown</div></div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:14}}>
          {acctBreakdown.map(a=>{
            const gl=a.totalMarketCAD-a.totalCostCAD;
            return(
              <div key={a.id} className="card" style={{borderTop:`3px solid ${a.color}`}}>
                <div className="card-header"><span className="badge" style={{background:a.color+"22",color:a.color,fontSize:11}}>{a.label}</span><span style={{fontSize:11,color:"var(--text-2)",fontFamily:"var(--mono)"}}>{a.holdingCount} holdings</span></div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
                  <div><div style={{fontSize:9,color:"var(--text-2)",fontFamily:"var(--mono)",marginBottom:2}}>INVESTED</div><div style={{fontWeight:700,fontSize:13}}>{fmtDollar(a.totalMarketCAD)}</div></div>
                  <div><div style={{fontSize:9,color:"var(--text-2)",fontFamily:"var(--mono)",marginBottom:2}}>GAIN/LOSS</div><div style={{fontWeight:700,fontSize:13,color:gl>=0?"var(--green)":"var(--red)"}}>{fmtDollar(gl,true)}</div></div>
                  <div><div style={{fontSize:9,color:"var(--text-2)",fontFamily:"var(--mono)",marginBottom:2}}>CASH</div><div style={{fontWeight:700,fontSize:13,color:"var(--amber)"}}>{fmtDollar(a.cash)}</div></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

function AccountView({accountId,state,prices,divInfo,usdcad,onActivity,onEdit,onSell,onNews,onDividendInfo,onEditCash,onDeleteSold}){
  const at=ACCOUNT_TYPES.find(a=>a.id===accountId);
  const acct=state.accounts[accountId]||{cash:0,deposits:0,withdrawals:0};
  const holdings=state.holdings.filter(h=>h.accountId===accountId);
  const soldHere=state.soldPositions.filter(p=>p.accountId===accountId);
  const c=calcAccount(accountId,holdings,prices,divInfo,usdcad);
  const gl=c.totalMarketCAD-c.totalCostCAD,glPct=c.totalCostCAD>0?(gl/c.totalCostCAD)*100:0;
  const trueReturn=acct.deposits>0?((c.totalMarketCAD+(acct.cash||0)-acct.deposits)/acct.deposits)*100:0;
  const bookedGL=soldHere.reduce((s,p)=>s+p.gainLoss,0);
  const pieData=holdings.map((h,i)=>{const hc=calcHolding(h,prices,divInfo,usdcad);return{label:h.ticker,value:hc.marketValueCAD??hc.totalCostCAD,color:COLORS[i%COLORS.length]};});
  const exportData=()=>{const rows=holdings.map(h=>{const hc=calcHolding(h,prices,divInfo,usdcad);return{ticker:h.ticker,name:h.name,exchange:h.exchange,currency:hc.currency,shares:hc.totalShares,avgCostNative:hc.avgCostNative,avgCostCAD:hc.avgCostCAD,totalCostCAD:hc.totalCostCAD,currentPriceNative:hc.currentPriceNative,marketValueCAD:hc.marketValueCAD,gainLossCAD:hc.gainLossCAD,gainLossPct:hc.gainLossPct,dividendsCAD:hc.manualDividendsCAD};});exportCSV(rows,`${accountId}_holdings_${today()}.csv`);};
  const hasUSD=holdings.some(h=>isUSD(h.exchange));
  return(
    <>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16,flexWrap:"wrap"}}>
        <div style={{width:12,height:12,borderRadius:"50%",background:at?.color}}/>
        <span className="badge" style={{background:at?.color+"22",color:at?.color,fontSize:12}}>{at?.label}</span>
        <span style={{fontSize:11,color:"var(--text-2)",fontFamily:"var(--mono)"}}>{at?.owner==="Joint"?"Shared Account":at?.owner+"'s "+at?.type}</span>
        {hasUSD&&<span style={{fontSize:11,color:"var(--amber)",fontFamily:"var(--mono)"}}>· USD/CAD: {fmt(usdcad,4)} · Totals in CAD</span>}
      </div>
      <div className="stats-grid">
        <div className="stat-card accent"><div className="stat-label">Invested (CAD)</div><div className="stat-value">{fmtDollar(c.totalMarketCAD)}</div><div className="stat-sub">Market value</div></div>
        <div className={`stat-card ${gl>=0?"green":"red"}`}><div className="stat-label">Unrealized Gain (CAD)</div><div className="stat-value" style={{color:gl>=0?"var(--green)":"var(--red)"}}>{fmtDollar(gl,true)}</div><div className="stat-sub">{fmtPct(glPct,true)}</div></div>
        <div className={`stat-card ${bookedGL>=0?"green":"red"}`}><div className="stat-label">Booked P&L (CAD)</div><div className="stat-value" style={{color:bookedGL>=0?"var(--green)":"var(--red)"}}>{fmtDollar(bookedGL,true)}</div><div className="stat-sub">{soldHere.length} sold</div></div>
        <div className="stat-card amber"><div className="stat-label">Cash (CAD)</div><div className="stat-value" style={{color:"var(--amber)"}}>{fmtDollar(acct.cash||0)}</div><div className="stat-sub"><button className="btn btn-ghost btn-sm" onClick={onEditCash}>Update</button></div></div>
        <div className="stat-card purple"><div className="stat-label">Dividends (CAD)</div><div className="stat-value" style={{color:"var(--purple)"}}>{fmtDollar(c.totalDivsCAD)}</div></div>
        <div className="stat-card"><div className="stat-label">True Return</div><div className={`stat-value ${trueReturn>=0?"pos":"neg"}`}>{fmtPct(trueReturn,true)}</div><div className="stat-sub">vs {fmtDollar(acct.deposits)} deposited</div></div>
      </div>
      {holdings.length>0&&(
        <div className="grid-2">
          <div className="card"><div className="card-header"><div className="card-title">Holdings Allocation (CAD)</div></div><div style={{display:"flex",gap:16,alignItems:"center"}}><PieChart segments={pieData} size={120}/><div className="legend" style={{flex:1}}>{pieData.slice(0,6).map((s,i)=><div key={i} className="legend-item"><div className="legend-dot" style={{background:s.color}}/><span className="legend-label">{s.label}</span><span className="legend-val">{fmtDollar(s.value)}</span></div>)}</div></div></div>
          <div className="card"><div className="card-header"><div className="card-title">Gain/Loss by Holding (CAD)</div></div><BarChart bars={holdings.map(h=>{const hc=calcHolding(h,prices,divInfo,usdcad);return{label:h.ticker,value:hc.gainLossCAD??0};})} /></div>
        </div>
      )}
      <div className="section">
        <div className="section-header">
          <div><div className="section-title">Holdings</div></div>
          <div style={{display:"flex",gap:8}}>
            <button className="btn btn-ghost btn-sm" onClick={exportData}>↓ CSV</button>
            <button className="btn btn-primary btn-sm" onClick={onActivity}>+ Add Activity</button>
          </div>
        </div>
        <HoldingsTable holdings={holdings} prices={prices} divInfo={divInfo} usdcad={usdcad} onEdit={onEdit} onSell={onSell} onNews={onNews} onDividendInfo={onDividendInfo}/>
      </div>
      <SoldPositionsTable positions={soldHere} onDelete={onDeleteSold}/>
      {holdings.length>0&&(
        <div className="section">
          <div className="section-header"><div className="section-title">Transaction History</div></div>
          <div className="table-wrap"><table>
            <thead><tr><th>Date</th><th>Ticker</th><th>Ccy</th><th>Shares</th><th className="text-right">Price</th><th className="text-right">Total (CAD)</th><th className="text-right">Dividends (CAD)</th></tr></thead>
            <tbody>{holdings.flatMap(h=>h.tranches.map(t=>({...t,ticker:h.ticker,exchange:h.exchange}))).sort((a,b)=>b.date.localeCompare(a.date)).map((t,i)=>{
              const fx=isUSD(t.exchange)?usdcad:1;
              return(<tr key={i}><td className="mono">{t.date}</td><td><span className="ticker">{t.ticker}</span></td><td><span className="badge" style={{background:isUSD(t.exchange)?"var(--amber-dim)":"var(--green-dim)",color:isUSD(t.exchange)?"var(--amber)":"var(--green)",fontSize:9}}>{isUSD(t.exchange)?"USD":"CAD"}</span></td><td className="mono">{fmt(t.shares,0)}</td><td className="mono text-right">{fmtDollar(t.costPrice,false,isUSD(t.exchange)?"USD":"CAD")}</td><td className="mono text-right">{fmtDollar(t.shares*t.costPrice*fx)}</td><td className="mono text-right pos">{fmtDollar((t.dividends||0)*fx)}</td></tr>);
            })}</tbody>
          </table></div>
        </div>
      )}
    </>
  );
}

function AnalyticsView({state,prices,divInfo,usdcad}){
  const {holdings,accounts,soldPositions}=state;
  let totalCostCAD=0,totalMarketCAD=0,totalDivsCAD=0;
  holdings.forEach(h=>{const c=calcHolding(h,prices,divInfo,usdcad);totalCostCAD+=c.totalCostCAD;totalMarketCAD+=c.marketValueCAD??c.totalCostCAD;totalDivsCAD+=c.manualDividendsCAD;});
  const totalDeposits=Object.values(accounts).reduce((s,a)=>s+(a.deposits||0),0);
  const gainLoss=totalMarketCAD-totalCostCAD;
  const bookedGL=soldPositions.reduce((s,p)=>s+p.gainLoss,0);
  const byExchange={};
  holdings.forEach(h=>{const c=calcHolding(h,prices,divInfo,usdcad);const v=c.marketValueCAD??c.totalCostCAD;byExchange[h.exchange]=(byExchange[h.exchange]||0)+v;});
  const exchPie=Object.entries(byExchange).map(([k,v],i)=>({label:k,value:v,color:COLORS[i]}));
  const byOwner={Kashish:0,DJ:0,Joint:0};
  holdings.forEach(h=>{const at=ACCOUNT_TYPES.find(a=>a.id===h.accountId);const c=calcHolding(h,prices,divInfo,usdcad);if(at)byOwner[at.owner]=(byOwner[at.owner]||0)+(c.marketValueCAD??c.totalCostCAD);});
  const ownerPie=[{label:"Kashish",value:byOwner.Kashish,color:"#4f9cf9"},{label:"DJ",value:byOwner.DJ,color:"#f5a623"},{label:"Joint",value:byOwner.Joint,color:"#e879f9"}].filter(x=>x.value>0);
  return(
    <>
      <div className="stats-grid">
        <div className="stat-card accent"><div className="stat-label">Unrealized Return</div><div className={`stat-value ${gainLoss>=0?"pos":"neg"}`}>{fmtPct(totalCostCAD>0?(gainLoss/totalCostCAD)*100:0,true)}</div></div>
        <div className="stat-card green"><div className="stat-label">Unrealized Gain (CAD)</div><div className={`stat-value ${gainLoss>=0?"pos":"neg"}`}>{fmtDollar(gainLoss,true)}</div></div>
        <div className={`stat-card ${bookedGL>=0?"green":"red"}`}><div className="stat-label">Booked P&L (CAD)</div><div className="stat-value" style={{color:bookedGL>=0?"var(--green)":"var(--red)"}}>{fmtDollar(bookedGL,true)}</div><div className="stat-sub">{soldPositions.length} positions</div></div>
        <div className="stat-card purple"><div className="stat-label">Total Return + Divs</div><div className="stat-value pos">{fmtPct(totalCostCAD>0?((gainLoss+totalDivsCAD)/totalCostCAD)*100:0,true)}</div></div>
      </div>
      <div className="grid-2">
        <div className="card"><div className="card-header"><div className="card-title">By Exchange (CAD)</div></div><div style={{display:"flex",gap:16,alignItems:"center"}}><PieChart segments={exchPie} size={120}/><div className="legend" style={{flex:1}}>{exchPie.map((s,i)=><div key={i} className="legend-item"><div className="legend-dot" style={{background:s.color}}/><span className="legend-label">{s.label}</span><span className="legend-val">{fmtDollar(s.value)}</span></div>)}</div></div></div>
        <div className="card"><div className="card-header"><div className="card-title">By Owner (CAD)</div></div><div style={{display:"flex",gap:16,alignItems:"center"}}><PieChart segments={ownerPie} size={120}/><div className="legend" style={{flex:1}}>{ownerPie.map((s,i)=><div key={i} className="legend-item"><div className="legend-dot" style={{background:s.color}}/><span className="legend-label">{s.label}</span><span className="legend-val">{fmtDollar(s.value)}</span></div>)}</div></div></div>
      </div>
      <div className="grid-2">
        <div className="card">
          <div className="card-header"><div className="card-title">Contributions vs Growth (CAD)</div></div>
          {[{label:"Total Deposits",value:totalDeposits,color:"var(--accent)"},{label:"Unrealized Gains",value:Math.max(gainLoss,0),color:"var(--green)"},{label:"Booked Gains",value:Math.max(bookedGL,0),color:"var(--teal)"},{label:"Dividends",value:totalDivsCAD,color:"var(--purple)"}].map((row,i)=>{
            const max=totalDeposits+Math.max(gainLoss,0)+Math.max(bookedGL,0)+totalDivsCAD||1;
            return(<div key={i} style={{marginBottom:14}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:5,fontSize:12}}><span style={{color:"var(--text-1)"}}>{row.label}</span><span className="mono">{fmtDollar(row.value)}</span></div><div className="progress-bar"><div className="progress-fill" style={{width:`${Math.min((row.value/max)*100,100)}%`,background:row.color}}/></div></div>);
          })}
        </div>
        <div className="card">
          <div className="card-header"><div className="card-title">Closed Positions Summary</div></div>
          {soldPositions.length===0?<div className="empty"><p>No closed positions yet</p></div>:
          <div className="table-wrap"><table>
            <thead><tr><th>Ticker</th><th className="text-right">Gain (CAD)</th><th className="text-right">Return</th></tr></thead>
            <tbody>{soldPositions.slice(0,8).map(p=>(
              <tr key={p.id}><td><span className="ticker">{p.ticker}</span></td><td className={`mono text-right ${p.gainLoss>=0?"pos":"neg"}`}>{fmtDollar(p.gainLoss,true)}</td><td className={`mono text-right ${p.gainLossPct>=0?"pos":"neg"}`}>{fmtPct(p.gainLossPct,true)}</td></tr>
            ))}</tbody>
          </table></div>}
        </div>
      </div>
      <div className="section">
        <div className="section-header"><div className="section-title">Performance Ranking — All Holdings (CAD)</div></div>
        <div className="table-wrap"><table>
          <thead><tr><th>Rank</th><th>Ticker</th><th>Ccy</th><th>Owner</th><th className="text-right">Cost (CAD)</th><th className="text-right">Value (CAD)</th><th className="text-right">Gain (CAD)</th><th className="text-right">Gain %</th><th className="text-right">Div/Yr (CAD)</th><th className="text-right">Total Ret</th></tr></thead>
          <tbody>{holdings.map(h=>{const c=calcHolding(h,prices,divInfo,usdcad);return{h,c};}).sort((a,b)=>(b.c.gainLossPct??-999)-(a.c.gainLossPct??-999)).map(({h,c},i)=>{
            const at=ACCOUNT_TYPES.find(a=>a.id===h.accountId);
            const totalReturn=c.gainLossCAD!=null?(c.gainLossCAD+c.manualDividendsCAD)/c.totalCostCAD*100:null;
            return(<tr key={h.id}><td><span style={{fontSize:11,color:"var(--text-2)",fontFamily:"var(--mono)"}}>#{i+1}</span></td><td><span className="ticker">{h.ticker}</span>{c.isConverted&&<span className="fx-badge">USD</span>}</td><td><span className="badge" style={{background:c.isConverted?"var(--amber-dim)":"var(--green-dim)",color:c.isConverted?"var(--amber)":"var(--green)",fontSize:9}}>{c.currency}</span></td><td><span className="badge" style={{background:at?.color+"22",color:at?.color}}>{at?.owner}</span></td><td className="mono text-right">{fmtDollar(c.totalCostCAD)}</td><td className="mono text-right">{fmtDollar(c.marketValueCAD??c.totalCostCAD)}</td><td className={`mono text-right ${c.gainLossCAD==null?"":c.gainLossCAD>=0?"pos":"neg"}`}>{c.gainLossCAD!=null?fmtDollar(c.gainLossCAD,true):"—"}</td><td className={`mono text-right ${c.gainLossPct==null?"":c.gainLossPct>=0?"pos":"neg"}`}>{c.gainLossPct!=null?fmtPct(c.gainLossPct,true):"—"}</td><td className="mono text-right" style={{color:"var(--purple)"}}>{c.estimatedAnnualDivCAD!=null?fmtDollar(c.estimatedAnnualDivCAD):"—"}</td><td className={`mono text-right ${totalReturn==null?"":totalReturn>=0?"pos":"neg"}`}>{totalReturn!=null?fmtPct(totalReturn,true):"—"}</td></tr>);
          })}</tbody>
        </table></div>
      </div>
    </>
  );
}

export default function App(){
  const [state,setState]=useState({holdings:[],accounts:{},soldPositions:[]});
  const [prices,setPrices]=useState({});
  const [divInfo,setDivInfo]=useState({});
  const [usdcad,setUsdcad]=useState(1.36);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState(null);
  const [refreshing,setRefreshing]=useState(false);
  const [activeView,setActiveView]=useState("dashboard");
  const [modal,setModal]=useState(null);
  const [time,setTime]=useState(new Date());
  const [notifications,setNotifications]=useState([]);

  useEffect(()=>{const t=setInterval(()=>setTime(new Date()),30000);return()=>clearInterval(t);},[]);

  const addNotification=(notif)=>{
    setNotifications(prev=>[{...notif,time:new Date().toLocaleTimeString(),read:false},...prev].slice(0,50));
  };

  useEffect(()=>{
    async function load(){
      try{
        const [accounts,holdings,soldPositions,rate]=await Promise.all([fetchAccounts(),fetchHoldings(),fetchSoldPositions(),fetchUSDCAD()]);
        setUsdcad(rate);

        // Check splits for all holdings
        let adjustedHoldings=[...holdings];
        for(const h of holdings){
          const earliest=h.tranches.reduce((min,t)=>t.date<min?t.date:min,h.tranches[0]?.date||today());
          const splits=await fetchSplits(h.ticker,h.exchange,earliest);
          if(splits.length>0){
            const{tranches:newTranches,adjusted}=applySplitsToTranches(h.tranches,splits);
            if(adjusted){
              adjustedHoldings=adjustedHoldings.map(ah=>ah.id===h.id?{...ah,tranches:newTranches}:ah);
              splits.forEach(s=>{
                addNotification({type:"split",title:`Stock Split Detected — ${h.ticker}`,body:`${s.fromFactor}:${s.toFactor} split on ${s.date}. Your cost basis and share count have been automatically adjusted.`});
              });
            }
          }
        }

        setState({accounts,holdings:adjustedHoldings,soldPositions});
        setLoading(false);

        // Fetch prices
        const priceResults=await Promise.all(adjustedHoldings.map(h=>fetchPrice(h.ticker,h.exchange)));
        const pm={};
        priceResults.forEach(d=>{if(d)pm[d.symbol]=d.price;});
        setPrices(pm);

        // Price movement notifications (±5%)
        adjustedHoldings.forEach((h,i)=>{
          const priceData=priceResults[i];
          if(priceData&&Math.abs(priceData.changePct||0)>=5){
            const isGain=(priceData.changePct||0)>0;
            addNotification({type:isGain?"gain":"loss",title:`${isGain?"📈":"📉"} ${h.ticker} moved ${isGain?"+":""}${fmt(priceData.changePct||0,1)}% today`,body:`${h.name} — Current price: ${fmtDollar(priceData.price,false,isUSD(h.exchange)?"USD":"CAD")}`});
          }
        });

        // Dividend info
        const divResults={};
        for(const h of adjustedHoldings){
          const symbol=resolveTicker(h.ticker,h.exchange);
          if(!divResults[symbol]){
            const info=await fetchDividendInfo(h.ticker,h.exchange);
            divResults[symbol]=info;
            if(info.annualDPS&&info.annualDPS>0){
              const upcoming=await fetchUpcomingDividends(h.ticker,h.exchange);
              if(upcoming.length>0){
                addNotification({type:"dividend",title:`Upcoming Dividend — ${h.ticker}`,body:`Ex-div date: ${upcoming[0].date}. Amount: ${fmtDollar(upcoming[0].amount,false,isUSD(h.exchange)?"USD":"CAD")} per share.`});
              }
            }
            await new Promise(r=>setTimeout(r,300));
          }
        }
        setDivInfo(divResults);
      }catch(e){setError(e.message);setLoading(false);}
    }
    load();
  },[]);

  const refreshPrices=useCallback(async()=>{
    setRefreshing(true);
    const [priceResults,rate]=await Promise.all([Promise.all(state.holdings.map(h=>fetchPrice(h.ticker,h.exchange))),fetchUSDCAD()]);
    const pm={...prices};
    priceResults.forEach(d=>{if(d)pm[d.symbol]=d.price;});
    setPrices(pm);
    setUsdcad(rate);
    // Price movement notifications
    state.holdings.forEach((h,i)=>{
      const priceData=priceResults[i];
      if(priceData&&Math.abs(priceData.changePct||0)>=5){
        const isGain=(priceData.changePct||0)>0;
        addNotification({type:isGain?"gain":"loss",title:`${isGain?"📈":"📉"} ${h.ticker} moved ${isGain?"+":""}${fmt(priceData.changePct||0,1)}% today`,body:`Current: ${fmtDollar(priceData.price,false,isUSD(h.exchange)?"USD":"CAD")}`});
      }
    });
    setRefreshing(false);
  },[state.holdings,prices]);

  const handleSaveHolding=async({accountId,ticker,name,exchange,isEdit,existingId,tranches:newTranches})=>{
    try{
      if(isEdit){
        await updateHolding(existingId,{ticker,name,exchange});
        const existingHolding=state.holdings.find(h=>h.id===existingId);
        for(const t of newTranches){
          const isExistingTranche=existingHolding?.tranches.find(et=>et.id===t.id);
          if(isExistingTranche){await updateTranche(t.id,{date:t.date,shares:t.shares,costPrice:t.costPrice,dividends:t.dividends});}
          else{await addTranche({id:uid(),holdingId:existingId,date:t.date,shares:t.shares,costPrice:t.costPrice,dividends:t.dividends});}
        }
        const updatedHoldings=await fetchHoldings();
        setState(s=>({...s,holdings:updatedHoldings}));
        const d=await fetchPrice(ticker,exchange);if(d)setPrices(prev=>({...prev,[d.symbol]:d.price}));
      }else{
        const existing=state.holdings.find(h=>h.accountId===accountId&&h.ticker===ticker);
        const hId=existing?.id||uid();
        if(!existing)await addHolding({id:hId,accountId,ticker,name,exchange});
        for(const t of newTranches){
          const tId=uid();
          await addTranche({id:tId,holdingId:hId,date:t.date,shares:t.shares,costPrice:t.costPrice,dividends:t.dividends});
          setState(s=>({...s,holdings:existing?s.holdings.map(h=>h.id===hId?{...h,tranches:[...h.tranches,{id:tId,...t}]}:h):[...s.holdings,{id:hId,accountId,ticker,name,exchange,tranches:[{id:tId,...t}]}]}));
        }
        const d=await fetchPrice(ticker,exchange);if(d)setPrices(prev=>({...prev,[d.symbol]:d.price}));
      }
    }catch(e){alert("Error: "+e.message);}
  };

  const handleSellActivity=async(holding,{sellShares,sellDate,proceeds,gainLoss,gainLossPct,isPartial})=>{
    const c=calcHolding(holding,prices,divInfo,usdcad);
    try{
      if(isPartial){
        // FIFO: update tranches in DB
        const{updatedTranches}=computeFIFOSell(holding.tranches,sellShares);
        for(const t of holding.tranches){
          const updated=updatedTranches.find(u=>u.id===t.id);
          if(!updated){await deleteTranche(t.id);}
          else if(updated.shares!==t.shares){await updateTranche(t.id,{date:t.date,shares:updated.shares,costPrice:t.costPrice,dividends:t.dividends});}
        }
        // Record partial sold position
        const pos={id:uid(),accountId:holding.accountId,ticker:holding.ticker,name:holding.name,exchange:holding.exchange,shares:sellShares,avgCost:c.avgCostCAD,sellPrice:proceeds/sellShares,sellDate,totalCost:c.totalCostCAD*(sellShares/c.totalShares),proceeds,gainLoss,gainLossPct,dividendsReceived:0};
        await addSoldPosition(pos);
        const updatedHoldings=await fetchHoldings();
        setState(s=>({...s,holdings:updatedHoldings,soldPositions:[pos,...s.soldPositions]}));
      }else{
        // Full sell
        const pos={id:uid(),accountId:holding.accountId,ticker:holding.ticker,name:holding.name,exchange:holding.exchange,shares:c.totalShares,avgCost:c.avgCostCAD,sellPrice:c.currentPriceNative||c.avgCostNative,sellDate,totalCost:c.totalCostCAD,proceeds,gainLoss,gainLossPct,dividendsReceived:c.manualDividendsCAD};
        await addSoldPosition(pos);
        await removeHolding(holding.id);
        setState(s=>({...s,holdings:s.holdings.filter(h=>h.id!==holding.id),soldPositions:[pos,...s.soldPositions]}));
      }
    }catch(e){alert("Error: "+e.message);}
  };

  const handleAddTranche=async(holdingId,tranche)=>{
    try{const tId=uid();await addTranche({id:tId,holdingId,...tranche});setState(s=>({...s,holdings:s.holdings.map(h=>h.id===holdingId?{...h,tranches:[...h.tranches,{id:tId,...tranche}]}:h)}));}
    catch(e){alert("Error: "+e.message);}
  };

  const handleDeleteSold=async(id)=>{
    if(!confirm("Remove this closed position record?"))return;
    try{await deleteSoldPosition(id);setState(s=>({...s,soldPositions:s.soldPositions.filter(p=>p.id!==id)}));}
    catch(e){alert("Error: "+e.message);}
  };

  const handleUpdateCash=async(accountId,{cash,depositAmount,withdrawAmount})=>{
    try{const acct=state.accounts[accountId]||{cash:0,deposits:0,withdrawals:0};const updated={cash,deposits:(acct.deposits||0)+depositAmount,withdrawals:(acct.withdrawals||0)+withdrawAmount};await updateAccount(accountId,updated);setState(s=>({...s,accounts:{...s.accounts,[accountId]:{...acct,...updated}}}));}
    catch(e){alert("Error: "+e.message);}
  };

  const ACCOUNT_IDS=["rrsp_k","tfsa_k","nonreg_k","rrsp_dj","tfsa_dj","nonreg_dj","joint_k"];
  const currentAccountId=ACCOUNT_IDS.includes(activeView)?activeView:"rrsp_k";

  const openActivity=()=>setModal({type:"activity",data:{accountId:currentAccountId}});

  if(loading)return(<><GlobalStyle/><div className="loading-screen"><div className="spinner" style={{width:32,height:32}}/><p>Loading your portfolio…</p></div></>);
  if(error)return(<><GlobalStyle/><div className="loading-screen"><div className="alert-error">⚠ {error}</div><p style={{marginTop:12,fontSize:12,color:"var(--text-2)"}}>Check configuration.</p></div></>);

  return(
    <><GlobalStyle/>
    <div className="app">
      <div className="sidebar">
        <div className="sidebar-logo"><h1>Portfo<span>lio</span></h1><p>Household Tracker</p></div>
        <div className="sidebar-section">
          <div className="sidebar-section-label">Overview</div>
          <div className={`sidebar-item ${activeView==="dashboard"?"active":""}`} onClick={()=>setActiveView("dashboard")}><span className="icon">◈</span>Dashboard</div>
        </div>
        <div className="sidebar-section">
          <div className="sidebar-owner-label">Kashish</div>
          {[{id:"rrsp_k",icon:"🏦",label:"RRSP"},{id:"tfsa_k",icon:"🍁",label:"TFSA"},{id:"nonreg_k",icon:"📂",label:"Non-Reg"}].map(item=>(
            <div key={item.id} className={`sidebar-item ${activeView===item.id?"active":""}`} onClick={()=>setActiveView(item.id)}><span className="icon">{item.icon}</span>{item.label}</div>
          ))}
        </div>
        <div className="sidebar-section">
          <div className="sidebar-owner-label">DJ</div>
          {[{id:"rrsp_dj",icon:"🏦",label:"RRSP"},{id:"tfsa_dj",icon:"🍁",label:"TFSA"},{id:"nonreg_dj",icon:"📂",label:"Non-Reg"}].map(item=>(
            <div key={item.id} className={`sidebar-item ${activeView===item.id?"active":""}`} onClick={()=>setActiveView(item.id)}><span className="icon">{item.icon}</span>{item.label}</div>
          ))}
        </div>
        <div className="sidebar-section">
          <div className="sidebar-owner-label">Shared</div>
          <div className={`sidebar-item ${activeView==="joint_k"?"active":""}`} onClick={()=>setActiveView("joint_k")}><span className="icon">🤝</span>Joint</div>
        </div>
        <div className="sidebar-section">
          <div className="sidebar-owner-label">Insights</div>
          <div className={`sidebar-item ${activeView==="analytics"?"active":""}`} onClick={()=>setActiveView("analytics")}><span className="icon">📊</span>Analytics</div>
        </div>
        <div className="sidebar-footer">
          <p>Prices via Finnhub</p>
          <p>FX via ExchangeRate-API</p>
          <p>News via GNews</p>
          <p>Data via Supabase</p>
          <p style={{marginTop:4,color:"var(--amber)"}}>{fmt(usdcad,4)} USD/CAD</p>
          <p>{time.toLocaleTimeString("en-CA",{hour:"2-digit",minute:"2-digit"})}</p>
        </div>
      </div>
      <div className="main">
        <div className="topbar">
          <div>
            <div className="topbar-title">{ACCOUNT_TYPES.find(a=>a.id===activeView)?.label||"Portfolio Overview"}</div>
            {ACCOUNT_IDS.includes(activeView)&&<div className="topbar-subtitle">{ACCOUNT_TYPES.find(a=>a.id===activeView)?.owner}'s {ACCOUNT_TYPES.find(a=>a.id===activeView)?.type} Account</div>}
          </div>
          <div className="topbar-right">
            {refreshing&&<div className="spinner"/>}
            <span style={{fontSize:11,color:"var(--amber)",fontFamily:"var(--mono)",background:"var(--amber-dim)",padding:"3px 8px",borderRadius:4}}>1 USD = {fmt(usdcad,4)} CAD</span>
            <NotificationBell notifications={notifications} onClear={()=>setNotifications([])}/>
            <span style={{fontSize:11,color:"var(--text-2)",fontFamily:"var(--mono)"}}>{time.toLocaleDateString("en-CA",{weekday:"short",month:"short",day:"numeric"})}</span>
            <button className="btn btn-ghost btn-sm" onClick={refreshPrices} disabled={refreshing}>⟳ Prices</button>
            <button className="btn btn-primary btn-sm" onClick={openActivity}>+ Add Activity</button>
          </div>
        </div>
        <div className="content">
          {activeView==="dashboard"&&<DashboardView state={state} prices={prices} divInfo={divInfo} usdcad={usdcad} onRefresh={refreshPrices} refreshing={refreshing} onActivity={openActivity} notifications={notifications} onClearNotifications={()=>setNotifications([])}/>}
          {ACCOUNT_IDS.includes(activeView)&&<AccountView accountId={activeView} state={state} prices={prices} divInfo={divInfo} usdcad={usdcad} onActivity={openActivity} onEdit={h=>setModal({type:"buy",data:h})} onSell={h=>setModal({type:"sellActivity",data:{holding:h}})} onNews={h=>setModal({type:"news",data:h})} onDividendInfo={h=>setModal({type:"dividendInfo",data:h})} onEditCash={()=>setModal({type:"cash",data:{accountId:activeView}})} onDeleteSold={handleDeleteSold}/>}
          {activeView==="analytics"&&<AnalyticsView state={state} prices={prices} divInfo={divInfo} usdcad={usdcad}/>}
        </div>
      </div>
    </div>

    {modal?.type==="activity"&&<ActivityModal onClose={()=>setModal(null)} onBuy={()=>setModal({type:"buy",data:{accountId:modal.data.accountId}})} onSell={()=>setModal({type:"sellActivity",data:{accountId:modal.data.accountId}})}/>}
    {modal?.type==="buy"&&<BuyModal defaultAccountId={modal.data?.accountId} existing={modal.data?.id?modal.data:null} onClose={()=>setModal(null)} onSave={handleSaveHolding}/>}
    {modal?.type==="sellActivity"&&<SellActivityModal holdings={state.holdings.filter(h=>modal.data?.accountId?h.accountId===modal.data.accountId:true)} prices={prices} usdcad={usdcad} defaultAccountId={modal.data?.accountId} onClose={()=>setModal(null)} onSell={handleSellActivity}/>}
    {modal?.type==="cash"&&<CashModal account={state.accounts[modal.data.accountId]||{id:modal.data.accountId,cash:0,deposits:0,withdrawals:0}} onClose={()=>setModal(null)} onSave={d=>handleUpdateCash(modal.data.accountId,d)}/>}
    {modal?.type==="news"&&<NewsPanel holding={modal.data} onClose={()=>setModal(null)}/>}
    {modal?.type==="dividendInfo"&&<DividendInfoModal holding={modal.data} divInfo={divInfo} usdcad={usdcad} onClose={()=>setModal(null)}/>}
    </>
  );
}
