import { useEffect, useState } from 'react';
import App from './App.jsx';
import DemoApp from './DemoApp.jsx';
import './demoPreview.css';

const DEMO_HASH = '#demo-dashboard';

function makeDemoButton(className, onOpenDemo) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = className;
  button.textContent = 'Demo Site';
  button.addEventListener('click', onOpenDemo);
  return button;
}

function DemoWebsiteButtonInjector({ onOpenDemo }) {
  useEffect(() => {
    function injectAuthDemoButton() {
      const authBox = document.querySelector('.customAuthBox');
      if (!authBox) return;

      const submitButton = authBox.querySelector('.customAuthForm .authSubmit');
      const existing = authBox.querySelector('.demoWebsiteAuthButton');

      if (!submitButton) {
        existing?.remove();
        return;
      }

      if (!existing) {
        submitButton.insertAdjacentElement('afterend', makeDemoButton('demoWebsiteAuthButton', onOpenDemo));
      }
    }

    function injectLandingDemoButtons() {
      const heroActions = document.querySelector('.landingHero .heroActions');
      if (heroActions && !heroActions.querySelector('.demoWebsiteLandingButton')) {
        heroActions.appendChild(makeDemoButton('outlineBtn demoWebsiteLandingButton', onOpenDemo));
      }

      const navActions = document.querySelector('.landingNav > div');
      if (navActions && !navActions.querySelector('.demoWebsiteNavButton')) {
        navActions.appendChild(makeDemoButton('ghostBtn demoWebsiteNavButton', onOpenDemo));
      }
    }

    function injectDemoButtons() {
      injectAuthDemoButton();
      injectLandingDemoButtons();
    }

    injectDemoButtons();
    const observer = new MutationObserver(injectDemoButtons);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    window.addEventListener('hashchange', injectDemoButtons);

    return () => {
      observer.disconnect();
      window.removeEventListener('hashchange', injectDemoButtons);
      document.querySelectorAll('.demoWebsiteAuthButton, .demoWebsiteLandingButton, .demoWebsiteNavButton').forEach((button) => button.remove());
    };
  }, [onOpenDemo]);

  return null;
}

export default function AppWithDemoButton() {
  const [demoOpen, setDemoOpen] = useState(() => window.location.hash === DEMO_HASH);

  function openDemoDashboard() {
    window.history.replaceState(null, '', DEMO_HASH);
    setDemoOpen(true);
  }

  function closeDemoDashboard() {
    window.history.replaceState(null, '', window.location.pathname);
    setDemoOpen(false);
  }

  if (demoOpen) {
    return (
      <>
        <button className="demoBackLanding" type="button" onClick={closeDemoDashboard}>← Back to Landing Page</button>
        <DemoApp />
      </>
    );
  }

  return (
    <>
      <App />
      <DemoWebsiteButtonInjector onOpenDemo={openDemoDashboard} />
    </>
  );
}
