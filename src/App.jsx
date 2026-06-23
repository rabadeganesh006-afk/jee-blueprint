import { useEffect, useMemo, useState } from 'react';
import { Authenticator, ThemeProvider, createTheme, useAuthenticator } from '@aws-amplify/ui-react';
import { generateClient } from 'aws-amplify/api';
import '@aws-amplify/ui-react/styles.css';
import {
  BookOpen, Bot, CalendarDays, Check, CheckCircle2, ChevronDown, Circle, Clock, FileText,
  Home, LogOut, Moon, PenLine, Pi, Plus, Save, Search, Send, Sun, Target,
  Trash2, Trophy, UserRound, X, RotateCcw, Star
} from 'lucide-react';
import { PLANNER } from './plannerData';
import './style.css';

const uiTheme = createTheme({
  name: 'study-blueprint-theme',
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
const SUBJECT_COLORS = { Physics: '#3b82f6', Chemistry: '#10b981', Mathematics: '#a855f7' };
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
    avatarDataUrl: '',
  }
});

function makeStorageKey(user) {
  const email = user?.signInDetails?.loginId || user?.attributes?.email || user?.username || 'student';
  return `study-blueprint-v17-branding-${email}`;
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


function LandingPage({ onSignIn, onCreateAccount }) {
  const categories = [
    { title: 'JEE', detail: 'Topic tracker, PYQs, study timer', status: 'Active' },
    { title: 'NEET', detail: 'PCB planner and progress tools', status: 'Coming soon' },
    { title: 'Boards', detail: 'Class 9–12 study planning', status: 'Coming soon' },
    { title: 'UPSC', detail: 'Long-term preparation roadmap', status: 'Coming soon' },
  ];
  const resources = [
    { title: 'Topic Planner', detail: 'Chapter-wise topics with tick tracking.' },
    { title: 'Study Timer', detail: 'Focus timer with start, pause and reset.' },
    { title: 'Progress Dashboard', detail: 'Subject-wise and overall progress.' },
  ];
  return (
    <main className="landing">
      <nav className="landingNav">
        <img src="/study-blueprint-logo.svg" alt="Study Blueprint" />
        <div>
          <button onClick={onSignIn} className="ghostBtn">Sign in</button>
          <button onClick={onCreateAccount} className="primary">Get Started</button>
        </div>
      </nav>

      <section className="landingHero">
        <div className="heroCopy">
          <span className="landingBadge">Plan • Track • Improve</span>
          <h1>India’s smart study tracker for serious exam preparation.</h1>
          <p>Study Blueprint helps students track syllabus topics, focus time, revision tasks, PYQs and progress in one clean dashboard.</p>
          <div className="heroActions">
            <button onClick={onCreateAccount} className="primary bigCta">Start Free</button>
            <button onClick={onSignIn} className="outlineBtn">I already have an account</button>
          </div>
        </div>
        <div className="heroVisual">
          <div className="mockCard topMock"><b>Today’s Study Time</b><strong>02:30</strong><span>Focus timer ready</span></div>
          <div className="mockCard midMock"><b>Physics</b><div className="mockBar"><i style={{ width: '42%' }} /></div><span>42% topics done</span></div>
          <div className="mockCard lowMock"><b>Next topic</b><span>Electrostatics • Electric Field</span><button>Continue</button></div>
        </div>
      </section>

      <section className="trustStrip">
        <div><b>15M+</b><span>learning-inspired experience</span></div>
        <div><b>3</b><span>core subjects</span></div>
        <div><b>270+</b><span>planner topics loaded</span></div>
        <div><b>Mobile</b><span>friendly dashboard</span></div>
      </section>

      <section className="landingSection">
        <div className="sectionTitle"><h2>Study Resources</h2><p>A clean student workspace for everyday preparation.</p></div>
        <div className="resourceGrid">{resources.map((item) => <article key={item.title}><div className="resourceIcon"><BookOpen size={24}/></div><h3>{item.title}</h3><p>{item.detail}</p></article>)}</div>
      </section>

      <section className="landingSection">
        <div className="sectionTitle"><h2>Exam Categories</h2><p>JEE is active now. Other categories can be added later without changing the brand.</p></div>
        <div className="categoryGrid">{categories.map((item) => <article key={item.title}><span>{item.status}</span><h3>{item.title}</h3><p>{item.detail}</p><button onClick={item.title === 'JEE' ? onCreateAccount : undefined}>{item.title === 'JEE' ? 'Explore Category' : 'Coming Soon'}</button></article>)}</div>
      </section>

      <section className="landingCta">
        <h2>Build your preparation blueprint today.</h2>
        <p>Create an account and start tracking real progress instead of guessing.</p>
        <button onClick={onCreateAccount} className="primary bigCta">Get Started</button>
      </section>
    </main>
  );
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
  const [streamMenuOpen, setStreamMenuOpen] = useState(false);
  const streamOptions = ['11th IIT JEE', '12th IIT JEE', 'Dropper'];
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
        <div className="brand brandFull">
          <img className="brandMark" src="/study-blueprint-icon.svg" alt="Study Blueprint" />
          <div className="brandWords">
            <div className="brandTitle">Study Blueprint</div>
            <div className="brandLine">Plan • Track • Improve</div>
          </div>
        </div>
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
          <div className={`selectWrap customSelect ${streamMenuOpen ? 'open' : ''}`}>
            <button type="button" className="selectButton" onClick={() => setStreamMenuOpen((value) => !value)} aria-expanded={streamMenuOpen}>
              <span>{data.stream}</span><ChevronDown size={16} />
            </button>
            {streamMenuOpen && (
              <div className="selectMenu">
                {streamOptions.map((option) => (
                  <button key={option} type="button" className={data.stream === option ? 'active' : ''} onClick={() => { update((current) => ({ ...current, stream: option })); setStreamMenuOpen(false); }}>
                    <span>{option}</span>{data.stream === option && <Check size={15} />}
                  </button>
                ))}
              </div>
            )}
          </div>
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
  const nextActionTopics = allPlannerTopics.filter(({ topic }) => !data.topicsDone?.[topic.id]).slice(0, 3);
  const subjectStats = Object.entries(planner).map(([subject, chapters]) => {
    const topics = chapters.flatMap((chapter) => chapter.topics);
    const count = topics.filter((topic) => data.topicsDone?.[topic.id]).length;
    return { subject, topics, count, pct: percentNumber(count, topics.length), color: SUBJECT_COLORS[subject] || '#2563eb' };
  });
  let currentAngle = 0;
  const ringParts = [];
  subjectStats.forEach((stat) => {
    const angle = totalTopics ? (stat.count / totalTopics) * 360 : 0;
    if (angle > 0) {
      ringParts.push(`${stat.color} ${currentAngle}deg ${currentAngle + angle}deg`);
      currentAngle += angle;
    }
  });
  const ringBackground = ringParts.length
    ? `conic-gradient(${ringParts.join(', ')}, rgba(148,163,184,.18) ${currentAngle}deg 360deg)`
    : 'conic-gradient(rgba(148,163,184,.18) 0deg 360deg)';
  const timerTargetSeconds = Math.max(60, Number(timer.targetMinutes || DEFAULT_TIMER_MINUTES) * 60);
  const timerPct = Math.min(100, (liveTimerSeconds / timerTargetSeconds) * 100);
  const remainingSeconds = Math.max(0, timerTargetSeconds - liveTimerSeconds);
  const timerStatus = timer.running ? 'Running' : liveTimerSeconds > 0 ? 'Paused' : 'Ready';

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
        <div className="progressBlock polishedProgress">
          <div className="ring multiRing" style={{ background: ringBackground }}><strong>{percentText(progressValue)}</strong><span>Completed</span></div>
          <div className="subjectBars">
            {subjectStats.map((stat) => (
              <button key={stat.subject} className={subjectFilter === stat.subject ? 'subjectBar active' : 'subjectBar'} onClick={() => setSubjectFilter(subjectFilter === stat.subject ? 'All' : stat.subject)}>
                <b style={{ color: stat.color }}>{stat.subject}</b>
                <div className="bar"><span style={{ width: `${stat.pct}%`, background: stat.color }} /></div>
                <strong style={{ color: stat.color }}>{percentText(stat.pct)}</strong>
                <small>{stat.count} / {stat.topics.length} topics</small>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid3 tightGrid dashboardUtilityGrid">
        <div className="card timerCard upgradedTimer">
          <div className="timerHeader"><h3><Clock size={19}/> Today's Study Time</h3><span className={`statusBadge ${timer.running ? 'running' : liveTimerSeconds > 0 ? 'paused' : ''}`}>{timerStatus}</span></div>
          <div className="timerDisplay">{clockText(liveTimerSeconds)}</div>
          <div className="timerMeta"><span>Goal: <b>{minutesText(timer.targetMinutes || DEFAULT_TIMER_MINUTES)}</b></span><span>Remaining: <b>{clockText(remainingSeconds)}</b></span></div>
          <div className="timerProgress"><span style={{ width: `${timerPct}%` }} /></div>
          <div className="presetGoals">
            {[25, 50, 90, 150].map((m) => <button key={m} onClick={() => setGoalInput(minutesToTimeInput(m))}>{m === 150 ? '2h 30m' : `${m}m`}</button>)}
          </div>
          <label className="timerGoal"><span>Custom focus timer</span><input type="time" value={goalInput} onChange={(e) => setGoalInput(e.target.value)} /></label>
          <div className="btnRow timerBtns"><button className="primary" onClick={() => startStudyTimer(timeInputToMinutes(goalInput))}>{timer.running ? 'Running' : liveTimerSeconds > 0 ? 'Resume' : 'Start'}</button><button onClick={pauseStudyTimer} disabled={!timer.running}>Pause</button><button onClick={resetStudyTimer}>Reset</button></div>
        </div>
        <div className="card nextTopicsCard">
          <div className="between"><h3>Next Topics to Complete</h3><button className="miniLink" onClick={() => setStatusFilter('Pending')}>View all</button></div>
          <p className="muted compactText">Use this card as your real checklist for the next study session.</p>
          <div className="nextTopicList">
            {nextActionTopics.length === 0 ? <p className="empty">All visible topics are completed. Switch class/filters or add revision tasks.</p> : nextActionTopics.map(({ subject, chapter, topic }) => (
              <div className="nextTopicItem" key={topic.id}>
                <button className="topicCheck" onClick={() => toggleTopic(topic, chapter.title)}><Circle size={18}/></button>
                <div><b>{topic.title}</b><small>{subject} • {chapter.title}</small></div>
                <button title="Flag topic" onClick={() => toggleFlagTopic(topic)} className={data.topicsFlagged?.[topic.id] ? 'flagged topicStar' : 'topicStar'}><Star size={15}/></button>
              </div>
            ))}
          </div>
        </div>
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

  return <section className="page"><div className="pageHead"><h1>AI Tutor</h1></div><div className="card aiTutorPanel"><div className="aiTutorTop"><div className="aiAvatar"><Bot size={30} /></div><div><h2>Ask Study Blueprint AI</h2><p>Ask Physics, Chemistry, Maths doubts, study plans, and revision strategy.</p></div></div><div className="aiExamples"><button onClick={() => example('Explain Kirchhoff laws with one JEE level example')}>Explain Kirchhoff laws</button><button onClick={() => example('Give me a 7 day revision plan for Chemical Bonding')}>7 day revision plan</button><button onClick={() => example('How should I revise Integration for JEE Advanced?')}>Integration strategy</button></div><textarea className="aiInput" value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Type your doubt in English, Hindi or Marathi..." rows={5} /><div className="aiActionRow"><button className="primary" onClick={askTutor} disabled={loading}>{loading ? 'AI thinking...' : 'Ask AI Tutor'} <Send size={17} /></button></div>{error && <div className="aiError">{error}</div>}{answer && <div className="aiAnswer"><h3>Answer</h3><pre>{answer}</pre></div>}</div></section>;
}

function ProfilePage({ data, profileDraft, setProfileDraft, editingProfile, setEditingProfile, saveProfile, signOut, resetLocalData }) {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const fields = [
    ['fullName', 'Full Name', 'text'], ['mobile', 'Mobile No', 'text'], ['email', 'Email', 'text'], ['city', 'City / Village / Town', 'text'],
    ['className', 'Class', 'text'], ['board', 'Board / State Board', 'text'], ['language', 'Preferred Language', 'text'],
    ['studyGoal', 'Study Goal', 'text'], ['dailyStudyTime', 'Daily Study Time', 'text'], ['weakAreas', 'Weak Areas', 'text'], ['preferredContent', 'Preferred Content Type', 'text'],
  ];
  const left = daysLeft(data.profile.targetDate);
  const avatarUrl = profileDraft.avatarDataUrl || data.profile.avatarDataUrl || '';

  function handleAvatarUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      setProfileDraft({ ...profileDraft, avatarDataUrl: reader.result });
      setEditingProfile(true);
    };
    reader.readAsDataURL(file);
  }

  return (
    <section className="page profilePageV23">
      <div className="pageHead"><h1>Profile</h1><p>Manage student details, exam target, profile photo and account settings.</p></div>

      <div className="profileHero profileHeroV23">
        <div className="profileIdentityBlock">
          <div className="profilePhotoWrap">
            {avatarUrl ? <img src={avatarUrl} alt="Student profile" /> : <div className="avatar profileAvatarFallback">👨‍🎓</div>}
            <label className="photoUploadBtn" title="Add or change profile photo">
              <PenLine size={15} />
              <input type="file" accept="image/*" onChange={handleAvatarUpload} />
            </label>
          </div>
          <div className="profileIdentityText">
            <h2>{data.profile.fullName || 'Student Profile'}</h2>
            <p>{data.profile.email || 'Email not available'}</p>
            <span className="badge">{data.profile.targetExam || 'Target not set'}</span>
          </div>
        </div>

        <div className="profileFutureCard">
          <div className="futureGraphic" aria-hidden="true">
            <span className="rocketShape">🚀</span>
            <i></i><i></i><i></i>
          </div>
          <div>
            <h3>Keep building your future</h3>
            <p>Complete your profile to get a cleaner dashboard, better target tracking and personalized study planning.</p>
          </div>
        </div>

        <div className="targetSummary targetSummaryV23">
          <span>Target Date</span>
          <b>{data.profile.targetDate ? formatDate(data.profile.targetDate) : 'Date not set'}</b>
          <small>{left === null ? 'Set target date' : left >= 0 ? `${left} days left` : `${Math.abs(left)} days passed`}</small>
        </div>
      </div>

      <div className="card profileTargetCard profileTargetV23">
        <div><h3>Exam Target</h3><p className="muted">Set the target exam name and date here. The dashboard will use this target for tracking.</p></div>
        <div className="targetForm"><label><span>Target Exam Name</span><input value={profileDraft.targetExam || ''} onChange={(e) => setProfileDraft({ ...profileDraft, targetExam: e.target.value })} placeholder="JEE Advanced 2027" /></label><label><span>Target Exam Date</span><input value={profileDraft.targetDate || ''} onChange={(e) => setProfileDraft({ ...profileDraft, targetDate: e.target.value })} type="date" /></label><button className="primary" onClick={saveProfile}><Save size={16}/> Save Target</button></div>
      </div>

      <div className="profileGrid profileGridV23">
        <div className="card wide">
          <div className="between"><h3>Personal & Academic Details</h3>{editingProfile ? <button onClick={saveProfile}><Save size={16}/> Save</button> : <button onClick={() => { setProfileDraft(data.profile); setEditingProfile(true); }}><PenLine size={16}/> Edit</button>}</div>
          <div className="detailsGrid detailsGridV23">{fields.map(([key, label, type]) => <label key={key}><span>{label}</span>{editingProfile && key !== 'email' ? <input value={profileDraft[key] || ''} onChange={(e) => setProfileDraft({ ...profileDraft, [key]: e.target.value })} placeholder={`Enter ${label}`} type={type} /> : <b>{data.profile[key] || '-'}</b>}</label>)}</div>
        </div>
        <div className="profileSideStack">
          <div className="card actions actionsV23"><h3>Account Actions</h3><button className="primary" onClick={() => { setProfileDraft(data.profile); setEditingProfile(true); }}><PenLine size={16}/> Edit Profile</button>{editingProfile && <button onClick={saveProfile}><Save size={16}/> Save Changes</button>}<button className="danger" onClick={() => setShowLogoutConfirm(true)}><LogOut size={16}/> Sign out</button><button onClick={resetLocalData}><RotateCcw size={16}/> Reset this browser data</button></div>
          <div className="safeBox safeBoxV23"><b>Your data is safe with us</b><span>We do not sell your personal information. Your study progress stays private inside your account/browser setup.</span></div>
        </div>
      </div>

      {showLogoutConfirm && (
        <div className="confirmOverlay" role="dialog" aria-modal="true">
          <div className="confirmBox">
            <h3>Confirm sign out</h3>
            <p>Are you sure you want to sign out of Study Blueprint?</p>
            <div className="confirmActions">
              <button onClick={() => setShowLogoutConfirm(false)}>Cancel</button>
              <button className="danger" onClick={() => { setShowLogoutConfirm(false); signOut?.(); }}>Yes, sign out</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}


function AuthLayout({ authScreen, setAuthScreen }) {
  const { route, user, signOut } = useAuthenticator((context) => [context.route, context.user]);

  if (route === 'authenticated' && user) {
    return <AppShell user={user} signOut={() => { signOut?.(); setAuthScreen(null); }} />;
  }

  if (!authScreen) {
    return <LandingPage onSignIn={() => setAuthScreen('signIn')} onCreateAccount={() => setAuthScreen('signUp')} />;
  }

  return (
    <div className="authShell authShellModern">
      <button className="backLanding" onClick={() => setAuthScreen(null)}>← Back to landing</button>
      <div className="authPageGrid">
        <section className="authBrandPanel">
          <img className="authBrandLogo" src="/study-blueprint-logo.svg" alt="Study Blueprint" />
          <span className="landingBadge">Plan • Track • Improve</span>
          <h1>Build your preparation blueprint.</h1>
          <p>Login to track topics, run a study timer, manage PYQs, and continue your JEE progress dashboard.</p>
          <div className="authFeatureList">
            <div><CheckCircle2 size={18} /><span>Topic-wise syllabus tracker</span></div>
            <div><Clock size={18} /><span>Real focus timer</span></div>
            <div><Target size={18} /><span>Exam target and progress dashboard</span></div>
          </div>
        </section>
        <section className="authFormPanel">
          <div className="authFormHeader">
            <img src="/study-blueprint-icon.svg" alt="Study Blueprint icon" />
            <div>
              <h2>{authScreen === 'signUp' ? 'Create your account' : 'Welcome back'}</h2>
              <p>{authScreen === 'signUp' ? 'Start tracking your study progress.' : 'Sign in to continue your dashboard.'}</p>
            </div>
          </div>
          <Authenticator key={authScreen} initialState={authScreen} />
        </section>
      </div>
    </div>
  );
}

export default function App() {
  const [authScreen, setAuthScreen] = useState(null);

  return (
    <ThemeProvider theme={uiTheme}>
      <Authenticator.Provider>
        <AuthLayout authScreen={authScreen} setAuthScreen={setAuthScreen} />
      </Authenticator.Provider>
    </ThemeProvider>
  );
}
