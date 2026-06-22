import { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  Bot,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Crown,
  Edit3,
  Filter,
  Home,
  LogOut,
  Mail,
  Menu,
  Moon,
  Phone,
  Rocket,
  Save,
  Search,
  ShieldCheck,
  Sun,
  Target,
  UserRound,
  X,
} from "lucide-react";

const PROFILE_KEY = "jee-blueprint-profile-v7";
const THEME_KEY = "jee-blueprint-theme-v7";
const CLASS_KEY = "jee-blueprint-class-v7";
const ACTIVE_KEY = "jee-blueprint-active-page-v7";

const classOptions = ["11th IIT JEE", "12th IIT JEE", "Dropper"];

const defaultProfile = {
  name: "Ganesh Rabade",
  mobile: "7249712716",
  email: "rabadeganesh0@gmail.com",
  city: "Aurangabad",
  className: "12th IIT JEE",
  board: "MAHARASHTRA_STATE_BOARD",
  targetExam: "IIT-JEE",
  language: "English",
  goal: "Get into IIT – Computer Science",
  subjects: "Physics, Chemistry, Mathematics",
  contentType: "Video Lectures, Notes, PYQs",
  dailyStudyTime: "3–4 hours",
  weakAreas: "Organic Chemistry, 3D Geometry",
  bio: "Aspiring engineer with a focus on problem solving and concept clarity.",
};

const syllabus = {
  Physics: ["Units & Measurements", "Kinematics", "Laws of Motion", "Rotational Motion", "Current Electricity", "Optics", "Atoms & Nuclei"],
  Chemistry: ["Basic Concepts", "Atomic Structure", "Chemical Bonding", "Equilibrium", "Organic Chemistry", "Coordination Compounds"],
  Mathematics: ["Sets & Relations", "Quadratic Equations", "Matrices & Determinants", "Integration", "Vector Algebra", "3D Geometry"],
};

const pyqSets = [
  { title: "Current Electricity", subject: "Physics", questions: 25, difficulty: "Medium" },
  { title: "Chemical Bonding", subject: "Chemistry", questions: 30, difficulty: "High" },
  { title: "Matrices & Determinants", subject: "Mathematics", questions: 22, difficulty: "Medium" },
  { title: "Integration", subject: "Mathematics", questions: 35, difficulty: "High" },
  { title: "Rotational Motion", subject: "Physics", questions: 28, difficulty: "High" },
];

const studyMaterials = [
  { title: "Physics Formula Sheet", text: "Mechanics, Electrostatics, Optics and Modern Physics quick revision.", tag: "Free" },
  { title: "Chemistry Short Notes", text: "Organic named reactions, inorganic NCERT points and physical formulae.", tag: "Coming soon" },
  { title: "Maths Formula Bank", text: "Calculus, coordinate geometry, algebra, vectors and 3D formulas.", tag: "Coming soon" },
  { title: "High Weightage Checklist", text: "Priority chapters for faster revision and daily planning.", tag: "Free" },
];

const tests = [
  { title: "Chapter Test", text: "10-question quick tests for one chapter. Score tracking coming next.", tag: "Free" },
  { title: "Full Mock", text: "JEE Main style timed mock test with performance analysis.", tag: "Pro idea" },
  { title: "Weak Topic Test", text: "Generate tests from chapters marked for revision.", tag: "AI idea" },
];

function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? { ...fallback, ...JSON.parse(raw) } : fallback;
  } catch {
    return fallback;
  }
}

function firstName(profile, user) {
  const fromProfile = profile?.name?.trim()?.split(/\s+/)?.[0];
  if (fromProfile) return fromProfile;
  const login = user?.signInDetails?.loginId || user?.username || "Student";
  return login.split("@")[0] || "Student";
}

function classFromProfile(profile) {
  if (classOptions.includes(profile.className)) return profile.className;
  if (profile.className === "11") return "11th IIT JEE";
  if (profile.className === "12") return "12th IIT JEE";
  return "12th IIT JEE";
}

export default function JeeBlueprint({ user, signOut }) {
  const [profile, setProfile] = useState(() => {
    const p = loadJSON(PROFILE_KEY, defaultProfile);
    const userEmail = user?.signInDetails?.loginId || p.email;
    return { ...p, email: userEmail };
  });
  const [active, setActive] = useState(() => localStorage.getItem(ACTIVE_KEY) || "dashboard");
  const [theme, setTheme] = useState(() => localStorage.getItem(THEME_KEY) || "light");
  const [className, setClassName] = useState(() => localStorage.getItem(CLASS_KEY) || classFromProfile(profile));
  const [query, setQuery] = useState("");
  const [pageQuery, setPageQuery] = useState("");
  const [classOpen, setClassOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => { localStorage.setItem(ACTIVE_KEY, active); }, [active]);
  useEffect(() => { localStorage.setItem(THEME_KEY, theme); }, [theme]);
  useEffect(() => {
    localStorage.setItem(CLASS_KEY, className);
    setProfile((prev) => ({ ...prev, className }));
  }, [className]);
  useEffect(() => { localStorage.setItem(PROFILE_KEY, JSON.stringify(profile)); }, [profile]);

  const studentName = firstName(profile, user);
  const searchText = `${query} ${pageQuery}`.toLowerCase().trim();

  const nav = [
    { id: "dashboard", label: "Dashboard", icon: Home, group: "LEARN" },
    { id: "pyq", label: "PYQ Practice", icon: PiIcon, group: "LEARN" },
    { id: "material", label: "Study Material", icon: BookOpen, group: "LEARN" },
    { id: "tests", label: "Test Series", icon: CheckCircle2, group: "ASSESS" },
    { id: "ai", label: "AI Tutor", icon: Bot, group: "AI LEARNING" },
    { id: "profile", label: "Profile", icon: UserRound, group: "ACCOUNT" },
  ];

  const visiblePage = active;

  function choosePage(id) {
    setActive(id);
    setSidebarOpen(false);
    setPageQuery("");
  }

  function handleGlobalSearch(text) {
    setQuery(text);
    const t = text.toLowerCase();
    if (!t) return;
    if (pyqSets.some((x) => `${x.title} ${x.subject}`.toLowerCase().includes(t))) setActive("pyq");
    else if (studyMaterials.some((x) => `${x.title} ${x.text}`.toLowerCase().includes(t))) setActive("material");
    else if (tests.some((x) => `${x.title} ${x.text}`.toLowerCase().includes(t))) setActive("tests");
    else if (["ai", "doubt", "tutor", "planner"].some((w) => t.includes(w))) setActive("ai");
  }

  return (
    <div className={`app-shell ${theme === "dark" ? "dark" : "light"}`}>
      <style>{styles}</style>
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="logo-wrap">
          <img src="/logo.svg" alt="JEE Blueprint" className="logo-img" />
        </div>
        <nav className="side-nav">
          {renderNavGroup("LEARN", nav, active, choosePage)}
          {renderNavGroup("ASSESS", nav, active, choosePage)}
          {renderNavGroup("AI LEARNING", nav, active, choosePage)}
          {renderNavGroup("ACCOUNT", nav, active, choosePage)}
        </nav>
        <div className="ai-help-card">
          <div className="ai-help-icon"><Bot size={34} /></div>
          <strong>Chat. Learn. Improve.</strong>
          <p>AI Tutor will help with doubts, planning and weak-topic revision.</p>
          <button onClick={() => choosePage("ai")}>Open AI Tutor</button>
        </div>
      </aside>

      <div className="main-area">
        <header className="topbar">
          <button className="mobile-menu" onClick={() => setSidebarOpen(true)}><Menu size={20} /></button>
          <div className="welcome">Welcome back, {studentName} <span>👋</span></div>

          <div className="class-select">
            <button onClick={() => setClassOpen((v) => !v)}>{className}<ChevronDown size={16} /></button>
            {classOpen && (
              <div className="class-menu">
                {classOptions.map((opt) => (
                  <button key={opt} onClick={() => { setClassName(opt); setClassOpen(false); }}>
                    <span>{opt}</span>{className === opt && <CheckCircle2 size={16} />}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="global-search">
            <Search size={18} />
            <input value={query} onChange={(e) => handleGlobalSearch(e.target.value)} placeholder="Search chapters, PYQs, notes, and doubts..." />
            <kbd>Ctrl</kbd><kbd>K</kbd>
          </div>

          <div className="theme-toggle">
            <button className={theme === "light" ? "active" : ""} onClick={() => setTheme("light")}><Sun size={16} /> Light</button>
            <button className={theme === "dark" ? "active" : ""} onClick={() => setTheme("dark")}><Moon size={16} /> Dark</button>
          </div>
          <button className="plan-btn"><Crown size={16} /> Free Plan</button>
        </header>

        <main className="content">
          <PageHead active={visiblePage} pageQuery={pageQuery} setPageQuery={setPageQuery} />
          {visiblePage === "dashboard" && <DashboardPage profile={profile} searchText={searchText} choosePage={choosePage} />}
          {visiblePage === "pyq" && <PYQPage searchText={searchText} />}
          {visiblePage === "material" && <MaterialPage searchText={searchText} />}
          {visiblePage === "tests" && <TestsPage searchText={searchText} />}
          {visiblePage === "ai" && <AITutorPage />}
          {visiblePage === "profile" && <ProfilePage profile={profile} setProfile={setProfile} setEditOpen={setEditOpen} signOut={signOut} />}
        </main>
      </div>

      {sidebarOpen && <button className="overlay" onClick={() => setSidebarOpen(false)} aria-label="Close menu" />}
      {editOpen && <ProfileEditModal profile={profile} setProfile={setProfile} onClose={() => setEditOpen(false)} />}
    </div>
  );
}

function PiIcon({ size = 20 }) {
  return <span style={{ fontSize: Math.max(16, size - 2), fontWeight: 900, lineHeight: 1 }}>π</span>;
}

function renderNavGroup(group, nav, active, choosePage) {
  const items = nav.filter((n) => n.group === group);
  return (
    <div className="nav-group" key={group}>
      <p>{group}</p>
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <button key={item.id} className={active === item.id ? "nav-active" : ""} onClick={() => choosePage(item.id)}>
            <Icon size={20} /> <span>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function PageHead({ active, pageQuery, setPageQuery }) {
  const titles = {
    dashboard: ["Dashboard", "Stay focused, keep learning, and achieve your JEE goals."],
    pyq: ["PYQ Practice", "Chapter-wise JEE Main + Advanced PYQ sets with difficulty filters."],
    material: ["Study Material", "Formula sheets, revision checklists and chapter resources."],
    tests: ["Test Series", "Mock tests and chapter tests to track performance."],
    ai: ["AI Tutor", "Ask doubts, get study plans and revise weak areas."],
    profile: ["Profile", "View and manage your personal, academic and study preferences."],
  };
  const [title, subtitle] = titles[active] || titles.dashboard;
  return (
    <section className="page-head">
      <div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      {active !== "profile" && (
        <div className="page-search">
          <Search size={17} />
          <input value={pageQuery} onChange={(e) => setPageQuery(e.target.value)} placeholder="Search chapters & doubts..." />
        </div>
      )}
    </section>
  );
}

function DashboardPage({ profile, searchText, choosePage }) {
  const allChapters = Object.entries(syllabus).flatMap(([subject, chapters]) => chapters.map((chapter) => ({ subject, chapter })));
  const filteredChapters = searchText ? allChapters.filter((x) => `${x.subject} ${x.chapter}`.toLowerCase().includes(searchText)) : allChapters.slice(0, 7);

  return (
    <>
      <section className="hero-card">
        <div className="hero-left">
          <span>Your Learning Overview</span>
          <h2>Keep building momentum!</h2>
          <p>Small steps today, big results tomorrow.</p>
          <div className="metric-row">
            <Metric icon={CalendarDays} title="JEE Main 2026" sub="1 Feb 2026" />
            <Metric icon={Target} title="1 day streak" sub="Keep it going!" orange />
            <Metric icon={Clock3} title="3h 30m today" sub="Study time" />
          </div>
        </div>
        <div className="progress-side">
          <div className="donut"><strong>34%</strong><span>Completed</span></div>
          <div className="progress-bars">
            <Progress subject="Physics" percent={36} done="18 / 50 Chapters" color="#2563eb" />
            <Progress subject="Chemistry" percent={22} done="11 / 50 Chapters" color="#22c55e" />
            <Progress subject="Mathematics" percent={28} done="14 / 50 Chapters" color="#8b5cf6" />
          </div>
          <Rocket className="hero-rocket" size={88} />
        </div>
      </section>

      {searchText && (
        <section className="search-results">
          <h3>Search results</h3>
          <div className="result-list">
            {filteredChapters.length ? filteredChapters.map((x) => <div key={`${x.subject}-${x.chapter}`}><strong>{x.chapter}</strong><span>{x.subject}</span></div>) : <p>No matching chapter found.</p>}
          </div>
        </section>
      )}

      <section className="dash-grid">
        <div className="card study-time-card">
          <h3>Today's Study Time</h3>
          <div className="big-number"><Clock3 size={28} />3h 30m</div>
          <p>Total study time</p>
          <div className="bar-chart">{[22, 32, 18, 44, 26, 52, 64, 76, 50, 88].map((h, i) => <span key={i} style={{ height: `${h}%` }} />)}</div>
        </div>

        <div className="card tasks-card">
          <div className="card-title"><h3>Pending Tasks</h3><button>View All</button></div>
          {[
            ["Finish Rotational Motion notes", "Physics", "Today"],
            ["Solve Chemical Bonding PYQs", "Chemistry", "Today"],
            ["Attempt Mathematics Test", "Mathematics", "Tomorrow"],
            ["Revise Thermodynamics formulas", "Chemistry", "Tomorrow"],
          ].map(([task, tag, date]) => <Task key={task} task={task} tag={tag} date={date} />)}
        </div>

        <div className="card quick-stats">
          <h3>Quick Stats</h3>
          <Stat title="Chapters Completed" value="43 / 150" />
          <Stat title="PYQs Solved" value="264" />
          <Stat title="Avg. Study Time / Day" value={profile.dailyStudyTime || "3–4 hours"} />
        </div>
      </section>

      <section className="bottom-grid">
        <div className="card activity-card">
          <h3>Recent Activity</h3>
          <Activity icon="⚗" text="Solved 25 PYQs - Rotational Motion" tag="Completed" />
          <Activity icon="▶" text="Watched: Chemical Bonding - L2" tag="In Progress" blue />
          <Activity icon="π" text="Attempted Test: Motion in a Plane" tag="Completed" />
        </div>
        <div className="card quick-actions">
          <h3>Quick Actions</h3>
          <div className="action-grid">
            <Action label="PYQ Practice" text="Practice past years' questions" onClick={() => choosePage("pyq")} />
            <Action label="Test Series" text="Attempt full & chapter tests" onClick={() => choosePage("tests")} />
            <Action label="AI Tutor" text="Ask doubts & get instant help" onClick={() => choosePage("ai")} />
            <Action label="Study Material" text="Access notes & resources" onClick={() => choosePage("material")} />
          </div>
        </div>
      </section>
    </>
  );
}

function Metric({ icon: Icon, title, sub, orange }) {
  return <div className="metric"><Icon size={22} color={orange ? "#f97316" : "#2563eb"} /><div><strong>{title}</strong><span>{sub}</span></div></div>;
}
function Progress({ subject, percent, done, color }) {
  return <div className="progress-item"><div><strong>{subject}</strong><span>{done}</span></div><div className="progress-line"><i style={{ width: `${percent}%`, background: color }} /></div><b>{percent}%</b></div>;
}
function Task({ task, tag, date }) { return <div className="task"><span className="check-box" /><strong>{task}</strong><em>{tag}</em><small>{date}</small></div>; }
function Stat({ title, value }) { return <div className="stat-row"><span>{title}</span><strong>{value}</strong></div>; }
function Activity({ icon, text, tag, blue }) { return <div className="activity"><b>{icon}</b><span>{text}</span><em className={blue ? "blue" : "green"}>{tag}</em></div>; }
function Action({ label, text, onClick }) { return <button className="action-card" onClick={onClick}><strong>{label}</strong><span>{text}</span></button>; }

function PYQPage({ searchText }) {
  const list = useMemo(() => filterCards(pyqSets, searchText), [searchText]);
  return <CardGrid items={list.map((x) => ({ title: x.title, text: `${x.questions} questions planned · Difficulty: ${x.difficulty}`, tag: x.subject, button: "Open set" }))} empty="No matching PYQ set found." />;
}
function MaterialPage({ searchText }) {
  const list = useMemo(() => filterCards(studyMaterials, searchText), [searchText]);
  return <CardGrid items={list.map((x) => ({ ...x, button: "Open" }))} empty="No matching study material found." />;
}
function TestsPage({ searchText }) {
  const list = useMemo(() => filterCards(tests, searchText), [searchText]);
  return <CardGrid items={list.map((x) => ({ ...x, button: "Start" }))} empty="No matching test found." />;
}
function filterCards(items, searchText) {
  if (!searchText) return items;
  return items.filter((x) => Object.values(x).join(" ").toLowerCase().includes(searchText));
}
function CardGrid({ items, empty }) {
  if (!items.length) return <div className="empty-card">{empty}</div>;
  return <section className="cards-grid">{items.map((item) => <div className="item-card" key={item.title}><span>{item.tag}</span><h3>{item.title}</h3><p>{item.text}</p><button>{item.button}</button></div>)}</section>;
}

function AITutorPage() {
  const [q, setQ] = useState("");
  return (
    <section className="ai-page card">
      <div className="ai-bot-large"><Bot size={46} /></div>
      <div>
        <h2>AI Tutor Coming Soon</h2>
        <p>AI logo changed to a neutral tutor bot. API key frontend मध्ये ठेवायची नाही. Backend जोडल्यावर doubts, planner and weak-topic help चालू करता येईल.</p>
        <div className="ai-input-row"><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Type a sample doubt..." /><button disabled>Ask soon</button></div>
      </div>
    </section>
  );
}

function ProfilePage({ profile, setEditOpen, signOut }) {
  return (
    <>
      <section className="profile-hero card">
        <div className="avatar-wrap"><div className="avatar">{profile.name?.[0] || "S"}</div><button><Edit3 size={18} /></button></div>
        <div className="profile-main-info">
          <h2>{profile.name}</h2>
          <p><Mail size={18} /> {profile.email}</p>
          <p><Phone size={18} /> {profile.mobile}</p>
          <span className="plan-chip"><Crown size={16} /> Free Plan</span>
        </div>
        <div className="profile-rocket"><Rocket size={88} /><div><strong>Keep building your future</strong><p>Complete your profile to get personalized recommendations and a better learning experience.</p></div></div>
      </section>

      <section className="profile-grid">
        <ProfileInfoCard title="Personal Details" onEdit={() => setEditOpen(true)} rows={[
          ["Full Name", profile.name], ["Mobile No", profile.mobile], ["Email", profile.email], ["City / Village / Town", profile.city], ["About (Bio)", profile.bio],
        ]} />
        <ProfileInfoCard title="Academic Details" onEdit={() => setEditOpen(true)} rows={[
          ["Class", profile.className], ["Target Exam", profile.targetExam], ["Board / State Board", profile.board], ["Preferred Language", profile.language], ["Study Goal", profile.goal],
        ]} />
        <div className="card account-actions">
          <h3>Account Actions</h3>
          <button onClick={() => setEditOpen(true)}><Edit3 size={18} /> Edit Profile</button>
          <button className="primary"><Save size={18} /> Save Changes</button>
          <button className="danger" onClick={signOut}><LogOut size={18} /> Sign out</button>
          <div className="safe-box"><ShieldCheck size={22} /><strong>Your data is safe with us</strong><p>We never share your personal information with anyone.</p></div>
        </div>
        <ProfileInfoCard wide title="Study Preferences" onEdit={() => setEditOpen(true)} rows={[
          ["Preferred Subjects", profile.subjects], ["Preferred Content Type", profile.contentType], ["Daily Study Time", profile.dailyStudyTime], ["Weak Areas (Optional)", profile.weakAreas],
        ]} />
      </section>
    </>
  );
}
function ProfileInfoCard({ title, rows, onEdit, wide }) {
  return <div className={`card profile-info ${wide ? "wide" : ""}`}><div className="card-title"><h3>{title}</h3><button onClick={onEdit}><Edit3 size={16} /> Edit</button></div>{rows.map(([k, v]) => <div className="profile-row" key={k}><span>{k}</span><strong>{v || "—"}</strong></div>)}</div>;
}

function ProfileEditModal({ profile, setProfile, onClose }) {
  const [draft, setDraft] = useState(profile);
  const fields = [
    ["name", "Full Name"], ["mobile", "Mobile No"], ["email", "Email"], ["city", "City / Village / Town"],
    ["className", "Class"], ["board", "Board / State Board"], ["targetExam", "Target Exam"], ["language", "Preferred Language"],
    ["goal", "Study Goal"], ["dailyStudyTime", "Daily Study Time"], ["weakAreas", "Weak Areas"], ["bio", "About"],
  ];
  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <div className="modal-head"><h2>Edit Profile</h2><button onClick={onClose}><X size={20} /></button></div>
        <div className="form-grid">
          {fields.map(([key, label]) => key === "className" ? (
            <label key={key}>{label}<select value={draft[key]} onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}>{classOptions.map((x) => <option key={x}>{x}</option>)}</select></label>
          ) : (
            <label key={key}>{label}<input value={draft[key] || ""} onChange={(e) => setDraft({ ...draft, [key]: e.target.value })} /></label>
          ))}
        </div>
        <div className="modal-actions"><button onClick={onClose}>Cancel</button><button className="primary" onClick={() => { setProfile(draft); onClose(); }}>Save Profile</button></div>
      </div>
    </div>
  );
}

const styles = `
* { box-sizing: border-box; }
.app-shell { min-height: 100vh; display: grid; grid-template-columns: 290px 1fr; transition: background .2s, color .2s; }
.light { --bg:#f7faff; --panel:#ffffff; --panel2:#f8fbff; --text:#0f172a; --muted:#64748b; --line:#e5edf7; --blue:#2563eb; --blueSoft:#eff6ff; --shadow:0 12px 30px rgba(15,23,42,.06); --sidebar:#ffffff; --top:#ffffff; }
.dark { --bg:#07111f; --panel:#0b1626; --panel2:#101c2e; --text:#f8fafc; --muted:#97a6ba; --line:#1f2c40; --blue:#3b82f6; --blueSoft:#11233d; --shadow:0 18px 40px rgba(0,0,0,.25); --sidebar:#08111e; --top:#08111e; }
.app-shell { background: var(--bg); color: var(--text); }
.sidebar { position: sticky; top: 0; height: 100vh; background: var(--sidebar); border-right: 1px solid var(--line); padding: 22px 22px 18px; overflow-y: auto; }
.logo-wrap { padding-bottom: 22px; border-bottom: 1px solid var(--line); margin-bottom: 18px; }
.logo-img { width: 190px; height: auto; display: block; }
.nav-group { margin: 22px 0; }
.nav-group p { margin: 0 0 10px; color: var(--muted); font-size: 13px; font-weight: 800; letter-spacing: .12em; }
.nav-group button { width: 100%; height: 48px; border: 0; background: transparent; color: var(--text); display: flex; align-items: center; gap: 14px; padding: 0 16px; border-radius: 10px; font-weight: 800; font-size: 16px; cursor: pointer; }
.nav-group button:hover, .nav-group .nav-active { background: var(--blueSoft); color: var(--blue); }
.nav-group .nav-active { border-left: 4px solid var(--blue); }
.ai-help-card { margin-top: 26px; padding: 20px; border: 1px solid var(--line); border-radius: 18px; background: linear-gradient(145deg, var(--panel2), var(--panel)); text-align: center; }
.ai-help-icon { width: 74px; height: 74px; border-radius: 22px; display: grid; place-items: center; color: var(--blue); background: var(--blueSoft); margin: 0 auto 14px; }
.ai-help-card strong { display: block; margin-bottom: 8px; }
.ai-help-card p { color: var(--muted); font-size: 14px; line-height: 1.6; }
.ai-help-card button { width: 100%; height: 44px; border: 1px solid var(--blue); background: transparent; color: var(--blue); border-radius: 10px; font-weight: 800; cursor: pointer; }
.main-area { min-width: 0; }
.topbar { height: 96px; display: flex; align-items: center; gap: 18px; padding: 0 32px; background: var(--top); border-bottom: 1px solid var(--line); position: sticky; top: 0; z-index: 10; }
.welcome { font-size: 18px; font-weight: 900; min-width: 230px; }
.mobile-menu { display:none; }
.class-select { position: relative; }
.class-select > button { height: 52px; min-width: 170px; padding: 0 16px; border: 1px solid var(--line); background: var(--panel); color: var(--text); border-radius: 12px; display: flex; align-items: center; justify-content: space-between; gap: 12px; font-weight: 800; cursor: pointer; }
.class-menu { position: absolute; top: 60px; left: 0; width: 190px; background: var(--panel); border: 1px solid var(--line); border-radius: 12px; box-shadow: var(--shadow); overflow: hidden; z-index: 20; }
.class-menu button { width: 100%; height: 48px; border: 0; background: transparent; color: var(--text); display: flex; align-items: center; justify-content: space-between; padding: 0 14px; cursor: pointer; font-weight: 800; }
.class-menu button:hover { background: var(--blueSoft); color: var(--blue); }
.global-search, .page-search { height: 52px; display: flex; align-items: center; gap: 10px; border: 1px solid var(--line); background: var(--panel); color: var(--muted); border-radius: 12px; padding: 0 14px; }
.global-search { flex: 1; max-width: 560px; }
.global-search input, .page-search input, .ai-input-row input, .form-grid input, .form-grid select { width: 100%; border: 0; outline: 0; background: transparent; color: var(--text); font-size: 16px; }
kbd { border: 1px solid var(--line); padding: 3px 7px; border-radius: 6px; color: var(--muted); background: var(--panel2); font-size: 12px; }
.theme-toggle { display: flex; border: 1px solid var(--line); border-radius: 999px; padding: 4px; background: var(--panel); }
.theme-toggle button { height: 38px; padding: 0 13px; border: 0; border-radius: 999px; color: var(--text); background: transparent; display: flex; align-items: center; gap: 7px; font-weight: 800; cursor: pointer; }
.theme-toggle .active { background: var(--blueSoft); color: var(--blue); }
.plan-btn { height: 52px; border: 0; background: linear-gradient(135deg, #2563eb, #1d4ed8); color: white; border-radius: 18px; padding: 0 22px; font-weight: 900; font-size: 16px; display: flex; align-items: center; gap: 8px; }
.content { padding: 28px 32px 36px; max-width: 1500px; margin: 0 auto; }
.page-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 20px; margin-bottom: 24px; }
.page-head h1 { margin: 0 0 8px; font-size: 34px; letter-spacing: -.7px; }
.page-head p { margin: 0; color: var(--muted); font-size: 16px; }
.page-search { width: 380px; }
.card, .hero-card, .item-card, .empty-card { background: var(--panel); border: 1px solid var(--line); border-radius: 18px; box-shadow: var(--shadow); }
.hero-card { padding: 28px; display: grid; grid-template-columns: 1.1fr 1fr; gap: 28px; margin-bottom: 18px; background-image: linear-gradient(rgba(37,99,235,.035) 1px, transparent 1px), linear-gradient(90deg, rgba(37,99,235,.035) 1px, transparent 1px); background-size: 24px 24px; overflow: hidden; }
.hero-left span { color: var(--blue); font-weight: 900; }
.hero-left h2 { font-size: 28px; margin: 16px 0 8px; }
.hero-left p { color: var(--muted); }
.metric-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 28px; }
.metric { border: 1px solid var(--line); background: var(--panel); border-radius: 12px; padding: 14px; display: flex; gap: 12px; align-items: center; }
.metric strong, .metric span { display: block; } .metric span { color: var(--muted); font-size: 14px; margin-top: 4px; }
.progress-side { display: grid; grid-template-columns: 170px 1fr 90px; align-items: center; gap: 18px; }
.donut { width: 150px; height: 150px; border-radius: 999px; display: grid; place-items: center; text-align: center; border: 18px solid var(--blueSoft); box-shadow: inset 0 0 0 9px rgba(37,99,235,.08); }
.donut strong { display: block; font-size: 30px; } .donut span { color: var(--muted); font-weight: 800; font-size: 13px; }
.progress-item { display: grid; grid-template-columns: 90px 1fr 44px; gap: 12px; align-items: center; margin: 16px 0; }
.progress-item span { color: var(--muted); font-size: 12px; display:block; margin-top:4px; }
.progress-line { height: 7px; border-radius: 999px; background: var(--blueSoft); overflow: hidden; } .progress-line i { height:100%; display:block; border-radius:999px; }
.hero-rocket { color: var(--blue); filter: drop-shadow(0 12px 22px rgba(37,99,235,.3)); }
.dash-grid { display: grid; grid-template-columns: 1fr 1fr 1.1fr; gap: 18px; margin: 18px 0; }
.card { padding: 22px; } .card h3 { margin: 0 0 18px; font-size: 20px; }
.big-number { display: flex; align-items:center; gap: 12px; font-size: 30px; color: var(--blue); font-weight: 900; }
.study-time-card p { color: var(--muted); }
.bar-chart { height: 74px; display:flex; gap: 10px; align-items:end; margin-top:12px; } .bar-chart span { flex:1; background: linear-gradient(#3b82f6,#93c5fd); border-radius:8px 8px 0 0; }
.card-title { display:flex; align-items:center; justify-content:space-between; gap:12px; } .card-title button { border:0; background:transparent; color:var(--blue); font-weight:800; cursor:pointer; display:flex; align-items:center; gap:6px; }
.task { display:grid; grid-template-columns: 20px 1fr auto auto; gap:10px; align-items:center; padding:10px 0; border-bottom:1px solid var(--line); }
.check-box { width:18px;height:18px;border:1px solid var(--line); border-radius:5px; } .task em { font-style:normal; color:var(--blue); background:var(--blueSoft); padding:5px 9px; border-radius:999px; font-size:12px; } .task small { color:var(--muted); }
.stat-row { height: 50px; border:1px solid var(--line); border-radius:10px; margin:10px 0; display:flex; align-items:center; justify-content:space-between; padding:0 14px; } .stat-row span { color:var(--muted); } .stat-row strong { color:var(--blue); }
.bottom-grid { display:grid; grid-template-columns: 1fr 1fr; gap:18px; }
.activity { display:grid; grid-template-columns: 36px 1fr auto; gap:12px; align-items:center; padding:13px 0; border-bottom:1px solid var(--line); } .activity b { width:34px;height:34px;border-radius:999px;display:grid;place-items:center;background:var(--blueSoft); } .activity em { font-style:normal; padding:6px 12px;border-radius:999px;font-weight:800; } .green { background:#dcfce7;color:#15803d; } .blue { background:#dbeafe;color:#2563eb; }
.action-grid { display:grid; grid-template-columns: repeat(2,1fr); gap:12px; } .action-card { text-align:left; padding:16px; border:1px solid var(--line); border-radius:12px; background:var(--panel2); color:var(--text); cursor:pointer; } .action-card strong,.action-card span{display:block;} .action-card span{color:var(--muted); margin-top:6px;}
.search-results { margin: 18px 0; } .result-list { display:grid; grid-template-columns: repeat(auto-fit,minmax(220px,1fr)); gap:10px; } .result-list div { background:var(--panel); border:1px solid var(--line); border-radius:12px; padding:14px; } .result-list span { display:block; color:var(--muted); margin-top:5px; }
.cards-grid { display:grid; grid-template-columns: repeat(auto-fit,minmax(260px,1fr)); gap:18px; } .item-card { padding:22px; } .item-card span { float:right; color:var(--blue); background:var(--blueSoft); padding:7px 12px; border-radius:999px; font-size:12px; font-weight:800; } .item-card h3 { font-size:23px; margin:8px 0 14px; line-height:1.35; } .item-card p { color:var(--muted); line-height:1.7; min-height:60px; } .item-card button { width:100%; height:48px; border:0; border-radius:12px; background:var(--blue); color:white; font-weight:900; margin-top:10px; cursor:pointer; }
.empty-card { padding:28px; color:var(--muted); }
.ai-page { display:grid; grid-template-columns: 90px 1fr; gap:18px; align-items:center; } .ai-bot-large { width:76px;height:76px;border-radius:24px;display:grid;place-items:center;background:var(--blueSoft); color:var(--blue); } .ai-page p { color:var(--muted); line-height:1.7; } .ai-input-row { display:flex; gap:12px; } .ai-input-row input { height:52px; border:1px solid var(--line); border-radius:12px; padding:0 14px; background:var(--panel2); } .ai-input-row button { width:120px; border:0; border-radius:12px; background:var(--line); color:var(--muted); }
.profile-hero { display:grid; grid-template-columns: 170px 1fr 1.4fr; gap:24px; align-items:center; margin-bottom:18px; } .avatar-wrap { position:relative; } .avatar { width:150px;height:150px;border-radius:999px;background:linear-gradient(135deg,#facc15,#f97316);display:grid;place-items:center;font-size:58px;color:#fff;font-weight:900; } .avatar-wrap button { position:absolute;right:10px;bottom:10px;width:44px;height:44px;border:0;border-radius:999px;background:var(--blue);color:#fff;display:grid;place-items:center; }
.profile-main-info h2 { margin:0 0 14px; font-size:32px; } .profile-main-info p { display:flex;align-items:center;gap:10px;color:var(--muted); } .plan-chip { display:inline-flex;align-items:center;gap:8px;background:var(--blueSoft);color:var(--blue);padding:9px 13px;border-radius:8px;font-weight:900; }
.profile-rocket { display:flex; align-items:center; gap:26px; border-left:1px solid var(--line); padding-left:34px; color:var(--blue); } .profile-rocket p { color:var(--muted); line-height:1.7; }
.profile-grid { display:grid; grid-template-columns: 1fr 1fr .8fr; gap:18px; } .profile-info.wide { grid-column: span 2; } .profile-row { display:grid; grid-template-columns: 180px 1fr; padding:12px 0; border-bottom:1px solid var(--line); } .profile-row span { color:var(--muted); } .profile-row strong { font-weight:700; }
.account-actions button { width:100%;height:54px;border-radius:10px;border:1px solid var(--blue);color:var(--blue);background:transparent;margin-bottom:12px;font-weight:900;display:flex;align-items:center;justify-content:center;gap:10px; } .account-actions .primary { background:var(--blue); color:white; } .account-actions .danger { border-color:#ef4444;color:#dc2626;background:rgba(239,68,68,.08); }
.safe-box { margin-top:20px;padding:18px;border-radius:12px;background:var(--blueSoft);color:var(--blue); } .safe-box p { color:var(--muted); }
.modal-backdrop { position:fixed;inset:0;background:rgba(15,23,42,.55);z-index:50;display:grid;place-items:center;padding:20px; } .modal-card { width:min(900px,100%);max-height:90vh;overflow:auto;background:var(--panel);color:var(--text);border:1px solid var(--line);border-radius:20px;padding:24px;box-shadow:0 30px 90px rgba(0,0,0,.35); } .modal-head { display:flex;justify-content:space-between;align-items:center; } .modal-head button { border:0;background:var(--blueSoft);color:var(--blue);width:40px;height:40px;border-radius:999px; }
.form-grid { display:grid;grid-template-columns:repeat(2,1fr);gap:14px;margin:20px 0; } .form-grid label { font-weight:800;color:var(--muted); } .form-grid input,.form-grid select { margin-top:8px;height:46px;border:1px solid var(--line);border-radius:10px;padding:0 12px;background:var(--panel2); }
.modal-actions { display:flex;justify-content:flex-end;gap:12px; } .modal-actions button { height:46px;border-radius:10px;border:1px solid var(--line);background:transparent;color:var(--text);padding:0 18px;font-weight:900; } .modal-actions .primary { background:var(--blue);color:white;border-color:var(--blue); }
.overlay { display:none; }
@media (max-width: 1100px) { .app-shell { grid-template-columns: 1fr; } .sidebar { position: fixed; left:-310px; z-index:40; transition:left .2s; width:290px; } .sidebar.open { left:0; } .overlay { display:block;position:fixed;inset:0;background:rgba(0,0,0,.35);z-index:30;border:0; } .mobile-menu { display:grid;place-items:center;width:42px;height:42px;border:0;border-radius:10px;background:var(--blueSoft);color:var(--blue); } .topbar { flex-wrap:wrap;height:auto;padding:16px; } .welcome { min-width:0; } .global-search { order:5;max-width:none;width:100%;flex-basis:100%; } .content { padding:20px 16px; } .hero-card,.dash-grid,.bottom-grid,.profile-hero,.profile-grid { grid-template-columns:1fr; } .profile-info.wide { grid-column:auto; } .page-head { flex-direction:column; } .page-search { width:100%; } .progress-side { grid-template-columns:1fr; } .metric-row { grid-template-columns:1fr; } .theme-toggle { order:3; } .profile-rocket { border-left:0;padding-left:0; } }
@media (max-width: 650px) { .form-grid,.action-grid { grid-template-columns:1fr; } .task { grid-template-columns: 20px 1fr; } .task em,.task small { margin-left:30px; } .profile-row { grid-template-columns:1fr; gap:5px; } .hero-left h2 { font-size:24px; } .page-head h1 { font-size:28px; } .logo-img { width:160px; } }
`;
