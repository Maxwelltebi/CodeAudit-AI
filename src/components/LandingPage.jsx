import { useState } from 'react';
import { ArrowRight } from 'lucide-react';

const EXAMPLES = [
  { label: 'vercel/next.js', url: 'https://github.com/vercel/next.js' },
  { label: 'facebook/react', url: 'https://github.com/facebook/react' },
  { label: 'torvalds/linux', url: 'https://github.com/torvalds/linux' }
];

export default function LandingPage({ onAnalyze, error }) {
  const [url, setUrl] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (url.trim()) onAnalyze(url.trim());
  };

  const handleExample = (exampleUrl) => {
    setUrl(exampleUrl);
    onAnalyze(exampleUrl);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-16">
      {/* Heading */}
      <h1 className="text-center text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight mb-6 max-w-3xl">
        Instant{' '}
        <span className="text-accent">code audits</span>
        <br />
        for any GitHub repo
      </h1>

      {/* Subtitle */}
      <p className="text-center text-text-secondary text-base sm:text-lg max-w-xl mb-10 leading-relaxed">
        Paste a public GitHub URL. Get a structured quality report — architecture,
        security flags, score, and a generated README — in under 30 seconds.
      </p>

      {/* Error message */}
      {error && (
        <div className="mb-4 rounded-lg border border-severity-high/40 bg-severity-high/10 px-4 py-3 text-sm text-severity-high max-w-xl w-full text-center">
          {error}
        </div>
      )}

      {/* Input + Button */}
      <form onSubmit={handleSubmit} className="flex w-full max-w-2xl gap-3 mb-8">
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://github.com/owner/repo"
          className="flex-1 rounded-lg bg-bg-input border border-border px-5 py-4 text-base text-text-primary placeholder-text-secondary/50 outline-none focus:border-accent/60 transition-colors"
        />
        <button
          type="submit"
          className="rounded-lg bg-accent px-6 py-4 text-sm font-bold tracking-wider text-bg-primary uppercase whitespace-nowrap hover:bg-accent/90 transition-colors flex items-center gap-2"
        >
          <ArrowRight size={16} />
          Analyze
        </button>
      </form>

      {/* Example repos */}
      <div className="text-center mb-12">
        <p className="text-xs font-semibold tracking-[0.2em] text-text-secondary uppercase mb-4">
          Try an example repo
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          {EXAMPLES.map((ex) => (
            <button
              key={ex.label}
              onClick={() => handleExample(ex.url)}
              className="rounded-full border border-border bg-bg-secondary px-5 py-2.5 text-sm text-text-primary hover:border-accent/60 hover:text-accent transition-colors"
            >
              {ex.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="flex gap-12 sm:gap-20">
        {[
          { value: '30s', label: 'Time to Report' },
          { value: '0', label: 'Setup Required' },
          { value: '10', label: 'Analysis Sections' }
        ].map((stat) => (
          <div key={stat.label} className="text-center">
            <div className="text-3xl sm:text-4xl font-extrabold text-accent">
              {stat.value}
            </div>
            <div className="text-xs font-semibold tracking-[0.15em] text-text-secondary uppercase mt-1">
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
