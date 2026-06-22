import { useEffect, useMemo, useState } from 'react';
import { Authenticator, ThemeProvider, createTheme } from '@aws-amplify/ui-react';
import { generateClient } from 'aws-amplify/api';
import '@aws-amplify/ui-react/styles.css';
import {
  BookOpen, Bot, CalendarDays, CheckCircle2, ChevronDown, Circle, Clock, FileText,
  Home, LogOut, Moon, PenLine, Pi, Plus, Save, Search, Send, Sun, Target,
  Trash2, Trophy, UserRound, X, RotateCcw, Star
} from 'lucide-react';
import { PLANNER } from './plannerData';
import './style.css';

const uiTheme = createTheme({
  name: 'jee-blueprint-theme',
  tokens: {
    colors: { brand: { primary: { 10: '#eef6ff', 80: '#2563eb', 90: '#1d4ed8', 100: '#1e40af' } } },
    radii: { medium: { value: '14px' }, large: { value: '22px' } },
  },
});

const MS_DAY = 24 * 60 * 60 * 1000;
const todayKey = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
const formatDate = (dateLike) => {
  if (!dateLike) return 'Not set';
  const d = typeof dateLike === 'string' ? new Date(`${dateLike}T00:00:00`) : dateLike;
  if (Number.isNaN(d.getTime())) return 'Not set';
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};
const daysLeft = (targetDate) => {
  if (!targetDate) return null;
  const today = new Date(`${todayKey()}T00:00:00`);
  const target = new Date(`${targetDate}T00:00:00`);
  if (Number.isNaN(target.getTime())) return null;
  return Math.ceil((target - today) / MS_DAY);
};
const percentNumber = (done, total) => total ? (done / total) * 100 : 0;
const percentText = (value) => {
  if (!Number.isFinite(value)) return '0%';
  const rounded = Math.round(value * 10) / 10;
  return `${Number.isInteger(rounded) ? rounded : rounded.toFixed(1)}%`;
};
const minutesText = (minutes = 0) => `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
const DEFAULT_TIMER_MINUTES = 150;
const normalizeTimer = (timer = {}) => {
  const currentDate = todayKey();
  if (!timer || timer.date !== currentDate) {
    return { date: currentDate, targetMinutes: DEFAULT_TIMER_MINUTES, elapsedSeconds: 0, running: false, startedAt: null };
  }
  return {
    date: currentDate,
    targetMinutes: Number(timer.targetMinutes || DEFAULT_TIMER_MINUTES),
    elapsedSeconds: Number(timer.elapsedSeconds || 0),
    running: !!timer.running,
    startedAt: timer.startedAt || null,
  };
};
const getLiveTimerSeconds = (timer = {}, now = Date.now()) => {
  const normalized = normalizeTimer(timer);
  const extra = normalized.running && normalized.startedAt ? Math.max(0, Math.floor((now - Number(normalized.startedAt)) / 1000)) : 0;
  const limit = Math.max(1, Number(normalized.targetMinutes || DEFAULT_TIMER_MINUTES) * 60);
  return Math.min(normalized.elapsedSeconds + extra, limit);
};
const clockText = (seconds = 0) => {
  const safe = Math.max(0, Math.floor(seconds));
  const h = Math.floor(safe / 3600);
  const m = Math.floor((safe % 3600) / 60);
  const sec = safe % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
};
const minutesToTimeInput = (minutes = DEFAULT_TIMER_MINUTES) => {
  const safe = Math.max(1, Math.min(23 * 60 + 59, Number(minutes) || DEFAULT_TIMER_MINUTES));
  return `${String(Math.floor(safe / 60)).padStart(2, '0')}:${String(safe % 60).padStart(2, '0')}`;
};
const timeInputToMinutes = (value) => {
  const [h = '0', m = '0'] = String(value || '').split(':');
  const total = (Number(h) || 0) * 60 + (Number(m) || 0);
  return Math.max(1, total || DEFAULT_TIMER_MINUTES);
};

const PYQ_SETS = [
  { id: 'current-electricity', title: 'Current Electricity', subject: 'Physics', questions: 25, difficulty: 'Medium' },
  { id: 'rotation', title: 'Rotational Motion', subject: 'Physics', questions: 30, difficulty: 'High' },
  { id: 'chemical-bonding', title: 'Chemical Bonding', subject: 'Chemistry', questions: 30, difficulty: 'High' },
  { id: 'electrochemistry', title: 'Electrochemistry', subject: 'Chemistry', questions: 28, difficulty: 'Medium' },
  { id: 'matrices', title: 'Matrices & Determinants', subject: 'Mathematics', questions: 22, difficulty: 'Medium' },
  { id: 'integration', title: 'Integration', subject: 'Mathematics', questions: 35, difficulty: 'High' },
];

const MATERIALS = [
  { id: 'physics-formula', title: 'Physics Formula Sheet', subject: 'Physics', detail: 'Mechanics, electrostatics, optics and modern physics quick revision.' },
  { id: 'chem-short', title: 'Chemistry Short Notes', subject: 'Chemistry', detail: 'Physical formulas, organic named reactions and inorganic NCERT points.' },
  { id: 'math-formula', title: 'Maths Formula Bank', subject: 'Mathematics', detail: 'Calculus, coordinate geometry, algebra, vectors and 3D.' },
  { id: 'weightage', title: 'High Weightage Checklist', subject: 'Planner', detail: 'Priority chapters for faster revision and daily planning.' },
];

const defaultData = (email = '') => ({
  theme: 'light',
  stream: '12th IIT JEE',
  active: 'dashboard',
  studyByDate: {},
  studyTimer: { date: todayKey(), targetMinutes: DEFAULT_TIMER_MINUTES, elapsedSeconds: 0, running: false, startedAt: null },
  topicsDone: {},
  topicsFlagged: {},
  pyqSolved: {},
  materialRead: {},
  tests: [],
  tasks: [],
  activities: [],
  profile: {
    fullName: '',
    email,
    mobile: '',
    city: '',
    className: '12',
    board: '',
    targetExam: 'JEE Advanced 2027',
    targetDate: '',
    language: 'English',
    studyGoal: 'Get into IIT',
    dailyStudyTime: '',
    weakAreas: '',
    preferredContent: 'Video lectures, Notes, PYQs',
  }
});

function makeStorageKey(user) {
  const email = user?.signInDetails?.loginId || user?.attributes?.email || user?.username || 'student';
  return `jee-blueprint-v15-focus-timer-profile-${email}`;
}

function loadData(key, email) {
  try {
    const saved = JSON.parse(localStorage.getItem(key));
    if (saved) {
      const base = defaultData(email);
      return { ...base, ...saved, profile: { ...base.profile, ...(saved.profile || {}), email } };
    }
  } catch (_) {}
  return defaultData(email);
}

function getDisplayName(data) {
  const profileName = data.profile.fullName?.trim();
  if (profileName) return profileName.split(' ')[0];
  return 'Student';
}

function getPlannerForStream(stream) {
  return PLANNER[stream] || PLANNER['12th IIT JEE'];
}

function flattenTopics(planner) {
  return Object.entries(planner).flatMap(([subject, chapters]) =>
    chapters.flatMap((chapter) => chapter.topics.map((topic) => ({ subject, chapter, topic }))));
}

function flattenChapters(planner) {
  return Object.entries(planner).flatMap(([subject, chapters]) => chapters.map((chapter) => ({ subject, chapter })));
}

function localStudyFallback(question) {
  const q = question.toLowerCase();
  if (q.includes('plan') || q.includes('revision') || q.includes('strategy')) {
    return `7-day revision method:\n1) Day 1-2: Revise theory and formulas from notes.\n2) Day 3-4: Solve previous year questions.\n3) Day 5: Solve weak questions again.\n4) Day 6: Take a chapter test.\n5) Day 7: Revise your mistakes notebook.\n\nRule: concept first, then PYQs, then test analysis.`;
  }
  if (q.includes('integration')) {
    return `Sequence for Integration:\n1) Memorize standard formulas perfectly.\n2) Practice substitution, integration by parts, and partial fractions separately.\n3) Solve 15 definite integration property questions daily.\n4) While solving PYQs, identify the method used in each question.`;
  }
  if (q.includes('chemical bonding') || q.includes('bonding')) {
    return `Chemical Bonding priority:\n1) VSEPR shapes\n2) Hybridisation\n3) MOT basics\n4) Bond order and magnetic nature\n5) Dipole moment`;
  }
  return `Your doubt: ${question}\n\nBest approach:\n1) Identify the chapter name.\n2) Revise formula/theory for 10 minutes.\n3) Review 5 solved examples.\n4) Solve 15 PYQs.\n5) Write the exact step where you got stuck and ask again.`;
}

function AppShell({ user, signOut }) {
  const email = user?.signInDetails?.loginId || user?.attributes?.email || '';
  const storageKey = useMemo(() => makeStorageKey(user), [user]);
  const [data, setData] = useState(() => loadData(storageKey, email));
  const [query, setQuery] = useState('');
  const [profileDraft, setProfileDraft] = useState(data.profile);
  const [editingProfile, setEditingProfile] = useState(false);
  const [newTask, setNewTask] = useState('');
  const [selectedPyq, setSelectedPyq] = useState(null);
  const [testScore, setTestScore] = useState({ name: '', score: '', total: '' });
  const [nowTick, setNowTick] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  function update(patchOrFn) {
    setData((current) => {
      const next = typeof patchOrFn === 'function' ? patchOrFn(current) : { ...current, ...patchOrFn };
      localStorage.setItem(storageKey, JSON.stringify(next));
      return next;
    });
  }

  function pushActivity(current, text, fixedId = null) {
    const id = fixedId || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const old = (current.activities || []).filter((activity) => activity.id !== id && !activity.text?.startsWith('Unchecked topic:'));
    return [{ text, date: new Date().toLocaleString(), id }, ...old].slice(0, 30);
  }

  const planner = useMemo(() => getPlannerForStream(data.stream), [data.stream]);
  const allTopics = useMemo(() => flattenTopics(planner), [planner]);
  const allChapters = useMemo(() => flattenChapters(planner), [planner]);
  const doneCount = allTopics.filter(({ topic }) => data.topicsDone?.[topic.id]).length;
  const totalTopics = allTopics.length;
  const progressValue = percentNumber(doneCount, totalTopics);
  const normalizedTimer = normalizeTimer(data.studyTimer);
  const liveTimerSeconds = getLiveTimerSeconds(normalizedTimer, nowTick);
  const manualTodayMinutes = Number(data.studyByDate?.[todayKey()] || 0);
  const todayMinutes = manualTodayMinutes + Math.floor(liveTimerSeconds / 60);
  const pyqSolved = Object.values(data.pyqSolved || {}).reduce((sum, value) => sum + Number(value || 0), 0);
  const avgMinutes = (() => {
    const values = Object.values(data.studyByDate || {}).map(Number).filter((v) => v > 0);
    if (!values.length) return 0;
    return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
  })();
  const displayName = getDisplayName(data);

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const pageHits = [
      ['dashboard', 'Dashboard'], ['pyq', 'PYQ Practice'], ['material', 'Study Material'],
      ['tests', 'Test Series'], ['ai', 'AI Tutor'], ['profile', 'Profile']
    ].filter(([, label]) => label.toLowerCase().includes(q)).map(([page, label]) => ({ type: 'Page', label, page }));
    const chapterHits = allChapters
      .filter(({ subject, chapter }) => `${subject} ${chapter.title} ${chapter.subSubject}`.toLowerCase().includes(q))
      .slice(0, 10)
      .map(({ subject, chapter }) => ({ type: `${subject} Chapter`, label: chapter.title, page: 'dashboard' }));
    const topicHits = allTopics
      .filter(({ subject, chapter, topic }) => `${subject} ${chapter.title} ${topic.title}`.toLowerCase().includes(q))
      .slice(0, 10)
      .map(({ subject, topic }) => ({ type: `${subject} Topic`, label: topic.title, page: 'dashboard' }));
    const pyqHits = PYQ_SETS.filter((item) => `${item.title} ${item.subject}`.toLowerCase().includes(q))
      .map((item) => ({ type: 'PYQ', label: item.title, page: 'pyq' }));
    const materialHits = MATERIALS.filter((item) => `${item.title} ${item.subject}`.toLowerCase().includes(q))
      .map((item) => ({ type: 'Material', label: item.title, page: 'material' }));
    return [...pageHits, ...chapterHits, ...topicHits, ...pyqHits, ...materialHits].slice(0, 12);
  }, [query, allChapters, allTopics]);

  function setActive(active) { update((current) => ({ ...current, active })); }

  function updateProfileFields(fields, log = true) {
    update((current) => ({ ...current, profile: { ...current.profile, ...fields, email }, activities: log ? pushActivity(current, 'Profile / target details updated') : current.activities }));
    setProfileDraft((current) => ({ ...current, ...fields, email }));
  }

  function addStudyMinutes(minutes) {
    const key = todayKey();
    update((current) => ({
      ...current,
      studyByDate: { ...(current.studyByDate || {}), [key]: (current.studyByDate?.[key] || 0) + minutes },
      activities: pushActivity(current, `Added ${minutes} minutes study time`)
    }));
  }

  function startStudyTimer(goalMinutes = DEFAULT_TIMER_MINUTES) {
    update((current) => {
      const timer = normalizeTimer(current.studyTimer);
      const elapsedSeconds = getLiveTimerSeconds(timer);
      const targetMinutes = Math.max(1, Number(goalMinutes || timer.targetMinutes || DEFAULT_TIMER_MINUTES));
      const alreadyReached = elapsedSeconds >= targetMinutes * 60;
      return {
        ...current,
        studyTimer: {
          ...timer,
          targetMinutes,
          elapsedSeconds: alreadyReached ? 0 : elapsedSeconds,
          running: true,
          startedAt: Date.now(),
        },
        activities: pushActivity(current, `Started study timer (${minutesText(targetMinutes)} target)`)
      };
    });
  }

  function pauseStudyTimer() {
    update((current) => {
      const timer = normalizeTimer(current.studyTimer);
      const elapsedSeconds = getLiveTimerSeconds(timer);
      return {
        ...current,
        studyTimer: { ...timer, elapsedSeconds, running: false, startedAt: null },
        activities: pushActivity(current, `Paused study timer at ${clockText(elapsedSeconds)}`)
      };
    });
  }

  function resetStudyTimer() {
    update((current) => {
      const timer = normalizeTimer(current.studyTimer);
      const key = todayKey();
      const studyByDate = { ...(current.studyByDate || {}), [key]: 0 };
      return {
        ...current,
        studyByDate,
        studyTimer: { ...timer, elapsedSeconds: 0, running: false, startedAt: null },
        activities: pushActivity(current, 'Reset today study timer')
      };
    });
  }

  useEffect(() => {
    const timer = normalizeTimer(data.studyTimer);
    const elapsedSeconds = getLiveTimerSeconds(timer, nowTick);
    const targetSeconds = Math.max(1, Number(timer.targetMinutes || DEFAULT_TIMER_MINUTES) * 60);
    if (timer.running && elapsedSeconds >= targetSeconds) {
      update((current) => {
        const currentTimer = normalizeTimer(current.studyTimer);
        return {
          ...current,
          studyTimer: { ...currentTimer, elapsedSeconds: targetSeconds, running: false, startedAt: null },
          activities: pushActivity(current, `Completed study timer goal: ${minutesText(currentTimer.targetMinutes || DEFAULT_TIMER_MINUTES)}`)
        };
      });
    }
  }, [nowTick, data.studyTimer]);

  function toggleTopic(topic, chapterTitle) {
    const activityId = `topic-complete-${topic.id}`;
    update((current) => {
      const nextValue = !current.topicsDone?.[topic.id];
      const topicsDone = { ...(current.topicsDone || {}), [topic.id]: nextValue };
      const cleanActivities = (current.activities || []).filter((activity) => activity.id !== activityId && !activity.text?.startsWith('Unchecked topic:'));
      return {
        ...current,
        topicsDone,
        activities: nextValue
          ? pushActivity({ ...current, activities: cleanActivities }, `Completed topic: ${topic.title} (${chapterTitle})`, activityId)
          : cleanActivities
      };
    });
  }

  function toggleFlagTopic(topic) {
    update((current) => ({ ...current, topicsFlagged: { ...(current.topicsFlagged || {}), [topic.id]: !current.topicsFlagged?.[topic.id] } }));
  }

  function addTask() {
    const title = newTask.trim();
    if (!title) return;
    update((current) => ({ ...current, tasks: [{ id: `${Date.now()}`, title, done: false, date: todayKey() }, ...(current.tasks || [])] }));
    setNewTask('');
  }

  function toggleTask(id) {
    update((current) => ({
      ...current,
      tasks: (current.tasks || []).map((task) => task.id === id ? { ...task, done: !task.done } : task),
      activities: pushActivity(current, 'Updated a pending task')
    }));
  }

  function deleteTask(id) { update((current) => ({ ...current, tasks: (current.tasks || []).filter((task) => task.id !== id) })); }

  function deleteActivity(id) { update((current) => ({ ...current, activities: (current.activities || []).filter((activity) => activity.id !== id) })); }
  function clearActivities() { update((current) => ({ ...current, activities: [] })); }

  function markPyqSolved(setId, count = 1) {
    const set = PYQ_SETS.find((item) => item.id === setId);
    update((current) => ({
      ...current,
      pyqSolved: { ...(current.pyqSolved || {}), [setId]: Math.min((current.pyqSolved?.[setId] || 0) + count, set?.questions || 999) },
      activities: pushActivity(current, `Solved ${count} PYQ in ${set?.title || 'PYQ set'}`)
    }));
  }

  function toggleMaterial(id) {
    const material = MATERIALS.find((item) => item.id === id);
    update((current) => ({
      ...current,
      materialRead: { ...(current.materialRead || {}), [id]: !current.materialRead?.[id] },
      activities: pushActivity(current, `${current.materialRead?.[id] ? 'Unread' : 'Read'} material: ${material?.title || id}`)
    }));
  }

  function saveTest() {
    const name = testScore.name.trim() || 'Chapter Test';
    const score = Number(testScore.score || 0);
    const total = Number(testScore.total || 0);
    if (!total) return alert('Enter total marks.');
    update((current) => ({
      ...current,
      tests: [{ id: `${Date.now()}`, name, score, total, date: new Date().toLocaleDateString() }, ...(current.tests || [])],
      activities: pushActivity(current, `Added test score: ${score}/${total}`)
    }));
    setTestScore({ name: '', score: '', total: '' });
  }

  function saveProfile() {
    update((current) => ({ ...current, profile: { ...current.profile, ...profileDraft, email }, activities: pushActivity(current, 'Profile details updated') }));
    setEditingProfile(false);
  }

  function resetLocalData() {
    const fresh = defaultData(email);
    localStorage.setItem(storageKey, JSON.stringify(fresh));
    setData(fresh);
    setProfileDraft(fresh.profile);
  }

  const nav = [
    { id: 'dashboard', label: 'Dashboard', group: 'LEARN', icon: Home },
    { id: 'pyq', label: 'PYQ Practice', group: 'LEARN', icon: Pi },
    { id: 'material', label: 'Study Material', group: 'LEARN', icon: BookOpen },
    { id: 'tests', label: 'Test Series', group: 'ASSESS', icon: CheckCircle2 },
    { id: 'ai', label: 'AI Tutor', group: 'AI LEARNING', icon: Bot },
    { id: 'profile', label: 'Profile', group: 'ACCOUNT', icon: UserRound },
  ];

  return (
    <div className={`app ${data.theme === 'dark' ? 'dark' : 'light'}`}>
      <aside className="sidebar">
        <div className="brand"><img src="/logo.png" alt="JEE Blueprint" /></div>
        {['LEARN', 'ASSESS', 'AI LEARNING', 'ACCOUNT'].map((group) => (
          <div className="navGroup" key={group}>
            <p>{group}</p>
            {nav.filter((item) => item.group === group).map((item) => {
              const Icon = item.icon;
              return <button key={item.id} onClick={() => setActive(item.id)} className={`navBtn ${data.active === item.id ? 'active' : ''}`}><Icon size={18} /> <span>{item.label}</span></button>;
            })}
          </div>
        ))}
        <div className="aiHelp"><Bot size={42} /><strong>Chat. Learn. Improve.</strong><span>Ask doubts and get study help.</span><button onClick={() => setActive('ai')}>Open AI Tutor</button></div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div className="welcome">Welcome back, {displayName} 👋</div>
          <div className="selectWrap"><select value={data.stream} onChange={(e) => update((current) => ({ ...current, stream: e.target.value }))}><option>11th IIT JEE</option><option>12th IIT JEE</option><option>Dropper</option></select><ChevronDown size={16} /></div>
          <div className="searchWrap"><Search size={17} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search chapters, topics, PYQs, notes..." /><kbd>Ctrl</kbd><kbd>K</kbd>{searchResults.length > 0 && <div className="searchResults">{searchResults.map((r, idx) => <button key={`${r.type}-${r.label}-${idx}`} onClick={() => setActive(r.page)}><span>{r.label}</span><small>{r.type}</small></button>)}</div>}</div>
          <div className="themeToggle"><button className={data.theme === 'light' ? 'active' : ''} onClick={() => update((current) => ({ ...current, theme: 'light' }))}><Sun size={15} /> Light</button><button className={data.theme === 'dark' ? 'active' : ''} onClick={() => update((current) => ({ ...current, theme: 'dark' }))}><Moon size={15} /> Dark</button></div>
          <button className="planBtn"><Trophy size={16} /> Free Plan</button>
        </header>

        {data.active === 'dashboard' && <Dashboard data={data} planner={planner} progressValue={progressValue} doneCount={doneCount} totalTopics={totalTopics} totalChapters={allChapters.length} todayMinutes={todayMinutes} liveTimerSeconds={liveTimerSeconds} pyqSolved={pyqSolved} avgMinutes={avgMinutes} startStudyTimer={startStudyTimer} pauseStudyTimer={pauseStudyTimer} resetStudyTimer={resetStudyTimer} toggleTopic={toggleTopic} toggleFlagTopic={toggleFlagTopic} addTask={addTask} newTask={newTask} setNewTask={setNewTask} toggleTask={toggleTask} deleteTask={deleteTask} deleteActivity={deleteActivity} clearActivities={clearActivities} setActive={setActive} query={query} />}
        {data.active === 'pyq' && <PyqPage data={data} selectedPyq={selectedPyq} setSelectedPyq={setSelectedPyq} markPyqSolved={markPyqSolved} query={query} />}
        {data.active === 'material' && <MaterialPage data={data} toggleMaterial={toggleMaterial} query={query} />}
        {data.active === 'tests' && <TestsPage data={data} testScore={testScore} setTestScore={setTestScore} saveTest={saveTest} />}
        {data.active === 'ai' && <AiPage data={data} localStudyFallback={localStudyFallback} />}
        {data.active === 'profile' && <ProfilePage data={data} profileDraft={profileDraft} setProfileDraft={setProfileDraft} editingProfile={editingProfile} setEditingProfile={setEditingProfile} saveProfile={saveProfile} signOut={signOut} resetLocalData={resetLocalData} />}
      </main>
    </div>
  );
}

function Dashboard({ data, planner, progressValue, doneCount, totalTopics, totalChapters, todayMinutes, liveTimerSeconds, pyqSolved, avgMinutes, startStudyTimer, pauseStudyTimer, resetStudyTimer, toggleTopic, toggleFlagTopic, addTask, newTask, setNewTask, toggleTask, deleteTask, deleteActivity, clearActivities, setActive, query }) {
  const pending = (data.tasks || []).filter((t) => !t.done);
  const flaggedCount = Object.values(data.topicsFlagged || {}).filter(Boolean).length;
  const [subjectFilter, setSubjectFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const timer = normalizeTimer(data.studyTimer);
  const [goalInput, setGoalInput] = useState(minutesToTimeInput(timer.targetMinutes));
  const q = query.trim().toLowerCase();
  const visibleActivities = (data.activities || []).filter((activity) => !activity.text?.startsWith('Unchecked topic:'));
  const allPlannerTopics = Object.entries(planner).flatMap(([subject, chapters]) => chapters.flatMap((chapter) => chapter.topics.map((topic) => ({ subject, chapter, topic }))));
  const nextPending = allPlannerTopics.find(({ topic }) => !data.topicsDone?.[topic.id]);
  const nextFlagged = allPlannerTopics.find(({ topic }) => data.topicsFlagged?.[topic.id] && !data.topicsDone?.[topic.id]);
  const timerTargetSeconds = Math.max(60, Number(timer.targetMinutes || DEFAULT_TIMER_MINUTES) * 60);
  const timerPct = Math.min(100, (liveTimerSeconds / timerTargetSeconds) * 100);
  const remainingSeconds = Math.max(0, timerTargetSeconds - liveTimerSeconds);

  useEffect(() => {
    setGoalInput(minutesToTimeInput(timer.targetMinutes));
  }, [timer.targetMinutes]);

  return (
    <section className="page">
      <div className="pageHead"><h1>Dashboard</h1><p>Track topics, run a real study timer, and continue with your next focus item.</p></div>
      <div className="heroCard compactHero">
        <div className="heroLeft">
          <span className="blueLabel">Your Learning Overview</span>
          <h2>{doneCount === 0 ? 'Start building momentum!' : 'Keep building momentum!'}</h2>
          <p>Today: <b>{formatDate(new Date())}</b></p>
          <div className="statPills interactivePills">
            <button onClick={() => setStatusFilter('Completed')}><CheckCircle2 size={20} /><b>{doneCount} / {totalTopics} topics</b><span>Completed topics</span></button>
            <button onClick={() => setStatusFilter(statusFilter === 'Flagged' ? 'All' : 'Flagged')}><Target size={20} /><b>{flaggedCount} flagged</b><span>{statusFilter === 'Flagged' ? 'Showing flagged topics' : 'Show priority topics'}</span></button>
            <button className="studyTimePill"><Clock size={20} /><b>Today's Study Time</b><span>{minutesText(todayMinutes)} • {timer.running ? 'Timer running' : liveTimerSeconds > 0 ? 'Timer paused' : 'Not started'}</span></button>
          </div>
          <div className="filterChips">
            {['All', 'Pending', 'Completed', 'Flagged'].map((filter) => <button key={filter} className={statusFilter === filter ? 'active' : ''} onClick={() => setStatusFilter(filter)}>{filter}</button>)}
          </div>
        </div>
        <div className="progressBlock">
          <div className="ring" style={{ '--p': `${progressValue * 3.6}deg` }}><strong>{percentText(progressValue)}</strong><span>Completed</span></div>
          <div className="subjectBars">
            {Object.entries(planner).map(([subject, chapters]) => {
              const topics = chapters.flatMap((chapter) => chapter.topics);
              const count = topics.filter((topic) => data.topicsDone?.[topic.id]).length;
              const pct = percentNumber(count, topics.length);
              return <button key={subject} className={subjectFilter === subject ? 'subjectBar active' : 'subjectBar'} onClick={() => setSubjectFilter(subjectFilter === subject ? 'All' : subject)}><b>{subject}</b><div className="bar"><span style={{ width: `${pct}%` }} /></div><strong>{percentText(pct)}</strong><small>{count} / {topics.length} topics</small></button>;
            })}
          </div>
        </div>
      </div>

      <div className="grid3 tightGrid">
        <div className="card timerCard"><h3><Clock size={19}/> Today's Study Time</h3><div className="timerDisplay">{clockText(liveTimerSeconds)}</div><p className="muted">Goal: {minutesText(timer.targetMinutes || DEFAULT_TIMER_MINUTES)} • Remaining: {clockText(remainingSeconds)}</p><div className="timerProgress"><span style={{ width: `${timerPct}%` }} /></div><label className="timerGoal"><span>Set focus timer</span><input type="time" value={goalInput} onChange={(e) => setGoalInput(e.target.value)} /></label><div className="btnRow timerBtns"><button className="primary" onClick={() => startStudyTimer(timeInputToMinutes(goalInput))}>{timer.running ? 'Running' : liveTimerSeconds > 0 ? 'Resume' : 'Start'}</button><button onClick={pauseStudyTimer} disabled={!timer.running}>Stop</button><button onClick={resetStudyTimer}>Reset</button></div></div>
        <div className="card focusCard"><h3>Today’s Focus</h3><div className="focusItem"><span>Next pending topic</span><b>{nextPending ? nextPending.topic.title : 'All visible topics completed'}</b><small>{nextPending ? `${nextPending.subject} • ${nextPending.chapter.title}` : 'Use filters or add more practice.'}</small></div><div className="focusItem"><span>Priority topic</span><b>{nextFlagged ? nextFlagged.topic.title : 'No flagged topic yet'}</b><small>{nextFlagged ? `${nextFlagged.subject} • ${nextFlagged.chapter.title}` : 'Tap the star on any topic to flag it.'}</small></div><button onClick={() => setStatusFilter('Pending')}>Show pending topics</button></div>
        <div className="card"><h3>Quick Stats</h3><div className="quickStat"><span>Topics Completed</span><b>{doneCount} / {totalTopics}</b></div><div className="quickStat"><span>Chapters Loaded</span><b>{totalChapters}</b></div><div className="quickStat"><span>Progress</span><b>{percentText(progressValue)}</b></div><div className="quickStat"><span>PYQs Solved</span><b>{pyqSolved}</b></div><div className="quickStat"><span>Avg. Study Time / Day</span><b>{minutesText(avgMinutes)}</b></div></div>
      </div>

      <div className="grid2 syllabusGrid">
        <div className="card syllabusCard"><h3>Planner Topic Tracker</h3><p className="muted">Click a chapter to open its planner topics. Tick each topic after you complete it.</p>{Object.entries(planner).map(([subject, chapters]) => {
          if (subjectFilter !== 'All' && subjectFilter !== subject) return null;
          const filterTopics = (chapter) => chapter.topics.filter((topic) => {
            const matchesSearch = !q || `${subject} ${chapter.title} ${chapter.subSubject} ${topic.title}`.toLowerCase().includes(q);
            const isDone = !!data.topicsDone?.[topic.id];
            const isFlagged = !!data.topicsFlagged?.[topic.id];
            const matchesStatus = statusFilter === 'All' || (statusFilter === 'Pending' && !isDone) || (statusFilter === 'Completed' && isDone) || (statusFilter === 'Flagged' && isFlagged);
            return matchesSearch && matchesStatus;
          });
          const filteredChapters = chapters.map((chapter) => ({ ...chapter, topics: filterTopics(chapter) })).filter((chapter) => chapter.topics.length || (!q && statusFilter === 'All'));
          if (filteredChapters.length === 0) return null;
          const subjectTopics = chapters.flatMap((chapter) => chapter.topics);
          const subjectDone = subjectTopics.filter((topic) => data.topicsDone?.[topic.id]).length;
          return <details key={subject} open={q || subjectFilter !== 'All' ? true : subject === 'Physics'} className="subjectPanel"><summary>{subject} <span>{subjectDone}/{subjectTopics.length} topics • {percentText(percentNumber(subjectDone, subjectTopics.length))}</span></summary><div className="chapterPanels">{filteredChapters.map((chapter) => {
            const topics = chapter.topics;
            const done = topics.filter((topic) => data.topicsDone?.[topic.id]).length;
            const pct = percentNumber(done, topics.length);
            return <details key={chapter.id} className="chapterPanel"><summary><div><b>{chapter.title}</b></div><span>{done}/{topics.length} • {percentText(pct)}</span></summary><div className="topicList">{topics.map((topic) => <div className={data.topicsDone?.[topic.id] ? 'topicRow done' : 'topicRow'} key={topic.id}><button className="topicCheck" onClick={() => toggleTopic(topic, chapter.title)}>{data.topicsDone?.[topic.id] ? <CheckCircle2 size={18} /> : <Circle size={18} />}</button><div><b>{topic.title}</b></div><button title="Flag topic" onClick={() => toggleFlagTopic(topic)} className={data.topicsFlagged?.[topic.id] ? 'flagged topicStar' : 'topicStar'}><Star size={15}/></button></div>)}</div></details>;
          })}</div></details>;
        })}</div>
        <div className="card"><h3>Pending Tasks</h3><div className="inlineForm"><input value={newTask} onChange={(e) => setNewTask(e.target.value)} placeholder="Add real task..." /><button onClick={addTask}><Plus size={17} /></button></div>{pending.length === 0 ? <p className="empty">No pending tasks yet.</p> : pending.slice(0, 8).map((task) => <div className="task" key={task.id}><button onClick={() => toggleTask(task.id)}><Circle size={17} /></button><span>{task.title}</span><small>{formatDate(task.date)}</small><button onClick={() => deleteTask(task.id)}><Trash2 size={15} /></button></div>)}<h3 className="mt">Quick Actions</h3><div className="quickActions"><button onClick={() => setActive('pyq')}><Pi /> <b>PYQ Practice</b><span>Practice past questions</span></button><button onClick={() => setActive('tests')}><CheckCircle2 /> <b>Test Series</b><span>Add manual scores</span></button><button onClick={() => setActive('ai')}><Bot /> <b>AI Tutor</b><span>Real AI / fallback</span></button><button onClick={() => setActive('material')}><BookOpen /> <b>Study Material</b><span>Mark notes as read</span></button></div><div className="between mt"><h3>Recent Activity</h3>{visibleActivities.length > 0 && <button className="smallDanger" onClick={clearActivities}>Clear all</button>}</div>{visibleActivities.length === 0 ? <p className="empty">No activity yet. Start marking topics, PYQs or study time.</p> : visibleActivities.slice(0, 8).map((a) => <div className="activity removable" key={a.id}><CheckCircle2 size={16}/><span>{a.text}</span><small>{a.date}</small><button onClick={() => deleteActivity(a.id)}><X size={15}/></button></div>)}</div>
      </div>
    </section>
  );
}

function PyqPage({ data, selectedPyq, setSelectedPyq, markPyqSolved, query }) {
  const q = query.trim().toLowerCase();
  const sets = q ? PYQ_SETS.filter((set) => `${set.title} ${set.subject}`.toLowerCase().includes(q)) : PYQ_SETS;
  const current = PYQ_SETS.find((set) => set.id === selectedPyq);
  return <section className="page"><div className="pageHead"><h1>PYQ Practice</h1><p>No fake count. The solved count increases only after you click “Mark 1 solved”.</p></div><div className="cards4">{sets.map((set) => <div className="card" key={set.id}><span className="badge">{set.subject}</span><h3>{set.title}</h3><p>{set.questions} questions planned</p><p>Difficulty: {set.difficulty}</p><button className="primary" onClick={() => setSelectedPyq(set.id)}>Open set</button></div>)}</div>{current && <div className="card mt"><h3>{current.title}</h3><p>Solved: {data.pyqSolved?.[current.id] || 0} / {current.questions}</p><div className="btnRow"><button onClick={() => markPyqSolved(current.id, 1)}>Mark 1 solved</button><button onClick={() => markPyqSolved(current.id, 5)}>+5 solved</button><button onClick={() => setSelectedPyq(null)}>Close</button></div></div>}</section>;
}

function MaterialPage({ data, toggleMaterial, query }) {
  const q = query.trim().toLowerCase();
  const items = q ? MATERIALS.filter((item) => `${item.title} ${item.subject} ${item.detail}`.toLowerCase().includes(q)) : MATERIALS;
  return <section className="page"><div className="pageHead"><h1>Study Material</h1><p>Mark materials as read only after you actually complete them.</p></div><div className="cards4">{items.map((m) => <div className="card" key={m.id}><span className="badge">{m.subject}</span><h3>{m.title}</h3><p>{m.detail}</p><button className={data.materialRead?.[m.id] ? 'successBtn' : 'primary'} onClick={() => toggleMaterial(m.id)}>{data.materialRead?.[m.id] ? 'Read ✓' : 'Mark as read'}</button></div>)}</div></section>;
}

function TestsPage({ data, testScore, setTestScore, saveTest }) {
  return <section className="page"><div className="pageHead"><h1>Test Series</h1><p>Add real test scores manually. No automatic fake score is shown.</p></div><div className="grid2"><div className="card"><h3>Add Test Score</h3><input placeholder="Test name" value={testScore.name} onChange={(e) => setTestScore({ ...testScore, name: e.target.value })} /><input placeholder="Score" value={testScore.score} onChange={(e) => setTestScore({ ...testScore, score: e.target.value })} /><input placeholder="Total marks" value={testScore.total} onChange={(e) => setTestScore({ ...testScore, total: e.target.value })} /><button className="primary" onClick={saveTest}>Save score</button></div><div className="card"><h3>Saved Tests</h3>{(data.tests || []).length === 0 ? <p className="empty">No test score added yet.</p> : data.tests.map((t) => <div className="quickStat" key={t.id}><span>{t.name}<small>{t.date}</small></span><b>{t.score}/{t.total}</b></div>)}</div></div></section>;
}

function AiPage({ data, localStudyFallback }) {
  const client = useMemo(() => generateClient(), []);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function askTutor() {
    const text = question.trim();
    if (!text) { setError('First type your doubt/question.'); return; }
    setLoading(true); setError(''); setAnswer('');
    try {
      const context = JSON.stringify({
        stream: data.stream,
        targetExam: data.profile?.targetExam,
        targetDate: data.profile?.targetDate,
        className: data.profile?.className,
        weakAreas: data.profile?.weakAreas,
      });
      const result = await client.queries.askAi({ question: text, context });
      const aiText = result?.data || '';
      if (result?.errors?.length) { setAnswer(localStudyFallback(text)); setError('Backend AI call failed, so a local fallback answer is shown.'); }
      else { setAnswer(aiText || localStudyFallback(text)); }
    } catch (err) {
      setAnswer(localStudyFallback(text));
      setError('Could not connect to AI right now. Showing a study-helper answer.');
    } finally { setLoading(false); }
  }

  function example(text) { setQuestion(text); setAnswer(''); setError(''); }

  return <section className="page"><div className="pageHead"><h1>AI Tutor</h1></div><div className="card aiTutorPanel"><div className="aiTutorTop"><div className="aiAvatar"><Bot size={30} /></div><div><h2>Ask JEE Blueprint AI</h2><p>Ask Physics, Chemistry, Maths doubts, study plans, and revision strategy.</p></div></div><div className="aiExamples"><button onClick={() => example('Explain Kirchhoff laws with one JEE level example')}>Explain Kirchhoff laws</button><button onClick={() => example('Give me a 7 day revision plan for Chemical Bonding')}>7 day revision plan</button><button onClick={() => example('How should I revise Integration for JEE Advanced?')}>Integration strategy</button></div><textarea className="aiInput" value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Type your doubt in English, Hindi or Marathi..." rows={5} /><div className="aiActionRow"><button className="primary" onClick={askTutor} disabled={loading}>{loading ? 'AI thinking...' : 'Ask AI Tutor'} <Send size={17} /></button></div>{error && <div className="aiError">{error}</div>}{answer && <div className="aiAnswer"><h3>Answer</h3><pre>{answer}</pre></div>}</div></section>;
}

function ProfilePage({ data, profileDraft, setProfileDraft, editingProfile, setEditingProfile, saveProfile, signOut, resetLocalData }) {
  const fields = [
    ['fullName', 'Full Name', 'text'], ['mobile', 'Mobile No', 'text'], ['email', 'Email', 'text'], ['city', 'City / Village / Town', 'text'],
    ['className', 'Class', 'text'], ['board', 'Board / State Board', 'text'], ['targetExam', 'Target Exam Name', 'text'], ['targetDate', 'Target Exam Date', 'date'],
    ['language', 'Preferred Language', 'text'], ['studyGoal', 'Study Goal', 'text'], ['dailyStudyTime', 'Daily Study Time', 'text'], ['weakAreas', 'Weak Areas', 'text'], ['preferredContent', 'Preferred Content Type', 'text'],
  ];
  const left = daysLeft(data.profile.targetDate);
  return <section className="page"><div className="pageHead"><h1>Profile</h1><p>Update the student name, exam target, and date here. Sign out is available here.</p></div><div className="profileHero"><div className="avatar">👨‍🎓</div><div><h2>{data.profile.fullName || 'Student Profile'}</h2><p>{data.profile.email || 'Email not available'}</p><span className="badge">{data.profile.targetExam || 'Target not set'}</span></div><div className="targetSummary"><b>{data.profile.targetDate ? formatDate(data.profile.targetDate) : 'Date not set'}</b><span>{left === null ? 'Set target date' : left >= 0 ? `${left} days left` : `${Math.abs(left)} days passed`}</span></div></div><div className="card profileTargetCard"><div><h3>Exam Target</h3><p className="muted">Set the exam name and target date here. Dashboard will only show study progress.</p></div><div className="targetForm"><label><span>Target Exam Name</span><input value={profileDraft.targetExam || ''} onChange={(e) => setProfileDraft({ ...profileDraft, targetExam: e.target.value })} placeholder="JEE Advanced 2027" /></label><label><span>Target Exam Date</span><input value={profileDraft.targetDate || ''} onChange={(e) => setProfileDraft({ ...profileDraft, targetDate: e.target.value })} type="date" /></label><button className="primary" onClick={saveProfile}><Save size={16}/> Save Target</button></div></div><div className="profileGrid"><div className="card wide"><div className="between"><h3>Profile Details</h3>{editingProfile ? <button onClick={saveProfile}><Save size={16}/> Save</button> : <button onClick={() => { setProfileDraft(data.profile); setEditingProfile(true); }}><PenLine size={16}/> Edit</button>}</div><div className="detailsGrid">{fields.map(([key, label, type]) => <label key={key}><span>{label}</span>{editingProfile && key !== 'email' ? <input value={profileDraft[key] || ''} onChange={(e) => setProfileDraft({ ...profileDraft, [key]: e.target.value })} placeholder={`Enter ${label}`} type={type} /> : <b>{key === 'targetDate' && data.profile[key] ? formatDate(data.profile[key]) : data.profile[key] || '-'}</b>}</label>)}</div></div><div className="card actions"><h3>Account Actions</h3><button className="primary" onClick={() => { setProfileDraft(data.profile); setEditingProfile(true); }}><PenLine size={16}/> Edit Profile</button>{editingProfile && <button onClick={saveProfile}><Save size={16}/> Save Changes</button>}<button className="danger" onClick={signOut}><LogOut size={16}/> Sign out</button><button onClick={resetLocalData}><RotateCcw size={16}/> Reset this browser data</button><div className="safeBox">🔒 Data is currently saved in this browser. Cloud sync can be added later.</div></div></div></section>;
}

export default function App() {
  return <ThemeProvider theme={uiTheme}><Authenticator>{({ signOut, user }) => <AppShell user={user} signOut={signOut} />}</Authenticator></ThemeProvider>;
}
