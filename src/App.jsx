import { useMemo, useState } from 'react';
import { Authenticator, ThemeProvider, createTheme } from '@aws-amplify/ui-react';
import { generateClient } from 'aws-amplify/api';
import '@aws-amplify/ui-react/styles.css';
import {
  BookOpen, Bot, Calendar, CheckCircle2, ChevronDown, Circle, Clock, FileText,
  Home, LogOut, Moon, PenLine, Pi, Plus, Save, Search, Send, Sun, Target,
  Trash2, Trophy, UserRound, X
} from 'lucide-react';
import './style.css';

const uiTheme = createTheme({
  name: 'jee-blueprint-theme',
  tokens: {
    colors: {
      brand: {
        primary: {
          10: '#eef6ff',
          80: '#2563eb',
          90: '#1d4ed8',
          100: '#1e40af',
        },
      },
    },
    radii: {
      medium: { value: '14px' },
      large: { value: '22px' },
    },
  },
});

const todayKey = () => new Date().toISOString().slice(0, 10);

const CHAPTERS = {
  Physics: [
    'Units & Measurements', 'Mathematics in Physics', 'Motion in a Straight Line', 'Motion in a Plane',
    'Laws of Motion', 'Work, Energy & Power', 'System of Particles', 'Rotational Motion',
    'Gravitation', 'Mechanical Properties of Solids', 'Mechanical Properties of Fluids', 'Thermal Properties',
    'Thermodynamics', 'Kinetic Theory', 'Oscillations', 'Waves'
  ],
  Chemistry: [
    'Some Basic Concepts', 'Atomic Structure', 'Chemical Bonding', 'States of Matter',
    'Thermodynamics', 'Equilibrium', 'Redox Reactions', 'Hydrogen', 's-Block Elements',
    'p-Block Elements', 'Organic Chemistry Basics', 'Hydrocarbons', 'Solutions', 'Electrochemistry',
    'Chemical Kinetics', 'Coordination Compounds'
  ],
  Mathematics: [
    'Sets & Relations', 'Functions', 'Trigonometry', 'Quadratic Equations', 'Complex Numbers',
    'Sequences & Series', 'Binomial Theorem', 'Permutations & Combinations', 'Straight Lines',
    'Circle', 'Conic Sections', 'Limits', 'Continuity & Differentiability', 'Derivatives',
    'Integration', 'Matrices & Determinants'
  ]
};

const PYQ_SETS = [
  { id: 'current-electricity', title: 'Current Electricity', subject: 'Physics', questions: 25, difficulty: 'Medium' },
  { id: 'chemical-bonding', title: 'Chemical Bonding', subject: 'Chemistry', questions: 30, difficulty: 'High' },
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
    targetExam: 'IIT-JEE',
    language: '',
    studyGoal: '',
    dailyStudyTime: '',
    weakAreas: '',
    preferredContent: '',
  }
});

function makeStorageKey(user) {
  const email = user?.signInDetails?.loginId || user?.attributes?.email || user?.username || 'student';
  return `jee-blueprint-v8-real-${email}`;
}

function loadData(key, email) {
  try {
    const saved = JSON.parse(localStorage.getItem(key));
    if (saved) {
      return {
        ...defaultData(email),
        ...saved,
        profile: { ...defaultData(email).profile, ...(saved.profile || {}), email },
      };
    }
  } catch (_) {}
  return defaultData(email);
}

function getDisplayName(data, user) {
  const profileName = data.profile.fullName?.trim();
  if (profileName) return profileName.split(' ')[0];
  const email = user?.signInDetails?.loginId || data.profile.email || 'Student';
  return email.split('@')[0].split(/[._-]/)[0] || 'Student';
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

  function logActivity(text) {
    update((current) => ({
      ...current,
      activities: [{ text, date: new Date().toLocaleString(), id: Date.now() }, ...(current.activities || [])].slice(0, 10)
    }));
  }

  const allChapters = useMemo(() => Object.entries(CHAPTERS).flatMap(([subject, chapters]) => chapters.map((chapter) => ({ subject, chapter }))), []);
  const doneCount = Object.values(data.chaptersDone || {}).filter(Boolean).length;
  const totalChapters = allChapters.length;
  const progress = totalChapters ? Math.round((doneCount / totalChapters) * 100) : 0;
  const todayMinutes = data.studyByDate?.[todayKey()] || 0;
  const pyqSolved = Object.values(data.pyqSolved || {}).reduce((sum, value) => sum + Number(value || 0), 0);
  const displayName = getDisplayName(data, user);

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const pageHits = [
      ['dashboard', 'Dashboard'], ['pyq', 'PYQ Practice'], ['material', 'Study Material'],
      ['tests', 'Test Series'], ['ai', 'AI Tutor'], ['profile', 'Profile']
    ].filter(([, label]) => label.toLowerCase().includes(q)).map(([page, label]) => ({ type: 'Page', label, page }));
    const chapterHits = allChapters
      .filter((item) => `${item.subject} ${item.chapter}`.toLowerCase().includes(q))
      .slice(0, 8)
      .map((item) => ({ type: item.subject, label: item.chapter, page: 'dashboard', chapter: `${item.subject}-${item.chapter}` }));
    const materialHits = MATERIALS.filter((item) => `${item.title} ${item.subject}`.toLowerCase().includes(q))
      .map((item) => ({ type: 'Material', label: item.title, page: 'material' }));
    return [...pageHits, ...chapterHits, ...materialHits].slice(0, 10);
  }, [query, allChapters]);

  function setActive(active) {
    update({ ...data, active });
    setQuery('');
  }

  function addStudyMinutes(minutes) {
    const key = todayKey();
    update((current) => ({
      ...current,
      studyByDate: { ...(current.studyByDate || {}), [key]: (current.studyByDate?.[key] || 0) + minutes },
      activities: [{ id: Date.now(), text: `Added ${minutes} minutes study time`, date: new Date().toLocaleString() }, ...(current.activities || [])].slice(0, 10)
    }));
  }

  function toggleChapter(subject, chapter) {
    const id = `${subject}:${chapter}`;
    const nextValue = !data.chaptersDone?.[id];
    update((current) => ({
      ...current,
      chaptersDone: { ...(current.chaptersDone || {}), [id]: nextValue },
      activities: [{ id: Date.now(), text: `${nextValue ? 'Completed' : 'Unchecked'} chapter: ${chapter}`, date: new Date().toLocaleString() }, ...(current.activities || [])].slice(0, 10)
    }));
  }

  function toggleFlag(subject, chapter) {
    const id = `${subject}:${chapter}`;
    update((current) => ({
      ...current,
      chaptersFlagged: { ...(current.chaptersFlagged || {}), [id]: !current.chaptersFlagged?.[id] }
    }));
  }

  function addTask() {
    const title = newTask.trim();
    if (!title) return;
    update((current) => ({
      ...current,
      tasks: [{ id: Date.now(), title, done: false, subject: 'Custom', date: 'Today' }, ...(current.tasks || [])]
    }));
    setNewTask('');
  }

  function toggleTask(id) {
    update((current) => ({
      ...current,
      tasks: (current.tasks || []).map((task) => task.id === id ? { ...task, done: !task.done } : task),
      activities: [{ id: Date.now(), text: 'Updated a pending task', date: new Date().toLocaleString() }, ...(current.activities || [])].slice(0, 10)
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
      activities: [{ id: Date.now(), text: `Solved ${count} PYQ in ${set?.title || 'PYQ set'}`, date: new Date().toLocaleString() }, ...(current.activities || [])].slice(0, 10)
    }));
  }

  function toggleMaterial(id) {
    const material = MATERIALS.find((item) => item.id === id);
    update((current) => ({
      ...current,
      materialRead: { ...(current.materialRead || {}), [id]: !current.materialRead?.[id] },
      activities: [{ id: Date.now(), text: `${current.materialRead?.[id] ? 'Unread' : 'Read'} material: ${material?.title || id}`, date: new Date().toLocaleString() }, ...(current.activities || [])].slice(0, 10)
    }));
  }

  function saveTest() {
    const name = testScore.name.trim() || 'Chapter Test';
    const score = Number(testScore.score || 0);
    const total = Number(testScore.total || 0);
    if (!total) return alert('Total marks टाक.');
    update((current) => ({
      ...current,
      tests: [{ id: Date.now(), name, score, total, date: new Date().toLocaleDateString() }, ...(current.tests || [])],
      activities: [{ id: Date.now(), text: `Added test score: ${score}/${total}`, date: new Date().toLocaleString() }, ...(current.activities || [])].slice(0, 10)
    }));
    setTestScore({ name: '', score: '', total: '' });
  }

  function saveProfile() {
    update({ ...data, profile: { ...profileDraft, email } });
    setEditingProfile(false);
    logActivity('Profile details updated');
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
                  <Icon size={20} /> <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        ))}
        <div className="aiHelp">
          <Bot size={46} />
          <strong>Chat. Learn. Improve.</strong>
          <span>AI Tutor secure backend मधून चालेल.</span>
          <button onClick={() => setActive('ai')}>Open AI Tutor</button>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div className="welcome">Welcome back, {displayName} 👋</div>
          <div className="selectWrap">
            <select value={data.stream} onChange={(e) => update({ ...data, stream: e.target.value })}>
              <option>11th IIT JEE</option>
              <option>12th IIT JEE</option>
              <option>Dropper</option>
            </select>
            <ChevronDown size={16} />
          </div>
          <div className="searchWrap">
            <Search size={18} />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search chapters, PYQs, notes, and doubts..." />
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
            <button className={data.theme === 'light' ? 'active' : ''} onClick={() => update({ ...data, theme: 'light' })}><Sun size={16} /> Light</button>
            <button className={data.theme === 'dark' ? 'active' : ''} onClick={() => update({ ...data, theme: 'dark' })}><Moon size={16} /> Dark</button>
          </div>
          <button className="planBtn"><Trophy size={17} /> Free Plan</button>
        </header>

        {data.active === 'dashboard' && <Dashboard
          data={data} progress={progress} doneCount={doneCount} totalChapters={totalChapters} todayMinutes={todayMinutes}
          pyqSolved={pyqSolved} addStudyMinutes={addStudyMinutes} toggleChapter={toggleChapter} toggleFlag={toggleFlag}
          addTask={addTask} newTask={newTask} setNewTask={setNewTask} toggleTask={toggleTask} deleteTask={deleteTask}
          setActive={setActive}
        />}
        {data.active === 'pyq' && <PyqPage data={data} selectedPyq={selectedPyq} setSelectedPyq={setSelectedPyq} markPyqSolved={markPyqSolved} />}
        {data.active === 'material' && <MaterialPage data={data} toggleMaterial={toggleMaterial} />}
        {data.active === 'tests' && <TestsPage data={data} testScore={testScore} setTestScore={setTestScore} saveTest={saveTest} />}
        {data.active === 'ai' && <AiPage data={data} />}
        {data.active === 'profile' && <ProfilePage
          data={data} profileDraft={profileDraft} setProfileDraft={setProfileDraft} editingProfile={editingProfile}
          setEditingProfile={setEditingProfile} saveProfile={saveProfile} signOut={signOut}
        />}
      </main>
    </div>
  );
}

function Dashboard({ data, progress, doneCount, totalChapters, todayMinutes, pyqSolved, addStudyMinutes, toggleChapter, toggleFlag, addTask, newTask, setNewTask, toggleTask, deleteTask, setActive }) {
  const pending = (data.tasks || []).filter((t) => !t.done);
  const flaggedCount = Object.values(data.chaptersFlagged || {}).filter(Boolean).length;
  return (
    <section className="page">
      <div className="pageHead"><h1>Dashboard</h1><p>Real data only. Progress वाढवण्यासाठी chapters mark कर, PYQ solve कर, study time add कर.</p></div>
      <div className="heroCard">
        <div className="heroLeft">
          <span className="blueLabel">Your Learning Overview</span>
          <h2>{progress === 0 ? 'Start building momentum!' : 'Keep building momentum!'}</h2>
          <p>Small steps today, big results tomorrow.</p>
          <div className="statPills">
            <div><Calendar size={22} /><b>JEE Main 2026</b><span>Set target date in Profile</span></div>
            <div><Target size={22} /><b>{flaggedCount} flagged</b><span>Revise priority chapters</span></div>
            <div><Clock size={22} /><b>{Math.floor(todayMinutes / 60)}h {todayMinutes % 60}m today</b><span>Study time</span></div>
          </div>
        </div>
        <div className="progressBlock">
          <div className="ring" style={{ '--p': `${progress * 3.6}deg` }}><strong>{progress}%</strong><span>Completed</span></div>
          <div className="subjectBars">
            {Object.entries(CHAPTERS).map(([subject, chapters]) => {
              const count = chapters.filter((chapter) => data.chaptersDone?.[`${subject}:${chapter}`]).length;
              const pct = Math.round((count / chapters.length) * 100);
              return <div key={subject}><b>{subject}</b><div className="bar"><span style={{ width: `${pct}%` }} /></div><strong>{pct}%</strong><small>{count} / {chapters.length} chapters</small></div>;
            })}
          </div>
        </div>
      </div>
      <div className="grid3">
        <div className="card"><h3>Today's Study Time</h3><div className="bigNumber">{Math.floor(todayMinutes / 60)}h {todayMinutes % 60}m</div><p>Total study time today</p><div className="btnRow"><button onClick={() => addStudyMinutes(15)}>+15m</button><button onClick={() => addStudyMinutes(30)}>+30m</button><button onClick={() => addStudyMinutes(60)}>+60m</button></div></div>
        <div className="card"><h3>Pending Tasks</h3><div className="inlineForm"><input value={newTask} onChange={(e) => setNewTask(e.target.value)} placeholder="Add real task..." /><button onClick={addTask}><Plus size={17} /></button></div>{pending.length === 0 ? <p className="empty">No pending tasks yet.</p> : pending.slice(0, 4).map((task) => <div className="task" key={task.id}><button onClick={() => toggleTask(task.id)}><Circle size={18} /></button><span>{task.title}</span><button onClick={() => deleteTask(task.id)}><Trash2 size={16} /></button></div>)}</div>
        <div className="card"><h3>Quick Stats</h3><div className="quickStat"><span>Chapters Completed</span><b>{doneCount} / {totalChapters}</b></div><div className="quickStat"><span>PYQs Solved</span><b>{pyqSolved}</b></div><div className="quickStat"><span>Avg. Study Time / Day</span><b>{todayMinutes ? `${Math.round(todayMinutes / 60 * 10) / 10}h` : '0h'}</b></div></div>
      </div>
      <div className="grid2">
        <div className="card"><h3>Syllabus Tracker</h3><p className="muted">Chapter complete केल्यावरच progress वाढेल.</p>{Object.entries(CHAPTERS).map(([subject, chapters]) => <details key={subject} open={subject === 'Physics'}><summary>{subject}</summary>{chapters.slice(0, 6).map((chapter) => <div className="chapterRow" key={chapter}><button onClick={() => toggleChapter(subject, chapter)}>{data.chaptersDone?.[`${subject}:${chapter}`] ? <CheckCircle2 size={18} /> : <Circle size={18} />}</button><span>{chapter}</span><button onClick={() => toggleFlag(subject, chapter)} className={data.chaptersFlagged?.[`${subject}:${chapter}`] ? 'flagged' : ''}>★</button></div>)}</details>)}</div>
        <div className="card"><h3>Quick Actions</h3><div className="quickActions"><button onClick={() => setActive('pyq')}><Pi /> <b>PYQ Practice</b><span>Practice past years' questions</span></button><button onClick={() => setActive('tests')}><CheckCircle2 /> <b>Test Series</b><span>Add manual test scores</span></button><button onClick={() => setActive('ai')}><Bot /> <b>AI Tutor</b><span>Ask doubts & get instant help</span></button><button onClick={() => setActive('material')}><BookOpen /> <b>Study Material</b><span>Mark notes as read</span></button></div><h3 className="mt">Recent Activity</h3>{(data.activities || []).length === 0 ? <p className="empty">No activity yet. Start marking chapters, PYQs or study time.</p> : data.activities.slice(0, 5).map((a) => <div className="activity" key={a.id}><CheckCircle2 size={18}/><span>{a.text}</span><small>{a.date}</small></div>)}</div>
      </div>
    </section>
  );
}

function PyqPage({ data, selectedPyq, setSelectedPyq, markPyqSolved }) {
  const current = PYQ_SETS.find((set) => set.id === selectedPyq);
  return <section className="page"><div className="pageHead"><h1>PYQ Practice</h1><p>Fake count नाही. “Mark 1 solved” केल्यावरच solved count वाढेल.</p></div><div className="cards4">{PYQ_SETS.map((set) => <div className="card" key={set.id}><span className="badge">{set.subject}</span><h3>{set.title}</h3><p>{set.questions} questions planned</p><p>Difficulty: {set.difficulty}</p><button className="primary" onClick={() => setSelectedPyq(set.id)}>Open set</button><button onClick={() => markPyqSolved(set.id, 1)}>Mark 1 solved</button><small>Solved: {data.pyqSolved?.[set.id] || 0} / {set.questions}</small></div>)}</div>{current && <div className="card mt"><div className="between"><h2>{current.title}</h2><button onClick={() => setSelectedPyq(null)}><X size={18}/></button></div><p>Sample functional practice set. Real questions पुढच्या update मध्ये add करता येतील.</p><div className="questionBox"><b>Q1.</b> This is a placeholder slot for real PYQ content. Solve करून below button दाब.</div><button className="primary" onClick={() => markPyqSolved(current.id, 1)}>I solved this question</button></div>}</section>;
}

function MaterialPage({ data, toggleMaterial }) {
  return <section className="page"><div className="pageHead"><h1>Study Material</h1><p>Read/Unread status save होतं. Real PDFs/notes पुढे जोडू.</p></div><div className="cards4">{MATERIALS.map((m) => <div className="card" key={m.id}><span className="badge">{m.subject}</span><h3>{m.title}</h3><p>{m.detail}</p><button className={data.materialRead?.[m.id] ? 'successBtn' : 'primary'} onClick={() => toggleMaterial(m.id)}>{data.materialRead?.[m.id] ? 'Marked as read' : 'Mark as read'}</button></div>)}</div></section>;
}

function TestsPage({ data, testScore, setTestScore, saveTest }) {
  return <section className="page"><div className="pageHead"><h1>Test Series</h1><p>आता score manually add करता येतो. नंतर timer + MCQ engine add करू.</p></div><div className="grid2"><div className="card"><h3>Add test score</h3><input value={testScore.name} onChange={(e) => setTestScore({ ...testScore, name: e.target.value })} placeholder="Test name"/><input value={testScore.score} onChange={(e) => setTestScore({ ...testScore, score: e.target.value })} placeholder="Score" type="number"/><input value={testScore.total} onChange={(e) => setTestScore({ ...testScore, total: e.target.value })} placeholder="Total marks" type="number"/><button className="primary" onClick={saveTest}>Save test score</button></div><div className="card"><h3>Saved tests</h3>{(data.tests || []).length === 0 ? <p className="empty">No test scores added yet.</p> : data.tests.map((t) => <div className="quickStat" key={t.id}><span>{t.name}<small>{t.date}</small></span><b>{t.score}/{t.total}</b></div>)}</div></div></section>;
}

function AiPage({ data }) {
  const client = useMemo(() => generateClient(), []);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function askTutor() {
    const text = question.trim();
    if (!text) {
      setError('पहिले doubt/question लिही.');
      return;
    }

    setLoading(true);
    setError('');
    setAnswer('');

    try {
      const context = JSON.stringify({
        stream: data.stream,
        profile: {
          className: data.profile?.className,
          targetExam: data.profile?.targetExam,
          weakAreas: data.profile?.weakAreas,
          preferredContent: data.profile?.preferredContent,
        },
      });

      const result = await client.queries.askAi({ question: text, context });
      const aiText = result?.data || '';

      if (result?.errors?.length) {
        setError(result.errors[0]?.message || 'AI request failed.');
      } else {
        setAnswer(aiText);
      }
    } catch (err) {
      setError(err?.message || 'AI connection failed.');
    } finally {
      setLoading(false);
    }
  }

  function example(text) {
    setQuestion(text);
    setAnswer('');
    setError('');
  }

  return (
    <section className="page">
      <div className="pageHead">
        <h1>AI Tutor</h1>
        <p>Secure AWS backend मधून Gemini AI जोडले आहे. API key frontend/GitHub मध्ये नाही.</p>
      </div>

      <div className="card aiTutorPanel">
        <div className="aiTutorTop">
          <div className="aiAvatar"><Bot size={32} /></div>
          <div>
            <h2>Ask JEE Blueprint AI</h2>
            <p>Physics, Chemistry, Maths doubts, study plan, revision strategy विचार.</p>
          </div>
        </div>

        <div className="aiExamples">
          <button onClick={() => example('Explain Kirchhoff laws with one JEE level example')}>Kirchhoff laws explain कर</button>
          <button onClick={() => example('Give me a 7 day revision plan for Chemical Bonding')}>7 day revision plan</button>
          <button onClick={() => example('How should I revise Integration for JEE Advanced?')}>Integration strategy</button>
        </div>

        <textarea
          className="aiInput"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Type your doubt in English, Hindi or Marathi..."
          rows={5}
        />

        <div className="aiActionRow">
          <button className="primary" onClick={askTutor} disabled={loading}>
            {loading ? 'AI thinking...' : 'Ask AI Tutor'} <Send size={18} />
          </button>
          <small>Free users साठी नंतर daily limit add करू शकतो.</small>
        </div>

        {error && <div className="aiError">{error}</div>}
        {answer && (
          <div className="aiAnswer">
            <h3>Answer</h3>
            <pre>{answer}</pre>
          </div>
        )}
      </div>
    </section>
  );
}

function ProfilePage({ data, profileDraft, setProfileDraft, editingProfile, setEditingProfile, saveProfile, signOut }) {
  const fields = [
    ['fullName', 'Full Name'], ['mobile', 'Mobile No'], ['email', 'Email'], ['city', 'City / Village / Town'],
    ['className', 'Class'], ['board', 'Board / State Board'], ['targetExam', 'Target Exam'], ['language', 'Preferred Language'],
    ['studyGoal', 'Study Goal'], ['dailyStudyTime', 'Daily Study Time'], ['weakAreas', 'Weak Areas'], ['preferredContent', 'Preferred Content Type'],
  ];
  return <section className="page"><div className="pageHead"><h1>Profile</h1><p>प्रत्येक student स्वतः details add/edit करू शकतो. Sign out इथेच आहे.</p></div><div className="profileHero"><div className="avatar">👨‍🎓</div><div><h2>{data.profile.fullName || 'Student Profile'}</h2><p>{data.profile.email || 'Email not available'}</p><span className="badge">Free Plan</span></div><div className="rocketMini">🚀</div></div><div className="profileGrid"><div className="card wide"><div className="between"><h3>Profile Details</h3>{editingProfile ? <button onClick={saveProfile}><Save size={16}/> Save</button> : <button onClick={() => { setProfileDraft(data.profile); setEditingProfile(true); }}><PenLine size={16}/> Edit</button>}</div><div className="detailsGrid">{fields.map(([key, label]) => <label key={key}><span>{label}</span>{editingProfile && key !== 'email' ? <input value={profileDraft[key] || ''} onChange={(e) => setProfileDraft({ ...profileDraft, [key]: e.target.value })} placeholder={`Enter ${label}`} /> : <b>{data.profile[key] || '-'}</b>}</label>)}</div></div><div className="card actions"><h3>Account Actions</h3><button className="primary" onClick={() => setEditingProfile(true)}><PenLine size={16}/> Edit Profile</button>{editingProfile && <button onClick={saveProfile}><Save size={16}/> Save Changes</button>}<button className="danger" onClick={signOut}><LogOut size={16}/> Sign out</button><div className="safeBox">🔒 Your data is saved in this browser for now. Cloud sync नंतर add करू.</div></div></div></section>;
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
