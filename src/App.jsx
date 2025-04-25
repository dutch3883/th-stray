// src/App.jsx
import { useState } from 'react';
import { GoogleAuthProvider, getAuth, signInWithPopup } from 'firebase/auth';
import { auth } from './firebase';
import React from 'react';
import ReportForm from './ReportForm';
import ReportList from './ReportList';
import './index.css';

export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('report');

  const signIn = async () => {
    // const provider = new GoogleAuthProvider();
    // const result = await signInWithPopup(auth, provider);
    setUser({});
  };

  if (!user) {
    return (
      <div className="p-4 text-center">
        <button onClick={signIn} className="bg-blue-500 text-white px-4 py-2 rounded">Sign in with Google</button>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold">Stray Cat Reporting</h1>
      <div className="space-x-2">
        <button onClick={() => setView('report')} className="bg-green-500 text-white px-4 py-2 rounded">Report Cat</button>
        <button onClick={() => setView('list')} className="bg-gray-500 text-white px-4 py-2 rounded">View Reports</button>
      </div>
      {view === 'report' ? <ReportForm user={user} /> : <ReportList user={user} />}
    </div>
  );
}
