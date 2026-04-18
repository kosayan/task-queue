import { useState, useEffect, useCallback, useMemo, useRef } from “react”;

const APP_VERSION = “2.6.0”;
const IMPORTANCE = [{ value: 3, label: “高”, color: “#ff3b30” }, { value: 2, label: “中”, color: “#ff9500” }, { value: 1, label: “低”, color: “#8e8e93” }];
const WEIGHT_INFO = [{ value: 3, label: “重い”, hours: “4h+”, barWidth: 6, barHeight: 100 }, { value: 2, label: “普通”, hours: “1-4h”, barWidth: 4, barHeight: 75 }, { value: 1, label: “軽い”, hours: “~1h”, barWidth: 3, barHeight: 55 }, { value: 0, label: “超軽い”, hours: “~10m”, barWidth: 2, barHeight: 40 }];
const RECURRENCE = [{ value: “none”, label: “なし” }, { value: “daily”, label: “毎日” }, { value: “weekly”, label: “毎週” }, { value: “monthly”, label: “毎月” }];
const SORT_OPTIONS = [{ value: “smart”, label: “スマート順” }, { value: “deadline”, label: “締切順” }, { value: “heavy”, label: “重い順” }, { value: “light”, label: “軽い順” }, { value: “created”, label: “作成日順” }];

const THEMES = {
dark: { bg: “#0a0a0a”, card: “#111”, text: “#fff”, textSub: “#aaa”, textMuted: “#888”, textDim: “#555”, border: “#333”, borderLight: “#2a2a2a”, inputBg: “#1a1a1a”, chipOff: “#1a1a1a”, chipOffText: “#888”, chipOn: “#fff”, chipOnText: “#000”, iconBg: “#1a1a1a”, iconBorder: “#333”, iconColor: “#ccc”, filterBorder: “#444”, filterOffText: “#999”, modalBg: “rgba(0,0,0,0.7)”, toastBg: “#1a1a1a”, memoOverlay: “#0a0a0a”, memoBorder: “#2a2a2a”, shadow: “rgba(0,0,0,0.4)”, checkBorder: “#555”, addBorder: “#555”, addColor: “#aaa”, scheme: “dark” },
light: { bg: “#f8f7f4”, card: “#fff”, text: “#222”, textSub: “#666”, textMuted: “#999”, textDim: “#bbb”, border: “#d5d3ce”, borderLight: “#e5e3de”, inputBg: “#f0efec”, chipOff: “#f0efec”, chipOffText: “#888”, chipOn: “#222”, chipOnText: “#fff”, iconBg: “#fff”, iconBorder: “#ddd”, iconColor: “#666”, filterBorder: “#d5d3ce”, filterOffText: “#888”, modalBg: “rgba(0,0,0,0.4)”, toastBg: “#fff”, memoOverlay: “#f0efec”, memoBorder: “#e0e0e0”, shadow: “rgba(0,0,0,0.06)”, checkBorder: “#ccc”, addBorder: “#ccc”, addColor: “#999”, scheme: “light” }
};

function getRoiColor(imp, w) {
const k = imp + “-” + (w >= 3 ? 3 : w >= 2 ? 2 : w >= 1 ? 1 : 0);
return { “3-3”:”#f97316”,“3-2”:”#eab308”,“3-1”:”#22c55e”,“3-0”:”#22c55e”,“2-3”:”#3b82f6”,“2-2”:”#06b6d4”,“2-1”:”#14b8a6”,“2-0”:”#14b8a6”,“1-3”:”#a855f7”,“1-2”:”#c084fc”,“1-1”:”#67e8f9”,“1-0”:”#67e8f9” }[k] || “#555”;
}

function calcPriorityScore(task) {
if (task.done) return -999; if (task.type === “wish”) return -500;
if (!task.deadline) return task.importance * 15 + task.weight * 5 + 5;
const hoursLeft = (new Date(task.deadline).getTime() - Date.now()) / 3600000;
if (hoursLeft < 0) return 1000 + task.importance * 10;
const wh = task.weight === 3 ? 6 : task.weight === 2 ? 3 : task.weight === 1 ? 1 : 0.2;
const br = hoursLeft / Math.max(wh, 0.1);
let u; if (br < 1) u = 100; else if (br < 2) u = 80; else if (br < 5) u = 60; else if (br < 24) u = 30; else u = Math.max(5, 20 - br * 0.1);
return u * 0.5 + task.importance * 15 + task.weight * 5;
}
function getUrgencyBand(task) { if (task.done) return 5; if (task.type === “wish”) return 6; const s = calcPriorityScore(task); if (s >= 1000) return 0; if (s >= 80) return 1; if (s >= 60) return 2; if (s >= 40) return 3; return 4; }
function getScoreLabel(s) { if (s >= 1000) return { text: “OVERDUE”, color: “#ff3b30” }; if (s >= 80) return { text: “NOW”, color: “#ff3b30” }; if (s >= 60) return { text: “SOON”, color: “#ff9500” }; if (s >= 40) return { text: “NEXT”, color: “#ffcc00” }; return { text: “LATER”, color: “#8e8e93” }; }
function formatDeadline(d) { if (!d) return “期限なし”; const diff = new Date(d) - new Date(); const tm = Math.round(diff / 60000); if (tm < 0) return “overdue”; if (tm < 60) return tm + “m”; const h = Math.floor(tm / 60), m = tm % 60; if (h < 24) return m > 0 ? h + “h “ + m + “m” : h + “h”; const dd = Math.floor(h / 24), hh = h % 24; if (dd < 7) return hh > 0 ? dd + “d “ + hh + “h” : dd + “d”; const dl = new Date(d); return (dl.getMonth() + 1) + “/” + dl.getDate(); }
function getDefaultDeadline() { const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(18, 0, 0, 0); return d.toISOString().slice(0, 16); }
function advanceRecurrence(dl, rec) { if (!dl || rec === “none” || !rec) return dl; const d = new Date(dl); if (rec === “daily”) d.setDate(d.getDate() + 1); else if (rec === “weekly”) d.setDate(d.getDate() + 7); else if (rec === “monthly”) d.setMonth(d.getMonth() + 1); return d.toISOString().slice(0, 16); }

const STORAGE_KEY = “task-queue-v1”, SORT_KEY = “task-queue-sort”, DEFAULTS_KEY = “task-queue-defaults”, THEME_KEY = “task-queue-theme”;
const DEFAULT_DEFAULTS = { importance: 2, weight: 2, hasDeadline: true, recurrence: “none”, location: “” };
function loadTasks() { try { const r = localStorage.getItem(STORAGE_KEY); return r ? JSON.parse(r) : []; } catch { return []; } }
function saveTasks(t) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(t)); } catch {} }
function loadDefaults() { try { const r = localStorage.getItem(DEFAULTS_KEY); return r ? { …DEFAULT_DEFAULTS, …JSON.parse(r) } : DEFAULT_DEFAULTS; } catch { return DEFAULT_DEFAULTS; } }
function saveDefaults(d) { try { localStorage.setItem(DEFAULTS_KEY, JSON.stringify(d)); } catch {} }

const RefreshIcon = () => (<svg viewBox=“0 0 24 24” fill=“none” stroke=“currentColor” strokeWidth=“2” strokeLinecap=“round” strokeLinejoin=“round” style={{ width: 18, height: 18 }}><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" /></svg>);

export default function App() {
const [tasks, setTasks] = useState(() => loadTasks());
const [showForm, setShowForm] = useState(false); const [showWishForm, setShowWishForm] = useState(false);
const [title, setTitle] = useState(””); const [importance, setImportance] = useState(2); const [weight, setWeight] = useState(2);
const [deadline, setDeadline] = useState(getDefaultDeadline()); const [hasDeadline, setHasDeadline] = useState(true);
const [memo, setMemo] = useState(””); const [location, setLocation] = useState(””); const [recurrence, setRecurrence] = useState(“none”);
const [filter, setFilter] = useState(“all”); const [locationFilter, setLocationFilter] = useState(null);
const [editId, setEditId] = useState(null); const [expandedId, setExpandedId] = useState(null);
const [sortOrder, setSortOrder] = useState(() => localStorage.getItem(SORT_KEY) || “smart”);
const [searchQuery, setSearchQuery] = useState(””); const [showSearch, setShowSearch] = useState(false);
const [showSettings, setShowSettings] = useState(false); const [focusMode, setFocusMode] = useState(false);
const [undoData, setUndoData] = useState(null); const [defaults, setDefaults] = useState(() => loadDefaults());
const [wishTitle, setWishTitle] = useState(””); const [wishMemo, setWishMemo] = useState(””);
const [isDark, setIsDark] = useState(() => (localStorage.getItem(THEME_KEY) || “dark”) === “dark”);
const undoTimerRef = useRef(null); const fileInputRef = useRef(null);
const T = isDark ? THEMES.dark : THEMES.light;

useEffect(() => { saveTasks(tasks); }, [tasks]);
useEffect(() => { localStorage.setItem(SORT_KEY, sortOrder); }, [sortOrder]);
useEffect(() => { saveDefaults(defaults); }, [defaults]);
useEffect(() => { localStorage.setItem(THEME_KEY, isDark ? “dark” : “light”); document.body.style.background = T.bg; }, [isDark, T.bg]);

const updateSubtasks = useCallback((id, subs) => { setTasks(p => p.map(t => t.id === id ? { …t, subtasks: subs } : t)); }, []);
const pastLocations = useMemo(() => { const s = new Set(); tasks.forEach(t => { if (t.location) s.add(t.location); }); return Array.from(s); }, [tasks]);
const resetForm = useCallback(() => { setTitle(””); setImportance(defaults.importance); setWeight(defaults.weight); setDeadline(getDefaultDeadline()); setHasDeadline(defaults.hasDeadline); setMemo(””); setLocation(defaults.location); setRecurrence(defaults.recurrence); setShowForm(false); setEditId(null); }, [defaults]);

const handleSubmit = useCallback(() => {
if (!title.trim()) return;
if (editId) { setTasks(p => p.map(t => t.id === editId ? { …t, title: title.trim(), importance, weight, deadline: hasDeadline ? deadline : null, memo: memo.trim(), location: location.trim(), recurrence } : t)); }
else { setTasks(p => […p, { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), title: title.trim(), importance, weight, deadline: hasDeadline ? deadline : null, memo: memo.trim(), location: location.trim(), recurrence, done: false, createdAt: Date.now(), type: “task” }]); }
resetForm();
}, [title, importance, weight, deadline, hasDeadline, memo, location, recurrence, editId, resetForm]);

const handleWishSubmit = useCallback(() => {
if (!wishTitle.trim()) return;
setTasks(p => […p, { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), title: wishTitle.trim(), memo: wishMemo.trim(), done: false, createdAt: Date.now(), type: “wish”, importance: 1, weight: 1 }]);
setWishTitle(””); setWishMemo(””); setShowWishForm(false);
}, [wishTitle, wishMemo]);

const showUndoToast = useCallback((ts, action) => { if (undoTimerRef.current) clearTimeout(undoTimerRef.current); setUndoData({ tasks: ts, action }); undoTimerRef.current = setTimeout(() => setUndoData(null), 5000); }, []);
const toggleDone = useCallback((id) => { setTasks(prev => { const task = prev.find(t => t.id === id); if (!task) return prev; if (!task.done && task.recurrence && task.recurrence !== “none” && task.deadline) { const nt = { …task, id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), deadline: advanceRecurrence(task.deadline, task.recurrence), done: false, createdAt: Date.now() }; return prev.map(t => t.id === id ? { …t, done: true } : t).concat(nt); } return prev.map(t => t.id === id ? { …t, done: !t.done } : t); }); }, []);
const deleteTask = useCallback((id) => { const t = tasks.find(x => x.id === id); if (!t) return; showUndoToast([t], “delete”); setTasks(p => p.filter(x => x.id !== id)); if (expandedId === id) setExpandedId(null); }, [tasks, expandedId, showUndoToast]);
const handleUndo = useCallback(() => { if (!undoData) return; if (undoData.action === “delete”) setTasks(p => […p, …undoData.tasks]); setUndoData(null); if (undoTimerRef.current) clearTimeout(undoTimerRef.current); }, [undoData]);
const startEdit = useCallback((t) => { setTitle(t.title); setImportance(t.importance); setWeight(t.weight); setDeadline(t.deadline || getDefaultDeadline()); setHasDeadline(!!t.deadline); setMemo(t.memo || “”); setLocation(t.location || “”); setRecurrence(t.recurrence || “none”); setEditId(t.id); setShowForm(true); setExpandedId(null); }, []);
const handleExport = useCallback(() => { const b = new Blob([JSON.stringify(tasks, null, 2)], { type: “application/json” }); const u = URL.createObjectURL(b); const a = document.createElement(“a”); a.href = u; a.download = “task-queue-” + new Date().toISOString().slice(0, 10) + “.json”; a.click(); URL.revokeObjectURL(u); }, [tasks]);
const handleImportClick = useCallback(() => { fileInputRef.current?.click(); }, []);
const handleImportFile = useCallback((e) => { const f = e.target.files?.[0]; if (!f) return; const r = new FileReader(); r.onload = (ev) => { try { const imp = JSON.parse(ev.target.result); if (!Array.isArray(imp)) throw 0; const choice = confirm(“OK = 上書き / キャンセル = 追加”); if (choice) { setTasks(imp); } else { const ids = new Set(tasks.map(t => t.id)); setTasks(p => […p, …imp.filter(t => !ids.has(t.id))]); } } catch { alert(“インポートに失敗しました。”); } }; r.readAsText(f); e.target.value = “”; }, [tasks]);

const sorted = useMemo(() => {
let r = tasks.map(t => ({ …t, score: calcPriorityScore(t), band: getUrgencyBand(t) }));
if (filter === “active”) r = r.filter(t => !t.done && t.deadline && t.type !== “wish”);
else if (filter === “done”) r = r.filter(t => t.done);
else if (filter === “noDeadline”) r = r.filter(t => !t.done && !t.deadline && t.type !== “wish”);
else if (filter === “wish”) r = r.filter(t => t.type === “wish” && !t.done);
else r = r.filter(t => !t.done);
if (locationFilter !== null) r = r.filter(t => (t.location || “”) === locationFilter);
if (searchQuery.trim()) { const q = searchQuery.toLowerCase(); r = r.filter(t => t.title.toLowerCase().includes(q) || (t.memo || “”).toLowerCase().includes(q) || (t.location || “”).toLowerCase().includes(q)); }
if (sortOrder === “smart”) r.sort((a, b) => { if (a.band !== b.band) return a.band - b.band; if (a.weight !== b.weight) return a.weight - b.weight; return b.importance - a.importance; });
else if (sortOrder === “deadline”) r.sort((a, b) => { if (!a.deadline && !b.deadline) return 0; if (!a.deadline) return 1; if (!b.deadline) return -1; return new Date(a.deadline) - new Date(b.deadline); });
else if (sortOrder === “heavy”) r.sort((a, b) => b.weight - a.weight);
else if (sortOrder === “light”) r.sort((a, b) => a.weight - b.weight);
else if (sortOrder === “created”) r.sort((a, b) => b.createdAt - a.createdAt);
return r;
}, [tasks, filter, locationFilter, searchQuery, sortOrder]);

const topTask = useMemo(() => {
const a = tasks.filter(t => !t.done && t.type !== “wish”).map(t => ({ …t, score: calcPriorityScore(t), band: getUrgencyBand(t) }));
a.sort((x, y) => { if (x.band !== y.band) return x.band - y.band; if (x.weight !== y.weight) return x.weight - y.weight; return y.importance - x.importance; }); return a[0];
}, [tasks]);

const gcss = “@ import url(‘https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700;800&family=Noto+Sans+JP:wght@400;500;700;900&display=swap’);*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}html,body,#root{min-height:100vh}input,select,button,textarea{font-family:‘Noto Sans JP’,sans-serif}@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}@keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}@keyframes slideDown{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}.task-card{animation:fadeIn 0.3s ease both}.btn-hover:hover,.btn-icon:hover,.btn-add:hover{filter:brightness(1.1)}.btn-add:hover{border-color:#ff3b30!important;color:#ff3b30!important}.chip:hover{filter:brightness(1.1)}.overdue-pulse{animation:pulse 1.5s ease infinite}.form-slide{animation:slideUp 0.3s ease both}”.replace(”@ import”, “@import”);

if (focusMode && topTask) {
const label = getScoreLabel(topTask.score); const rc = getRoiColor(topTask.importance, topTask.weight); const wi = WEIGHT_INFO.find(w => w.value === topTask.weight);
return (<div style={{ minHeight: “100vh”, background: T.bg, color: T.text, display: “flex”, alignItems: “center”, justifyContent: “center”, padding: “calc(24px + env(safe-area-inset-top)) 24px”, position: “relative”, fontFamily: “‘Noto Sans JP’, sans-serif” }} onClick={() => setFocusMode(false)}><style>{gcss}</style><button style={{ position: “absolute”, top: “calc(20px + env(safe-area-inset-top))”, right: 20, width: 44, height: 44, borderRadius: “50%”, background: T.card, border: “1px solid “ + T.border, color: T.textMuted, fontSize: 18, cursor: “pointer”, display: “flex”, alignItems: “center”, justifyContent: “center” }} onClick={() => setFocusMode(false)}>✕</button><div style={{ textAlign: “center”, maxWidth: 500 }} onClick={e => e.stopPropagation()}><div style={{ display: “inline-block”, fontFamily: “‘JetBrains Mono’, monospace”, fontSize: 12, fontWeight: 700, letterSpacing: 2, padding: “6px 16px”, borderRadius: 8, border: “1px solid “ + label.color + “66”, color: label.color, marginBottom: 32 }}>{label.text}</div><div style={{ fontSize: 36, fontWeight: 900, color: T.text, marginBottom: 24, lineHeight: 1.3 }}>{topTask.title}</div><div style={{ fontSize: 16, color: T.textSub, marginBottom: 12 }}><span style={{ color: IMPORTANCE.find(x => x.value === topTask.importance)?.color, fontWeight: 700 }}>{IMPORTANCE.find(x => x.value === topTask.importance)?.label}</span><span style={{ opacity: 0.3, margin: “0 10px” }}>·</span><span style={{ color: rc, fontWeight: 700 }}>{wi?.label}</span><span style={{ opacity: 0.3, margin: “0 10px” }}>·</span><span>{formatDeadline(topTask.deadline)}</span></div>{topTask.location && <div style={{ fontSize: 14, color: T.textMuted, marginBottom: 12 }}>📍 {topTask.location}</div>}{topTask.memo && <div style={{ fontSize: 14, color: T.textSub, background: T.card, borderRadius: 12, padding: 16, marginTop: 24, whiteSpace: “pre-wrap”, textAlign: “left”, lineHeight: 1.6 }}>{topTask.memo}</div>}<button style={{ marginTop: 48, padding: “16px 48px”, background: “#ff3b30”, border: “none”, borderRadius: 12, color: “#fff”, fontSize: 16, fontWeight: 700, cursor: “pointer”, letterSpacing: 1 }} onClick={() => { toggleDone(topTask.id); setFocusMode(false); }}>完了する</button></div></div>);
}

const isWish = filter === “wish”;
const s = makeStyles(T);

return (<div style={s.root}><style>{gcss + “ html,body,#root{background:” + T.bg + “}”}</style>
<div style={s.header}><div><h1 style={s.logo}><span style={{ color: “#ff3b30” }}>▌</span>TASK QUEUE</h1><p style={s.sub}>{tasks.filter(t => !t.done && t.type !== “wish”).length} active<span style={{ opacity: 0.3, margin: “0 8px” }}>|</span>{tasks.filter(t => t.done).length} done</p></div>
<div style={{ display: “flex”, gap: 5 }}><button className=“btn-icon” style={s.iconBtn} onClick={() => setShowSearch(v => !v)}>{showSearch ? “✕” : “🔍”}</button><button className=“btn-icon” style={s.iconBtn} onClick={() => window.location.reload()}><RefreshIcon /></button><button className=“btn-icon” style={s.iconBtn} onClick={() => setIsDark(v => !v)}>{isDark ? “☀️” : “🌙”}</button><button className=“btn-icon” style={s.iconBtn} onClick={() => setShowSettings(true)}>⚙</button></div></div>

```
{showSearch && <input className="form-slide" style={{ ...s.input, marginBottom: 12 }} placeholder="検索（タスク・メモ・場所）..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} autoFocus />}

{topTask && !showForm && !showWishForm && !searchQuery && locationFilter === null && !isWish && (
  <div style={{ ...s.topBanner, borderColor: getScoreLabel(topTask.score).color, cursor: "pointer" }} onClick={() => setFocusMode(true)}>
    <div style={s.topLabel}><span style={{ color: getScoreLabel(topTask.score).color, fontFamily: "JetBrains Mono" }}>● 今やるべきタスク</span><span style={{ color: T.textDim, fontSize: 9, marginLeft: 8 }}>TAP TO FOCUS</span></div>
    <div style={s.topTitle}>{topTask.title}</div>
    <div style={s.topMeta}><span>{formatDeadline(topTask.deadline)}</span><span style={{ opacity: 0.3 }}>|</span><span>スコア {Math.round(topTask.score)}</span></div>
  </div>
)}

<div style={s.filterRow}>
  {[{ key: "all", label: "すべて" }, { key: "noDeadline", label: "期限なし" }, { key: "active", label: "アクティブ" }, { key: "wish", label: "やりたい" }, { key: "done", label: "完了" }].map(f => (
    <button key={f.key} className="chip" style={{ ...s.filterChip, background: filter === f.key && locationFilter === null ? T.chipOn : "transparent", color: filter === f.key && locationFilter === null ? T.chipOnText : T.filterOffText }} onClick={() => { setFilter(f.key); setLocationFilter(null); }}>{f.label}</button>
  ))}
</div>

{pastLocations.length > 0 && !isWish && (<div style={s.locationFilterRow}><span style={{ fontSize: 13, color: T.textMuted, marginRight: 4 }}>📍</span>{pastLocations.map(loc => (<button key={loc} className="chip" style={{ ...s.filterChip, background: locationFilter === loc ? T.chipOn : "transparent", color: locationFilter === loc ? T.chipOnText : T.filterOffText }} onClick={() => setLocationFilter(locationFilter === loc ? null : loc)}>{loc}</button>))}</div>)}

{!showForm && !showWishForm && !isWish && <button className="btn-add" style={s.addBtn} onClick={() => { resetForm(); setShowForm(true); }}><span style={{ fontSize: 18, fontWeight: 300 }}>+</span><span>新しいタスク</span></button>}
{!showForm && !showWishForm && isWish && <button className="btn-add" style={s.addBtn} onClick={() => setShowWishForm(true)}><span style={{ fontSize: 18, fontWeight: 300 }}>+</span><span>やりたいことを追加</span></button>}

{showWishForm && (<div className="form-slide" style={s.form}><div style={s.formHeader}><span style={s.formTitle}>やりたいこと</span><button style={s.closeBtn} onClick={() => { setShowWishForm(false); setWishTitle(""); setWishMemo(""); }}>✕</button></div><input style={s.input} placeholder="やりたいこと..." value={wishTitle} onChange={e => setWishTitle(e.target.value)} autoFocus onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleWishSubmit()} /><div style={s.fieldGroup}><label style={s.fieldLabel}>メモ（任意）</label><textarea style={{ ...s.input, minHeight: 60, resize: "vertical", fontFamily: "inherit" }} placeholder="詳細やメモ..." value={wishMemo} onChange={e => setWishMemo(e.target.value)} /></div><button className="btn-hover" style={s.submitBtn} onClick={handleWishSubmit}>追加する</button></div>)}

{showForm && (<div className="form-slide" style={s.form}><div style={s.formHeader}><span style={s.formTitle}>{editId ? "タスク編集" : "新しいタスク"}</span><button style={s.closeBtn} onClick={resetForm}>✕</button></div>
  <input style={s.input} placeholder="タスク名..." value={title} onChange={e => setTitle(e.target.value)} autoFocus onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSubmit()} />
  <div style={s.fieldGroup}><label style={s.fieldLabel}>重要度</label><div style={s.chipRow}>{IMPORTANCE.map(o => (<button key={o.value} className="chip" style={{ ...s.chip, background: importance === o.value ? o.color : T.chipOff, color: importance === o.value ? "#fff" : T.chipOffText, borderColor: importance === o.value ? o.color : T.border }} onClick={() => setImportance(o.value)}>{o.label}</button>))}</div></div>
  <div style={s.fieldGroup}><label style={s.fieldLabel}>タスクの重さ</label><div style={s.chipRow}>{WEIGHT_INFO.map(o => { const c = getRoiColor(importance, o.value); return (<button key={o.value} className="chip" style={{ ...s.chip, background: weight === o.value ? c : T.chipOff, color: weight === o.value ? "#000" : T.chipOffText, borderColor: weight === o.value ? c : T.border, fontWeight: weight === o.value ? 700 : 600 }} onClick={() => setWeight(o.value)}>{o.label}<span style={{ fontSize: 10, opacity: 0.6, marginLeft: 4 }}>{o.hours}</span></button>); })}</div></div>
  <div style={s.fieldGroup}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}><label style={{ ...s.fieldLabel, marginBottom: 0 }}>締切</label><button className="chip" style={{ ...s.chip, padding: "4px 12px", fontSize: 11, background: hasDeadline ? T.chipOff : T.chipOn, color: hasDeadline ? T.chipOffText : T.chipOnText, borderColor: hasDeadline ? T.border : T.chipOn }} onClick={() => setHasDeadline(v => !v)}>{hasDeadline ? "なしに変更" : "期限なし"}</button></div>{hasDeadline && <input type="datetime-local" style={{ ...s.input, colorScheme: T.scheme }} value={deadline} onChange={e => setDeadline(e.target.value)} />}</div>
  {hasDeadline && <div style={s.fieldGroup}><label style={s.fieldLabel}>繰り返し</label><div style={s.chipRow}>{RECURRENCE.map(o => (<button key={o.value} className="chip" style={{ ...s.chip, background: recurrence === o.value ? T.chipOn : T.chipOff, color: recurrence === o.value ? T.chipOnText : T.chipOffText, borderColor: recurrence === o.value ? T.chipOn : T.border }} onClick={() => setRecurrence(o.value)}>{o.label}</button>))}</div></div>}
  <div style={s.fieldGroup}><label style={s.fieldLabel}>場所（任意）</label><input style={s.input} placeholder="例: 自宅、オフィス" value={location} onChange={e => setLocation(e.target.value)} list="pl" /><datalist id="pl">{pastLocations.map(l => <option key={l} value={l} />)}</datalist>{pastLocations.length > 0 && <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6 }}>{pastLocations.map(l => (<button key={l} className="chip" style={{ ...s.chip, padding: "4px 10px", fontSize: 11, background: location === l ? T.chipOn : T.chipOff, color: location === l ? T.chipOnText : T.chipOffText, borderColor: location === l ? T.chipOn : T.border }} onClick={() => setLocation(l)}>{l}</button>))}</div>}</div>
  <div style={s.fieldGroup}><label style={s.fieldLabel}>メモ（任意）</label><textarea style={{ ...s.input, minHeight: 80, resize: "vertical", fontFamily: "inherit" }} placeholder="詳細やメモ..." value={memo} onChange={e => setMemo(e.target.value)} /></div>
  <button className="btn-hover" style={s.submitBtn} onClick={handleSubmit}>{editId ? "更新する" : "追加する"}</button>
</div>)}

<div style={s.list}>
  {sorted.length === 0 && <div style={s.empty}>{searchQuery ? "検索結果なし" : filter === "done" ? "完了タスクなし" : filter === "noDeadline" ? "期限なしタスクなし" : filter === "wish" ? "やりたいことを追加しましょう" : "タスクを追加しましょう"}</div>}
  {sorted.map(task => <TaskCard key={task.id} task={task} T={T} expanded={expandedId === task.id} onToggleExpand={() => setExpandedId(expandedId === task.id ? null : task.id)} onToggleDone={() => toggleDone(task.id)} onEdit={() => startEdit(task)} onDelete={() => deleteTask(task.id)} onUpdateSubtasks={subs => updateSubtasks(task.id, subs)} />)}
</div>

{showSettings && (<div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: T.modalBg, zIndex: 100, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "60px 16px 20px", overflowY: "auto" }} onClick={() => setShowSettings(false)}><div style={{ background: T.card, border: "1px solid " + T.border, borderRadius: 16, padding: 20, width: "100%", maxWidth: 500 }} onClick={e => e.stopPropagation()}>
  <div style={s.formHeader}><span style={s.formTitle}>設定</span><button style={s.closeBtn} onClick={() => setShowSettings(false)}>✕</button></div>
  <div style={s.fieldGroup}><label style={s.fieldLabel}>ソート順</label><div style={{ ...s.chipRow, flexDirection: "column", gap: 6 }}>{SORT_OPTIONS.map(o => (<button key={o.value} className="chip" style={{ ...s.chip, width: "100%", justifyContent: "flex-start", background: sortOrder === o.value ? T.chipOn : T.chipOff, color: sortOrder === o.value ? T.chipOnText : T.chipOffText, borderColor: sortOrder === o.value ? T.chipOn : T.border }} onClick={() => setSortOrder(o.value)}>{o.label}</button>))}</div></div>
  <div style={{ ...s.fieldGroup, borderTop: "1px solid " + T.border, paddingTop: 16 }}><label style={{ ...s.fieldLabel, fontSize: 12, color: T.textSub, marginBottom: 14 }}>タスクのデフォルト値</label>
    <div style={s.fieldGroup}><label style={s.fieldLabel}>重要度</label><div style={s.chipRow}>{IMPORTANCE.map(o => (<button key={o.value} className="chip" style={{ ...s.chip, background: defaults.importance === o.value ? o.color : T.chipOff, color: defaults.importance === o.value ? "#fff" : T.chipOffText, borderColor: defaults.importance === o.value ? o.color : T.border }} onClick={() => setDefaults(d => ({ ...d, importance: o.value }))}>{o.label}</button>))}</div></div>
    <div style={s.fieldGroup}><label style={s.fieldLabel}>重さ</label><div style={s.chipRow}>{WEIGHT_INFO.map(o => { const c = getRoiColor(defaults.importance, o.value); return (<button key={o.value} className="chip" style={{ ...s.chip, background: defaults.weight === o.value ? c : T.chipOff, color: defaults.weight === o.value ? "#000" : T.chipOffText, borderColor: defaults.weight === o.value ? c : T.border }} onClick={() => setDefaults(d => ({ ...d, weight: o.value }))}>{o.label}</button>); })}</div></div>
    <div style={s.fieldGroup}><label style={s.fieldLabel}>締切</label><div style={s.chipRow}>{[{ value: true, label: "あり" }, { value: false, label: "なし" }].map(o => (<button key={String(o.value)} className="chip" style={{ ...s.chip, background: defaults.hasDeadline === o.value ? T.chipOn : T.chipOff, color: defaults.hasDeadline === o.value ? T.chipOnText : T.chipOffText, borderColor: defaults.hasDeadline === o.value ? T.chipOn : T.border }} onClick={() => setDefaults(d => ({ ...d, hasDeadline: o.value }))}>{o.label}</button>))}</div></div>
    <div style={s.fieldGroup}><label style={s.fieldLabel}>繰り返し</label><div style={s.chipRow}>{RECURRENCE.map(o => (<button key={o.value} className="chip" style={{ ...s.chip, background: defaults.recurrence === o.value ? T.chipOn : T.chipOff, color: defaults.recurrence === o.value ? T.chipOnText : T.chipOffText, borderColor: defaults.recurrence === o.value ? T.chipOn : T.border }} onClick={() => setDefaults(d => ({ ...d, recurrence: o.value }))}>{o.label}</button>))}</div></div>
  </div>
  <div style={s.fieldGroup}><label style={s.fieldLabel}>データ</label><div style={{ display: "flex", gap: 8 }}><button className="btn-hover" style={{ ...s.submitBtn, background: T.chipOff, border: "1px solid " + T.border, color: T.text, marginTop: 0 }} onClick={handleExport}>エクスポート</button><button className="btn-hover" style={{ ...s.submitBtn, background: T.chipOff, border: "1px solid " + T.border, color: T.text, marginTop: 0 }} onClick={handleImportClick}>インポート</button><input ref={fileInputRef} type="file" accept="application/json" style={{ display: "none" }} onChange={handleImportFile} /></div></div>
</div></div>)}

{undoData && <div className="form-slide" style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", background: T.toastBg, border: "1px solid " + T.border, borderRadius: 10, padding: "12px 18px", display: "flex", alignItems: "center", gap: 16, fontSize: 13, color: T.textSub, zIndex: 200 }}><span>タスクを削除しました</span><button style={{ background: "none", border: "none", color: "#ff3b30", fontWeight: 700, cursor: "pointer", fontSize: 13 }} onClick={handleUndo}>元に戻す</button></div>}
<div style={{ position: "fixed", bottom: 6, right: 10, fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: T.textDim, userSelect: "none", pointerEvents: "none" }}>v{APP_VERSION}</div>
```

  </div>);
}

function TaskCard({ task, T, expanded, onToggleExpand, onToggleDone, onEdit, onDelete, onUpdateSubtasks }) {
const isWish = task.type === “wish”;
const label = isWish ? { text: “WISH”, color: “#c084fc” } : getScoreLabel(task.score);
const isOD = task.score >= 1000;
const rc = isWish ? “#c084fc” : getRoiColor(task.importance, task.weight);
const wi = WEIGHT_INFO.find(w => w.value === task.weight);
const imp = IMPORTANCE.find(x => x.value === task.importance);
const [ns, setNs] = useState(””);
const subs = task.subtasks || []; const sd = subs.filter(s => s.done).length; const hs = subs.length > 0;
const addS = () => { if (!ns.trim()) return; onUpdateSubtasks([…subs, { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 4), title: ns.trim(), done: false }]); setNs(””); };
const togS = (id) => onUpdateSubtasks(subs.map(s => s.id === id ? { …s, done: !s.done } : s));
const delS = (id) => onUpdateSubtasks(subs.filter(s => s.id !== id));
const tsx = useRef(0); const tsy = useRef(0); const [so, setSo] = useState(0); const [sw, setSw] = useState(false);
const ts = e => { tsx.current = e.touches[0].clientX; tsy.current = e.touches[0].clientY; };
const tm = e => { const dx = e.touches[0].clientX - tsx.current; if (Math.abs(dx) > 10 && Math.abs(e.touches[0].clientY - tsy.current) < 30) { setSw(true); setSo(dx); } };
const te = () => { if (so > 100) onToggleDone(); else if (so < -100) onDelete(); setSo(0); setTimeout(() => setSw(false), 100); };

return (<div style={{ position: “relative”, overflow: “hidden”, borderRadius: 12 }}>
{so > 20 && <div style={{ position: “absolute”, top: 0, left: 0, right: 0, bottom: 0, display: “flex”, alignItems: “center”, borderRadius: 12, background: “rgba(74,222,128,0.2)”, justifyContent: “flex-start”, paddingLeft: 20, fontSize: 14 }}><span style={{ color: “#4ade80”, fontWeight: 700 }}>✓ 完了</span></div>}
{so < -20 && <div style={{ position: “absolute”, top: 0, left: 0, right: 0, bottom: 0, display: “flex”, alignItems: “center”, borderRadius: 12, background: “rgba(255,59,48,0.2)”, justifyContent: “flex-end”, paddingRight: 20, fontSize: 14 }}><span style={{ color: “#ff3b30”, fontWeight: 700 }}>削除 ✕</span></div>}
<div className=“task-card” style={{ background: T.card, borderRadius: 12, padding: “12px 14px 12px 22px”, transition: sw ? “none” : “all 0.2s”, cursor: “pointer”, position: “relative”, display: “flex”, width: “100%”, opacity: task.done ? 0.4 : 1, flexDirection: expanded ? “column” : “row”, alignItems: expanded ? “stretch” : “center”, transform: “translateX(” + so + “px)”, border: “1px solid “ + rc + “40”, boxShadow: “0 0 10px “ + rc + “1a, 0 1px 3px “ + T.shadow }} onClick={e => { if (sw) return; if (e.target.closest(”.ne”)) return; onToggleExpand(); }} onTouchStart={ts} onTouchMove={tm} onTouchEnd={te}>
{!isWish && <div style={{ position: “absolute”, left: 0, top: “50%”, transform: “translateY(-50%)”, width: wi?.barWidth || 4, height: (wi?.barHeight || 75) + “%”, background: rc, borderRadius: “0 3px 3px 0” }} />}
{isWish && <div style={{ position: “absolute”, left: 0, top: “50%”, transform: “translateY(-50%)”, width: 3, height: “60%”, background: “#c084fc”, borderRadius: “0 3px 3px 0” }} />}
<div style={{ display: “flex”, alignItems: “center”, justifyContent: “space-between”, width: “100%” }}>
<div style={{ display: “flex”, alignItems: “center”, gap: 10, flex: 1, minWidth: 0 }}>
<button className=“ne” style={{ width: 20, height: 20, borderRadius: 5, border: “2px solid “ + (task.done ? “#ff3b30” : T.checkBorder), background: task.done ? “#ff3b30” : “transparent”, display: “flex”, alignItems: “center”, justifyContent: “center”, cursor: “pointer”, flexShrink: 0, color: “#fff”, fontSize: 11, fontWeight: 700 }} onClick={e => { e.stopPropagation(); onToggleDone(); }}>{task.done && “✓”}</button>
<div style={{ flex: 1, minWidth: 0 }}>
<div style={{ fontSize: 13, fontWeight: 600, color: T.text, whiteSpace: “nowrap”, overflow: “hidden”, textOverflow: “ellipsis”, textDecoration: task.done ? “line-through” : “none” }}>{task.title}</div>
{!isWish && <div style={{ fontSize: 10.5, color: T.textSub, marginTop: 3, display: “flex”, gap: 5, fontFamily: “‘JetBrains Mono’, monospace”, flexWrap: “wrap” }}><span style={{ color: imp?.color, fontWeight: 600 }}>{imp?.label}</span><span style={{ opacity: 0.3 }}>·</span><span style={{ color: rc, fontWeight: 600 }}>{wi?.label}</span><span style={{ opacity: 0.3 }}>·</span><span style={{ color: isOD ? “#ff3b30” : T.textSub }}>{formatDeadline(task.deadline)}</span>{task.location && <><span style={{ opacity: 0.3 }}>·</span><span>📍{task.location}</span></>}{task.recurrence && task.recurrence !== “none” && <><span style={{ opacity: 0.3 }}>·</span><span>🔁</span></>}{hs && <><span style={{ opacity: 0.3 }}>·</span><span style={{ color: sd === subs.length ? “#4ade80” : T.textSub }}>{sd}/{subs.length}</span></>}</div>}
{isWish && task.memo && <div style={{ fontSize: 10.5, color: T.textMuted, marginTop: 3, fontFamily: “‘JetBrains Mono’, monospace” }}>{task.memo.slice(0, 40)}{task.memo.length > 40 ? “…” : “”}</div>}
</div>
</div>
<div style={{ flexShrink: 0, marginLeft: 8 }}>{!task.done && <span className={isOD ? “overdue-pulse” : “”} style={{ fontFamily: “‘JetBrains Mono’, monospace”, fontSize: 9, fontWeight: 700, letterSpacing: 1, padding: “3px 8px”, borderRadius: 5, border: “1px solid”, background: isWish ? “rgba(192,132,252,0.13)” : label.color + “22”, color: isWish ? “#c084fc” : label.color, borderColor: isWish ? “rgba(192,132,252,0.27)” : label.color + “44” }}>{label.text}</span>}</div>
</div>
{expanded && <div style={{ marginTop: 12, paddingTop: 12, borderTop: “1px solid “ + T.border, width: “100%”, animation: “slideDown 0.25s ease” }}>
{!isWish && <><div style={{ display: “flex”, justifyContent: “space-between”, padding: “5px 0”, fontSize: 12 }}><span style={{ color: T.textMuted, fontFamily: “‘JetBrains Mono’, monospace”, fontSize: 10, letterSpacing: 1, textTransform: “uppercase” }}>作成日</span><span style={{ color: T.text }}>{new Date(task.createdAt).toLocaleDateString()}</span></div>{task.deadline && <div style={{ display: “flex”, justifyContent: “space-between”, padding: “5px 0”, fontSize: 12 }}><span style={{ color: T.textMuted, fontFamily: “‘JetBrains Mono’, monospace”, fontSize: 10, letterSpacing: 1, textTransform: “uppercase” }}>締切</span><span style={{ color: T.text }}>{new Date(task.deadline).toLocaleString()}</span></div>}{task.recurrence && task.recurrence !== “none” && <div style={{ display: “flex”, justifyContent: “space-between”, padding: “5px 0”, fontSize: 12 }}><span style={{ color: T.textMuted, fontFamily: “‘JetBrains Mono’, monospace”, fontSize: 10, letterSpacing: 1, textTransform: “uppercase” }}>繰り返し</span><span style={{ color: T.text }}>{RECURRENCE.find(r => r.value === task.recurrence)?.label}</span></div>}</>}
{task.memo && <div style={{ marginTop: 10, padding: 10, background: T.memoOverlay, border: “1px solid “ + T.memoBorder, borderRadius: 8, fontSize: 12, color: T.textSub, lineHeight: 1.6, whiteSpace: “pre-wrap” }}>{task.memo}</div>}
<div style={{ marginTop: 12, paddingTop: 8 }}><div style={{ display: “flex”, justifyContent: “space-between”, alignItems: “center”, marginBottom: 6 }}><span style={{ color: T.textMuted, fontFamily: “‘JetBrains Mono’, monospace”, fontSize: 10, letterSpacing: 1, textTransform: “uppercase” }}>サブタスク</span>{hs && <span style={{ fontSize: 10, color: sd === subs.length ? “#4ade80” : T.textSub, fontFamily: “‘JetBrains Mono’, monospace” }}>{sd}/{subs.length}</span>}</div>
{subs.map(sub => (<div key={sub.id} className=“ne” style={{ display: “flex”, alignItems: “center”, gap: 8, padding: “6px 0”, borderBottom: “1px solid “ + T.borderLight }}><button style={{ width: 16, height: 16, borderRadius: 4, border: “2px solid “ + (sub.done ? “#4ade80” : T.checkBorder), background: sub.done ? “#4ade80” : “transparent”, display: “flex”, alignItems: “center”, justifyContent: “center”, cursor: “pointer”, flexShrink: 0 }} onClick={e => { e.stopPropagation(); togS(sub.id); }}>{sub.done && <span style={{ fontSize: 8, color: “#000” }}>✓</span>}</button><span style={{ fontSize: 12, color: T.textSub, flex: 1, textDecoration: sub.done ? “line-through” : “none”, opacity: sub.done ? 0.5 : 1 }}>{sub.title}</span><button style={{ background: “none”, border: “none”, color: T.textDim, fontSize: 11, cursor: “pointer”, padding: 3 }} onClick={e => { e.stopPropagation(); delS(sub.id); }}>✕</button></div>))}
<div className=“ne” style={{ display: “flex”, gap: 6, marginTop: 6 }}><input style={{ flex: 1, padding: “7px 9px”, background: T.memoOverlay, border: “1px solid “ + T.border, borderRadius: 6, color: T.text, fontSize: 11, outline: “none” }} placeholder=“サブタスクを追加…” value={ns} onChange={e => setNs(e.target.value)} onKeyDown={e => { if (e.key === “Enter”) { e.stopPropagation(); addS(); } }} onClick={e => e.stopPropagation()} /><button style={{ width: 30, height: 30, borderRadius: 6, border: “1px solid “ + T.border, background: T.chipOff, color: T.textSub, fontSize: 15, cursor: “pointer”, display: “flex”, alignItems: “center”, justifyContent: “center” }} onClick={e => { e.stopPropagation(); addS(); }}>+</button></div>
</div>
<div style={{ display: “flex”, gap: 8, marginTop: 12 }}>{!isWish && <button className=“ne” style={{ flex: 1, padding: 9, borderRadius: 8, border: “1px solid “ + T.border, background: “transparent”, color: T.textSub, fontSize: 11, fontWeight: 600, cursor: “pointer” }} onClick={e => { e.stopPropagation(); onEdit(); }}>編集</button>}<button className=“ne” style={{ flex: 1, padding: 9, borderRadius: 8, border: “1px solid rgba(255,59,48,0.3)”, background: “transparent”, color: “#ff3b30”, fontSize: 11, fontWeight: 600, cursor: “pointer” }} onClick={e => { e.stopPropagation(); onDelete(); }}>削除</button></div>
</div>}
</div>

  </div>);
}

function makeStyles(T) {
return {
root: { minHeight: “100vh”, background: T.bg, color: T.text, fontFamily: “‘Noto Sans JP’, sans-serif”, padding: “calc(16px + env(safe-area-inset-top)) 14px calc(80px + env(safe-area-inset-bottom))”, maxWidth: 600, margin: “0 auto” },
header: { display: “flex”, justifyContent: “space-between”, alignItems: “flex-start”, marginBottom: 20 },
logo: { fontFamily: “‘JetBrains Mono’, monospace”, fontSize: 20, fontWeight: 800, letterSpacing: 2, color: T.text, margin: 0 },
sub: { fontFamily: “‘JetBrains Mono’, monospace”, fontSize: 11, color: T.textMuted, marginTop: 3 },
iconBtn: { width: 36, height: 36, borderRadius: 8, border: “1px solid “ + T.iconBorder, background: T.iconBg, color: T.iconColor, fontSize: 14, cursor: “pointer”, display: “flex”, alignItems: “center”, justifyContent: “center” },
topBanner: { background: T.card, border: “1px solid”, borderRadius: 14, padding: “14px 16px”, marginBottom: 16 },
topLabel: { fontSize: 10, fontWeight: 700, marginBottom: 5, letterSpacing: 1, display: “flex”, alignItems: “center” },
topTitle: { fontSize: 16, fontWeight: 700, color: T.text, marginBottom: 5 },
topMeta: { fontFamily: “‘JetBrains Mono’, monospace”, fontSize: 10, color: T.textSub, display: “flex”, gap: 8 },
form: { background: T.card, border: “1px solid “ + T.border, borderRadius: 14, padding: 18, marginBottom: 16 },
formHeader: { display: “flex”, justifyContent: “space-between”, alignItems: “center”, marginBottom: 14 },
formTitle: { fontSize: 15, fontWeight: 700, color: T.text },
closeBtn: { background: “none”, border: “none”, color: T.textMuted, fontSize: 16, cursor: “pointer” },
input: { width: “100%”, padding: “10px 12px”, background: T.inputBg, border: “1px solid “ + T.border, borderRadius: 9, color: T.text, fontSize: 14, outline: “none”, marginBottom: 7 },
fieldGroup: { marginBottom: 12 },
fieldLabel: { fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: “uppercase”, letterSpacing: 1, marginBottom: 7, display: “block”, fontFamily: “‘JetBrains Mono’, monospace” },
chipRow: { display: “flex”, gap: 7, flexWrap: “wrap” },
chip: { padding: “7px 14px”, borderRadius: 7, border: “1px solid”, fontSize: 12, fontWeight: 600, cursor: “pointer”, transition: “all 0.2s”, display: “flex”, alignItems: “center” },
submitBtn: { width: “100%”, padding: “13px”, background: “#ff3b30”, border: “none”, borderRadius: 9, color: “#fff”, fontSize: 14, fontWeight: 700, cursor: “pointer”, marginTop: 7 },
addBtn: { width: “100%”, padding: 14, background: “transparent”, border: “1.5px dashed “ + T.addBorder, borderRadius: 10, color: T.addColor, fontSize: 13, fontWeight: 700, cursor: “pointer”, marginBottom: 10, display: “flex”, alignItems: “center”, justifyContent: “center”, gap: 6, letterSpacing: 1, fontFamily: “‘JetBrains Mono’, monospace” },
filterRow: { display: “flex”, gap: 4, marginBottom: 8, flexWrap: “nowrap” },
filterChip: { padding: “4px 9px”, borderRadius: 6, border: “1px solid “ + T.filterBorder, fontSize: 11, fontWeight: 600, cursor: “pointer”, whiteSpace: “nowrap” },
locationFilterRow: { display: “flex”, gap: 4, marginBottom: 12, flexWrap: “wrap”, alignItems: “center” },
list: { display: “flex”, flexDirection: “column”, gap: 8 },
empty: { textAlign: “center”, padding: 36, color: T.textDim, fontSize: 13, fontFamily: “‘JetBrains Mono’, monospace” },
};
}