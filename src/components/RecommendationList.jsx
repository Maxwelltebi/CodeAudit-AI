import { ChevronRight } from 'lucide-react';

const PRIORITY_STYLES = {
  high: 'text-severity-high bg-severity-high/10',
  medium: 'text-severity-medium bg-severity-medium/10',
  low: 'text-severity-low bg-severity-low/10'
};

export default function RecommendationList({ recommendations }) {
  if (!recommendations || recommendations.length === 0) return null;

  return (
    <div className="space-y-3">
      {recommendations.map((rec, i) => (
        <div
          key={i}
          className="flex items-start gap-3 rounded-lg border border-border bg-bg-secondary p-4"
        >
          <ChevronRight size={16} className="mt-1 shrink-0 text-accent" />
          <div className="flex-1">
            <span className={`inline-block rounded px-2 py-0.5 text-xs font-bold uppercase mb-1 ${PRIORITY_STYLES[rec.priority]}`}>
              {rec.priority}
            </span>
            <p className="text-sm text-text-primary">{rec.action}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
