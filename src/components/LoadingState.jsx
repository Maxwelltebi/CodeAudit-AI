import { useState, useEffect } from 'react';

const MESSAGES = [
  'Fetching repository data...',
  'Scanning file structure...',
  'Reading source files...',
  'Analyzing code quality...',
  'Checking for security issues...',
  'Generating recommendations...',
  'Building your report...'
];

export default function LoadingState() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % MESSAGES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      {/* Spinner */}
      <div className="relative mb-10">
        <div className="h-20 w-20 rounded-full border-2 border-border" />
        <div className="absolute inset-0 h-20 w-20 rounded-full border-2 border-transparent border-t-accent animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-3 w-3 rounded-full bg-accent pulse-glow" />
        </div>
      </div>

      {/* Cycling message */}
      <p key={index} className="text-lg text-text-secondary fade-cycle text-center">
        {MESSAGES[index]}
      </p>

      {/* Progress dots */}
      <div className="flex gap-2 mt-8">
        {MESSAGES.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 w-1.5 rounded-full transition-colors duration-300 ${
              i <= index ? 'bg-accent' : 'bg-border'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
