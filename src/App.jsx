import { useMemo, useState } from 'react';
import { Authenticator, ThemeProvider, createTheme } from '@aws-amplify/ui-react';
import { generateClient } from 'aws-amplify/api';
import '@aws-amplify/ui-react/styles.css';
import {
  BookOpen, Bot, CalendarDays, CheckCircle2, ChevronDown, Circle, Clock, FileText,
  Home, LogOut, Moon, PenLine, Pi, Plus, Save, Search, Send, Sun, Target,
  Trash2, Trophy, UserRound, X, RotateCcw
} from 'lucide-react';
import './style.css';

const uiTheme = createTheme({
  name: 'jee-blueprint-theme',
  tokens: {
    colors: {
      brand: {
        primary: { 10: '#eef6ff', 80: '#2563eb', 90: '#1d4ed8', 100: '#1e40af' },
      },
    },
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

const SYLLABUS = {
  Physics: [
    'Physics and Measurement', 'Mathematical Tools', 'Vectors', 'Motion in a Straight Line', 'Motion in a Plane',
    'Laws of Motion', 'Work, Energy and Power', 'Centre of Mass', 'Rotational Motion', 'Gravitation',
    'Mechanical Properties of Solids', 'Mechanical Properties of Fluids', 'Thermal Properties of Matter',
    'Thermodynamics', 'Kinetic Theory of Gases', 'Oscillations', 'Waves', 'Electrostatics', 'Capacitance',
    'Current Electricity', 'Magnetic Effects of Current', 'Magnetism and Matter', 'Electromagnetic Induction',
    'Alternating Current', 'Electromagnetic Waves', 'Ray Optics', 'Wave Optics', 'Dual Nature of Matter and Radiation',
    'Atoms', 'Nuclei', 'Semiconductor Electronics', 'Experimental Skills'
  ],
  Chemistry: [
    'Some Basic Concepts of Chemistry', 'Atomic Structure', 'Chemical Bonding and Molecular Structure',
    'Chemical Thermodynamics', 'Solutions', 'Equilibrium', 'Redox Reactions and Electrochemistry',
    'Chemical Kinetics', 'Surface Chemistry', 'Classification of Elements and Periodicity', 'Hydrogen',
    's-Block Elements', 'p-Block Elements', 'd- and f-Block Elements', 'Coordination Compounds',
    'General Principles and Processes of Isolation of Metals', 'Environmental Chemistry', 'Purification of Organic Compounds',
    'Organic Chemistry: Basic Principles and Techniques', 'Hydrocarbons', 'Haloalkanes and Haloarenes',
    'Alcohols, Phenols and Ethers', 'Aldehydes, Ketones and Carboxylic Acids', 'Amines', 'Biomolecules',
    'Polymers', 'Chemistry in Everyday Life', 'Principles Related to Practical Chemistry'
  ],
  Mathematics: [
    'Sets, Relations and Functions', 'Trigonometric Functions', 'Inverse Trigonometric Functions', 'Complex Numbers',
    'Quadratic Equations', 'Sequences and Series', 'Binomial Theorem', 'Permutations and Combinations',
    'Mathematical Induction', 'Matrices', 'Determinants', 'Straight Lines', 'Circles', 'Parabola', 'Ellipse',
    'Hyperbola', 'Limits', 'Continuity and Differentiability', 'Differentiation', 'Application of Derivatives',
    'Indefinite Integration', 'Definite Integration', 'Area Under Curves', 'Differential Equations',
    'Vector Algebra', 'Three Dimensional Geometry', 'Statistics', 'Probability', 'Mathematical Reasoning',
    'Linear Programming'
  ]
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
  chaptersDone: {},
  chaptersFlagged: {},
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
  return `jee-blueprint-v10-real-${email}`;
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

function localStudyFallback(question) {
  const q = question.toLowerCase();
  if (q.includes('plan') || q.includes('revision') || q.includes('strategy')) {
    return `AI quota is not active, so this is a free local study-helper answer.\n\n7-day revision method:\n1) Day 1-2: Revise theory and formulas from NCERT/notes.\n2) Day 3-4: Solve previous year questions.\n3) Day 5: Solve weak questions again.\n4) Day 6: Take a chapter test.\n5) Day 7: Revise your mistakes notebook.\n\nRule: concept first, then PYQs, then test analysis.`;
  }
  if (q.includes('integration')) {
    return `AI quota is not active, so this is a free local study-helper answer.\n\nSequence for Integration:\n1) Memorize standard formulas perfectly.\n2) Practice substitution, integration by parts, and partial fractions separately.\n3) Solve 15 definite integration property questions daily.\n4) While solving PYQs, identify the method used in each question.\n\nIf this topic is weak, spend the first day only on formulas and solved examples.`;
  }
  if (q.includes('chemical bonding') || q.includes('bonding')) {
    return `AI quota is not active, so this is a free local study-helper answer.\n\nChemical Bonding priority:\n1) VSEPR shapes\n2) Hybridisation\n3) MOT basics\n4) Bond order and magnetic nature\n5) Dipole moment\n\nWhile solving PYQs, revise shape + hybridisation + bond order together.`;
  }
  return `AI quota is not active, so this is a free local study-helper answer.\n\nYour doubt: ${question}\n\nBest approach:\n1) Identify the chapter name.\n2) Revise formula/theory for 10 minutes.\n3) Review 5 solved examples.\n4) Solve 15 PYQs.\n5) Write the exact step where you got stuck and ask AI again.\n\nTo use real Gemini AI, check active quota/billing for this project in Google AI Studio.`;
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

  function update(patchOrFn) {
    setData((current) => {
      const next = typeof patchOrFn === 'function' ? patchOrFn(current) : { ...current, ...patchOrFn };
      localStorage.setItem(storageKey, JSON.stringify(next));
      return next;
    });
  }

  function addActivity(text) {
    update((current) => ({
      ...current,
      activities: [{ text, date: new Date().toLocaleString(), id: Date.now() }, ...(current.activities || [])].slice(0, 15)
    }));
  }

  const allChapters = useMemo(() => Object.entries(SYLLABUS).flatMap(([subject, chapters]) => chapters.map((chapter) => ({ subject, chapter }))), []);
  const doneCount = Object.values(data.chaptersDone || {}).filter(Boolean).length;
  const totalChapters = allChapters.length;
  const progressValue = percentNumber(doneCount, totalChapters);
  const todayMinutes = data.studyByDate?.[todayKey()] || 0;
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
      .filter((item) => `${item.subject} ${item.chapter}`.toLowerCase().includes(q))
      .slice(0, 12)
      .map((item) => ({ type: item.subject, label: item.chapter, page: 'dashboard' }));
    const pyqHits = PYQ_SETS.filter((item) => `${item.title} ${item.subject}`.toLowerCase().includes(q))
      .map((item) => ({ type: 'PYQ', label: item.title, page: 'pyq' }));
    const materialHits = MATERIALS.filter((item) => `${item.title} ${item.subject}`.toLowerCase().includes(q))
      .map((item) => ({ type: 'Material', label: item.title, page: 'material' }));
    return [...pageHits, ...chapterHits, ...pyqHits, ...materialHits].slice(0, 12);
  }, [query, allChapters]);

  function setActive(active) {
    update((current) => ({ ...current, active }));
  }

  function updateProfileFields(fields, log = true) {
    update((current) => ({ ...current, profile: { ...current.profile, ...fields, email } }));
    setProfileDraft((current) => ({ ...current, ...fields, email }));
    if (log) addActivity('Profile / target details updated');
  }

  function addStudyMinutes(minutes) {
    const key = todayKey();
    update((current) => ({
      ...current,
      studyByDate: { ...(current.studyByDate || {}), [key]: (current.studyByDate?.[key] || 0) + minutes },
      activities: [{ id: Date.now(), text: `Added ${minutes} minutes study time`, date: new Date().toLocaleString() }, ...(current.activities || [])].slice(0, 15)
    }));
  }

  function toggleChapter(subject, chapter) {
    const id = `${subject}:${chapter}`;
    const nextValue = !data.chaptersDone?.[id];
    update((current) => ({
      ...current,
      chaptersDone: { ...(current.chaptersDone || {}), [id]: nextValue },
      activities: [{ id: Date.now(), text: `${nextValue ? 'Completed' : 'Unchecked'} chapter: ${chapter}`, date: new Date().toLocaleString() }, ...(current.activities || [])].slice(0, 15)
    }));
  }

  function toggleFlag(subject, chapter) {
    const id = `${subject}:${chapter}`;
    update((current) => ({ ...current, chaptersFlagged: { ...(current.chaptersFlagged || {}), [id]: !current.chaptersFlagged?.[id] } }));
  }

  function addTask() {
    const title = newTask.trim();
    if (!title) return;
    update((current) => ({ ...current, tasks: [{ id: Date.now(), title, done: false, date: todayKey() }, ...(current.tasks || [])] }));
    setNewTask('');
  }

  function toggleTask(id) {
    update((current) => ({
      ...current,
      tasks: (current.tasks || []).map((task) => task.id === id ? { ...task, done: !task.done } : task),
      activities: [{ id: Date.now(), text: 'Updated a pending task', date: new Date().toLocaleString() }, ...(current.activities || [])].slice(0, 15)
    }));
  }

  function deleteTask(id) {
    update((current) => ({ ...current, tasks: (current.tasks || []).filter((task) => task.id !== id) }));
  }

  function markPyqSolved(setId, count = 1) {
    const set = PYQ_SETS.find((item) => item.id === setId);
    update((current) => ({
      ...current,
      pyqSolved: { ...(current.pyqSolved || {}), [setId]: Math.min((current.pyqSolved?.[setId] || 0) + count, set?.questions || 999) },
      activities: [{ id: Date.now(), text: `Solved ${count} PYQ in ${set?.title || 'PYQ set'}`, date: new Date().toLocaleString() }, ...(current.activities || [])].slice(0, 15)
    }));
  }

  function toggleMaterial(id) {
    const material = MATERIALS.find((item) => item.id === id);
    update((current) => ({
      ...current,
      materialRead: { ...(current.materialRead || {}), [id]: !current.materialRead?.[id] },
      activities: [{ id: Date.now(), text: `${current.materialRead?.[id] ? 'Unread' : 'Read'} material: ${material?.title || id}`, date: new Date().toLocaleString() }, ...(current.activities || [])].slice(0, 15)
    }));
  }

  function saveTest() {
    const name = testScore.name.trim() || 'Chapter Test';
    const score = Number(testScore.score || 0);
    const total = Number(testScore.total || 0);
    if (!total) return alert('Enter total marks.');
    update((current) => ({
      ...current,
      tests: [{ id: Date.now(), name, score, total, date: new Date().toLocaleDateString() }, ...(current.tests || [])],
      activities: [{ id: Date.now(), text: `Added test score: ${score}/${total}`, date: new Date().toLocaleString() }, ...(current.activities || [])].slice(0, 15)
    }));
    setTestScore({ name: '', score: '', total: '' });
  }

  function saveProfile() {
    update((current) => ({ ...current, profile: { ...current.profile, ...profileDraft, email } }));
    setEditingProfile(false);
    addActivity('Profile details updated');
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
              return (
                <button key={item.id} onClick={() => setActive(item.id)} className={`navBtn ${data.active === item.id ? 'active' : ''}`}>
                  <Icon size={18} /> <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        ))}
        <div className="aiHelp">
          <Bot size={42} />
          <strong>Chat. Learn. Improve.</strong>
          <span>Real AI works if Gemini quota is available; otherwise a free fallback answer is shown.</span>
          <button onClick={() => setActive('ai')}>Open AI Tutor</button>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div className="welcome">Welcome back, {displayName} 👋</div>
          <div className="selectWrap">
            <select value={data.stream} onChange={(e) => update((current) => ({ ...current, stream: e.target.value }))}>
              <option>11th IIT JEE</option>
              <option>12th IIT JEE</option>
              <option>Dropper</option>
            </select>
            <ChevronDown size={16} />
          </div>
          <div className="searchWrap">
            <Search size={17} />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search chapters, PYQs, notes..." />
            <kbd>Ctrl</kbd><kbd>K</kbd>
            {searchResults.length > 0 && (
              <div className="searchResults">
                {searchResults.map((r, idx) => (
                  <button key={`${r.type}-${r.label}-${idx}`} onClick={() => setActive(r.page)}>
                    <span>{r.label}</span><small>{r.type}</small>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="themeToggle">
            <button className={data.theme === 'light' ? 'active' : ''} onClick={() => update((current) => ({ ...current, theme: 'light' }))}><Sun size={15} /> Light</button>
            <button className={data.theme === 'dark' ? 'active' : ''} onClick={() => update((current) => ({ ...current, theme: 'dark' }))}><Moon size={15} /> Dark</button>
          </div>
          <button className="planBtn"><Trophy size={16} /> Free Plan</button>
        </header>

        {data.active === 'dashboard' && <Dashboard
          data={data} progressValue={progressValue} doneCount={doneCount} totalChapters={totalChapters} todayMinutes={todayMinutes}
          pyqSolved={pyqSolved} avgMinutes={avgMinutes} addStudyMinutes={addStudyMinutes} toggleChapter={toggleChapter} toggleFlag={toggleFlag}
          addTask={addTask} newTask={newTask} setNewTask={setNewTask} toggleTask={toggleTask} deleteTask={deleteTask}
          setActive={setActive} updateProfileFields={updateProfileFields} query={query}
        />}
        {data.active === 'pyq' && <PyqPage data={data} selectedPyq={selectedPyq} setSelectedPyq={setSelectedPyq} markPyqSolved={markPyqSolved} query={query} />}
        {data.active === 'material' && <MaterialPage data={data} toggleMaterial={toggleMaterial} query={query} />}
        {data.active === 'tests' && <TestsPage data={data} testScore={testScore} setTestScore={setTestScore} saveTest={saveTest} />}
        {data.active === 'ai' && <AiPage data={data} localStudyFallback={localStudyFallback} />}
        {data.active === 'profile' && <ProfilePage
          data={data} profileDraft={profileDraft} setProfileDraft={setProfileDraft} editingProfile={editingProfile}
          setEditingProfile={setEditingProfile} saveProfile={saveProfile} signOut={signOut} resetLocalData={resetLocalData}
        />}
      </main>
    </div>
  );
}

function Dashboard({ data, progressValue, doneCount, totalChapters, todayMinutes, pyqSolved, avgMinutes, addStudyMinutes, toggleChapter, toggleFlag, addTask, newTask, setNewTask, toggleTask, deleteTask, setActive, updateProfileFields, query }) {
  const pending = (data.tasks || []).filter((t) => !t.done);
  const flaggedCount = Object.values(data.chaptersFlagged || {}).filter(Boolean).length;
  const [targetDraft, setTargetDraft] = useState({ targetExam: data.profile.targetExam || '', targetDate: data.profile.targetDate || '' });
  const left = daysLeft(data.profile.targetDate);
  const q = query.trim().toLowerCase();

  return (
    <section className="page">
      <div className="pageHead"><h1>Dashboard</h1><p>Real data only. Stats change only after you complete chapters, solve PYQs, and add study time.</p></div>
      <div className="heroCard compactHero">
        <div className="heroLeft">
          <span className="blueLabel">Your Learning Overview</span>
          <h2>{doneCount === 0 ? 'Start building momentum!' : 'Keep building momentum!'}</h2>
          <p>Today: <b>{formatDate(new Date())}</b> — This date updates automatically every day using your browser time.</p>
          <div className="statPills">
            <div><CalendarDays size={20} /><b>{data.profile.targetExam || 'Target exam not set'}</b><span>{data.profile.targetDate ? `${formatDate(data.profile.targetDate)}${left !== null ? ` • ${left >= 0 ? `${left} days left` : `${Math.abs(left)} days passed`}` : ''}` : 'Set the date in Profile'}</span></div>
            <div><Target size={20} /><b>{flaggedCount} flagged</b><span>Revise priority chapters</span></div>
            <div><Clock size={20} /><b>{minutesText(todayMinutes)} today</b><span>Study time</span></div>
          </div>
        </div>
        <div className="progressBlock">
          <div className="ring" style={{ '--p': `${progressValue * 3.6}deg` }}><strong>{percentText(progressValue)}</strong><span>Completed</span></div>
          <div className="subjectBars">
            {Object.entries(SYLLABUS).map(([subject, chapters]) => {
              const count = chapters.filter((chapter) => data.chaptersDone?.[`${subject}:${chapter}`]).length;
              const pct = percentNumber(count, chapters.length);
              return <div key={subject}><b>{subject}</b><div className="bar"><span style={{ width: `${pct}%` }} /></div><strong>{percentText(pct)}</strong><small>{count} / {chapters.length} chapters</small></div>;
            })}
          </div>
        </div>
      </div>

      <div className="grid3 tightGrid">
        <div className="card"><h3>Exam Target</h3><p className="muted">Set the target exam name and date manually.</p><input value={targetDraft.targetExam} onChange={(e) => setTargetDraft({ ...targetDraft, targetExam: e.target.value })} placeholder="JEE Advanced 2027" /><input value={targetDraft.targetDate} onChange={(e) => setTargetDraft({ ...targetDraft, targetDate: e.target.value })} type="date" /><button className="primary" onClick={() => updateProfileFields(targetDraft)}>Save target</button></div>
        <div className="card"><h3>Today's Study Time</h3><div className="bigNumber">{minutesText(todayMinutes)}</div><p>Total study time today</p><div className="btnRow"><button onClick={() => addStudyMinutes(15)}>+15m</button><button onClick={() => addStudyMinutes(30)}>+30m</button><button onClick={() => addStudyMinutes(60)}>+60m</button></div></div>
        <div className="card"><h3>Quick Stats</h3><div className="quickStat"><span>Chapters Completed</span><b>{doneCount} / {totalChapters}</b></div><div className="quickStat"><span>Progress</span><b>{percentText(progressValue)}</b></div><div className="quickStat"><span>PYQs Solved</span><b>{pyqSolved}</b></div><div className="quickStat"><span>Avg. Study Time / Day</span><b>{minutesText(avgMinutes)}</b></div></div>
      </div>

      <div className="grid2 syllabusGrid">
        <div className="card"><h3>Full Syllabus Tracker</h3><p className="muted">The full chapter list is available. Matching chapters will appear when you search.</p>{Object.entries(SYLLABUS).map(([subject, chapters]) => {
          const filtered = q ? chapters.filter((chapter) => `${subject} ${chapter}`.toLowerCase().includes(q)) : chapters;
          if (q && filtered.length === 0) return null;
          const done = chapters.filter((chapter) => data.chaptersDone?.[`${subject}:${chapter}`]).length;
          return <details key={subject} open={q ? true : subject === 'Physics'}><summary>{subject} <span>{done}/{chapters.length} • {percentText(percentNumber(done, chapters.length))}</span></summary><div className="chapterList">{filtered.map((chapter) => <div className="chapterRow" key={chapter}><button onClick={() => toggleChapter(subject, chapter)}>{data.chaptersDone?.[`${subject}:${chapter}`] ? <CheckCircle2 size={17} /> : <Circle size={17} />}</button><span>{chapter}</span><button onClick={() => toggleFlag(subject, chapter)} className={data.chaptersFlagged?.[`${subject}:${chapter}`] ? 'flagged' : ''}>★</button></div>)}</div></details>;
        })}</div>
        <div className="card"><h3>Pending Tasks</h3><div className="inlineForm"><input value={newTask} onChange={(e) => setNewTask(e.target.value)} placeholder="Add real task..." /><button onClick={addTask}><Plus size={17} /></button></div>{pending.length === 0 ? <p className="empty">No pending tasks yet.</p> : pending.slice(0, 6).map((task) => <div className="task" key={task.id}><button onClick={() => toggleTask(task.id)}><Circle size={17} /></button><span>{task.title}</span><small>{formatDate(task.date)}</small><button onClick={() => deleteTask(task.id)}><Trash2 size={15} /></button></div>)}<h3 className="mt">Quick Actions</h3><div className="quickActions"><button onClick={() => setActive('pyq')}><Pi /> <b>PYQ Practice</b><span>Practice past questions</span></button><button onClick={() => setActive('tests')}><CheckCircle2 /> <b>Test Series</b><span>Add manual scores</span></button><button onClick={() => setActive('ai')}><Bot /> <b>AI Tutor</b><span>Real AI / fallback</span></button><button onClick={() => setActive('material')}><BookOpen /> <b>Study Material</b><span>Mark notes as read</span></button></div><h3 className="mt">Recent Activity</h3>{(data.activities || []).length === 0 ? <p className="empty">No activity yet. Start marking chapters, PYQs or study time.</p> : data.activities.slice(0, 6).map((a) => <div className="activity" key={a.id}><CheckCircle2 size={16}/><span>{a.text}</span><small>{a.date}</small></div>)}</div>
      </div>
    </section>
  );
}

function PyqPage({ data, selectedPyq, setSelectedPyq, markPyqSolved, query }) {
  const q = query.trim().toLowerCase();
  const sets = q ? PYQ_SETS.filter((set) => `${set.title} ${set.subject}`.toLowerCase().includes(q)) : PYQ_SETS;
  const current = PYQ_SETS.find((set) => set.id === selectedPyq);
  return <section className="page"><div className="pageHead"><h1>PYQ Practice</h1><p>No fake count. The solved count increases only after you click “Mark 1 solved”.</p></div><div className="cards4">{sets.map((set) => <div className="card" key={set.id}><span className="badge">{set.subject}</span><h3>{set.title}</h3><p>{set.questions} questions planned</p><p>Difficulty: {set.difficulty}</p><button className="primary" onClick={() => setSelectedPyq(set.id)}>Open set</button><button onClick={() => markPyqSolved(set.id, 1)}>Mark 1 solved</button><small>Solved: {data.pyqSolved?.[set.id] || 0} / {set.questions}</small></div>)}</div>{current && <div className="card mt"><div className="between"><h2>{current.title}</h2><button onClick={() => setSelectedPyq(null)}><X size={18}/></button></div><p>Sample functional practice set. Real questions can be added in a future update.</p><div className="questionBox"><b>Q1.</b> This is a placeholder slot for real PYQ content. Solve it and then click the button below.</div><button className="primary" onClick={() => markPyqSolved(current.id, 1)}>I solved this question</button></div>}</section>;
}

function MaterialPage({ data, toggleMaterial, query }) {
  const q = query.trim().toLowerCase();
  const materials = q ? MATERIALS.filter((m) => `${m.title} ${m.subject} ${m.detail}`.toLowerCase().includes(q)) : MATERIALS;
  return <section className="page"><div className="pageHead"><h1>Study Material</h1><p>Read/Unread status is saved. Real PDFs/notes can be added later.</p></div><div className="cards4">{materials.map((m) => <div className="card" key={m.id}><span className="badge">{m.subject}</span><h3>{m.title}</h3><p>{m.detail}</p><button className={data.materialRead?.[m.id] ? 'successBtn' : 'primary'} onClick={() => toggleMaterial(m.id)}>{data.materialRead?.[m.id] ? 'Marked as read' : 'Mark as read'}</button></div>)}</div></section>;
}

function TestsPage({ data, testScore, setTestScore, saveTest }) {
  return <section className="page"><div className="pageHead"><h1>Test Series</h1><p>You can add scores manually. Timer and MCQ engine can be added later.</p></div><div className="grid2"><div className="card"><h3>Add test score</h3><input value={testScore.name} onChange={(e) => setTestScore({ ...testScore, name: e.target.value })} placeholder="Test name"/><input value={testScore.score} onChange={(e) => setTestScore({ ...testScore, score: e.target.value })} placeholder="Score" type="number"/><input value={testScore.total} onChange={(e) => setTestScore({ ...testScore, total: e.target.value })} placeholder="Total marks" type="number"/><button className="primary" onClick={saveTest}>Save test score</button></div><div className="card"><h3>Saved tests</h3>{(data.tests || []).length === 0 ? <p className="empty">No test scores added yet.</p> : data.tests.map((t) => <div className="quickStat" key={t.id}><span>{t.name}<small>{t.date}</small></span><b>{t.score}/{t.total}</b></div>)}</div></div></section>;
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
      if (result?.errors?.length) {
        setAnswer(localStudyFallback(text));
        setError('Backend AI call failed, so a local fallback answer is shown.');
      } else {
        setAnswer(aiText || localStudyFallback(text));
      }
    } catch (err) {
      setAnswer(localStudyFallback(text));
      setError('There may be a Gemini API quota/connection issue, so a local fallback answer is shown.');
    } finally { setLoading(false); }
  }

  function example(text) { setQuestion(text); setAnswer(''); setError(''); }

  return (
    <section className="page">
      <div className="pageHead"><h1>AI Tutor</h1><p>If Gemini quota is available, you will get a real AI answer. If quota is 0, the app shows a free fallback answer instead of a raw error.</p></div>
      <div className="card aiTutorPanel">
        <div className="aiTutorTop"><div className="aiAvatar"><Bot size={30} /></div><div><h2>Ask JEE Blueprint AI</h2><p>Ask Physics, Chemistry, Maths doubts, study plans, and revision strategy.</p></div></div>
        <div className="aiExamples"><button onClick={() => example('Explain Kirchhoff laws with one JEE level example')}>Explain Kirchhoff laws</button><button onClick={() => example('Give me a 7 day revision plan for Chemical Bonding')}>7 day revision plan</button><button onClick={() => example('How should I revise Integration for JEE Advanced?')}>Integration strategy</button></div>
        <textarea className="aiInput" value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Type your doubt in English, Hindi or Marathi..." rows={5} />
        <div className="aiActionRow"><button className="primary" onClick={askTutor} disabled={loading}>{loading ? 'AI thinking...' : 'Ask AI Tutor'} <Send size={17} /></button><small>Note: Free API quota depends on your Google project.</small></div>
        {error && <div className="aiError">{error}</div>}
        {answer && <div className="aiAnswer"><h3>Answer</h3><pre>{answer}</pre></div>}
      </div>
    </section>
  );
}

function ProfilePage({ data, profileDraft, setProfileDraft, editingProfile, setEditingProfile, saveProfile, signOut, resetLocalData }) {
  const fields = [
    ['fullName', 'Full Name', 'text'], ['mobile', 'Mobile No', 'text'], ['email', 'Email', 'text'], ['city', 'City / Village / Town', 'text'],
    ['className', 'Class', 'text'], ['board', 'Board / State Board', 'text'], ['targetExam', 'Target Exam Name', 'text'], ['targetDate', 'Target Exam Date', 'date'],
    ['language', 'Preferred Language', 'text'], ['studyGoal', 'Study Goal', 'text'], ['dailyStudyTime', 'Daily Study Time', 'text'], ['weakAreas', 'Weak Areas', 'text'], ['preferredContent', 'Preferred Content Type', 'text'],
  ];
  const left = daysLeft(data.profile.targetDate);
  return <section className="page"><div className="pageHead"><h1>Profile</h1><p>Update the student name, exam target, and date here. Sign out is available here.</p></div><div className="profileHero"><div className="avatar">👨‍🎓</div><div><h2>{data.profile.fullName || 'Student Profile'}</h2><p>{data.profile.email || 'Email not available'}</p><span className="badge">{data.profile.targetExam || 'Target not set'}</span></div><div className="targetSummary"><b>{data.profile.targetDate ? formatDate(data.profile.targetDate) : 'Date not set'}</b><span>{left === null ? 'Set target date' : left >= 0 ? `${left} days left` : `${Math.abs(left)} days passed`}</span></div></div><div className="profileGrid"><div className="card wide"><div className="between"><h3>Profile Details</h3>{editingProfile ? <button onClick={saveProfile}><Save size={16}/> Save</button> : <button onClick={() => { setProfileDraft(data.profile); setEditingProfile(true); }}><PenLine size={16}/> Edit</button>}</div><div className="detailsGrid">{fields.map(([key, label, type]) => <label key={key}><span>{label}</span>{editingProfile && key !== 'email' ? <input value={profileDraft[key] || ''} onChange={(e) => setProfileDraft({ ...profileDraft, [key]: e.target.value })} placeholder={`Enter ${label}`} type={type} /> : <b>{key === 'targetDate' && data.profile[key] ? formatDate(data.profile[key]) : data.profile[key] || '-'}</b>}</label>)}</div></div><div className="card actions"><h3>Account Actions</h3><button className="primary" onClick={() => { setProfileDraft(data.profile); setEditingProfile(true); }}><PenLine size={16}/> Edit Profile</button>{editingProfile && <button onClick={saveProfile}><Save size={16}/> Save Changes</button>}<button className="danger" onClick={signOut}><LogOut size={16}/> Sign out</button><button onClick={resetLocalData}><RotateCcw size={16}/> Reset this browser data</button><div className="safeBox">🔒 Data is currently saved in this browser. Cloud sync can be added later.</div></div></div></section>;
}

export default function App() {
  return (
    <ThemeProvider theme={uiTheme}>
      <Authenticator>
        {({ signOut, user }) => <AppShell user={user} signOut={signOut} />}
      </Authenticator>
    </ThemeProvider>
  );
}
