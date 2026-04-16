import { ShieldAlert } from 'lucide-react';
import { useState } from 'react';

const SEVERITY_STYLES = {
  high: 'bg-severity-high/15 border-severity-high/40 text-severity-high',
  medium: 'bg-severity-medium/15 border-severity-medium/40 text-severity-medium',
  low: 'bg-severity-low/15 border-severity-low/40 text-severity-low'
};

const BADGE_STYLES = {
  high: 'bg-severity-high/20 text-severity-high',
  medium: 'bg-severity-medium/20 text-severity-medium',
  low: 'bg-severity-low/20 text-severity-low'
};

function FlagCard({ flag }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={`rounded-lg border p-4 cursor-pointer transition-all ${SEVERITY_STYLES[flag.severity]}`}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-start gap-3">
        <ShieldAlert size={18} className="mt-0.5 shrink-0" />
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className={`inline-block rounded px-2 py-0.5 text-xs font-bold uppercase ${BADGE_STYLES[flag.severity]}`}>
              {flag.severity}
            </span>
            {flag.file && (
              <span className="text-xs opacity-70 font-mono">{flag.file}</span>
            )}
            <span className="ml-auto text-xs opacity-50">{expanded ? '[ - ]' : '[ + ]'}</span>
          </div>
          <p className="text-sm font-semibold">{flag.title || flag.issue}</p>
          {expanded && (
            <div className="mt-3 space-y-3 text-sm opacity-90">
              {flag.description && (
                <div>
                  <p className="text-xs font-bold uppercase opacity-60 mb-1">What's wrong</p>
                  <p className="leading-relaxed">{flag.description}</p>
                </div>
              )}
              {flag.fix && (
                <div className="border-t border-current/20 pt-3">
                  <p className="text-xs font-bold uppercase opacity-60 mb-1">How to fix</p>
                  <p className="leading-relaxed">{flag.fix}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SecurityFlags({ flags }) {
  if (!flags || flags.length === 0) {
    return (
      <div className="rounded-lg border border-accent/20 bg-accent/5 p-4 text-sm text-accent">
        No security issues detected.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {flags.map((flag, i) => (
        <FlagCard key={i} flag={flag} />
      ))}
    </div>
  );
}
