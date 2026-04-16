import { ChevronRight } from 'lucide-react';
import { useState } from 'react';

const PRIORITY_STYLES = {
  high: 'text-severity-high bg-severity-high/10',
  medium: 'text-severity-medium bg-severity-medium/10',
  low: 'text-severity-low bg-severity-low/10'
};

function RecCard({ rec }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="flex items-start gap-3 rounded-lg border border-border bg-bg-secondary p-4 cursor-pointer transition-all hover:border-accent/30"
      onClick={() => setExpanded(!expanded)}
    >
      <ChevronRight
        size={16}
        className={`mt-1 shrink-0 text-accent transition-transform ${expanded ? 'rotate-90' : ''}`}
      />
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className={`inline-block rounded px-2 py-0.5 text-xs font-bold uppercase ${PRIORITY_STYLES[rec.priority]}`}>
            {rec.priority}
          </span>
          {rec.file && (
            <span className="text-xs opacity-50 font-mono">{rec.file}</span>
          )}
        </div>
        <p className="text-sm font-semibold text-text-primary">{rec.title || rec.action}</p>
        {expanded && rec.description && (
          <div className="mt-3 text-sm text-text-secondary leading-relaxed border-t border-border pt-3">
            {rec.description}
          </div>
        )}
      </div>
    </div>
  );
}

export default function RecommendationList({ recommendations }) {
  if (!recommendations || recommendations.length === 0) return null;

  return (
    <div className="space-y-3">
      {recommendations.map((rec, i) => (
        <RecCard key={i} rec={rec} />
      ))}
    </div>
  );
}
