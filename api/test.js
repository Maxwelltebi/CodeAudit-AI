import axios from 'axios';

export default async function handler(req, res) {
  const owner = 'Maxwelltebi';
  const repo = 'TorchAI';
  const token = process.env.GITHUB_TOKEN || null;
  const headers = { Accept: 'application/vnd.github.v3+json' };
  if (token) headers.Authorization = `token ${token}`;

  const results = {};

  // Test 1: repo metadata
  try {
    const r = await axios.get(`https://api.github.com/repos/${owner}/${repo}`, { headers });
    results.metadata = { status: r.status, name: r.data.full_name, branch: r.data.default_branch };
  } catch (err) {
    results.metadata = { error: err.message, status: err.response?.status };
  }

  // Test 2: tree
  try {
    const branch = results.metadata?.branch || 'main';
    const r = await axios.get(`https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`, { headers });
    results.tree = { status: r.status, file_count: r.data.tree?.length };
  } catch (err) {
    results.tree = { error: err.message, status: err.response?.status };
  }

  results.env = {
    has_gemini_key: !!process.env.GEMINI_API_KEY,
    has_github_token: !!process.env.GITHUB_TOKEN,
    token_prefix: token ? token.substring(0, 10) + '...' : null
  };

  return res.status(200).json(results);
}
