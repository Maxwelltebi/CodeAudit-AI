import axios from 'axios';
import { z } from 'zod';
import OpenAI from 'openai';

// ============================================
// CONFIGURATION
// ============================================
const GITHUB_API = 'https://api.github.com';

const MAX_FILES_TO_ANALYZE = 10;
const MAX_FILE_SIZE_BYTES = 100 * 1024; // 100KB per file
const MAX_TOTAL_CHARS = 25000;          // Total char budget for prompt
const FUNCTION_TIMEOUT_MS = 25000;      // Hard timeout for the whole function

const BINARY_EXTENSIONS = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.webp',
  '.woff', '.woff2', '.ttf', '.eot',
  '.pdf', '.zip', '.tar', '.gz', '.rar',
  '.exe', '.bin', '.dll', '.so', '.dylib',
  '.lock', '.min.js', '.min.css',
  '.map', '.mp4', '.mp3', '.wav', '.mov'
]);

// ============================================
// ZOD SCHEMA — matches original doc spec
// ============================================
const AnalysisSchema = z.object({
  overview: z.string().min(10),
  language: z.string().min(1),
  quality_score: z.number().min(0).max(10),
  architecture_summary: z.string().min(20),
  strengths: z.array(z.string()).max(10),
  security_flags: z.array(z.object({
    severity: z.enum(['high', 'medium', 'low']),
    title: z.string(),
    file: z.string().nullable(),
    description: z.string(),
    fix: z.string()
  })).max(15),
  recommendations: z.array(z.object({
    priority: z.enum(['high', 'medium', 'low']),
    title: z.string(),
    description: z.string(),
    file: z.string().nullable()
  })).max(15),
  generated_readme: z.string().min(50)
});

// ============================================
// UTILITY FUNCTIONS
// ============================================

function withTimeout(promise, ms, timeoutError) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(timeoutError)), ms)
    )
  ]);
}

async function retry(fn, retries = 3, delayMs = 1000) {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 0) throw error;
    // Don't retry client errors (4xx) except 429 (rate limit)
    const status = error.response?.status;
    if (status >= 400 && status < 500 && status !== 429) {
      throw error;
    }
    await new Promise(res => setTimeout(res, delayMs));
    return retry(fn, retries - 1, delayMs * 2);
  }
}

function isBinaryOrIgnored(filePath) {
  const lower = filePath.toLowerCase();
  for (const ext of BINARY_EXTENSIONS) {
    if (lower.endsWith(ext)) return true;
  }
  return false;
}

function truncate(str, maxLength) {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength - 50) + '\n\n... [TRUNCATED] ...\n';
}

function githubHeaders(token) {
  const headers = { Accept: 'application/vnd.github.v3+json' };
  if (token) headers.Authorization = `token ${token}`;
  return headers;
}

// ============================================
// FILE SELECTION
// ============================================

const PRIORITY_PATTERNS = [
  /^README\./i,
  /^package\.json$/,
  /^requirements\.txt$/,
  /^pyproject\.toml$/,
  /^go\.mod$/,
  /^Cargo\.toml$/,
  /^src\/.*\.(js|ts|jsx|tsx|py|java|go|rs)$/,
  /^app\/.*\.(js|ts|jsx|tsx|py)$/,
  /^index\.(js|ts|jsx|tsx|html|py)$/,
  /^main\.(js|ts|py|java|go|rs)$/,
  /^server\.(js|ts)$/,
  /^app\.(js|ts|jsx|tsx|py)$/,
  /\.config\.(js|ts|json)$/,
  /^Dockerfile$/i,
  /^\.env\.example$/
];

function selectKeyFiles(tree) {
  return tree
    .filter(f => f.type === 'blob')
    .filter(f => !isBinaryOrIgnored(f.path))
    .filter(f => f.size < MAX_FILE_SIZE_BYTES)
    .map(f => {
      let score = 0;
      // Root-level files get a boost
      if (f.path.split('/').length === 1) score += 10;

      PRIORITY_PATTERNS.forEach((pattern, i) => {
        if (pattern.test(f.path)) {
          score += (PRIORITY_PATTERNS.length - i) * 5;
        }
      });

      // Entry point name boost
      if (['index', 'main', 'app', 'server'].some(n => f.path.includes(n))) {
        score += 3;
      }

      return { ...f, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_FILES_TO_ANALYZE);
}

// ============================================
// FILE CONTENT FETCHING
// ============================================

async function fetchFileContents(files, owner, repo, token) {
  const results = [];
  let totalChars = 0;

  for (const file of files) {
    if (totalChars >= MAX_TOTAL_CHARS) break;

    try {
      const res = await axios.get(
        `${GITHUB_API}/repos/${owner}/${repo}/contents/${file.path}`,
        { headers: githubHeaders(token), timeout: 5000 }
      );

      if (res.data.content) {
        const content = Buffer.from(res.data.content, 'base64').toString('utf-8');
        const remaining = MAX_TOTAL_CHARS - totalChars;
        const truncated = truncate(content, remaining);

        results.push({ path: file.path, content: truncated });
        totalChars += truncated.length;
      }
    } catch (err) {
      console.warn(`Failed to fetch ${file.path}: ${err.message}`);
    }
  }

  return results;
}

// ============================================
// GEMINI PROMPT & CALL
// ============================================

function buildPrompt(repoUrl, tree, files) {
  const treeStructure = tree
    .filter(f => f.type === 'tree' || f.path.split('/').length <= 3)
    .slice(0, 60)
    .map(f => `${f.type === 'tree' ? '[dir]' : '[file]'} ${f.path}`)
    .join('\n');

  const filesContext = files
    .map(f => `=== ${f.path} ===\n${f.content}\n=== END ${f.path} ===`)
    .join('\n\n');

  return `You are performing a deep, actionable code audit of a GitHub repository. Analyze the code carefully and provide specific, file-level findings that a developer can act on immediately.

REPOSITORY: ${repoUrl}

FILE TREE (showing project structure):
${treeStructure}

FILE CONTENTS (key files):
${filesContext}

INSTRUCTIONS:
- Be a HARSH but fair auditor. Dig deep into every file for issues.
- Reference SPECIFIC files and approximate line numbers where possible
- The quality_score MUST be consistent with the number and severity of issues found. If you find multiple security issues or major gaps, the score should reflect that (e.g., 3-5 security flags with medium/high severity should NOT result in a 7+ score)
- Find AT LEAST 3-5 security flags and 5-8 recommendations for any non-trivial project
- For strengths, point to specific patterns or files that demonstrate good practices
- The overview should mention the tech stack, purpose, and overall architecture quality
- The architecture_summary should describe how components connect, data flows, and any design patterns used
- The generated_readme should be comprehensive with install instructions, usage, and tech stack

Return this exact JSON structure:
{
  "overview": "3-4 sentence project description covering purpose, tech stack, and overall quality assessment",
  "language": "primary programming language",
  "quality_score": 7.4,
  "architecture_summary": "Detailed paragraph about code organization, design patterns, component relationships, and data flow. Reference specific directories and files.",
  "strengths": [
    "Specific strength referencing file or pattern (3-5 items)"
  ],
  "security_flags": [
    {
      "severity": "high|medium|low",
      "title": "Short title of the issue, e.g.: 'SQL Injection in User Query'",
      "file": "exact/file/path.js",
      "description": "A detailed 2-4 sentence explanation of what the vulnerability is, why it's dangerous, and what could happen if exploited. Reference specific code patterns you saw in the file. For example: 'In api/users.js around line 24, user-supplied input from req.body.username is concatenated directly into the SQL query string without parameterization. An attacker could inject malicious SQL to dump the entire users table or bypass authentication.'",
      "fix": "Concrete step-by-step fix: 'Replace the string concatenation with parameterized queries using db.query(\"SELECT * FROM users WHERE name = $1\", [username]). Additionally, add input validation using a library like zod or joi to sanitize the username field before it reaches the database layer.'"
    }
  ],
  "recommendations": [
    {
      "priority": "high|medium|low",
      "title": "Short title, e.g.: 'Add Request Validation Middleware'",
      "description": "2-4 sentence explanation of what's missing, why it matters, and exactly how to implement it. Reference specific files. For example: 'The API routes in api/routes.js accept POST requests without any body validation. This means malformed or malicious payloads reach the business logic layer unchecked. Add a validation middleware using zod schemas — create a schemas/ directory with one schema per endpoint, and apply them as middleware before each route handler.'",
      "file": "exact/file/path.js or null"
    }
  ],
  "generated_readme": "# Project Name\\n\\nFull markdown README with: description, features, tech stack, installation, usage, API docs (if applicable), contributing guidelines, and license section"
}

SCORING RULES (quality_score):
  - Start at 10, subtract points for each issue found:
    - Each HIGH severity security flag: -1.0
    - Each MEDIUM severity security flag: -0.5
    - Each HIGH priority recommendation: -0.5
    - No tests: -1.0, No CI/CD: -0.5, No docs: -0.5, No .env handling: -0.3
  - Minimum score: 0. The score MUST reflect the issues — do NOT give a high score if many issues exist.

IMPORTANT: Shallow one-liner findings are NOT acceptable. Every security flag must have a detailed description AND a concrete fix. Every recommendation must explain the problem and the solution in detail.`;
}

async function callAI(prompt, apiKey) {
  const client = new OpenAI({
    apiKey,
    baseURL: 'https://api.groq.com/openai/v1'
  });

  const response = await withTimeout(
    client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: 'You are an expert senior software engineer performing a code audit. Return ONLY valid JSON — no markdown, no explanation, no preamble, no code fences.'
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 8192,
      response_format: { type: 'json_object' }
    }),
    30000,
    'AI API request timed out'
  );

  const text = response.choices?.[0]?.message?.content;
  if (!text) throw new Error('Empty response from AI');

  try {
    return JSON.parse(text.trim());
  } catch {
    throw new Error('AI returned invalid JSON');
  }
}

// ============================================
// ERROR HANDLER
// ============================================

function handleApiError(error, res) {
  // Log full error for Vercel function logs
  console.error('API Error:', {
    message: error.message,
    name: error.name,
    status: error.status,
    responseStatus: error.response?.status,
    stack: error.stack
  });

  if (error.message?.includes('timed out')) {
    return res.status(504).json({
      error: 'Analysis timed out. The repository might be too large or the AI service is busy.'
    });
  }

  // OpenAI SDK errors (used by GLM) have error.status directly
  const status = error.status || error.response?.status;

  if (status) {
    if (status === 401 || status === 403) {
      return res.status(403).json({
        error: 'Access forbidden. Check API keys, token permissions, or repo visibility.'
      });
    }
    if (status === 404) {
      return res.status(404).json({
        error: 'Repository not found. Check the URL and ensure the repository is public.'
      });
    }
    if (status === 429) {
      return res.status(429).json({
        error: 'Rate limit exceeded. Please wait a moment and try again.'
      });
    }
    if (status >= 500) {
      return res.status(502).json({
        error: 'Upstream service unavailable. Please try again later.'
      });
    }
  }

  if (error.message?.includes('AI') || error.message?.includes('Empty response')) {
    return res.status(502).json({
      error: 'AI analysis failed. The model may be overloaded or the input was invalid.'
    });
  }

  if (error instanceof z.ZodError) {
    console.error('Validation failed:', error.errors);
    return res.status(500).json({
      error: 'AI returned malformed data. Please try again.'
    });
  }

  return res.status(500).json({
    error: `An unexpected error occurred: ${error.message || 'Unknown error'}`
  });
}

// ============================================
// MAIN HANDLER
// ============================================

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  const { url } = req.body;
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid url in request body.' });
  }

  const repoMatch = url.replace(/\.git$/, '').replace(/\/+$/, '').match(
    /github\.com\/([^\/]+)\/([^\/]+)/
  );
  if (!repoMatch) {
    return res.status(400).json({
      error: 'Invalid GitHub URL format. Expected: https://github.com/owner/repo'
    });
  }

  const owner = repoMatch[1];
  const repo = repoMatch[2];
  console.log('Analyzing repository:', { owner, repo, url });

  const githubToken = process.env.GITHUB_TOKEN || null;
  const aiApiKey = process.env.GROQ_API_KEY;

  if (!aiApiKey) {
    console.error('Missing GROQ_API_KEY environment variable');
    return res.status(500).json({ error: 'Server configuration error.' });
  }

  try {
    // Step A: Fetch repo metadata to get default branch
    let repoInfo;
    try {
      repoInfo = await withTimeout(
        retry(() => axios.get(`${GITHUB_API}/repos/${owner}/${repo}`, {
          headers: githubHeaders(githubToken)
        })),
        5000,
        'GitHub repo metadata request timed out'
      );
    } catch (err) {
      const status = err.response?.status;
      console.error('GitHub API error (repo metadata):', { status, message: err.message, owner, repo, hasToken: !!githubToken });
      if (status === 401 || status === 403) return res.status(403).json({ error: 'GitHub access forbidden. Check your GITHUB_TOKEN permissions.' });
      if (status === 404) return res.status(404).json({ error: `Repository "${owner}/${repo}" not found on GitHub. Verify the URL is correct and the repo is public.` });
      if (status === 429) return res.status(429).json({ error: 'GitHub rate limit exceeded. Please wait and try again.' });
      throw err;
    }

    const defaultBranch = repoInfo.data.default_branch;

    if (repoInfo.data.private) {
      return res.status(403).json({
        error: 'Cannot analyze private repositories.'
      });
    }

    // Step B: Fetch file tree
    const treeRes = await withTimeout(
      retry(() => axios.get(
        `${GITHUB_API}/repos/${owner}/${repo}/git/trees/${defaultBranch}?recursive=1`,
        { headers: githubHeaders(githubToken) }
      )),
      10000,
      'GitHub tree request timed out'
    );

    const tree = treeRes.data.tree;
    if (!tree || tree.length === 0) {
      return res.status(404).json({
        error: 'Repository appears to be empty.'
      });
    }

    // Step C: Select key files
    const selectedFiles = selectKeyFiles(tree);

    // Step D: Fetch file contents
    const filesContent = await fetchFileContents(selectedFiles, owner, repo, githubToken);

    if (filesContent.length === 0) {
      return res.status(422).json({
        error: 'Could not fetch any analyzable files from the repository.'
      });
    }

    // Step E: Build prompt & call Gemini
    const prompt = buildPrompt(`${owner}/${repo}`, tree, filesContent);
    let rawAnalysis;
    try {
      rawAnalysis = await callAI(prompt, aiApiKey);
    } catch (err) {
      const status = err.status || err.response?.status;
      console.error('AI API error:', status, err.message);
      if (status === 401 || status === 403) return res.status(403).json({ error: 'Groq API key rejected. Check your GROQ_API_KEY on Vercel.' });
      if (status === 429) return res.status(429).json({ error: 'AI rate limit exceeded. Please wait and try again.' });
      if (status >= 500) return res.status(502).json({ error: 'AI service is down. Please try again later.' });
      throw err;
    }

    // Step F: Validate & return
    const analysis = AnalysisSchema.parse(rawAnalysis);

    return res.status(200).json({
      ...analysis,
      repo_name: `${owner}/${repo}`,
      files_analyzed: filesContent.length,
      analyzed_at: new Date().toISOString()
    });

  } catch (error) {
    return handleApiError(error, res);
  }
}
