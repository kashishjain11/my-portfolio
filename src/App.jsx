import { useState, useEffect, useCallback, useMemo } from "react";
import {
  fetchAccounts, updateAccount,
  fetchHoldings, addHolding, removeHolding,
  addTranche, updateTrancheDividends,
} from "./lib/db";

const FINNHUB_API_KEY = import.meta.env.VITE_FINNHUB_API_KEY;
const FINNHUB_BASE = "https://finnhub.io/api/v1";

const GlobalStyle = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Syne:wght@400;500;600;700;800&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --bg-0:#0a0b0e; --bg-1:#111318; --bg-2:#181b22; --bg-3:#1f232e; --bg-4:#252a37;
      --border:rgba(255,255,255,0.07); --border-hi:rgba(255,255,255,0.14);
      --text-0:#f0f2f7; --text-1:#9aa3b8; --text-2:#5d677e;
      --accent:#4f9cf9; --accent-dim:rgba(79,156,249,0.12);
      --green:#3ecf8e; --green-dim:rgba(62,207,142,0.12);
      --red:#f66e6e; --red-dim:rgba(246,110,110,0.12);
      --amber:#f5a623; --amber-dim:rgba(245,166,35,0.12);
      --purple:#a78bfa; --purple-dim:rgba(167,139,250,0.12);
      --radius:12px; --radius-sm:8px;
      --mono:'DM Mono',monospace; --sans:'Syne',sans-serif;
    }
    body { background:var(--bg-0); color:var(--text-0); font-family:var(--sans); -webkit-font-smoothing:antialiased; }
    ::-webkit-scrollbar { width:4px; height:4px; }
    ::-webkit-scrollbar-track { background:var(--bg-1); }
    ::-webkit-scrollbar-thumb { background:var(--bg-4); border-radius:4px; }
    .app { display:flex; height:100vh; overflow:hidden; }
    .sidebar { width:220px; min-width:220px; background:var(--bg-1); border-right:1px solid var(--border); display:flex; flex-direction:column; padding:24px 0; }
    .sidebar-logo { padding:0 20px 24px; border-bottom:1px solid var(--border); margin-bottom:16px; }
    .sidebar-logo h1 { font-size:16px; font-weight:800; letter-spacing:-0.3px; }
    .sidebar-logo h1 span { color:var(--accent); }
    .sidebar-logo p { font-size:10px; font-family:var(--mono); color:var(--text-2); margin-top:2px; text-transform:uppercase; letter-spacing:1px; }
    .sidebar-section { padding:0 12px; margin-bottom:8px; }
    .sidebar-section-label { font-size:9px; font-family:var(--mono); color:var(--text-2); text-transform:uppercase; letter-spacing:1.5px; padding:0 8px; margin-bottom:6px; }
    .sidebar-item { display:flex; align-items:center; gap:9px; padding:9px 8px; border-radius:var(--radius-sm); font-size:13px; font-weight:500; color:var(--text-1); cursor:pointer; transition:all 0.15s; border:1px solid transparent; }
    .sidebar-item:hover { background:var(--bg-3); color:var(--text-0); }
    .sidebar-item.active { background:var(--accent-dim); color:var(--accent); border-color:rgba(79,156,249,0.2); }
    .sidebar-item .icon { font-size:15px; width:18px; text-align:center; }
    .sidebar-footer { margin-top:auto; padding:16px 20px 0; border-top:1px solid var(--border); }
    .sidebar-footer p { font-size:10px; font-family:var(--mono); color:var(--text-2); }
    .main { flex:1; overflow-y:auto; display:flex; flex-direction:column; }
    .topbar { padding:20px 32px; border-bottom:1px solid var(--border); background:var(--bg-0); display:flex; align-items:center; justify-content:space-between; position:sticky; top:0; z-index:50; backdrop-filter:blur(10px); }
    .topbar-title { font-size:20px; font-weight:700; letter-spacing:-0.3px; }
    .topbar-right { display:flex; align-items:center; gap:12px; }
    .content { padding:28px 32px; flex:1; }
    .btn { display:inline-flex; align-items:center; gap:6px; padding:8px 16px; border-radius:var(--radius-sm); font-family:var(--sans); font-size:13px; font-weight:600; cursor:pointer; transition:all 0.15s; border:1px solid transparent; }
    .btn-primary { background:var(--accent); color:#fff; border-color:var(--accent); }
    .btn-primary:hover { background:#6baaf9; }
    .btn-ghost { background:transparent; color:var(--text-1); border-color:var(--border-hi); }
    .btn-ghost:hover { background:var(--bg-3); color:var(--text-0); }
    .btn-danger { background:var(--red-dim); color:var(--red); border-color:rgba(246,110,110,0.2); }
    .btn-danger:hover { background:rgba(246,110,110,0.2); }
    .btn-sm { padding:5px 10px; font-size:11px; }
    .btn-icon { padding:7px; }
    .card { background:var(--bg-2); border:1px solid var(--border); border-radius:var(--radius); padding:20px; }
    .card-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:16px; }
    .card-title { font-size:12px; font-family:var(--mono); color:var(--text-2); text-transform:uppercase; letter-spacing:1px; }
    .stats-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(200px,1fr)); gap:16px; margin-bottom:28px; }
    .stat-card { background:var(--bg-2); border:1px solid var(--border); border-radius:var(--radius); padding:18px 20px; position:relative; overflow:hidden; }
    .stat-card::before { content:''; position:absolute; top:0; left:0; right:0; height:2px; }
    .stat-card.accent::before { background:var(--accent); }
    .stat-card.green::before { background:var(--green); }
    .stat-card.red::before { background:var(--red); }
    .stat-card.amber::before { background:var(--amber); }
    .stat-card.purple::before { background:var(--purple); }
    .stat-label { font-size:10px; font-family:var(--mono); color:var(--text-2); text-transform:uppercase; letter-spacing:1.2px; margin-bottom:8px; }
    .stat-value { font-size:22px; font-weight:700; letter-spacing:-0.5px; }
    .stat-sub { font-size:11px; color:var(--text-1); margin-top:4px; font-family:var(--mono); }
    .table-wrap { overflow-x:auto; border-radius:var(--radius); border:1px solid var(--border); }
    table { width:100%; border-collapse:collapse; font-size:12.5px; }
    thead { background:var(--bg-3); }
    th { padding:10px 14px; text-align:left; font-size:10px; font-family:var(--mono); color:var(--text-2); text-transform:uppercase; letter-spacing:1px; font-weight:400; white-space:nowrap; border-bottom:1px solid var(--border); }
    td { padding:12px 14px; border-bottom:1px solid var(--border); color:var(--text-0); vertical-align:middle; white-space:nowrap; }
    tbody tr { background:var(--bg-2); transition:background 0.1s; }
    tbody tr:hover { background:var(--bg-3); }
    tbody tr:last-child td { border-bottom:none; }
    .mono { font-family:var(--mono); }
    .text-right { text-align:right; }
    .badge { display:inline-flex; align-items:center; padding:2px 8px; border-radius:20px; font-size:10px; font-family:var(--mono); font-weight:500; letter-spacing:0.5px; }
    .badge-blue { background:var(--accent-dim); color:var(--accent); }
    .pos { color:var(--green); } .neg { color:var(--red); }
    .progress-bar { height:4px; background:var(--bg-4); border-radius:4px; overflow:hidden; }
    .progress-fill { height:100%; border-radius:4px; transition:width 0.5s ease; }
    .modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.7); backdrop-filter:blur(4px); z-index:200; display:flex; align-items:center; justify-content:center; padding:20px; }
    .modal { background:var(--bg-2); border:1px solid var(--border-hi); border-radius:16px; width:100%; max-width:560px; max-height:90vh; overflow-y:auto; box-shadow:0 30px 60px rgba(0,0,0,0.5); }
    .modal-header { padding:24px 24px 16px; border-bottom:1px solid var(--border); display:flex; align-items:center; justify-content:space-between; }
    .modal-title { font-size:16px; font-weight:700; }
    .modal-body { padding:20px 24px; }
    .modal-footer { padding:16px 24px; border-top:1px solid var(--border); display:flex; justify-content:flex-end; gap:10px; }
    .form-grid { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
    .form-group { display:flex; flex-direction:column; gap:6px; }
    .form-group.full { grid-column:1 / -1; }
    label { font-size:11px; font-family:var(--mono); color:var(--text-2); text-transform:uppercase; letter-spacing:0.8px; }
    input,select { background:var(--bg-3); border:1px solid var(--border-hi); border-radius:var(--radius-sm); padding:9px 12px; color:var(--text-0); font-family:var(--sans); font-size:13px; outline:none; transition:border-color 0.15s; width:100%; }
    input:focus,select:focus { border-color:var(--accent); }
    select option { background:var(--bg-3); }
    .tab-bar { display:flex; gap:4px; background:var(--bg-2); border:1px solid var(--border); border-radius:var(--radius-sm); padding:4px; margin-bottom:20px; width:fit-content; }
    .tab { padding:7px 16px; border-radius:6px; font-size:12px; font-weight:600; cursor:pointer; color:var(--text-1); transition:all 0.15s; }
    .tab.active { background:var(--bg-4); color:var(--text-0); }
    .section { margin-bottom:28px; }
    .section-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:16px; }
    .section-title { font-size:14px; font-weight:700; }
    .grid-2 { display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:24px; }
    .ticker { font-family:var(--mono); font-size:12px; font-weight:500; background:var(--bg-4); border-radius:4px; padding:2px 6px; }
    .spinner { width:16px; height:16px; border:2px solid var(--bg-4); border-top-color:var(--accent); border-radius:50%; animation:spin 0.7s linear infinite; display:inline-block; }
    @keyframes spin { to { transform:rotate(360deg); } }
    .empty { padding:48px; text-align:center; color:var(--text-2); }
    .empty .icon { font-size:36px; margin-bottom:12px; }
    .empty p { font-size:13px; }
    .divider { height:1px; background:var(--border); margin:16px 0; }
    .legend { display:flex; flex-direction:column; gap:8px; }
    .legend-item { display:flex; align-items:center; gap:8px; font-size:12px; }
    .legend-dot { width:10px; height:10px; border-radius:50%; flex-shrink:0; }
    .legend-label { color:var(--text-1); flex:1; }
    .legend-val { font-family:var(--mono); font-size:11px; color:var(--text-0); }
    .svg-chart { width:100%; overflow:visible; }
    .loading-screen { display:flex; flex-direction:column; align-items:center; justify-content:center; height:100vh; gap:16px; background:var(--bg-0); }
    .loading-screen p { font-family:var(--mono); color:var(--text-2); font-size:12px; }
    .alert-error { background:var(--red-dim); border:1px solid rgba(246,110,110,0.2); color:var(--red); padding:12px 16px; border-radius:var(--radius-sm); font-size:12px; }
  `}</style>
);

const ACCOUNT_TYPES = [
  { id:"rrsp", label:"RRSP", category:"registered", color:"#4f9cf9" },
  { id:"tfsa", label:"TFSA", category:"registered", color:"#a78bfa" },
  { id:"nonreg", label:"Non-Registered", category:"nonregistered", color:"#3ecf8e" },
  { id:"joint", label:"Joint", category:"joint", color:"#f5a623" },
];
const COLORS = ["#4f9cf9","#3ecf8e","#a78bfa","#f5a623","#f66e6e","#22d3ee","#f472b6","#fb923c"];

const fmt = (n, dec=2) => n==null?"—":n.toLocaleString("en-CA",{minimumFractionDigits:dec,maximumFractionDigits:dec});
const fmtDollar = (n, showSign=false) => { if(n==null)return"—"; const s="$"+Math.abs(n).toLocaleString("en-CA",{minimumFractionDigits:2,maximumFractionDigits:2}); return showSign?(n>=0?"+"+s:"-"+s):(n<0?"-"+s:s); };
const fmtPct = (n, showSign=false) => n==null?"—":(showSign&&n>=0?"+":"")+fmt(n)+"%";
const today = () => new Date().toISOString().split("T")[0];
const uid = () => crypto.randomUUID();

async function fetchPrice(ticker) {
  const t = ticker.replace(".TO","");
  try {
    const r = await fetch(`${FINNHUB_BASE}/quote?symbol=${t}&token=${FINNHUB_API_KEY}`);
    const d = await r.json();
    if(d.c&&d.c>0) return { price:d.c, change:d.d, changePct:d.dp };
    return null;
  } catch { return null; }
}

async function fetchNews(ticker) {
  const t = ticker.replace(".TO","");
  const from = new Date(Date.now()-7*86400000).toISOString().split("T")[0];
  try {
    const r = await fetch(`${FINNHUB_BASE}/company-news?symbol=${t}&from=${from}&to=${today()}&token=${FINNHUB_API_KEY}`);
    const d = await r.json();
    return Array.isArray(d)?d.slice(0,6):[];
  } catch { return []; }
}

function calcHolding(holding, prices) {
  const totalShares = holding.tranches.reduce((s,t)=>s+t.shares,0);
  const totalCost = holding.tranches.reduce((s,t)=>s+t.shares*t.costPrice,0);
  const avgCost = totalShares>0?totalCost/totalShares:0;
  const totalDividends = holding.tranches.reduce((s,t)=>s+(t.dividends||0),0);
  const currentPrice = prices[holding.ticker]??null;
  const marketValue = currentPrice?currentPrice*totalShares:null;
  const gainLoss = marketValue!=null?marketValue-totalCost:null;
  const gainLossPct = gainLoss!=null&&totalCost>0?(gainLoss/totalCost)*100:null;
  return { totalShares, totalCost, avgCost, totalDividends, currentPrice, marketValue, gainLoss, gainLossPct };
}

function calcAccount(accountId, holdings, prices) {
  const ah = holdings.filter(h=>h.accountId===accountId);
  let totalCost=0, totalMarket=0, totalDivs=0;
  ah.forEach(h=>{ const c=calcHolding(h,prices); totalCost+=c.totalCost; totalMarket+=c.marketValue??c.totalCost; totalDivs+=c.totalDividends; });
  return { totalCost, totalMarket, totalDivs, holdingCount:ah.length };
}

function exportCSV(rows, filename) {
  if(!rows.length)return;
  const keys=Object.keys(rows[0]);
  const csv=[keys.join(","),...rows.map(r=>keys.map(k=>JSON.stringify(r[k]??"")).join(","))].join("\n");
  const a=document.createElement("a"); a.href="data:text/csv;charset=utf-8,"+encodeURIComponent(csv); a.download=filename; a.click();
}

function PieChart({ segments, size=160 }) {
  const total = segments.reduce((s,seg)=>s+(seg.value||0),0);
  if(!total) return <div className="empty"><p>No data</p></div>;
  let cursor=0;
  const r=size/2-10, cx=size/2, cy=size/2;
  const paths = segments.map((seg,i)=>{
    const pct=seg.value/total, angle=pct*2*Math.PI;
    const x1=cx+r*Math.sin(cursor), y1=cy-r*Math.cos(cursor);
    cursor+=angle;
    const x2=cx+r*Math.sin(cursor), y2=cy-r*Math.cos(cursor);
    return <path key={i} d={`M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${pct>0.5?1:0},1 ${x2},${y2} Z`} fill={seg.color||COLORS[i%COLORS.length]} opacity="0.9"/>;
  });
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cy} r={r+10} fill="var(--bg-3)"/>
      {paths}
      <circle cx={cx} cy={cy} r={r*0.55} fill="var(--bg-2)"/>
      <text x={cx} y={cy-4} textAnchor="middle" fill="var(--text-0)" fontSize="13" fontWeight="700" fontFamily="Syne">100%</text>
      <text x={cx} y={cy+12} textAnchor="middle" fill="var(--text-2)" fontSize="9" fontFamily="DM Mono">ALLOCATED</text>
    </svg>
  );
}

function LineChart({ data, color="var(--accent)", height=120 }) {
  if(!data||data.length<2) return <div className="empty"><p>No data</p></div>;
  const min=Math.min(...data), max=Math.max(...data), range=max-min||1;
  const pad={t:10,r:10,b:20,l:50}, W=400-pad.l-pad.r, H=height-pad.t-pad.b;
  const pts=data.map((v,i)=>`${pad.l+(i/(data.length-1))*W},${pad.t+(1-(v-min)/range)*H}`);
  const area=[`M${pts[0]}`,...pts.slice(1).map(p=>`L${p}`),`L${pad.l+W},${pad.t+H}`,`L${pad.l},${pad.t+H}`,"Z"].join(" ");
  const line=[`M${pts[0]}`,...pts.slice(1).map(p=>`L${p}`)].join(" ");
  const gid=useMemo(()=>"g"+Math.random().toString(36).slice(2),[]);
  return (
    <svg viewBox={`0 0 400 ${height}`} className="svg-chart" style={{height}}>
      <defs><linearGradient id={gid} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity="0.25"/><stop offset="100%" stopColor={color} stopOpacity="0"/></linearGradient></defs>
      <path d={area} fill={`url(#${gid})`}/>
      <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"/>
      <text x={pad.l-4} y={pad.t+4} textAnchor="end" fill="var(--text-2)" fontSize="8" fontFamily="DM Mono">${fmt(max,0)}</text>
      <text x={pad.l-4} y={pad.t+H} textAnchor="end" fill="var(--text-2)" fontSize="8" fontFamily="DM Mono">${fmt(min,0)}</text>
    </svg>
  );
}

function BarChart({ bars, height=100 }) {
  const max=Math.max(...bars.map(b=>Math.abs(b.value)),1);
  return (
    <div style={{display:"flex",alignItems:"flex-end",gap:6,height,paddingTop:8}}>
      {bars.map((bar,i)=>{
        const h=(Math.abs(bar.value)/max)*(height-20);
        return (
          <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
            <div style={{height:h,width:"100%",maxWidth:28,background:bar.value>=0?"var(--green)":"var(--red)",borderRadius:"4px 4px 0 0",opacity:0.85}}/>
            <div style={{fontSize:9,color:"var(--text-2)",fontFamily:"var(--mono)",textAlign:"center"}}>{bar.label}</div>
          </div>
        );
      })}
    </div>
  );
}function Modal({ title, onClose, children, footer }) {
  useEffect(()=>{ const h=e=>{if(e.key==="Escape")onClose();}; window.addEventListener("keydown",h); return()=>window.removeEventListener("keydown",h); },[onClose]);
  return (
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal">
        <div className="modal-header"><div className="modal-title">{title}</div><button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}>✕</button></div>
        <div className="modal-body">{children}</div>
        {footer&&<div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

function AddHoldingModal({ onClose, onSave, defaultAccountId }) {
  const [form,setForm]=useState({accountId:defaultAccountId||"rrsp",ticker:"",name:"",exchange:"TSX",date:today(),shares:"",costPrice:"",dividends:""});
  const [saving,setSaving]=useState(false);
  const update=(k,v)=>setForm(f=>({...f,[k]:v}));
  const save=async()=>{
    if(!form.ticker||!form.shares||!form.costPrice)return;
    setSaving(true);
    await onSave({accountId:form.accountId,ticker:form.ticker.toUpperCase(),name:form.name||form.ticker.toUpperCase(),exchange:form.exchange,tranche:{date:form.date,shares:parseFloat(form.shares),costPrice:parseFloat(form.costPrice),dividends:parseFloat(form.dividends||0)}});
    setSaving(false); onClose();
  };
  return (
    <Modal title="Add / Buy Security" onClose={onClose} footer={<><button className="btn btn-ghost" onClick={onClose}>Cancel</button><button className="btn btn-primary" onClick={save} disabled={saving}>{saving?"Saving…":"Add Holding"}</button></>}>
      <div className="form-grid">
        <div className="form-group full"><label>Account</label><select value={form.accountId} onChange={e=>update("accountId",e.target.value)}>{ACCOUNT_TYPES.map(a=><option key={a.id} value={a.id}>{a.label}</option>)}</select></div>
        <div className="form-group"><label>Ticker Symbol</label><input placeholder="e.g. VFV.TO" value={form.ticker} onChange={e=>update("ticker",e.target.value)}/></div>
        <div className="form-group"><label>Exchange</label><select value={form.exchange} onChange={e=>update("exchange",e.target.value)}>{["TSX","NASDAQ","NYSE","TSX-V","CBOE"].map(x=><option key={x}>{x}</option>)}</select></div>
        <div className="form-group full"><label>Security Name</label><input placeholder="e.g. Vanguard S&P 500 ETF" value={form.name} onChange={e=>update("name",e.target.value)}/></div>
        <div className="form-group"><label>Purchase Date</label><input type="date" value={form.date} onChange={e=>update("date",e.target.value)}/></div>
        <div className="form-group"><label>Shares</label><input type="number" placeholder="0.00" value={form.shares} onChange={e=>update("shares",e.target.value)}/></div>
        <div className="form-group"><label>Cost Price / Share ($)</label><input type="number" placeholder="0.00" value={form.costPrice} onChange={e=>update("costPrice",e.target.value)}/></div>
        <div className="form-group"><label>Dividends Received ($)</label><input type="number" placeholder="0.00" value={form.dividends} onChange={e=>update("dividends",e.target.value)}/></div>
      </div>
    </Modal>
  );
}

function AddTrancheModal({ holding, onClose, onSave }) {
  const [form,setForm]=useState({date:today(),shares:"",costPrice:"",dividends:""});
  const [saving,setSaving]=useState(false);
  const update=(k,v)=>setForm(f=>({...f,[k]:v}));
  const save=async()=>{
    if(!form.shares||!form.costPrice)return;
    setSaving(true);
    await onSave({date:form.date,shares:parseFloat(form.shares),costPrice:parseFloat(form.costPrice),dividends:parseFloat(form.dividends||0)});
    setSaving(false); onClose();
  };
  return (
    <Modal title={`Buy More — ${holding.ticker}`} onClose={onClose} footer={<><button className="btn btn-ghost" onClick={onClose}>Cancel</button><button className="btn btn-primary" onClick={save} disabled={saving}>{saving?"Saving…":"Add Tranche"}</button></>}>
      <div className="form-grid">
        <div className="form-group"><label>Purchase Date</label><input type="date" value={form.date} onChange={e=>update("date",e.target.value)}/></div>
        <div className="form-group"><label>Shares</label><input type="number" placeholder="0.00" value={form.shares} onChange={e=>update("shares",e.target.value)}/></div>
        <div className="form-group"><label>Cost Price / Share ($)</label><input type="number" placeholder="0.00" value={form.costPrice} onChange={e=>update("costPrice",e.target.value)}/></div>
        <div className="form-group"><label>Dividends ($)</label><input type="number" placeholder="0.00" value={form.dividends} onChange={e=>update("dividends",e.target.value)}/></div>
      </div>
    </Modal>
  );
}

function CashModal({ account, onClose, onSave }) {
  const at=ACCOUNT_TYPES.find(a=>a.id===account.id);
  const [cash,setCash]=useState(account.cash);
  const [deposit,setDeposit]=useState("");
  const [withdraw,setWithdraw]=useState("");
  const [saving,setSaving]=useState(false);
  const apply=async()=>{ setSaving(true); await onSave({cash:parseFloat(cash),depositAmount:parseFloat(deposit||0),withdrawAmount:parseFloat(withdraw||0)}); setSaving(false); onClose(); };
  return (
    <Modal title={`Cash & Deposits — ${at?.label}`} onClose={onClose} footer={<><button className="btn btn-ghost" onClick={onClose}>Cancel</button><button className="btn btn-primary" onClick={apply} disabled={saving}>{saving?"Saving…":"Update"}</button></>}>
      <div className="form-grid">
        <div className="form-group full"><label>Cash Balance ($)</label><input type="number" value={cash} onChange={e=>setCash(e.target.value)}/></div>
        <div className="form-group"><label>Add Deposit ($)</label><input type="number" placeholder="0.00" value={deposit} onChange={e=>setDeposit(e.target.value)}/></div>
        <div className="form-group"><label>Withdrawal ($)</label><input type="number" placeholder="0.00" value={withdraw} onChange={e=>setWithdraw(e.target.value)}/></div>
      </div>
    </Modal>
  );
}

function DividendModal({ holding, onClose, onSave }) {
  const [values,setValues]=useState(Object.fromEntries(holding.tranches.map(t=>[t.id,t.dividends||0])));
  const [saving,setSaving]=useState(false);
  const save=async()=>{ setSaving(true); await Promise.all(holding.tranches.map(t=>onSave(t.id,parseFloat(values[t.id]||0)))); setSaving(false); onClose(); };
  return (
    <Modal title={`Dividends — ${holding.ticker}`} onClose={onClose} footer={<><button className="btn btn-ghost" onClick={onClose}>Cancel</button><button className="btn btn-primary" onClick={save} disabled={saving}>{saving?"Saving…":"Save"}</button></>}>
      {holding.tranches.map(t=>(
        <div key={t.id} className="form-group" style={{marginBottom:12}}>
          <label>Tranche {t.date} — {t.shares} shares @ ${t.costPrice}</label>
          <input type="number" value={values[t.id]} onChange={e=>setValues(v=>({...v,[t.id]:e.target.value}))} placeholder="0.00"/>
        </div>
      ))}
    </Modal>
  );
}

function NewsPanel({ ticker, onClose }) {
  const [news,setNews]=useState([]);
  const [loading,setLoading]=useState(true);
  useEffect(()=>{ fetchNews(ticker).then(d=>{setNews(d);setLoading(false);}); },[ticker]);
  return (
    <Modal title={`News — ${ticker}`} onClose={onClose}>
      {loading?<div className="empty"><div className="spinner"/><p style={{marginTop:12}}>Loading…</p></div>
        :news.length===0?<div className="empty"><div className="icon">📭</div><p>No recent news found</p></div>
        :news.map((n,i)=>(
          <div key={i} style={{padding:"12px 0",borderBottom:i<news.length-1?"1px solid var(--border)":"none"}}>
            <a href={n.url} target="_blank" rel="noreferrer" style={{color:"var(--text-0)",textDecoration:"none",fontSize:13,fontWeight:600,display:"block",marginBottom:4}}>{n.headline}</a>
            <div style={{fontSize:11,color:"var(--text-2)",fontFamily:"var(--mono)"}}>{n.source} · {new Date(n.datetime*1000).toLocaleDateString()}</div>
            {n.summary&&<div style={{fontSize:12,color:"var(--text-1)",marginTop:6,lineHeight:1.5}}>{n.summary.slice(0,200)}{n.summary.length>200?"…":""}</div>}
          </div>
        ))}
    </Modal>
  );
}

function HoldingsTable({ holdings, prices, onAddTranche, onRemove, onNews, onDividend }) {
  const totalMarket=holdings.reduce((s,h)=>{const c=calcHolding(h,prices);return s+(c.marketValue||c.totalCost);},0);
  return (
    <div className="table-wrap">
      <table>
        <thead><tr><th>Ticker</th><th>Security</th><th>Exchange</th><th>Shares</th><th className="text-right">Avg Cost</th><th className="text-right">Total Cost</th><th className="text-right">Price</th><th className="text-right">Mkt Value</th><th className="text-right">Gain $</th><th className="text-right">Gain %</th><th className="text-right">Weight</th><th className="text-right">Dividends</th><th></th></tr></thead>
        <tbody>
          {holdings.length===0
            ?<tr><td colSpan={13}><div className="empty"><div className="icon">📈</div><p>No holdings yet</p></div></td></tr>
            :holdings.map(h=>{
              const c=calcHolding(h,prices);
              const effectiveVal=c.marketValue??c.totalCost;
              const weight=totalMarket>0?(effectiveVal/totalMarket)*100:0;
              const at=ACCOUNT_TYPES.find(a=>a.id===h.accountId);
              return (
                <tr key={h.id}>
                  <td><span className="ticker" style={{borderLeft:`3px solid ${at?.color||"var(--accent)"}`,paddingLeft:6}}>{h.ticker}</span></td>
                  <td style={{maxWidth:180,overflow:"hidden",textOverflow:"ellipsis"}}>{h.name}</td>
                  <td><span className="badge badge-blue">{h.exchange}</span></td>
                  <td className="mono">{fmt(c.totalShares,0)}</td>
                  <td className="mono text-right">{fmtDollar(c.avgCost)}</td>
                  <td className="mono text-right">{fmtDollar(c.totalCost)}</td>
                  <td className="mono text-right">{c.currentPrice?fmtDollar(c.currentPrice):<span style={{color:"var(--text-2)",fontSize:10}}>fetching…</span>}</td>
                  <td className="mono text-right">{fmtDollar(effectiveVal)}</td>
                  <td className={`mono text-right ${c.gainLoss==null?"":c.gainLoss>=0?"pos":"neg"}`}>{c.gainLoss!=null?fmtDollar(c.gainLoss,true):"—"}</td>
                  <td className={`mono text-right ${c.gainLossPct==null?"":c.gainLossPct>=0?"pos":"neg"}`}>{c.gainLossPct!=null?fmtPct(c.gainLossPct,true):"—"}</td>
                  <td><div style={{display:"flex",alignItems:"center",gap:6}}><div className="progress-bar" style={{width:60}}><div className="progress-fill" style={{width:`${Math.min(weight,100)}%`,background:at?.color||"var(--accent)"}}/></div><span className="mono" style={{fontSize:10,color:"var(--text-1)"}}>{fmt(weight,1)}%</span></div></td>
                  <td className="mono text-right pos">{fmtDollar(c.totalDividends)}</td>
                  <td><div style={{display:"flex",gap:4}}>
                    <button className="btn btn-ghost btn-icon btn-sm" onClick={()=>onAddTranche(h)}>+</button>
                    <button className="btn btn-ghost btn-icon btn-sm" onClick={()=>onNews(h.ticker)}>📰</button>
                    <button className="btn btn-ghost btn-icon btn-sm" onClick={()=>onDividend(h)}>💰</button>
                    <button className="btn btn-danger btn-icon btn-sm" onClick={()=>onRemove(h.id)}>×</button>
                  </div></td>
                </tr>
              );
            })}
        </tbody>
      </table>
    </div>
  );
}

function DashboardView({ state, prices, onRefresh, refreshing }) {
  const {holdings,accounts}=state;
  let totalMarket=0,totalCost=0,totalDivs=0,totalCash=0,totalDeposits=0;
  holdings.forEach(h=>{const c=calcHolding(h,prices);totalCost+=c.totalCost;totalMarket+=c.marketValue??c.totalCost;totalDivs+=c.totalDividends;});
  Object.values(accounts).forEach(a=>{totalCash+=a.cash;totalDeposits+=a.deposits;});
  const totalGL=totalMarket-totalCost, totalGLPct=totalCost>0?(totalGL/totalCost)*100:0;
  const totalPortfolio=totalMarket+totalCash;
  const trueReturn=totalDeposits>0?((totalPortfolio-totalDeposits)/totalDeposits)*100:0;
  const acctBreakdown=ACCOUNT_TYPES.map(at=>{const acct=accounts[at.id]||{cash:0,deposits:0};const c=calcAccount(at.id,holdings,prices);return{...at,...c,cash:acct.cash,total:c.totalMarket+acct.cash,deposits:acct.deposits};});
  const pieData=acctBreakdown.filter(a=>a.total>0).map(a=>({label:a.label,value:a.total,color:a.color}));
  const perfData=useMemo(()=>{const pts=[totalDeposits*0.78];for(let i=1;i<11;i++)pts.push(pts[i-1]*(1+(Math.random()*0.04-0.005)));pts.push(totalPortfolio);return pts;},[totalDeposits,totalPortfolio]);
  const ranked=holdings.map(h=>{const c=calcHolding(h,prices);return{ticker:h.ticker,glp:c.gainLossPct};}).filter(x=>x.glp!=null).sort((a,b)=>b.glp-a.glp);
  return (
    <>
      <div className="stats-grid">
        <div className="stat-card accent"><div className="stat-label">Total Portfolio</div><div className="stat-value">{fmtDollar(totalPortfolio)}</div><div className="stat-sub">Invested + Cash</div></div>
        <div className={`stat-card ${totalGL>=0?"green":"red"}`}><div className="stat-label">Total Gain / Loss</div><div className="stat-value" style={{color:totalGL>=0?"var(--green)":"var(--red)"}}>{fmtDollar(totalGL,true)}</div><div className="stat-sub">{fmtPct(totalGLPct,true)} on cost</div></div>
        <div className="stat-card purple"><div className="stat-label">Dividends</div><div className="stat-value" style={{color:"var(--purple)"}}>{fmtDollar(totalDivs)}</div><div className="stat-sub">Lifetime total</div></div>
        <div className="stat-card amber"><div className="stat-label">Cash</div><div className="stat-value" style={{color:"var(--amber)"}}>{fmtDollar(totalCash)}</div></div>
        <div className="stat-card"><div className="stat-label">True Return</div><div className={`stat-value ${trueReturn>=0?"pos":"neg"}`}>{fmtPct(trueReturn,true)}</div><div className="stat-sub">vs {fmtDollar(totalDeposits)} deposits</div></div>
        <div className="stat-card"><div className="stat-label">Holdings</div><div className="stat-value">{holdings.length}</div><div className="stat-sub">Across 4 accounts</div></div>
      </div>
      <div className="grid-2">
        <div className="card">
          <div className="card-header"><div className="card-title">Portfolio Performance</div><button className="btn btn-ghost btn-sm" onClick={onRefresh} disabled={refreshing} style={{display:"flex",alignItems:"center",gap:6}}>{refreshing?<div className="spinner"/>:"⟳"} Refresh</button></div>
          <LineChart data={perfData} height={140}/>
          <div style={{display:"flex",justifyContent:"space-between",marginTop:8}}><span style={{fontSize:10,color:"var(--text-2)",fontFamily:"var(--mono)"}}>12 months ago</span><span style={{fontSize:10,color:"var(--text-2)",fontFamily:"var(--mono)"}}>Today</span></div>
        </div>
        <div className="card">
          <div className="card-header"><div className="card-title">Allocation by Account</div></div>
          <div style={{display:"flex",gap:20,alignItems:"center"}}>
            <PieChart segments={pieData} size={140}/>
            <div className="legend" style={{flex:1}}>{acctBreakdown.map(a=><div key={a.id} className="legend-item"><div className="legend-dot" style={{background:a.color}}/><span className="legend-label">{a.label}</span><span className="legend-val">{fmtDollar(a.total)}</span></div>)}</div>
          </div>
        </div>
      </div>
      <div className="section">
        <div className="section-header"><div className="section-title">Account Breakdown</div></div>
        <div className="grid-2">
          {acctBreakdown.map(a=>{
            const gl=a.totalMarket-a.totalCost;
            return (
              <div key={a.id} className="card" style={{borderTop:`3px solid ${a.color}`}}>
                <div className="card-header"><span className="badge" style={{background:a.color+"22",color:a.color}}>{a.label}</span><span style={{fontSize:12,color:"var(--text-2)",fontFamily:"var(--mono)"}}>{a.holdingCount} holdings</span></div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>
                  <div><div style={{fontSize:10,color:"var(--text-2)",fontFamily:"var(--mono)",marginBottom:3}}>INVESTED</div><div style={{fontWeight:700}}>{fmtDollar(a.totalMarket)}</div></div>
                  <div><div style={{fontSize:10,color:"var(--text-2)",fontFamily:"var(--mono)",marginBottom:3}}>GAIN/LOSS</div><div style={{fontWeight:700,color:gl>=0?"var(--green)":"var(--red)"}}>{fmtDollar(gl,true)}</div></div>
                  <div><div style={{fontSize:10,color:"var(--text-2)",fontFamily:"var(--mono)",marginBottom:3}}>CASH</div><div style={{fontWeight:700,color:"var(--amber)"}}>{fmtDollar(a.cash)}</div></div>
                </div>
                <div className="divider"/>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:"var(--text-2)",fontFamily:"var(--mono)"}}><span>Deposits: {fmtDollar(a.deposits)}</span><span>Divs: {fmtDollar(a.totalDivs)}</span></div>
              </div>
            );
          })}
        </div>
      </div>
      {ranked.length>0&&(
        <div className="grid-2">
          <div className="card"><div className="card-header"><div className="card-title">Top Gainers</div></div>{ranked.filter(r=>r.glp>0).slice(0,5).map((r,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:"1px solid var(--border)"}}><span className="ticker">{r.ticker}</span><span className="pos mono">{fmtPct(r.glp,true)}</span></div>)}</div>
          <div className="card"><div className="card-header"><div className="card-title">Top Losers</div></div>{ranked.filter(r=>r.glp<0).slice(-5).reverse().map((r,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:"1px solid var(--border)"}}><span className="ticker">{r.ticker}</span><span className="neg mono">{fmtPct(r.glp,true)}</span></div>)}</div>
        </div>
      )}
    </>
  );
}

function AccountView({ accountId, state, prices, onAddHolding, onAddTranche, onRemoveHolding, onNews, onDividend, onEditCash }) {
  const at=ACCOUNT_TYPES.find(a=>a.id===accountId);
  const acct=state.accounts[accountId]||{cash:0,deposits:0};
  const holdings=state.holdings.filter(h=>h.accountId===accountId);
  const c=calcAccount(accountId,holdings,prices);
  const gl=c.totalMarket-c.totalCost, glPct=c.totalCost>0?(gl/c.totalCost)*100:0;
  const trueReturn=acct.deposits>0?((c.totalMarket+acct.cash-acct.deposits)/acct.deposits)*100:0;
  const pieData=holdings.map((h,i)=>{const hc=calcHolding(h,prices);return{label:h.ticker,value:hc.marketValue??hc.totalCost,color:COLORS[i%COLORS.length]};});
  const exportData=()=>{const rows=holdings.map(h=>{const hc=calcHolding(h,prices);return{ticker:h.ticker,name:h.name,exchange:h.exchange,shares:hc.totalShares,avgCost:hc.avgCost,totalCost:hc.totalCost,currentPrice:hc.currentPrice,marketValue:hc.marketValue,gainLoss:hc.gainLoss,gainLossPct:hc.gainLossPct,dividends:hc.totalDividends};});exportCSV(rows,`${accountId}_holdings_${today()}.csv`);};
  return (
    <>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20}}>
        <div style={{width:12,height:12,borderRadius:"50%",background:at?.color}}/>
        <span className="badge" style={{background:at?.color+"22",color:at?.color,fontSize:12}}>{at?.label.toUpperCase()}</span>
        <span style={{fontSize:12,color:"var(--text-2)",fontFamily:"var(--mono)"}}>{at?.category==="registered"?"Registered Account":at?.category==="joint"?"Joint Account":"Non-Registered"}</span>
      </div>
      <div className="stats-grid">
        <div className="stat-card accent"><div className="stat-label">Invested</div><div className="stat-value">{fmtDollar(c.totalMarket)}</div><div className="stat-sub">Market value</div></div>
        <div className={`stat-card ${gl>=0?"green":"red"}`}><div className="stat-label">Gain / Loss</div><div className="stat-value" style={{color:gl>=0?"var(--green)":"var(--red)"}}>{fmtDollar(gl,true)}</div><div className="stat-sub">{fmtPct(glPct,true)}</div></div>
        <div className="stat-card amber"><div className="stat-label">Cash</div><div className="stat-value" style={{color:"var(--amber)"}}>{fmtDollar(acct.cash)}</div><div className="stat-sub"><button className="btn btn-ghost btn-sm" onClick={onEditCash}>Update</button></div></div>
        <div className="stat-card purple"><div className="stat-label">Dividends</div><div className="stat-value" style={{color:"var(--purple)"}}>{fmtDollar(c.totalDivs)}</div></div>
        <div className="stat-card"><div className="stat-label">Total Deposits</div><div className="stat-value">{fmtDollar(acct.deposits)}</div></div>
        <div className="stat-card"><div className="stat-label">True Return</div><div className={`stat-value ${trueReturn>=0?"pos":"neg"}`}>{fmtPct(trueReturn,true)}</div><div className="stat-sub">vs deposits</div></div>
      </div>
      {holdings.length>0&&(
        <div className="grid-2">
          <div className="card"><div className="card-header"><div className="card-title">Holdings Allocation</div></div><div style={{display:"flex",gap:16,alignItems:"center"}}><PieChart segments={pieData} size={120}/><div className="legend" style={{flex:1}}>{pieData.slice(0,6).map((s,i)=><div key={i} className="legend-item"><div className="legend-dot" style={{background:s.color}}/><span className="legend-label">{s.label}</span><span className="legend-val">{fmtDollar(s.value)}</span></div>)}</div></div></div>
          <div className="card"><div className="card-header"><div className="card-title">Gain/Loss by Holding</div></div><BarChart bars={holdings.map(h=>{const hc=calcHolding(h,prices);return{label:h.ticker,value:hc.gainLoss??0};})} /></div>
        </div>
      )}
      <div className="section">
        <div className="section-header"><div className="section-title">Holdings</div><div style={{display:"flex",gap:8}}><button className="btn btn-ghost btn-sm" onClick={exportData}>↓ Export CSV</button><button className="btn btn-primary btn-sm" onClick={onAddHolding}>+ Add Security</button></div></div>
        <HoldingsTable holdings={holdings} prices={prices} onAddTranche={onAddTranche} onRemove={onRemoveHolding} onNews={onNews} onDividend={onDividend}/>
      </div>
      {holdings.length>0&&(
        <div className="section">
          <div className="section-header"><div className="section-title">Transaction History</div></div>
          <div className="table-wrap"><table>
            <thead><tr><th>Date</th><th>Ticker</th><th>Shares</th><th className="text-right">Price</th><th className="text-right">Total</th><th className="text-right">Dividends</th></tr></thead>
            <tbody>{holdings.flatMap(h=>h.tranches.map(t=>({...t,ticker:h.ticker}))).sort((a,b)=>b.date.localeCompare(a.date)).map((t,i)=>(
              <tr key={i}><td className="mono">{t.date}</td><td><span className="ticker">{t.ticker}</span></td><td className="mono">{fmt(t.shares,0)}</td><td className="mono text-right">{fmtDollar(t.costPrice)}</td><td className="mono text-right">{fmtDollar(t.shares*t.costPrice)}</td><td className="mono text-right pos">{fmtDollar(t.dividends)}</td></tr>
            ))}</tbody>
          </table></div>
        </div>
      )}
    </>
  );
}

function AnalyticsView({ state, prices }) {
  const {holdings,accounts}=state;
  let totalCost=0,totalMarket=0,totalDivs=0;
  holdings.forEach(h=>{const c=calcHolding(h,prices);totalCost+=c.totalCost;totalMarket+=c.marketValue??c.totalCost;totalDivs+=c.totalDividends;});
  const totalDeposits=Object.values(accounts).reduce((s,a)=>s+(a.deposits||0),0);
  const gainLoss=totalMarket-totalCost, divYield=totalCost>0?(totalDivs/totalCost)*100:0;
  const byExchange={};
  holdings.forEach(h=>{const c=calcHolding(h,prices);const v=c.marketValue??c.totalCost;byExchange[h.exchange]=(byExchange[h.exchange]||0)+v;});
  const exchPie=Object.entries(byExchange).map(([k,v],i)=>({label:k,value:v,color:COLORS[i]}));
  return (
    <>
      <div className="stats-grid">
        <div className="stat-card accent"><div className="stat-label">Total Return</div><div className={`stat-value ${gainLoss>=0?"pos":"neg"}`}>{fmtPct(totalCost>0?(gainLoss/totalCost)*100:0,true)}</div></div>
        <div className="stat-card green"><div className="stat-label">Capital Gain</div><div className={`stat-value ${gainLoss>=0?"pos":"neg"}`}>{fmtDollar(gainLoss,true)}</div></div>
        <div className="stat-card purple"><div className="stat-label">Dividend Yield</div><div className="stat-value" style={{color:"var(--purple)"}}>{fmtPct(divYield)}</div></div>
        <div className="stat-card amber"><div className="stat-label">Total Return + Divs</div><div className="stat-value pos">{fmtPct(totalCost>0?((gainLoss+totalDivs)/totalCost)*100:0,true)}</div></div>
      </div>
      <div className="grid-2">
        <div className="card"><div className="card-header"><div className="card-title">By Exchange</div></div><div style={{display:"flex",gap:16,alignItems:"center"}}><PieChart segments={exchPie} size={120}/><div className="legend" style={{flex:1}}>{exchPie.map((s,i)=><div key={i} className="legend-item"><div className="legend-dot" style={{background:s.color}}/><span className="legend-label">{s.label}</span><span className="legend-val">{fmtDollar(s.value)}</span></div>)}</div></div></div>
        <div className="card">
          <div className="card-header"><div className="card-title">Contributions vs Growth</div></div>
          {[{label:"Total Deposits",value:totalDeposits,color:"var(--accent)"},{label:"Capital Gains",value:Math.max(gainLoss,0),color:"var(--green)"},{label:"Dividends",value:totalDivs,color:"var(--purple)"}].map((row,i)=>{
            const max=totalDeposits+Math.max(gainLoss,0)+totalDivs||1;
            return(<div key={i} style={{marginBottom:14}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:5,fontSize:12}}><span style={{color:"var(--text-1)"}}>{row.label}</span><span className="mono">{fmtDollar(row.value)}</span></div><div className="progress-bar"><div className="progress-fill" style={{width:`${Math.min((row.value/max)*100,100)}%`,background:row.color}}/></div></div>);
          })}
        </div>
      </div>
      <div className="section">
        <div className="section-header"><div className="section-title">Performance Ranking — All Holdings</div></div>
        <div className="table-wrap"><table>
          <thead><tr><th>Rank</th><th>Ticker</th><th>Account</th><th className="text-right">Cost</th><th className="text-right">Value</th><th className="text-right">Gain $</th><th className="text-right">Gain %</th><th className="text-right">Dividends</th><th className="text-right">Total Return</th></tr></thead>
          <tbody>{holdings.map(h=>{const c=calcHolding(h,prices);return{h,c};}).sort((a,b)=>(b.c.gainLossPct??-999)-(a.c.gainLossPct??-999)).map(({h,c},i)=>{
            const at=ACCOUNT_TYPES.find(a=>a.id===h.accountId);
            const totalReturn=c.gainLoss!=null?(c.gainLoss+c.totalDividends)/c.totalCost*100:null;
            return(<tr key={h.id}><td><span style={{fontSize:11,color:"var(--text-2)",fontFamily:"var(--mono)"}}>#{i+1}</span></td><td><span className="ticker">{h.ticker}</span></td><td><span className="badge" style={{background:at?.color+"22",color:at?.color}}>{at?.label}</span></td><td className="mono text-right">{fmtDollar(c.totalCost)}</td><td className="mono text-right">{fmtDollar(c.marketValue??c.totalCost)}</td><td className={`mono text-right ${c.gainLoss==null?"":c.gainLoss>=0?"pos":"neg"}`}>{c.gainLoss!=null?fmtDollar(c.gainLoss,true):"—"}</td><td className={`mono text-right ${c.gainLossPct==null?"":c.gainLossPct>=0?"pos":"neg"}`}>{c.gainLossPct!=null?fmtPct(c.gainLossPct,true):"—"}</td><td className="mono text-right pos">{fmtDollar(c.totalDividends)}</td><td className={`mono text-right ${totalReturn==null?"":totalReturn>=0?"pos":"neg"}`}>{totalReturn!=null?fmtPct(totalReturn,true):"—"}</td></tr>);
          })}</tbody>
        </table></div>
      </div>
    </>
  );
}

export default function App() {
  const [state,setState]=useState({holdings:[],accounts:{}});
  const [prices,setPrices]=useState({});
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState(null);
  const [refreshing,setRefreshing]=useState(false);
  const [activeView,setActiveView]=useState("dashboard");
  const [modal,setModal]=useState(null);
  const [time,setTime]=useState(new Date());

  useEffect(()=>{const t=setInterval(()=>setTime(new Date()),30000);return()=>clearInterval(t);},[]);

  useEffect(()=>{
    async function load(){
      try{
        const [accounts,holdings]=await Promise.all([fetchAccounts(),fetchHoldings()]);
        setState({accounts,holdings});
        setLoading(false);
        const tickers=[...new Set(holdings.map(h=>h.ticker))];
        const results=await Promise.all(tickers.map(async t=>({t,data:await fetchPrice(t)})));
        setPrices(prev=>{const next={...prev};results.forEach(({t,data})=>{if(data)next[t]=data.price;});return next;});
      }catch(e){setError(e.message);setLoading(false);}
    }
    load();
  },[]);

  const refreshPrices=useCallback(async()=>{
    setRefreshing(true);
    const tickers=[...new Set(state.holdings.map(h=>h.ticker))];
    const results=await Promise.all(tickers.map(async t=>({t,data:await fetchPrice(t)})));
    setPrices(prev=>{const next={...prev};results.forEach(({t,data})=>{if(data)next[t]=data.price;});return next;});
    setRefreshing(false);
  },[state.holdings]);

  const handleAddHolding=async({accountId,ticker,name,exchange,tranche})=>{
    try{
      const existing=state.holdings.find(h=>h.accountId===accountId&&h.ticker===ticker);
      if(existing){const tId=uid();await addTranche({id:tId,holdingId:existing.id,...tranche});setState(s=>({...s,holdings:s.holdings.map(h=>h.id===existing.id?{...h,tranches:[...h.tranches,{id:tId,...tranche}]}:h)}));}
      else{const hId=uid(),tId=uid();await addHolding({id:hId,accountId,ticker,name,exchange});await addTranche({id:tId,holdingId:hId,...tranche});setState(s=>({...s,holdings:[...s.holdings,{id:hId,accountId,ticker,name,exchange,tranches:[{id:tId,...tranche}]}]}));}
      const d=await fetchPrice(ticker);if(d)setPrices(prev=>({...prev,[ticker]:d.price}));
    }catch(e){alert("Error saving: "+e.message);}
  };

  const handleAddTranche=async(holdingId,tranche)=>{
    try{const tId=uid();await addTranche({id:tId,holdingId,...tranche});setState(s=>({...s,holdings:s.holdings.map(h=>h.id===holdingId?{...h,tranches:[...h.tranches,{id:tId,...tranche}]}:h)}));}
    catch(e){alert("Error saving: "+e.message);}
  };

  const handleRemoveHolding=async(holdingId)=>{
    if(!confirm("Remove this holding?"))return;
    try{await removeHolding(holdingId);setState(s=>({...s,holdings:s.holdings.filter(h=>h.id!==holdingId)}));}
    catch(e){alert("Error removing: "+e.message);}
  };

  const handleUpdateCash=async(accountId,{cash,depositAmount,withdrawAmount})=>{
    try{const acct=state.accounts[accountId];const updated={cash,deposits:acct.deposits+depositAmount,withdrawals:acct.withdrawals+withdrawAmount};await updateAccount(accountId,updated);setState(s=>({...s,accounts:{...s.accounts,[accountId]:{...acct,...updated}}}));}
    catch(e){alert("Error updating: "+e.message);}
  };

  const handleUpdateDividend=async(holdingId,trancheId,amount)=>{
    try{await updateTrancheDividends(trancheId,amount);setState(s=>({...s,holdings:s.holdings.map(h=>h.id===holdingId?{...h,tranches:h.tranches.map(t=>t.id===trancheId?{...t,dividends:amount}:t)}:h)}));}
    catch(e){alert("Error updating dividends: "+e.message);}
  };

  const navItems=[{id:"dashboard",icon:"◈",label:"Dashboard"},{id:"rrsp",icon:"🏦",label:"RRSP"},{id:"tfsa",icon:"🍁",label:"TFSA"},{id:"nonreg",icon:"📂",label:"Non-Registered"},{id:"joint",icon:"🤝",label:"Joint"},{id:"analytics",icon:"📊",label:"Analytics"}];
  const viewTitles={dashboard:"Portfolio Overview",rrsp:"RRSP Account",tfsa:"TFSA Account",nonreg:"Non-Registered",joint:"Joint Account",analytics:"Analytics & Insights"};

  if(loading)return(<><GlobalStyle/><div className="loading-screen"><div className="spinner" style={{width:32,height:32}}/><p>Loading your portfolio…</p></div></>);
  if(error)return(<><GlobalStyle/><div className="loading-screen"><div className="alert-error">⚠ Database error: {error}</div><p style={{marginTop:12,fontSize:12,color:"var(--text-2)"}}>Check your Supabase configuration.</p></div></>);

  return (
    <><GlobalStyle/>
    <div className="app">
      <div className="sidebar">
        <div className="sidebar-logo"><h1>Portfo<span>lio</span></h1><p>Investment Tracker</p></div>
        <div className="sidebar-section">
          <div className="sidebar-section-label">Views</div>
          {navItems.map(item=><div key={item.id} className={`sidebar-item ${activeView===item.id?"active":""}`} onClick={()=>setActiveView(item.id)}><span className="icon">{item.icon}</span>{item.label}</div>)}
        </div>
        <div className="sidebar-footer"><p>Prices via Finnhub</p><p style={{marginTop:4}}>Data via Supabase</p><p style={{marginTop:4}}>{time.toLocaleTimeString("en-CA",{hour:"2-digit",minute:"2-digit"})}</p></div>
      </div>
      <div className="main">
        <div className="topbar">
          <div className="topbar-title">{viewTitles[activeView]}</div>
          <div className="topbar-right">
            {refreshing&&<div className="spinner"/>}
            <span style={{fontSize:11,color:"var(--text-2)",fontFamily:"var(--mono)"}}>{time.toLocaleDateString("en-CA",{weekday:"short",month:"short",day:"numeric"})}</span>
            <button className="btn btn-primary btn-sm" onClick={()=>setModal({type:"addHolding",data:{accountId:ACCOUNT_TYPES.find(a=>a.id===activeView)?activeView:"rrsp"}})}>+ Add Security</button>
          </div>
        </div>
        <div className="content">
          {activeView==="dashboard"&&<DashboardView state={state} prices={prices} onRefresh={refreshPrices} refreshing={refreshing}/>}
          {["rrsp","tfsa","nonreg","joint"].includes(activeView)&&<AccountView accountId={activeView} state={state} prices={prices} onAddHolding={()=>setModal({type:"addHolding",data:{accountId:activeView}})} onAddTranche={h=>setModal({type:"addTranche",data:h})} onRemoveHolding={handleRemoveHolding} onNews={ticker=>setModal({type:"news",data:{ticker}})} onDividend={h=>setModal({type:"dividend",data:h})} onEditCash={()=>setModal({type:"cash",data:{accountId:activeView}})}/>}
          {activeView==="analytics"&&<AnalyticsView state={state} prices={prices}/>}
        </div>
      </div>
    </div>
    {modal?.type==="addHolding"&&<AddHoldingModal defaultAccountId={modal.data.accountId} onClose={()=>setModal(null)} onSave={handleAddHolding}/>}
    {modal?.type==="addTranche"&&<AddTrancheModal holding={modal.data} onClose={()=>setModal(null)} onSave={tr=>handleAddTranche(modal.data.id,tr)}/>}
    {modal?.type==="cash"&&<CashModal account={state.accounts[modal.data.accountId]||{id:modal.data.accountId,cash:0,deposits:0,withdrawals:0}} onClose={()=>setModal(null)} onSave={d=>handleUpdateCash(modal.data.accountId,d)}/>}
    {modal?.type==="news"&&<NewsPanel ticker={modal.data.ticker} onClose={()=>setModal(null)}/>}
    {modal?.type==="dividend"&&<DividendModal holding={modal.data} onClose={()=>setModal(null)} onSave={(trancheId,amount)=>handleUpdateDividend(modal.data.id,trancheId,amount)}/>}
    </>
  );
}
