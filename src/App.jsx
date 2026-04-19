import { useState, useEffect, useCallback, useMemo, useRef } from “react”;
const VER = “3.0.2”;
const IMP = [{ v: 3, l: “高”, c: “#ff3b30”, icon: “≡” }, { v: 2, l: “中”, c: “#ff9500”, icon: “=” }, { v: 1, l: “低”, c: “#8e8e93”, icon: “―” }];
const WI = [{ v: 3, l: “重い”, h: “4h+”, bw: 6, bh: 100 }, { v: 2, l: “普通”, h: “1-4h”, bw: 4, bh: 75 }, { v: 1, l: “軽い”, h: “~1h”, bw: 3, bh: 55 }, { v: 0, l: “超軽い”, h: “~10m”, bw: 2, bh: 40 }];
const REC = [{ v: “none”, l: “なし” }, { v: “daily”, l: “毎日” }, { v: “weekly”, l: “毎週” }, { v: “monthly”, l: “毎月” }];
const SORTS = [{ v: “smart”, l: “スマート順” }, { v: “importance”, l: “重要度順” }, { v: “deadline”, l: “締切順” }, { v: “heavy”, l: “重い順” }, { v: “light”, l: “軽い順” }, { v: “created”, l: “作成日順” }];
const ROI_MAP = {“3-3”:”#f97316”,“3-2”:”#eab308”,“3-1”:”#22c55e”,“3-0”:”#22c55e”,“2-3”:”#3b82f6”,“2-2”:”#06b6d4”,“2-1”:”#14b8a6”,“2-0”:”#14b8a6”,“1-3”:”#a855f7”,“1-2”:”#c084fc”,“1-1”:”#67e8f9”,“1-0”:”#67e8f9”};
const TIER_MAP = {“3-1”:1,“3-0”:1,“3-2”:2,“3-3”:3,“2-1”:4,“2-0”:4,“2-2”:5,“2-3”:6,“1-1”:7,“1-0”:7,“1-2”:8,“1-3”:9};
const TIER = {
1:{bg:”#162016”,border:“rgba(34,197,94,0.35)”,shadow:“rgba(34,197,94,0.1)”,fs:16,fw:800,tc:”#fff”,mc:”#ccc”,pad:16,mfs:11,bfs:10,bp:“4px 10px”},
2:{bg:”#1a1906”,border:“rgba(234,179,8,0.3)”,shadow:“rgba(234,179,8,0.08)”,fs:15,fw:700,tc:”#f5f5f5”,mc:”#bbb”,pad:15,mfs:10.5,bfs:10,bp:“4px 9px”},
3:{bg:”#1a1208”,border:“rgba(249,115,22,0.25)”,shadow:“rgba(249,115,22,0.06)”,fs:14,fw:700,tc:”#eee”,mc:”#aaa”,pad:14,mfs:10,bfs:9,bp:“3px 9px”},
4:{bg:”#111413”,border:“rgba(20,184,166,0.22)”,shadow:“rgba(20,184,166,0.05)”,fs:13.5,fw:600,tc:”#e0e0e0”,mc:”#999”,pad:13,mfs:10,bfs:9,bp:“3px 8px”},
5:{bg:”#101213”,border:“rgba(6,182,212,0.2)”,shadow:“rgba(6,182,212,0.04)”,fs:13,fw:600,tc:”#d0d0d0”,mc:”#999”,pad:12,mfs:9.5,bfs:9,bp:“3px 8px”},
6:{bg:”#0e0e14”,border:“rgba(59,130,246,0.18)”,shadow:“rgba(59,130,246,0.04)”,fs:12.5,fw:600,tc:”#bbb”,mc:”#888”,pad:11,mfs:9,bfs:8,bp:“3px 7px”},
7:{bg:”#0c0d0d”,border:“rgba(103,232,249,0.14)”,shadow:“rgba(103,232,249,0.03)”,fs:12,fw:500,tc:”#999”,mc:”#777”,pad:10,mfs:8.5,bfs:8,bp:“2px 6px”},
8:{bg:”#0c0a0e”,border:“rgba(192,132,252,0.12)”,shadow:“rgba(192,132,252,0.03)”,fs:11.5,fw:500,tc:”#888”,mc:”#666”,pad:9,mfs:8,bfs:7,bp:“2px 5px”},
9:{bg:”#0a090c”,border:“rgba(168,85,247,0.1)”,shadow:“none”,fs:11,fw:500,tc:”#777”,mc:”#555”,pad:8,mfs:7.5,bfs:7,bp:“2px 5px”},
};
const TIER_LIGHT = {
1:{bg:”#f0fdf4”,border:“rgba(34,197,94,0.4)”,shadow:“rgba(34,197,94,0.08)”,tc:”#111”,mc:”#555”},
2:{bg:”#fefce8”,border:“rgba(234,179,8,0.35)”,shadow:“rgba(234,179,8,0.06)”,tc:”#222”,mc:”#666”},
3:{bg:”#fff7ed”,border:“rgba(249,115,22,0.3)”,shadow:“rgba(249,115,22,0.05)”,tc:”#222”,mc:”#666”},
4:{bg:”#f0fdfa”,border:“rgba(20,184,166,0.3)”,shadow:“rgba(20,184,166,0.04)”,tc:”#333”,mc:”#777”},
5:{bg:”#fff”,border:“rgba(6,182,212,0.25)”,shadow:“rgba(6,182,212,0.04)”,tc:”#333”,mc:”#777”},
6:{bg:”#faf9ff”,border:“rgba(59,130,246,0.2)”,shadow:“rgba(59,130,246,0.03)”,tc:”#444”,mc:”#888”},
7:{bg:”#f8f8f8”,border:“rgba(103,232,249,0.2)”,shadow:“rgba(103,232,249,0.02)”,tc:”#555”,mc:”#999”},
8:{bg:”#f6f4f9”,border:“rgba(192,132,252,0.18)”,shadow:“rgba(192,132,252,0.02)”,tc:”#666”,mc:”#999”},
9:{bg:”#f4f3f5”,border:“rgba(168,85,247,0.15)”,shadow:“none”,tc:”#777”,mc:”#aaa”},
};
const TH = {
dark:{bg:”#0a0a0a”,card:”#111”,text:”#fff”,sub:”#aaa”,mut:”#888”,dim:”#555”,brd:”#333”,inp:”#1a1a1a”,cOff:”#1a1a1a”,cOffT:”#888”,cOn:”#fff”,cOnT:”#000”,iBg:”#1a1a1a”,iBrd:”#333”,iC:”#ccc”,fBrd:”#444”,fOffT:”#999”,modal:“rgba(0,0,0,0.7)”,toast:”#1a1a1a”,memo:”#0a0a0a”,memB:”#2a2a2a”,shd:“rgba(0,0,0,0.4)”,chk:”#555”,addB:”#555”,addC:”#aaa”,sch:“dark”},
light:{bg:”#f8f7f4”,card:”#fff”,text:”#222”,sub:”#666”,mut:”#999”,dim:”#bbb”,brd:”#d5d3ce”,inp:”#f0efec”,cOff:”#f0efec”,cOffT:”#888”,cOn:”#222”,cOnT:”#fff”,iBg:”#fff”,iBrd:”#ddd”,iC:”#666”,fBrd:”#d5d3ce”,fOffT:”#888”,modal:“rgba(0,0,0,0.4)”,toast:”#fff”,memo:”#f0efec”,memB:”#e0e0e0”,shd:“rgba(0,0,0,0.06)”,chk:”#ccc”,addB:”#ccc”,addC:”#999”,sch:“light”}
};

function roi(i,w){return ROI_MAP[i+”-”+(w>=3?3:w>=2?2:w>=1?1:0)]||”#555”}
function tierN(i,w){return TIER_MAP[i+”-”+(w>=3?3:w>=2?2:w>=1?1:0)]||5}
function wDots(w){const n=w>=3?3:w>=2?2:w>=1?1:0;return w>=1?“●”.repeat(n):“○”}
function score(t){if(t.done)return-999;if(t.type===“wish”)return-500;if(!t.deadline)return t.importance*15+t.weight*5+5;const h=(new Date(t.deadline).getTime()-Date.now())/36e5;if(h<0)return 1000+t.importance*10;const wh=t.weight===3?6:t.weight===2?3:t.weight===1?1:0.2;const br=h/Math.max(wh,0.1);let u;if(br<1)u=100;else if(br<2)u=80;else if(br<5)u=60;else if(br<24)u=30;else u=Math.max(5,20-br*0.1);return u*0.5+t.importance*15+t.weight*5}
function band(t){if(t.done)return 5;if(t.type===“wish”)return 6;const s=score(t);return s>=1000?0:s>=80?1:s>=60?2:s>=40?3:4}
function sLabel(s){return s>=1000?{t:“OVERDUE”,c:”#ff3b30”}:s>=80?{t:“NOW”,c:”#ff3b30”}:s>=60?{t:“SOON”,c:”#ff9500”}:s>=40?{t:“NEXT”,c:”#ffcc00”}:{t:“LATER”,c:”#8e8e93”}}
function fmtDl(d){if(!d)return”期限なし”;const df=new Date(d)-new Date(),m=Math.round(df/6e4);if(m<0)return”overdue”;if(m<60)return m+“m”;const h=Math.floor(m/60),mm=m%60;if(h<24)return mm>0?h+“h “+mm+“m”:h+“h”;const dd=Math.floor(h/24),hh=h%24;if(dd<7)return hh>0?dd+“d “+hh+“h”:dd+“d”;const dl=new Date(d);return(dl.getMonth()+1)+”/”+dl.getDate()}
function defDl(){const d=new Date();d.setDate(d.getDate()+1);d.setHours(18,0,0,0);return d.toISOString().slice(0,16)}
function advRec(dl,r){if(!dl||r===“none”||!r)return dl;const d=new Date(dl);if(r===“daily”)d.setDate(d.getDate()+1);else if(r===“weekly”)d.setDate(d.getDate()+7);else if(r===“monthly”)d.setMonth(d.getMonth()+1);return d.toISOString().slice(0,16)}
function sortProm(task,so){
if(so===“smart”||so===“importance”)return tierN(task.importance,task.weight);
if(so===“light”){const w=task.weight>=3?3:task.weight>=2?2:task.weight>=1?1:0;return[1,2,4,7][w]||5}
if(so===“heavy”){const w=task.weight>=3?3:task.weight>=2?2:task.weight>=1?1:0;return[7,4,2,1][w]||5}
if(so===“deadline”){if(!task.deadline)return 8;const h=(new Date(task.deadline).getTime()-Date.now())/36e5;if(h<0)return 1;if(h<6)return 2;if(h<24)return 3;if(h<72)return 5;return 7}
return 5;
}
function dlFilter(t,f){if(!f)return true;if(!t.deadline)return false;const h=(new Date(t.deadline).getTime()-Date.now())/36e5;if(f===“today”)return h>=0&&h<=24;if(f===“3days”)return h>=0&&h<=72;if(f===“week”)return h>=0&&h<=168;return true}

const SK=“task-queue-v1”,SOK=“task-queue-sort”,DK=“task-queue-defaults”,THK=“task-queue-theme”,TRK=“task-queue-trash”,HRK=“task-queue-habits”,DRK=“task-queue-dayreset”;
const DD={importance:2,weight:2,hasDeadline:true,recurrence:“none”,location:””};
function ld(k,d){try{const r=localStorage.getItem(k);return r?JSON.parse(r):d}catch{return d}}
function sv(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch{}}
const Refresh=()=>(<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:16,height:16}}><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>);

export default function App(){
const[tasks,setTasks]=useState(()=>ld(SK,[]));
const[habits,setHabits]=useState(()=>ld(HRK,[]));
const[trash,setTrash]=useState(()=>ld(TRK,[]));
const[mode,setMode]=useState(“task”);
const[showForm,setShowForm]=useState(false);
const[title,setTitle]=useState(””);const[importance,setImportance]=useState(2);const[weight,setWeight]=useState(2);
const[deadline,setDeadline]=useState(defDl());const[hasDeadline,setHasDeadline]=useState(true);
const[memo,setMemo]=useState(””);const[location,setLocation]=useState(””);const[recurrence,setRecurrence]=useState(“none”);
const[icon,setIcon]=useState(””);
const[filter,setFilter]=useState(“all”);const[locFilter,setLocFilter]=useState(null);const[dlFilt,setDlFilt]=useState(null);
const[editId,setEditId]=useState(null);const[expandedId,setExpandedId]=useState(null);
const[sortOrder,setSortOrder]=useState(()=>localStorage.getItem(SOK)||“smart”);
const[searchQ,setSearchQ]=useState(””);const[showSearch,setShowSearch]=useState(false);
const[showSettings,setShowSettings]=useState(false);
const[undoData,setUndoData]=useState(null);const[defaults,setDefaults]=useState(()=>ld(DK,DD));
const[isDark,setIsDark]=useState(()=>(localStorage.getItem(THK)||“dark”)===“dark”);
const[dayReset,setDayReset]=useState(()=>ld(DRK,5));
const[showSortDD,setShowSortDD]=useState(false);
const[editHabitId,setEditHabitId]=useState(null);
const[checkAnim,setCheckAnim]=useState(null);
const ur=useRef(null);const fr=useRef(null);
const T=isDark?TH.dark:TH.light;

useEffect(()=>{sv(SK,tasks)},[tasks]);
useEffect(()=>{sv(HRK,habits)},[habits]);
useEffect(()=>{sv(TRK,trash)},[trash]);
useEffect(()=>{localStorage.setItem(SOK,sortOrder)},[sortOrder]);
useEffect(()=>{sv(DK,defaults)},[defaults]);
useEffect(()=>{localStorage.setItem(THK,isDark?“dark”:“light”);document.body.style.background=T.bg},[isDark,T.bg]);
useEffect(()=>{sv(DRK,dayReset)},[dayReset]);
useEffect(()=>{const now=Date.now();setTrash(p=>p.filter(t=>(now-t.deletedAt)<30*24*36e5))},[]);
useEffect(()=>{const now=new Date();const lr=ld(“task-queue-lastreset”,0);const rt=new Date();rt.setHours(dayReset,0,0,0);if(now>rt&&lr<rt.getTime()){setHabits(p=>p.map(h=>({…h,doneToday:false})));sv(“task-queue-lastreset”,Date.now())}},[dayReset]);

const quickUpdate=useCallback((id,field,val)=>{setTasks(p=>p.map(t=>t.id===id?{…t,[field]:val}:t))},[]);
const upSub=useCallback((id,s)=>setTasks(p=>p.map(t=>t.id===id?{…t,subtasks:s}:t)),[]);
const locs=useMemo(()=>{const s=new Set();tasks.forEach(t=>{if(t.location)s.add(t.location)});return[…s]},[tasks]);

const resetForm=useCallback(()=>{setTitle(””);setImportance(defaults.importance);setWeight(defaults.weight);setDeadline(defDl());setHasDeadline(defaults.hasDeadline);setMemo(””);setLocation(defaults.location);setRecurrence(defaults.recurrence);setIcon(””);setShowForm(false);setEditId(null)},[defaults]);

const submit=useCallback(()=>{
if(!title.trim())return;
const typ=mode===“wish”?“wish”:“task”;
if(editId){setTasks(p=>p.map(t=>t.id===editId?{…t,title:title.trim(),importance,weight,deadline:hasDeadline?deadline:null,memo:memo.trim(),location:location.trim(),recurrence,icon:icon.trim()}:t))}
else{setTasks(p=>[…p,{id:Date.now().toString(36)+Math.random().toString(36).slice(2,6),title:title.trim(),importance:typ===“wish”?1:importance,weight:typ===“wish”?1:weight,deadline:hasDeadline?deadline:null,memo:memo.trim(),location:location.trim(),recurrence:typ===“wish”?“none”:recurrence,icon:icon.trim(),done:false,createdAt:Date.now(),type:typ}])}
resetForm()
},[title,importance,weight,deadline,hasDeadline,memo,location,recurrence,icon,editId,resetForm,mode]);

const showUndo=useCallback((ts,a)=>{if(ur.current)clearTimeout(ur.current);setUndoData({tasks:ts,action:a});ur.current=setTimeout(()=>setUndoData(null),5000)},[]);
const togDone=useCallback(id=>{
setCheckAnim(id);setTimeout(()=>setCheckAnim(null),600);
setTasks(prev=>{const t=prev.find(x=>x.id===id);if(!t)return prev;if(!t.done&&t.recurrence&&t.recurrence!==“none”&&t.deadline){const nt={…t,id:Date.now().toString(36)+Math.random().toString(36).slice(2,6),deadline:advRec(t.deadline,t.recurrence),done:false,createdAt:Date.now()};return prev.map(x=>x.id===id?{…x,done:true}:x).concat(nt)}return prev.map(x=>x.id===id?{…x,done:!x.done}:x)})
},[]);
const delTask=useCallback(id=>{const t=tasks.find(x=>x.id===id);if(!t)return;setTrash(p=>[…p,{…t,deletedAt:Date.now()}]);showUndo([t],“delete”);setTasks(p=>p.filter(x=>x.id!==id));if(expandedId===id)setExpandedId(null);if(editId===id){resetForm()}},[tasks,expandedId,showUndo,editId,resetForm]);
const restoreTask=useCallback(id=>{const t=trash.find(x=>x.id===id);if(!t)return;const{deletedAt,…task}=t;setTasks(p=>[…p,task]);setTrash(p=>p.filter(x=>x.id!==id))},[trash]);
const undo=useCallback(()=>{if(!undoData)return;if(undoData.action===“delete”){setTasks(p=>[…p,…undoData.tasks]);setTrash(p=>p.filter(t=>!undoData.tasks.find(u=>u.id===t.id)))}setUndoData(null);if(ur.current)clearTimeout(ur.current)},[undoData]);
const startEdit=useCallback(t=>{setTitle(t.title);setImportance(t.importance||2);setWeight(t.weight||2);setDeadline(t.deadline||defDl());setHasDeadline(!!t.deadline);setMemo(t.memo||””);setLocation(t.location||””);setRecurrence(t.recurrence||“none”);setIcon(t.icon||””);setEditId(t.id);setExpandedId(null)},[]);
const doExport=useCallback(()=>{const b=new Blob([JSON.stringify(tasks,null,2)],{type:“application/json”});const u=URL.createObjectURL(b);const a=document.createElement(“a”);a.href=u;a.download=“task-queue-”+new Date().toISOString().slice(0,10)+”.json”;a.click();URL.revokeObjectURL(u)},[tasks]);
const doImportClick=useCallback(()=>fr.current?.click(),[]);
const doImport=useCallback(e=>{const f=e.target.files?.[0];if(!f)return;const r=new FileReader();r.onload=ev=>{try{const imp=JSON.parse(ev.target.result);if(!Array.isArray(imp))throw 0;if(confirm(“OK=上書き / キャンセル=追加”)){setTasks(imp)}else{const ids=new Set(tasks.map(t=>t.id));setTasks(p=>[…p,…imp.filter(t=>!ids.has(t.id))])}}catch{alert(“インポート失敗”)}};r.readAsText(f);e.target.value=””},[tasks]);

const sorted=useMemo(()=>{
let r=tasks.map(t=>({…t,sc:score(t),bd:band(t)}));
if(filter===“active”)r=r.filter(t=>!t.done&&t.deadline&&t.type!==“wish”);
else if(filter===“done”)r=r.filter(t=>t.done);
else if(filter===“noDeadline”)r=r.filter(t=>!t.done&&!t.deadline&&t.type!==“wish”);
else if(mode===“wish”)r=r.filter(t=>t.type===“wish”&&!t.done);
else r=r.filter(t=>!t.done);
if(dlFilt)r=r.filter(t=>dlFilter(t,dlFilt));
if(locFilter!==null)r=r.filter(t=>(t.location||””)===locFilter);
if(searchQ.trim()){const q=searchQ.toLowerCase();r=r.filter(t=>t.title.toLowerCase().includes(q)||(t.memo||””).toLowerCase().includes(q)||(t.location||””).toLowerCase().includes(q))}
if(sortOrder===“smart”)r.sort((a,b)=>{if(a.bd!==b.bd)return a.bd-b.bd;if(a.weight!==b.weight)return a.weight-b.weight;return b.importance-a.importance});
else if(sortOrder===“importance”)r.sort((a,b)=>{if(a.importance!==b.importance)return b.importance-a.importance;return b.weight-a.weight});
else if(sortOrder===“deadline”)r.sort((a,b)=>{if(!a.deadline&&!b.deadline)return 0;if(!a.deadline)return 1;if(!b.deadline)return-1;return new Date(a.deadline)-new Date(b.deadline)});
else if(sortOrder===“heavy”)r.sort((a,b)=>b.weight-a.weight);
else if(sortOrder===“light”)r.sort((a,b)=>a.weight-b.weight);
else if(sortOrder===“created”)r.sort((a,b)=>b.createdAt-a.createdAt);
return r
},[tasks,filter,locFilter,searchQ,sortOrder,mode,dlFilt]);

const topTask=useMemo(()=>{
const a=tasks.filter(t=>!t.done&&t.type!==“wish”).map(t=>({…t,sc:score(t),bd:band(t)}));
a.sort((x,y)=>{if(x.bd!==y.bd)return x.bd-y.bd;if(x.weight!==y.weight)return x.weight-y.weight;return y.importance-x.importance});return a[0]
},[tasks]);

const gcss=”@import url(‘https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700;800&family=Noto+Sans+JP:wght@400;500;700;900&display=swap’);*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}html,body,#root{min-height:100vh}input,select,button,textarea{font-family:‘Noto Sans JP’,sans-serif}@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}@keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}@keyframes slideDown{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}@keyframes checkPop{0%{transform:scale(1)}30%{transform:scale(1.4)}60%{transform:scale(0.9)}100%{transform:scale(1)}}@keyframes checkGlow{0%{box-shadow:0 0 0 0 rgba(74,222,128,0.7)}70%{box-shadow:0 0 0 10px rgba(74,222,128,0)}100%{box-shadow:0 0 0 0 rgba(74,222,128,0)}}.task-card{animation:fadeIn .3s ease both}.overdue-pulse{animation:pulse 1.5s ease infinite}.form-slide{animation:slideUp .3s ease both}.check-anim{animation:checkPop .4s ease,checkGlow .6s ease}”;

const isTask=mode===“task”,isWish=mode===“wish”,isHabit=mode===“habit”;
const habitsSorted=useMemo(()=>[…habits].sort((a,b)=>(a.doneToday?1:0)-(b.doneToday?1:0)),[habits]);

// Inline edit form renderer
const renderEditForm=(task)=>(
<div className=“form-slide” style={{background:T.card,border:“1px solid “+T.brd,borderRadius:10,padding:14,maxWidth:“100%”,overflow:“hidden”}}>
<div style={{display:“flex”,justifyContent:“space-between”,alignItems:“center”,marginBottom:10}}><span style={{fontSize:13,fontWeight:700,color:T.text}}>編集</span><button style={{background:“none”,border:“none”,color:T.mut,fontSize:14,cursor:“pointer”}} onClick={resetForm}>✕</button></div>
<div style={{display:“flex”,gap:6,marginBottom:6}}><input style={{width:42,padding:“8px 4px”,background:T.inp,border:“1px solid “+T.brd,borderRadius:8,color:T.text,fontSize:16,outline:“none”,textAlign:“center”,flexShrink:0}} placeholder=“📌” value={icon} onChange={e=>setIcon(e.target.value)} maxLength={2}/><input style={{flex:1,padding:“8px 10px”,background:T.inp,border:“1px solid “+T.brd,borderRadius:8,color:T.text,fontSize:13,outline:“none”,minWidth:0}} value={title} onChange={e=>setTitle(e.target.value)} autoFocus/></div>
{task.type!==“wish”&&<>
<div style={{marginBottom:8}}><div style={{fontSize:9,fontWeight:700,color:T.mut,letterSpacing:1,marginBottom:5,fontFamily:”‘JetBrains Mono’,monospace”}}>重要度</div><div style={{display:“flex”,gap:5,flexWrap:“wrap”}}>{IMP.map(o=><button key={o.v} style={{padding:“5px 10px”,borderRadius:6,border:“1px solid “+(importance===o.v?o.c:T.brd),fontSize:11,fontWeight:600,cursor:“pointer”,background:importance===o.v?o.c:T.cOff,color:importance===o.v?”#fff”:T.cOffT,display:“flex”,alignItems:“center”,gap:3}} onClick={()=>setImportance(o.v)}><span style={{fontSize:14,fontWeight:900}}>{o.icon}</span>{o.l}</button>)}</div></div>
<div style={{marginBottom:8}}><div style={{fontSize:9,fontWeight:700,color:T.mut,letterSpacing:1,marginBottom:5,fontFamily:”‘JetBrains Mono’,monospace”}}>重さ</div><div style={{display:“flex”,gap:5,flexWrap:“wrap”}}>{WI.map(o=>{const c=roi(importance,o.v);return<button key={o.v} style={{padding:“5px 10px”,borderRadius:6,border:“1px solid “+(weight===o.v?c:T.brd),fontSize:11,fontWeight:600,cursor:“pointer”,background:weight===o.v?c:T.cOff,color:weight===o.v?”#000”:T.cOffT}} onClick={()=>setWeight(o.v)}>{o.l}</button>})}</div></div>
</>}
<div style={{marginBottom:8}}><div style={{display:“flex”,justifyContent:“space-between”,alignItems:“center”,marginBottom:5}}><span style={{fontSize:9,fontWeight:700,color:T.mut,letterSpacing:1,fontFamily:”‘JetBrains Mono’,monospace”}}>締切</span><button style={{padding:“2px 8px”,borderRadius:6,border:“1px solid “+T.brd,fontSize:10,fontWeight:600,cursor:“pointer”,background:hasDeadline?T.cOff:T.cOn,color:hasDeadline?T.cOffT:T.cOnT}} onClick={()=>setHasDeadline(v=>!v)}>{hasDeadline?“なしに変更”:“期限なし”}</button></div>{hasDeadline&&<input type=“datetime-local” style={{width:“100%”,padding:“8px 10px”,background:T.inp,border:“1px solid “+T.brd,borderRadius:8,color:T.text,fontSize:13,outline:“none”,colorScheme:T.sch}} value={deadline} onChange={e=>setDeadline(e.target.value)}/>}</div>
{task.type!==“wish”&&hasDeadline&&<div style={{marginBottom:8}}><div style={{fontSize:9,fontWeight:700,color:T.mut,letterSpacing:1,marginBottom:5,fontFamily:”‘JetBrains Mono’,monospace”}}>繰り返し</div><div style={{display:“flex”,gap:5}}>{REC.map(o=><button key={o.v} style={{padding:“5px 10px”,borderRadius:6,border:“1px solid “+(recurrence===o.v?T.cOn:T.brd),fontSize:11,fontWeight:600,cursor:“pointer”,background:recurrence===o.v?T.cOn:T.cOff,color:recurrence===o.v?T.cOnT:T.cOffT}} onClick={()=>setRecurrence(o.v)}>{o.l}</button>)}</div></div>}
{task.type!==“wish”&&<div style={{marginBottom:8}}><div style={{fontSize:9,fontWeight:700,color:T.mut,letterSpacing:1,marginBottom:5,fontFamily:”‘JetBrains Mono’,monospace”}}>場所</div><input style={{width:“100%”,padding:“8px 10px”,background:T.inp,border:“1px solid “+T.brd,borderRadius:8,color:T.text,fontSize:13,outline:“none”,minWidth:0}} value={location} onChange={e=>setLocation(e.target.value)} list=“pl”/><datalist id="pl">{locs.map(l=><option key={l} value={l}/>)}</datalist>{locs.length>0&&<div style={{display:“flex”,gap:5,flexWrap:“wrap”,marginTop:4}}>{locs.map(l=><button key={l} style={{padding:“3px 8px”,fontSize:10,borderRadius:6,border:“1px solid “+(location===l?T.cOn:T.brd),background:location===l?T.cOn:T.cOff,color:location===l?T.cOnT:T.cOffT,cursor:“pointer”}} onClick={()=>setLocation(l)}>{l}</button>)}</div>}</div>}
<div style={{marginBottom:8}}><div style={{fontSize:9,fontWeight:700,color:T.mut,letterSpacing:1,marginBottom:5,fontFamily:”‘JetBrains Mono’,monospace”}}>メモ</div><textarea style={{width:“100%”,padding:“8px 10px”,background:T.inp,border:“1px solid “+T.brd,borderRadius:8,color:T.text,fontSize:13,outline:“none”,minHeight:50,resize:“vertical”,fontFamily:“inherit”}} value={memo} onChange={e=>setMemo(e.target.value)}/></div>
<button style={{width:“100%”,padding:11,background:”#ff3b30”,border:“none”,borderRadius:8,color:”#fff”,fontSize:13,fontWeight:700,cursor:“pointer”}} onClick={submit}>更新する</button>
</div>
);

return(<div style={{minHeight:“100vh”,background:T.bg,color:T.text,fontFamily:”‘Noto Sans JP’,sans-serif”,padding:“calc(16px + env(safe-area-inset-top)) 14px calc(80px + env(safe-area-inset-bottom))”,maxWidth:600,margin:“0 auto”}}><style>{gcss+“html,body,#root{background:”+T.bg+”}”}</style>

```
{/* Header */}
<div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16}}>
  <div><h1 style={{fontFamily:"'JetBrains Mono',monospace",fontSize:20,fontWeight:800,letterSpacing:2,color:T.text,margin:0}}><span style={{color:"#ff3b30"}}>▌</span>TASK QUEUE</h1>
  <p style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:T.mut,marginTop:3}}>{tasks.filter(t=>!t.done&&t.type!=="wish").length} active<span style={{opacity:.3,margin:"0 4px"}}>|</span>{tasks.filter(t=>t.done).length} done<span style={{opacity:.3,margin:"0 4px"}}>|</span>{tasks.filter(t=>t.type==="wish"&&!t.done).length} wish<span style={{opacity:.3,margin:"0 4px"}}>|</span>{habits.length} daily</p></div>
  <div style={{display:"flex",gap:5}}>
    <button style={{width:36,height:36,borderRadius:8,border:"1px solid "+T.iBrd,background:T.iBg,color:T.iC,fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}} onClick={()=>window.location.reload()}><Refresh/></button>
    <button style={{width:36,height:36,borderRadius:8,border:"1px solid "+T.iBrd,background:T.iBg,color:T.iC,fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}} onClick={()=>setIsDark(v=>!v)}>{isDark?"☀️":"🌙"}</button>
    <button style={{width:36,height:36,borderRadius:8,border:"1px solid "+T.iBrd,background:T.iBg,color:T.iC,fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}} onClick={()=>setShowSettings(true)}>⚙</button>
  </div>
</div>

{/* Mode */}
<div style={{display:"flex",gap:4,marginBottom:8}}>
  {[{k:"task",l:"タスク"},{k:"wish",l:"やりたい"},{k:"habit",l:"日課"}].map(m=>(<button key={m.k} style={{flex:1,padding:"9px 0",borderRadius:10,fontSize:13,fontWeight:700,textAlign:"center",letterSpacing:1,border:mode===m.k?"none":"1px solid "+T.brd,background:mode===m.k?T.cOn:"transparent",color:mode===m.k?T.cOnT:T.fOffT,cursor:"pointer"}} onClick={()=>{setMode(m.k);setFilter("all");setShowForm(false);setExpandedId(null);setEditId(null);setDlFilt(null)}}>{m.l}</button>))}
</div>

{/* Top banner - no focus mode, just info */}
{isTask&&topTask&&!showForm&&!editId&&!searchQ&&locFilter===null&&(
  <div style={{background:T.card,border:"1px solid "+sLabel(score(topTask)).c,borderRadius:14,padding:"12px 16px",marginBottom:12}}>
    <div style={{fontSize:10,fontWeight:700,marginBottom:4,letterSpacing:1}}><span style={{color:sLabel(score(topTask)).c,fontFamily:"JetBrains Mono"}}>● 今やるべきタスク</span></div>
    <div style={{fontSize:16,fontWeight:700,color:T.text,marginBottom:4}}>{topTask.icon?topTask.icon+" ":""}{topTask.title}</div>
    <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:T.sub,display:"flex",gap:8}}><span>{fmtDl(topTask.deadline)}</span><span style={{opacity:.3}}>|</span><span>スコア {Math.round(score(topTask))}</span></div>
  </div>
)}

{/* Filter + Sort */}
{!isHabit&&<>
  <div style={{display:"flex",gap:4,marginBottom:6,flexWrap:"wrap"}}>
    {(isTask?[{k:"all",l:"すべて"},{k:"noDeadline",l:"期限なし"},{k:"active",l:"アクティブ"},{k:"done",l:"完了"}]:[{k:"all",l:"すべて"},{k:"done",l:"完了"}]).map(f=>(<button key={f.k} style={{padding:"4px 9px",borderRadius:6,border:"1px solid "+T.fBrd,fontSize:11,fontWeight:600,whiteSpace:"nowrap",background:filter===f.k&&locFilter===null?T.cOn:"transparent",color:filter===f.k&&locFilter===null?T.cOnT:T.fOffT,cursor:"pointer"}} onClick={()=>{setFilter(f.k);setLocFilter(null);setDlFilt(null)}}>{f.l}</button>))}
    {isTask&&[{k:"today",l:"今日中"},{k:"3days",l:"3日以内"},{k:"week",l:"今週中"}].map(f=>(<button key={f.k} style={{padding:"4px 9px",borderRadius:6,border:"1px dashed "+(dlFilt===f.k?"#ff3b30":T.fBrd),fontSize:10,fontWeight:600,whiteSpace:"nowrap",background:dlFilt===f.k?"rgba(255,59,48,0.1)":"transparent",color:dlFilt===f.k?"#ff3b30":T.fOffT,cursor:"pointer"}} onClick={()=>setDlFilt(dlFilt===f.k?null:f.k)}>{f.l}</button>))}
  </div>
  <div style={{display:"flex",gap:6,marginBottom:10,alignItems:"center",flexWrap:"wrap",position:"relative"}}>
    <button style={{display:"flex",alignItems:"center",gap:4,padding:"4px 10px",borderRadius:8,border:"1px solid "+T.fBrd,background:T.inp,fontSize:11,color:T.mut,cursor:"pointer"}} onClick={()=>setShowSearch(v=>!v)}>🔍</button>
    <button style={{display:"flex",alignItems:"center",gap:3,padding:"4px 10px",borderRadius:8,border:"1px solid "+T.fBrd,background:T.inp,fontSize:11,fontWeight:600,color:T.sub,fontFamily:"'JetBrains Mono',monospace",cursor:"pointer"}} onClick={()=>setShowSortDD(v=>!v)}>▼ {SORTS.find(s=>s.v===sortOrder)?.l}</button>
    {showSortDD&&<div style={{position:"absolute",top:32,left:40,background:T.card,border:"1px solid "+T.brd,borderRadius:10,padding:6,zIndex:50,boxShadow:"0 4px 12px "+T.shd}}>{SORTS.map(s=><button key={s.v} style={{display:"block",width:"100%",textAlign:"left",padding:"8px 12px",borderRadius:6,border:"none",background:sortOrder===s.v?T.cOn:"transparent",color:sortOrder===s.v?T.cOnT:T.sub,fontSize:12,fontWeight:600,cursor:"pointer",marginBottom:2,whiteSpace:"nowrap"}} onClick={()=>{setSortOrder(s.v);setShowSortDD(false)}}>{s.l}</button>)}</div>}
    {locs.length>0&&isTask&&<><span style={{fontSize:12,color:T.mut}}>📍</span>{locs.map(l=><button key={l} style={{padding:"3px 10px",borderRadius:14,fontSize:10,fontWeight:600,color:locFilter===l?T.cOnT:T.mut,background:locFilter===l?T.cOn:T.inp,border:"1px solid "+T.brd,cursor:"pointer"}} onClick={()=>setLocFilter(locFilter===l?null:l)}>{l}</button>)}</>}
  </div>
  {showSearch&&<input className="form-slide" style={{width:"100%",padding:"10px 12px",background:T.inp,border:"1px solid "+T.brd,borderRadius:9,color:T.text,fontSize:14,outline:"none",marginBottom:8}} placeholder="検索..." value={searchQ} onChange={e=>setSearchQ(e.target.value)} autoFocus/>}
</>}

{/* Add button */}
{!showForm&&!editId&&!isHabit&&<button style={{width:"100%",padding:13,border:"1.5px dashed "+T.addB,borderRadius:10,color:T.addC,fontSize:13,fontWeight:700,cursor:"pointer",marginBottom:10,display:"flex",alignItems:"center",justifyContent:"center",gap:6,letterSpacing:1,fontFamily:"'JetBrains Mono',monospace",background:"transparent"}} onClick={()=>{resetForm();setShowForm(true)}}>+ {isWish?"やりたいことを追加":"新しいタスク"}</button>}

{/* New task form (top, only for new) */}
{showForm&&!editId&&<div className="form-slide" style={{background:T.card,border:"1px solid "+T.brd,borderRadius:14,padding:16,marginBottom:12,maxWidth:"100%",overflow:"hidden"}}>
  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}><span style={{fontSize:14,fontWeight:700,color:T.text}}>{isWish?"やりたいこと":"新しいタスク"}</span><button style={{background:"none",border:"none",color:T.mut,fontSize:16,cursor:"pointer"}} onClick={resetForm}>✕</button></div>
  <div style={{display:"flex",gap:6,marginBottom:6}}><input style={{width:42,padding:"9px 4px",background:T.inp,border:"1px solid "+T.brd,borderRadius:8,color:T.text,fontSize:16,outline:"none",textAlign:"center",flexShrink:0}} placeholder="📌" value={icon} onChange={e=>setIcon(e.target.value)} maxLength={2}/><input style={{flex:1,padding:"9px 12px",background:T.inp,border:"1px solid "+T.brd,borderRadius:8,color:T.text,fontSize:14,outline:"none",minWidth:0}} placeholder={isWish?"やりたいこと...":"タスク名..."} value={title} onChange={e=>setTitle(e.target.value)} autoFocus onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&submit()}/></div>
  {!isWish&&<>
    <div style={{marginBottom:10}}><div style={{fontSize:9,fontWeight:700,color:T.mut,letterSpacing:1,marginBottom:6,fontFamily:"'JetBrains Mono',monospace"}}>重要度</div><div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{IMP.map(o=><button key={o.v} style={{padding:"6px 12px",borderRadius:7,border:"1px solid "+(importance===o.v?o.c:T.brd),fontSize:12,fontWeight:600,cursor:"pointer",background:importance===o.v?o.c:T.cOff,color:importance===o.v?"#fff":T.cOffT,display:"flex",alignItems:"center",gap:4}} onClick={()=>setImportance(o.v)}><span style={{fontSize:14,fontWeight:900}}>{o.icon}</span>{o.l}</button>)}</div></div>
    <div style={{marginBottom:10}}><div style={{fontSize:9,fontWeight:700,color:T.mut,letterSpacing:1,marginBottom:6,fontFamily:"'JetBrains Mono',monospace"}}>重さ</div><div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{WI.map(o=>{const c=roi(importance,o.v);return<button key={o.v} style={{padding:"6px 10px",borderRadius:7,border:"1px solid "+(weight===o.v?c:T.brd),fontSize:11,fontWeight:600,cursor:"pointer",background:weight===o.v?c:T.cOff,color:weight===o.v?"#000":T.cOffT}} onClick={()=>setWeight(o.v)}>{o.l}</button>})}</div></div>
  </>}
  <div style={{marginBottom:10}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}><span style={{fontSize:9,fontWeight:700,color:T.mut,letterSpacing:1,fontFamily:"'JetBrains Mono',monospace"}}>締切</span><button style={{padding:"3px 10px",borderRadius:7,border:"1px solid "+T.brd,fontSize:10,fontWeight:600,cursor:"pointer",background:hasDeadline?T.cOff:T.cOn,color:hasDeadline?T.cOffT:T.cOnT}} onClick={()=>setHasDeadline(v=>!v)}>{hasDeadline?"なしに変更":"期限なし"}</button></div>{hasDeadline&&<input type="datetime-local" style={{width:"100%",padding:"9px 12px",background:T.inp,border:"1px solid "+T.brd,borderRadius:8,color:T.text,fontSize:13,outline:"none",colorScheme:T.sch}} value={deadline} onChange={e=>setDeadline(e.target.value)}/>}</div>
  {!isWish&&hasDeadline&&<div style={{marginBottom:10}}><div style={{fontSize:9,fontWeight:700,color:T.mut,letterSpacing:1,marginBottom:6,fontFamily:"'JetBrains Mono',monospace"}}>繰り返し</div><div style={{display:"flex",gap:6}}>{REC.map(o=><button key={o.v} style={{padding:"6px 12px",borderRadius:7,border:"1px solid "+(recurrence===o.v?T.cOn:T.brd),fontSize:11,fontWeight:600,cursor:"pointer",background:recurrence===o.v?T.cOn:T.cOff,color:recurrence===o.v?T.cOnT:T.cOffT}} onClick={()=>setRecurrence(o.v)}>{o.l}</button>)}</div></div>}
  {!isWish&&<div style={{marginBottom:10}}><div style={{fontSize:9,fontWeight:700,color:T.mut,letterSpacing:1,marginBottom:6,fontFamily:"'JetBrains Mono',monospace"}}>場所</div><input style={{width:"100%",padding:"9px 12px",background:T.inp,border:"1px solid "+T.brd,borderRadius:8,color:T.text,fontSize:13,outline:"none",minWidth:0}} placeholder="例: 自宅" value={location} onChange={e=>setLocation(e.target.value)} list="pl"/><datalist id="pl">{locs.map(l=><option key={l} value={l}/>)}</datalist>{locs.length>0&&<div style={{display:"flex",gap:5,flexWrap:"wrap",marginTop:4}}>{locs.map(l=><button key={l} style={{padding:"3px 9px",fontSize:10,borderRadius:6,border:"1px solid "+(location===l?T.cOn:T.brd),background:location===l?T.cOn:T.cOff,color:location===l?T.cOnT:T.cOffT,cursor:"pointer"}} onClick={()=>setLocation(l)}>{l}</button>)}</div>}</div>}
  <div style={{marginBottom:10}}><div style={{fontSize:9,fontWeight:700,color:T.mut,letterSpacing:1,marginBottom:6,fontFamily:"'JetBrains Mono',monospace"}}>メモ</div><textarea style={{width:"100%",padding:"9px 12px",background:T.inp,border:"1px solid "+T.brd,borderRadius:8,color:T.text,fontSize:13,outline:"none",minHeight:50,resize:"vertical",fontFamily:"inherit"}} placeholder="メモ..." value={memo} onChange={e=>setMemo(e.target.value)}/></div>
  <button style={{width:"100%",padding:12,background:"#ff3b30",border:"none",borderRadius:9,color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer"}} onClick={submit}>追加する</button>
</div>}

{/* HABIT MODE */}
{isHabit&&<>
  <div style={{display:"flex",gap:6,marginBottom:10}}>
    <input style={{width:40,padding:"8px 4px",background:T.inp,border:"1px solid "+T.brd,borderRadius:8,color:T.text,fontSize:15,outline:"none",textAlign:"center",flexShrink:0}} placeholder="📌" value={editHabitId?habits.find(h=>h.id===editHabitId)?.icon||"":""} onChange={e=>{if(editHabitId)setHabits(p=>p.map(h=>h.id===editHabitId?{...h,icon:e.target.value}:h))}} maxLength={2}/>
    <input style={{flex:1,padding:"8px 10px",background:T.inp,border:"1px solid "+T.brd,borderRadius:8,color:T.text,fontSize:13,outline:"none",minWidth:0}} placeholder="日課を追加..." onFocus={()=>setEditHabitId(null)} onKeyDown={e=>{if(e.key==="Enter"&&e.target.value.trim()){setHabits(p=>[...p,{id:Date.now().toString(36)+Math.random().toString(36).slice(2,4),title:e.target.value.trim(),memo:"",icon:"",doneToday:false}]);e.target.value=""}}}/>
  </div>
  {habitsSorted.map(h=>(
    <div key={h.id} style={{background:T.card,border:"1px solid "+(editHabitId===h.id?"#ff3b30":T.brd),borderRadius:10,padding:"10px 12px",marginBottom:6,display:"flex",alignItems:"center",gap:8,opacity:h.doneToday?.4:1}}>
      <button className={h.doneToday?"":"check-anim"} style={{width:20,height:20,borderRadius:5,border:"2px solid "+(h.doneToday?"#4ade80":T.chk),background:h.doneToday?"#4ade80":"transparent",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0,color:"#000",fontSize:10,fontWeight:700}} onClick={()=>setHabits(p=>p.map(x=>x.id===h.id?{...x,doneToday:!x.doneToday}:x))}>{h.doneToday&&"✓"}</button>
      {editHabitId===h.id?<>
        <input style={{width:32,padding:"4px 2px",background:T.inp,border:"1px solid "+T.brd,borderRadius:5,color:T.text,fontSize:14,outline:"none",textAlign:"center",flexShrink:0}} value={h.icon} onChange={e=>setHabits(p=>p.map(x=>x.id===h.id?{...x,icon:e.target.value}:x))} maxLength={2}/>
        <input style={{flex:1,padding:"4px 8px",background:T.inp,border:"1px solid "+T.brd,borderRadius:5,color:T.text,fontSize:12,outline:"none",minWidth:0}} value={h.title} onChange={e=>setHabits(p=>p.map(x=>x.id===h.id?{...x,title:e.target.value}:x))}/>
        <button style={{background:"none",border:"none",color:"#4ade80",fontSize:11,fontWeight:700,cursor:"pointer",padding:4}} onClick={()=>setEditHabitId(null)}>✓</button>
      </>:<>
        <div style={{fontSize:18,flexShrink:0,width:24,textAlign:"center",cursor:"pointer"}} onClick={()=>setEditHabitId(h.id)}>{h.icon||"📌"}</div>
        <div style={{flex:1,cursor:"pointer"}} onClick={()=>setEditHabitId(h.id)}><div style={{fontSize:13,fontWeight:500,color:T.text,textDecoration:h.doneToday?"line-through":"none"}}>{h.title}</div>{h.memo&&<div style={{fontSize:10,color:T.mut,marginTop:2,fontFamily:"'JetBrains Mono',monospace"}}>{h.memo}</div>}</div>
        <button style={{background:"none",border:"none",color:T.dim,fontSize:11,cursor:"pointer",padding:4}} onClick={()=>setHabits(p=>p.filter(x=>x.id!==h.id))}>✕</button>
      </>}
    </div>
  ))}
  {habits.length===0&&<div style={{textAlign:"center",padding:36,color:T.dim,fontSize:13,fontFamily:"'JetBrains Mono',monospace"}}>日課を追加しましょう</div>}
</>}

{/* TASK/WISH LIST */}
{!isHabit&&<div style={{display:"flex",flexDirection:"column",gap:8}}>
  {sorted.length===0&&<div style={{textAlign:"center",padding:36,color:T.dim,fontSize:13,fontFamily:"'JetBrains Mono',monospace"}}>{searchQ?"検索結果なし":filter==="done"?"完了タスクなし":"タスクを追加しましょう"}</div>}
  {sorted.map(task=>editId===task.id?<div key={task.id}>{renderEditForm(task)}</div>:<TaskCard key={task.id} task={task} T={T} isDark={isDark} sortOrder={sortOrder} expanded={expandedId===task.id} checkAnim={checkAnim===task.id} onToggleExpand={()=>setExpandedId(expandedId===task.id?null:task.id)} onToggleDone={()=>togDone(task.id)} onEdit={()=>startEdit(task)} onDelete={()=>delTask(task.id)} onUpdateSubtasks={s=>upSub(task.id,s)} onQuickUpdate={(f,v)=>quickUpdate(task.id,f,v)} locs={locs}/>)}
</div>}

{/* Settings */}
{showSettings&&<div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:T.modal,zIndex:100,display:"flex",alignItems:"flex-start",justifyContent:"center",padding:"60px 16px 20px",overflowY:"auto"}} onClick={()=>setShowSettings(false)}><div style={{background:T.card,border:"1px solid "+T.brd,borderRadius:16,padding:20,width:"100%",maxWidth:500}} onClick={e=>e.stopPropagation()}>
  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}><span style={{fontSize:15,fontWeight:700,color:T.text}}>設定</span><button style={{background:"none",border:"none",color:T.mut,fontSize:16,cursor:"pointer"}} onClick={()=>setShowSettings(false)}>✕</button></div>
  <div style={{marginBottom:14}}><div style={{fontSize:10,fontWeight:700,color:T.mut,letterSpacing:1,marginBottom:7,fontFamily:"'JetBrains Mono',monospace"}}>日付変更時刻</div><input type="number" min="0" max="23" style={{width:60,padding:"8px 10px",background:T.inp,border:"1px solid "+T.brd,borderRadius:8,color:T.text,fontSize:14,outline:"none"}} value={dayReset} onChange={e=>setDayReset(parseInt(e.target.value)||0)}/><span style={{fontSize:11,color:T.mut,marginLeft:6}}>時</span></div>
  <div style={{marginBottom:14}}><div style={{fontSize:10,fontWeight:700,color:T.mut,letterSpacing:1,marginBottom:7,fontFamily:"'JetBrains Mono',monospace"}}>データ</div><div style={{display:"flex",gap:8}}><button style={{flex:1,padding:10,borderRadius:9,border:"1px solid "+T.brd,background:T.cOff,color:T.text,fontSize:12,fontWeight:700,cursor:"pointer"}} onClick={doExport}>エクスポート</button><button style={{flex:1,padding:10,borderRadius:9,border:"1px solid "+T.brd,background:T.cOff,color:T.text,fontSize:12,fontWeight:700,cursor:"pointer"}} onClick={doImportClick}>インポート</button><input ref={fr} type="file" accept="application/json" style={{display:"none"}} onChange={doImport}/></div></div>
  <div style={{borderTop:"1px solid "+T.brd,paddingTop:14}}><div style={{fontSize:10,fontWeight:700,color:T.mut,letterSpacing:1,marginBottom:7,fontFamily:"'JetBrains Mono',monospace"}}>ゴミ箱（{trash.length}件）</div>
    {trash.map(t=><div key={t.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 0",borderBottom:"1px solid "+(isDark?"#1a1a1a":T.brd)}}><span style={{fontSize:12,color:T.sub}}>{t.icon?t.icon+" ":""}{t.title}</span><button style={{padding:"3px 8px",borderRadius:6,border:"1px solid rgba(34,197,94,0.3)",background:"transparent",color:"#4ade80",fontSize:10,fontWeight:600,cursor:"pointer"}} onClick={()=>restoreTask(t.id)}>復元</button></div>)}
    {trash.length>0&&<button style={{marginTop:8,padding:"6px 12px",borderRadius:8,border:"1px solid rgba(255,59,48,0.3)",background:"transparent",color:"#ff3b30",fontSize:11,fontWeight:600,cursor:"pointer"}} onClick={()=>{if(confirm("ゴミ箱を空にしますか？"))setTrash([])}}>ゴミ箱を空にする</button>}
  </div>
</div></div>}

{undoData&&<div className="form-slide" style={{position:"fixed",bottom:"calc(24px + env(safe-area-inset-bottom))",left:16,right:16,maxWidth:360,margin:"0 auto",background:T.toast,border:"1px solid "+T.brd,borderRadius:10,padding:"12px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",fontSize:13,color:T.sub,zIndex:200}}><span>削除しました</span><button style={{background:"none",border:"none",color:"#ff3b30",fontWeight:700,cursor:"pointer",fontSize:13}} onClick={undo}>元に戻す</button></div>}
<div style={{position:"fixed",bottom:6,right:10,fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:T.dim,userSelect:"none",pointerEvents:"none"}}>v{VER}</div>
```

  </div>)
}

function TaskCard({task,T,isDark,sortOrder,expanded,checkAnim,onToggleExpand,onToggleDone,onEdit,onDelete,onUpdateSubtasks,onQuickUpdate,locs}){
const isW=task.type===“wish”;
const lb=isW?{t:“WISH”,c:”#c084fc”}:sLabel(task.sc);
const isOD=task.sc>=1000;
const rc=isW?”#c084fc”:roi(task.importance,task.weight);
const pr=isW?5:sortProm(task,sortOrder);
const ts=isDark?TIER[pr]:{…TIER[pr],…TIER_LIGHT[pr]};
const wi=WI.find(w=>w.v===task.weight);
const im=IMP.find(x=>x.v===task.importance);
const[ns,setNs]=useState(””);
const[showSubInput,setShowSubInput]=useState(false);
const subs=task.subtasks||[];const sd=subs.filter(s=>s.done).length;const hs=subs.length>0;
const addS=()=>{if(!ns.trim())return;onUpdateSubtasks([…subs,{id:Date.now().toString(36)+Math.random().toString(36).slice(2,4),title:ns.trim(),done:false}]);setNs(””)};
const tsx=useRef(0),tsy=useRef(0);const[so,setSo]=useState(0);const[sw,setSw]=useState(false);
const tts=e=>{tsx.current=e.touches[0].clientX;tsy.current=e.touches[0].clientY};
const ttm=e=>{const dx=e.touches[0].clientX-tsx.current;if(Math.abs(dx)>10&&Math.abs(e.touches[0].clientY-tsy.current)<30){setSw(true);setSo(dx)}};
const tte=()=>{if(so>100)onToggleDone();else if(so<-100)onDelete();setSo(0);setTimeout(()=>setSw(false),100)};

return(<div style={{position:“relative”,overflow:“hidden”,borderRadius:10}}>
{so>20&&<div style={{position:“absolute”,top:0,left:0,right:0,bottom:0,display:“flex”,alignItems:“center”,borderRadius:10,background:“rgba(74,222,128,0.2)”,justifyContent:“flex-start”,paddingLeft:20,fontSize:14}}><span style={{color:”#4ade80”,fontWeight:700}}>✓ 完了</span></div>}
{so<-20&&<div style={{position:“absolute”,top:0,left:0,right:0,bottom:0,display:“flex”,alignItems:“center”,borderRadius:10,background:“rgba(255,59,48,0.2)”,justifyContent:“flex-end”,paddingRight:20,fontSize:14}}><span style={{color:”#ff3b30”,fontWeight:700}}>削除 ✕</span></div>}
<div className=“task-card” style={{background:isW?T.card:ts.bg,borderRadius:10,padding:ts.pad+“px 14px “+ts.pad+“px “+(ts.pad+8)+“px”,transition:sw?“none”:“all .2s”,cursor:“pointer”,position:“relative”,display:“flex”,width:“100%”,opacity:task.done?.4:1,flexDirection:expanded?“column”:“row”,alignItems:expanded?“stretch”:“center”,transform:“translateX(”+so+“px)”,border:“1px solid “+(isW?“rgba(192,132,252,0.2)”:ts.border),boxShadow:ts.shadow!==“none”?“0 0 10px “+ts.shadow:””}} onClick={e=>{if(sw)return;if(e.target.closest(”.ne”))return;onToggleExpand()}} onTouchStart={tts} onTouchMove={ttm} onTouchEnd={tte}>
{!isW&&<div style={{position:“absolute”,left:0,top:“50%”,transform:“translateY(-50%)”,width:wi?.bw||4,height:(wi?.bh||75)+”%”,background:rc,borderRadius:“0 3px 3px 0”}}/>}
{isW&&<div style={{position:“absolute”,left:0,top:“50%”,transform:“translateY(-50%)”,width:3,height:“60%”,background:”#c084fc”,borderRadius:“0 3px 3px 0”}}/>}
<div style={{display:“flex”,alignItems:“center”,justifyContent:“space-between”,width:“100%”}}>
<div style={{display:“flex”,alignItems:“center”,gap:8,flex:1,minWidth:0}}>
<button className={“ne”+(checkAnim?” check-anim”:””)} style={{width:20,height:20,borderRadius:5,border:“2px solid “+(task.done?”#ff3b30”:T.chk),background:task.done?”#ff3b30”:“transparent”,display:“flex”,alignItems:“center”,justifyContent:“center”,cursor:“pointer”,flexShrink:0,color:”#fff”,fontSize:10,fontWeight:700}} onClick={e=>{e.stopPropagation();onToggleDone()}}>{task.done&&“✓”}</button>
{(task.icon||isW)&&<div style={{fontSize:Math.max(14,20-pr),flexShrink:0,width:Math.max(18,26-pr),textAlign:“center”}}>{task.icon||(isW?“⭐”:””)}</div>}
<div style={{flex:1,minWidth:0}}>
<div style={{fontSize:ts.fs,fontWeight:ts.fw,color:ts.tc,whiteSpace:“nowrap”,overflow:“hidden”,textOverflow:“ellipsis”,textDecoration:task.done?“line-through”:“none”}}>{task.title}</div>
{!isW&&<div style={{fontSize:ts.mfs,color:ts.mc,marginTop:3,display:“flex”,gap:5,fontFamily:”‘JetBrains Mono’,monospace”,flexWrap:“wrap”,alignItems:“center”}}>
<span style={{color:im?.c,fontSize:ts.mfs+4,fontWeight:900,lineHeight:1}}>{im?.icon}</span>
<span style={{opacity:.3}}>·</span>
<span style={{color:rc,fontSize:ts.mfs+2,letterSpacing:2,lineHeight:1}}>{wDots(task.weight)}</span>
<span style={{opacity:.3}}>·</span>
<span style={{color:isOD?”#ff3b30”:ts.mc}}>{fmtDl(task.deadline)}</span>
{task.location&&<><span style={{opacity:.3}}>·</span><span>📍{task.location}</span></>}
{task.recurrence&&task.recurrence!==“none”&&<><span style={{opacity:.3}}>·</span><span>🔁</span></>}
{hs&&<><span style={{opacity:.3}}>·</span><span style={{color:sd===subs.length?”#4ade80”:ts.mc}}>{sd}/{subs.length}</span></>}
</div>}
{isW&&task.memo&&<div style={{fontSize:10,color:T.mut,marginTop:2,fontFamily:”‘JetBrains Mono’,monospace”}}>{task.memo.slice(0,40)}{task.memo.length>40?”…”:””}</div>}
</div>
</div>
<div style={{flexShrink:0,marginLeft:8}}>{!task.done&&<span className={isOD?“overdue-pulse”:””} style={{fontFamily:”‘JetBrains Mono’,monospace”,fontSize:ts.bfs,fontWeight:700,letterSpacing:1,padding:ts.bp,borderRadius:5,border:“1px solid”,background:isW?“rgba(192,132,252,0.13)”:lb.c+“22”,color:isW?”#c084fc”:lb.c,borderColor:isW?“rgba(192,132,252,0.27)”:lb.c+“44”}}>{lb.t}</span>}</div>
</div>
{expanded&&<div style={{marginTop:12,paddingTop:12,borderTop:“1px solid “+T.brd,width:“100%”,animation:“slideDown .25s ease”}}>
<div style={{display:“flex”,justifyContent:“flex-end”,gap:6,marginBottom:8}}>
<button className=“ne” style={{padding:“4px 10px”,borderRadius:6,border:“1px solid “+T.brd,background:“transparent”,color:T.mut,fontSize:10,fontWeight:600,cursor:“pointer”}} onClick={e=>{e.stopPropagation();onEdit()}}>✏️ 編集</button>
<button className=“ne” style={{padding:“4px 10px”,borderRadius:6,border:“1px solid rgba(255,59,48,0.3)”,background:“transparent”,color:”#ff3b30”,fontSize:10,fontWeight:600,cursor:“pointer”}} onClick={e=>{e.stopPropagation();onDelete()}}>🗑</button>
</div>
{!isW&&<div className=“ne” style={{display:“flex”,gap:5,marginBottom:8,flexWrap:“wrap”}}>
{IMP.map(o=><button key={o.v} style={{padding:“3px 7px”,borderRadius:5,border:“1px solid “+(task.importance===o.v?o.c:T.brd),fontSize:10,fontWeight:600,cursor:“pointer”,background:task.importance===o.v?o.c:T.cOff,color:task.importance===o.v?”#fff”:T.cOffT}} onClick={e=>{e.stopPropagation();onQuickUpdate(“importance”,o.v)}}>{o.icon}{o.l}</button>)}
<span style={{opacity:.2}}>|</span>
{WI.map(o=>{const c=roi(task.importance,o.v);return<button key={o.v} style={{padding:“3px 7px”,borderRadius:5,border:“1px solid “+(task.weight===o.v?c:T.brd),fontSize:10,fontWeight:600,cursor:“pointer”,background:task.weight===o.v?c:T.cOff,color:task.weight===o.v?”#000”:T.cOffT}} onClick={e=>{e.stopPropagation();onQuickUpdate(“weight”,o.v)}}>{o.l}</button>})}
</div>}
{task.deadline&&<div style={{display:“flex”,justifyContent:“space-between”,padding:“4px 0”,fontSize:12}}><span style={{color:T.mut,fontFamily:”‘JetBrains Mono’,monospace”,fontSize:10}}>締切</span><span style={{color:T.text}}>{new Date(task.deadline).toLocaleString()}</span></div>}
{task.recurrence&&task.recurrence!==“none”&&<div style={{display:“flex”,justifyContent:“space-between”,padding:“4px 0”,fontSize:12}}><span style={{color:T.mut,fontFamily:”‘JetBrains Mono’,monospace”,fontSize:10}}>繰り返し</span><span style={{color:T.text}}>{REC.find(r=>r.v===task.recurrence)?.l}</span></div>}
{task.memo&&<div style={{marginTop:8,padding:8,background:T.memo,border:“1px solid “+T.memB,borderRadius:6,fontSize:11,color:T.sub,lineHeight:1.6,whiteSpace:“pre-wrap”}}>{task.memo}</div>}
<div style={{marginTop:10}}>
{hs&&<div style={{display:“flex”,justifyContent:“space-between”,alignItems:“center”,marginBottom:4}}><span style={{color:T.mut,fontFamily:”‘JetBrains Mono’,monospace”,fontSize:9,letterSpacing:1}}>サブタスク</span><span style={{fontSize:10,color:sd===subs.length?”#4ade80”:T.sub,fontFamily:”‘JetBrains Mono’,monospace”}}>{sd}/{subs.length}</span></div>}
{subs.map(sub=><div key={sub.id} className=“ne” style={{display:“flex”,alignItems:“center”,gap:6,padding:“5px 0”,borderBottom:“1px solid “+(isDark?”#1a1a1a”:T.brd)}}><button style={{width:14,height:14,borderRadius:3,border:“2px solid “+(sub.done?”#4ade80”:T.chk),background:sub.done?”#4ade80”:“transparent”,display:“flex”,alignItems:“center”,justifyContent:“center”,cursor:“pointer”,flexShrink:0}} onClick={e=>{e.stopPropagation();onUpdateSubtasks(subs.map(s=>s.id===sub.id?{…s,done:!s.done}:s))}}>{sub.done&&<span style={{fontSize:7,color:”#000”}}>✓</span>}</button><span style={{fontSize:11,color:T.sub,flex:1,textDecoration:sub.done?“line-through”:“none”,opacity:sub.done?.5:1}}>{sub.title}</span><button style={{background:“none”,border:“none”,color:T.dim,fontSize:10,cursor:“pointer”,padding:2}} onClick={e=>{e.stopPropagation();onUpdateSubtasks(subs.filter(s=>s.id!==sub.id))}}>✕</button></div>)}
{(showSubInput||hs)?<div className=“ne” style={{display:“flex”,gap:6,marginTop:4}}><input style={{flex:1,padding:“6px 8px”,background:T.memo,border:“1px solid “+T.brd,borderRadius:5,color:T.text,fontSize:10,outline:“none”,minWidth:0}} placeholder=“サブタスク追加…” value={ns} onChange={e=>setNs(e.target.value)} onKeyDown={e=>{if(e.key===“Enter”){e.stopPropagation();addS()}}} onClick={e=>e.stopPropagation()}/><button style={{width:26,height:26,borderRadius:5,border:“1px solid “+T.brd,background:T.cOff,color:T.sub,fontSize:14,cursor:“pointer”,display:“flex”,alignItems:“center”,justifyContent:“center”}} onClick={e=>{e.stopPropagation();addS()}}>+</button></div>
:<button className=“ne” style={{marginTop:2,padding:“4px 8px”,borderRadius:5,border:“1px solid “+T.brd,background:“transparent”,color:T.mut,fontSize:10,cursor:“pointer”}} onClick={e=>{e.stopPropagation();setShowSubInput(true)}}>+ サブタスク</button>}
</div>
</div>}
</div>

  </div>)
}