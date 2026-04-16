import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function ReadmePreview({ markdown }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-lg border border-border bg-bg-secondary">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <span className="text-sm font-semibold text-text-secondary">Generated README.md</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs text-text-secondary hover:text-accent hover:border-accent/40 transition-colors"
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      {/* Content */}
      <div className="p-5 prose prose-invert prose-sm max-w-none prose-headings:text-text-primary prose-p:text-text-secondary prose-a:text-accent prose-code:text-accent prose-code:bg-bg-input prose-code:px-1 prose-code:rounded prose-strong:text-text-primary">
        <ReactMarkdown>{markdown}</ReactMarkdown>
      </div>
    </div>
  );
}
