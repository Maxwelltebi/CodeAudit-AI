import { useState } from 'react';
import axios from 'axios';
import LandingPage from './components/LandingPage';
import LoadingState from './components/LoadingState';
import ResultsDashboard from './components/ResultsDashboard';

export default function App() {
  const [appState, setAppState] = useState('idle'); // idle | loading | results
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');

  const handleAnalyze = async (repoUrl) => {
    setError('');
    setAppState('loading');
    try {
      const res = await axios.post('/api/analyze', { url: repoUrl });
      setReport(res.data);
      setAppState('results');
    } catch (err) {
      const msg = err.response?.data?.error || 'Analysis failed. Please try again.';
      setError(msg);
      setAppState('idle');
    }
  };

  const handleBack = () => {
    setAppState('idle');
    setReport(null);
    setError('');
  };

  return (
    <div className="scanlines grid-bg min-h-screen">
      {appState === 'idle' && (
        <LandingPage onAnalyze={handleAnalyze} error={error} />
      )}
      {appState === 'loading' && <LoadingState />}
      {appState === 'results' && report && (
        <ResultsDashboard report={report} onBack={handleBack} />
      )}
    </div>
  );
}
