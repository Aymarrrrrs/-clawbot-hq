import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import PasswordGate from './components/PasswordGate';

// Root mounts the gate first. App (and all its Supabase hooks) only renders
// after the user is unlocked — no wasted calls, no Rules-of-Hooks issues.
function Root() {
  const [unlocked, setUnlocked] = useState(false);
  return unlocked
    ? <App />
    : <PasswordGate onUnlock={() => setUnlocked(true)} />;
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<React.StrictMode><Root /></React.StrictMode>);
