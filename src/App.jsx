import { useEffect, useMemo, useState } from 'react';
import { Authenticator, ThemeProvider, createTheme, useAuthenticator } from '@aws-amplify/ui-react';
import { generateClient } from 'aws-amplify/api';
import { confirmResetPassword, confirmSignUp, deleteUser, getCurrentUser, resetPassword, signIn as amplifySignIn, signOut as amplifySignOut, signUp as amplifySignUp } from 'aws-amplify/auth';
import '@aws-amplify/ui-react/styles.css';
import {
  BookOpen, Bot, CalendarDays, Check, CheckCircle2, ChevronDown, Circle, Clock, FileText,
  Home, LogOut, Mail, MessageCircle, Moon, PenLine, Pi, Plus, Save, Search, Send, ShieldCheck, Sun, Target, Sparkles,
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

function slugify(value = '') {
  return String(value)
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'chapter';
}

function chapterDifficulty(subject, chapterTitle = '', topicCount = 0) {
  const title = chapterTitle.toLowerCase();
  if (topicCount >= 18) return 'High';
  if (subject === 'Mathematics' && /(integration|differential|vector|3d|complex|probability|conic)/.test(title)) return 'High';
  if (subject === 'Physics' && /(rotation|electrostatics|current|magnet|waves|thermo|modern)/.test(title)) return 'High';
  if (subject === 'Chemistry' && /(bonding|equilibrium|organic|coordination|electrochemistry|kinetics)/.test(title)) return 'High';
  if (topicCount <= 5) return 'Easy';
  return 'Medium';
}

function plannedQuestions(chapter) {
  const count = chapter?.topics?.length || 1;
  return Math.max(15, Math.min(60, count * 5));
}

function buildPyqSets(planner) {
  // Keep the exact chapter order from the lecture planner PDFs.
  // Do not alphabetically sort chapters, because students expect the same flow as the planner.
  return Object.entries(planner).flatMap(([subject, chapters]) =>
    chapters.map((chapter, chapterIndex) => ({
      id: `pyq-${subject.toLowerCase()}-${chapter.id || slugify(chapter.title)}`,
      title: chapter.title,
      subject,
      subSubject: chapter.subSubject || subject,
      topicCount: chapter.topics?.length || 0,
      questions: plannedQuestions(chapter),
      difficulty: chapterDifficulty(subject, chapter.title, chapter.topics?.length || 0),
      plannerOrder: chapterIndex + 1,
    }))
  );
}

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
      return { ...base, ...saved, active: 'dashboard', profile: { ...base.profile, ...(saved.profile || {}), email } };
    }
  } catch (_) {}
  return defaultData(email);
}


function profileToCloudPayload(profile = {}, stream = '') {
  return {
    fullName: profile.fullName || '',
    email: profile.email || '',
    mobile: profile.mobile || '',
    className: profile.className || '',
    classLevel: stream || '',
    city: profile.city || '',
    board: profile.board || '',
    preferredLanguage: profile.language || '',
    studyGoal: profile.studyGoal || '',
    dailyStudyTime: profile.dailyStudyTime || '',
    weakAreas: profile.weakAreas || '',
    preferredContent: profile.preferredContent || '',
    onboardingCompleted: true,
  };
}

function cloudProfileToLocal(remote = {}, currentProfile = {}, email = '') {
  return {
    ...currentProfile,
    fullName: remote.fullName || currentProfile.fullName || '',
    email: email || remote.email || currentProfile.email || '',
    mobile: remote.mobile || currentProfile.mobile || '',
    className: remote.className || currentProfile.className || '',
    city: remote.city || currentProfile.city || '',
    board: remote.board || currentProfile.board || '',
    language: remote.preferredLanguage || currentProfile.language || 'English',
    studyGoal: remote.studyGoal || currentProfile.studyGoal || '',
    dailyStudyTime: remote.dailyStudyTime || currentProfile.dailyStudyTime || '',
    weakAreas: remote.weakAreas || currentProfile.weakAreas || '',
    preferredContent: remote.preferredContent || currentProfile.preferredContent || '',
  };
}

function targetToCloudPayload(profile = {}) {
  const name = profile.targetExam || 'JEE Advanced 2027';
  return {
    targetName: name,
    targetDate: profile.targetDate || '',
    targetType: name.toLowerCase().includes('advanced') ? 'JEE Advanced' : name.toLowerCase().includes('main') ? 'JEE Main' : 'Custom',
    notes: 'Saved from Study Blueprint profile page',
    isActive: true,
  };
}

async function upsertCloudRecord(model, knownId, payload) {
  let id = knownId || null;
  if (!id) {
    const existing = await model.list({ limit: 1 });
    id = existing?.data?.[0]?.id || null;
  }
  const result = id ? await model.update({ id, ...payload }) : await model.create(payload);
  if (result?.errors?.length) throw new Error(result.errors[0]?.message || 'Cloud sync error');
  return result?.data || null;
}

const OWNED_CLOUD_MODELS = [
  'StudentProfile', 'UserPreferences', 'ExamTarget', 'TopicProgress', 'FlaggedTopic',
  'StudySession', 'TimerGoal', 'PyqProgress', 'Task', 'ActivityLog',
  'StudyMaterialProgress', 'TestAttempt', 'ContactMessage', 'DeleteDataRequest', 'AppFeedback'
];

async function deleteSignedInStudentCloudData(client) {
  for (const modelName of OWNED_CLOUD_MODELS) {
    const model = client?.models?.[modelName];
    if (!model?.list || !model?.delete) continue;
    let nextToken = undefined;
    do {
      const result = await model.list({ limit: 100, nextToken });
      if (result?.errors?.length) throw new Error(result.errors[0]?.message || `Could not list ${modelName}`);
      const records = result?.data || [];
      await Promise.all(records.map((record) => record?.id ? model.delete({ id: record.id }) : null));
      nextToken = result?.nextToken || undefined;
    } while (nextToken);
  }
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

function LandingPage({ onSignIn, onCreateAccount, onOpenLegal }) {
  const [contactStatus, setContactStatus] = useState('');
  const [landingContact, setLandingContact] = useState({ name: '', email: '', message: '' });
  const [landingSending, setLandingSending] = useState(false);
  const submitLandingContact = async (event) => {
    event.preventDefault();
    if (!landingContact.name.trim() || !landingContact.email.trim() || !landingContact.message.trim()) {
      setContactStatus('Please fill name, email and message.');
      return;
    }
    setLandingSending(true);
    setContactStatus('Sending your message...');
    try {
      const response = await fetch('https://formspree.io/f/mgojvzjn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          source: 'Landing page contact form',
          name: landingContact.name,
          email: landingContact.email,
          message: landingContact.message,
        }),
      });
      if (!response.ok) throw new Error('Formspree request failed');
      setContactStatus('Message sent successfully. We will reply soon.');
      setLandingContact({ name: '', email: '', message: '' });
    } catch (error) {
      setContactStatus('Message could not be sent right now. Please try again after some time.');
    } finally {
      setLandingSending(false);
    }
  };
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
        <img src="/study-blueprint-logo-new.png" alt="Study Blueprint" />
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
        <div><b>Smart</b><span>Learning Experience</span></div>
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

      <section className="landingContactSection" id="contact">
        <div className="landingContactCopy">
          <span className="landingBadge">Contact us</span>
          <h2>Want a custom study tracker for your class or coaching?</h2>
          <p>Send your requirement and we can customize Study Blueprint with your branding, syllabus, test flow and student dashboard.</p>
          <div className="contactTrustLine"><ShieldCheck size={18} /> No public personal phone number is shown on the website.</div>
        </div>
        <form className="landingContactForm" onSubmit={submitLandingContact}>
          <input value={landingContact.name} onChange={(e) => setLandingContact({ ...landingContact, name: e.target.value })} placeholder="Your name" />
          <input value={landingContact.email} onChange={(e) => setLandingContact({ ...landingContact, email: e.target.value })} placeholder="Email address" />
          <textarea value={landingContact.message} onChange={(e) => setLandingContact({ ...landingContact, message: e.target.value })} placeholder="Tell us what you need..." rows={4} />
          <button className="primary" type="submit" disabled={landingSending}><Send size={16} /> {landingSending ? 'Sending...' : 'Send message'}</button>
          {contactStatus && <small className="contactStatus">{contactStatus}</small>}
        </form>
      </section>

      <section className="landingCta">
        <h2>Build your preparation blueprint today.</h2>
        <p>Create an account and start tracking real progress instead of guessing.</p>
        <button onClick={onCreateAccount} className="primary bigCta">Get Started</button>
      </section>

      <footer className="landingFooterLegal">
        <span>© 2026 Study Blueprint. Created by Ganesh Rabade.</span>
        <div>
          <button onClick={() => onOpenLegal('privacy')}>Privacy Policy</button>
          <button onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}>Contact</button>
        </div>
      </footer>
    </main>
  );
}


const legalUpdatedDate = '23 June 2026';

function LegalContent({ type, inApp = false, onBack, onRequestDelete, onClearBrowserData }) {
  const pageTitle = type === 'deleteData' ? 'Delete My Data' : 'Privacy Policy';


  if (type === 'deleteData') {
    return (
      <section className={inApp ? 'page legalPage' : 'legalPublicPage'}>
        <div className="legalHeader">
          {onBack && <button className="outlineBtn" onClick={onBack}>← Back</button>}
          <span className="landingBadge">Privacy Control</span>
          <h1>{pageTitle}</h1>
          <p>Request deletion of your Study Blueprint data or clear data saved in this browser.</p>
        </div>
        <div className={inApp ? 'legalTwoCol' : 'legalOneCol'}>
          <article className="card legalCard">
            <h3>What can be deleted?</h3>
            <p>You can request deletion of basic profile and study-tracking data connected to your account, such as name, class, target exam, target date, topic progress, tasks, study time, PYQ progress and uploaded profile photo where applicable.</p>
            <p>Use the form below with the same email used for Study Blueprint so the request can be matched correctly.</p>
          </article>
          {inApp && (
            <article className="card legalCard">
              <h3>Clear this browser data</h3>
              <p>This removes local Study Blueprint data saved in this browser. It does not delete your login account from AWS Amplify/Auth.</p>
              {onClearBrowserData && <button className="danger" onClick={onClearBrowserData}><Trash2 size={16}/> Clear browser data</button>}
            </article>
          )}
        </div>
        <DeleteRequestForm onSubmitted={onRequestDelete} />
      </section>
    );
  }

  return (
    <section className={inApp ? 'page legalPage' : 'legalPublicPage'}>
      <div className="legalHeader">
        {onBack && <button className="outlineBtn" onClick={onBack}>← Back</button>}
        <span className="landingBadge">Privacy First</span>
        <h1>{pageTitle}</h1>
        <p>Last updated: {legalUpdatedDate}</p>
      </div>
      <div className="legalCardStack">
        <article className="card legalCard"><h3>What we collect</h3><p>Study Blueprint asks for only the basic details needed to personalize your dashboard: name, email, class, exam target, target date, preferred language, study goal, topic progress, PYQ progress, study timer activity and support messages.</p></article>
        <article className="card legalCard"><h3>What we never ask for</h3><p>Please do not share passwords, OTPs, payment card details, home address, private documents or any sensitive personal information inside the app or contact form.</p></article>
        <article className="card legalCard"><h3>How we use data</h3><p>Your details are used to show your study dashboard, save your profile, track your target date, record progress, answer support messages and improve the app experience.</p></article>
        <article className="card legalCard"><h3>Sharing and selling data</h3><p>We do not sell student personal information. For a customized coaching/class version, only the required study-progress data should be visible to the authorized class admin.</p></article>
        <article className="card legalCard"><h3>Your choices</h3><p>You can update your profile, clear browser data, or delete your signed-in account data from the Profile page. Contact support for corrections or help.</p></article>
      </div>
    </section>
  );
}

function DeleteRequestForm({ onSubmitted }) {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState('');
  const [sending, setSending] = useState(false);
  async function submit(event) {
    event.preventDefault();
    if (!form.name.trim() || !form.email.trim()) {
      setStatus('Please enter your name and email.');
      return;
    }
    setSending(true);
    setStatus('Sending deletion request...');
    try {
      const response = await fetch('https://formspree.io/f/mgojvzjn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ source: 'Delete My Data request', ...form }),
      });
      if (!response.ok) throw new Error('Request failed');
      setStatus('Deletion request sent. We will reply to your email.');
      setForm({ name: '', email: '', message: '' });
      onSubmitted?.();
    } catch (error) {
      setStatus('Request could not be sent right now. Please try again later.');
    } finally {
      setSending(false);
    }
  }
  return (
    <form className="card deleteRequestForm" onSubmit={submit}>
      <h3>Send a deletion request</h3>
      <p className="muted">Use the same email you used for Study Blueprint, so the request can be matched correctly.</p>
      <div className="grid2mini">
        <label>Name<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Your name" /></label>
        <label>Email<input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="your@email.com" /></label>
      </div>
      <label>Message<textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows={4} placeholder="Example: Please delete my Study Blueprint account/progress data." /></label>
      <button className="primary" type="submit" disabled={sending}><Send size={16}/> {sending ? 'Sending...' : 'Send request'}</button>
      {status && <div className="contactStatusBox">{status}</div>}
    </form>
  );
}

function LegalPublicPage({ type, onBack }) {
  return (
    <main className="landing legalPublicShell">
      <div className="legalPublicTop">
        <img src="/study-blueprint-logo-new.png" alt="Study Blueprint" />
        <button className="outlineBtn" onClick={onBack}>← Back to Study Blueprint</button>
      </div>
      <LegalContent type={type} />
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
  const cloudClient = useMemo(() => generateClient(), []);
  const [cloudRecordIds, setCloudRecordIds] = useState({ profileId: null, targetId: null });
  const [cloudSync, setCloudSync] = useState({ state: 'checking', message: 'Checking cloud profile sync...' });

  useEffect(() => {
    const timer = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadCloudProfile() {
      try {
        setCloudSync({ state: 'checking', message: 'Checking cloud profile sync...' });
        const [profileResult, targetResult] = await Promise.all([
          cloudClient.models.StudentProfile.list({ limit: 1 }),
          cloudClient.models.ExamTarget.list({ limit: 10 }),
        ]);
        if (cancelled) return;
        const remoteProfile = profileResult?.data?.[0] || null;
        const remoteTarget = (targetResult?.data || []).find((item) => item.isActive) || targetResult?.data?.[0] || null;
        setCloudRecordIds({ profileId: remoteProfile?.id || null, targetId: remoteTarget?.id || null });
        if (remoteProfile || remoteTarget) {
          setData((current) => {
            const mergedProfile = {
              ...(remoteProfile ? cloudProfileToLocal(remoteProfile, current.profile, email) : { ...current.profile, email }),
              ...(remoteTarget ? { targetExam: remoteTarget.targetName || current.profile.targetExam, targetDate: remoteTarget.targetDate || current.profile.targetDate } : {}),
              email,
            };
            const next = { ...current, profile: mergedProfile };
            localStorage.setItem(storageKey, JSON.stringify(next));
            setProfileDraft(mergedProfile);
            return next;
          });
          setCloudSync({ state: 'synced', message: 'Cloud profile loaded. Future profile saves will sync to database.' });
        } else {
          setCloudSync({ state: 'ready', message: 'Cloud database ready. Save your profile once to sync it.' });
        }
      } catch (error) {
        setCloudSync({ state: 'local', message: 'Cloud sync is not available yet. Local browser backup is active.' });
      }
    }
    loadCloudProfile();
    return () => { cancelled = true; };
  }, [cloudClient, email, storageKey]);

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
  const pyqSets = useMemo(() => buildPyqSets(planner), [planner]);
  const doneCount = allTopics.filter(({ topic }) => data.topicsDone?.[topic.id]).length;
  const totalTopics = allTopics.length;
  const progressValue = percentNumber(doneCount, totalTopics);
  const normalizedTimer = normalizeTimer(data.studyTimer);
  const liveTimerSeconds = getLiveTimerSeconds(normalizedTimer, nowTick);
  const manualTodayMinutes = Number(data.studyByDate?.[todayKey()] || 0);
  const todayMinutes = manualTodayMinutes + Math.floor(liveTimerSeconds / 60);
  const pyqSolved = pyqSets.reduce((sum, set) => sum + Number(data.pyqSolved?.[set.id] || 0), 0);
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
      ['tests', 'Test Series'], ['ai', 'AI Tutor'], ['contact', 'Contact Us'], ['privacy', 'Privacy Policy'], ['profile', 'Profile']
    ].filter(([, label]) => label.toLowerCase().includes(q)).map(([page, label]) => ({ type: 'Page', label, page }));
    const chapterHits = allChapters
      .filter(({ subject, chapter }) => `${subject} ${chapter.title} ${chapter.subSubject}`.toLowerCase().includes(q))
      .slice(0, 10)
      .map(({ subject, chapter }) => ({ type: `${subject} Chapter`, label: chapter.title, page: 'dashboard' }));
    const topicHits = allTopics
      .filter(({ subject, chapter, topic }) => `${subject} ${chapter.title} ${topic.title}`.toLowerCase().includes(q))
      .slice(0, 10)
      .map(({ subject, topic }) => ({ type: `${subject} Topic`, label: topic.title, page: 'dashboard' }));
    const pyqHits = pyqSets.filter((item) => `${item.title} ${item.subject} ${item.subSubject}`.toLowerCase().includes(q))
      .slice(0, 10)
      .map((item) => ({ type: `${item.subject} PYQ`, label: item.title, page: 'pyq' }));
    const materialHits = MATERIALS.filter((item) => `${item.title} ${item.subject}`.toLowerCase().includes(q))
      .map((item) => ({ type: 'Material', label: item.title, page: 'material' }));
    return [...pageHits, ...chapterHits, ...topicHits, ...pyqHits, ...materialHits].slice(0, 12);
  }, [query, allChapters, allTopics, pyqSets]);

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
    const set = pyqSets.find((item) => item.id === setId);
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

  async function saveProfile() {
    const nextProfile = { ...profileDraft, email };
    update((current) => ({ ...current, profile: { ...current.profile, ...nextProfile }, activities: pushActivity(current, 'Profile details updated') }));
    setEditingProfile(false);
    setCloudSync({ state: 'saving', message: 'Saving profile to cloud database...' });
    try {
      const savedProfile = await upsertCloudRecord(
        cloudClient.models.StudentProfile,
        cloudRecordIds.profileId,
        profileToCloudPayload(nextProfile, data.stream)
      );
      const savedTarget = await upsertCloudRecord(
        cloudClient.models.ExamTarget,
        cloudRecordIds.targetId,
        targetToCloudPayload(nextProfile)
      );
      setCloudRecordIds({ profileId: savedProfile?.id || cloudRecordIds.profileId, targetId: savedTarget?.id || cloudRecordIds.targetId });
      setCloudSync({ state: 'synced', message: 'Profile and exam target synced to cloud database.' });
    } catch (error) {
      setCloudSync({ state: 'local', message: 'Saved in this browser. Cloud sync failed or is still deploying.' });
    }
  }

  function resetLocalData() {
    const fresh = defaultData(email);
    localStorage.setItem(storageKey, JSON.stringify(fresh));
    setData(fresh);
    setProfileDraft(fresh.profile);
  }

  async function deleteAccountAndData() {
    setCloudSync({ state: 'saving', message: 'Deleting your cloud profile and study data...' });
    try {
      await deleteSignedInStudentCloudData(cloudClient);
      localStorage.removeItem(storageKey);
      await deleteUser();
      try { await signOut?.(); } catch (_) {}
      return true;
    } catch (error) {
      setCloudSync({ state: 'local', message: error?.message || 'Delete failed. Please try again after some time.' });
      throw error;
    }
  }

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

  return (
    <div className={`app ${data.theme === 'dark' ? 'dark' : 'light'}`}>
      <aside className="sidebar">
        <div className="brand brandFull">
          <img className="brandLogoFull" src="/study-blueprint-logo-new.png" alt="Study Blueprint - Plan Track Improve" />
        </div>
        {['LEARN', 'ASSESS', 'AI LEARNING', 'ACCOUNT', 'LEGAL'].map((group) => (
          <div className="navGroup" key={group}>
            <p>{group}</p>
            {nav.filter((item) => item.group === group).map((item) => {
              const Icon = item.icon;
              return <button key={item.id} onClick={() => setActive(item.id)} className={`navBtn ${data.active === item.id ? 'active' : ''}`}><Icon size={18} /> <span>{item.label}</span></button>;
            })}
          </div>
        ))}
        <div className="aiHelp comingSoonMini"><Bot size={42} /><strong>AI Tutor</strong><span>Coming soon. This feature is temporarily disabled while we improve reliability.</span><button onClick={() => setActive('ai')}>View Status</button></div>
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
        {data.active === 'pyq' && <PyqPage data={data} stream={data.stream} pyqSets={pyqSets} selectedPyq={selectedPyq} setSelectedPyq={setSelectedPyq} markPyqSolved={markPyqSolved} query={query} />}
        {data.active === 'material' && <MaterialPage data={data} toggleMaterial={toggleMaterial} query={query} />}
        {data.active === 'tests' && <TestsPage data={data} testScore={testScore} setTestScore={setTestScore} saveTest={saveTest} />}
        {data.active === 'ai' && <AiPage />}
        {data.active === 'contact' && <ContactPage data={data} />}
        {data.active === 'privacy' && <LegalContent type="privacy" inApp />}
        {data.active === 'profile' && <ProfilePage data={data} profileDraft={profileDraft} setProfileDraft={setProfileDraft} editingProfile={editingProfile} setEditingProfile={setEditingProfile} saveProfile={saveProfile} signOut={signOut} resetLocalData={resetLocalData} cloudSync={cloudSync} deleteAccountAndData={deleteAccountAndData} />}
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
  const firstFlagged = allPlannerTopics.find(({ topic }) => data.topicsFlagged?.[topic.id]);
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
          <div className="focusAlert">
            <Sparkles size={18} />
            <span>
              {firstFlagged
                ? <>Priority today: revise <b>{firstFlagged.topic.title}</b> from <b>{firstFlagged.chapter.title}</b>.</>
                : nextPending
                  ? <>Start with <b>{nextPending.topic.title}</b> from <b>{nextPending.chapter.title}</b>. Flag difficult topics for revision.</>
                  : <>Great work. All visible topics are complete. Add revision tasks or switch your class goal.</>}
            </span>
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
        <div className="card"><h3>Pending Tasks</h3><div className="inlineForm"><input value={newTask} onChange={(e) => setNewTask(e.target.value)} placeholder="Add real task..." /><button onClick={addTask}><Plus size={17} /></button></div>{pending.length === 0 ? <p className="empty">No pending tasks yet.</p> : pending.slice(0, 8).map((task) => <div className="task" key={task.id}><button onClick={() => toggleTask(task.id)}><Circle size={17} /></button><span>{task.title}</span><small>{formatDate(task.date)}</small><button onClick={() => deleteTask(task.id)}><Trash2 size={15} /></button></div>)}<h3 className="mt">Quick Actions</h3><div className="quickActions"><button onClick={() => setActive('pyq')}><Pi /> <b>PYQ Practice</b><span>Practice past questions</span></button><button onClick={() => setActive('tests')}><CheckCircle2 /> <b>Test Series</b><span>Add manual scores</span></button><button onClick={() => setActive('ai')}><Bot /> <b>AI Tutor</b><span>Coming soon</span></button><button onClick={() => setActive('material')}><BookOpen /> <b>Study Material</b><span>Mark notes as read</span></button></div><div className="between mt"><h3>Recent Activity</h3>{visibleActivities.length > 0 && <button className="smallDanger" onClick={clearActivities}>Clear all</button>}</div>{visibleActivities.length === 0 ? <p className="empty">No activity yet. Start marking topics, PYQs or study time.</p> : visibleActivities.slice(0, 8).map((a) => <div className="activity removable" key={a.id}><CheckCircle2 size={16}/><span>{a.text}</span><small>{a.date}</small><button onClick={() => deleteActivity(a.id)}><X size={15}/></button></div>)}</div>
      </div>
    </section>
  );
}

function PyqPage({ data, stream, pyqSets, selectedPyq, setSelectedPyq, markPyqSolved, query }) {
  const q = query.trim().toLowerCase();
  const sets = q ? pyqSets.filter((set) => `${set.title} ${set.subject} ${set.subSubject}`.toLowerCase().includes(q)) : pyqSets;
  const current = pyqSets.find((set) => set.id === selectedPyq);
  const subjectOrder = ['Physics', 'Chemistry', 'Mathematics'];
  const subjectCounts = subjectOrder.map((subject) => ({
    subject,
    count: pyqSets.filter((set) => set.subject === subject).length,
    visibleCount: sets.filter((set) => set.subject === subject).length,
    solved: pyqSets.filter((set) => set.subject === subject).reduce((sum, set) => sum + Number(data.pyqSolved?.[set.id] || 0), 0),
  }));
  const groupedSets = subjectOrder
    .map((subject) => ({ subject, sets: sets.filter((set) => set.subject === subject) }))
    .filter((group) => group.sets.length > 0);

  return <section className="page">
    <div className="pageHead">
      <h1>PYQ Practice</h1>
      <p>{stream} chapter-wise PYQ practice arranged subject-wise in the same order as your lecture planner. Solved count increases only after real practice.</p>
    </div>
    <div className="pyqSummaryStrip">
      <div><b>{sets.length}</b><span>{q ? 'matching chapter sets' : 'chapter-wise PYQ sets'}</span></div>
      {subjectCounts.map((item) => <div key={item.subject}><b>{q ? item.visibleCount : item.count}</b><span>{item.subject} chapters</span><small>{item.solved} solved</small></div>)}
    </div>

    <div className="pyqSubjectStack">
      {groupedSets.map((group) => <section className="pyqSubjectSection" key={group.subject}>
        <div className="subjectSectionHead">
          <div>
            <span className="subjectDot" style={{ background: SUBJECT_COLORS[group.subject] }} />
            <h2>{group.subject}</h2>
          </div>
          <small>{group.sets.length} chapters • planner order</small>
        </div>
        <div className="cards4 pyqChapterGrid">{group.sets.map((set) => {
          const solved = Number(data.pyqSolved?.[set.id] || 0);
          return <div className="card pyqChapterCard" key={set.id}>
            <div className="chapterTopLine"><span className="badge">{set.subject}</span><small>Chapter {set.plannerOrder}</small></div>
            <h3>{set.title}</h3>
            <p>{set.topicCount} planner topics linked</p>
            <p>{set.questions} PYQs planned • {set.difficulty}</p>
            <div className="smallProgress"><i style={{ width: `${Math.min(100, percentNumber(solved, set.questions))}%`, background: `linear-gradient(90deg, ${SUBJECT_COLORS[set.subject]}, #60a5fa)` }} /></div>
            <small>{solved} / {set.questions} solved</small>
            <button className="primary" onClick={() => setSelectedPyq(set.id)}>Open set</button>
          </div>;
        })}</div>
      </section>)}
      {groupedSets.length === 0 && <p className="empty">No PYQ chapter found for your search.</p>}
    </div>

    {current && <div className="card mt stickySetCard"><div><span className="badge">{current.subject}</span><h3>{current.title}</h3></div><p>Solved: {data.pyqSolved?.[current.id] || 0} / {current.questions}</p><div className="btnRow"><button onClick={() => markPyqSolved(current.id, 1)}>Mark 1 solved</button><button onClick={() => markPyqSolved(current.id, 5)}>+5 solved</button><button onClick={() => setSelectedPyq(null)}>Close</button></div></div>}
  </section>;
}

function MaterialPage({ data, toggleMaterial, query }) {
  const q = query.trim().toLowerCase();
  const items = q ? MATERIALS.filter((item) => `${item.title} ${item.subject} ${item.detail}`.toLowerCase().includes(q)) : MATERIALS;
  return <section className="page"><div className="pageHead"><h1>Study Material</h1><p>Mark materials as read only after you actually complete them.</p></div><div className="cards4">{items.map((m) => <div className="card" key={m.id}><span className="badge">{m.subject}</span><h3>{m.title}</h3><p>{m.detail}</p><button className={data.materialRead?.[m.id] ? 'successBtn' : 'primary'} onClick={() => toggleMaterial(m.id)}>{data.materialRead?.[m.id] ? 'Read ✓' : 'Mark as read'}</button></div>)}</div></section>;
}

function TestsPage({ data, testScore, setTestScore, saveTest }) {
  return <section className="page"><div className="pageHead"><h1>Test Series</h1><p>Add real test scores manually. No automatic fake score is shown.</p></div><div className="grid2"><div className="card"><h3>Add Test Score</h3><input placeholder="Test name" value={testScore.name} onChange={(e) => setTestScore({ ...testScore, name: e.target.value })} /><input placeholder="Score" value={testScore.score} onChange={(e) => setTestScore({ ...testScore, score: e.target.value })} /><input placeholder="Total marks" value={testScore.total} onChange={(e) => setTestScore({ ...testScore, total: e.target.value })} /><button className="primary" onClick={saveTest}>Save score</button></div><div className="card"><h3>Saved Tests</h3>{(data.tests || []).length === 0 ? <p className="empty">No test score added yet.</p> : data.tests.map((t) => <div className="quickStat" key={t.id}><span>{t.name}<small>{t.date}</small></span><b>{t.score}/{t.total}</b></div>)}</div></div></section>;
}

function AiPage() {
  return (
    <section className="page">
      <div className="pageHead">
        <h1>AI Tutor</h1>
        <p>This feature is temporarily disabled while we improve reliability.</p>
      </div>
      <div className="card aiTutorPanel comingSoonPanel">
        <div className="aiTutorTop">
          <div className="aiAvatar"><Bot size={30} /></div>
          <div>
            <span className="badge">Coming Soon</span>
            <h2>Study Blueprint AI Tutor is being upgraded</h2>
            <p>AI Tutor is currently turned off to avoid wrong responses, quota errors, and unstable experience for students.</p>
          </div>
        </div>
        <div className="comingSoonGrid">
          <div>
            <b>Current status</b>
            <span>Disabled for now</span>
          </div>
          <div>
            <b>Reason</b>
            <span>Reliability and quota issues</span>
          </div>
          <div>
            <b>Next plan</b>
            <span>We will bring it back after proper testing</span>
          </div>
        </div>
        <div className="safeBox">
          For now, continue using Topic Tracker, PYQ Practice, Study Material, Test Series, and Study Timer.
        </div>
      </div>
    </section>
  );
}

function ContactPage({ data }) {
  const [form, setForm] = useState({ name: data.profile?.fullName || '', email: data.profile?.email || '', reason: 'General enquiry', message: '' });
  const [status, setStatus] = useState('');
  const [sending, setSending] = useState(false);
  const [savedMessages, setSavedMessages] = useState(() => {
    try { return JSON.parse(localStorage.getItem('study-blueprint-contact-demo') || '[]'); } catch (_) { return []; }
  });

  async function submitContact(event) {
    event.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setStatus('Please fill name, email and message.');
      return;
    }
    setSending(true);
    setStatus('Sending your message...');
    try {
      const response = await fetch('https://formspree.io/f/mgojvzjn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          source: 'In-app Contact Us page',
          name: form.name,
          email: form.email,
          reason: form.reason,
          message: form.message,
        }),
      });
      if (!response.ok) throw new Error('Formspree request failed');
      const entry = { ...form, id: `${Date.now()}`, date: new Date().toLocaleString() };
      const next = [entry, ...savedMessages].slice(0, 8);
      localStorage.setItem('study-blueprint-contact-demo', JSON.stringify(next));
      setSavedMessages(next);
      setForm({ ...form, message: '' });
      setStatus('Message sent successfully. We will reply soon.');
    } catch (error) {
      setStatus('Message could not be sent right now. Please try again after some time.');
    } finally {
      setSending(false);
    }
  }

  return <section className="page contactPage">
    <div className="pageHead contactHeroHead">
      <div>
        <h1>Contact Us</h1>
        <p>For questions, feedback, coaching customization, bug reports, or collaboration requests.</p>
      </div>
      <div className="contactHeroBadge"><MessageCircle size={20} /> Student support ready</div>
    </div>

    <div className="contactLayout">
      <form className="card contactForm" onSubmit={submitContact}>
        <h3>Send a message</h3>
        <p className="mutedText">Send your question, feedback, bug report, or collaboration request. We will review it and reply as soon as possible.</p>
        <div className="formGrid2">
          <label>Name<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Your name" /></label>
          <label>Email<input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="your@email.com" /></label>
        </div>
        <label>Reason<select value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })}>
          <option>General enquiry</option>
          <option>Coaching/class custom website</option>
          <option>Bug report</option>
          <option>Feature request</option>
          <option>Content partnership</option>
        </select></label>
        <label>Message<textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Write your message here..." rows={6} /></label>
        <button className="primary" type="submit" disabled={sending}><Send size={17} /> {sending ? 'Sending...' : 'Submit message'}</button>
        {status && <div className="contactStatusBox">{status}</div>}
      </form>

      <aside className="contactSideStack">
        <div className="card contactInfoCard">
          <Mail size={24} />
          <h3>We are here to help</h3>
          <p>For support, feedback, partnership, or coaching-class customization, send a clear message with your email address.</p>
        </div>
        <div className="card contactInfoCard safe">
          <ShieldCheck size={24} />
          <h3>Safe contact only</h3>
          <p>Please do not share passwords, OTPs, API keys, payment details, or private student information in this form.</p>
        </div>
        <div className="card">
          <h3>Recent sent messages</h3>
          {savedMessages.length === 0 ? <p className="empty">No contact messages saved in this browser yet.</p> : savedMessages.map((msg) => <div className="contactMiniMsg" key={msg.id}><b>{msg.name}</b><span>{msg.reason}</span><small>{msg.date}</small></div>)}
        </div>
      </aside>
    </div>
  </section>;
}

function ProfilePage({ data, profileDraft, setProfileDraft, editingProfile, setEditingProfile, saveProfile, signOut, resetLocalData, cloudSync, deleteAccountAndData }) {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteStatus, setDeleteStatus] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);
  const fields = [
    ['fullName', 'Full Name', 'text', true], ['mobile', 'Mobile No', 'text', false], ['email', 'Email', 'text', true],
    ['className', 'Class', 'text', true], ['board', 'Board / State Board', 'text', false], ['language', 'Preferred Language', 'text', false],
    ['studyGoal', 'Study Goal', 'text', false], ['dailyStudyTime', 'Daily Study Time', 'text', false], ['weakAreas', 'Weak Areas', 'text', false],
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

  async function handleDeleteAccount() {
    if (deleteConfirmText.trim().toUpperCase() !== 'DELETE') {
      setDeleteStatus('Type DELETE to confirm.');
      return;
    }
    setDeletingAccount(true);
    setDeleteStatus('Deleting your cloud data and account...');
    try {
      await deleteAccountAndData?.();
      setDeleteStatus('Deleted. Opening Study Blueprint again...');
      setTimeout(() => window.location.assign('/'), 600);
    } catch (error) {
      setDeleteStatus(error?.message || 'Could not delete right now. Please try again after some time.');
      setDeletingAccount(false);
    }
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
          <div className="detailsGrid detailsGridV23">{fields.map(([key, label, type, required]) => <label key={key}><span>{label}{!required && <small className="optionalTag">Optional</small>}</span>{editingProfile && key !== 'email' ? <input value={profileDraft[key] || ''} onChange={(e) => setProfileDraft({ ...profileDraft, [key]: e.target.value })} placeholder={required ? `Enter ${label}` : `Optional ${label}`} type={type} /> : <b>{data.profile[key] || '-'}</b>}</label>)}</div>
        </div>
        <div className="profileSideStack">
          <div className="card actions actionsV23"><h3>Account Actions</h3><button className="primary" onClick={() => { setProfileDraft(data.profile); setEditingProfile(true); }}><PenLine size={16}/> Edit Profile</button>{editingProfile && <button onClick={saveProfile}><Save size={16}/> Save Changes</button>}<button onClick={resetLocalData}><RotateCcw size={16}/> Reset this browser data</button><button className="danger" onClick={() => setShowDeleteConfirm(true)}><Trash2 size={16}/> Delete My Data</button><button className="danger softDanger" onClick={() => setShowLogoutConfirm(true)}><LogOut size={16}/> Sign out</button></div>
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

      {showDeleteConfirm && (
        <div className="confirmOverlay" role="dialog" aria-modal="true">
          <div className="confirmBox deleteConfirmBox">
            <h3>Delete your data and account?</h3>
            <p>This will try to delete your Study Blueprint cloud records, clear this browser data, and delete your signed-in login account. This action cannot be undone.</p>
            <p className="muted">For safety, type <b>DELETE</b> below.</p>
            <input className="confirmInput" value={deleteConfirmText} onChange={(e) => setDeleteConfirmText(e.target.value)} placeholder="Type DELETE" disabled={deletingAccount} />
            {deleteStatus && <div className="contactStatusBox">{deleteStatus}</div>}
            <div className="confirmActions">
              <button onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(''); setDeleteStatus(''); }} disabled={deletingAccount}>Cancel</button>
              <button className="danger" onClick={handleDeleteAccount} disabled={deletingAccount}>{deletingAccount ? 'Deleting...' : 'Delete my data'}</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}



function AuthCard({ mode, setMode, onSignedIn }) {
  const [form, setForm] = useState({ email: '', password: '', confirmPassword: '', code: '', resetCode: '', newPassword: '' });
  const [step, setStep] = useState(mode === 'signUp' ? 'signUp' : 'signIn');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setStep(mode === 'signUp' ? 'signUp' : 'signIn');
    setStatus('');
  }, [mode]);

  function cleanEmail(value = form.email) {
    return String(value || '').trim().toLowerCase();
  }

  function updateField(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function refreshSignedInUser() {
    const currentUser = await getCurrentUser();
    onSignedIn?.(currentUser);
  }

  async function handleSignIn(event) {
    event.preventDefault();
    setStatus('');
    const email = cleanEmail();
    if (!email || !form.password) {
      setStatus('Please enter email and password.');
      return;
    }
    setLoading(true);
    try {
      const result = await amplifySignIn({ username: email, password: form.password });
      if (result?.nextStep?.signInStep === 'CONFIRM_SIGN_UP') {
        setStep('confirmSignUp');
        setStatus('Please enter the confirmation code sent to your email.');
        return;
      }
      await refreshSignedInUser();
    } catch (error) {
      const message = String(error?.message || 'Sign in failed. Please check your email and password.');
      setStatus(message.includes('already a signed in user') ? 'You are already signed in. Opening dashboard...' : message);
      if (message.includes('already a signed in user')) await refreshSignedInUser();
    } finally {
      setLoading(false);
    }
  }

  async function handleSignUp(event) {
    event.preventDefault();
    setStatus('');
    const email = cleanEmail();
    if (!email || !form.password || !form.confirmPassword) {
      setStatus('Please fill email, password and confirm password.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setStatus('Password and confirm password do not match.');
      return;
    }
    setLoading(true);
    try {
      const result = await amplifySignUp({
        username: email,
        password: form.password,
        options: { userAttributes: { email } },
      });
      if (result?.nextStep?.signUpStep === 'CONFIRM_SIGN_UP') {
        setStep('confirmSignUp');
        setStatus('Account created. Enter the confirmation code sent to your email.');
      } else {
        await amplifySignIn({ username: email, password: form.password });
        await refreshSignedInUser();
      }
    } catch (error) {
      setStatus(error?.message || 'Could not create account right now.');
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirmSignUp(event) {
    event.preventDefault();
    setStatus('');
    const email = cleanEmail();
    if (!email || !form.code) {
      setStatus('Please enter email and confirmation code.');
      return;
    }
    setLoading(true);
    try {
      await confirmSignUp({ username: email, confirmationCode: form.code.trim() });
      await amplifySignIn({ username: email, password: form.password });
      await refreshSignedInUser();
    } catch (error) {
      setStatus(error?.message || 'Confirmation failed. Please check the code.');
    } finally {
      setLoading(false);
    }
  }

  async function handleResetStart(event) {
    event.preventDefault();
    setStatus('');
    const email = cleanEmail();
    if (!email) {
      setStatus('Enter your email first, then request reset code.');
      return;
    }
    setLoading(true);
    try {
      await resetPassword({ username: email });
      setStep('resetConfirm');
      setStatus('Reset code sent to your email.');
    } catch (error) {
      setStatus(error?.message || 'Could not send reset code right now.');
    } finally {
      setLoading(false);
    }
  }

  async function handleResetConfirm(event) {
    event.preventDefault();
    setStatus('');
    const email = cleanEmail();
    if (!email || !form.resetCode || !form.newPassword) {
      setStatus('Please enter email, reset code and new password.');
      return;
    }
    setLoading(true);
    try {
      await confirmResetPassword({ username: email, confirmationCode: form.resetCode.trim(), newPassword: form.newPassword });
      setMode('signIn');
      setStep('signIn');
      setStatus('Password updated. Sign in with your new password.');
    } catch (error) {
      setStatus(error?.message || 'Could not reset password. Please check the code.');
    } finally {
      setLoading(false);
    }
  }

  const isCreate = step === 'signUp' || step === 'confirmSignUp';
  const title = step === 'resetConfirm' ? 'Reset password' : isCreate ? 'Create your account' : 'Welcome back';
  const subtitle = step === 'resetConfirm' ? 'Enter the code sent to your email.' : isCreate ? 'Start tracking your study progress.' : 'Sign in to continue your dashboard.';

  return (
    <div className="customAuthBox">
      <div className="authModeTabs" role="tablist" aria-label="Authentication mode">
        <button type="button" className={mode === 'signIn' && step !== 'resetConfirm' ? 'active' : ''} onClick={() => setMode('signIn')}>Sign In</button>
        <button type="button" className={mode === 'signUp' ? 'active' : ''} onClick={() => setMode('signUp')}>Create Account</button>
      </div>
      <div className="authFormHeader authFormHeaderInside">
        <img src="/study-blueprint-icon-new.png" alt="Study Blueprint icon" />
        <div>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
      </div>

      {step === 'signIn' && (
        <form className="customAuthForm" onSubmit={handleSignIn}>
          <label>Email<input type="email" autoComplete="email" value={form.email} onChange={(e) => updateField('email', e.target.value)} placeholder="your@email.com" /></label>
          <label>Password<input type="password" autoComplete="current-password" value={form.password} onChange={(e) => updateField('password', e.target.value)} placeholder="Enter password" /></label>
          <button className="primary authSubmit" type="submit" disabled={loading}>{loading ? 'Signing in...' : 'Sign in'}</button>
          <button className="linkButton" type="button" onClick={handleResetStart} disabled={loading}>Forgot password?</button>
        </form>
      )}

      {step === 'signUp' && (
        <form className="customAuthForm" onSubmit={handleSignUp}>
          <label>Email<input type="email" autoComplete="email" value={form.email} onChange={(e) => updateField('email', e.target.value)} placeholder="your@email.com" /></label>
          <label>Password<input type="password" autoComplete="new-password" value={form.password} onChange={(e) => updateField('password', e.target.value)} placeholder="Create password" /></label>
          <label>Confirm Password<input type="password" autoComplete="new-password" value={form.confirmPassword} onChange={(e) => updateField('confirmPassword', e.target.value)} placeholder="Confirm password" /></label>
          <button className="primary authSubmit" type="submit" disabled={loading}>{loading ? 'Creating account...' : 'Create account'}</button>
        </form>
      )}

      {step === 'confirmSignUp' && (
        <form className="customAuthForm" onSubmit={handleConfirmSignUp}>
          <label>Email<input type="email" autoComplete="email" value={form.email} onChange={(e) => updateField('email', e.target.value)} placeholder="your@email.com" /></label>
          <label>Confirmation Code<input inputMode="numeric" value={form.code} onChange={(e) => updateField('code', e.target.value)} placeholder="Enter code" /></label>
          <button className="primary authSubmit" type="submit" disabled={loading}>{loading ? 'Confirming...' : 'Confirm and continue'}</button>
        </form>
      )}

      {step === 'resetConfirm' && (
        <form className="customAuthForm" onSubmit={handleResetConfirm}>
          <label>Email<input type="email" autoComplete="email" value={form.email} onChange={(e) => updateField('email', e.target.value)} placeholder="your@email.com" /></label>
          <label>Reset Code<input inputMode="numeric" value={form.resetCode} onChange={(e) => updateField('resetCode', e.target.value)} placeholder="Enter reset code" /></label>
          <label>New Password<input type="password" autoComplete="new-password" value={form.newPassword} onChange={(e) => updateField('newPassword', e.target.value)} placeholder="New password" /></label>
          <button className="primary authSubmit" type="submit" disabled={loading}>{loading ? 'Updating...' : 'Update password'}</button>
        </form>
      )}

      {status && <div className="authStatusBox">{status}</div>}
    </div>
  );
}


function StartupLoading() {
  return (
    <main className="startupLoading">
      <div className="startupCard">
        <img src="/study-blueprint-icon-new.png" alt="Study Blueprint" />
        <b>Opening Study Blueprint...</b>
        <span>Checking your saved login safely.</span>
      </div>
    </main>
  );
}

function AuthLayout({ authScreen, setAuthScreen, publicPage, setPublicPage }) {
  const { route, user, signOut } = useAuthenticator((context) => [context.route, context.user, context.signOut]);
  const [sessionUser, setSessionUser] = useState(null);
  const [sessionChecked, setSessionChecked] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function checkSavedLogin() {
      try {
        const currentUser = await getCurrentUser();
        if (!cancelled) setSessionUser(currentUser);
      } catch (_) {
        if (!cancelled) setSessionUser(null);
      } finally {
        if (!cancelled) setSessionChecked(true);
      }
    }
    checkSavedLogin();
    return () => { cancelled = true; };
  }, []);

  const activeUser = (route === 'authenticated' && user) ? user : sessionUser;

  async function safeSignOut() {
    try { signOut?.(); } catch (_) {}
    try { await amplifySignOut(); } catch (_) {}
    setSessionUser(null);
    setAuthScreen(null);
    setPublicPage(null);
  }

  if (activeUser) {
    return <AppShell user={activeUser} signOut={safeSignOut} />;
  }

  if (!sessionChecked && !authScreen && !publicPage) {
    return <StartupLoading />;
  }

  if (!authScreen) {
    if (publicPage) return <LegalPublicPage type={publicPage} onBack={() => setPublicPage(null)} />;
    return <LandingPage onSignIn={() => setAuthScreen('signIn')} onCreateAccount={() => setAuthScreen('signUp')} onOpenLegal={setPublicPage} />;
  }


  return (
    <div className="authShell authShellModern">
      <button className="backLanding" onClick={() => setAuthScreen(null)}>← Back to Study Blueprint</button>
      <div className="authPageGrid">
        <section className="authBrandPanel">
          <img className="authBrandLogo" src="/study-blueprint-logo-new.png" alt="Study Blueprint - Plan Track Improve" />
          <h1>Build your preparation blueprint.</h1>
          <p>Login to track topics, run a study timer, manage PYQs, and continue your JEE progress dashboard.</p>
          <div className="authFeatureList">
            <div><CheckCircle2 size={18} /><span>Topic-wise syllabus tracker</span></div>
            <div><Clock size={18} /><span>Real focus timer</span></div>
            <div><Target size={18} /><span>Exam target and progress dashboard</span></div>
          </div>
        </section>
        <section className="authFormPanel">
          <AuthCard mode={authScreen} setMode={setAuthScreen} onSignedIn={(nextUser) => { setSessionUser(nextUser); setAuthScreen(null); setPublicPage(null); }} />
        </section>
      </div>
    </div>
  );
}

export default function App() {
  const [authScreen, setAuthScreen] = useState(null);
  const [publicPage, setPublicPage] = useState(null);

  return (
    <ThemeProvider theme={uiTheme}>
      <Authenticator.Provider>
        <AuthLayout authScreen={authScreen} setAuthScreen={setAuthScreen} publicPage={publicPage} setPublicPage={setPublicPage} />
      </Authenticator.Provider>
    </ThemeProvider>
  );
}
