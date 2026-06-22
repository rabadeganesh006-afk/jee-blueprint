import React from "react";
import { createRoot } from "react-dom/client";
import { Amplify } from "aws-amplify";
import { Authenticator, ThemeProvider, createTheme, useAuthenticator } from "@aws-amplify/ui-react";
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
        },
      },
      fieldcontrol: {
        borderRadius: { value: "14px" },
      },
    },
  },
});

function AuthBrandPanel() {
  return (
    <aside className="auth-brand-panel">
      <div className="auth-orbit one" />
      <div className="auth-orbit two" />
      <div className="auth-brand-content">
        <img src="/logo.svg" alt="JEE Blueprint" className="auth-logo" />
        <span className="auth-kicker">AI Powered JEE Companion</span>
        <h1>Your focused study partner for JEE Main + Advanced.</h1>
        <p>Plan chapters, practice PYQs, track tests and prepare with a clean student dashboard.</p>
        <div className="auth-mini-grid">
          <span>📘 Study Material</span>
          <span>π PYQ Practice</span>
          <span>✓ Test Series</span>
          <span>🤖 AI Tutor</span>
        </div>
      </div>
    </aside>
  );
}

function AuthGate() {
  const { authStatus, user, signOut } = useAuthenticator((context) => [context.authStatus, context.user]);

  if (authStatus === "authenticated") {
    return <JeeBlueprint user={user} signOut={signOut} />;
  }

  return (
    <main className="auth-page">
      <section className="auth-shell">
        <AuthBrandPanel />
        <section className="auth-form-panel">
          <div className="auth-form-title">
            <span>Student Access</span>
            <h2>Welcome back</h2>
            <p>Sign in or create account to start your JEE preparation.</p>
          </div>
          <ThemeProvider theme={theme}>
            <Authenticator loginMechanisms={["email"]} signUpAttributes={[]} />
          </ThemeProvider>
        </section>
      </section>
    </main>
  );
}

function GlobalAuthStyles() {
  return (
    <style>{`
      :root { font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
      body { margin: 0; background: #f5f8ff; }
      .auth-page { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 28px; background: radial-gradient(circle at 10% 10%, rgba(37,99,235,.18), transparent 28%), radial-gradient(circle at 92% 6%, rgba(99,102,241,.18), transparent 28%), linear-gradient(135deg, #eef4ff, #ffffff 45%, #dbeafe); box-sizing: border-box; }
      .auth-shell { width: 100%; max-width: 1120px; min-height: 650px; display: grid; grid-template-columns: 1.05fr .95fr; background: rgba(255,255,255,.9); border-radius: 30px; border: 1px solid #dbeafe; overflow: hidden; box-shadow: 0 28px 80px rgba(15,23,42,.16); }
      .auth-brand-panel { position: relative; display: flex; align-items: center; padding: 56px; color: #fff; background: linear-gradient(155deg, #2563eb, #1d4ed8 52%, #0f172a); overflow: hidden; }
      .auth-orbit { position: absolute; border-radius: 999px; border: 1px solid rgba(255,255,255,.18); }
      .auth-orbit.one { width: 380px; height: 380px; right: -150px; top: -120px; }
      .auth-orbit.two { width: 230px; height: 230px; left: -80px; bottom: -80px; }
      .auth-brand-content { position: relative; z-index: 1; max-width: 470px; }
      .auth-logo { height: 76px; width: auto; margin-bottom: 24px; filter: drop-shadow(0 14px 18px rgba(0,0,0,.18)); }
      .auth-kicker { display: inline-flex; padding: 8px 12px; border-radius: 999px; background: rgba(255,255,255,.14); font-size: 12px; letter-spacing: .14em; text-transform: uppercase; font-weight: 800; margin-bottom: 18px; }
      .auth-brand-content h1 { font-size: 42px; line-height: 1.05; margin: 0 0 18px; letter-spacing: -1.2px; }
      .auth-brand-content p { font-size: 17px; line-height: 1.7; color: rgba(255,255,255,.82); margin: 0 0 26px; }
      .auth-mini-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
      .auth-mini-grid span { padding: 14px; border-radius: 16px; background: rgba(255,255,255,.13); border: 1px solid rgba(255,255,255,.15); font-weight: 700; }
      .auth-form-panel { display: flex; flex-direction: column; justify-content: center; padding: 48px; background: #fff; }
      .auth-form-title span { color: #2563eb; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; font-size: 12px; }
      .auth-form-title h2 { margin: 10px 0 8px; font-size: 34px; color: #0f172a; }
      .auth-form-title p { margin: 0 0 24px; color: #64748b; line-height: 1.7; }
      .amplify-tabs__item { font-weight: 800; }
      .amplify-button--primary { height: 52px; font-weight: 800; }
      @media (max-width: 920px) { .auth-shell { grid-template-columns: 1fr; } .auth-brand-panel { display: none; } .auth-form-panel { padding: 28px; } }
    `}</style>
  );
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <GlobalAuthStyles />
    <Authenticator.Provider>
      <AuthGate />
    </Authenticator.Provider>
  </React.StrictMode>
);
