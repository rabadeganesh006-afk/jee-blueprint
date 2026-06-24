import { useMemo, useState } from 'react';
import {
  BookOpen, Bot, Check, CheckCircle2, ChevronDown, Circle, Clock, Home, Mail, Moon,
  Pi, Plus, Search, ShieldCheck, Star, Sun, Target, Trash2, Trophy, UserRound, X
} from 'lucide-react';
import { PLANNER } from './plannerData';
import './style.css';
import './demoPreview.css';

const DEFAULT_TIMER_MINUTES = 150;
const SUBJECT_COLORS = { Physics: '#3b82f6', Chemistry: '#10b981', Mathematics: '#a855f7' };

const todayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const formatDate = (dateLike) => {
  const d = typeof dateLike === 'string' ? new Date(`${dateLike}T00:00:00`) : dateLike;
  return Number.isNaN(d?.getTime?.()) ? 'Not set' : d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};
const percentNumber = (done, total) => total ? (done / total) * 100 : 0;
const percentText = (value) => `${Number.isInteger(Math.round(value * 10) / 10) ? Math.round(value * 10) / 10 : (Math.round(value * 10) / 10).toFixed(1)}%`;
const minutesText = (minutes = 0) => `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
const clockText = (seconds = 0) => {
  const safe = Math.max(0, Math.floor(seconds));
  const h = Math.floor(safe / 3600);
  const m = Math.floor((safe % 3600) / 60);
  const sec = safe % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
};
const minutesToTimeInput = (minutes = DEFAULT_TIMER_MINUTES) => `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
const timeInputToMinutes = (value) => {
  const [h = '0', m = '0'] = String(value || '').split(':');
  return Math.max(1, (Number(h) || 0) * 60 + (Number(m) || 0) || DEFAULT_TIMER_MINUTES);
};
const flattenTopics = (planner) => Object.entries(planner).flatMap(([subject, chapters]) => chapters.flatMap((chapter) => chapter.topics.map((topic) => ({ subject, chapter, topic }))));
const flattenChapters = (planner) => Object.entries(planner).flatMap(([subject, chapters]) => chapters.map((chapter) => ({ subject, chapter })));

function buildPyqSets(planner) {
  return Object.entries(planner).flatMap(([subject, chapters]) => chapters.map((chapter, chapterIndex) => ({
    id: `pyq-${chapter.id}`,
    title: chapter.title,
    subject,
    subSubject: chapter.subSubject || subject,
    topicCount: chapter.topics?.length || 0,
    questions: Math.max(15, Math.min(60, (chapter.topics?.length || 1) * 5)),
    plannerOrder: chapterIndex + 1,
  })));
}

function createDemoData(planner) {
  const topics = flattenTopics(planner);
  const pyqSets = buildPyqSets(planner);
  const topicsDone = {};
  const topicsFlagged = {};
  const pyqSolved = {};
  topics.slice(0, 34).forEach(({ topic }) => { topicsDone[topic.id] = true; });
  topics.slice(60, 66).forEach(({ topic }) => { topicsFlagged[topic.id] = true; });
  pyqSets.slice(0, 8).forEach((set, index) => { pyqSolved[set.id] = 8 + index * 2; });
  return {
    theme: 'light',
    stream: '11th IIT JEE',
    active: 'dashboard',
    studyByDate: { [todayKey()]: 260 },
    studyTimer: { date: todayKey(), targetMinutes: DEFAULT_TIMER_MINUTES, elapsedSeconds: 0, running: false, startedAt: null },
    topicsDone,
    topicsFlagged,
    pyqSolved,
    materialRead: { 'physics-formula': true, 'math-formula': true },
    tests: [
      { id: 'demo-test-1', name: 'JEE Main Full Mock 01', score: 142, total: 300, date: '10 Jun 2026' },
      { id: 'demo-test-2', name: 'JEE Main Full Mock 02', score: 168, total: 300, date: '17 Jun 2026' },
      { id: 'demo-test-3', name: 'JEE Advanced Paper 1', score: 78, total: 180, date: '20 Jun 2026' },
    ],
    tasks: [
      { id: 'demo-task-1', title: 'Revise Rotational Motion formula sheet', done: false, date: todayKey() },
      { id: 'demo-task-2', title: 'Solve 30 PYQs from Ionic Equilibrium', done: false, date: todayKey() },
      { id: 'demo-task-3', title: 'Complete Definite Integration mixed practice', done: false, date: todayKey() },
    ],
    activities: [
      { id: 'demo-act-1', text: 'Completed topic: System of Units (Units and Measurements)', date: new Date().toLocaleString() },
      { id: 'demo-act-2', text: 'Added test score: 168/300', date: new Date().toLocaleString() },
      { id: 'demo-act-3', text: 'Solved 5 PYQ in Mathematical Tools', date: new Date().toLocaleString() },
    ],
    profile: { fullName: 'Ganesh Rabade', email: 'demo@student.com', targetExam: 'JEE Advanced 2027' },
  };
}

const MATERIALS = [
  { id: 'physics-formula', title: 'Physics Formula Sheet', subject: 'Physics', detail: 'Mechanics, electrostatics, optics and modern physics quick revision.' },
  { id: 'chem-short', title: 'Chemistry Short Notes', subject: 'Chemistry', detail: 'Physical formulas, organic named reactions and inorganic NCERT points.' },
  { id: 'math-formula', title: 'Maths Formula Bank', subject: 'Mathematics', detail: 'Calculus, coordinate geometry, algebra, vectors and 3D.' },
  { id: 'weightage', title: 'High Weightage Checklist', subject: 'Planner', detail: 'Priority chapters for faster revision and daily planning.' },
];

export default function DemoApp() {
  const streamOptions = ['11th IIT JEE', '12th IIT JEE', 'Dropper'];
  const [streamMenuOpen, setStreamMenuOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [newTask, setNewTask] = useState('');
  const [testScore, setTestScore] = useState({ name: '', score: '', total: '' });
  const initialPlanner = useMemo(() => PLANNER['11th IIT JEE'], []);
  const [data, setData] = useState(() => createDemoData(initialPlanner));
  const planner = useMemo(() => PLANNER[data.stream] || PLANNER['11th IIT JEE'], [data.stream]);
  const allTopics = useMemo(() => flattenTopics(planner), [planner]);
  const allChapters = useMemo(() => flattenChapters(planner), [planner]);
  const pyqSets = useMemo(() => buildPyqSets(planner), [planner]);
  const doneCount = allTopics.filter(({ topic }) => data.topicsDone?.[topic.id]).length;
  const totalTopics = allTopics.length;
  const progressValue = percentNumber(doneCount, totalTopics);
  const pyqSolved = pyqSets.reduce((sum, set) => sum + Number(data.pyqSolved?.[set.id] || 0), 0);
  const todayMinutes = Number(data.studyByDate?.[todayKey()] || 0);
  const avgMinutes = 225;
  const displayName = data.profile.fullName?.split(' ')?.[0] || 'Student';

  function update(patchOrFn) { setData((current) => typeof patchOrFn === 'function' ? patchOrFn(current) : { ...current, ...patchOrFn }); }
  function setActive(active) { update((current) => ({ ...current, active })); }
  function pushActivity(current, text) { return [{ id: `${Date.now()}-${Math.random().toString(16).slice(2)}`, text, date: new Date().toLocaleString() }, ...(current.activities || [])].slice(0, 30); }
  function toggleTopic(topic, chapterTitle) {
    update((current) => {
      const nextValue = !current.topicsDone?.[topic.id];
      return { ...current, topicsDone: { ...(current.topicsDone || {}), [topic.id]: nextValue }, activities: nextValue ? pushActivity(current, `Completed topic: ${topic.title} (${chapterTitle})`) : current.activities };
    });
  }
  function toggleFlagTopic(topic) { update((current) => ({ ...current, topicsFlagged: { ...(current.topicsFlagged || {}), [topic.id]: !current.topicsFlagged?.[topic.id] } })); }
  function addTask() { const title = newTask.trim(); if (!title) return; update((current) => ({ ...current, tasks: [{ id: `${Date.now()}`, title, done: false, date: todayKey() }, ...(current.tasks || [])], activities: pushActivity(current, 'Added a pending task') })); setNewTask(''); }
  function toggleTask(id) { update((current) => ({ ...current, tasks: (current.tasks || []).map((task) => task.id === id ? { ...task, done: !task.done } : task), activities: pushActivity(current, 'Updated a pending task') })); }
  function deleteTask(id) { update((current) => ({ ...current, tasks: (current.tasks || []).filter((task) => task.id !== id) })); }
  function deleteActivity(id) { update((current) => ({ ...current, activities: (current.activities || []).filter((activity) => activity.id !== id) })); }
  function clearActivities() { update((current) => ({ ...current, activities: [] })); }
  function startStudyTimer(goalMinutes = DEFAULT_TIMER_MINUTES) { update((current) => ({ ...current, studyTimer: { ...current.studyTimer, targetMinutes: goalMinutes, elapsedSeconds: 25 * 60, running: false }, activities: pushActivity(current, `Started study timer (${minutesText(goalMinutes)} target)`) })); }
  function resetStudyTimer() { update((current) => ({ ...current, studyByDate: { ...(current.studyByDate || {}), [todayKey()]: 0 }, studyTimer: { ...current.studyTimer, elapsedSeconds: 0, running: false }, activities: pushActivity(current, 'Reset today study timer') })); }
  function saveTest() { const total = Number(testScore.total || 0); if (!total) return; const score = Number(testScore.score || 0); const name = testScore.name.trim() || 'Chapter Test'; update((current) => ({ ...current, tests: [{ id: `${Date.now()}`, name, score, total, date: new Date().toLocaleDateString() }, ...(current.tests || [])], activities: pushActivity(current, `Added test score: ${score}/${total}`) })); setTestScore({ name: '', score: '', total: '' }); }
  function toggleMaterial(id) { update((current) => ({ ...current, materialRead: { ...(current.materialRead || {}), [id]: !current.materialRead?.[id] } })); }
  function markPyqSolved(setId, count = 1) { const set = pyqSets.find((item) => item.id === setId); update((current) => ({ ...current, pyqSolved: { ...(current.pyqSolved || {}), [setId]: Math.min((current.pyqSolved?.[setId] || 0) + count, set?.questions || 999) }, activities: pushActivity(current, `Solved ${count} PYQ in ${set?.title || 'PYQ set'}`) })); }

  const nav = [
    { id: 'dashboard', label: 'Dashboard', group: 'LEARN', icon: Home },
    { id: 'pyq', label: 'PYQ Practice', group: 'LEARN', icon: Pi },
    { id: 'material', label: 'Study Material', group: 'LEARN', icon: BookOpen },
    { id: 'tests', label: 'Test Series', group: 'ASSESS', icon: CheckCircle2 },
    { id: 'ai', label: 'AI Tutor', group: 'AI LEARNING', icon: Bot },
    { id: 'contact', label: 'Contact Us', group: 'ACCOUNT', icon: Mail },
    { id: 'profile', label: 'Profile', group: 'ACCOUNT', icon: UserRound },
    { id: 'privacy', label: 'Privacy Policy', group: 'LEGAL', icon: ShieldCheck },
  ];
  const searchResults = query.trim() ? [['dashboard', 'Dashboard'], ['pyq', 'PYQ Practice'], ['tests', 'Test Series']].map(([page, label]) => ({ page, label, type: 'Page' })) : [];

  return (
    <div className={`app ${data.theme === 'dark' ? 'dark' : 'light'}`}>
      <aside className="sidebar">
        <div className="brand brandFull"><img className="brandLogoFull" src="/study-blueprint-logo-new.png" alt="Study Blueprint - Plan Track Improve" /></div>
        {['LEARN', 'ASSESS', 'AI LEARNING', 'ACCOUNT', 'LEGAL'].map((group) => <div className="navGroup" key={group}><p>{group}</p>{nav.filter((item) => item.group === group).map((item) => { const Icon = item.icon; return <button key={item.id} onClick={() => setActive(item.id)} className={`navBtn ${data.active === item.id ? 'active' : ''}`}><Icon size={18} /> <span>{item.label}</span></button>; })}</div>)}
        <div className="aiHelp comingSoonMini"><Bot size={42} /><strong>AI Tutor</strong><span>Coming soon. This feature is temporarily disabled while we improve reliability.</span><button onClick={() => setActive('ai')}>View Status</button></div>
      </aside>
      <main className="main">
        <header className="topbar">
          <div className="welcome">Welcome back, {displayName} 👋</div>
          <div className={`selectWrap customSelect ${streamMenuOpen ? 'open' : ''}`}><button type="button" className="selectButton" onClick={() => setStreamMenuOpen((value) => !value)}><span>{data.stream}</span><ChevronDown size={16} /></button>{streamMenuOpen && <div className="selectMenu">{streamOptions.map((option) => <button key={option} type="button" className={data.stream === option ? 'active' : ''} onClick={() => { update((current) => ({ ...current, stream: option })); setStreamMenuOpen(false); }}><span>{option}</span>{data.stream === option && <Check size={15} />}</button>)}</div>}</div>
          <div className="searchWrap"><Search size={17} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search chapters, topics, PYQs, notes..." /><kbd>Ctrl</kbd><kbd>K</kbd>{searchResults.length > 0 && <div className="searchResults">{searchResults.map((r) => <button key={r.page} onClick={() => setActive(r.page)}><span>{r.label}</span><small>{r.type}</small></button>)}</div>}</div>
          <div className="themeToggle"><button className={data.theme === 'light' ? 'active' : ''} onClick={() => update((current) => ({ ...current, theme: 'light' }))}><Sun size={15} /> Light</button><button className={data.theme === 'dark' ? 'active' : ''} onClick={() => update((current) => ({ ...current, theme: 'dark' }))}><Moon size={15} /> Dark</button></div>
          <button className="planBtn"><Trophy size={16} /> Free Plan</button>
        </header>
        {data.active === 'dashboard' && <Dashboard data={data} planner={planner} progressValue={progressValue} doneCount={doneCount} totalTopics={totalTopics} totalChapters={allChapters.length} todayMinutes={todayMinutes} pyqSolved={pyqSolved} avgMinutes={avgMinutes} startStudyTimer={startStudyTimer} resetStudyTimer={resetStudyTimer} toggleTopic={toggleTopic} toggleFlagTopic={toggleFlagTopic} addTask={addTask} newTask={newTask} setNewTask={setNewTask} toggleTask={toggleTask} deleteTask={deleteTask} deleteActivity={deleteActivity} clearActivities={clearActivities} setActive={setActive} query={query} />}
        {data.active === 'pyq' && <PyqPage data={data} stream={data.stream} pyqSets={pyqSets} markPyqSolved={markPyqSolved} query={query} />}
        {data.active === 'material' && <MaterialPage data={data} toggleMaterial={toggleMaterial} query={query} />}
        {data.active === 'tests' && <TestsPage data={data} testScore={testScore} setTestScore={setTestScore} saveTest={saveTest} />}
        {data.active === 'ai' && <SimplePage title="AI Tutor" text="This feature is temporarily disabled while we improve reliability." />}
        {data.active === 'contact' && <SimplePage title="Contact Us" text="For questions, feedback, coaching customization, bug reports, or collaboration requests." />}
        {data.active === 'privacy' && <SimplePage title="Privacy Policy" text="Study Blueprint privacy information and student data controls." />}
        {data.active === 'profile' && <ProfilePage data={data} />}
      </main>
    </div>
  );
}

function Dashboard({ data, planner, progressValue, doneCount, totalTopics, totalChapters, todayMinutes, pyqSolved, avgMinutes, startStudyTimer, resetStudyTimer, toggleTopic, toggleFlagTopic, addTask, newTask, setNewTask, toggleTask, deleteTask, deleteActivity, clearActivities, setActive, query }) {
  const pending = (data.tasks || []).filter((t) => !t.done);
  const flaggedCount = Object.values(data.topicsFlagged || {}).filter(Boolean).length;
  const [subjectFilter, setSubjectFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [goalInput, setGoalInput] = useState(minutesToTimeInput(data.studyTimer.targetMinutes));
  const q = query.trim().toLowerCase();
  const liveTimerSeconds = data.studyTimer.elapsedSeconds || 0;
  const allPlannerTopics = Object.entries(planner).flatMap(([subject, chapters]) => chapters.flatMap((chapter) => chapter.topics.map((topic) => ({ subject, chapter, topic }))));
  const nextPending = allPlannerTopics.find(({ topic }) => !data.topicsDone?.[topic.id]);
  const firstFlagged = allPlannerTopics.find(({ topic }) => data.topicsFlagged?.[topic.id]);
  const nextActionTopics = allPlannerTopics.filter(({ topic }) => !data.topicsDone?.[topic.id]).slice(0, 3);
  const subjectStats = Object.entries(planner).map(([subject, chapters]) => { const topics = chapters.flatMap((chapter) => chapter.topics); const count = topics.filter((topic) => data.topicsDone?.[topic.id]).length; return { subject, topics, count, pct: percentNumber(count, topics.length), color: SUBJECT_COLORS[subject] || '#2563eb' }; });
  let currentAngle = 0;
  const ringParts = [];
  subjectStats.forEach((stat) => { const angle = totalTopics ? (stat.count / totalTopics) * 360 : 0; if (angle > 0) { ringParts.push(`${stat.color} ${currentAngle}deg ${currentAngle + angle}deg`); currentAngle += angle; } });
  const ringBackground = ringParts.length ? `conic-gradient(${ringParts.join(', ')}, rgba(148,163,184,.18) ${currentAngle}deg 360deg)` : 'conic-gradient(rgba(148,163,184,.18) 0deg 360deg)';
  const remainingSeconds = Math.max(0, (data.studyTimer.targetMinutes || DEFAULT_TIMER_MINUTES) * 60 - liveTimerSeconds);
  const visibleActivities = data.activities || [];

  return <section className="page"><div className="pageHead"><h1>Dashboard</h1><p>Track topics, run a real study timer, and continue with your next focus item.</p></div><div className="heroCard compactHero"><div className="heroLeft"><span className="blueLabel">Your Learning Overview</span><h2>{doneCount === 0 ? 'Start building momentum!' : 'Keep building momentum!'}</h2><p>Today: <b>{formatDate(new Date())}</b></p><div className="statPills interactivePills"><button onClick={() => setStatusFilter('Completed')}><CheckCircle2 size={20} /><b>{doneCount} / {totalTopics} topics</b><span>Completed topics</span></button><button onClick={() => setStatusFilter(statusFilter === 'Flagged' ? 'All' : 'Flagged')}><Target size={20} /><b>{flaggedCount} flagged</b><span>{statusFilter === 'Flagged' ? 'Showing flagged topics' : 'Show priority topics'}</span></button><button className="studyTimePill"><Clock size={20} /><b>Today's Study Time</b><span>{minutesText(todayMinutes)} • {liveTimerSeconds > 0 ? 'Timer paused' : 'Not started'}</span></button></div><div className="focusAlert"><Target size={18} /><span>{firstFlagged ? <>Priority today: revise <b>{firstFlagged.topic.title}</b> from <b>{firstFlagged.chapter.title}</b>.</> : nextPending ? <>Start with <b>{nextPending.topic.title}</b> from <b>{nextPending.chapter.title}</b>. Flag difficult topics for revision.</> : <>Great work. Add revision tasks.</>}</span></div><div className="filterChips">{['All', 'Pending', 'Completed', 'Flagged'].map((filter) => <button key={filter} className={statusFilter === filter ? 'active' : ''} onClick={() => setStatusFilter(filter)}>{filter}</button>)}</div></div><div className="progressBlock polishedProgress"><div className="ring multiRing" style={{ background: ringBackground }}><strong>{percentText(progressValue)}</strong><span>Completed</span></div><div className="subjectBars">{subjectStats.map((stat) => <button key={stat.subject} className={subjectFilter === stat.subject ? 'subjectBar active' : 'subjectBar'} onClick={() => setSubjectFilter(subjectFilter === stat.subject ? 'All' : stat.subject)}><b style={{ color: stat.color }}>{stat.subject}</b><div className="bar"><span style={{ width: `${stat.pct}%`, background: stat.color }} /></div><strong style={{ color: stat.color }}>{percentText(stat.pct)}</strong><small>{stat.count} / {stat.topics.length} topics</small></button>)}</div></div></div><div className="grid3 tightGrid dashboardUtilityGrid"><div className="card timerCard upgradedTimer"><div className="timerHeader"><h3><Clock size={19}/> Today's Study Time</h3><span className={`statusBadge ${liveTimerSeconds > 0 ? 'paused' : ''}`}>{liveTimerSeconds > 0 ? 'Paused' : 'Ready'}</span></div><div className="timerDisplay">{clockText(liveTimerSeconds)}</div><div className="timerMeta"><span>Goal: <b>{minutesText(data.studyTimer.targetMinutes || DEFAULT_TIMER_MINUTES)}</b></span><span>Remaining: <b>{clockText(remainingSeconds)}</b></span></div><div className="timerProgress"><span style={{ width: `${Math.min(100, liveTimerSeconds / ((data.studyTimer.targetMinutes || DEFAULT_TIMER_MINUTES) * 60) * 100)}%` }} /></div><div className="presetGoals">{[25, 50, 90, 150].map((m) => <button key={m} onClick={() => setGoalInput(minutesToTimeInput(m))}>{m === 150 ? '2h 30m' : `${m}m`}</button>)}</div><label className="timerGoal"><span>Custom focus timer</span><input type="time" value={goalInput} onChange={(e) => setGoalInput(e.target.value)} /></label><div className="btnRow timerBtns"><button className="primary" onClick={() => startStudyTimer(timeInputToMinutes(goalInput))}>{liveTimerSeconds > 0 ? 'Resume' : 'Start'}</button><button disabled>Pause</button><button onClick={resetStudyTimer}>Reset</button></div></div><div className="card nextTopicsCard"><div className="between"><h3>Next Topics to Complete</h3><button className="miniLink" onClick={() => setStatusFilter('Pending')}>View all</button></div><p className="muted compactText">Use this card as your real checklist for the next study session.</p><div className="nextTopicList">{nextActionTopics.map(({ subject, chapter, topic }) => <div className="nextTopicItem" key={topic.id}><button className="topicCheck" onClick={() => toggleTopic(topic, chapter.title)}><Circle size={18}/></button><div><b>{topic.title}</b><small>{subject} • {chapter.title}</small></div><button title="Flag topic" onClick={() => toggleFlagTopic(topic)} className={data.topicsFlagged?.[topic.id] ? 'flagged topicStar' : 'topicStar'}><Star size={15}/></button></div>)}</div></div><div className="card"><h3>Quick Stats</h3><div className="quickStat"><span>Topics Completed</span><b>{doneCount} / {totalTopics}</b></div><div className="quickStat"><span>Chapters Loaded</span><b>{totalChapters}</b></div><div className="quickStat"><span>Progress</span><b>{percentText(progressValue)}</b></div><div className="quickStat"><span>PYQs Solved</span><b>{pyqSolved}</b></div><div className="quickStat"><span>Avg. Study Time / Day</span><b>{minutesText(avgMinutes)}</b></div></div></div><div className="grid2 syllabusGrid"><div className="card syllabusCard"><h3>Planner Topic Tracker</h3><p className="muted">Click a chapter to open its planner topics. Tick each topic after you complete it.</p>{Object.entries(planner).map(([subject, chapters]) => { if (subjectFilter !== 'All' && subjectFilter !== subject) return null; const filteredChapters = chapters.map((chapter) => ({ ...chapter, topics: chapter.topics.filter((topic) => { const matchesSearch = !q || `${subject} ${chapter.title} ${topic.title}`.toLowerCase().includes(q); const isDone = !!data.topicsDone?.[topic.id]; const isFlagged = !!data.topicsFlagged?.[topic.id]; const matchesStatus = statusFilter === 'All' || (statusFilter === 'Pending' && !isDone) || (statusFilter === 'Completed' && isDone) || (statusFilter === 'Flagged' && isFlagged); return matchesSearch && matchesStatus; }) })).filter((chapter) => chapter.topics.length || (!q && statusFilter === 'All')); const subjectTopics = chapters.flatMap((chapter) => chapter.topics); const subjectDone = subjectTopics.filter((topic) => data.topicsDone?.[topic.id]).length; return <details key={subject} open={subject === 'Physics'} className="subjectPanel"><summary>{subject} <span>{subjectDone}/{subjectTopics.length} topics • {percentText(percentNumber(subjectDone, subjectTopics.length))}</span></summary><div className="chapterPanels">{filteredChapters.map((chapter) => { const done = chapter.topics.filter((topic) => data.topicsDone?.[topic.id]).length; return <details key={chapter.id} className="chapterPanel"><summary><div><b>{chapter.title}</b></div><span>{done}/{chapter.topics.length} • {percentText(percentNumber(done, chapter.topics.length))}</span></summary><div className="topicList">{chapter.topics.map((topic) => <div className={data.topicsDone?.[topic.id] ? 'topicRow done' : 'topicRow'} key={topic.id}><button className="topicCheck" onClick={() => toggleTopic(topic, chapter.title)}>{data.topicsDone?.[topic.id] ? <CheckCircle2 size={18} /> : <Circle size={18} />}</button><div><b>{topic.title}</b></div><button title="Flag topic" onClick={() => toggleFlagTopic(topic)} className={data.topicsFlagged?.[topic.id] ? 'flagged topicStar' : 'topicStar'}><Star size={15}/></button></div>)}</div></details>; })}</div></details>; })}</div><div className="card"><h3>Pending Tasks</h3><div className="inlineForm"><input value={newTask} onChange={(e) => setNewTask(e.target.value)} placeholder="Add real task..." /><button onClick={addTask}><Plus size={17} /></button></div>{pending.length === 0 ? <p className="empty">No pending tasks yet.</p> : pending.slice(0, 8).map((task) => <div className="task" key={task.id}><button onClick={() => toggleTask(task.id)}><Circle size={17} /></button><span>{task.title}</span><small>{formatDate(task.date)}</small><button onClick={() => deleteTask(task.id)}><Trash2 size={15} /></button></div>)}<h3 className="mt">Quick Actions</h3><div className="quickActions"><button onClick={() => setActive('pyq')}><Pi /> <b>PYQ Practice</b><span>Practice past questions</span></button><button onClick={() => setActive('tests')}><CheckCircle2 /> <b>Test Series</b><span>Add manual scores</span></button><button onClick={() => setActive('ai')}><Bot /> <b>AI Tutor</b><span>Coming soon</span></button><button onClick={() => setActive('material')}><BookOpen /> <b>Study Material</b><span>Mark notes as read</span></button></div><div className="between mt"><h3>Recent Activity</h3>{visibleActivities.length > 0 && <button className="smallDanger" onClick={clearActivities}>Clear all</button>}</div>{visibleActivities.map((a) => <div className="activity removable" key={a.id}><CheckCircle2 size={16}/><span>{a.text}</span><small>{a.date}</small><button onClick={() => deleteActivity(a.id)}><X size={15}/></button></div>)}</div></div></section>;
}

function PyqPage({ data, stream, pyqSets, markPyqSolved, query }) { const q = query.trim().toLowerCase(); const sets = q ? pyqSets.filter((set) => `${set.title} ${set.subject}`.toLowerCase().includes(q)) : pyqSets; return <section className="page"><div className="pageHead"><h1>PYQ Practice</h1><p>{stream} chapter-wise PYQ practice arranged subject-wise in the same order as your lecture planner.</p></div><div className="cards4 pyqChapterGrid">{sets.slice(0, 24).map((set) => { const solved = Number(data.pyqSolved?.[set.id] || 0); return <div className="card pyqChapterCard" key={set.id}><span className="badge">{set.subject}</span><h3>{set.title}</h3><p>{set.topicCount} planner topics linked</p><div className="smallProgress"><i style={{ width: `${Math.min(100, percentNumber(solved, set.questions))}%` }} /></div><small>{solved} / {set.questions} solved</small><button className="primary" onClick={() => markPyqSolved(set.id, 1)}>Mark 1 solved</button></div>; })}</div></section>; }
function MaterialPage({ data, toggleMaterial, query }) { const q = query.trim().toLowerCase(); const items = q ? MATERIALS.filter((item) => `${item.title} ${item.subject}`.toLowerCase().includes(q)) : MATERIALS; return <section className="page"><div className="pageHead"><h1>Study Material</h1><p>Mark materials as read only after you actually complete them.</p></div><div className="cards4">{items.map((m) => <div className="card" key={m.id}><span className="badge">{m.subject}</span><h3>{m.title}</h3><p>{m.detail}</p><button className={data.materialRead?.[m.id] ? 'successBtn' : 'primary'} onClick={() => toggleMaterial(m.id)}>{data.materialRead?.[m.id] ? 'Read ✓' : 'Mark as read'}</button></div>)}</div></section>; }
function TestsPage({ data, testScore, setTestScore, saveTest }) { return <section className="page"><div className="pageHead"><h1>Test Series</h1><p>Add real test scores manually.</p></div><div className="grid2"><div className="card"><h3>Add Test Score</h3><input placeholder="Test name" value={testScore.name} onChange={(e) => setTestScore({ ...testScore, name: e.target.value })} /><input placeholder="Score" value={testScore.score} onChange={(e) => setTestScore({ ...testScore, score: e.target.value })} /><input placeholder="Total marks" value={testScore.total} onChange={(e) => setTestScore({ ...testScore, total: e.target.value })} /><button className="primary" onClick={saveTest}>Save score</button></div><div className="card"><h3>Saved Tests</h3>{data.tests.map((t) => <div className="quickStat" key={t.id}><span>{t.name}<small>{t.date}</small></span><b>{t.score}/{t.total}</b></div>)}</div></div></section>; }
function SimplePage({ title, text }) { return <section className="page"><div className="pageHead"><h1>{title}</h1><p>{text}</p></div><div className="card"><h3>{title}</h3><p>{text}</p></div></section>; }
function ProfilePage({ data }) { return <section className="page profilePageV23"><div className="pageHead"><h1>Profile</h1><p>Manage student details, exam target, profile photo and account settings.</p></div><div className="profileHero profileHeroV23"><div className="profileIdentityBlock"><div className="avatar profileAvatarFallback">👨‍🎓</div><div className="profileIdentityText"><h2>{data.profile.fullName}</h2><p>{data.profile.email}</p><span className="badge">{data.profile.targetExam}</span></div></div><div className="targetSummary targetSummaryV23"><span>Target Date</span><b>Date not set</b><small>Demo profile preview</small></div></div></section>; }
