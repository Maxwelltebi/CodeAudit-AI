import { ShieldAlert } from 'lucide-react';

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
        <div
          key={i}
          className={`rounded-lg border p-4 ${SEVERITY_STYLES[flag.severity]}`}
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
              </div>
              <p className="text-sm">{flag.issue}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
