import React from "react";
import { createRoot } from "react-dom/client";
import { Amplify } from "aws-amplify";
import {
  Authenticator,
  ThemeProvider,
  createTheme,
  useAuthenticator,
} from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";
import outputs from "../amplify_outputs.json";
import JeeBlueprint from "./App.jsx";

Amplify.configure(outputs);

const theme = createTheme({
  name: "jee-blueprint-auth-theme",
  tokens: {
    colors: {
      brand: {
        primary: {
          10: { value: "#dbeafe" },
          20: { value: "#bfdbfe" },
          40: { value: "#60a5fa" },
          80: { value: "#2563eb" },
          90: { value: "#1d4ed8" },
          100: { value: "#1e40af" },
        },
      },
      font: {
        primary: { value: "#0f172a" },
        secondary: { value: "#475569" },
      },
    },
    radii: {
      small: { value: "10px" },
      medium: { value: "14px" },
      large: { value: "18px" },
      xl: { value: "24px" },
    },
    components: {
      button: {
        primary: {
          backgroundColor: { value: "#2563eb" },
          color: { value: "#ffffff" },
          borderRadius: { value: "14px" },
          _hover: {
            backgroundColor: { value: "#1d4ed8" },
          },
        },
      },
      fieldcontrol: {
        borderRadius: { value: "14px" },
        borderColor: { value: "#cbd5e1" },
        _focus: {
          borderColor: { value: "#2563eb" },
          boxShadow: { value: "0 0 0 4px rgba(37, 99, 235, 0.12)" },
        },
      },
    },
  },
});

function AuthBrandPanel() {
  return (
    <aside className="auth-brand-panel">
      <div className="brand-orbit brand-orbit-one" />
      <div className="brand-orbit brand-orbit-two" />
      <div className="brand-content">
        <span className="auth-kicker">JEE BLUEPRINT</span>
        <h1>Study smarter for JEE Main + Advanced.</h1>
        <p>
          Track syllabus, revise high-weightage chapters, practice PYQs and build a
          focused daily preparation system.
        </p>

        <div className="mini-progress-card">
          <div className="mini-progress-top">
            <span>Today&apos;s focus</span>
            <strong>72%</strong>
          </div>
          <div className="mini-progress-track">
            <span />
          </div>
          <div className="mini-chip-row">
            <span>Physics</span>
            <span>PYQ</span>
            <span>Revision</span>
          </div>
        </div>

        <div className="auth-feature-grid">
          <div className="auth-feature-card">📘 Study Material</div>
          <div className="auth-feature-card">📝 PYQ Practice</div>
          <div className="auth-feature-card">📊 Test Tracking</div>
          <div className="auth-feature-card">🤖 AI Tutor Ready</div>
        </div>
      </div>
    </aside>
  );
}


function PublicLanding() {
  const scrollToAuth = () => {
    document.getElementById("signin")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <>
      <nav className="public-nav">
        <div className="public-logo-wrap">
          <div className="public-logo">JB</div>
          <div>
            <strong>JEE Blueprint</strong>
            <span>JEE Main + Advanced Prep</span>
          </div>
        </div>
        <div className="public-nav-links">
          <a href="#features">Features</a>
          <a href="#pyq">PYQ</a>
          <a href="#signin">Login</a>
          <button onClick={scrollToAuth}>Create account</button>
        </div>
      </nav>

      <section className="public-hero">
        <div className="public-hero-copy">
          <span className="public-badge">Free JEE preparation dashboard</span>
          <h1>Plan, track and improve your JEE 2027 preparation.</h1>
          <p>
            JEE Blueprint helps students track syllabus progress, revise high-weightage chapters,
            practice PYQs, plan tests and stay consistent with daily study logs.
          </p>
          <div className="public-cta-row">
            <button className="public-primary-btn" onClick={scrollToAuth}>Start free</button>
            <a className="public-secondary-btn" href="#features">Explore features</a>
          </div>
          <div className="public-trust-row">
            <span>✓ Free syllabus tracker</span>
            <span>✓ PYQ practice structure</span>
            <span>✓ Study material hub</span>
          </div>
        </div>

        <div className="public-hero-card" aria-label="JEE Blueprint dashboard preview">
          <div className="mock-topbar">
            <span />
            <span />
            <span />
          </div>
          <div className="mock-dashboard-title">
            <div>
              <small>JEE PREP LOG</small>
              <strong>Blueprint</strong>
            </div>
            <span className="mock-sync">0% synced</span>
          </div>
          <div className="mock-stats-row">
            <div><strong>210m</strong><span>today</span></div>
            <div><strong>1 day</strong><span>streak</span></div>
            <div><strong>3.5h</strong><span>week</span></div>
          </div>
          <div className="mock-subject-card">
            <div className="mock-subject-head"><span>PHY</span><strong>Physics</strong><em>18 chapters</em></div>
            <div className="mock-progress"><span /></div>
            <p>Revise Current Electricity before starting new topics.</p>
          </div>
          <div className="mock-mini-grid">
            <span>PYQ</span><span>Tests</span><span>AI Tutor</span>
          </div>
        </div>
      </section>

      <section id="features" className="public-section">
        <div className="section-heading">
          <span>Why use it?</span>
          <h2>Everything a JEE student needs in one simple workspace.</h2>
          <p>Start with free planning and tracking. Later unlock full PYQ solutions, test analysis and AI planning.</p>
        </div>
        <div className="public-feature-grid">
          <article className="public-feature"><span>📊</span><h3>Syllabus Tracker</h3><p>Track Physics, Chemistry and Maths chapter progress with revision flags.</p></article>
          <article id="pyq" className="public-feature"><span>📝</span><h3>PYQ Practice</h3><p>Organize chapter-wise JEE Main and Advanced previous year question practice.</p></article>
          <article className="public-feature"><span>📘</span><h3>Study Material</h3><p>Keep formula sheets, short notes and high-weightage revision checklists together.</p></article>
          <article className="public-feature"><span>⏱️</span><h3>Tests & Logs</h3><p>Use quick chapter tests, mock planning and daily study-minute tracking.</p></article>
          <article className="public-feature"><span>🤖</span><h3>AI Tutor Ready</h3><p>AI doubt solver can be connected through a secure backend without exposing API keys.</p></article>
          <article className="public-feature"><span>🔐</span><h3>Secure Account</h3><p>Sign in to save your preparation workspace and access the student dashboard.</p></article>
        </div>
      </section>

      <section className="public-proof-section">
        <div>
          <span className="public-badge">Made for serious prep</span>
          <h2>Built for students who want a clear daily system.</h2>
          <p>
            Use it to decide what to study today, what to revise next and where your weak chapters are.
            The current version is free to try.
          </p>
        </div>
        <div className="public-plan-card">
          <strong>Free Plan</strong>
          <ul>
            <li>Syllabus tracker</li>
            <li>PYQ section structure</li>
            <li>Study material hub</li>
            <li>Test planning pages</li>
          </ul>
        </div>
      </section>
    </>
  );
}

function AuthGate() {
  const { authStatus } = useAuthenticator((context) => [context.authStatus]);

  if (authStatus === "authenticated") {
    return <AuthenticatedApp />;
  }

  return (
    <main className="public-page">
      <PublicLanding />
      <section id="signin" className="public-auth-section">
        <div className="public-auth-copy">
          <span className="public-badge">Student login</span>
          <h2>Sign in or create your free account.</h2>
          <p>
            After login you can access Dashboard, PYQ Practice, Study Material,
            Test Series, AI Tutor and Profile pages.
          </p>
        </div>
        <div className="public-auth-card">
          <Authenticator loginMechanisms={["email"]} signUpAttributes={[]} />
        </div>
      </section>
      <footer className="public-footer">
        <strong>JEE Blueprint</strong>
        <span>Free JEE syllabus tracker, PYQ practice, study material and test planner for JEE students.</span>
      </footer>
    </main>
  );
}

function AuthenticatedApp() {
  const { signOut, user } = useAuthenticator((context) => [context.user]);

  return (
    <div className="signed-app-shell">
      <div className="signed-topbar">
        <div>
          <span className="signed-kicker">JEE Blueprint</span>
          <strong>Welcome, {user?.signInDetails?.loginId || user?.username || "student"}</strong>
        </div>
        <button onClick={signOut}>Sign out</button>
      </div>
      <JeeBlueprint />
    </div>
  );
}

function GlobalAuthStyles() {
  return (
    <style>{`
      :root {
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }

      body {
        margin: 0;
        background: #eaf1f6;
      }

      .auth-page {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 28px;
        background:
          radial-gradient(circle at 15% 15%, rgba(37, 99, 235, 0.18), transparent 30%),
          radial-gradient(circle at 85% 10%, rgba(22, 158, 139, 0.16), transparent 26%),
          linear-gradient(135deg, #eef4ff 0%, #f8fbff 45%, #dbeafe 100%);
        box-sizing: border-box;
      }

      .auth-shell {
        width: 100%;
        max-width: 1100px;
        min-height: 650px;
        display: grid;
        grid-template-columns: 1.05fr 0.95fr;
        border-radius: 30px;
        overflow: hidden;
        background: rgba(255, 255, 255, 0.88);
        border: 1px solid rgba(219, 234, 254, 0.95);
        box-shadow: 0 24px 80px rgba(15, 23, 42, 0.14);
      }

      .auth-brand-panel {
        position: relative;
        overflow: hidden;
        background: linear-gradient(155deg, #2563eb 0%, #1d4ed8 52%, #0f172a 100%);
        color: #fff;
        display: flex;
        align-items: center;
        padding: 54px;
      }

      .brand-orbit {
        position: absolute;
        border-radius: 999px;
        border: 1px solid rgba(255, 255, 255, 0.18);
      }

      .brand-orbit-one {
        width: 360px;
        height: 360px;
        right: -160px;
        top: -120px;
      }

      .brand-orbit-two {
        width: 240px;
        height: 240px;
        left: -90px;
        bottom: -80px;
      }

      .brand-content {
        position: relative;
        z-index: 1;
        max-width: 480px;
      }

      .auth-kicker {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        font-size: 12px;
        letter-spacing: 0.22em;
        font-weight: 800;
        text-transform: uppercase;
        color: #bfdbfe;
        margin-bottom: 18px;
      }

      .auth-kicker::before {
        content: "";
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #22c55e;
        box-shadow: 0 0 0 6px rgba(34, 197, 94, 0.16);
      }

      .brand-content h1,
      .mobile-brand h1 {
        margin: 0 0 16px;
        font-size: clamp(34px, 4vw, 54px);
        line-height: 1.02;
        letter-spacing: -0.04em;
      }

      .brand-content p,
      .mobile-brand p {
        margin: 0;
        color: rgba(255, 255, 255, 0.76);
        font-size: 17px;
        line-height: 1.7;
      }

      .mini-progress-card {
        margin: 32px 0 22px;
        padding: 18px;
        border-radius: 22px;
        background: rgba(255, 255, 255, 0.12);
        border: 1px solid rgba(255, 255, 255, 0.18);
        backdrop-filter: blur(14px);
      }

      .mini-progress-top {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
        font-weight: 700;
      }

      .mini-progress-track {
        height: 10px;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.2);
        overflow: hidden;
      }

      .mini-progress-track span {
        display: block;
        width: 72%;
        height: 100%;
        border-radius: inherit;
        background: linear-gradient(90deg, #93c5fd, #22c55e);
      }

      .mini-chip-row {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
        margin-top: 14px;
      }

      .mini-chip-row span {
        font-size: 12px;
        font-weight: 700;
        padding: 7px 10px;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.14);
      }

      .auth-feature-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
      }

      .auth-feature-card {
        padding: 15px;
        border-radius: 18px;
        background: rgba(255, 255, 255, 0.11);
        border: 1px solid rgba(255, 255, 255, 0.14);
        font-weight: 800;
      }

      .auth-form-panel {
        display: flex;
        flex-direction: column;
        justify-content: center;
        padding: 54px;
        background:
          linear-gradient(180deg, rgba(255, 255, 255, 0.92), rgba(248, 251, 255, 0.96));
      }

      .mobile-brand {
        display: none;
        margin-bottom: 26px;
      }

      .mobile-brand .auth-kicker {
        color: #2563eb;
      }

      .mobile-brand h1 {
        color: #0f172a;
        font-size: 36px;
      }

      .mobile-brand p {
        color: #64748b;
      }

      .auth-card-title {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 18px;
        color: #64748b;
        font-size: 13px;
        font-weight: 700;
        letter-spacing: 0.04em;
        text-transform: uppercase;
      }

      .auth-card-title strong {
        color: #2563eb;
        padding: 7px 10px;
        border-radius: 999px;
        background: #dbeafe;
        text-transform: none;
        letter-spacing: normal;
      }

      .auth-form-panel [data-amplify-authenticator] {
        width: 100%;
      }

      .auth-form-panel .amplify-authenticator {
        width: 100%;
      }

      .auth-form-panel .amplify-card {
        border: none;
        box-shadow: none;
        background: transparent;
        padding: 0;
      }

      .auth-form-panel .amplify-tabs__list {
        background: #f1f5f9;
        padding: 6px;
        border-radius: 16px;
        border: 1px solid #e2e8f0;
        gap: 8px;
        margin-bottom: 22px;
      }

      .auth-form-panel .amplify-tabs__item {
        border: none;
        border-radius: 13px;
        min-height: 46px;
        font-weight: 800;
        color: #334155;
      }

      .auth-form-panel .amplify-tabs__item[data-state="active"] {
        color: #fff;
        background: linear-gradient(135deg, #2563eb, #1d4ed8);
        box-shadow: 0 8px 20px rgba(37, 99, 235, 0.24);
      }

      .auth-form-panel .amplify-label {
        color: #334155;
        font-weight: 800;
        margin-bottom: 7px;
      }

      .auth-form-panel .amplify-input,
      .auth-form-panel .amplify-field-group__control {
        min-height: 52px;
        border-radius: 14px;
        font-size: 15px;
      }

      .auth-form-panel .amplify-button--primary {
        min-height: 54px;
        border-radius: 15px;
        font-size: 17px;
        font-weight: 900;
        background: linear-gradient(135deg, #2563eb, #1d4ed8);
        box-shadow: 0 10px 24px rgba(37, 99, 235, 0.28);
        transition: transform 0.18s ease, box-shadow 0.18s ease;
      }

      .auth-form-panel .amplify-button--primary:hover {
        transform: translateY(-1px);
        box-shadow: 0 14px 30px rgba(37, 99, 235, 0.34);
      }

      .auth-form-panel .amplify-button--link {
        color: #2563eb;
        font-weight: 800;
      }

      .signed-app-shell {
        min-height: 100vh;
        background: #eaf1f6;
      }

      .signed-topbar {
        max-width: 1180px;
        margin: 0 auto;
        padding: 14px 18px 0;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 14px;
        color: #14233B;
        box-sizing: border-box;
      }

      .signed-topbar > div {
        min-width: 0;
        display: flex;
        flex-direction: column;
      }

      .signed-kicker {
        color: #2563eb;
        font-size: 11px;
        font-weight: 900;
        letter-spacing: 0.16em;
        text-transform: uppercase;
      }

      .signed-topbar strong {
        font-size: 14px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .signed-topbar button {
        border: 1px solid #cbd5e1;
        background: #fff;
        color: #0f172a;
        border-radius: 12px;
        padding: 9px 13px;
        cursor: pointer;
        font-size: 13px;
        font-weight: 800;
        box-shadow: 0 6px 18px rgba(15, 23, 42, 0.06);
      }



      .public-page {
        min-height: 100vh;
        background: #f3f7fb;
        color: #0f172a;
      }

      .public-nav {
        position: sticky;
        top: 0;
        z-index: 20;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 14px 7vw;
        background: rgba(255, 255, 255, 0.9);
        backdrop-filter: blur(16px);
        border-bottom: 1px solid #dbe5f0;
      }

      .public-logo-wrap {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .public-logo {
        width: 42px;
        height: 42px;
        display: grid;
        place-items: center;
        border-radius: 14px;
        background: linear-gradient(135deg, #2563eb, #0f172a);
        color: white;
        font-weight: 900;
        letter-spacing: 0.5px;
        box-shadow: 0 12px 26px rgba(37, 99, 235, 0.22);
      }

      .public-logo-wrap strong,
      .public-logo-wrap span {
        display: block;
      }

      .public-logo-wrap span {
        color: #64748b;
        font-size: 12px;
        margin-top: 2px;
      }

      .public-nav-links {
        display: flex;
        align-items: center;
        gap: 18px;
      }

      .public-nav-links a {
        color: #334155;
        text-decoration: none;
        font-weight: 700;
        font-size: 14px;
      }

      .public-nav-links button,
      .public-primary-btn {
        border: none;
        border-radius: 999px;
        background: linear-gradient(135deg, #2563eb, #1d4ed8);
        color: white;
        font-weight: 800;
        cursor: pointer;
        box-shadow: 0 12px 24px rgba(37, 99, 235, 0.24);
      }

      .public-nav-links button {
        padding: 11px 18px;
      }

      .public-hero {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(360px, 0.85fr);
        gap: 44px;
        align-items: center;
        padding: 78px 7vw 56px;
        background:
          radial-gradient(circle at 12% 18%, rgba(37, 99, 235, 0.16), transparent 30%),
          radial-gradient(circle at 90% 12%, rgba(22, 158, 139, 0.12), transparent 28%),
          linear-gradient(135deg, #eef4ff 0%, #f8fbff 50%, #e2edff 100%);
      }

      .public-badge {
        display: inline-flex;
        align-items: center;
        width: fit-content;
        padding: 8px 12px;
        border-radius: 999px;
        background: #dbeafe;
        color: #1d4ed8;
        font-size: 12px;
        letter-spacing: 1.2px;
        text-transform: uppercase;
        font-weight: 900;
      }

      .public-hero-copy h1 {
        max-width: 780px;
        margin: 18px 0 18px;
        font-size: clamp(40px, 6vw, 76px);
        line-height: 0.98;
        letter-spacing: -2.2px;
      }

      .public-hero-copy p,
      .section-heading p,
      .public-proof-section p,
      .public-auth-copy p,
      .public-footer span {
        color: #526174;
        font-size: 17px;
        line-height: 1.8;
      }

      .public-hero-copy p {
        max-width: 650px;
        margin-bottom: 28px;
      }

      .public-cta-row {
        display: flex;
        flex-wrap: wrap;
        gap: 14px;
        align-items: center;
        margin-bottom: 22px;
      }

      .public-primary-btn {
        padding: 15px 28px;
        font-size: 16px;
      }

      .public-secondary-btn {
        padding: 14px 22px;
        border-radius: 999px;
        background: white;
        border: 1px solid #dbe5f0;
        color: #0f172a;
        text-decoration: none;
        font-weight: 800;
      }

      .public-trust-row {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
      }

      .public-trust-row span {
        padding: 8px 11px;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.78);
        border: 1px solid #dbeafe;
        color: #334155;
        font-size: 13px;
        font-weight: 800;
      }

      .public-hero-card {
        border-radius: 28px;
        padding: 22px;
        background: rgba(255, 255, 255, 0.86);
        border: 1px solid rgba(219, 234, 254, 0.95);
        box-shadow: 0 26px 70px rgba(15, 23, 42, 0.16);
      }

      .mock-topbar {
        display: flex;
        gap: 7px;
        margin-bottom: 22px;
      }

      .mock-topbar span {
        width: 11px;
        height: 11px;
        border-radius: 999px;
        background: #cbd5e1;
      }

      .mock-dashboard-title {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 18px;
      }

      .mock-dashboard-title small {
        display: block;
        color: #2563eb;
        font-size: 11px;
        letter-spacing: 2px;
        font-weight: 900;
        margin-bottom: 8px;
      }

      .mock-dashboard-title strong {
        font-size: 32px;
      }

      .mock-sync {
        min-width: 86px;
        height: 86px;
        border-radius: 999px;
        display: grid;
        place-items: center;
        border: 8px solid #dbeafe;
        font-weight: 900;
      }

      .mock-stats-row {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 12px;
        margin: 22px 0;
      }

      .mock-stats-row div,
      .mock-subject-card,
      .public-feature,
      .public-plan-card {
        background: white;
        border: 1px solid #dbe5f0;
        border-radius: 20px;
        box-shadow: 0 12px 28px rgba(15, 23, 42, 0.06);
      }

      .mock-stats-row div {
        padding: 14px;
      }

      .mock-stats-row strong,
      .mock-stats-row span {
        display: block;
      }

      .mock-stats-row span {
        color: #64748b;
        font-size: 12px;
        margin-top: 3px;
      }

      .mock-subject-card {
        padding: 18px;
      }

      .mock-subject-head {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .mock-subject-head span {
        padding: 8px 10px;
        border-radius: 12px;
        background: #dbeafe;
        color: #2563eb;
        font-weight: 900;
      }

      .mock-subject-head em {
        margin-left: auto;
        color: #64748b;
        font-style: normal;
        font-size: 13px;
      }

      .mock-progress {
        height: 11px;
        background: #e2e8f0;
        border-radius: 999px;
        overflow: hidden;
        margin: 18px 0 12px;
      }

      .mock-progress span {
        display: block;
        width: 54%;
        height: 100%;
        background: linear-gradient(90deg, #2563eb, #14b8a6);
      }

      .mock-subject-card p {
        margin: 0;
        color: #475569;
      }

      .mock-mini-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 10px;
        margin-top: 14px;
      }

      .mock-mini-grid span {
        text-align: center;
        border-radius: 14px;
        background: #eff6ff;
        color: #2563eb;
        font-weight: 900;
        padding: 12px 8px;
      }

      .public-section,
      .public-proof-section,
      .public-auth-section,
      .public-footer {
        padding-left: 7vw;
        padding-right: 7vw;
      }

      .public-section {
        padding-top: 70px;
        padding-bottom: 70px;
      }

      .section-heading {
        max-width: 760px;
        margin-bottom: 28px;
      }

      .section-heading span {
        color: #2563eb;
        font-size: 13px;
        letter-spacing: 1.6px;
        font-weight: 900;
        text-transform: uppercase;
      }

      .section-heading h2,
      .public-proof-section h2,
      .public-auth-copy h2 {
        font-size: clamp(30px, 4vw, 48px);
        line-height: 1.05;
        letter-spacing: -1px;
        margin: 12px 0;
      }

      .public-feature-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 18px;
      }

      .public-feature {
        padding: 24px;
      }

      .public-feature span {
        font-size: 28px;
      }

      .public-feature h3 {
        margin: 14px 0 8px;
        font-size: 20px;
      }

      .public-feature p {
        margin: 0;
        color: #526174;
        line-height: 1.7;
      }

      .public-proof-section {
        display: grid;
        grid-template-columns: minmax(0, 1fr) 360px;
        gap: 28px;
        align-items: center;
        padding-top: 50px;
        padding-bottom: 50px;
        background: #0f172a;
        color: white;
      }

      .public-proof-section p {
        color: #cbd5e1;
      }

      .public-plan-card {
        padding: 26px;
        color: #0f172a;
      }

      .public-plan-card strong {
        font-size: 22px;
      }

      .public-plan-card ul {
        margin: 14px 0 0;
        padding-left: 18px;
        color: #475569;
        line-height: 1.9;
      }

      .public-auth-section {
        display: grid;
        grid-template-columns: minmax(0, 0.9fr) minmax(360px, 520px);
        gap: 34px;
        align-items: start;
        padding-top: 72px;
        padding-bottom: 72px;
        background:
          radial-gradient(circle at 15% 35%, rgba(37, 99, 235, 0.12), transparent 28%),
          #f8fbff;
      }

      .public-auth-card {
        border-radius: 26px;
        background: white;
        border: 1px solid #dbe5f0;
        box-shadow: 0 20px 55px rgba(15, 23, 42, 0.12);
        padding: 16px;
      }

      .public-auth-card [data-amplify-authenticator] {
        width: 100%;
      }

      .public-auth-card .amplify-tabs {
        border-radius: 16px;
        overflow: hidden;
      }

      .public-footer {
        display: flex;
        justify-content: space-between;
        gap: 20px;
        padding-top: 24px;
        padding-bottom: 24px;
        border-top: 1px solid #dbe5f0;
        background: white;
      }

      @media (max-width: 980px) {
        .public-nav {
          padding: 12px 18px;
        }

        .public-nav-links a {
          display: none;
        }

        .public-hero,
        .public-proof-section,
        .public-auth-section {
          grid-template-columns: 1fr;
        }

        .public-hero,
        .public-section,
        .public-proof-section,
        .public-auth-section,
        .public-footer {
          padding-left: 22px;
          padding-right: 22px;
        }

        .public-feature-grid {
          grid-template-columns: 1fr;
        }

        .public-hero-card {
          order: -1;
        }
      }

      @media (max-width: 560px) {
        .public-hero {
          padding-top: 34px;
        }

        .public-hero-copy h1 {
          font-size: 38px;
          letter-spacing: -1.2px;
        }

        .mock-stats-row,
        .mock-mini-grid {
          grid-template-columns: 1fr;
        }

        .public-auth-section {
          padding-top: 44px;
          padding-bottom: 44px;
        }

        .public-footer {
          flex-direction: column;
        }
      }


      @media (max-width: 900px) {
        .auth-page {
          align-items: flex-start;
          padding: 18px;
        }

        .auth-shell {
          grid-template-columns: 1fr;
          min-height: auto;
          border-radius: 24px;
        }

        .auth-brand-panel {
          display: none;
        }

        .auth-form-panel {
          padding: 28px;
        }

        .mobile-brand {
          display: block;
        }
      }
    `}</style>
  );
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <GlobalAuthStyles />
    <ThemeProvider theme={theme}>
      <Authenticator.Provider>
        <AuthGate />
      </Authenticator.Provider>
    </ThemeProvider>
  </React.StrictMode>
);
