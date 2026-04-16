import { ArrowLeft, Clock, FileCode, GitBranch } from 'lucide-react';
import ScoreRing from './ScoreRing';
import SecurityFlags from './SecurityFlags';
import RecommendationList from './RecommendationList';
import ReadmePreview from './ReadmePreview';

export default function ResultsDashboard({ report, onBack }) {
  return (
    <div className="min-h-screen px-4 py-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-text-secondary hover:text-accent transition-colors"
        >
          <ArrowLeft size={16} />
          New Analysis
        </button>
        <div className="flex items-center gap-4 text-xs text-text-secondary">
          <span className="flex items-center gap-1">
            <Clock size={12} />
            {new Date(report.analyzed_at).toLocaleString()}
          </span>
          <span className="flex items-center gap-1">
            <FileCode size={12} />
            {report.files_analyzed} files analyzed
          </span>
        </div>
      </div>

      {/* Repo name + language */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <GitBranch size={20} className="text-accent" />
          <h1 className="text-2xl sm:text-3xl font-bold">{report.repo_name}</h1>
        </div>
        <span className="inline-block rounded-full bg-accent/10 border border-accent/30 px-3 py-1 text-xs font-semibold text-accent uppercase">
          {report.language}
        </span>
      </div>

      {/* Score + Overview */}
      <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-8 mb-10">
        <ScoreRing score={report.quality_score} />
        <div>
          <h2 className="text-lg font-bold mb-2">Overview</h2>
          <p className="text-text-secondary leading-relaxed">{report.overview}</p>
        </div>
      </div>

      {/* Architecture */}
      <Section title="Architecture Summary">
        <p className="text-text-secondary leading-relaxed">{report.architecture_summary}</p>
      </Section>

      {/* Strengths */}
      <Section title="Strengths">
        <div className="space-y-2">
          {report.strengths.map((s, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-accent" />
              <span className="text-sm text-text-secondary">{s}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* Security Flags */}
      <Section title="Security Flags">
        <SecurityFlags flags={report.security_flags} />
      </Section>

      {/* Recommendations */}
      <Section title="Recommendations">
        <RecommendationList recommendations={report.recommendations} />
      </Section>

      {/* Generated README */}
      <Section title="Generated README">
        <ReadmePreview markdown={report.generated_readme} />
      </Section>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="mb-10">
      <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
        <span className="h-1 w-5 rounded-full bg-accent inline-block" />
        {title}
      </h2>
      {children}
    </div>
  );
}
