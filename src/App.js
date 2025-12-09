import React from 'react';
import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react';
import './App.css';
import StudentScoreAnalyzer from './components/StudentScoreAnalyzer';

function App() {
  return (
    <div className="App">
      <SignedIn>
        <StudentScoreAnalyzer />
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </div>
  );
}

export default App;
