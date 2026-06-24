import { useEffect, useState } from 'react';
import App from './App.jsx';
import DemoApp from './DemoApp.jsx';
import './demoPreview.css';

const DEMO_HASH = '#demo-dashboard';

function DemoWebsiteButtonInjector({ onOpenDemo }) {
  useEffect(() => {
    function injectDemoButton() {
      const authBox = document.querySelector('.customAuthBox');
      if (!authBox) return;

      const title = authBox.querySelector('.authFormHeaderInside h2')?.textContent?.trim() || '';
      const submitButton = authBox.querySelector('.customAuthForm .authSubmit');
      const existing = authBox.querySelector('.demoWebsiteAuthButton');

      if (!title.toLowerCase().includes('create your account') || !submitButton) {
        existing?.remove();
        return;
      }

      if (existing) return;

      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'demoWebsiteAuthButton';
      button.textContent = 'Demo Website';
      button.addEventListener('click', onOpenDemo);
      submitButton.insertAdjacentElement('afterend', button);
    }

    injectDemoButton();
    const observer = new MutationObserver(injectDemoButton);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    window.addEventListener('hashchange', injectDemoButton);

    return () => {
      observer.disconnect();
      window.removeEventListener('hashchange', injectDemoButton);
      document.querySelectorAll('.demoWebsiteAuthButton').forEach((button) => button.remove());
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

  if (demoOpen) {
    return <DemoApp />;
  }

  return (
    <>
      <App />
      <DemoWebsiteButtonInjector onOpenDemo={openDemoDashboard} />
    </>
  );
}
