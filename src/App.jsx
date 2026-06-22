import { useState, useEffect, useRef } from "react";
import {
  Flame, ChevronDown, Check, RotateCcw, Calendar, X, RefreshCw,
  Star, Pin, Clock, Sparkles, Send, Mic, MicOff, ImagePlus, Trash2,
} from "lucide-react";

const STORAGE_KEY = "jee-blueprint-data";

const appStorage = {
  async get(key) {
    return { value: localStorage.getItem(key) };
  },
  async set(key, value) {
    localStorage.setItem(key, value);
    return { success: true };
  },
};

const SYLLABUS = {
  physics: {
    label: "Physics", short: "PHY", accent: "#2F6FED", accentSoft: "#E7EEFD",
    highWeight: ["Kinematics","Rotational Motion","Electrostatics","Current Electricity","Optics","Atoms & Nuclei"],
    chapters: ["Units & Measurements","Kinematics","Laws of Motion","Work, Energy & Power","Rotational Motion","Gravitation","Properties of Matter","Thermodynamics","Kinetic Theory of Gases","Oscillations & Waves","Electrostatics","Current Electricity","Magnetic Effects of Current","EM Induction & AC","Optics","Dual Nature of Matter","Atoms & Nuclei","Electronic Devices"],
  },
  chemistry: {
    label: "Chemistry", short: "CHE", accent: "#169E8B", accentSoft: "#E3F5F2",
    highWeight: ["Chemical Bonding","Equilibrium","Coordination Compounds","p-Block Elements","Isomerism & GOC","Aldehydes, Ketones & Acids"],
    chapters: ["Basic Concepts","Atomic Structure","Chemical Bonding","States of Matter","Thermodynamics","Equilibrium","Redox & Electrochemistry","Chemical Kinetics","Solutions","Periodicity","p-Block Elements","d & f Block Elements","Coordination Compounds","Isomerism & GOC","Hydrocarbons","Alcohols, Phenols & Ethers","Aldehydes, Ketones & Acids","Amines & Biomolecules"],
  },
  maths: {
    label: "Maths", short: "MAT", accent: "#E0703A", accentSoft: "#FBEAE0",
    highWeight: ["Matrices & Determinants","Integration","Straight Lines & Circles","Conic Sections","Vector Algebra","Probability & Statistics"],
    chapters: ["Sets, Relations & Functions","Complex Numbers","Quadratic Equations","Sequences & Series","Permutations & Combinations","Binomial Theorem","Matrices & Determinants","Limits & Continuity","Differentiability","Applications of Derivatives","Integration","Differential Equations","Straight Lines & Circles","Conic Sections","3D Geometry","Vector Algebra","Probability & Statistics"],
  },
};

const DOUBT_SYSTEM_PROMPT = `You are Blueprint — an expert JEE (Main + Advanced) AI tutor for Physics, Chemistry, and Mathematics.

LANGUAGE DETECTION RULE (Most Important):
- Detect the language the student used to ask the question.
- If student wrote in Hindi (Devanagari or Roman Hindi like "yeh kya hai", "samjhao", "kaise karte hain") => Answer fully in Hindi.
- If student wrote in English => Answer in English.
- If student mixed Hindi+English (Hinglish) => Answer in Hinglish.
- NEVER use Marathi in your responses. If student writes in Marathi, respond in Hindi.
- NEVER use any other language except English and Hindi.

ACCURACY RULES:
- Never make calculation errors. Double-check every numerical step before writing.
- Easy/simple questions => give short, crisp, direct answers. Do not over-explain.
- Hard JEE Advanced questions => give full rigorous step-by-step solution with clear reasoning.
- Always state the formula or concept name at the start of solution.
- If an image is provided, carefully read every symbol, number, diagram, and equation before solving.
- If question is outside JEE Physics/Chemistry/Maths scope, politely redirect in the student's language.

FORMAT: Plain text only. No asterisks, no dashes, no markdown. Use numbered steps (1. 2. 3.) for solutions. Use => for therefore/implies.`;

const NUDGE_SYSTEM_PROMPT = `You are a JEE prep coach. Given a student's syllabus stats, write ONE specific motivating nudge for today. Max 22 words. English only. No greeting. No quotes. Plain text.`;

const FALLBACK_NUDGES = [
  "Pick your weakest subject and give it the first hour today.",
  "Revise one flagged chapter before starting anything new.",
  "Small consistent effort beats last-minute cramming every time.",
  "Your streak is a habit. Protect it today.",
];

function buildDefaultData() {
  const subjects = {};
  Object.keys(SYLLABUS).forEach((key) => {
    subjects[key] = SYLLABUS[key].chapters.map((name, i) => ({ id: `${key}-${i}`, name, status: "todo" }));
  });
  return { examDate: null, streak: { count: 0, lastDate: null }, studyLog: {}, todayFocus: { date: null, ids: [] }, aiNudge: { date: null, text: "" }, subjects };
}

function todayStr() { return new Date().toISOString().slice(0, 10); }
function daysBetween(a, b) { return Math.ceil((new Date(b) - new Date(a)) / 86400000); }
function subjectProgress(chapters) {
  const done = chapters.filter((c) => c.status === "done" || c.status === "revise").length;
  return chapters.length === 0 ? 0 : Math.round((done / chapters.length) * 100);
}
function prepPhase(cd) {
  if (cd === null || cd < 0) return null;
  if (cd <= 30) return { label: "Final Sprint", color: "#D9483A" };
  if (cd <= 90) return { label: "Revision Phase", color: "#D99A2B" };
  if (cd <= 180) return { label: "Building Speed", color: "#2F6FED" };
  return { label: "Foundation Phase", color: "#169E8B" };
}
function lastNDays(n) {
  return Array.from({ length: n }, (_, i) => new Date(Date.now() - (n - 1 - i) * 86400000).toISOString().slice(0, 10));
}
function buildStatsContext(data) {
  const entries = Object.entries(data.subjects).map(([k, ch]) => ({ label: SYLLABUS[k].label, pct: subjectProgress(ch) }));
  const weakest = entries.reduce((a, b) => (b.pct < a.pct ? b : a), entries[0]);
  const overall = subjectProgress(Object.values(data.subjects).flat());
  const countdown = data.examDate ? daysBetween(todayStr(), data.examDate) : null;
  return `Overall: ${overall}%. ${entries.map(e => `${e.label} ${e.pct}%`).join(", ")}. Weakest: ${weakest.label}. Streak: ${data.streak.count} days. ${countdown !== null ? `Days left: ${countdown}.` : "No exam date."}`;
}

async function callClaude(system, userText, imageBase64 = null, imageMime = null) {
  const endpoint = import.meta.env.VITE_AI_ENDPOINT;

  if (!endpoint) {
    throw new Error("AI backend is not connected yet. The tracker works now; AI doubt solver needs backend setup.");
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ system, userText, imageBase64, imageMime }),
  });

  const json = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(json?.error || json?.message || `API error ${response.status}`);

  const text = json.answer || json.text || json.content || "";
  if (!text.trim()) throw new Error("Empty response from AI");
  return text.trim();
}

function StatusGlyph({ status, accent }) {
  if (status === "done") return <span className="glyph glyph-done" style={{ background: accent, borderColor: accent }}><Check size={12} strokeWidth={3} color="#fff" /></span>;
  if (status === "revise") return <span className="glyph glyph-revise" style={{ borderColor: "#D99A2B" }}><RotateCcw size={11} strokeWidth={2.5} color="#B97A12" /></span>;
  return <span className="glyph glyph-todo" style={{ borderColor: accent }} />;
}

function RulerBar({ percent, accent }) {
  return (
    <div className="ruler-wrap">
      <div className="ruler-track">
        {Array.from({ length: 11 }).map((_, i) => (
          <span key={i} className={`ruler-tick ${i % 5 === 0 ? "ruler-tick-major" : ""}`} style={{ left: `${i * 10}%` }} />
        ))}
        <div className="ruler-fill" style={{ width: `${percent}%`, background: accent }} />
        <div className="ruler-marker" style={{ left: `${percent}%`, borderColor: accent }} />
      </div>
      <span className="ruler-pct" style={{ color: accent }}>{percent}%</span>
    </div>
  );
}

function ChapterRow({ chapter, index, meta, pinned, onCycle, onTogglePin }) {
  const isHW = meta.highWeight && meta.highWeight.includes(chapter.name);
  return (
    <div className="chapter-row">
      <button className="chapter-row-main" onClick={onCycle}>
        <span className="chapter-num">{String(index + 1).padStart(2, "0")}</span>
        <span className={`chapter-name ${chapter.status === "done" ? "chapter-name-done" : ""}`}>{chapter.name}</span>
        {isHW && <Star size={11} fill="#D99A2B" color="#D99A2B" style={{ flexShrink: 0 }} />}
      </button>
      <button className={`pin-btn ${pinned ? "pin-btn-active" : ""}`} onClick={onTogglePin}>
        <Pin size={13} fill={pinned ? "#2F6FED" : "none"} color={pinned ? "#2F6FED" : "#A7B4C4"} />
      </button>
      <button className="status-btn" onClick={onCycle}><StatusGlyph status={chapter.status} accent={meta.accent} /></button>
    </div>
  );
}

function SubjectCard({ subjectKey, meta, chapters, expanded, onToggleExpand, onCycle, focusIds, onTogglePin }) {
  const pct = subjectProgress(chapters);
  const doneCount = chapters.filter((c) => c.status === "done" || c.status === "revise").length;
  return (
    <div className="subject-card">
      <button className="subject-head" onClick={() => onToggleExpand(subjectKey)}>
        <div className="subject-head-left">
          <span className="subject-tag" style={{ background: meta.accentSoft, color: meta.accent }}>{meta.short}</span>
          <div className="subject-titles">
            <span className="subject-name-row">
              <span className="subject-name">{meta.label}</span>
              {pct === 100 && <span className="mastered-badge">Mastered</span>}
            </span>
            <span className="subject-sub">{doneCount} / {chapters.length} chapters logged</span>
          </div>
        </div>
        <ChevronDown size={18} color="#7C8AA0" style={{ transform: expanded ? "rotate(180deg)" : "none", transition: "transform .2s ease" }} />
      </button>
      <div className="subject-bar-row"><RulerBar percent={pct} accent={meta.accent} /></div>
      {expanded && (
        <div className="chapter-list">
          {chapters.map((c, i) => (
            <ChapterRow key={c.id} chapter={c} index={i} meta={meta} pinned={focusIds.includes(c.id)}
              onCycle={() => onCycle(subjectKey, c.id)}
              onTogglePin={(e) => { e.stopPropagation(); onTogglePin(c.id); }} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Doubt section ───────────────────────────────────────────────
function DoubtSection({ doubts, setDoubts }) {
  const [text, setText] = useState("");
  const [imageBase64, setImageBase64] = useState(null);
  const [imageMime, setImageMime] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [micSupported, setMicSupported] = useState(false);
  const fileRef = useRef(null);
  const recogRef = useRef(null);

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SR) setMicSupported(true);
  }, []);

  const isAsking = doubts.some((d) => d.status === "loading");

  const handleImage = (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      const base64 = dataUrl.split(",")[1];
      setImageBase64(base64);
      setImageMime(file.type);
      setImagePreview(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const clearImage = () => { setImageBase64(null); setImageMime(null); setImagePreview(null); };

  const toggleMic = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    if (isListening) {
      recogRef.current && recogRef.current.stop();
      setIsListening(false);
      return;
    }
    const r = new SR();
    r.lang = "hi-IN";
    r.continuous = false;
    r.interimResults = false;
    r.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setText((prev) => (prev ? prev + " " + transcript : transcript));
    };
    r.onerror = () => setIsListening(false);
    r.onend = () => setIsListening(false);
    recogRef.current = r;
    r.start();
    setIsListening(true);
  };

  const ask = async () => {
    const question = text.trim();
    if (!question && !imageBase64) return;
    const id = `${Date.now()}`;
    const displayQ = question || "(Image question)";
    setDoubts((prev) => [{ id, question: displayQ, answer: "", status: "loading", imagePreview }, ...prev]);
    setText("");
    clearImage();
    try {
      const answer = await callClaude(DOUBT_SYSTEM_PROMPT, question, imageBase64, imageMime);
      setDoubts((prev) => prev.map((d) => d.id === id ? { ...d, answer, status: "done" } : d));
    } catch (e) {
      setDoubts((prev) => prev.map((d) => d.id === id ? { ...d, answer: e.message || "Error", status: "error" } : d));
    }
  };

  return (
    <section className="doubt-section">
      <span className="section-label"><Sparkles size={11} /> Ask Blueprint AI</span>

      {imagePreview && (
        <div className="image-preview-wrap">
          <img src={imagePreview} alt="uploaded" className="image-preview" />
          <button className="remove-img-btn" onClick={clearImage}><X size={13} /></button>
        </div>
      )}

      <div className="doubt-input-row">
        <input
          type="text"
          className="doubt-input"
          placeholder={imagePreview ? "Add text (optional) and send…" : "Type doubt in English or Hindi…"}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") ask(); }}
        />
        <button className="tool-btn" onClick={() => fileRef.current && fileRef.current.click()} title="Upload image">
          <ImagePlus size={16} color="#5B6B82" />
        </button>
        {micSupported && (
          <button className={`tool-btn ${isListening ? "tool-btn-active" : ""}`} onClick={toggleMic} title="Voice input">
            {isListening ? <MicOff size={16} color="#D9483A" /> : <Mic size={16} color="#5B6B82" />}
          </button>
        )}
        <button className="doubt-send" onClick={ask} disabled={(!text.trim() && !imageBase64) || isAsking}>
          <Send size={15} />
        </button>
        <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => handleImage(e.target.files[0])} />
      </div>

      {isListening && (
        <div className="mic-indicator">
          <span className="mic-dot" /><span className="mic-dot" /><span className="mic-dot" />
          <span style={{ fontSize: 11, color: "#D9483A", fontFamily: "IBM Plex Mono, monospace" }}>Listening… speak your doubt</span>
        </div>
      )}

      {doubts.length > 0 && (
        <div className="note-stack">
          {doubts.map((d, i) => (
            <div key={d.id} className="sticky-note" style={{ transform: `rotate(${(i % 2 === 0 ? -1 : 1) * 1.1}deg)` }}>
              <span className="note-tape" />
              <div className="note-head">
                <p className="note-question">{d.question}</p>
                <button className="note-del" onClick={() => setDoubts((prev) => prev.filter((x) => x.id !== d.id))}>
                  <Trash2 size={12} color="#B0392E" />
                </button>
              </div>
              {d.imagePreview && <img src={d.imagePreview} alt="q" className="note-img" />}
              {d.status === "loading" && (
                <div className="note-loading"><span className="dot" /><span className="dot" /><span className="dot" /></div>
              )}
              {d.status === "error" && <p className="note-error">⚠ {d.answer || "Couldn't reach the tutor"}</p>}
              {d.status === "done" && <p className="note-answer">{d.answer}</p>}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

// ─── Main App ────────────────────────────────────────────────────
export default function JeeBlueprint() {
  const [data, setData] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [expanded, setExpanded] = useState("physics");
  const [showDatePrompt, setShowDatePrompt] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [doubts, setDoubts] = useState([]);
  const [ringMounted, setRingMounted] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await appStorage.get(STORAGE_KEY, false);
        let next = buildDefaultData();
        if (res && res.value) {
          const parsed = JSON.parse(res.value);
          next = { ...buildDefaultData(), ...parsed, subjects: parsed.subjects || buildDefaultData().subjects };
        }
        if (next.todayFocus.date !== todayStr()) next.todayFocus = { date: todayStr(), ids: [] };
        setData(next);
      } catch (e) {
        setData(buildDefaultData());
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    setTimeout(() => setRingMounted(true), 100);
  }, [loaded]);

  useEffect(() => {
    if (!loaded || !data) return;
    const today = todayStr();
    if (data.aiNudge?.date === today && data.aiNudge?.text) return;
    (async () => {
      let nudgeText = "";
      try { nudgeText = await callClaude(NUDGE_SYSTEM_PROMPT, buildStatsContext(data)); } catch (e) { /* silent */ }
      if (!nudgeText) nudgeText = FALLBACK_NUDGES[Math.floor(Math.random() * FALLBACK_NUDGES.length)];
      const next = { ...data, aiNudge: { date: today, text: nudgeText } };
      setData(next);
      try { await appStorage.set(STORAGE_KEY, JSON.stringify(next), false); } catch (e) { /* silent */ }
    })();
  }, [loaded]); // eslint-disable-line

  const persist = async (next) => {
    setData(next);
    try { await appStorage.set(STORAGE_KEY, JSON.stringify(next), false); } catch (e) { /* silent */ }
  };

  if (!loaded || !data) return (
    <div className="jee-app jee-loading"><style>{CSS}</style>
      <div className="loading-mark"><span className="loading-dot" />Opening your blueprint…</div>
    </div>
  );

  const order = ["todo", "done", "revise"];
  const cycleStatus = (subjectKey, chapterId) => {
    const next = JSON.parse(JSON.stringify(data));
    const ch = next.subjects[subjectKey].find((c) => c.id === chapterId);
    ch.status = order[(order.indexOf(ch.status) + 1) % order.length];
    persist(next);
  };

  const togglePin = (chapterId) => {
    const next = JSON.parse(JSON.stringify(data));
    const ids = next.todayFocus.ids;
    next.todayFocus = { date: todayStr(), ids: ids.includes(chapterId) ? ids.filter(id => id !== chapterId) : [...ids, chapterId] };
    persist(next);
  };

  const addMinutes = (mins) => {
    const today = todayStr();
    const next = JSON.parse(JSON.stringify(data));
    next.studyLog[today] = (next.studyLog[today] || 0) + mins;
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    if (next.streak.lastDate !== today) {
      next.streak.count = next.streak.lastDate === yesterday ? next.streak.count + 1 : 1;
      next.streak.lastDate = today;
    }
    persist(next);
  };

  const findChapter = (id) => {
    const subjectKey = id.split("-")[0];
    const chapter = data.subjects[subjectKey].find((c) => c.id === id);
    return { subjectKey, meta: SYLLABUS[subjectKey], chapter };
  };

  const allChapters = Object.values(data.subjects).flat();
  const overallPct = subjectProgress(allChapters);
  const todayMinutes = data.studyLog[todayStr()] || 0;
  const countdown = data.examDate ? daysBetween(todayStr(), data.examDate) : null;
  const phase = prepPhase(countdown);
  const week = lastNDays(7).map(date => ({ date, minutes: data.studyLog[date] || 0, isToday: date === todayStr() }));
  const weekTotalMin = week.reduce((s, d) => s + d.minutes, 0);
  const focusChapters = data.todayFocus.ids.map(findChapter).filter((x) => x.chapter);
  const revisionChapters = allChapters.filter((c) => c.status === "revise").map((c) => findChapter(c.id));

  const ringR = 30, ringC = 2 * Math.PI * ringR;
  const ringOffset = ringC - ((ringMounted ? overallPct : 0) / 100) * ringC;
  const dotLevel = (mins) => (mins === 0 ? 0 : mins < 30 ? 1 : mins < 60 ? 2 : 3);

  return (
    <div className="jee-app">
      <style>{CSS}</style>

      <header className="hero">
        <div className="hero-top">
          <div>
            <span className="eyebrow">JEE PREP LOG</span>
            <h1 className="hero-title">Blueprint</h1>
          </div>
          <button className="icon-btn" onClick={() => setShowReset(true)}><RefreshCw size={15} /></button>
        </div>

        <div className="hero-stats">
          <div className="ring-wrap">
            <svg viewBox="0 0 72 72" className="ring-svg">
              <circle cx="36" cy="36" r={ringR} className="ring-track" />
              <circle cx="36" cy="36" r={ringR} className="ring-fill" strokeDasharray={ringC} strokeDashoffset={ringOffset} />
            </svg>
            <div className="ring-label">
              <span className="ring-pct">{overallPct}%</span>
              <span className="ring-caption">synced</span>
            </div>
          </div>
          <div className="hero-side">
            <button className="exam-pill" onClick={() => setShowDatePrompt(true)}>
              <Calendar size={13} />
              {countdown !== null ? <span><strong>{countdown}</strong> days to D-day</span> : <span>Set exam date</span>}
              {phase && <span className="phase-tag" style={{ color: phase.color, borderColor: phase.color }}>{phase.label}</span>}
            </button>
            <div className="streak-row">
              <span className="streak-pill"><Flame size={13} color="#E0703A" />{data.streak.count} day streak</span>
              <span className="time-pill"><Clock size={12} color="#5B6B82" />{todayMinutes} min today</span>
            </div>
          </div>
        </div>

        {data.aiNudge?.text && (
          <div className="nudge-strip">
            <Sparkles size={13} color="#D99A2B" style={{ flexShrink: 0, marginTop: 2 }} />
            <span className="nudge-text">{data.aiNudge.text}</span>
          </div>
        )}

        <div className="quick-add-row">
          {[15, 30, 60].map((m) => <button key={m} className="quick-add-chip" onClick={() => addMinutes(m)}>+{m}m</button>)}
        </div>

        <div className="heatmap-row">
          {week.map((d) => (
            <div key={d.date} className="heatmap-cell">
              <span className={`heatmap-dot heatmap-level-${dotLevel(d.minutes)} ${d.isToday ? "heatmap-dot-today" : ""}`} />
              <span className="heatmap-day">{new Date(d.date).toLocaleDateString("en-US", { weekday: "narrow" })}</span>
            </div>
          ))}
          <span className="heatmap-total">{Math.round(weekTotalMin / 6) / 10}h this week</span>
        </div>
      </header>

      <DoubtSection doubts={doubts} setDoubts={setDoubts} />

      {focusChapters.length > 0 && (
        <section className="focus-section">
          <span className="section-label"><Pin size={11} /> Today's focus</span>
          <div className="focus-list">
            {focusChapters.map(({ subjectKey, meta, chapter }) => (
              <button key={chapter.id} className="focus-row" onClick={() => cycleStatus(subjectKey, chapter.id)}>
                <span className="subject-dot" style={{ background: meta.accent }} />
                <span className={`chapter-name ${chapter.status === "done" ? "chapter-name-done" : ""}`}>{chapter.name}</span>
                <StatusGlyph status={chapter.status} accent={meta.accent} />
              </button>
            ))}
          </div>
        </section>
      )}

      {revisionChapters.length > 0 && (
        <section className="revise-section">
          <span className="section-label"><RotateCcw size={11} /> Revision queue ({revisionChapters.length})</span>
          <div className="focus-list">
            {revisionChapters.map(({ subjectKey, meta, chapter }) => (
              <button key={chapter.id} className="focus-row" onClick={() => cycleStatus(subjectKey, chapter.id)}>
                <span className="subject-dot" style={{ background: meta.accent }} />
                <span className="chapter-name">{chapter.name}</span>
                <StatusGlyph status={chapter.status} accent={meta.accent} />
              </button>
            ))}
          </div>
        </section>
      )}

      <main className="subject-list">
        {Object.entries(SYLLABUS).map(([key, meta]) => (
          <SubjectCard key={key} subjectKey={key} meta={meta} chapters={data.subjects[key]}
            expanded={expanded === key} onToggleExpand={(k) => setExpanded(expanded === k ? null : k)}
            onCycle={cycleStatus} focusIds={data.todayFocus.ids} onTogglePin={togglePin} />
        ))}
      </main>

      <footer className="legend">
        <span><span className="legend-dot legend-todo" /> not started</span>
        <span><span className="legend-dot legend-done" /> done</span>
        <span><span className="legend-dot legend-revise" /> revise</span>
        <span><Star size={9} fill="#D99A2B" color="#D99A2B" /> high weightage</span>
      </footer>

      {showDatePrompt && (
        <div className="sheet-backdrop" onClick={() => setShowDatePrompt(false)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-head"><span>Set your exam date</span><button className="icon-btn" onClick={() => setShowDatePrompt(false)}><X size={16} /></button></div>
            <input type="date" className="date-input" defaultValue={data.examDate || ""} onChange={(e) => { persist({ ...data, examDate: e.target.value || null }); setShowDatePrompt(false); }} />
            <p className="sheet-note">Countdown and prep phase update immediately.</p>
          </div>
        </div>
      )}

      {showReset && (
        <div className="sheet-backdrop" onClick={() => setShowReset(false)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-head"><span>Reset all progress?</span><button className="icon-btn" onClick={() => setShowReset(false)}><X size={16} /></button></div>
            <p className="sheet-note">This clears every chapter, streak, study log, and exam date. Cannot be undone.</p>
            <div className="sheet-actions">
              <button className="btn-ghost" onClick={() => setShowReset(false)}>Cancel</button>
              <button className="btn-danger" onClick={() => { persist(buildDefaultData()); setDoubts([]); setShowReset(false); }}>Reset everything</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@500;600&family=Caveat:wght@500;600;700&display=swap');

.jee-app {
  --ink:#14233B; --ink-soft:#5B6B82; --bg:#EAF1F6; --card:#FFFFFF; --border:#D7E3EC;
  font-family:'Inter',sans-serif; color:var(--ink); max-width:420px; margin:0 auto;
  background: linear-gradient(rgba(47,111,237,0.05) 1px,transparent 1px),
              linear-gradient(90deg,rgba(47,111,237,0.05) 1px,transparent 1px), var(--bg);
  background-size:18px 18px,18px 18px,100% 100%;
  border-radius:20px; padding:22px 18px 16px; box-sizing:border-box;
}
.jee-app * { box-sizing:border-box; }
.jee-app button { transition:transform .12s ease; }
.jee-app button:active { transform:scale(0.95); }

.jee-loading { display:flex; align-items:center; justify-content:center; min-height:280px; }
.loading-mark { display:flex; align-items:center; gap:8px; color:var(--ink-soft); font-family:'IBM Plex Mono',monospace; font-size:13px; }
.loading-dot { width:8px; height:8px; border-radius:50%; background:#2F6FED; animation:pulse 1.1s ease-in-out infinite; }
@keyframes pulse { 0%,100%{opacity:.3} 50%{opacity:1} }
@keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }

.hero,.doubt-section,.focus-section,.revise-section,.subject-list { animation:fadeUp .45s ease both; }
.doubt-section { animation-delay:.05s; } .focus-section { animation-delay:.08s; } .revise-section { animation-delay:.1s; } .subject-list { animation-delay:.12s; }

.hero-top { display:flex; justify-content:space-between; align-items:flex-start; }
.eyebrow { font-family:'IBM Plex Mono',monospace; font-size:10.5px; letter-spacing:.14em; color:#2F6FED; font-weight:600; }
.hero-title { font-family:'Space Grotesk',sans-serif; font-size:30px; font-weight:700; margin:2px 0 0; letter-spacing:-.01em; }

.icon-btn { background:var(--card); border:1px solid var(--border); border-radius:9px; width:32px; height:32px; display:flex; align-items:center; justify-content:center; color:var(--ink-soft); cursor:pointer; flex-shrink:0; }
.icon-btn:hover { color:var(--ink); }

.hero-stats { display:flex; align-items:center; gap:14px; margin-top:16px; }

.ring-wrap { position:relative; width:72px; height:72px; flex-shrink:0; }
.ring-svg { width:72px; height:72px; transform:rotate(-90deg); }
.ring-track { fill:none; stroke:#D7E3EC; stroke-width:6; }
.ring-fill { fill:none; stroke:#2F6FED; stroke-width:6; stroke-linecap:round; transition:stroke-dashoffset .9s cubic-bezier(.4,0,.2,1); }
.ring-label { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; }
.ring-pct { font-family:'Space Grotesk',sans-serif; font-size:16px; font-weight:700; }
.ring-caption { font-family:'IBM Plex Mono',monospace; font-size:8px; color:var(--ink-soft); letter-spacing:.06em; }

.hero-side { display:flex; flex-direction:column; gap:7px; flex:1; min-width:0; }
.exam-pill { display:flex; align-items:center; gap:6px; flex-wrap:wrap; font-family:'IBM Plex Mono',monospace; font-size:11.5px; background:var(--card); border:1px solid var(--border); border-radius:12px; padding:7px 12px; cursor:pointer; color:var(--ink); width:fit-content; }
.exam-pill strong { font-weight:700; color:#2F6FED; }
.phase-tag { font-size:9.5px; font-weight:600; border:1px solid; border-radius:999px; padding:2px 7px; }
.streak-row { display:flex; gap:6px; flex-wrap:wrap; }
.streak-pill,.time-pill { display:flex; align-items:center; gap:5px; font-family:'IBM Plex Mono',monospace; font-size:10.5px; background:var(--card); border:1px solid var(--border); border-radius:999px; padding:5px 10px; color:var(--ink-soft); }

.nudge-strip { display:flex; align-items:flex-start; gap:7px; margin-top:12px; padding:9px 12px; background:#FFF8E1; border:1px dashed #E0BD63; border-radius:10px; }
.nudge-text { font-family:'Caveat',cursive; font-size:17px; font-weight:600; color:#7A5B12; line-height:1.25; }

.quick-add-row { display:flex; gap:8px; margin-top:12px; }
.quick-add-chip { flex:1; font-family:'IBM Plex Mono',monospace; font-size:12px; font-weight:600; background:var(--card); border:1px solid var(--border); border-radius:9px; padding:7px 0; color:#2F6FED; cursor:pointer; }
.quick-add-chip:hover { background:#E7EEFD; }

.heatmap-row { display:flex; align-items:center; gap:6px; margin-top:12px; padding:10px 12px; background:var(--card); border:1px solid var(--border); border-radius:12px; }
.heatmap-cell { display:flex; flex-direction:column; align-items:center; gap:3px; }
.heatmap-dot { width:14px; height:14px; border-radius:4px; background:#E7EDF3; transition:background .3s; }
.heatmap-level-1{background:#BFE0DA;} .heatmap-level-2{background:#6FBDAE;} .heatmap-level-3{background:#169E8B;}
.heatmap-dot-today { box-shadow:0 0 0 2px #2F6FED40; }
.heatmap-day { font-family:'IBM Plex Mono',monospace; font-size:8.5px; color:var(--ink-soft); }
.heatmap-total { margin-left:auto; font-family:'IBM Plex Mono',monospace; font-size:10.5px; font-weight:600; color:var(--ink-soft); }

/* Doubt section */
.doubt-section { margin-top:18px; }
.section-label { display:flex; align-items:center; gap:5px; font-family:'IBM Plex Mono',monospace; font-size:10.5px; letter-spacing:.06em; color:var(--ink-soft); margin:18px 2px 8px; }
.doubt-section .section-label { margin-top:0; }

.image-preview-wrap { position:relative; margin-bottom:8px; display:inline-block; }
.image-preview { max-height:120px; max-width:100%; border-radius:10px; border:1px solid var(--border); display:block; }
.remove-img-btn { position:absolute; top:-6px; right:-6px; background:#fff; border:1px solid var(--border); border-radius:50%; width:22px; height:22px; display:flex; align-items:center; justify-content:center; cursor:pointer; }

.doubt-input-row { display:flex; gap:6px; align-items:center; }
.doubt-input { flex:1; min-width:0; padding:10px 12px; border:1px solid var(--border); border-radius:10px; font-family:'Inter',sans-serif; font-size:13px; color:var(--ink); background:#fff; }
.doubt-input:focus { outline:2px solid #2F6FED44; border-color:#2F6FED88; }
.tool-btn { width:36px; height:36px; border-radius:9px; background:var(--card); border:1px solid var(--border); display:flex; align-items:center; justify-content:center; cursor:pointer; flex-shrink:0; }
.tool-btn-active { background:#FFF0EE; border-color:#D9483A55; }
.doubt-send { width:38px; height:38px; border-radius:10px; background:#2F6FED; border:none; color:#fff; display:flex; align-items:center; justify-content:center; cursor:pointer; flex-shrink:0; transition:background .2s; }
.doubt-send:disabled { background:#B9C7D8; cursor:default; }

.mic-indicator { display:flex; align-items:center; gap:5px; margin-top:6px; padding:6px 10px; background:#FFF0EE; border-radius:8px; }
.mic-dot { width:6px; height:6px; border-radius:50%; background:#D9483A; animation:bounce 0.9s infinite ease-in-out; }
.mic-dot:nth-child(2){animation-delay:.15s;} .mic-dot:nth-child(3){animation-delay:.3s;}

.note-stack { display:flex; flex-direction:column; gap:18px; margin-top:14px; }
.sticky-note { position:relative; background:#FFF6C9; border-radius:3px; padding:18px 14px 14px; box-shadow:0 4px 12px rgba(20,35,59,0.14); animation:fadeUp .35s ease both; }
.note-tape { position:absolute; top:-7px; left:50%; transform:translateX(-50%) rotate(-2deg); width:46px; height:14px; background:rgba(255,255,255,0.65); border:1px solid rgba(0,0,0,0.06); }
.note-head { display:flex; align-items:flex-start; justify-content:space-between; gap:8px; margin-bottom:4px; }
.note-question { font-family:'Space Grotesk',sans-serif; font-weight:600; font-size:13px; color:#5B4A0A; margin:0; flex:1; }
.note-del { background:none; border:none; cursor:pointer; flex-shrink:0; padding:2px; opacity:.5; }
.note-del:hover { opacity:1; }
.note-img { max-width:100%; max-height:140px; object-fit:contain; border-radius:8px; margin-bottom:8px; display:block; }
.note-answer { font-family:'Caveat',cursive; font-weight:500; font-size:19px; line-height:1.35; color:#3D2F05; margin:0; white-space:pre-wrap; }
.note-error { font-family:'Inter',sans-serif; font-size:12px; color:#B0392E; margin:0; }
.note-loading { display:flex; gap:4px; padding:4px 0; }
.note-loading .dot { width:6px; height:6px; border-radius:50%; background:#C9A227; animation:bounce 1s infinite ease-in-out; }
.note-loading .dot:nth-child(2){animation-delay:.15s;} .note-loading .dot:nth-child(3){animation-delay:.3s;}
@keyframes bounce { 0%,80%,100%{transform:translateY(0);opacity:.4} 40%{transform:translateY(-4px);opacity:1} }

.focus-section,.revise-section { margin-top:2px; }
.focus-list { display:flex; flex-direction:column; gap:6px; }
.focus-row { display:flex; align-items:center; gap:9px; width:100%; background:var(--card); border:1px solid var(--border); border-radius:11px; padding:9px 11px; cursor:pointer; text-align:left; }
.subject-dot { width:7px; height:7px; border-radius:50%; flex-shrink:0; }
.focus-row .chapter-name { flex:1; font-size:12.5px; }

.subject-list { display:flex; flex-direction:column; gap:10px; margin-top:18px; }
.subject-card { background:var(--card); border:1px solid var(--border); border-radius:14px; padding:13px 14px 14px; }
.subject-head { width:100%; background:none; border:none; padding:0; display:flex; align-items:center; justify-content:space-between; cursor:pointer; }
.subject-head-left { display:flex; align-items:center; gap:10px; }
.subject-tag { font-family:'IBM Plex Mono',monospace; font-size:10px; font-weight:600; letter-spacing:.04em; padding:4px 7px; border-radius:6px; }
.subject-titles { display:flex; flex-direction:column; align-items:flex-start; }
.subject-name-row { display:flex; align-items:center; gap:6px; }
.subject-name { font-family:'Space Grotesk',sans-serif; font-weight:600; font-size:15px; }
.subject-sub { font-size:11px; color:var(--ink-soft); margin-top:1px; }
.mastered-badge { font-family:'IBM Plex Mono',monospace; font-size:9px; font-weight:600; color:#8A6A0D; background:linear-gradient(90deg,#FCEFC0,#F4D67A,#FCEFC0); background-size:200% 100%; padding:2px 7px; border-radius:999px; animation:shimmer 2.4s linear infinite; }
@keyframes shimmer{0%{background-position:0%}100%{background-position:200%}}

.subject-bar-row { margin-top:10px; }
.ruler-wrap { display:flex; align-items:center; gap:8px; }
.ruler-track { position:relative; flex:1; height:10px; background:#F1F5F9; border-radius:5px; overflow:visible; }
.ruler-tick { position:absolute; top:100%; width:1px; height:4px; background:#C3D1DF; }
.ruler-tick-major { height:6px; background:#9FB2C6; }
.ruler-fill { height:100%; border-radius:5px; transition:width .5s ease; }
.ruler-marker { position:absolute; top:-3px; width:3px; height:16px; background:#fff; border:2px solid; border-radius:2px; transform:translateX(-1.5px); transition:left .5s ease; }
.ruler-pct { font-family:'IBM Plex Mono',monospace; font-size:11px; font-weight:600; width:34px; text-align:right; }

.chapter-list { margin-top:14px; padding-top:12px; border-top:1px dashed var(--border); display:flex; flex-direction:column; gap:1px; animation:fadeUp .3s ease both; }
.chapter-row { display:flex; align-items:center; gap:4px; border-radius:8px; }
.chapter-row:hover { background:#F6F9FB; }
.chapter-row-main { flex:1; min-width:0; display:flex; align-items:center; gap:9px; background:none; border:none; padding:7px 2px; cursor:pointer; text-align:left; }
.chapter-num { font-family:'IBM Plex Mono',monospace; font-size:10px; color:#A7B4C4; width:16px; flex-shrink:0; }
.chapter-name { flex:1; font-size:13px; color:var(--ink); }
.chapter-name-done { color:var(--ink-soft); text-decoration:line-through; text-decoration-color:#C3D1DF; }
.pin-btn,.status-btn { background:none; border:none; padding:4px; cursor:pointer; flex-shrink:0; display:flex; }

.glyph { width:20px; height:20px; border-radius:50%; border:1.5px solid; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.glyph-todo { background:#fff; }
.glyph-revise { background:#FDF1DD; }
.glyph-done { animation:pop .3s cubic-bezier(.34,1.56,.64,1); }
@keyframes pop{0%{transform:scale(0.6)}60%{transform:scale(1.15)}100%{transform:scale(1)}}

.legend { display:flex; gap:12px; justify-content:center; flex-wrap:wrap; margin-top:18px; font-size:10px; color:var(--ink-soft); font-family:'IBM Plex Mono',monospace; }
.legend span { display:flex; align-items:center; gap:5px; }
.legend-dot { width:8px; height:8px; border-radius:50%; display:inline-block; }
.legend-todo { border:1.5px solid #9FB2C6; }
.legend-done { background:#2F6FED; }
.legend-revise { background:#D99A2B; }

.sheet-backdrop { position:fixed; inset:0; background:rgba(20,35,59,0.45); display:flex; align-items:flex-end; justify-content:center; z-index:50; border-radius:20px; }
.sheet { background:#fff; width:100%; max-width:420px; border-radius:18px 18px 0 0; padding:18px; animation:fadeUp .25s ease both; }
.sheet-head { display:flex; justify-content:space-between; align-items:center; font-family:'Space Grotesk',sans-serif; font-weight:600; font-size:15px; margin-bottom:12px; }
.date-input { width:100%; padding:10px 12px; border:1px solid var(--border); border-radius:9px; font-family:'Inter',sans-serif; font-size:14px; color:var(--ink); }
.sheet-note { font-size:12px; color:var(--ink-soft); margin-top:10px; line-height:1.5; }
.sheet-actions { display:flex; gap:8px; margin-top:14px; }
.btn-ghost,.btn-danger { flex:1; padding:10px; border-radius:9px; font-size:13px; font-weight:600; cursor:pointer; border:1px solid var(--border); }
.btn-ghost { background:#fff; color:var(--ink-soft); }
.btn-danger { background:#D9483A; color:#fff; border-color:#D9483A; }
`;
