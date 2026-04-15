import { useState, useEffect, useCallback, useMemo } from "react";

const IMPORTANCE = [
  { value: 3, label: "高", color: "#ff3b30" },
  { value: 2, label: "中", color: "#ff9500" },
  { value: 1, label: "低", color: "#8e8e93" },
];

const WEIGHT = [
  { value: 3, label: "重い", hours: "4h+" },
  { value: 2, label: "普通", hours: "1-4h" },
  { value: 1, label: "軽い", hours: "~1h" },
  { value: 0, label: "超軽い", hours: "~10m" },
];

function calcPriorityScore(task) {
  if (task.done) return -999;

  if (!task.deadline) {
    return task.importance * 15 + task.weight * 5 + 5;
  }

  const now = Date.now();
  const deadline = new Date(task.deadline).getTime();
  const msLeft = deadline - now;
  const hoursLeft = msLeft / (1000 * 60 * 60);

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

function getScoreLabel(score) {
  if (score >= 1000) return { text: "OVERDUE", color: "#ff3b30" };
  if (score >= 80) return { text: "NOW", color: "#ff3b30" };
  if (score >= 60) return { text: "SOON", color: "#ff9500" };
  if (score >= 40) return { text: "NEXT", color: "#ffcc00" };
  return { text: "LATER", color: "#8e8e93" };
}

function formatDeadline(d) {
  if (!d) return "期限なし";
  const now = new Date();
  const dl = new Date(d);
  const diff = dl - now;
  const h = diff / (1000 * 60 * 60);
  if (h < 0) return "期限切れ";
  if (h < 1) return `${Math.round(h * 60)}分後`;
  if (h < 24) return `${Math.round(h)}時間後`;
  if (h < 48) return "明日";
  const days = Math.round(h / 24);
  if (days <= 7) return `${days}日後`;
  return `${dl.getMonth() + 1}/${dl.getDate()}`;
}

function getDefaultDeadline() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(18, 0, 0, 0);
  return d.toISOString().slice(0, 16);
}

const STORAGE_KEY = "task-queue-v1";

function loadTasks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveTasks(tasks) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch {}
}

export default function App() {
  const [tasks, setTasks] = useState(() => loadTasks());
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [importance, setImportance] = useState(2);
  const [weight, setWeight] = useState(2);
  const [deadline, setDeadline] = useState(getDefaultDeadline());
  const [hasDeadline, setHasDeadline] = useState(true);
  const [filter, setFilter] = useState("active");
  const [editId, setEditId] = useState(null);

  useEffect(() => {
    saveTasks(tasks);
  }, [tasks]);

  const resetForm = useCallback(() => {
    setTitle("");
    setImportance(2);
    setWeight(2);
    setDeadline(getDefaultDeadline());
    setHasDeadline(true);
    setShowForm(false);
    setEditId(null);
  }, []);

  const handleSubmit = useCallback(() => {
    if (!title.trim()) return;
    if (editId) {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === editId
            ? { ...t, title: title.trim(), importance, weight, deadline: hasDeadline ? deadline : null }
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
        done: false,
        createdAt: Date.now(),
      };
      setTasks((prev) => [...prev, newTask]);
    }
    resetForm();
  }, [title, importance, weight, deadline, hasDeadline, editId, resetForm]);

  const toggleDone = useCallback((id) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  }, []);

  const deleteTask = useCallback((id) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const startEdit = useCallback((task) => {
    setTitle(task.title);
    setImportance(task.importance);
    setWeight(task.weight);
    setDeadline(task.deadline || getDefaultDeadline());
    setHasDeadline(!!task.deadline);
    setEditId(task.id);
    setShowForm(true);
  }, []);

  const sorted = useMemo(() => {
    const scored = tasks.map((t) => ({ ...t, score: calcPriorityScore(t) }));
    scored.sort((a, b) => b.score - a.score);
    if (filter === "active") return scored.filter((t) => !t.done);
    if (filter === "done") return scored.filter((t) => t.done);
    return scored;
  }, [tasks, filter]);

  const topTask = useMemo(() => sorted.find((t) => !t.done && t.score > 0), [sorted]);

  return (
    <div style={styles.root}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700;800&family=Noto+Sans+JP:wght@400;500;700;900&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body, #root { min-height: 100vh; background: #0a0a0a; }
        input, select, button { font-family: 'Noto Sans JP', sans-serif; }
        @keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.5; } }
        @keyframes slideUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        .task-card { animation: fadeIn 0.3s ease both; }
        .task-card:hover { background: #1a1a1a !important; }
        .score-badge { animation: fadeIn 0.4s ease both; }
        .btn-hover:hover { filter: brightness(1.2); }
        .chip:hover { filter: brightness(1.3); }
        .overdue-pulse { animation: pulse 1.5s ease infinite; }
        .form-slide { animation: slideUp 0.3s ease both; }
      `}</style>

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
        <button
          className="btn-hover"
          style={styles.addBtn}
          onClick={() => { resetForm(); setShowForm(true); }}
        >
          +
        </button>
      </div>

      {/* Top Priority Banner */}
      {topTask && !showForm && (
        <div style={{ ...styles.topBanner, borderColor: getScoreLabel(topTask.score).color }}>
          <div style={styles.topLabel}>
            <span style={{ color: getScoreLabel(topTask.score).color, fontFamily: "JetBrains Mono" }}>
              ● 今やるべきタスク
            </span>
          </div>
          <div style={styles.topTitle}>{topTask.title}</div>
          <div style={styles.topMeta}>
            <span>{formatDeadline(topTask.deadline)}</span>
            <span style={{ opacity: 0.3 }}>|</span>
            <span>スコア {Math.round(topTask.score)}</span>
          </div>
        </div>
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
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
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
                    background: weight === opt.value ? "#fff" : "#1a1a1a",
                    color: weight === opt.value ? "#000" : "#888",
                    borderColor: weight === opt.value ? "#fff" : "#333",
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
          <button className="btn-hover" style={styles.submitBtn} onClick={handleSubmit}>
            {editId ? "更新する" : "追加する"}
          </button>
        </div>
      )}

      {/* Filter */}
      <div style={styles.filterRow}>
        {["active", "all", "done"].map((f) => (
          <button
            key={f}
            className="chip"
            style={{
              ...styles.filterChip,
              background: filter === f ? "#fff" : "transparent",
              color: filter === f ? "#000" : "#666",
            }}
            onClick={() => setFilter(f)}
          >
            {f === "active" ? "アクティブ" : f === "all" ? "すべて" : "完了済み"}
          </button>
        ))}
      </div>

      {/* Task List */}
      <div style={styles.list}>
        {sorted.length === 0 && (
          <div style={styles.empty}>
            {filter === "done" ? "完了タスクなし" : "タスクを追加しましょう"}
          </div>
        )}
        {sorted.map((task, i) => {
          const label = getScoreLabel(task.score);
          const isOverdue = task.score >= 1000;
          return (
            <div
              key={task.id}
              className="task-card"
              style={{ ...styles.card, animationDelay: `${i * 0.05}s`, opacity: task.done ? 0.4 : 1 }}
            >
              <div style={styles.cardLeft}>
                <button
                  style={{
                    ...styles.checkbox,
                    background: task.done ? "#ff3b30" : "transparent",
                    borderColor: task.done ? "#ff3b30" : "#444",
                  }}
                  onClick={() => toggleDone(task.id)}
                >
                  {task.done && <span style={{ fontSize: 12 }}>✓</span>}
                </button>
                <div style={styles.cardContent}>
                  <div style={{ ...styles.cardTitle, textDecoration: task.done ? "line-through" : "none" }}>
                    {task.title}
                  </div>
                  <div style={styles.cardMeta}>
                    <span style={{ color: IMPORTANCE.find((x) => x.value === task.importance)?.color, fontWeight: 600 }}>
                      {IMPORTANCE.find((x) => x.value === task.importance)?.label}
                    </span>
                    <span style={{ opacity: 0.3 }}>·</span>
                    <span>{WEIGHT.find((x) => x.value === task.weight)?.label}</span>
                    <span style={{ opacity: 0.3 }}>·</span>
                    <span style={{ color: isOverdue ? "#ff3b30" : "#888" }}>
                      {formatDeadline(task.deadline)}
                    </span>
                  </div>
                </div>
              </div>
              <div style={styles.cardRight}>
                {!task.done && (
                  <span
                    className={`score-badge ${isOverdue ? "overdue-pulse" : ""}`}
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
                <div style={styles.actions}>
                  {!task.done && (
                    <button style={styles.actionBtn} onClick={() => startEdit(task)}>✎</button>
                  )}
                  <button style={{ ...styles.actionBtn, color: "#ff3b30" }} onClick={() => deleteTask(task.id)}>✕</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Score Legend */}
      <div style={styles.legend}>
        <span style={styles.legendTitle}>Priority Score</span>
        <div style={styles.legendItems}>
          {[
            { text: "NOW", color: "#ff3b30" },
            { text: "SOON", color: "#ff9500" },
            { text: "NEXT", color: "#ffcc00" },
            { text: "LATER", color: "#8e8e93" },
          ].map((l) => (
            <span key={l.text} style={{ ...styles.legendItem, color: l.color }}>● {l.text}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

const styles = {
  root: {
    minHeight: "100vh",
    background: "#0a0a0a",
    color: "#e0e0e0",
    fontFamily: "'Noto Sans JP', sans-serif",
    padding: "20px 16px 100px",
    maxWidth: 600,
    margin: "0 auto",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
  },
  logo: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 22,
    fontWeight: 800,
    letterSpacing: 2,
    color: "#fff",
    margin: 0,
  },
  sub: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    border: "1px solid #333",
    background: "#ff3b30",
    color: "#fff",
    fontSize: 24,
    fontWeight: 700,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s",
  },
  topBanner: {
    background: "#111",
    border: "1px solid",
    borderRadius: 16,
    padding: "16px 18px",
    marginBottom: 20,
  },
  topLabel: { fontSize: 11, fontWeight: 700, marginBottom: 6, letterSpacing: 1 },
  topTitle: { fontSize: 18, fontWeight: 700, color: "#fff", marginBottom: 6 },
  topMeta: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 11,
    color: "#888",
    display: "flex",
    gap: 8,
  },
  form: {
    background: "#111",
    border: "1px solid #222",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  formHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  formTitle: { fontSize: 16, fontWeight: 700, color: "#fff" },
  closeBtn: {
    background: "none",
    border: "none",
    color: "#666",
    fontSize: 18,
    cursor: "pointer",
  },
  input: {
    width: "100%",
    padding: "12px 14px",
    background: "#1a1a1a",
    border: "1px solid #333",
    borderRadius: 10,
    color: "#fff",
    fontSize: 15,
    outline: "none",
    marginBottom: 16,
  },
  fieldGroup: { marginBottom: 14 },
  fieldLabel: {
    fontSize: 11,
    fontWeight: 700,
    color: "#888",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
    display: "block",
    fontFamily: "'JetBrains Mono', monospace",
  },
  chipRow: { display: "flex", gap: 8, flexWrap: "wrap" },
  chip: {
    padding: "8px 16px",
    borderRadius: 8,
    border: "1px solid",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.2s",
    display: "flex",
    alignItems: "center",
  },
  dateInput: {
    width: "100%",
    padding: "10px 14px",
    background: "#1a1a1a",
    border: "1px solid #333",
    borderRadius: 10,
    color: "#fff",
    fontSize: 14,
    outline: "none",
    colorScheme: "dark",
  },
  submitBtn: {
    width: "100%",
    padding: "14px",
    background: "#ff3b30",
    border: "none",
    borderRadius: 10,
    color: "#fff",
    fontSize: 15,
    fontWeight: 700,
    cursor: "pointer",
    marginTop: 8,
    transition: "all 0.2s",
  },
  filterRow: { display: "flex", gap: 6, marginBottom: 16 },
  filterChip: {
    padding: "6px 14px",
    borderRadius: 8,
    border: "1px solid #333",
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.2s",
  },
  list: { display: "flex", flexDirection: "column", gap: 8 },
  empty: {
    textAlign: "center",
    padding: 40,
    color: "#444",
    fontSize: 14,
    fontFamily: "'JetBrains Mono', monospace",
  },
  card: {
    background: "#111",
    border: "1px solid #1a1a1a",
    borderRadius: 12,
    padding: "14px 16px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    transition: "all 0.2s",
    cursor: "default",
  },
  cardLeft: { display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    border: "2px solid",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    flexShrink: 0,
    transition: "all 0.2s",
    color: "#fff",
    fontSize: 12,
    fontWeight: 700,
  },
  cardContent: { flex: 1, minWidth: 0 },
  cardTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: "#fff",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  cardMeta: {
    fontSize: 11,
    color: "#888",
    marginTop: 3,
    display: "flex",
    gap: 6,
    fontFamily: "'JetBrains Mono', monospace",
  },
  cardRight: { display: "flex", alignItems: "center", gap: 10, flexShrink: 0, marginLeft: 8 },
  badge: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: 1,
    padding: "4px 10px",
    borderRadius: 6,
    border: "1px solid",
  },
  actions: { display: "flex", gap: 4 },
  actionBtn: {
    background: "none",
    border: "none",
    color: "#666",
    fontSize: 16,
    cursor: "pointer",
    padding: 4,
    transition: "color 0.2s",
  },
  legend: {
    marginTop: 32,
    padding: "14px 16px",
    background: "#111",
    borderRadius: 10,
    border: "1px solid #1a1a1a",
  },
  legendTitle: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 10,
    color: "#666",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  legendItems: {
    display: "flex",
    gap: 16,
    marginTop: 8,
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 11,
  },
  legendItem: { fontWeight: 600 },
};
