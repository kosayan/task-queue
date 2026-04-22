import { useState, useEffect, useCallback, useMemo, useRef } from “react”;
const VER = “3.7.0”;
const IMP = [{ v: 3, l: “高”, c: “#ff3b30”, icon: “≡” }, { v: 2, l: “中”, c: “#ff9500”, icon: “=” }, { v: 1, l: “低”, c: “#8e8e93”, icon: “―” }];
const WI = [{ v: 3, l: “重い”, h: “4h+”, bw: 6, bh: 100 }, { v: 2, l: “普通”, h: “1-4h”, bw: 4, bh: 75 }, { v: 1, l: “軽い”, h: “~1h”, bw: 3, bh: 55 }, { v: 0, l: “超軽い”, h: “~10m”, bw: 2, bh: 40 }];
const REC = [{ v: “none”, l: “なし” }, { v: “daily”, l: “毎日” }, { v: “weekly”, l: “毎週” }, { v: “monthly”, l: “毎月” }];
const SORTS = [{ v: “smart”, l: “スマート順” }, { v: “heavy”, l: “重い順” }, { v: “light”, l: “軽い順” }, { v: “deadline”, l: “締切順” }, { v: “impGroup”, l: “重要度まとめ” }, { v: “weightGroup”, l: “重さまとめ” }, { v: “created”, l: “作成日順” }];
const ROI_MAP = {“3-3”:”#dc2626”,“3-2”:”#f97316”,“3-1”:”#facc15”,“3-0”:”#84cc16”,“2-3”:”#2563eb”,“2-2”:”#0891b2”,“2-1”:”#14b8a6”,“2-0”:”#5eead4”,“1-3”:”#9333ea”,“1-2”:”#c084fc”,“1-1”:”#67e8f9”,“1-0”:”#a7f3d0”};
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
1:{bg:”#bbf7d0”,border:“rgba(22,163,74,0.6)”,shadow:“rgba(22,163,74,0.15)”,tc:”#14532d”,mc:”#166534”},
2:{bg:”#fde68a”,border:“rgba(202,138,4,0.55)”,shadow:“rgba(202,138,4,0.12)”,tc:”#713f12”,mc:”#854d0e”},
3:{bg:”#fed7aa”,border:“rgba(234,88,12,0.5)”,shadow:“rgba(234,88,12,0.1)”,tc:”#7c2d12”,mc:”#9a3412”},
4:{bg:”#a5f3fc”,border:“rgba(14,165,233,0.5)”,shadow:“rgba(14,165,233,0.08)”,tc:”#164e63”,mc:”#155e75”},
5:{bg:”#dbeafe”,border:“rgba(37,99,235,0.4)”,shadow:“rgba(37,99,235,0.06)”,tc:”#1e3a8a”,mc:”#1e40af”},
6:{bg:”#ede9fe”,border:“rgba(124,58,237,0.35)”,shadow:“rgba(124,58,237,0.05)”,tc:”#4c1d95”,mc:”#5b21b6”},
7:{bg:”#fdfcf8”,border:“rgba(161,161,170,0.4)”,shadow:“rgba(0,0,0,0.04)”,tc:”#3f3f46”,mc:”#52525b”},
8:{bg:”#f5f3ec”,border:“rgba(168,85,247,0.3)”,shadow:“rgba(168,85,247,0.03)”,tc:”#581c87”,mc:”#6b21a8”},
9:{bg:”#edeae0”,border:“rgba(168,85,247,0.25)”,shadow:“none”,tc:”#6b21a8”,mc:”#7e22ce”},
};
const TH = {
dark:{bg:”#0a0a0a”,card:”#111”,text:”#fff”,sub:”#aaa”,mut:”#888”,dim:”#555”,brd:”#333”,inp:”#1a1a1a”,cOff:”#1a1a1a”,cOffT:”#888”,cOn:”#fff”,cOnT:”#000”,iBg:”#1a1a1a”,iBrd:”#333”,iC:”#ccc”,fBrd:”#444”,fOffT:”#999”,modal:“rgba(0,0,0,0.7)”,toast:”#1a1a1a”,memo:”#0a0a0a”,memB:”#2a2a2a”,shd:“rgba(0,0,0,0.4)”,chk:”#555”,addB:”#555”,addC:”#aaa”,sch:“dark”},
light:{bg:”#e8e5dc”,card:”#fdfcf8”,text:”#18181b”,sub:”#3f3f46”,mut:”#52525b”,dim:”#a1a1aa”,brd:”#c4c0b3”,inp:”#f5f3ec”,cOff:”#f5f3ec”,cOffT:”#52525b”,cOn:”#18181b”,cOnT:”#fff”,iBg:”#fdfcf8”,iBrd:”#c4c0b3”,iC:”#3f3f46”,fBrd:”#b8b4a7”,fOffT:”#52525b”,modal:“rgba(24,24,27,0.5)”,toast:”#fdfcf8”,memo:”#f5f3ec”,memB:”#b8b4a7”,shd:“rgba(0,0,0,0.1)”,chk:”#a1a1aa”,addB:”#a1a1aa”,addC:”#52525b”,sch:“light”}
};

function roi(i,w){return ROI_MAP[i+”-”+(w>=3?3:w>=2?2:w>=1?1:0)]||”#555”}
function tierN(i,w){return TIER_MAP[i+”-”+(w>=3?3:w>=2?2:w>=1?1:0)]||5}
function wDots(w,c){const n=w>=3?3:w>=2?2:w>=1?1:0;return w>=1?“●”.repeat(n):“○”}
function score(t){if(t.done)return-999;if(t.type===“wish”)return-500;if(!t.deadline)return t.importance*15+t.weight*5+5;const h=(new Date(t.deadline).getTime()-Date.now())/36e5;if(h<0)return 1000+t.importance*10;const wh=t.weight===3?6:t.weight===2?3:t.weight===1?1:0.2;const br=h/Math.max(wh,0.1);let u;if(br<1)u=100;else if(br<2)u=80;else if(br<5)u=60;else if(br<24)u=30;else u=Math.max(5,20-br*0.1);return u*0.5+t.importance*15+t.weight*5}
function band(t){if(t.done)return 5;if(t.type===“wish”)return 6;const s=score(t);return s>=1000?0:s>=80?1:s>=60?2:s>=40?3:4}
function sLabel(s){return s>=1000?{t:“OVERDUE”,c:”#ff3b30”}:s>=80?{t:“NOW”,c:”#ff3b30”}:s>=60?{t:“SOON”,c:”#ff9500”}:s>=40?{t:“NEXT”,c:”#ffcc00”}:{t:“LATER”,c:”#8e8e93”}}
function fmtDl(d){if(!d)return”無期限”;const df=new Date(d)-new Date(),m=Math.round(df/6e4);if(m<0)return”overdue”;if(m<60)return m+“m”;const h=Math.floor(m/60),mm=m%60;if(h<24)return mm>0?h+“h “+mm+“m”:h+“h”;const dd=Math.floor(h/24),hh=h%24;if(dd<7)return hh>0?dd+“d “+hh+“h”:dd+“d”;const dl=new Date(d);return(dl.getMonth()+1)+”/”+dl.getDate()}
function defDl(){const d=new Date();d.setDate(d.getDate()+1);d.setHours(18,0,0,0);return d.toISOString().slice(0,16)}
function advRec(dl,r){if(!dl||r===“none”||!r)return dl;const d=new Date(dl);const now=new Date();let guard=0;do{if(r===“daily”)d.setDate(d.getDate()+1);else if(r===“weekly”)d.setDate(d.getDate()+7);else if(r===“monthly”)d.setMonth(d.getMonth()+1);else break;guard++}while(d<=now&&guard<400);return d.toISOString().slice(0,16)}
function sortProm(task,so){
if(so===“smart”)return tierN(task.importance,task.weight);
if(so===“light”){const w=task.weight>=3?3:task.weight>=2?2:task.weight>=1?1:0;return[1,2,4,7][w]||5}
if(so===“heavy”){const w=task.weight>=3?3:task.weight>=2?2:task.weight>=1?1:0;return[7,4,2,1][w]||5}
if(so===“deadline”){if(!task.deadline)return 8;const h=(new Date(task.deadline).getTime()-Date.now())/36e5;if(h<0)return 1;if(h<6)return 2;if(h<24)return 3;if(h<72)return 5;return 7}
if(so===“impGroup”||so===“weightGroup”)return tierN(task.importance,task.weight);
return 5;
}

const SK=“task-queue-v1”,SOK=“task-queue-sort”,DK=“task-queue-defaults”,THK=“task-queue-theme”,TRK=“task-queue-trash”,HRK=“task-queue-habits”,DRK=“task-queue-dayreset”,LEK=“task-queue-locemojis”,LXK=“task-queue-lastexport”,TPK=“task-queue-todaypicks”,TDK=“task-queue-todaypickday”,BNK=“task-queue-bannercount”;
const DD={importance:2,weight:2,hasDeadline:true,recurrence:“none”,location:””};
function ld(k,d){try{const r=localStorage.getItem(k);return r?JSON.parse(r):d}catch{return d}}
let quotaWarnedFlag=false;
function sv(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){if(!quotaWarnedFlag&&(e.name===“QuotaExceededError”||e.code===22||e.code===1014)){quotaWarnedFlag=true;try{window.dispatchEvent(new CustomEvent(“tq-quota-exceeded”))}catch{}}}}
const Refresh=()=>(<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:16,height:16}}><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>);
const Grip=()=>(<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{width:14,height:14}}><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="10" x2="20" y2="10"/><line x1="4" y1="14" x2="20" y2="14"/><line x1="4" y1="18" x2="20" y2="18"/></svg>);

function Particle({p}){
const ref=useRef(null);
useEffect(()=>{
if(!ref.current)return;
if(p.kind===“ring”){
ref.current.animate([
{transform:“translate(-50%,-50%) scale(0)”,opacity:0.9,borderWidth:“4px”},
{transform:“translate(-50%,-50%) scale(9)”,opacity:0.7,offset:0.4},
{transform:“translate(-50%,-50%) scale(22)”,opacity:0,borderWidth:“0px”}
],{duration:1100,easing:“cubic-bezier(.2,.6,.4,1)”,fill:“forwards”});
return;
}
const tx=p.tx,ty=p.ty,gy=p.gy,r=p.r;
ref.current.animate([
{transform:“translate(0,0) rotate(0deg) scale(.3)”,opacity:0},
{transform:“translate(”+(tx*.3)+“px,”+(ty*.3)+“px) rotate(”+(r*.2)+“deg) scale(1.1)”,opacity:1,offset:0.08},
{transform:“translate(”+tx+“px,”+ty+“px) rotate(”+(r*.7)+“deg) scale(1)”,opacity:1,offset:0.4},
{transform:“translate(”+tx+“px,”+ty+“px) rotate(”+(r*.85)+“deg) scale(1)”,opacity:1,offset:0.75},
{transform:“translate(”+tx+“px,”+(ty+gy)+“px) rotate(”+r+“deg) scale(.5)”,opacity:0}
],{duration:parseFloat(p.dur)*1000,easing:“cubic-bezier(.15,.7,.4,1)”,fill:“forwards”});
// eslint-disable-next-line
},[]);
if(p.kind===“ring”)return<span ref={ref} style={{position:“absolute”,left:0,top:0,border:“4px solid “+p.c,borderRadius:“50%”,width:40,height:40,boxShadow:“0 0 20px “+p.c+”,inset 0 0 12px “+p.c+“88”,willChange:“transform,opacity”}}/>;
return<span ref={ref} style={{position:“absolute”,left:0,top:0,width:p.sz,height:p.sz,background:p.c,borderRadius:p.shape===“ci”?“50%”:“2px”,boxShadow:“0 0 6px “+p.c,willChange:“transform,opacity”}}/>;
}

function ScrollTitle({text,style}){
const wrapRef=useRef(null);const innerRef=useRef(null);
const[overflow,setOverflow]=useState(false);const[dist,setDist]=useState(0);
useEffect(()=>{
if(!wrapRef.current||!innerRef.current)return;
const wW=wrapRef.current.offsetWidth;const iW=innerRef.current.scrollWidth;
if(iW>wW+2){setOverflow(true);setDist(iW-wW+24)}else{setOverflow(false);setDist(0)}
},[text]);
if(!overflow)return<div ref={wrapRef} style={{…style,whiteSpace:“nowrap”,overflow:“hidden”,textOverflow:“ellipsis”}}><span ref={innerRef}>{text}</span></div>;
const dur=Math.max(6,Math.min(18,dist/28));
return(<div ref={wrapRef} style={{…style,whiteSpace:“nowrap”,overflow:“hidden”,maskImage:“linear-gradient(90deg,transparent 0,#000 12px,#000 calc(100% - 12px),transparent 100%)”,WebkitMaskImage:“linear-gradient(90deg,transparent 0,#000 12px,#000 calc(100% - 12px),transparent 100%)”}}><span ref={innerRef} style={{display:“inline-block”,animation:“titleScroll “+dur+“s linear infinite”,paddingRight:24,[”–d”]:”-”+dist+“px”}}>{text}</span></div>);
}

export default function App(){
const[tasks,setTasks]=useState(()=>ld(SK,[]));
const[habits,setHabits]=useState(()=>ld(HRK,[]));
const[trash,setTrash]=useState(()=>ld(TRK,[]));
const[locEmojis,setLocEmojis]=useState(()=>ld(LEK,{}));
const[mode,setMode]=useState(“task”);
const[showForm,setShowForm]=useState(false);
const[title,setTitle]=useState(””);const[importance,setImportance]=useState(2);const[weight,setWeight]=useState(2);
const[deadline,setDeadline]=useState(defDl());const[hasDeadline,setHasDeadline]=useState(true);
const[memo,setMemo]=useState(””);const[location,setLocation]=useState(””);const[recurrence,setRecurrence]=useState(“none”);
const[icon,setIcon]=useState(””);const[iconTouched,setIconTouched]=useState(false);
const[filter,setFilter]=useState(“all”);const[locFilter,setLocFilter]=useState(null);
const[editId,setEditId]=useState(null);const[expandedId,setExpandedId]=useState(null);
const[memoExpId,setMemoExpId]=useState(null);
const[sortOrder,setSortOrder]=useState(()=>localStorage.getItem(SOK)||“smart”);
const[searchQ,setSearchQ]=useState(””);const[showSearch,setShowSearch]=useState(false);
const[showSettings,setShowSettings]=useState(false);
const[undoData,setUndoData]=useState(null);const[defaults,setDefaults]=useState(()=>ld(DK,DD));
const[isDark,setIsDark]=useState(()=>(localStorage.getItem(THK)||“dark”)===“dark”);
const[dayReset,setDayReset]=useState(()=>ld(DRK,5));
const[showSortDD,setShowSortDD]=useState(false);
const[editHabitId,setEditHabitId]=useState(null);
const[habitInput,setHabitInput]=useState(””);
const[habitIcon,setHabitIcon]=useState(””);
const[topIdx,setTopIdx]=useState(0);const[topSwipeOff,setTopSwipeOff]=useState(0);
const[draggingId,setDraggingId]=useState(null);
const[openGroup,setOpenGroup]=useState(null);
const[rouletteId,setRouletteId]=useState(null);
const[particles,setParticles]=useState([]);
const[showBackupNudge,setShowBackupNudge]=useState(false);
const[todayPicks,setTodayPicks]=useState(()=>ld(TPK,[]));
const[showPicker,setShowPicker]=useState(false);
const[bannerCount,setBannerCount]=useState(()=>ld(BNK,5));
const[showQuotaWarn,setShowQuotaWarn]=useState(false);
const[tick,setTick]=useState(0);
const[quickInput,setQuickInput]=useState(””);
const[quickIcon,setQuickIcon]=useState(””);
const ur=useRef(null);const fr=useRef(null);const formRef=useRef(null);
const topSwipeStart=useRef(0);const dragStartY=useRef(0);const dragType=useRef(null);
const sortDDRef=useRef(null);
const T=isDark?TH.dark:TH.light;

useEffect(()=>{const h=()=>setShowQuotaWarn(true);window.addEventListener(“tq-quota-exceeded”,h);return()=>window.removeEventListener(“tq-quota-exceeded”,h)},[]);
useEffect(()=>{const iv=setInterval(()=>setTick(t=>t+1),60000);const vis=()=>{if(document.visibilityState===“visible”)setTick(t=>t+1)};document.addEventListener(“visibilitychange”,vis);return()=>{clearInterval(iv);document.removeEventListener(“visibilitychange”,vis)}},[]);
useEffect(()=>{sv(SK,tasks)},[tasks]);
useEffect(()=>{sv(HRK,habits)},[habits]);
useEffect(()=>{sv(TRK,trash)},[trash]);
useEffect(()=>{sv(LEK,locEmojis)},[locEmojis]);
useEffect(()=>{sv(TPK,todayPicks)},[todayPicks]);
useEffect(()=>{sv(BNK,bannerCount)},[bannerCount]);
useEffect(()=>{
const d=new Date();if(d.getHours()<dayReset)d.setDate(d.getDate()-1);
const today=d.getFullYear()+”-”+String(d.getMonth()+1).padStart(2,“0”)+”-”+String(d.getDate()).padStart(2,“0”);
const lastDay=ld(TDK,””);
if(lastDay!==today){setTodayPicks([]);sv(TDK,today);
const activeCount=tasks.filter(t=>!t.done&&t.type!==“wish”).length;
if(activeCount>=3)setTimeout(()=>setShowPicker(true),400)}
// eslint-disable-next-line
},[dayReset]);
useEffect(()=>{
const last=ld(LXK,0);
if(last===0){sv(LXK,Date.now());return}
const days=(Date.now()-last)/(24*36e5);
if(tasks.length>=5&&days>=7)setTimeout(()=>setShowBackupNudge(true),800);
// eslint-disable-next-line
},[]);
useEffect(()=>{localStorage.setItem(SOK,sortOrder)},[sortOrder]);
useEffect(()=>{sv(DK,defaults)},[defaults]);
useEffect(()=>{localStorage.setItem(THK,isDark?“dark”:“light”);document.body.style.background=T.bg},[isDark,T.bg]);
useEffect(()=>{sv(DRK,dayReset)},[dayReset]);
useEffect(()=>{const now=Date.now();setTrash(p=>p.filter(t=>(now-t.deletedAt)<30*24*36e5))},[]);
useEffect(()=>{const now=Date.now();const cutoff=30*24*36e5;const old=tasks.filter(t=>t.done&&t.completedAt&&(now-t.completedAt)>cutoff);if(old.length>0){setTrash(p=>[…p,…old.map(t=>({…t,deletedAt:now}))]);setTasks(p=>p.filter(t=>!old.find(o=>o.id===t.id)))}
// eslint-disable-next-line
},[]);
useEffect(()=>{const now=new Date();const lr=ld(“task-queue-lastreset”,0);const rt=new Date();rt.setHours(dayReset,0,0,0);if(now>rt&&lr<rt.getTime()){setHabits(p=>p.map(h=>({…h,doneToday:false})));sv(“task-queue-lastreset”,Date.now())}},[dayReset]);
useEffect(()=>{if(showForm&&formRef.current)formRef.current.scrollIntoView({behavior:“smooth”,block:“center”})},[showForm]);
useEffect(()=>{if(!showSortDD)return;const h=e=>{if(sortDDRef.current&&!sortDDRef.current.contains(e.target))setShowSortDD(false)};document.addEventListener(“mousedown”,h);document.addEventListener(“touchstart”,h);return()=>{document.removeEventListener(“mousedown”,h);document.removeEventListener(“touchstart”,h)}},[showSortDD]);

const quickUpdate=useCallback((id,field,val)=>{setTasks(p=>p.map(t=>t.id===id?{…t,[field]:val}:t))},[]);
const upSub=useCallback((id,s)=>setTasks(p=>p.map(t=>t.id===id?{…t,subtasks:s}:t)),[]);
const upMemo=useCallback((id,m)=>setTasks(p=>p.map(t=>t.id===id?{…t,memo:m}:t)),[]);
const locs=useMemo(()=>{const s=new Set();tasks.forEach(t=>{if(t.location)s.add(t.location)});return[…s]},[tasks]);

const resetForm=useCallback(()=>{setTitle(””);setImportance(defaults.importance);setWeight(defaults.weight);setDeadline(defDl());setHasDeadline(defaults.hasDeadline);setMemo(””);setLocation(defaults.location);setRecurrence(defaults.recurrence);setIcon(””);setIconTouched(false);setShowForm(false);setEditId(null)},[defaults]);

const submit=useCallback(()=>{
if(!title.trim())return;
const typ=mode===“wish”?“wish”:“task”;
const finalIcon=icon.trim()||(locEmojis[location.trim()]||””);
if(editId){setTasks(p=>p.map(t=>t.id===editId?{…t,title:title.trim(),importance,weight,deadline:hasDeadline?deadline:null,memo:memo.trim(),location:location.trim(),recurrence,icon:finalIcon}:t))}
else{setTasks(p=>[…p,{id:Date.now().toString(36)+Math.random().toString(36).slice(2,6),title:title.trim(),importance:typ===“wish”?1:importance,weight:typ===“wish”?1:weight,deadline:hasDeadline?deadline:null,memo:memo.trim(),location:location.trim(),recurrence:typ===“wish”?“none”:recurrence,icon:finalIcon,done:false,createdAt:Date.now(),type:typ}])}
resetForm()
},[title,importance,weight,deadline,hasDeadline,memo,location,recurrence,icon,editId,resetForm,mode,locEmojis]);

const quickAdd=useCallback(()=>{
if(!quickInput.trim())return;
const typ=mode===“wish”?“wish”:“task”;
const loc=(defaults.location||””).trim();
const finalIcon=quickIcon.trim()||(locEmojis[loc]||””);
setTasks(p=>[…p,{id:Date.now().toString(36)+Math.random().toString(36).slice(2,6),title:quickInput.trim(),importance:typ===“wish”?1:defaults.importance,weight:typ===“wish”?1:defaults.weight,deadline:null,memo:””,location:loc,recurrence:“none”,icon:finalIcon,done:false,createdAt:Date.now(),type:typ}]);
setQuickInput(””);setQuickIcon(””)
},[quickInput,quickIcon,mode,defaults,locEmojis]);

const showUndo=useCallback((ts,a)=>{if(ur.current)clearTimeout(ur.current);setUndoData({tasks:ts,action:a});ur.current=setTimeout(()=>setUndoData(null),5000)},[]);

const lastVibrateRef=useRef(0);
const fireParticles=useCallback(imp=>{
const count=imp===3?80:imp===2?50:30;
const COL=[”#ff3b30”,”#ff9500”,”#ffcc00”,”#4ade80”,”#22c55e”,”#06b6d4”,”#0ea5e9”,”#a855f7”,”#c084fc”,”#f97316”,”#ec4899”,”#fbbf24”];
const id=Date.now().toString(36)+Math.random().toString(36).slice(2,5);
const pts=Array.from({length:count},(_,i)=>{
const a=Math.random()*Math.PI*2;
const d=140+Math.random()*(imp===3?300:imp===2?220:160);
return{id:id+”-”+i,kind:“p”,tx:Math.cos(a)*d,ty:Math.sin(a)*d-50,gy:200+Math.random()*220,c:COL[Math.floor(Math.random()*COL.length)],r:Math.random()*720-360,shape:Math.random()<0.5?“sq”:“ci”,sz:8+Math.random()*6,dur:(1.3+Math.random()*0.7).toFixed(2)}
});
pts.push({id:id+”-ring”,kind:“ring”,c:imp===3?”#ff3b30”:imp===2?”#ff9500”:”#4ade80”});
setParticles(p=>[…p,…pts]);
const now=Date.now();
if(typeof navigator!==“undefined”&&navigator.vibrate&&(now-lastVibrateRef.current)>300){lastVibrateRef.current=now;try{navigator.vibrate(imp===3?[12,25,22,25,40]:imp===2?[18,20,35]:28)}catch{}}
setTimeout(()=>setParticles(p=>p.filter(x=>!x.id.startsWith(id+”-”))),2300);
},[]);
const togDone=useCallback(id=>{setTasks(prev=>{const t=prev.find(x=>x.id===id);if(!t)return prev;if(!t.done)fireParticles(t.importance||2);if(!t.done&&t.recurrence&&t.recurrence!==“none”&&t.deadline){const nt={…t,id:Date.now().toString(36)+Math.random().toString(36).slice(2,6),deadline:advRec(t.deadline,t.recurrence),done:false,createdAt:Date.now(),completedAt:null};return prev.map(x=>x.id===id?{…x,done:true,completedAt:Date.now()}:x).concat(nt)}return prev.map(x=>x.id===id?{…x,done:!x.done,completedAt:!x.done?Date.now():null}:x)})},[fireParticles]);
const delTask=useCallback(id=>{const t=tasks.find(x=>x.id===id);if(!t)return;setTrash(p=>[…p,{…t,deletedAt:Date.now()}]);showUndo([t],“delete”);setTasks(p=>p.filter(x=>x.id!==id));if(expandedId===id)setExpandedId(null)},[tasks,expandedId,showUndo]);
const restoreTask=useCallback(id=>{const t=trash.find(x=>x.id===id);if(!t)return;const{deletedAt,…task}=t;setTasks(p=>[…p,{…task,done:false,completedAt:null}]);setTrash(p=>p.filter(x=>x.id!==id))},[trash]);
const undo=useCallback(()=>{if(!undoData)return;if(undoData.action===“delete”){setTasks(p=>[…p,…undoData.tasks]);setTrash(p=>p.filter(t=>!undoData.tasks.find(u=>u.id===t.id)))}setUndoData(null);if(ur.current)clearTimeout(ur.current)},[undoData]);
const startEdit=useCallback(t=>{setTitle(t.title);setImportance(t.importance);setWeight(t.weight);setDeadline(t.deadline||defDl());setHasDeadline(!!t.deadline);setMemo(t.memo||””);setLocation(t.location||””);setRecurrence(t.recurrence||“none”);setIcon(t.icon||””);setIconTouched(!!t.icon);setEditId(t.id);setShowForm(true);setExpandedId(null)},[]);
const doExport=useCallback(()=>{
const settings={sortOrder,defaults,dayReset,isDark,bannerCount};
const payload={version:VER,exportedAt:new Date().toISOString(),tasks,habits,trash,locEmojis,settings,todayPicks};
const b=new Blob([JSON.stringify(payload,null,2)],{type:“application/json”});
const u=URL.createObjectURL(b);const a=document.createElement(“a”);a.href=u;a.download=“task-queue-”+new Date().toISOString().slice(0,10)+”.json”;a.click();URL.revokeObjectURL(u);sv(LXK,Date.now())
},[tasks,habits,trash,locEmojis,sortOrder,defaults,dayReset,isDark,bannerCount,todayPicks]);
const doImportClick=useCallback(()=>fr.current?.click(),[]);
const validateTask=t=>t&&typeof t.id===“string”&&typeof t.title===“string”&&t.title.trim();
const doImport=useCallback(e=>{const f=e.target.files?.[0];if(!f)return;const r=new FileReader();r.onload=ev=>{try{
const imp=JSON.parse(ev.target.result);
const impTasks=(Array.isArray(imp)?imp:(imp.tasks||[])).filter(validateTask);
const impHabits=Array.isArray(imp)?null:(Array.isArray(imp.habits)?imp.habits.filter(h=>h&&h.id&&h.title):null);
const impTrash=Array.isArray(imp)?null:(Array.isArray(imp.trash)?imp.trash.filter(validateTask):null);
const impLocE=Array.isArray(imp)?null:(imp.locEmojis&&typeof imp.locEmojis===“object”?imp.locEmojis:null);
const impSettings=Array.isArray(imp)?null:(imp.settings&&typeof imp.settings===“object”?imp.settings:null);
const impPicks=Array.isArray(imp)?null:(Array.isArray(imp.todayPicks)?imp.todayPicks:null);
if(impTasks.length===0&&!impHabits){alert(“有効なデータが見つかりません”);return}
const hasFullBackup=!!(impHabits||impSettings||impLocE);
const msg=hasFullBackup?“OK=完全上書き（すべて置換）\nキャンセル=追加マージ（重複ID除く）”:“OK=タスク上書き\nキャンセル=タスク追加”;
if(confirm(msg)){
setTasks(impTasks);
if(impHabits)setHabits(impHabits);
if(impTrash)setTrash(impTrash);
if(impLocE)setLocEmojis(impLocE);
if(impSettings){
if(typeof impSettings.sortOrder===“string”)setSortOrder(impSettings.sortOrder);
if(impSettings.defaults)setDefaults(impSettings.defaults);
if(typeof impSettings.dayReset===“number”)setDayReset(impSettings.dayReset);
if(typeof impSettings.isDark===“boolean”)setIsDark(impSettings.isDark);
if(typeof impSettings.bannerCount===“number”)setBannerCount(impSettings.bannerCount);
}
if(impPicks)setTodayPicks(impPicks);
alert(“インポート完了: タスク”+impTasks.length+“件”+(impHabits?”、日課”+impHabits.length+“件”:””))
}else{
const ids=new Set(tasks.map(t=>t.id));const added=impTasks.filter(t=>!ids.has(t.id));setTasks(p=>[…p,…added]);
if(impHabits){const hids=new Set(habits.map(h=>h.id));setHabits(p=>[…p,…impHabits.filter(h=>!hids.has(h.id))])}
if(impLocE)setLocEmojis(p=>({…impLocE,…p}));
alert(“マージ完了: タスク”+added.length+“件追加”)
}
}catch(err){alert(“インポート失敗: “+err.message)}};r.readAsText(f);e.target.value=””},[tasks,habits]);

// Drag handlers
const dragStart=useCallback((id,type,clientY)=>{setDraggingId(id);dragType.current=type;dragStartY.current=clientY},[]);
const dragMove=useCallback(clientY=>{
if(!draggingId)return;
const dy=clientY-dragStartY.current;const itemH=58;
if(Math.abs(dy)<itemH*0.7)return;
const steps=Math.trunc(dy/itemH);if(steps===0)return;
if(dragType.current===“wish”){
setTasks(prev=>{
const wishList=prev.filter(t=>t.type===“wish”&&!t.done);
const others=prev.filter(t=>t.type!==“wish”||t.done);
const idx=wishList.findIndex(w=>w.id===draggingId);if(idx<0)return prev;
const newIdx=Math.max(0,Math.min(wishList.length-1,idx+steps));if(newIdx===idx)return prev;
const arr=[…wishList];const[item]=arr.splice(idx,1);arr.splice(newIdx,0,item);
return[…others,…arr];
});
dragStartY.current+=steps*itemH;
}else if(dragType.current===“habit”){
setHabits(prev=>{
const idx=prev.findIndex(h=>h.id===draggingId);if(idx<0)return prev;
const newIdx=Math.max(0,Math.min(prev.length-1,idx+steps));if(newIdx===idx)return prev;
const arr=[…prev];const[item]=arr.splice(idx,1);arr.splice(newIdx,0,item);return arr;
});
dragStartY.current+=steps*itemH;
}
},[draggingId]);
const dragEnd=useCallback(()=>{setDraggingId(null);dragType.current=null},[]);

const sorted=useMemo(()=>{
let r=tasks.map(t=>({…t,sc:score(t),bd:band(t)}));
if(filter===“active”)r=r.filter(t=>!t.done&&t.deadline&&t.type!==“wish”);
else if(filter===“done”)r=r.filter(t=>t.done&&(mode===“wish”?t.type===“wish”:t.type!==“wish”));
else if(filter===“noDeadline”)r=r.filter(t=>!t.done&&!t.deadline&&t.type!==“wish”);
else if(mode===“wish”)r=r.filter(t=>t.type===“wish”&&!t.done);
else r=r.filter(t=>!t.done&&t.type!==“wish”);
if(locFilter!==null)r=r.filter(t=>(t.location||””)===locFilter);
if(searchQ.trim()){const q=searchQ.toLowerCase();r=r.filter(t=>t.title.toLowerCase().includes(q)||(t.memo||””).toLowerCase().includes(q)||(t.location||””).toLowerCase().includes(q))}
// done filter: always sort by completedAt descending (most recent first)
if(filter===“done”){r.sort((a,b)=>(b.completedAt||0)-(a.completedAt||0))}
// wish mode: keep array order (for drag reorder). Otherwise sort.
else if(mode!==“wish”&&sortOrder!==“impGroup”&&sortOrder!==“weightGroup”){
if(sortOrder===“smart”)r.sort((a,b)=>{if(a.bd!==b.bd)return a.bd-b.bd;if(a.weight!==b.weight)return a.weight-b.weight;return b.importance-a.importance});
else if(sortOrder===“deadline”)r.sort((a,b)=>{if(!a.deadline&&!b.deadline)return 0;if(!a.deadline)return 1;if(!b.deadline)return-1;return new Date(a.deadline)-new Date(b.deadline)});
else if(sortOrder===“heavy”)r.sort((a,b)=>b.weight-a.weight);
else if(sortOrder===“light”)r.sort((a,b)=>a.weight-b.weight);
else if(sortOrder===“created”)r.sort((a,b)=>b.createdAt-a.createdAt);
}
// wish mode with deadline: emphasize near-deadline
if(mode===“wish”&&sortOrder===“deadline”){r.sort((a,b)=>{if(!a.deadline&&!b.deadline)return 0;if(!a.deadline)return 1;if(!b.deadline)return-1;return new Date(a.deadline)-new Date(b.deadline)})}
// TODAY picks pinned to top (task mode only, not in group mode, only if incomplete)
if(mode===“task”&&todayPicks.length>0&&sortOrder!==“impGroup”&&sortOrder!==“weightGroup”){
const picks=r.filter(t=>todayPicks.includes(t.id)&&!t.done);const rest=r.filter(t=>!(todayPicks.includes(t.id)&&!t.done));
r=[…picks,…rest];
}
return r
},[tasks,filter,locFilter,searchQ,sortOrder,mode,todayPicks,tick]);

const topTasks=useMemo(()=>{
const a=tasks.filter(t=>!t.done&&t.type!==“wish”).map(t=>({…t,sc:score(t),bd:band(t)}));
a.sort((x,y)=>{if(x.bd!==y.bd)return x.bd-y.bd;if(x.weight!==y.weight)return x.weight-y.weight;return y.importance-x.importance});
return a.slice(0,bannerCount)
},[tasks,bannerCount,tick]);
useEffect(()=>{if(topIdx>=topTasks.length&&topTasks.length>0)setTopIdx(0)},[topTasks.length,topIdx]);

const groups=useMemo(()=>{
if(sortOrder===“impGroup”)return[
{k:“imp3”,l:“高”,c:”#ff3b30”,items:sorted.filter(t=>t.importance===3)},
{k:“imp2”,l:“中”,c:”#ff9500”,items:sorted.filter(t=>t.importance===2)},
{k:“imp1”,l:“低”,c:”#8e8e93”,items:sorted.filter(t=>t.importance===1)},
];
if(sortOrder===“weightGroup”)return[
{k:“w3”,l:“重い”,c:roi(2,3),items:sorted.filter(t=>t.weight===3)},
{k:“w2”,l:“普通”,c:roi(2,2),items:sorted.filter(t=>t.weight===2)},
{k:“w1”,l:“軽い”,c:roi(2,1),items:sorted.filter(t=>t.weight===1)},
{k:“w0”,l:“超軽い”,c:roi(2,0),items:sorted.filter(t=>t.weight===0)},
];
return null;
},[sorted,sortOrder]);

// Banner carousel
const bannerTs=e=>{topSwipeStart.current=e.touches[0].clientX};
const bannerTm=e=>{const dx=e.touches[0].clientX-topSwipeStart.current;setTopSwipeOff(dx)};
const bannerTe=()=>{if(topSwipeOff>50&&topIdx>0)setTopIdx(topIdx-1);else if(topSwipeOff<-50&&topIdx<topTasks.length-1)setTopIdx(topIdx+1);setTopSwipeOff(0)};

const gcss=”@import url(‘https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700;800&family=Noto+Sans+JP:wght@400;500;700;900&display=swap’);*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}html,body,#root{min-height:100vh}input,select,button,textarea{font-family:‘Noto Sans JP’,sans-serif}@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}@keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}@keyframes slideDown{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}@keyframes titleScroll{0%,12%{transform:translateX(0)}88%,100%{transform:translateX(var(–d))}}.task-card{animation:fadeIn .3s ease both}.overdue-pulse{animation:pulse 1.5s ease infinite}.form-slide{animation:slideUp .3s ease both}”;

const isTask=mode===“task”,isWish=mode===“wish”,isHabit=mode===“habit”;
const habitsSorted=useMemo(()=>{const done=habits.filter(h=>h.doneToday);const un=habits.filter(h=>!h.doneToday);return[…un,…done]},[habits]);
const isGroupMode=(sortOrder===“impGroup”||sortOrder===“weightGroup”)&&isTask;
const curTop=topTasks[topIdx];
const wishList=useMemo(()=>tasks.filter(t=>t.type===“wish”&&!t.done),[tasks]);
const stats=useMemo(()=>{
const now=new Date();const todayStart=new Date(now);todayStart.setHours(0,0,0,0);
const weekStart=new Date(todayStart);weekStart.setDate(weekStart.getDate()-6);
let todayDone=0,weekDone=0;
tasks.forEach(t=>{if(!t.completedAt)return;const c=new Date(t.completedAt);if(c>=todayStart)todayDone++;if(c>=weekStart)weekDone++});
return{todayDone,weekDone}
},[tasks,tick]);
const overdueCount=useMemo(()=>tasks.filter(t=>!t.done&&t.type!==“wish”&&t.deadline&&new Date(t.deadline)<new Date()).length,[tasks,tick]);
const rescheduleOverdue=useCallback(()=>{
if(!confirm(“期限切れのタスクを全て明日18:00に延期しますか？”))return;
const d=new Date();d.setDate(d.getDate()+1);d.setHours(18,0,0,0);const newDl=d.toISOString().slice(0,16);
setTasks(p=>p.map(t=>(!t.done&&t.type!==“wish”&&t.deadline&&new Date(t.deadline)<new Date())?{…t,deadline:newDl}:t));
},[]);
const giveUpOverdue=useCallback(()=>{
if(!confirm(“期限切れを全て諦めて削除しますか？（30日間ゴミ箱に保持）”))return;
const now=Date.now();const overdue=tasks.filter(t=>!t.done&&t.type!==“wish”&&t.deadline&&new Date(t.deadline)<new Date());
setTrash(p=>[…p,…overdue.map(t=>({…t,deletedAt:now}))]);
setTasks(p=>p.filter(t=>!overdue.find(o=>o.id===t.id)));
},[tasks]);
const renameLocation=useCallback((oldName,newName)=>{
const trimmed=(newName||””).trim();if(!trimmed||trimmed===oldName)return;
const existing=new Set(tasks.map(t=>t.location).filter(Boolean));
if(existing.has(trimmed)){if(!confirm(”「”+trimmed+”」は既に存在します。統合しますか？”))return}
setTasks(p=>p.map(t=>t.location===oldName?{…t,location:trimmed}:t));
setLocEmojis(p=>{const c={…p};if(c[oldName]&&!c[trimmed]){c[trimmed]=c[oldName]}delete c[oldName];return c});
if(locFilter===oldName)setLocFilter(trimmed);
},[locFilter,tasks]);
const deleteLocation=useCallback(name=>{
if(!confirm(“場所「”+name+”」を削除しますか？（タスクは残ります、場所情報のみクリア）”))return;
setTasks(p=>p.map(t=>t.location===name?{…t,location:””}:t));
setLocEmojis(p=>{const c={…p};delete c[name];return c});
if(locFilter===name)setLocFilter(null);
},[locFilter]);
const spinRoulette=useCallback(()=>{if(wishList.length===0){setRouletteId(null);return}let next;do{next=wishList[Math.floor(Math.random()*wishList.length)].id}while(wishList.length>1&&next===rouletteId);setRouletteId(next)},[wishList,rouletteId]);
const rouletteTask=useMemo(()=>wishList.find(w=>w.id===rouletteId),[wishList,rouletteId]);
useEffect(()=>{if(rouletteId&&!wishList.find(w=>w.id===rouletteId))setRouletteId(null)},[wishList,rouletteId]);

return(<div style={{minHeight:“100dvh”,background:T.bg,color:T.text,fontFamily:”‘Noto Sans JP’,sans-serif”,padding:“calc(16px + env(safe-area-inset-top)) 14px calc(80px + env(safe-area-inset-bottom))”,maxWidth:600,margin:“0 auto”}}><style>{gcss+“html,body,#root{background:”+T.bg+”}”}</style>

{/* Header */}

<div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16}}>
  <div><h1 style={{fontFamily:"'JetBrains Mono',monospace",fontSize:20,fontWeight:800,letterSpacing:2,color:T.text,margin:0}}><span style={{color:"#ff3b30"}}>▌</span>TASK QUEUE</h1>
  <p style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:T.mut,marginTop:3}}>{tasks.filter(t=>!t.done&&t.type!=="wish").length}件<span style={{opacity:.3,margin:"0 6px"}}>|</span><span style={{color:stats.todayDone>0?"#4ade80":T.mut}}>今日 ✓{stats.todayDone}</span><span style={{opacity:.3,margin:"0 6px"}}>|</span>週{stats.weekDone}<span style={{opacity:.3,margin:"0 6px"}}>|</span>{tasks.filter(t=>!t.done&&t.type==="wish").length}やりたい</p></div>
  <div style={{display:"flex",gap:5}}>
    <button style={{width:36,height:36,borderRadius:8,border:"1px solid "+T.iBrd,background:T.iBg,color:T.iC,fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}} onClick={()=>window.location.reload()}><Refresh/></button>
    <button style={{width:36,height:36,borderRadius:8,border:"1px solid "+T.iBrd,background:T.iBg,color:T.iC,fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}} onClick={()=>setIsDark(v=>!v)}>{isDark?"☀️":"🌙"}</button>
    <button style={{width:36,height:36,borderRadius:8,border:"1px solid "+T.iBrd,background:T.iBg,color:T.iC,fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}} onClick={()=>setShowSettings(true)}>⚙</button>
  </div>
</div>

{/* Mode */}

<div style={{display:"flex",gap:4,marginBottom:8}}>
  {[{k:"task",l:"タスク"},{k:"wish",l:"やりたい"},{k:"habit",l:"日課"}].map(m=>(<button key={m.k} style={{flex:1,padding:"9px 0",borderRadius:10,fontSize:13,fontWeight:700,textAlign:"center",letterSpacing:1,border:mode===m.k?"none":"1px solid "+T.brd,background:mode===m.k?T.cOn:"transparent",color:mode===m.k?T.cOnT:T.fOffT,cursor:"pointer"}} onClick={()=>{setMode(m.k);setFilter("all");setShowForm(false);setExpandedId(null);setMemoExpId(null)}}>{m.l}</button>))}
</div>

{/* Quick capture (task/wish only, hidden when form open) */}
{!isHabit&&!showForm&&<div style={{display:“flex”,gap:6,marginBottom:10}}>
<input style={{width:40,padding:“8px 4px”,background:T.inp,border:“1px solid “+T.brd,borderRadius:8,color:T.text,fontSize:15,outline:“none”,textAlign:“center”,flexShrink:0}} placeholder=“📌” value={quickIcon} onChange={e=>setQuickIcon(e.target.value)} maxLength={2} aria-label=“アイコン”/>
<input style={{flex:1,padding:“8px 10px”,background:T.inp,border:“1px solid “+T.brd,borderRadius:8,color:T.text,fontSize:13,outline:“none”,minWidth:0}} placeholder={isWish?“やりたいことを素早く追加…”:“タスクを素早く追加…”} value={quickInput} onChange={e=>setQuickInput(e.target.value)} onKeyDown={e=>{if(e.key===“Enter”&&!e.nativeEvent.isComposing)quickAdd()}} aria-label=“クイック入力”/>
<button style={{width:40,height:36,borderRadius:8,border:“1px solid “+T.brd,background:quickInput.trim()?T.cOn:T.cOff,color:quickInput.trim()?T.cOnT:T.cOffT,fontSize:18,fontWeight:700,cursor:“pointer”,flexShrink:0}} onClick={quickAdd} aria-label=“追加”>+</button>

</div>}

{/* Overdue banner */}
{isTask&&overdueCount>=3&&!showForm&&<div style={{marginBottom:10,background:“rgba(255,59,48,0.1)”,border:“1px solid rgba(255,59,48,0.4)”,borderRadius:12,padding:“10px 12px”}}>

  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:7,fontSize:11,fontWeight:700}}><span style={{color:"#ff3b30",fontFamily:"'JetBrains Mono',monospace"}}>⚠ 期限切れ {overdueCount}件</span></div>
  <div style={{display:"flex",gap:6}}>
    <button style={{flex:1,padding:"7px 10px",borderRadius:7,border:"1px solid rgba(255,149,0,0.5)",background:"rgba(255,149,0,0.12)",color:"#ff9500",fontSize:11,fontWeight:700,cursor:"pointer"}} onClick={rescheduleOverdue}>明日に延期</button>
    <button style={{flex:1,padding:"7px 10px",borderRadius:7,border:"1px solid rgba(255,59,48,0.5)",background:"rgba(255,59,48,0.12)",color:"#ff3b30",fontSize:11,fontWeight:700,cursor:"pointer"}} onClick={giveUpOverdue}>諦めて削除</button>
  </div>
</div>}

{/* Top banner - swipeable carousel */}
{isTask&&curTop&&!showForm&&!searchQ&&locFilter===null&&(<div style={{marginBottom:12}}>

<div style={{background:T.card,border:"1px solid "+sLabel(score(curTop)).c,borderRadius:14,padding:"14px 16px",transform:"translateX("+topSwipeOff+"px)",transition:topSwipeOff===0?"transform .25s":"none",touchAction:"pan-y"}} onTouchStart={bannerTs} onTouchMove={bannerTm} onTouchEnd={bannerTe}>
  <div style={{fontSize:10,fontWeight:700,marginBottom:5,letterSpacing:1,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
    <span style={{color:sLabel(score(curTop)).c,fontFamily:"JetBrains Mono"}}>● 今やるべきタスク</span>
    <span style={{color:T.dim,fontSize:9,fontFamily:"JetBrains Mono"}}>{topIdx+1}/{topTasks.length}</span>
  </div>
  <div style={{fontSize:16,fontWeight:700,color:T.text,marginBottom:5}}>{curTop.icon?curTop.icon+" ":""}{curTop.title}</div>
  <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:T.sub,display:"flex",gap:8}}><span>{fmtDl(curTop.deadline)}</span><span style={{opacity:.3}}>|</span><span>スコア {Math.round(score(curTop))}</span></div>
</div>
{topTasks.length>1&&topTasks.length<=5&&<div style={{display:"flex",justifyContent:"center",gap:6,marginTop:6}}>{topTasks.map((_,i)=><span key={i} onClick={()=>setTopIdx(i)} style={{width:6,height:6,borderRadius:"50%",background:i===topIdx?sLabel(score(curTop)).c:T.dim,cursor:"pointer",transition:"background .2s"}}/>)}</div>}
</div>)}

{/* Wish roulette banner (C1) */}
{isWish&&wishList.length>0&&!showForm&&(<div style={{marginBottom:12}}>
{!rouletteTask?<button style={{width:“100%”,padding:“14px 16px”,background:T.card,border:“1px dashed “+T.brd,borderRadius:14,color:T.text,fontSize:14,fontWeight:700,cursor:“pointer”,display:“flex”,alignItems:“center”,justifyContent:“center”,gap:8,letterSpacing:1}} onClick={spinRoulette}>🎲 何やるルーレット</button>
:<div style={{background:T.card,border:“1px solid #c084fc”,borderRadius:14,padding:“14px 16px”}}>

<div style={{fontSize:10,fontWeight:700,marginBottom:5,letterSpacing:1,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
<span style={{color:"#c084fc",fontFamily:"JetBrains Mono"}}>🎲 これやる？</span>
<button style={{background:"none",border:"1px solid "+T.brd,borderRadius:6,color:T.sub,fontSize:14,cursor:"pointer",padding:"2px 8px"}} onClick={spinRoulette}>🎲</button>
</div>
<div style={{fontSize:16,fontWeight:700,color:T.text,marginBottom:5}}>{rouletteTask.icon?rouletteTask.icon+" ":"⭐ "}{rouletteTask.title}</div>
{(rouletteTask.deadline||rouletteTask.memo)&&<div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:T.sub,display:"flex",gap:8,flexWrap:"wrap"}}>{rouletteTask.deadline&&<span>⏰ {fmtDl(rouletteTask.deadline)}</span>}{rouletteTask.memo&&<><span style={{opacity:.3}}>|</span><span>{rouletteTask.memo.slice(0,40)}{rouletteTask.memo.length>40?"...":""}</span></>}</div>}
</div>}
</div>)}

{/* Filter + Sort */}
{!isHabit&&<>

  <div style={{display:"flex",gap:4,marginBottom:6}}>
    {(isTask?[{k:"all",l:"すべて"},{k:"noDeadline",l:"無期限"},{k:"active",l:"アクティブ"},{k:"done",l:"完了"}]:[{k:"all",l:"すべて"},{k:"done",l:"完了"}]).map(f=>(<button key={f.k} style={{padding:"8px 14px",borderRadius:8,border:"1px solid "+T.fBrd,fontSize:13,fontWeight:600,whiteSpace:"nowrap",background:filter===f.k&&locFilter===null?T.cOn:"transparent",color:filter===f.k&&locFilter===null?T.cOnT:T.fOffT,cursor:"pointer"}} onClick={()=>{setFilter(f.k);setLocFilter(null)}}>{f.l}</button>))}
  </div>
  <div style={{display:"flex",gap:6,marginBottom:6,alignItems:"center",position:"relative"}}>
    <button style={{display:"flex",alignItems:"center",justifyContent:"center",width:34,height:30,borderRadius:8,border:"1px solid "+T.fBrd,background:showSearch?T.cOn:T.inp,color:showSearch?T.cOnT:T.mut,fontSize:14,cursor:"pointer",flexShrink:0}} onClick={()=>setShowSearch(v=>!v)}>🔍</button>
    <div ref={sortDDRef} style={{position:"relative"}}>
      <button style={{display:"flex",alignItems:"center",gap:3,padding:"6px 10px",borderRadius:8,border:"1px solid "+T.fBrd,background:T.inp,fontSize:11,fontWeight:600,color:T.sub,fontFamily:"'JetBrains Mono',monospace",cursor:"pointer"}} onClick={()=>setShowSortDD(v=>!v)}>▼ {SORTS.find(s=>s.v===sortOrder)?.l}</button>
      {showSortDD&&<div style={{position:"absolute",top:34,left:0,background:T.card,border:"1px solid "+T.brd,borderRadius:10,padding:6,zIndex:50,boxShadow:"0 4px 12px "+T.shd,minWidth:140}}>{SORTS.map(s=><button key={s.v} style={{display:"block",width:"100%",textAlign:"left",padding:"8px 12px",borderRadius:6,border:"none",background:sortOrder===s.v?T.cOn:"transparent",color:sortOrder===s.v?T.cOnT:T.sub,fontSize:12,fontWeight:600,cursor:"pointer",marginBottom:2}} onClick={()=>{setSortOrder(s.v);setShowSortDD(false);setOpenGroup(null)}}>{s.l}</button>)}</div>}
    </div>
  </div>
  {locs.length>0&&isTask&&<div style={{display:"flex",gap:6,marginBottom:10,alignItems:"center",flexWrap:"wrap"}}>
    <span style={{fontSize:12,color:T.mut}}>📍</span>{locs.map(l=><button key={l} style={{padding:"3px 10px",borderRadius:14,fontSize:10,fontWeight:600,color:locFilter===l?T.cOnT:T.mut,background:locFilter===l?T.cOn:T.inp,border:"1px solid "+T.brd,cursor:"pointer",display:"flex",alignItems:"center",gap:3}} onClick={()=>setLocFilter(locFilter===l?null:l)}>{locEmojis[l]&&<span>{locEmojis[l]}</span>}{l}</button>)}
  </div>}
  {showSearch&&<input className="form-slide" style={{width:"100%",padding:"10px 12px",background:T.inp,border:"1px solid "+T.brd,borderRadius:9,color:T.text,fontSize:14,outline:"none",marginBottom:8}} placeholder="検索..." value={searchQ} onChange={e=>setSearchQ(e.target.value)} autoFocus/>}
</>}

{/* Add button */}
{!showForm&&!isHabit&&<button style={{width:“100%”,padding:13,border:“1.5px dashed “+T.addB,borderRadius:10,color:T.addC,fontSize:13,fontWeight:700,cursor:“pointer”,marginBottom:10,display:“flex”,alignItems:“center”,justifyContent:“center”,gap:6,letterSpacing:1,fontFamily:”‘JetBrains Mono’,monospace”,background:“transparent”}} onClick={()=>{resetForm();setShowForm(true)}}>+ {isWish?“やりたいことを追加”:“新しいタスク”}</button>}

{/* Form */}
{showForm&&<div ref={formRef} className=“form-slide” style={{background:T.card,border:“1px solid “+T.brd,borderRadius:14,padding:16,marginBottom:12,maxWidth:“100%”,overflow:“hidden”}}>

  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}><span style={{fontSize:14,fontWeight:700,color:T.text}}>{editId?"編集":isWish?"やりたいこと":"新しいタスク"}</span><button style={{background:"none",border:"none",color:T.mut,fontSize:16,cursor:"pointer"}} onClick={resetForm}>✕</button></div>
  <div style={{display:"flex",gap:6,marginBottom:6}}><input style={{width:44,padding:"9px 6px",background:T.inp,border:"1px solid "+T.brd,borderRadius:8,color:T.text,fontSize:16,outline:"none",textAlign:"center",flexShrink:0}} placeholder="📌" value={icon} onChange={e=>{setIcon(e.target.value);setIconTouched(true)}} maxLength={2}/><input style={{flex:1,padding:"9px 12px",background:T.inp,border:"1px solid "+T.brd,borderRadius:8,color:T.text,fontSize:14,outline:"none",minWidth:0}} placeholder={isWish?"やりたいこと...":"タスク名..."} value={title} onChange={e=>setTitle(e.target.value)} autoFocus onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&submit()}/></div>
  {!isWish&&<>
    <div style={{marginBottom:10}}><div style={{fontSize:9,fontWeight:700,color:T.mut,textTransform:"uppercase",letterSpacing:1,marginBottom:6,fontFamily:"'JetBrains Mono',monospace"}}>重要度</div><div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{IMP.map(o=><button key={o.v} style={{padding:"6px 12px",borderRadius:7,border:"1px solid "+(importance===o.v?o.c:T.brd),fontSize:12,fontWeight:600,cursor:"pointer",background:importance===o.v?o.c:T.cOff,color:importance===o.v?"#fff":T.cOffT,display:"flex",alignItems:"center",gap:4}} onClick={()=>setImportance(o.v)}><span style={{fontSize:13,fontWeight:900}}>{o.icon}</span>{o.l}</button>)}</div></div>
    <div style={{marginBottom:10}}><div style={{fontSize:9,fontWeight:700,color:T.mut,textTransform:"uppercase",letterSpacing:1,marginBottom:6,fontFamily:"'JetBrains Mono',monospace"}}>重さ</div><div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{WI.map(o=>{const c=roi(importance,o.v);return<button key={o.v} style={{padding:"6px 10px",borderRadius:7,border:"1px solid "+(weight===o.v?c:T.brd),fontSize:11,fontWeight:weight===o.v?700:600,cursor:"pointer",background:weight===o.v?c:T.cOff,color:weight===o.v?"#000":T.cOffT}} onClick={()=>setWeight(o.v)}>{o.l}</button>})}</div></div>
  </>}
  <div style={{marginBottom:10}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}><span style={{fontSize:9,fontWeight:700,color:T.mut,textTransform:"uppercase",letterSpacing:1,fontFamily:"'JetBrains Mono',monospace"}}>締切</span><button style={{padding:"3px 10px",borderRadius:7,border:"1px solid "+(hasDeadline?T.brd:T.cOn),fontSize:10,fontWeight:600,cursor:"pointer",background:hasDeadline?T.cOff:T.cOn,color:hasDeadline?T.cOffT:T.cOnT}} onClick={()=>setHasDeadline(v=>!v)}>{hasDeadline?"無期限にする":"無期限"}</button></div>{hasDeadline&&<input type="datetime-local" style={{width:"100%",padding:"9px 12px",background:T.inp,border:"1px solid "+T.brd,borderRadius:8,color:T.text,fontSize:13,outline:"none",colorScheme:T.sch}} value={deadline} onChange={e=>setDeadline(e.target.value)}/>}</div>
  {!isWish&&hasDeadline&&<div style={{marginBottom:10}}><div style={{fontSize:9,fontWeight:700,color:T.mut,textTransform:"uppercase",letterSpacing:1,marginBottom:6,fontFamily:"'JetBrains Mono',monospace"}}>繰り返し</div><div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{REC.map(o=><button key={o.v} style={{padding:"6px 12px",borderRadius:7,border:"1px solid "+(recurrence===o.v?T.cOn:T.brd),fontSize:11,fontWeight:600,cursor:"pointer",background:recurrence===o.v?T.cOn:T.cOff,color:recurrence===o.v?T.cOnT:T.cOffT}} onClick={()=>setRecurrence(o.v)}>{o.l}</button>)}</div></div>}
  {!isWish&&<div style={{marginBottom:10}}><div style={{fontSize:9,fontWeight:700,color:T.mut,textTransform:"uppercase",letterSpacing:1,marginBottom:6,fontFamily:"'JetBrains Mono',monospace"}}>場所</div><input style={{width:"100%",padding:"9px 12px",background:T.inp,border:"1px solid "+T.brd,borderRadius:8,color:T.text,fontSize:13,outline:"none",minWidth:0}} placeholder="例: 自宅" value={location} onChange={e=>{const v=e.target.value;setLocation(v);if(!iconTouched&&locEmojis[v.trim()])setIcon(locEmojis[v.trim()])}} list="pl"/><datalist id="pl">{locs.map(l=><option key={l} value={l}/>)}</datalist>{location.trim()&&locEmojis[location.trim()]&&!iconTouched&&<div style={{fontSize:10,color:T.mut,marginTop:4,fontFamily:"'JetBrains Mono',monospace"}}>→ アイコン自動設定: {locEmojis[location.trim()]}</div>}</div>}
  <div style={{marginBottom:10}}><div style={{fontSize:9,fontWeight:700,color:T.mut,textTransform:"uppercase",letterSpacing:1,marginBottom:6,fontFamily:"'JetBrains Mono',monospace"}}>メモ</div><textarea style={{width:"100%",padding:"9px 12px",background:T.inp,border:"1px solid "+T.brd,borderRadius:8,color:T.text,fontSize:13,outline:"none",minHeight:50,resize:"vertical",fontFamily:"inherit"}} placeholder="メモ..." value={memo} onChange={e=>setMemo(e.target.value)}/></div>
  <button style={{width:"100%",padding:12,background:"#ff3b30",border:"none",borderRadius:9,color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer"}} onClick={submit}>{editId?"更新する":"追加する"}</button>
</div>}

{/* HABIT MODE */}
{isHabit&&<>

  <div style={{display:"flex",gap:6,marginBottom:10}}>
    <input style={{width:44,padding:"8px 4px",background:T.inp,border:"1px solid "+T.brd,borderRadius:8,color:T.text,fontSize:16,outline:"none",textAlign:"center",flexShrink:0}} placeholder="📌" value={habitIcon} onChange={e=>setHabitIcon(e.target.value)} maxLength={2}/>
    <input style={{flex:1,padding:"8px 10px",background:T.inp,border:"1px solid "+T.brd,borderRadius:8,color:T.text,fontSize:13,outline:"none",minWidth:0}} placeholder="日課を追加..." value={habitInput} onChange={e=>setHabitInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.nativeEvent.isComposing&&habitInput.trim()){setHabits(p=>[...p,{id:Date.now().toString(36)+Math.random().toString(36).slice(2,4),title:habitInput.trim(),memo:"",icon:habitIcon.trim(),doneToday:false}]);setHabitInput("");setHabitIcon("")}}}/>
    <button style={{width:40,height:38,borderRadius:8,border:"1px solid "+T.brd,background:habitInput.trim()?T.cOn:T.cOff,color:habitInput.trim()?T.cOnT:T.cOffT,fontSize:18,fontWeight:700,cursor:"pointer",flexShrink:0}} onClick={()=>{if(habitInput.trim()){setHabits(p=>[...p,{id:Date.now().toString(36)+Math.random().toString(36).slice(2,4),title:habitInput.trim(),memo:"",icon:habitIcon.trim(),doneToday:false}]);setHabitInput("");setHabitIcon("")}}}>+</button>
  </div>
  {habitsSorted.map(h=>(
    <div key={h.id} style={{background:T.card,border:"1px solid "+(editHabitId===h.id?"#ff3b30":T.brd),borderRadius:10,padding:"10px 12px",marginBottom:6,opacity:draggingId===h.id?0.5:(h.doneToday?.4:1),transition:"opacity .2s"}}>
      {editHabitId===h.id?<div style={{display:"flex",flexDirection:"column",gap:6}}>
        <div style={{display:"flex",gap:6,alignItems:"center"}}>
          <input style={{width:40,padding:"5px 2px",background:T.inp,border:"1px solid "+T.brd,borderRadius:5,color:T.text,fontSize:15,outline:"none",textAlign:"center",flexShrink:0}} placeholder="📌" value={h.icon} onChange={e=>setHabits(p=>p.map(x=>x.id===h.id?{...x,icon:e.target.value}:x))} maxLength={2}/>
          <input style={{flex:1,padding:"5px 8px",background:T.inp,border:"1px solid "+T.brd,borderRadius:5,color:T.text,fontSize:13,outline:"none",minWidth:0}} value={h.title} onChange={e=>setHabits(p=>p.map(x=>x.id===h.id?{...x,title:e.target.value}:x))}/>
          <button style={{background:"none",border:"1px solid #4ade80",borderRadius:5,color:"#4ade80",fontSize:11,fontWeight:700,cursor:"pointer",padding:"4px 10px"}} onClick={()=>setEditHabitId(null)}>完了</button>
        </div>
        <textarea style={{width:"100%",padding:"6px 8px",background:T.inp,border:"1px solid "+T.brd,borderRadius:5,color:T.text,fontSize:11,outline:"none",minHeight:40,resize:"vertical",fontFamily:"inherit"}} placeholder="メモ..." value={h.memo||""} onChange={e=>setHabits(p=>p.map(x=>x.id===h.id?{...x,memo:e.target.value}:x))}/>
      </div>:<div style={{display:"flex",alignItems:"center",gap:8}}>
        <button style={{width:20,height:20,borderRadius:5,border:"2px solid "+(h.doneToday?"#4ade80":T.chk),background:h.doneToday?"#4ade80":"transparent",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0,color:"#000",fontSize:10,fontWeight:700}} onClick={()=>{const tdy=new Date();if(tdy.getHours()<dayReset)tdy.setDate(tdy.getDate()-1);const key=tdy.getFullYear()+"-"+String(tdy.getMonth()+1).padStart(2,"0")+"-"+String(tdy.getDate()).padStart(2,"0");const y=new Date(tdy);y.setDate(y.getDate()-1);const yKey=y.getFullYear()+"-"+String(y.getMonth()+1).padStart(2,"0")+"-"+String(y.getDate()).padStart(2,"0");setHabits(p=>p.map(x=>{if(x.id!==h.id)return x;const now=!x.doneToday;if(now){const prev=x.streak||0;const newStreak=x.lastDoneDate===yKey?prev+1:x.lastDoneDate===key?prev:1;fireParticles(1);return{...x,doneToday:true,lastDoneDate:key,streak:newStreak,bestStreak:Math.max(x.bestStreak||0,newStreak)}}return{...x,doneToday:false,lastDoneDate:x.lastDoneDate===key?yKey:x.lastDoneDate,streak:x.lastDoneDate===key?Math.max(0,(x.streak||1)-1):x.streak}}))}}>{h.doneToday&&"✓"}</button>
        <div style={{fontSize:18,flexShrink:0,width:24,textAlign:"center",cursor:"pointer"}} onClick={()=>setEditHabitId(h.id)}>{h.icon||"📌"}</div>
        <div style={{flex:1,cursor:"pointer",minWidth:0}} onClick={()=>setEditHabitId(h.id)}><ScrollTitle text={h.title} style={{fontSize:13,fontWeight:500,color:T.text,textDecoration:h.doneToday?"line-through":"none"}}/><div style={{display:"flex",gap:6,alignItems:"center",marginTop:2}}>{h.streak>=2&&<span style={{fontSize:10,color:"#ff9500",fontFamily:"'JetBrains Mono',monospace",fontWeight:700}}>🔥 {h.streak}</span>}{h.memo&&<span style={{fontSize:10,color:T.mut,fontFamily:"'JetBrains Mono',monospace",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",minWidth:0,flex:1}}>{h.memo}</span>}</div></div>
        <div style={{flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",width:28,height:28,color:T.dim,cursor:"grab",touchAction:"none"}} onTouchStart={e=>{e.stopPropagation();dragStart(h.id,"habit",e.touches[0].clientY)}} onTouchMove={e=>{if(draggingId===h.id){e.stopPropagation();dragMove(e.touches[0].clientY)}}} onTouchEnd={e=>{e.stopPropagation();dragEnd()}} onClick={e=>e.stopPropagation()}><Grip/></div>
        <button style={{background:"none",border:"none",color:T.dim,fontSize:11,cursor:"pointer",padding:4}} onClick={()=>setHabits(p=>p.filter(x=>x.id!==h.id))}>✕</button>
      </div>}
    </div>
  ))}
  {habits.length===0&&<div style={{textAlign:"center",padding:36,color:T.dim,fontSize:13,fontFamily:"'JetBrains Mono',monospace"}}>日課を追加しましょう</div>}
</>}

{/* TASK/WISH LIST */}
{!isHabit&&!isGroupMode&&<div style={{display:“flex”,flexDirection:“column”,gap:8}}>
{sorted.length===0&&<div style={{textAlign:“center”,padding:36,color:T.dim,fontSize:13,fontFamily:”‘JetBrains Mono’,monospace”}}>{searchQ?“検索結果なし”:filter===“done”?“完了タスクなし”:“タスクを追加しましょう”}</div>}
{sorted.map(task=><TaskCard key={task.id} task={task} T={T} isDark={isDark} sortOrder={sortOrder} expanded={expandedId===task.id} memoExp={memoExpId===task.id} dragging={draggingId===task.id} draggable={isWish} isToday={todayPicks.includes(task.id)} locEmojis={locEmojis} onToggleExpand={()=>{setExpandedId(expandedId===task.id?null:task.id);setMemoExpId(null)}} onToggleMemo={()=>{setMemoExpId(memoExpId===task.id?null:task.id);setExpandedId(null)}} onToggleDone={()=>togDone(task.id)} onEdit={()=>startEdit(task)} onDelete={()=>delTask(task.id)} onUpdateSubtasks={s=>upSub(task.id,s)} onUpdateMemo={m=>upMemo(task.id,m)} onQuickUpdate={(f,v)=>quickUpdate(task.id,f,v)} onDragStart={y=>dragStart(task.id,“wish”,y)} onDragMove={dragMove} onDragEnd={dragEnd}/>)}

</div>}

{/* GROUP MODE (summary accordion) */}
{isGroupMode&&<div style={{display:“flex”,flexDirection:“column”,gap:6}}>
{sorted.length===0&&<div style={{textAlign:“center”,padding:36,color:T.dim,fontSize:13,fontFamily:”‘JetBrains Mono’,monospace”}}>タスクなし</div>}
{groups&&groups.map(g=>(<div key={g.k}>
<button style={{width:“100%”,padding:“10px 14px”,background:openGroup===g.k?T.card:T.inp,border:“1px solid “+(openGroup===g.k?g.c:T.brd),borderRadius:10,color:T.text,fontSize:13,fontWeight:700,cursor:“pointer”,display:“flex”,justifyContent:“space-between”,alignItems:“center”}} onClick={()=>setOpenGroup(openGroup===g.k?null:g.k)}>
<span style={{display:“flex”,alignItems:“center”,gap:8}}><span style={{width:10,height:10,borderRadius:“50%”,background:g.c}}/>{g.l}</span>
<span style={{fontFamily:”‘JetBrains Mono’,monospace”,fontSize:11,color:T.mut,display:“flex”,alignItems:“center”,gap:6}}>{g.items.length}件<span style={{fontSize:10}}>{openGroup===g.k?“▲”:“▼”}</span></span>
</button>
{openGroup===g.k&&<div style={{display:“flex”,flexDirection:“column”,gap:6,marginTop:6,marginBottom:4,paddingLeft:6}}>
{g.items.length===0&&<div style={{padding:12,color:T.dim,fontSize:11,fontFamily:”‘JetBrains Mono’,monospace”}}>なし</div>}
{g.items.map(task=><TaskCard key={task.id} task={task} T={T} isDark={isDark} sortOrder={sortOrder} expanded={expandedId===task.id} memoExp={memoExpId===task.id} dragging={false} draggable={false} isToday={todayPicks.includes(task.id)} locEmojis={locEmojis} onToggleExpand={()=>{setExpandedId(expandedId===task.id?null:task.id);setMemoExpId(null)}} onToggleMemo={()=>{setMemoExpId(memoExpId===task.id?null:task.id);setExpandedId(null)}} onToggleDone={()=>togDone(task.id)} onEdit={()=>startEdit(task)} onDelete={()=>delTask(task.id)} onUpdateSubtasks={s=>upSub(task.id,s)} onUpdateMemo={m=>upMemo(task.id,m)} onQuickUpdate={(f,v)=>quickUpdate(task.id,f,v)}/>)}
</div>}

  </div>))}
</div>}

{/* Settings */}
{showSettings&&<div style={{position:“fixed”,top:0,left:0,right:0,bottom:0,background:T.modal,zIndex:100,display:“flex”,alignItems:“flex-start”,justifyContent:“center”,padding:“60px 16px 20px”,overflowY:“auto”}} onClick={()=>setShowSettings(false)}><div style={{background:T.card,border:“1px solid “+T.brd,borderRadius:16,padding:20,width:“100%”,maxWidth:500}} onClick={e=>e.stopPropagation()}>

  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}><span style={{fontSize:15,fontWeight:700,color:T.text}}>設定</span><button style={{background:"none",border:"none",color:T.mut,fontSize:16,cursor:"pointer"}} onClick={()=>setShowSettings(false)}>✕</button></div>
  <div style={{marginBottom:14}}><div style={{fontSize:10,fontWeight:700,color:T.mut,textTransform:"uppercase",letterSpacing:1,marginBottom:7,fontFamily:"'JetBrains Mono',monospace"}}>日付変更時刻</div><input type="number" min="0" max="23" style={{width:60,padding:"8px 10px",background:T.inp,border:"1px solid "+T.brd,borderRadius:8,color:T.text,fontSize:14,outline:"none"}} value={dayReset} onChange={e=>setDayReset(parseInt(e.target.value)||0)}/><span style={{fontSize:11,color:T.mut,marginLeft:6}}>時</span></div>

  <div style={{marginBottom:14,borderTop:"1px solid "+T.brd,paddingTop:14}}>
    <div style={{fontSize:10,fontWeight:700,color:T.mut,textTransform:"uppercase",letterSpacing:1,marginBottom:7,fontFamily:"'JetBrains Mono',monospace"}}>今やるべきタスクの表示件数</div>
    <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{[3,4,5,6,7].map(n=><button key={n} style={{padding:"6px 14px",borderRadius:7,border:"1px solid "+(bannerCount===n?T.cOn:T.brd),fontSize:12,fontWeight:700,cursor:"pointer",background:bannerCount===n?T.cOn:T.cOff,color:bannerCount===n?T.cOnT:T.cOffT}} onClick={()=>setBannerCount(n)}>{n}件</button>)}</div>
  </div>

{/* Place management (B4) */}

  <div style={{marginBottom:14,borderTop:"1px solid "+T.brd,paddingTop:14}}>
    <div style={{fontSize:10,fontWeight:700,color:T.mut,textTransform:"uppercase",letterSpacing:1,marginBottom:7,fontFamily:"'JetBrains Mono',monospace"}}>場所の管理</div>
    {locs.length===0&&<div style={{fontSize:11,color:T.dim,padding:"4px 0"}}>タスクに場所を設定すると、ここで絵文字を管理できます</div>}
    {locs.map(l=><div key={l} style={{display:"flex",alignItems:"center",gap:6,padding:"6px 0",borderBottom:"1px solid "+(isDark?"#1a1a1a":T.brd)}}>
      <input style={{width:42,padding:"5px",background:T.inp,border:"1px solid "+T.brd,borderRadius:6,color:T.text,fontSize:14,outline:"none",textAlign:"center",flexShrink:0}} placeholder="📌" value={locEmojis[l]||""} onChange={e=>setLocEmojis(prev=>({...prev,[l]:e.target.value}))} maxLength={2}/>
      <input style={{flex:1,padding:"6px 8px",background:T.inp,border:"1px solid "+T.brd,borderRadius:6,color:T.text,fontSize:12,outline:"none",minWidth:0}} defaultValue={l} onBlur={e=>renameLocation(l,e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.nativeEvent.isComposing){e.target.blur()}}}/>
      <button style={{width:28,height:28,borderRadius:6,border:"1px solid rgba(255,59,48,0.3)",background:"transparent",color:"#ff3b30",fontSize:11,cursor:"pointer",flexShrink:0}} onClick={()=>deleteLocation(l)} aria-label="削除">✕</button>
    </div>)}
  </div>

  <div style={{marginBottom:14,borderTop:"1px solid "+T.brd,paddingTop:14}}><div style={{fontSize:10,fontWeight:700,color:T.mut,textTransform:"uppercase",letterSpacing:1,marginBottom:7,fontFamily:"'JetBrains Mono',monospace"}}>今日の3選択</div>
    <div style={{fontSize:11,color:T.sub,marginBottom:7}}>現在の選択: {todayPicks.length}件</div>
    <div style={{display:"flex",gap:8}}>
      <button style={{flex:1,padding:10,borderRadius:9,border:"1px solid "+T.brd,background:T.cOff,color:T.text,fontSize:12,fontWeight:700,cursor:"pointer"}} onClick={()=>{setShowSettings(false);setShowPicker(true)}}>選び直す</button>
      {todayPicks.length>0&&<button style={{flex:1,padding:10,borderRadius:9,border:"1px solid "+T.brd,background:"transparent",color:T.sub,fontSize:12,fontWeight:700,cursor:"pointer"}} onClick={()=>setTodayPicks([])}>クリア</button>}
    </div>
  </div>

  <div style={{marginBottom:14,borderTop:"1px solid "+T.brd,paddingTop:14}}><div style={{fontSize:10,fontWeight:700,color:T.mut,textTransform:"uppercase",letterSpacing:1,marginBottom:7,fontFamily:"'JetBrains Mono',monospace"}}>データ</div><div style={{display:"flex",gap:8}}><button style={{flex:1,padding:10,borderRadius:9,border:"1px solid "+T.brd,background:T.cOff,color:T.text,fontSize:12,fontWeight:700,cursor:"pointer"}} onClick={doExport}>エクスポート</button><button style={{flex:1,padding:10,borderRadius:9,border:"1px solid "+T.brd,background:T.cOff,color:T.text,fontSize:12,fontWeight:700,cursor:"pointer"}} onClick={doImportClick}>インポート</button><input ref={fr} type="file" accept="application/json" style={{display:"none"}} onChange={doImport}/></div></div>
  <div style={{marginBottom:14,borderTop:"1px solid "+T.brd,paddingTop:14}}><div style={{fontSize:10,fontWeight:700,color:T.mut,textTransform:"uppercase",letterSpacing:1,marginBottom:7,fontFamily:"'JetBrains Mono',monospace"}}>ゴミ箱（{trash.length}件）</div>
    {trash.map(t=><div key={t.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 0",borderBottom:"1px solid "+(isDark?"#1a1a1a":T.brd)}}><span style={{fontSize:12,color:T.sub}}>{t.icon?t.icon+" ":""}{t.title}</span><button style={{padding:"3px 8px",borderRadius:6,border:"1px solid rgba(34,197,94,0.3)",background:"transparent",color:"#4ade80",fontSize:10,fontWeight:600,cursor:"pointer"}} onClick={()=>restoreTask(t.id)}>復元</button></div>)}
    {trash.length>0&&<button style={{marginTop:8,padding:"6px 12px",borderRadius:8,border:"1px solid rgba(255,59,48,0.3)",background:"transparent",color:"#ff3b30",fontSize:11,fontWeight:600,cursor:"pointer"}} onClick={()=>{if(confirm("ゴミ箱を空にしますか？"))setTrash([])}}>ゴミ箱を空にする</button>}
  </div>
</div></div>}

{/* Quota warning (data full) */}
{showQuotaWarn&&<div style={{position:“fixed”,top:0,left:0,right:0,bottom:0,background:T.modal,zIndex:260,display:“flex”,alignItems:“center”,justifyContent:“center”,padding:16}}><div style={{background:T.card,border:“1px solid #ff3b30”,borderRadius:14,padding:20,width:“100%”,maxWidth:360}}>

  <div style={{fontSize:16,fontWeight:800,color:"#ff3b30",marginBottom:8}}>⚠ 保存容量がいっぱいです</div>
  <div style={{fontSize:12,color:T.sub,marginBottom:16,lineHeight:1.6}}>新しい変更が保存できていません。完了タスクや古いゴミ箱を整理するか、データをエクスポートしてバックアップしてください。</div>
  <div style={{display:"flex",gap:8}}>
    <button style={{flex:1,padding:11,borderRadius:9,border:"1px solid "+T.brd,background:"transparent",color:T.sub,fontSize:12,fontWeight:700,cursor:"pointer"}} onClick={()=>setShowQuotaWarn(false)}>閉じる</button>
    <button style={{flex:1,padding:11,borderRadius:9,border:"none",background:"#ff3b30",color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer"}} onClick={()=>{doExport();setShowQuotaWarn(false)}}>エクスポート</button>
  </div>
</div></div>}

{/* Particles overlay (C2) */}
{particles.length>0&&<div style={{position:“fixed”,inset:0,pointerEvents:“none”,zIndex:300,overflow:“hidden”}}>

<div style={{position:"absolute",left:"50%",top:"45%"}}>
{particles.map(p=><Particle key={p.id} p={p}/>)}
</div></div>}

{/* Backup nudge (C4) */}
{showBackupNudge&&<div style={{position:“fixed”,top:0,left:0,right:0,bottom:0,background:T.modal,zIndex:250,display:“flex”,alignItems:“center”,justifyContent:“center”,padding:16}} onClick={()=>setShowBackupNudge(false)}><div style={{background:T.card,border:“1px solid “+T.brd,borderRadius:14,padding:20,width:“100%”,maxWidth:360}} onClick={e=>e.stopPropagation()}>

  <div style={{fontSize:16,fontWeight:800,color:T.text,marginBottom:8}}>💾 バックアップしませんか？</div>
  <div style={{fontSize:12,color:T.sub,marginBottom:16,lineHeight:1.6}}>最後のエクスポートから7日以上経過しています。データを書き出して保管しておきましょう。</div>
  <div style={{display:"flex",gap:8}}>
    <button style={{flex:1,padding:11,borderRadius:9,border:"1px solid "+T.brd,background:"transparent",color:T.sub,fontSize:12,fontWeight:700,cursor:"pointer"}} onClick={()=>setShowBackupNudge(false)}>あとで</button>
    <button style={{flex:1,padding:11,borderRadius:9,border:"none",background:"#ff3b30",color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer"}} onClick={()=>{doExport();setShowBackupNudge(false)}}>エクスポート</button>
  </div>
</div></div>}

{/* Morning picker (C5) */}
{showPicker&&<div style={{position:“fixed”,top:0,left:0,right:0,bottom:0,background:T.modal,zIndex:250,display:“flex”,alignItems:“flex-start”,justifyContent:“center”,padding:“40px 16px 20px”,overflowY:“auto”}}><div style={{background:T.card,border:“1px solid “+T.brd,borderRadius:16,padding:20,width:“100%”,maxWidth:500}}>

  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}><span style={{fontSize:16,fontWeight:800,color:T.text}}>🌅 今日やる3つを選ぼう</span><button style={{background:"none",border:"none",color:T.mut,fontSize:16,cursor:"pointer"}} onClick={()=>setShowPicker(false)}>✕</button></div>
  <div style={{fontSize:11,color:T.mut,marginBottom:12,fontFamily:"'JetBrains Mono',monospace"}}>選択: {todayPicks.length}/3</div>
  <div style={{display:"flex",flexDirection:"column",gap:5,marginBottom:14,maxHeight:"50vh",overflowY:"auto"}}>
    {tasks.filter(t=>!t.done&&t.type!=="wish").map(t=>{const on=todayPicks.includes(t.id);const dis=!on&&todayPicks.length>=3;const c=roi(t.importance,t.weight);return<button key={t.id} disabled={dis} style={{display:"flex",alignItems:"center",gap:8,padding:"9px 12px",borderRadius:8,border:"1px solid "+(on?"#4ade80":T.brd),background:on?"rgba(74,222,128,0.12)":T.inp,color:T.text,fontSize:13,cursor:dis?"not-allowed":"pointer",opacity:dis?.4:1,textAlign:"left",width:"100%"}} onClick={()=>setTodayPicks(p=>on?p.filter(x=>x!==t.id):[...p,t.id])}>
      <span style={{width:16,height:16,borderRadius:4,border:"2px solid "+(on?"#4ade80":T.chk),background:on?"#4ade80":"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,color:"#000",fontSize:9,fontWeight:800}}>{on?"✓":""}</span>
      <span style={{width:3,height:18,background:c,borderRadius:2,flexShrink:0}}/>
      {t.icon&&<span style={{fontSize:14,flexShrink:0}}>{t.icon}</span>}
      <span style={{flex:1,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{t.title}</span>
      <span style={{fontSize:9,color:T.mut,fontFamily:"'JetBrains Mono',monospace",flexShrink:0}}>{fmtDl(t.deadline)}</span>
    </button>})}
  </div>
  <div style={{display:"flex",gap:8}}>
    <button style={{flex:1,padding:11,borderRadius:9,border:"1px solid "+T.brd,background:"transparent",color:T.sub,fontSize:12,fontWeight:700,cursor:"pointer"}} onClick={()=>{setTodayPicks([]);setShowPicker(false)}}>スキップ</button>
    <button style={{flex:1,padding:11,borderRadius:9,border:"none",background:todayPicks.length===0?T.dim:"#4ade80",color:"#000",fontSize:12,fontWeight:800,cursor:"pointer"}} onClick={()=>setShowPicker(false)}>決定 ({todayPicks.length})</button>
  </div>
</div></div>}

{/* Undo toast */}
{undoData&&<div className=“form-slide” style={{position:“fixed”,bottom:“calc(24px + env(safe-area-inset-bottom))”,left:16,right:16,maxWidth:360,margin:“0 auto”,background:T.toast,border:“1px solid “+T.brd,borderRadius:10,padding:“12px 16px”,display:“flex”,alignItems:“center”,justifyContent:“space-between”,fontSize:13,color:T.sub,zIndex:200}}><span>削除しました</span><button style={{background:“none”,border:“none”,color:”#ff3b30”,fontWeight:700,cursor:“pointer”,fontSize:13}} onClick={undo}>元に戻す</button></div>}

<div style={{position:"fixed",bottom:6,right:10,fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:T.dim,userSelect:"none",pointerEvents:"none"}}>v{VER}</div>

  </div>)
}

function TaskCard({task,T,isDark,sortOrder,expanded,memoExp,dragging,draggable,isToday,locEmojis={},onToggleExpand,onToggleMemo,onToggleDone,onEdit,onDelete,onUpdateSubtasks,onUpdateMemo,onQuickUpdate,onDragStart,onDragMove,onDragEnd}){
const isW=task.type===“wish”;
// Near-deadline wish highlight
const wishUrgent=isW&&task.deadline&&((new Date(task.deadline)-new Date())/36e5)<24&&((new Date(task.deadline)-new Date())/36e5)>=0;
const wishOver=isW&&task.deadline&&((new Date(task.deadline)-new Date())/36e5)<0;
const lb=isW?(wishOver?{t:“OVERDUE”,c:”#ff3b30”}:wishUrgent?{t:“SOON”,c:”#ff9500”}:{t:“WISH”,c:”#c084fc”}):sLabel(task.sc);
const isOD=task.sc>=1000;
const rc=isW?(wishOver?”#ff3b30”:wishUrgent?”#ff9500”:”#c084fc”):roi(task.importance,task.weight);
const pr=isW?5:sortProm(task,sortOrder);
const wi=WI.find(w=>w.v===task.weight);
const im=IMP.find(x=>x.v===task.importance);
const[ns,setNs]=useState(””);
const[showSubInput,setShowSubInput]=useState(false);
const[subDragId,setSubDragId]=useState(null);
const subDragStartY=useRef(0);
const subs=task.subtasks||[];const sd=subs.filter(s=>s.done).length;const hs=subs.length>0;
const addS=()=>{if(!ns.trim())return;onUpdateSubtasks([…subs,{id:Date.now().toString(36)+Math.random().toString(36).slice(2,4),title:ns.trim(),done:false}]);setNs(””)};
const subDragStart=(id,y)=>{setSubDragId(id);subDragStartY.current=y};
const subDragMove=y=>{if(!subDragId)return;const dy=y-subDragStartY.current;const itemH=36;if(Math.abs(dy)<itemH*0.7)return;const steps=Math.trunc(dy/itemH);if(steps===0)return;const idx=subs.findIndex(s=>s.id===subDragId);if(idx<0)return;const newIdx=Math.max(0,Math.min(subs.length-1,idx+steps));if(newIdx===idx)return;const arr=[…subs];const[item]=arr.splice(idx,1);arr.splice(newIdx,0,item);onUpdateSubtasks(arr);subDragStartY.current+=steps*itemH};
const subDragEnd=()=>setSubDragId(null);
const tsx=useRef(0),tsy=useRef(0);const[so,setSo]=useState(0);const[sw,setSw]=useState(false);
const tts=()=>{};
const ttm=()=>{};
const tte=()=>{};

const DONE_TIER={bg:isDark?”#0a0a0a”:”#f5f3ec”,border:isDark?“rgba(136,136,136,0.15)”:“rgba(161,161,170,0.3)”,shadow:“none”,fs:13,fw:500,tc:isDark?”#777”:”#52525b”,mc:isDark?”#555”:”#71717a”,pad:10,mfs:9,bfs:8,bp:“2px 6px”};
const ts=task.done?DONE_TIER:(isDark?TIER[pr]:{…TIER[pr],…TIER_LIGHT[pr]});
const displayRc=task.done?(isDark?”#555”:”#a1a1aa”):rc;
const changeIcon=e=>{e.stopPropagation();const current=task.icon||””;const v=prompt(“アイコン（絵文字1-2文字）”,current);if(v===null)return;onQuickUpdate(“icon”,v.slice(0,2))};
return(<div style={{position:“relative”,overflow:“hidden”,borderRadius:10,opacity:dragging?0.5:1}}>

<div className="task-card" style={{background:isW?T.card:ts.bg,borderRadius:10,padding:ts.pad+"px 14px "+ts.pad+"px "+(ts.pad+8)+"px",transition:"all .2s",cursor:"pointer",position:"relative",display:"flex",width:"100%",flexDirection:expanded||memoExp?"column":"row",alignItems:expanded||memoExp?"stretch":"center",border:"1px solid "+(isW?(wishOver?"rgba(255,59,48,0.4)":wishUrgent?"rgba(255,149,0,0.4)":"rgba(192,132,252,0.2)"):ts.border),boxShadow:ts.shadow!=="none"?"0 0 10px "+ts.shadow:""}} onClick={e=>{if(e.target.closest(".ne"))return;onToggleExpand()}}>
{!isW&&!task.done&&<div style={{position:"absolute",left:0,top:"50%",transform:"translateY(-50%)",width:wi?.bw||4,height:(wi?.bh||75)+"%",background:displayRc,borderRadius:"0 3px 3px 0"}}/>}
{isW&&<div style={{position:"absolute",left:0,top:"50%",transform:"translateY(-50%)",width:3,height:"60%",background:rc,borderRadius:"0 3px 3px 0"}}/>}
<div style={{display:"flex",alignItems:"center",justifyContent:"space-between",width:"100%"}}>
<div style={{display:"flex",alignItems:"flex-start",gap:10,flex:1,minWidth:0}}>
<div className="ne" style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4,flexShrink:0,width:26}}>
<button className="ne" style={{background:"none",border:"none",padding:0,margin:0,cursor:"pointer",fontSize:18,lineHeight:1,height:22,width:26,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={changeIcon} aria-label="アイコン変更">{task.icon||(isW?"⭐":"＋")}</button>
<button className="ne" style={{width:20,height:20,borderRadius:5,border:"2px solid "+(task.done?"#4ade80":T.chk),background:task.done?"#4ade80":"transparent",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:"#000",fontSize:11,fontWeight:800}} onClick={e=>{e.stopPropagation();onToggleDone()}}>{task.done&&"✓"}</button>
</div>
<div style={{flex:1,minWidth:0,paddingTop:2}}>
<ScrollTitle text={task.title} style={{fontSize:ts.fs,fontWeight:ts.fw,color:ts.tc}}/>
{!isW&&!task.done&&<div style={{fontSize:ts.mfs,color:ts.mc,marginTop:3,display:"flex",gap:5,fontFamily:"'JetBrains Mono',monospace",flexWrap:"wrap",alignItems:"center"}}>
<span style={{color:im?.c,fontSize:ts.mfs+2,fontWeight:900}}>{im?.icon}</span>
<span style={{opacity:.3}}>·</span>
<span style={{color:rc,fontSize:ts.mfs,letterSpacing:1}}>{wDots(task.weight,rc)}</span>
<span style={{opacity:.3}}>·</span>
<span style={{color:isOD?"#ff3b30":ts.mc}}>{fmtDl(task.deadline)}</span>
{task.location&&<><span style={{opacity:.3}}>·</span><span>{locEmojis[task.location]||"📍"}{task.location}</span></>}
{task.recurrence&&task.recurrence!=="none"&&<><span style={{opacity:.3}}>·</span><span>🔁</span></>}
{hs&&<><span style={{opacity:.3}}>·</span><span style={{color:sd===subs.length?"#4ade80":ts.mc}}>{sd}/{subs.length}</span></>}
</div>}
{!isW&&task.done&&task.completedAt&&<div style={{fontSize:9,color:ts.mc,marginTop:3,fontFamily:"'JetBrains Mono',monospace"}}>✓ {new Date(task.completedAt).toLocaleString("ja-JP",{month:"numeric",day:"numeric",hour:"2-digit",minute:"2-digit"})}</div>}
{isW&&<div style={{fontSize:10,color:T.mut,marginTop:3,display:"flex",gap:5,fontFamily:"'JetBrains Mono',monospace",flexWrap:"wrap",alignItems:"center"}}>
{task.deadline&&<><span style={{color:wishOver?"#ff3b30":wishUrgent?"#ff9500":T.mut}}>⏰ {fmtDl(task.deadline)}</span></>}
{task.memo&&<><span style={{opacity:.3}}>·</span><span>{task.memo.slice(0,30)}{task.memo.length>30?"...":""}</span></>}
</div>}
</div>
</div>
<div style={{flexShrink:0,marginLeft:8,display:"flex",alignItems:"center",gap:6}}>
{!task.done&&<button className="ne" style={{background:"none",border:"none",padding:0,cursor:"pointer",display:"flex",alignItems:"center",gap:2,opacity:task.memo?1:0.45}} onClick={e=>{e.stopPropagation();onToggleMemo()}}>
<span style={{fontSize:13}}>📝</span>
{task.memo&&<span style={{width:5,height:5,borderRadius:"50%",background:"#4ade80",display:"inline-block"}}/>}
</button>}
{isToday&&!task.done&&<span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:ts.bfs,fontWeight:800,letterSpacing:1,padding:ts.bp,borderRadius:5,border:"1px solid #4ade80",background:"rgba(74,222,128,0.15)",color:"#4ade80"}}>TODAY</span>}
{!task.done&&<span className={isOD?"overdue-pulse":""} style={{fontFamily:"'JetBrains Mono',monospace",fontSize:ts.bfs,fontWeight:700,letterSpacing:1,padding:ts.bp,borderRadius:5,border:"1px solid",background:lb.c+"22",color:lb.c,borderColor:lb.c+"44"}}>{lb.t}</span>}
{draggable&&<div className="ne" style={{display:"flex",alignItems:"center",justifyContent:"center",width:28,height:28,color:T.dim,cursor:"grab",touchAction:"none",marginLeft:2}} onTouchStart={e=>{e.stopPropagation();onDragStart(e.touches[0].clientY)}} onTouchMove={e=>{e.stopPropagation();if(onDragMove)onDragMove(e.touches[0].clientY)}} onTouchEnd={e=>{e.stopPropagation();onDragEnd()}} onClick={e=>e.stopPropagation()}><Grip/></div>}
</div>
</div>
{/* Memo-only expand (B3) */}
{memoExp&&!expanded&&<div className="ne" style={{marginTop:10,paddingTop:10,borderTop:"1px solid "+T.brd,width:"100%",animation:"slideDown .25s ease"}} onClick={e=>e.stopPropagation()}>
<div style={{fontSize:9,fontWeight:700,color:T.mut,textTransform:"uppercase",letterSpacing:1,marginBottom:6,fontFamily:"'JetBrains Mono',monospace"}}>📝 メモ</div>
<textarea style={{width:"100%",padding:"8px 10px",background:T.memo,border:"1px solid "+T.memB,borderRadius:6,color:T.sub,fontSize:12,outline:"none",minHeight:60,resize:"vertical",fontFamily:"inherit",lineHeight:1.5}} placeholder="メモを入力..." value={task.memo||""} onChange={e=>onUpdateMemo(e.target.value)} onClick={e=>e.stopPropagation()}/>
</div>}
{expanded&&<div style={{marginTop:12,paddingTop:12,borderTop:"1px solid "+T.brd,width:"100%",animation:"slideDown .25s ease"}}>
{!isW&&<div className="ne" style={{display:"flex",gap:6,marginBottom:8,flexWrap:"wrap"}}>
{IMP.map(o=><button key={o.v} style={{padding:"3px 8px",borderRadius:5,border:"1px solid "+(task.importance===o.v?o.c:T.brd),fontSize:10,fontWeight:600,cursor:"pointer",background:task.importance===o.v?o.c:T.cOff,color:task.importance===o.v?"#fff":T.cOffT}} onClick={e=>{e.stopPropagation();onQuickUpdate("importance",o.v)}}>{o.icon}{o.l}</button>)}
<span style={{opacity:.2}}>|</span>
{WI.map(o=>{const c=roi(task.importance,o.v);return<button key={o.v} style={{padding:"3px 8px",borderRadius:5,border:"1px solid "+(task.weight===o.v?c:T.brd),fontSize:10,fontWeight:600,cursor:"pointer",background:task.weight===o.v?c:T.cOff,color:task.weight===o.v?"#000":T.cOffT}} onClick={e=>{e.stopPropagation();onQuickUpdate("weight",o.v)}}>{o.l}</button>})}
</div>}
{task.deadline&&<div style={{display:"flex",justifyContent:"space-between",padding:"4px 0",fontSize:12}}><span style={{color:T.mut,fontFamily:"'JetBrains Mono',monospace",fontSize:10}}>締切</span><span style={{color:T.text}}>{new Date(task.deadline).toLocaleString()}</span></div>}
{task.recurrence&&task.recurrence!=="none"&&<div style={{display:"flex",justifyContent:"space-between",padding:"4px 0",fontSize:12}}><span style={{color:T.mut,fontFamily:"'JetBrains Mono',monospace",fontSize:10}}>繰り返し</span><span style={{color:T.text}}>{REC.find(r=>r.v===task.recurrence)?.l}</span></div>}
{/* Subtasks */}
<div style={{marginTop:10}}>
{hs&&<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}><span style={{color:T.sub,fontFamily:"'JetBrains Mono',monospace",fontSize:10,letterSpacing:1,textTransform:"uppercase",fontWeight:700}}>サブタスク</span><span style={{fontSize:11,color:sd===subs.length?"#4ade80":T.sub,fontFamily:"'JetBrains Mono',monospace",fontWeight:700}}>{sd}/{subs.length}</span></div>}
{subs.map(sub=><div key={sub.id} className="ne" style={{display:"flex",alignItems:"center",gap:8,padding:"7px 0",borderBottom:"1px solid "+(isDark?"#1a1a1a":T.brd),opacity:subDragId===sub.id?0.5:1,transition:"opacity .2s"}}><button style={{width:16,height:16,borderRadius:4,border:"2px solid "+(sub.done?"#4ade80":T.chk),background:sub.done?"#4ade80":"transparent",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0}} onClick={e=>{e.stopPropagation();onUpdateSubtasks(subs.map(s=>s.id===sub.id?{...s,done:!s.done}:s))}}>{sub.done&&<span style={{fontSize:9,color:"#000",fontWeight:800}}>✓</span>}</button><span style={{fontSize:13,fontWeight:500,color:T.text,flex:1,textDecoration:sub.done?"line-through":"none",opacity:sub.done?.5:1,lineHeight:1.4}}>{sub.title}</span><div style={{display:"flex",alignItems:"center",justifyContent:"center",width:26,height:26,color:T.dim,cursor:"grab",touchAction:"none",flexShrink:0}} onTouchStart={e=>{e.stopPropagation();subDragStart(sub.id,e.touches[0].clientY)}} onTouchMove={e=>{if(subDragId===sub.id){e.stopPropagation();subDragMove(e.touches[0].clientY)}}} onTouchEnd={e=>{e.stopPropagation();subDragEnd()}} onClick={e=>e.stopPropagation()}><Grip/></div><button style={{background:"none",border:"none",color:T.dim,fontSize:12,cursor:"pointer",padding:4}} onClick={e=>{e.stopPropagation();onUpdateSubtasks(subs.filter(s=>s.id!==sub.id))}}>✕</button></div>)}
{(showSubInput||hs)?<div className="ne" style={{display:"flex",gap:6,marginTop:6}}><input style={{flex:1,padding:"8px 10px",background:T.memo,border:"1px solid "+T.brd,borderRadius:6,color:T.text,fontSize:13,outline:"none",minWidth:0}} placeholder="サブタスク追加..." value={ns} onChange={e=>setNs(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"){e.stopPropagation();addS()}}} onClick={e=>e.stopPropagation()}/><button style={{width:30,height:30,borderRadius:6,border:"1px solid "+T.brd,background:T.cOff,color:T.sub,fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}} onClick={e=>{e.stopPropagation();addS()}}>+</button></div>
:<button className="ne" style={{marginTop:4,padding:"5px 10px",borderRadius:6,border:"1px solid "+T.brd,background:"transparent",color:T.sub,fontSize:11,fontWeight:600,cursor:"pointer"}} onClick={e=>{e.stopPropagation();setShowSubInput(true)}}>+ サブタスク</button>}
</div>
{/* Memo editor (moved below subtasks) */}
<div className="ne" style={{marginTop:12}} onClick={e=>e.stopPropagation()}>
<div style={{fontSize:10,fontWeight:700,color:T.sub,textTransform:"uppercase",letterSpacing:1,marginBottom:5,fontFamily:"'JetBrains Mono',monospace"}}>メモ</div>
<textarea style={{width:"100%",padding:10,background:T.memo,border:"1px solid "+T.memB,borderRadius:6,color:T.text,fontSize:13,lineHeight:1.6,outline:"none",minHeight:50,resize:"vertical",fontFamily:"inherit"}} placeholder="メモ..." value={task.memo||""} onChange={e=>onUpdateMemo(e.target.value)}/>
</div>
{/* Edit/Delete buttons moved to bottom right */}
<div style={{display:"flex",justifyContent:"flex-end",gap:6,marginTop:12}}>
<button className="ne" style={{padding:"5px 12px",borderRadius:6,border:"1px solid "+T.brd,background:"transparent",color:T.sub,fontSize:11,fontWeight:600,cursor:"pointer"}} onClick={e=>{e.stopPropagation();onEdit()}}>✏️ 編集</button>
<button className="ne" style={{padding:"5px 12px",borderRadius:6,border:"1px solid rgba(255,59,48,0.3)",background:"transparent",color:"#ff3b30",fontSize:11,fontWeight:600,cursor:"pointer"}} onClick={e=>{e.stopPropagation();onDelete()}}>🗑</button>
</div>
</div>}
</div>

  </div>)
}