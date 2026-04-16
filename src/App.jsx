import { useState, useEffect, useCallback, useMemo, useRef } from “react”;

const IMPORTANCE = [
{ value: 3, label: “高”, color: “#ff3b30” },
{ value: 2, label: “中”, color: “#ff9500” },
{ value: 1, label: “低”, color: “#8e8e93” },
];

const WEIGHT = [
{ value: 3, label: “重い”, hours: “4h+”, color: “#ff3b30”, barWidth: 5, barHeight: 100 },
{ value: 2, label: “普通”, hours: “1-4h”, color: “#ffcc00”, barWidth: 4, barHeight: 75 },
{ value: 1, label: “軽い”, hours: “~1h”, color: “#4ade80”, barWidth: 3, barHeight: 55 },
{ value: 0, label: “超軽い”, hours: “~10m”, color: “#4a9eff”, barWidth: 2, barHeight: 40 },
];

const RECURRENCE = [
{ value: “none”, label: “なし” },
{ value: “daily”, label: “毎日” },
{ value: “weekly”, label: “毎週” },
{ value: “monthly”, label: “毎月” },
];

const SORT_OPTIONS = [
{ value: “smart”, label: “スマート順” },
{ value: “deadline”, label: “締切順” },
{ value: “heavy”, label: “重い順” },
{ value: “light”, label: “軽い順” },
{ value: “created”, label: “作成日順” },
];

function calcPriorityScore(task) {
if (task.done) return -999;
if (!task.deadline) return task.importance * 15 + task.weight * 5 + 5;

const now = Date.now();
const deadline = new Date(task.deadline).getTime();
const hoursLeft = (deadline - now) / (1000 * 60 * 60);

if (hoursLeft < 0) return 1000 + task.importance * 10;

const weightHours = task.weight === 3 ? 6 : task.weight === 2 ? 3 : task.weight === 1 ? 1 : 0.2;
const bufferRatio = hoursLeft / Math.max(weightHours, 0.1);

let urgency;
if (bufferRatio < 1) urgency = 100;
else if (bufferRatio < 2) urgency = 80;
else if (bufferRatio < 5) urgency = 60;
else if (bufferRatio < 24) urgency = 30;
else urgency = Math.max(5, 20 - bufferRatio * 0.1);

return urgency * 0.5 + task.importance * 15 + task.weight * 5;
}

function getUrgencyBand(task) {
if (task.done) return 5;
const score = calcPriorityScore(task);
if (score >= 1000) return 0; // OVERDUE
if (score >= 80) return 1; // NOW
if (score >= 60) return 2; // SOON
if (score >= 40) return 3; // NEXT
return 4; // LATER
}

function getScoreLabel(score) {
if (score >= 1000) return { text: “OVERDUE”, color: “#ff3b30” };
if (score >= 80) return { text: “NOW”, color: “#ff3b30” };
if (score >= 60) return { text: “SOON”, color: “#ff9500” };
if (score >= 40) return { text: “NEXT”, color: “#ffcc00” };
return { text: “LATER”, color: “#8e8e93” };
}

function formatDeadline(d) {
if (!d) return “期限なし”;
const now = new Date();
const dl = new Date(d);
const diff = dl - now;
const totalMin = Math.round(diff / 60000);
if (totalMin < 0) return “overdue”;
if (totalMin < 60) return `${totalMin}m`;
const h = Math.floor(totalMin / 60);
const m = totalMin % 60;
if (h < 24) return m > 0 ? `${h}h ${m}m` : `${h}h`;
const d2 = Math.floor(h / 24);
const h2 = h % 24;
if (d2 < 7) return h2 > 0 ? `${d2}d ${h2}h` : `${d2}d`;
return `${dl.getMonth() + 1}/${dl.getDate()}`;
}

function getDefaultDeadline() {
const d = new Date();
d.setDate(d.getDate() + 1);
d.setHours(18, 0, 0, 0);
return d.toISOString().slice(0, 16);
}

function advanceRecurrence(deadline, recurrence) {
if (!deadline || recurrence === “none” || !recurrence) return deadline;
const d = new Date(deadline);
if (recurrence === “daily”) d.setDate(d.getDate() + 1);
else if (recurrence === “weekly”) d.setDate(d.getDate() + 7);
else if (recurrence === “monthly”) d.setMonth(d.getMonth() + 1);
return d.toISOString().slice(0, 16);
}

const STORAGE_KEY = “task-queue-v1”;
const SORT_KEY = “task-queue-sort”;

function loadTasks() {
try {
const raw = localStorage.getItem(STORAGE_KEY);
return raw ? JSON.parse(raw) : [];
} catch { return []; }
}

function saveTasks(tasks) {
try { localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks)); } catch {}
}

export default function App() {
const [tasks, setTasks] = useState(() => loadTasks());
const [showForm, setShowForm] = useState(false);
const [title, setTitle] = useState(””);
const [importance, setImportance] = useState(2);
const [weight, setWeight] = useState(2);
const [deadline, setDeadline] = useState(getDefaultDeadline());
const [hasDeadline, setHasDeadline] = useState(true);
const [memo, setMemo] = useState(””);
const [location, setLocation] = useState(””);
const [recurrence, setRecurrence] = useState(“none”);
const [filter, setFilter] = useState(“active”);
const [locationFilter, setLocationFilter] = useState(null);
const [editId, setEditId] = useState(null);
const [expandedId, setExpandedId] = useState(null);
const [sortOrder, setSortOrder] = useState(() => localStorage.getItem(SORT_KEY) || “smart”);
const [searchQuery, setSearchQuery] = useState(””);
const [showSearch, setShowSearch] = useState(false);
const [showSettings, setShowSettings] = useState(false);
const [focusMode, setFocusMode] = useState(false);
const [undoData, setUndoData] = useState(null);
const undoTimerRef = useRef(null);
const fileInputRef = useRef(null);

useEffect(() => { saveTasks(tasks); }, [tasks]);
useEffect(() => { localStorage.setItem(SORT_KEY, sortOrder); }, [sortOrder]);

// Past locations for suggestions
const pastLocations = useMemo(() => {
const set = new Set();
tasks.forEach((t) => { if (t.location) set.add(t.location); });
return Array.from(set);
}, [tasks]);

const resetForm = useCallback(() => {
setTitle(””);
setImportance(2);
setWeight(2);
setDeadline(getDefaultDeadline());
setHasDeadline(true);
setMemo(””);
setLocation(””);
setRecurrence(“none”);
setShowForm(false);
setEditId(null);
}, []);

const handleSubmit = useCallback(() => {
if (!title.trim()) return;
if (editId) {
setTasks((prev) =>
prev.map((t) =>
t.id === editId
? {
…t,
title: title.trim(),
importance,
weight,
deadline: hasDeadline ? deadline : null,
memo: memo.trim(),
location: location.trim(),
recurrence,
}
: t
)
);
} else {
const newTask = {
id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
title: title.trim(),
importance,
weight,
deadline: hasDeadline ? deadline : null,
memo: memo.trim(),
location: location.trim(),
recurrence,
done: false,
createdAt: Date.now(),
};
setTasks((prev) => […prev, newTask]);
}
resetForm();
}, [title, importance, weight, deadline, hasDeadline, memo, location, recurrence, editId, resetForm]);

const showUndoToast = useCallback((tasks, action) => {
if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
setUndoData({ tasks, action });
undoTimerRef.current = setTimeout(() => setUndoData(null), 5000);
}, []);

const toggleDone = useCallback((id) => {
setTasks((prev) => {
const task = prev.find((t) => t.id === id);
if (!task) return prev;

```
  // If completing a recurring task, create next instance
  if (!task.done && task.recurrence && task.recurrence !== "none" && task.deadline) {
    const newTask = {
      ...task,
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      deadline: advanceRecurrence(task.deadline, task.recurrence),
      done: false,
      createdAt: Date.now(),
    };
    return prev.map((t) => (t.id === id ? { ...t, done: true } : t)).concat(newTask);
  }

  return prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t));
});
```

}, []);

const deleteTask = useCallback((id) => {
const task = tasks.find((t) => t.id === id);
if (!task) return;
showUndoToast([task], “delete”);
setTasks((prev) => prev.filter((t) => t.id !== id));
if (expandedId === id) setExpandedId(null);
}, [tasks, expandedId, showUndoToast]);

const handleUndo = useCallback(() => {
if (!undoData) return;
if (undoData.action === “delete”) {
setTasks((prev) => […prev, …undoData.tasks]);
}
setUndoData(null);
if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
}, [undoData]);

const startEdit = useCallback((task) => {
setTitle(task.title);
setImportance(task.importance);
setWeight(task.weight);
setDeadline(task.deadline || getDefaultDeadline());
setHasDeadline(!!task.deadline);
setMemo(task.memo || “”);
setLocation(task.location || “”);
setRecurrence(task.recurrence || “none”);
setEditId(task.id);
setShowForm(true);
setExpandedId(null);
}, []);

const handleExport = useCallback(() => {
const data = JSON.stringify(tasks, null, 2);
const blob = new Blob([data], { type: “application/json” });
const url = URL.createObjectURL(blob);
const a = document.createElement(“a”);
a.href = url;
const dateStr = new Date().toISOString().slice(0, 10);
a.download = `task-queue-${dateStr}.json`;
a.click();
URL.revokeObjectURL(url);
}, [tasks]);

const handleImportClick = useCallback(() => {
fileInputRef.current?.click();
}, []);

const handleImportFile = useCallback((e) => {
const file = e.target.files?.[0];
if (!file) return;
const reader = new FileReader();
reader.onload = (ev) => {
try {
const imported = JSON.parse(ev.target.result);
if (!Array.isArray(imported)) throw new Error(“Invalid format”);
if (confirm(`${imported.length}件のタスクをインポートします。現在のタスクは上書きされます。OK?`)) {
setTasks(imported);
}
} catch {
alert(“インポートに失敗しました。ファイルの形式を確認してください。”);
}
};
reader.readAsText(file);
e.target.value = “”;
}, []);

const sorted = useMemo(() => {
let result = tasks.map((t) => ({ …t, score: calcPriorityScore(t), band: getUrgencyBand(t) }));

```
// Filter
if (filter === "active") result = result.filter((t) => !t.done && t.deadline);
else if (filter === "done") result = result.filter((t) => t.done);
else if (filter === "noDeadline") result = result.filter((t) => !t.done && !t.deadline);
// 'all' → no filter

if (locationFilter !== null) {
  result = result.filter((t) => (t.location || "") === locationFilter);
}

if (searchQuery.trim()) {
  const q = searchQuery.toLowerCase();
  result = result.filter((t) =>
    t.title.toLowerCase().includes(q) ||
    (t.memo || "").toLowerCase().includes(q) ||
    (t.location || "").toLowerCase().includes(q)
  );
}

// Sort
if (sortOrder === "smart") {
  result.sort((a, b) => {
    if (a.band !== b.band) return a.band - b.band;
    if (a.weight !== b.weight) return a.weight - b.weight; // lighter first
    return b.importance - a.importance;
  });
} else if (sortOrder === "deadline") {
  result.sort((a, b) => {
    if (!a.deadline && !b.deadline) return 0;
    if (!a.deadline) return 1;
    if (!b.deadline) return -1;
    return new Date(a.deadline) - new Date(b.deadline);
  });
} else if (sortOrder === "heavy") {
  result.sort((a, b) => b.weight - a.weight);
} else if (sortOrder === "light") {
  result.sort((a, b) => a.weight - b.weight);
} else if (sortOrder === "created") {
  result.sort((a, b) => b.createdAt - a.createdAt);
}

return result;
```

}, [tasks, filter, locationFilter, searchQuery, sortOrder]);

const topTask = useMemo(() => {
const active = tasks.map((t) => ({ …t, score: calcPriorityScore(t), band: getUrgencyBand(t) })).filter((t) => !t.done);
active.sort((a, b) => {
if (a.band !== b.band) return a.band - b.band;
if (a.weight !== b.weight) return a.weight - b.weight;
return b.importance - a.importance;
});
return active[0];
}, [tasks]);

// Focus mode
if (focusMode && topTask) {
const label = getScoreLabel(topTask.score);
const weightInfo = WEIGHT.find((w) => w.value === topTask.weight);
return (
<div style={styles.focusRoot}>
<style>{globalStyles}</style>
<button style={styles.focusClose} onClick={() => setFocusMode(false)}>✕</button>
<div style={styles.focusContent}>
<div style={{ …styles.focusBadge, color: label.color, borderColor: label.color + “66” }}>
{label.text}
</div>
<div style={styles.focusTitle}>{topTask.title}</div>
<div style={styles.focusMeta}>
<span style={{ color: IMPORTANCE.find((x) => x.value === topTask.importance)?.color, fontWeight: 700 }}>
{IMPORTANCE.find((x) => x.value === topTask.importance)?.label}
</span>
<span style={{ opacity: 0.3, margin: “0 10px” }}>·</span>
<span style={{ color: weightInfo.color, fontWeight: 700 }}>{weightInfo.label}</span>
<span style={{ opacity: 0.3, margin: “0 10px” }}>·</span>
<span>{formatDeadline(topTask.deadline)}</span>
</div>
{topTask.location && <div style={styles.focusLocation}>📍 {topTask.location}</div>}
{topTask.memo && <div style={styles.focusMemo}>{topTask.memo}</div>}
<button
style={styles.focusDoneBtn}
onClick={() => {
toggleDone(topTask.id);
setFocusMode(false);
}}
>
完了する
</button>
</div>
</div>
);
}

return (
<div style={styles.root}>
<style>{globalStyles}</style>

```
  {/* Header */}
  <div style={styles.header}>
    <div>
      <h1 style={styles.logo}>
        <span style={{ color: "#ff3b30" }}>▌</span>TASK QUEUE
      </h1>
      <p style={styles.sub}>
        {tasks.filter((t) => !t.done).length} active
        <span style={{ opacity: 0.3, margin: "0 8px" }}>|</span>
        {tasks.filter((t) => t.done).length} done
      </p>
    </div>
    <div style={{ display: "flex", gap: 6 }}>
      <button className="btn-icon" style={styles.iconBtn} onClick={() => setShowSearch((v) => !v)}>
        {showSearch ? "✕" : "🔍"}
      </button>
      <button className="btn-icon" style={styles.iconBtn} onClick={() => setShowSettings(true)}>
        ⚙
      </button>
    </div>
  </div>

  {/* Search */}
  {showSearch && (
    <input
      className="form-slide"
      style={{ ...styles.input, marginBottom: 16 }}
      placeholder="検索（タスク・メモ・場所）..."
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      autoFocus
    />
  )}

  {/* Top Priority Banner */}
  {topTask && !showForm && !searchQuery && locationFilter === null && (
    <div
      style={{ ...styles.topBanner, borderColor: getScoreLabel(topTask.score).color, cursor: "pointer" }}
      onClick={() => setFocusMode(true)}
    >
      <div style={styles.topLabel}>
        <span style={{ color: getScoreLabel(topTask.score).color, fontFamily: "JetBrains Mono" }}>
          ● 今やるべきタスク
        </span>
        <span style={{ color: "#666", fontSize: 10, marginLeft: 10 }}>TAP TO FOCUS</span>
      </div>
      <div style={styles.topTitle}>{topTask.title}</div>
      <div style={styles.topMeta}>
        <span>{formatDeadline(topTask.deadline)}</span>
        <span style={{ opacity: 0.3 }}>|</span>
        <span>スコア {Math.round(topTask.score)}</span>
      </div>
    </div>
  )}

  {/* Filter */}
  <div style={styles.filterRow}>
    {[
      { key: "active", label: "アクティブ" },
      { key: "noDeadline", label: "期限なし" },
      { key: "all", label: "すべて" },
      { key: "done", label: "完了済み" },
    ].map((f) => (
      <button
        key={f.key}
        className="chip"
        style={{
          ...styles.filterChip,
          background: filter === f.key && locationFilter === null ? "#fff" : "transparent",
          color: filter === f.key && locationFilter === null ? "#000" : "#666",
        }}
        onClick={() => {
          setFilter(f.key);
          setLocationFilter(null);
        }}
      >
        {f.label}
      </button>
    ))}
  </div>

  {/* Location Filter */}
  {pastLocations.length > 0 && (
    <div style={styles.locationFilterRow}>
      <span style={styles.locationFilterLabel}>📍</span>
      {pastLocations.map((loc) => (
        <button
          key={loc}
          className="chip"
          style={{
            ...styles.filterChip,
            fontSize: 11,
            background: locationFilter === loc ? "#fff" : "transparent",
            color: locationFilter === loc ? "#000" : "#888",
          }}
          onClick={() => setLocationFilter(locationFilter === loc ? null : loc)}
        >
          {loc}
        </button>
      ))}
    </div>
  )}

  {/* Add button */}
  {!showForm && (
    <button
      className="btn-add"
      style={styles.addBtnLarge}
      onClick={() => { resetForm(); setShowForm(true); }}
    >
      <span style={{ fontSize: 20, fontWeight: 300 }}>+</span>
      <span>新しいタスク</span>
    </button>
  )}

  {/* Form */}
  {showForm && (
    <div className="form-slide" style={styles.form}>
      <div style={styles.formHeader}>
        <span style={styles.formTitle}>{editId ? "タスク編集" : "新しいタスク"}</span>
        <button style={styles.closeBtn} onClick={resetForm}>✕</button>
      </div>
      <input
        style={styles.input}
        placeholder="タスク名..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        autoFocus
        onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSubmit()}
      />

      <div style={styles.fieldGroup}>
        <label style={styles.fieldLabel}>重要度</label>
        <div style={styles.chipRow}>
          {IMPORTANCE.map((opt) => (
            <button
              key={opt.value}
              className="chip"
              style={{
                ...styles.chip,
                background: importance === opt.value ? opt.color : "#1a1a1a",
                color: importance === opt.value ? "#fff" : "#888",
                borderColor: importance === opt.value ? opt.color : "#333",
              }}
              onClick={() => setImportance(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div style={styles.fieldGroup}>
        <label style={styles.fieldLabel}>タスクの重さ</label>
        <div style={styles.chipRow}>
          {WEIGHT.map((opt) => (
            <button
              key={opt.value}
              className="chip"
              style={{
                ...styles.chip,
                background: weight === opt.value ? opt.color : "#1a1a1a",
                color: weight === opt.value ? "#000" : "#888",
                borderColor: weight === opt.value ? opt.color : "#333",
                fontWeight: weight === opt.value ? 700 : 600,
              }}
              onClick={() => setWeight(opt.value)}
            >
              {opt.label}
              <span style={{ fontSize: 10, opacity: 0.6, marginLeft: 4 }}>{opt.hours}</span>
            </button>
          ))}
        </div>
      </div>

      <div style={styles.fieldGroup}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <label style={{ ...styles.fieldLabel, marginBottom: 0 }}>締切</label>
          <button
            className="chip"
            style={{
              ...styles.chip,
              padding: "4px 12px",
              fontSize: 11,
              background: hasDeadline ? "#1a1a1a" : "#fff",
              color: hasDeadline ? "#888" : "#000",
              borderColor: hasDeadline ? "#333" : "#fff",
            }}
            onClick={() => setHasDeadline((v) => !v)}
          >
            {hasDeadline ? "なしに変更" : "期限なし"}
          </button>
        </div>
        {hasDeadline && (
          <input
            type="datetime-local"
            style={styles.dateInput}
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
          />
        )}
      </div>

      {hasDeadline && (
        <div style={styles.fieldGroup}>
          <label style={styles.fieldLabel}>繰り返し</label>
          <div style={styles.chipRow}>
            {RECURRENCE.map((opt) => (
              <button
                key={opt.value}
                className="chip"
                style={{
                  ...styles.chip,
                  background: recurrence === opt.value ? "#fff" : "#1a1a1a",
                  color: recurrence === opt.value ? "#000" : "#888",
                  borderColor: recurrence === opt.value ? "#fff" : "#333",
                }}
                onClick={() => setRecurrence(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div style={styles.fieldGroup}>
        <label style={styles.fieldLabel}>場所（任意）</label>
        <input
          style={styles.input}
          placeholder="例: 自宅、オフィス、スタジオ"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          list="past-locations"
        />
        <datalist id="past-locations">
          {pastLocations.map((loc) => (
            <option key={loc} value={loc} />
          ))}
        </datalist>
        {pastLocations.length > 0 && (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6 }}>
            {pastLocations.map((loc) => (
              <button
                key={loc}
                className="chip"
                style={{
                  ...styles.chip,
                  padding: "4px 10px",
                  fontSize: 11,
                  background: location === loc ? "#fff" : "#1a1a1a",
                  color: location === loc ? "#000" : "#888",
                  borderColor: location === loc ? "#fff" : "#333",
                }}
                onClick={() => setLocation(loc)}
              >
                {loc}
              </button>
            ))}
          </div>
        )}
      </div>

      <div style={styles.fieldGroup}>
        <label style={styles.fieldLabel}>メモ（任意）</label>
        <textarea
          style={{ ...styles.input, minHeight: 80, resize: "vertical", fontFamily: "inherit" }}
          placeholder="詳細やメモ..."
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
        />
      </div>

      <button className="btn-hover" style={styles.submitBtn} onClick={handleSubmit}>
        {editId ? "更新する" : "追加する"}
      </button>
    </div>
  )}

  {/* Task List */}
  <div style={styles.list}>
    {sorted.length === 0 && (
      <div style={styles.empty}>
        {searchQuery
          ? "検索結果なし"
          : filter === "done"
          ? "完了タスクなし"
          : filter === "noDeadline"
          ? "期限なしタスクなし"
          : "タスクを追加しましょう"}
      </div>
    )}
    {sorted.map((task) => (
      <TaskCard
        key={task.id}
        task={task}
        expanded={expandedId === task.id}
        onToggleExpand={() => setExpandedId(expandedId === task.id ? null : task.id)}
        onToggleDone={() => toggleDone(task.id)}
        onEdit={() => startEdit(task)}
        onDelete={() => deleteTask(task.id)}
      />
    ))}
  </div>

  {/* Settings Modal */}
  {showSettings && (
    <div style={styles.modalOverlay} onClick={() => setShowSettings(false)}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.formHeader}>
          <span style={styles.formTitle}>設定</span>
          <button style={styles.closeBtn} onClick={() => setShowSettings(false)}>✕</button>
        </div>

        <div style={styles.fieldGroup}>
          <label style={styles.fieldLabel}>ソート順</label>
          <div style={{ ...styles.chipRow, flexDirection: "column", gap: 6 }}>
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                className="chip"
                style={{
                  ...styles.chip,
                  width: "100%",
                  justifyContent: "flex-start",
                  background: sortOrder === opt.value ? "#fff" : "#1a1a1a",
                  color: sortOrder === opt.value ? "#000" : "#888",
                  borderColor: sortOrder === opt.value ? "#fff" : "#333",
                }}
                onClick={() => setSortOrder(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div style={styles.fieldGroup}>
          <label style={styles.fieldLabel}>データ</label>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn-hover" style={{ ...styles.submitBtn, background: "#1a1a1a", border: "1px solid #333", marginTop: 0 }} onClick={handleExport}>
              エクスポート
            </button>
            <button className="btn-hover" style={{ ...styles.submitBtn, background: "#1a1a1a", border: "1px solid #333", marginTop: 0 }} onClick={handleImportClick}>
              インポート
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json"
              style={{ display: "none" }}
              onChange={handleImportFile}
            />
          </div>
        </div>
      </div>
    </div>
  )}

  {/* Undo Toast */}
  {undoData && (
    <div className="form-slide" style={styles.toast}>
      <span>タスクを削除しました</span>
      <button style={styles.toastBtn} onClick={handleUndo}>元に戻す</button>
    </div>
  )}
</div>
```

);
}

function TaskCard({ task, expanded, onToggleExpand, onToggleDone, onEdit, onDelete }) {
const label = getScoreLabel(task.score);
const isOverdue = task.score >= 1000;
const weightInfo = WEIGHT.find((w) => w.value === task.weight);
const impInfo = IMPORTANCE.find((x) => x.value === task.importance);

const touchStartX = useRef(0);
const touchStartY = useRef(0);
const [swipeOffset, setSwipeOffset] = useState(0);
const [swiping, setSwiping] = useState(false);

const onTouchStart = (e) => {
touchStartX.current = e.touches[0].clientX;
touchStartY.current = e.touches[0].clientY;
};

const onTouchMove = (e) => {
const dx = e.touches[0].clientX - touchStartX.current;
const dy = Math.abs(e.touches[0].clientY - touchStartY.current);
if (Math.abs(dx) > 10 && dy < 30) {
setSwiping(true);
setSwipeOffset(dx);
}
};

const onTouchEnd = () => {
const threshold = 100;
if (swipeOffset > threshold) {
// Right swipe: complete
onToggleDone();
} else if (swipeOffset < -threshold) {
// Left swipe: delete
onDelete();
}
setSwipeOffset(0);
setTimeout(() => setSwiping(false), 100);
};

return (
<div style={{ position: “relative”, overflow: “hidden”, borderRadius: 12 }}>
{/* Swipe background indicators */}
{swipeOffset > 20 && (
<div style={{ …styles.swipeBg, background: “rgba(74,222,128,0.2)”, justifyContent: “flex-start”, paddingLeft: 20 }}>
<span style={{ color: “#4ade80”, fontWeight: 700 }}>✓ 完了</span>
</div>
)}
{swipeOffset < -20 && (
<div style={{ …styles.swipeBg, background: “rgba(255,59,48,0.2)”, justifyContent: “flex-end”, paddingRight: 20 }}>
<span style={{ color: “#ff3b30”, fontWeight: 700 }}>削除 ✕</span>
</div>
)}

```
  <div
    className="task-card"
    style={{
      ...styles.card,
      opacity: task.done ? 0.4 : 1,
      flexDirection: expanded ? "column" : "row",
      alignItems: expanded ? "stretch" : "center",
      transform: `translateX(${swipeOffset}px)`,
      transition: swiping ? "none" : "transform 0.2s",
    }}
    onClick={(e) => {
      if (swiping) return;
      if (e.target.closest(".no-expand")) return;
      onToggleExpand();
    }}
    onTouchStart={onTouchStart}
    onTouchMove={onTouchMove}
    onTouchEnd={onTouchEnd}
  >
    {/* Weight bar */}
    <div
      style={{
        position: "absolute",
        left: 0,
        top: "50%",
        transform: "translateY(-50%)",
        width: weightInfo.barWidth,
        height: `${weightInfo.barHeight}%`,
        background: weightInfo.color,
        borderRadius: "0 2px 2px 0",
      }}
    />

    {/* Header (always shown) */}
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
      <div style={styles.cardLeft}>
        <button
          className="no-expand"
          style={{
            ...styles.checkbox,
            background: task.done ? "#ff3b30" : "transparent",
            borderColor: task.done ? "#ff3b30" : "#444",
          }}
          onClick={(e) => { e.stopPropagation(); onToggleDone(); }}
        >
          {task.done && <span style={{ fontSize: 12 }}>✓</span>}
        </button>
        <div style={styles.cardContent}>
          <div style={{ ...styles.cardTitle, textDecoration: task.done ? "line-through" : "none" }}>
            {task.title}
          </div>
          <div style={styles.cardMeta}>
            <span style={{ color: impInfo?.color, fontWeight: 600 }}>{impInfo?.label}</span>
            <span style={{ opacity: 0.3 }}>·</span>
            <span style={{ color: weightInfo?.color, fontWeight: 600 }}>{weightInfo?.label}</span>
            <span style={{ opacity: 0.3 }}>·</span>
            <span style={{ color: isOverdue ? "#ff3b30" : "#888" }}>
              {formatDeadline(task.deadline)}
            </span>
            {task.location && (
              <>
                <span style={{ opacity: 0.3 }}>·</span>
                <span>📍 {task.location}</span>
              </>
            )}
            {task.recurrence && task.recurrence !== "none" && (
              <>
                <span style={{ opacity: 0.3 }}>·</span>
                <span>🔁</span>
              </>
            )}
          </div>
        </div>
      </div>
      <div style={styles.cardRight}>
        {!task.done && (
          <span
            className={isOverdue ? "overdue-pulse" : ""}
            style={{
              ...styles.badge,
              background: label.color + "22",
              color: label.color,
              borderColor: label.color + "44",
            }}
          >
            {label.text}
          </span>
        )}
      </div>
    </div>

    {/* Expanded detail */}
    {expanded && (
      <div style={styles.cardDetail}>
        <div style={styles.detailRow}>
          <span style={styles.detailLabel}>作成日</span>
          <span style={styles.detailValue}>
            {new Date(task.createdAt).toLocaleDateString()}
          </span>
        </div>
        {task.deadline && (
          <div style={styles.detailRow}>
            <span style={styles.detailLabel}>締切</span>
            <span style={styles.detailValue}>
              {new Date(task.deadline).toLocaleString()}
            </span>
          </div>
        )}
        {task.recurrence && task.recurrence !== "none" && (
          <div style={styles.detailRow}>
            <span style={styles.detailLabel}>繰り返し</span>
            <span style={styles.detailValue}>
              {RECURRENCE.find((r) => r.value === task.recurrence)?.label}
            </span>
          </div>
        )}
        {task.memo && <div style={styles.detailMemo}>{task.memo}</div>}
        <div style={styles.detailActions}>
          <button className="no-expand" style={styles.detailBtn} onClick={(e) => { e.stopPropagation(); onEdit(); }}>
            編集
          </button>
          <button className="no-expand" style={{ ...styles.detailBtn, color: "#ff3b30", borderColor: "rgba(255,59,48,0.3)" }} onClick={(e) => { e.stopPropagation(); onDelete(); }}>
            削除
          </button>
        </div>
      </div>
    )}
  </div>
</div>
```

);
}

const globalStyles = `@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700;800&family=Noto+Sans+JP:wght@400;500;700;900&display=swap'); *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; } html, body, #root { min-height: 100vh; background: #0a0a0a; } input, select, button, textarea { font-family: 'Noto Sans JP', sans-serif; } @keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } } @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.5; } } @keyframes slideUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } } @keyframes slideDown { from { opacity:0; transform:translateY(-4px); } to { opacity:1; transform:translateY(0); } } .task-card { animation: fadeIn 0.3s ease both; } .btn-hover:hover, .btn-icon:hover, .btn-add:hover { filter: brightness(1.2); } .btn-add:hover { border-color: #ff3b30 !important; color: #ff3b30 !important; background: rgba(255,59,48,0.05) !important; } .chip:hover { filter: brightness(1.3); } .overdue-pulse { animation: pulse 1.5s ease infinite; } .form-slide { animation: slideUp 0.3s ease both; } input[type="datetime-local"]::-webkit-calendar-picker-indicator { filter: invert(0.6); }`;

const styles = {
root: {
minHeight: “100vh”,
background: “#0a0a0a”,
color: “#e0e0e0”,
fontFamily: “‘Noto Sans JP’, sans-serif”,
padding: “20px 16px 100px”,
maxWidth: 600,
margin: “0 auto”,
},
focusRoot: {
minHeight: “100vh”,
background: “#0a0a0a”,
color: “#e0e0e0”,
display: “flex”,
alignItems: “center”,
justifyContent: “center”,
padding: 24,
position: “relative”,
fontFamily: “‘Noto Sans JP’, sans-serif”,
},
focusClose: {
position: “absolute”,
top: 20,
right: 20,
width: 44,
height: 44,
borderRadius: “50%”,
background: “#1a1a1a”,
border: “1px solid #333”,
color: “#888”,
fontSize: 18,
cursor: “pointer”,
},
focusContent: { textAlign: “center”, maxWidth: 500 },
focusBadge: {
display: “inline-block”,
fontFamily: “‘JetBrains Mono’, monospace”,
fontSize: 12,
fontWeight: 700,
letterSpacing: 2,
padding: “6px 16px”,
borderRadius: 8,
border: “1px solid”,
marginBottom: 32,
},
focusTitle: {
fontSize: 36,
fontWeight: 900,
color: “#fff”,
marginBottom: 24,
lineHeight: 1.3,
},
focusMeta: { fontSize: 16, color: “#ccc”, marginBottom: 12 },
focusLocation: { fontSize: 14, color: “#888”, marginBottom: 12 },
focusMemo: {
fontSize: 14,
color: “#aaa”,
background: “#111”,
borderRadius: 12,
padding: 16,
marginTop: 24,
whiteSpace: “pre-wrap”,
textAlign: “left”,
lineHeight: 1.6,
},
focusDoneBtn: {
marginTop: 48,
padding: “16px 48px”,
background: “#ff3b30”,
border: “none”,
borderRadius: 12,
color: “#fff”,
fontSize: 16,
fontWeight: 700,
cursor: “pointer”,
letterSpacing: 1,
},
header: { display: “flex”, justifyContent: “space-between”, alignItems: “flex-start”, marginBottom: 24 },
logo: { fontFamily: “‘JetBrains Mono’, monospace”, fontSize: 22, fontWeight: 800, letterSpacing: 2, color: “#fff”, margin: 0 },
sub: { fontFamily: “‘JetBrains Mono’, monospace”, fontSize: 12, color: “#666”, marginTop: 4 },
iconBtn: {
width: 40,
height: 40,
borderRadius: 10,
border: “1px solid #333”,
background: “#1a1a1a”,
color: “#ccc”,
fontSize: 16,
cursor: “pointer”,
},
topBanner: { background: “#111”, border: “1px solid”, borderRadius: 16, padding: “16px 18px”, marginBottom: 20 },
topLabel: { fontSize: 11, fontWeight: 700, marginBottom: 6, letterSpacing: 1, display: “flex”, alignItems: “center” },
topTitle: { fontSize: 18, fontWeight: 700, color: “#fff”, marginBottom: 6 },
topMeta: { fontFamily: “‘JetBrains Mono’, monospace”, fontSize: 11, color: “#888”, display: “flex”, gap: 8 },
form: { background: “#111”, border: “1px solid #222”, borderRadius: 16, padding: 20, marginBottom: 20 },
formHeader: { display: “flex”, justifyContent: “space-between”, alignItems: “center”, marginBottom: 16 },
formTitle: { fontSize: 16, fontWeight: 700, color: “#fff” },
closeBtn: { background: “none”, border: “none”, color: “#666”, fontSize: 18, cursor: “pointer” },
input: {
width: “100%”,
padding: “12px 14px”,
background: “#1a1a1a”,
border: “1px solid #333”,
borderRadius: 10,
color: “#fff”,
fontSize: 15,
outline: “none”,
marginBottom: 8,
},
fieldGroup: { marginBottom: 14 },
fieldLabel: {
fontSize: 11,
fontWeight: 700,
color: “#888”,
textTransform: “uppercase”,
letterSpacing: 1,
marginBottom: 8,
display: “block”,
fontFamily: “‘JetBrains Mono’, monospace”,
},
chipRow: { display: “flex”, gap: 8, flexWrap: “wrap” },
chip: {
padding: “8px 16px”,
borderRadius: 8,
border: “1px solid”,
fontSize: 13,
fontWeight: 600,
cursor: “pointer”,
transition: “all 0.2s”,
display: “flex”,
alignItems: “center”,
},
dateInput: {
width: “100%”,
padding: “10px 14px”,
background: “#1a1a1a”,
border: “1px solid #333”,
borderRadius: 10,
color: “#fff”,
fontSize: 14,
outline: “none”,
colorScheme: “dark”,
},
submitBtn: {
width: “100%”,
padding: “14px”,
background: “#ff3b30”,
border: “none”,
borderRadius: 10,
color: “#fff”,
fontSize: 15,
fontWeight: 700,
cursor: “pointer”,
marginTop: 8,
transition: “all 0.2s”,
},
addBtnLarge: {
width: “100%”,
padding: 16,
background: “transparent”,
border: “1.5px dashed #444”,
borderRadius: 12,
color: “#888”,
fontSize: 14,
fontWeight: 700,
cursor: “pointer”,
marginBottom: 12,
display: “flex”,
alignItems: “center”,
justifyContent: “center”,
gap: 8,
letterSpacing: 1,
transition: “all 0.2s”,
fontFamily: “‘JetBrains Mono’, monospace”,
},
filterRow: { display: “flex”, gap: 6, marginBottom: 10, flexWrap: “wrap” },
filterChip: {
padding: “6px 14px”,
borderRadius: 8,
border: “1px solid #333”,
fontSize: 12,
fontWeight: 600,
cursor: “pointer”,
transition: “all 0.2s”,
},
locationFilterRow: {
display: “flex”,
gap: 6,
marginBottom: 16,
flexWrap: “wrap”,
alignItems: “center”,
},
locationFilterLabel: {
fontSize: 14,
color: “#888”,
marginRight: 4,
},
list: { display: “flex”, flexDirection: “column”, gap: 8 },
empty: {
textAlign: “center”,
padding: 40,
color: “#444”,
fontSize: 14,
fontFamily: “‘JetBrains Mono’, monospace”,
},
card: {
background: “#111”,
border: “1px solid #1a1a1a”,
borderRadius: 12,
padding: “14px 16px 14px 20px”,
transition: “all 0.2s”,
cursor: “pointer”,
position: “relative”,
display: “flex”,
width: “100%”,
},
cardLeft: { display: “flex”, alignItems: “center”, gap: 12, flex: 1, minWidth: 0 },
checkbox: {
width: 22,
height: 22,
borderRadius: 6,
border: “2px solid”,
display: “flex”,
alignItems: “center”,
justifyContent: “center”,
cursor: “pointer”,
flexShrink: 0,
transition: “all 0.2s”,
color: “#fff”,
fontSize: 12,
fontWeight: 700,
},
cardContent: { flex: 1, minWidth: 0 },
cardTitle: {
fontSize: 14,
fontWeight: 600,
color: “#fff”,
whiteSpace: “nowrap”,
overflow: “hidden”,
textOverflow: “ellipsis”,
},
cardMeta: {
fontSize: 11,
color: “#888”,
marginTop: 3,
display: “flex”,
gap: 6,
fontFamily: “‘JetBrains Mono’, monospace”,
flexWrap: “wrap”,
},
cardRight: { display: “flex”, alignItems: “center”, gap: 10, flexShrink: 0, marginLeft: 8 },
badge: {
fontFamily: “‘JetBrains Mono’, monospace”,
fontSize: 10,
fontWeight: 700,
letterSpacing: 1,
padding: “4px 10px”,
borderRadius: 6,
border: “1px solid”,
},
cardDetail: {
marginTop: 14,
paddingTop: 14,
borderTop: “1px solid #222”,
width: “100%”,
animation: “slideDown 0.25s ease”,
},
detailRow: { display: “flex”, justifyContent: “space-between”, padding: “6px 0”, fontSize: 12 },
detailLabel: {
color: “#666”,
fontFamily: “‘JetBrains Mono’, monospace”,
letterSpacing: 1,
textTransform: “uppercase”,
fontSize: 10,
},
detailValue: { color: “#ddd” },
detailMemo: {
marginTop: 12,
padding: 12,
background: “#0a0a0a”,
borderRadius: 8,
fontSize: 13,
color: “#ccc”,
lineHeight: 1.6,
whiteSpace: “pre-wrap”,
},
detailActions: { display: “flex”, gap: 8, marginTop: 14 },
detailBtn: {
flex: 1,
padding: 10,
borderRadius: 8,
border: “1px solid #333”,
background: “transparent”,
color: “#ccc”,
fontSize: 12,
fontWeight: 600,
cursor: “pointer”,
},
modalOverlay: {
position: “fixed”,
top: 0,
left: 0,
right: 0,
bottom: 0,
background: “rgba(0,0,0,0.7)”,
zIndex: 100,
display: “flex”,
alignItems: “flex-start”,
justifyContent: “center”,
padding: “60px 16px 20px”,
overflowY: “auto”,
},
modal: {
background: “#111”,
border: “1px solid #222”,
borderRadius: 16,
padding: 20,
width: “100%”,
maxWidth: 500,
},
toast: {
position: “fixed”,
bottom: 24,
left: “50%”,
transform: “translateX(-50%)”,
background: “#1a1a1a”,
border: “1px solid #333”,
borderRadius: 10,
padding: “12px 18px”,
display: “flex”,
alignItems: “center”,
gap: 16,
fontSize: 13,
color: “#ccc”,
zIndex: 200,
},
toastBtn: {
background: “none”,
border: “none”,
color: “#ff3b30”,
fontWeight: 700,
cursor: “pointer”,
fontSize: 13,
},
swipeBg: {
position: “absolute”,
top: 0,
left: 0,
right: 0,
bottom: 0,
display: “flex”,
alignItems: “center”,
borderRadius: 12,
fontSize: 14,
},
};