import axios from 'axios';

export default async function handler(req, res) {
  const testUrl = 'https://api.github.com/repos/Maxwelltebi/TorchAI';
  try {
    const response = await axios.get(testUrl, {
      headers: { Accept: 'application/vnd.github.v3+json' }
    });
    return res.status(200).json({
      github_status: response.status,
      repo: response.data.full_name,
      private: response.data.private,
      env_check: {
        has_gemini_key: !!process.env.GEMINI_API_KEY,
        has_github_token: !!process.env.GITHUB_TOKEN,
      }
    });
  } catch (err) {
    return res.status(500).json({
      error: err.message,
      status: err.response?.status,
      data: err.response?.data
    });
  }
}
