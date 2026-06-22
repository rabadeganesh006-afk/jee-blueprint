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

function AuthGate() {
  const { authStatus } = useAuthenticator((context) => [context.authStatus]);

  if (authStatus === "authenticated") {
    return <AuthenticatedApp />;
  }

  return (
    <main className="auth-page">
      <section className="auth-shell">
        <AuthBrandPanel />
        <section className="auth-form-panel">
          <div className="mobile-brand">
            <span className="auth-kicker">JEE BLUEPRINT</span>
            <h1>Welcome back</h1>
            <p>Sign in to continue your preparation journey.</p>
          </div>
          <div className="auth-card-title">
            <span>Student Access</span>
            <strong>Secure login</strong>
          </div>
          <Authenticator loginMechanisms={["email"]} signUpAttributes={[]} />
        </section>
      </section>
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
