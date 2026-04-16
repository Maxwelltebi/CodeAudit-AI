export default function ScoreRing({ score }) {
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 10) * circumference;

  const color =
    score >= 7 ? '#00E599' :
    score >= 4 ? '#f97316' :
    '#ef4444';

  return (
    <div className="flex flex-col items-center">
      <svg width="120" height="120" viewBox="0 0 100 100">
        {/* Background ring */}
        <circle
          cx="50" cy="50" r={radius}
          fill="none"
          stroke="#2a2a3e"
          strokeWidth="8"
        />
        {/* Score ring */}
        <circle
          cx="50" cy="50" r={radius}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 50 50)"
          className="score-ring-animate"
          style={{ strokeDashoffset: offset }}
        />
        {/* Score text */}
        <text
          x="50" y="48"
          textAnchor="middle"
          fill={color}
          fontSize="24"
          fontWeight="bold"
        >
          {score.toFixed(1)}
        </text>
        <text
          x="50" y="64"
          textAnchor="middle"
          fill="#9ca3af"
          fontSize="10"
        >
          / 10
        </text>
      </svg>
      <span className="text-xs font-semibold tracking-[0.15em] text-text-secondary uppercase mt-2">
        Quality Score
      </span>
    </div>
  );
}
