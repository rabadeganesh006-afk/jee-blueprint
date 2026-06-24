import { useMemo, useState } from 'react';
import {
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Circle,
  Clock,
  FileText,
  Home,
  LogOut,
  Pi,
  ShieldCheck,
  Star,
  Target,
  Trophy,
  UserRound,
} from 'lucide-react';
import { PLANNER } from './plannerData';
import './style.css';
import './demoPreview.css';

// Buyer preview switch.
// Keep this file isolated so the original Amplify authentication app in App.jsx can be restored later.
const DEMO_MODE = true;
const DEMO_STUDENT = {
  fullName: 'Aarav Patil',
  email: 'demo.student@studyblueprint.app',
  className: '12th IIT JEE',
  targetExam: 'JEE Advanced 2027',
  targetDate: '2027-05-23',
  city: 'Pune',
  dailyStudyTime: '5-6 hours',
};

const SUBJECT_PROGRESS = {
  Physics: 0.46,
  Chemistry: 0.52,
  Mathematics: 0.38,
};

const SUBJECT_COLORS = {
  Physics: '#3b82f6',
  Chemistry: '#10b981',
  Mathematics: '#a855f7',
};

const DEMO_TESTS = [
  { id: 'mock-1', name: 'JEE Main Full Mock 01', score: 142, total: 300, date: '10 Jun 2026' },
  { id: 'mock-2', name: 'JEE Main Full Mock 02', score: 168, total: 300, date: '17 Jun 2026' },
  { id: 'adv-p1', name: 'JEE Advanced Paper 1', score: 78, total: 180, date: '20 Jun 2026' },
  { id: 'adv-p2', name: 'JEE Advanced Paper 2', score: 86, total: 180, date: '21 Jun 2026' },
];

const DEMO_TASKS = [
  { id: 'task-1', title: 'Revise Rotational Motion formula sheet', date: 'Today', done: false, tag: 'Physics' },
  { id: 'task-2', title: 'Solve 30 PYQs from Ionic Equilibrium', date: 'Today', done: false, tag: 'Chemistry' },
  { id: 'task-3', title: 'Complete Definite Integration mixed practice', date: 'Tomorrow', done: false, tag: 'Mathematics' },
  { id: 'task-4', title: 'Analyze JEE Main Full Mock 02 mistakes', date: 'Done', done: true, tag: 'Mock Test' },
];

const DEMO_WEAK_CHAPTERS = [
  { subject: 'Physics', title: 'Rotational Motion', accuracy: 42, action: 'Revise torque, angular momentum and rolling motion.' },
  { subject: 'Chemistry', title: 'Ionic Equilibrium', accuracy: 48, action: 'Practice pH, buffer and solubility questions.' },
  { subject: 'Mathematics', title: 'Definite Integration', accuracy: 45, action: 'Revise properties and mixed JEE problems.' },
  { subject: 'Physics', title: 'Current Electricity', accuracy: 51, action: 'Attempt circuit and meter-bridge PYQs.' },
];

const DEMO_ACTIVITIES = [
  'Completed 18 planner topics this week',
  'Improved JEE Main mock score by 26 marks',
  'Flagged 4 weak chapters for revision',
  'Solved 115 PYQs in the last 7 days',
];

function percentText(value) {
  return `${Math.round(value)}%`;
}

function scorePercent(test) {
  return Math.round((test.score / test.total) * 100);
}

function flattenPlanner(planner) {
  return Object.entries(planner).flatMap(([subject, chapters]) =>
    chapters.flatMap((chapter) => chapter.topics.map((topic) => ({ subject, chapter, topic })))
  );
}

function getSubjectStats(planner) {
  return Object.entries(planner).map(([subject, chapters]) => {
    const topics = chapters.flatMap((chapter) => chapter.topics || []);
    const completed = Math.round(topics.length * (SUBJECT_PROGRESS[subject] || 0.4));
    return {
      subject,
      total: topics.length,
      completed,
      pct: topics.length ? (completed / topics.length) * 100 : 0,
      chapters: chapters.length,
      color: SUBJECT_COLORS[subject] || '#2563eb',
    };
  });
}

function DemoLogin({ onOpenDemo }) {
  return (
    <main className="demoLoginPage">
      <section className="demoAuthCard">
        <div className="demoAuthBrand">
          <img src="/study-blueprint-logo-new.png" alt="Study Blueprint" />
          <span className="demoModeNote"><ShieldCheck size={16} /> Demo mode enabled for buyer preview.</span>
        </div>

        <div className="demoHeroCopy">
          <span className="landingBadge">JEE Student Dashboard Preview</span>
          <h1>Try the Study Blueprint demo dashboard.</h1>
          <p>
            This preview opens directly without email or password so buyers can review the student experience quickly.
          </p>
        </div>

        <button className="primary demoViewButton" type="button" onClick={onOpenDemo}>
          View Demo Dashboard
        </button>

        <div className="demoAuthChecklist">
          <div><CheckCircle2 size={18} /><span>Register / Sign Up is hidden for buyer preview.</span></div>
          <div><CheckCircle2 size={18} /><span>No email or password required.</span></div>
          <div><CheckCircle2 size={18} /><span>Protected dashboard opens in demo mode.</span></div>
        </div>

        <p className="demoFutureAuthNote">
          Real authentication code is preserved separately in <b>App.jsx</b> and can be enabled again after the demo phase.
        </p>
      </section>
    </main>
  );
}

function DemoSidebar({ active, setActive, onExit }) {
  const nav = [
    { id: 'dashboard', label: 'Dashboard', group: 'LEARN', icon: Home },
    { id: 'syllabus', label: 'Syllabus Progress', group: 'LEARN', icon: BookOpen },
    { id: 'tests', label: 'Mock Tests', group: 'ASSESS', icon: Trophy },
    { id: 'weak', label: 'Weak Chapters', group: 'ANALYTICS', icon: Target },
    { id: 'tasks', label: 'Study Tasks', group: 'PLANNER', icon: CheckCircle2 },
    { id: 'analytics', label: 'Analytics', group: 'ANALYTICS', icon: FileText },
    { id: 'profile', label: 'Demo Profile', group: 'ACCOUNT', icon: UserRound },
  ];

  return (
    <aside className="sidebar">
      <div className="brand brandFull">
        <img className="brandLogoFull" src="/study-blueprint-logo-new.png" alt="Study Blueprint" />
      </div>
      {['LEARN', 'ASSESS', 'PLANNER', 'ANALYTICS', 'ACCOUNT'].map((group) => (
        <div className="navGroup" key={group}>
          <p>{group}</p>
          {nav.filter((item) => item.group === group).map((item) => {
            const Icon = item.icon;
            return (
              <button key={item.id} onClick={() => setActive(item.id)} className={`navBtn ${active === item.id ? 'active' : ''}`}>
                <Icon size={18} /> <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      ))}
      <div className="demoSideCard">
        <ShieldCheck size={28} />
        <strong>Buyer preview</strong>
        <span>No signup, no password, no protected-route block.</span>
        <button type="button" onClick={onExit}><LogOut size={15} /> Exit Demo</button>
      </div>
    </aside>
  );
}

function DemoTopbar({ student }) {
  return (
    <header className="topbar demoTopbar">
      <div className="welcome">Welcome, {student.fullName.split(' ')[0]} 👋</div>
      <span className="demoModePill"><ShieldCheck size={15} /> Demo mode enabled for buyer preview.</span>
      <button className="planBtn"><Trophy size={16} /> Buyer Demo</button>
    </header>
  );
}

function OverviewPage({ subjectStats, totalTopics, completedTopics, pyqSolved, avgScore }) {
  const overallPct = totalTopics ? (completedTopics / totalTopics) * 100 : 0;
  return (
    <section className="page">
      <div className="pageHead">
        <h1>Dashboard</h1>
        <p>Demo student data showing JEE syllabus progress, mock scores, weak chapters, tasks and analytics.</p>
      </div>

      <div className="heroCard compactHero demoHeroDashboard">
        <div className="heroLeft">
          <span className="blueLabel">JEE Learning Overview</span>
          <h2>{percentText(overallPct)} syllabus completed</h2>
          <p>Target: <b>{DEMO_STUDENT.targetExam}</b> • Class: <b>{DEMO_STUDENT.className}</b></p>
          <div className="statPills interactivePills">
            <button><CheckCircle2 size={20} /><b>{completedTopics} / {totalTopics} topics</b><span>Syllabus progress</span></button>
            <button><Pi size={20} /><b>{pyqSolved} PYQs</b><span>Solved this month</span></button>
            <button><Trophy size={20} /><b>{avgScore}% avg score</b><span>Mock test analytics</span></button>
          </div>
          <div className="focusAlert">
            <Target size={18} />
            <span>Priority today: revise <b>Rotational Motion</b>, then solve PYQs from <b>Ionic Equilibrium</b>.</span>
          </div>
        </div>
        <div className="progressBlock polishedProgress">
          <div className="ring multiRing demoRing"><strong>{percentText(overallPct)}</strong><span>Completed</span></div>
          <div className="subjectBars">
            {subjectStats.map((stat) => (
              <div key={stat.subject} className="subjectBar">
                <b style={{ color: stat.color }}>{stat.subject}</b>
                <div className="bar"><span style={{ width: `${stat.pct}%`, background: stat.color }} /></div>
                <strong style={{ color: stat.color }}>{percentText(stat.pct)}</strong>
                <small>{stat.completed} / {stat.total} topics</small>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid3 tightGrid dashboardUtilityGrid">
        <div className="card">
          <h3><Clock size={18} /> Study Time</h3>
          <div className="quickStat"><span>Today</span><b>4h 20m</b></div>
          <div className="quickStat"><span>7-day average</span><b>3h 45m</b></div>
          <div className="quickStat"><span>Current streak</span><b>7 days</b></div>
        </div>
        <div className="card">
          <h3><Target size={18} /> Weak Chapters</h3>
          {DEMO_WEAK_CHAPTERS.slice(0, 3).map((item) => (
            <div className="weakMini" key={`${item.subject}-${item.title}`}>
              <b>{item.title}</b><span>{item.subject} • {item.accuracy}% accuracy</span>
            </div>
          ))}
        </div>
        <div className="card">
          <h3><CalendarDays size={18} /> Study Tasks</h3>
          {DEMO_TASKS.slice(0, 3).map((task) => (
            <div className="task demoTaskRow" key={task.id}>
              {task.done ? <CheckCircle2 size={17} /> : <Circle size={17} />}
              <span>{task.title}</span>
              <small>{task.date}</small>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SyllabusPage({ planner, subjectStats }) {
  return (
    <section className="page">
      <div className="pageHead"><h1>JEE Syllabus Progress</h1><p>Subject-wise demo progress using the uploaded JEE planner data.</p></div>
      <div className="grid2 syllabusGrid">
        <div className="card syllabusCard">
          <h3>Subject Progress</h3>
          {subjectStats.map((stat) => (
            <article className="demoSubjectProgress" key={stat.subject}>
              <div className="between"><b>{stat.subject}</b><span>{stat.chapters} chapters</span></div>
              <div className="smallProgress"><i style={{ width: `${stat.pct}%`, background: stat.color }} /></div>
              <small>{stat.completed} / {stat.total} topics complete • {percentText(stat.pct)}</small>
            </article>
          ))}
        </div>
        <div className="card syllabusCard">
          <h3>Sample Chapter Tracker</h3>
          {Object.entries(planner).map(([subject, chapters]) => (
            <details key={subject} className="subjectPanel" open={subject === 'Physics'}>
              <summary>{subject}<span>{chapters.length} chapters loaded</span></summary>
              <div className="chapterPanels">
                {chapters.slice(0, 4).map((chapter, index) => {
                  const done = Math.round((chapter.topics?.length || 0) * Math.max(0.25, (SUBJECT_PROGRESS[subject] || 0.4) - index * 0.04));
                  return (
                    <details key={chapter.id} className="chapterPanel">
                      <summary><div><b>{chapter.title}</b></div><span>{done}/{chapter.topics?.length || 0} • demo</span></summary>
                      <div className="topicList">
                        {(chapter.topics || []).slice(0, 6).map((topic, topicIndex) => (
                          <div className={topicIndex < 3 ? 'topicRow done' : 'topicRow'} key={topic.id}>
                            {topicIndex < 3 ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                            <div><b>{topic.title}</b></div>
                            {topicIndex === 4 && <Star size={15} className="demoStar" />}
                          </div>
                        ))}
                      </div>
                    </details>
                  );
                })}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function TestsPage({ avgScore }) {
  return (
    <section className="page">
      <div className="pageHead"><h1>Mock Test Scores</h1><p>Buyer preview of saved test attempts and score analytics.</p></div>
      <div className="grid2">
        <div className="card">
          <h3>Saved Mock Tests</h3>
          {DEMO_TESTS.map((test) => (
            <div className="quickStat demoScoreRow" key={test.id}>
              <span>{test.name}<small>{test.date}</small></span>
              <b>{test.score}/{test.total}<small>{scorePercent(test)}%</small></b>
            </div>
          ))}
        </div>
        <div className="card">
          <h3>Score Insights</h3>
          <div className="quickStat"><span>Average score</span><b>{avgScore}%</b></div>
          <div className="quickStat"><span>Best attempt</span><b>168/300</b></div>
          <div className="quickStat"><span>Improvement</span><b>+26 marks</b></div>
          <div className="safeBox">Demo analytics show how buyers will review a student's test trend without needing real authentication.</div>
        </div>
      </div>
    </section>
  );
}

function WeakChaptersPage() {
  return (
    <section className="page">
      <div className="pageHead"><h1>Weak Chapters</h1><p>Demo priority list generated from syllabus progress and mock-test performance.</p></div>
      <div className="cards4">
        {DEMO_WEAK_CHAPTERS.map((chapter) => (
          <article className="card demoWeakCard" key={`${chapter.subject}-${chapter.title}`}>
            <span className="badge">{chapter.subject}</span>
            <h3>{chapter.title}</h3>
            <p>{chapter.action}</p>
            <div className="smallProgress"><i style={{ width: `${chapter.accuracy}%`, background: SUBJECT_COLORS[chapter.subject] || '#2563eb' }} /></div>
            <small>{chapter.accuracy}% current accuracy • needs revision</small>
          </article>
        ))}
      </div>
    </section>
  );
}

function TasksPage() {
  return (
    <section className="page">
      <div className="pageHead"><h1>Study Tasks</h1><p>Demo task planner for daily JEE preparation.</p></div>
      <div className="grid2">
        <div className="card">
          <h3>Today&apos;s Tasks</h3>
          {DEMO_TASKS.map((task) => (
            <div className="task demoTaskRow" key={task.id}>
              {task.done ? <CheckCircle2 size={17} /> : <Circle size={17} />}
              <span>{task.title}</span>
              <small>{task.tag} • {task.date}</small>
            </div>
          ))}
        </div>
        <div className="card">
          <h3>Recent Activity</h3>
          {DEMO_ACTIVITIES.map((activity) => (
            <div className="activity" key={activity}><CheckCircle2 size={16} /><span>{activity}</span></div>
          ))}
        </div>
      </div>
    </section>
  );
}

function AnalyticsPage({ subjectStats, completedTopics, totalTopics, avgScore }) {
  return (
    <section className="page">
      <div className="pageHead"><h1>Analytics</h1><p>Demo analytics summary for buyer review.</p></div>
      <div className="grid3 tightGrid">
        <div className="card"><h3>Syllabus Completion</h3><strong className="demoBigMetric">{percentText((completedTopics / totalTopics) * 100)}</strong><p>{completedTopics} of {totalTopics} topics completed.</p></div>
        <div className="card"><h3>Mock Average</h3><strong className="demoBigMetric">{avgScore}%</strong><p>Average across JEE Main and Advanced mocks.</p></div>
        <div className="card"><h3>Revision Load</h3><strong className="demoBigMetric">4</strong><p>Weak chapters flagged for focused revision.</p></div>
      </div>
      <div className="card mt">
        <h3>Subject Analytics</h3>
        {subjectStats.map((stat) => (
          <div className="demoAnalyticsLine" key={stat.subject}>
            <b>{stat.subject}</b>
            <div className="smallProgress"><i style={{ width: `${stat.pct}%`, background: stat.color }} /></div>
            <span>{percentText(stat.pct)}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function ProfilePage() {
  return (
    <section className="page profilePageV23">
      <div className="pageHead"><h1>Demo Profile</h1><p>Sample student profile used only for buyer preview.</p></div>
      <div className="profileHero profileHeroV23">
        <div className="profileIdentityBlock">
          <div className="avatar profileAvatarFallback">👨‍🎓</div>
          <div className="profileIdentityText">
            <h2>{DEMO_STUDENT.fullName}</h2>
            <p>{DEMO_STUDENT.email}</p>
            <span className="badge">{DEMO_STUDENT.targetExam}</span>
          </div>
        </div>
        <div className="targetSummary targetSummaryV23">
          <span>Class</span>
          <b>{DEMO_STUDENT.className}</b>
          <small>{DEMO_STUDENT.city} • {DEMO_STUDENT.dailyStudyTime}</small>
        </div>
      </div>
      <div className="safeBox mt">This is static demo data. Real profile save, cloud sync and authentication remain available in the original App.jsx flow.</div>
    </section>
  );
}

function DemoDashboard({ onExit }) {
  const [active, setActive] = useState('dashboard');
  const planner = useMemo(() => PLANNER[DEMO_STUDENT.className] || PLANNER['12th IIT JEE'], []);
  const allTopics = useMemo(() => flattenPlanner(planner), [planner]);
  const subjectStats = useMemo(() => getSubjectStats(planner), [planner]);
  const totalTopics = allTopics.length;
  const completedTopics = subjectStats.reduce((sum, stat) => sum + stat.completed, 0);
  const avgScore = Math.round(DEMO_TESTS.reduce((sum, test) => sum + scorePercent(test), 0) / DEMO_TESTS.length);
  const pyqSolved = 115;

  return (
    <div className="app light demoAppShell">
      <DemoSidebar active={active} setActive={setActive} onExit={onExit} />
      <main className="main">
        <DemoTopbar student={DEMO_STUDENT} />
        {active === 'dashboard' && <OverviewPage subjectStats={subjectStats} totalTopics={totalTopics} completedTopics={completedTopics} pyqSolved={pyqSolved} avgScore={avgScore} />}
        {active === 'syllabus' && <SyllabusPage planner={planner} subjectStats={subjectStats} />}
        {active === 'tests' && <TestsPage avgScore={avgScore} />}
        {active === 'weak' && <WeakChaptersPage />}
        {active === 'tasks' && <TasksPage />}
        {active === 'analytics' && <AnalyticsPage subjectStats={subjectStats} totalTopics={totalTopics} completedTopics={completedTopics} avgScore={avgScore} />}
        {active === 'profile' && <ProfilePage />}
      </main>
    </div>
  );
}

export default function DemoApp() {
  const [demoOpen, setDemoOpen] = useState(() => DEMO_MODE && window.location.hash === '#demo-dashboard');

  function openDemoDashboard() {
    window.history.replaceState(null, '', '#demo-dashboard');
    setDemoOpen(true);
  }

  function exitDemoDashboard() {
    window.history.replaceState(null, '', window.location.pathname);
    setDemoOpen(false);
  }

  if (!DEMO_MODE) {
    return <DemoLogin onOpenDemo={openDemoDashboard} />;
  }

  return demoOpen ? <DemoDashboard onExit={exitDemoDashboard} /> : <DemoLogin onOpenDemo={openDemoDashboard} />;
}
