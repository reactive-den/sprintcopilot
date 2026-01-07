import { llm } from './llm';
import { retryWithBackoff } from './errors';
import { REPO_ANALYSIS_PROMPT } from './langgraph/prompts';
import type { RepoAnalysis } from '@/types';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import * as fs from 'node:fs/promises';
import type { Dirent } from 'node:fs';
import path from 'node:path';
import os from 'node:os';

type ParsedRepo = {
  owner: string;
  repo: string;
  url: string;
};

type RepoSnapshot = {
  repo: {
    name: string;
    description: string | null;
    defaultBranch: string;
    topics: string[];
    openIssues: number;
    stars: number;
    forks: number;
    license: string | null;
  };
  languages: Record<string, number>;
  topLevel: string[];
  recentCommits: string[];
  readmeExcerpt: string;
};

const MAX_README_CHARS = 3000;
const MAX_COMMITS = 10;
const MAX_FILE_SCAN = 600;

const execFileAsync = promisify(execFile);

export function parseGitHubRepoUrl(input: string): ParsedRepo | null {
  const match = input.match(
    /github\.com[:/]([^/\s]+)\/([^/\s#]+?)(?:\.git)?(?:[\/\s#]|$)/i
  );

  const owner = match?.[1];
  const repo = match?.[2];

  if (!owner || !repo) {
    return null;
  }

  const normalizedRepo = repo.replace(/\.git$/i, '');
  return {
    owner,
    repo: normalizedRepo,
    url: `https://github.com/${owner}/${normalizedRepo}`,
  };
}

export function formatRepoAnalysisForPrompt(analysis?: RepoAnalysis): string {
  if (!analysis) {
    return 'No repository analysis available.';
  }

  if (analysis.status !== 'available') {
    return analysis.message || 'Repository analysis unavailable.';
  }

  const sections = [
    analysis.summary ? `Summary: ${analysis.summary}` : undefined,
    analysis.alignment?.length ? `Alignment: ${analysis.alignment.join('; ')}` : undefined,
    analysis.gaps?.length ? `Gaps: ${analysis.gaps.join('; ')}` : undefined,
    analysis.overEngineering?.length
      ? `Over-engineering: ${analysis.overEngineering.join('; ')}`
      : undefined,
    analysis.codingPractices?.strengths?.length
      ? `Coding strengths: ${analysis.codingPractices.strengths.join('; ')}`
      : undefined,
    analysis.codingPractices?.weaknesses?.length
      ? `Coding weaknesses: ${analysis.codingPractices.weaknesses.join('; ')}`
      : undefined,
    analysis.risks?.length ? `Risks: ${analysis.risks.join('; ')}` : undefined,
    analysis.recommendations?.length
      ? `Recommendations: ${analysis.recommendations.join('; ')}`
      : undefined,
  ].filter(Boolean);

  return sections.join('\n');
}

export async function generateRepoAnalysis(input: {
  repoUrl: string;
  title: string;
  problem: string;
  constraints?: string;
  scope?: string;
}): Promise<{ analysis: RepoAnalysis; tokensUsed: number }> {
  const parsed = parseGitHubRepoUrl(input.repoUrl);
  if (!parsed) {
    return {
      analysis: {
        status: 'failed',
        repoUrl: input.repoUrl,
        message: 'Invalid GitHub repository URL.',
      },
      tokensUsed: 0,
    };
  }

  try {
    const snapshot = await fetchRepoSnapshot(parsed);
    const prompt = REPO_ANALYSIS_PROMPT.replace('{title}', input.title)
      .replace('{scope}', input.scope || 'Not specified')
      .replace('{problem}', input.problem)
      .replace('{constraints}', input.constraints || 'None')
      .replace('{repoSnapshot}', JSON.stringify(snapshot, null, 2));

    const response = await retryWithBackoff(async () => {
      return await llm.invoke(prompt);
    });

    const content =
      typeof response.content === 'string' ? response.content : JSON.stringify(response.content);

    const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? jsonMatch[1] || jsonMatch[0] : content;
    const parsedAnalysis = JSON.parse(jsonStr) as Omit<RepoAnalysis, 'status'>;

    const tokensUsed = response.response_metadata?.tokenUsage?.totalTokens || 0;

    return {
      analysis: {
        status: 'available',
        repoUrl: parsed.url,
        repoName: snapshot.repo.name,
        summary: parsedAnalysis.summary,
        alignment: parsedAnalysis.alignment || [],
        gaps: parsedAnalysis.gaps || [],
        overEngineering: parsedAnalysis.overEngineering || [],
        codingPractices: parsedAnalysis.codingPractices || { strengths: [], weaknesses: [] },
        risks: parsedAnalysis.risks || [],
        recommendations: parsedAnalysis.recommendations || [],
        evidence: {
          languages: snapshot.languages,
          topLevel: snapshot.topLevel,
          recentCommits: snapshot.recentCommits,
          readmeExcerpt: snapshot.readmeExcerpt,
        },
      },
      tokensUsed,
    };
  } catch (error) {
    return {
      analysis: {
        status: 'failed',
        repoUrl: parsed.url,
        message: error instanceof Error ? error.message : 'Repository analysis failed.',
      },
      tokensUsed: 0,
    };
  }
}

async function fetchRepoSnapshot(parsed: ParsedRepo): Promise<RepoSnapshot> {
  try {
    const headers = buildGitHubHeaders();

    const repoResponse = await fetch(
      `https://api.github.com/repos/${parsed.owner}/${parsed.repo}`,
      { headers }
    );

    if (!repoResponse.ok) {
      throw new Error(`GitHub repo lookup failed (${repoResponse.status}).`);
    }

    const repoData = await repoResponse.json();

    const [languages, readmeExcerpt, topLevel, recentCommits] = await Promise.all([
      fetchRepoLanguages(parsed, headers),
      fetchRepoReadme(parsed, headers),
      fetchRepoTopLevel(parsed, headers),
      fetchRepoCommits(parsed, headers),
    ]);

    return {
      repo: {
        name: repoData.full_name || parsed.repo,
        description: repoData.description,
        defaultBranch: repoData.default_branch,
        topics: Array.isArray(repoData.topics) ? repoData.topics : [],
        openIssues: repoData.open_issues_count || 0,
        stars: repoData.stargazers_count || 0,
        forks: repoData.forks_count || 0,
        license: repoData.license?.name || null,
      },
      languages,
      topLevel,
      recentCommits,
      readmeExcerpt,
    };
  } catch (error) {
    return await fetchRepoSnapshotFromClone(parsed, error instanceof Error ? error.message : null);
  }
}

async function fetchRepoLanguages(parsed: ParsedRepo, headers: HeadersInit): Promise<Record<string, number>> {
  const response = await fetch(
    `https://api.github.com/repos/${parsed.owner}/${parsed.repo}/languages`,
    { headers }
  );

  if (!response.ok) {
    return {};
  }

  return (await response.json()) as Record<string, number>;
}

async function fetchRepoReadme(parsed: ParsedRepo, headers: HeadersInit): Promise<string> {
  const response = await fetch(
    `https://api.github.com/repos/${parsed.owner}/${parsed.repo}/readme`,
    {
      headers: {
        ...headers,
        Accept: 'application/vnd.github.raw',
      },
    }
  );

  if (!response.ok) {
    return 'README not available.';
  }

  const text = await response.text();
  return text.slice(0, MAX_README_CHARS);
}

async function fetchRepoTopLevel(parsed: ParsedRepo, headers: HeadersInit): Promise<string[]> {
  const response = await fetch(
    `https://api.github.com/repos/${parsed.owner}/${parsed.repo}/contents`,
    { headers }
  );

  if (!response.ok) {
    return [];
  }

  const data = await response.json();
  if (!Array.isArray(data)) {
    return [];
  }

  return data
    .map((item) => (item && typeof item.name === 'string' ? item.name : null))
    .filter(Boolean) as string[];
}

async function fetchRepoCommits(parsed: ParsedRepo, headers: HeadersInit): Promise<string[]> {
  const response = await fetch(
    `https://api.github.com/repos/${parsed.owner}/${parsed.repo}/commits?per_page=${MAX_COMMITS}`,
    { headers }
  );

  if (!response.ok) {
    return [];
  }

  const data = await response.json();
  if (!Array.isArray(data)) {
    return [];
  }

  return data
    .map((item) => {
      const message = item?.commit?.message;
      const author = item?.commit?.author?.name;
      if (typeof message === 'string' && typeof author === 'string') {
        return `${message.split('\n')[0]} (by ${author})`;
      }
      if (typeof message === 'string') {
        return message.split('\n')[0];
      }
      return null;
    })
    .filter(Boolean) as string[];
}

function buildGitHubHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    'User-Agent': 'sprintcopilot',
    Accept: 'application/vnd.github+json',
  };

  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  return headers;
}

async function fetchRepoSnapshotFromClone(
  parsed: ParsedRepo,
  apiError: string | null
): Promise<RepoSnapshot> {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sprintcopilot-repo-'));

  try {
    await execFileAsync('git', ['clone', '--depth', '1', parsed.url, tempDir], {
      timeout: 120000,
    });

    const [topLevel, readmeExcerpt, recentCommits, languages] = await Promise.all([
      safeReadTopLevel(tempDir),
      safeReadReadme(tempDir),
      safeReadCommits(tempDir),
      safeCollectLanguages(tempDir),
    ]);

    return {
      repo: {
        name: `${parsed.owner}/${parsed.repo}`,
        description: apiError ? `GitHub API unavailable: ${apiError}` : null,
        defaultBranch: 'main',
        topics: [],
        openIssues: 0,
        stars: 0,
        forks: 0,
        license: null,
      },
      languages,
      topLevel,
      recentCommits,
      readmeExcerpt,
    };
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
}

async function safeReadTopLevel(repoPath: string): Promise<string[]> {
  try {
    const entries = await fs.readdir(repoPath, { withFileTypes: true });
    return entries
      .filter((entry) => entry.name !== '.git')
      .map((entry) => entry.name);
  } catch {
    return [];
  }
}

async function safeReadReadme(repoPath: string): Promise<string> {
  try {
    const entries = await fs.readdir(repoPath);
    const readmeName = entries.find((entry) => /^readme/i.test(entry));
    if (!readmeName) {
      return 'README not available.';
    }
    const content = await fs.readFile(path.join(repoPath, readmeName), 'utf8');
    return content.slice(0, MAX_README_CHARS);
  } catch {
    return 'README not available.';
  }
}

async function safeReadCommits(repoPath: string): Promise<string[]> {
  try {
    const { stdout } = await execFileAsync(
      'git',
      ['log', `-n`, `${MAX_COMMITS}`, '--pretty=format:%s'],
      { cwd: repoPath, timeout: 60000 }
    );
    return stdout.split('\n').filter(Boolean);
  } catch {
    return [];
  }
}

async function safeCollectLanguages(repoPath: string): Promise<Record<string, number>> {
  const languageCounts: Record<string, number> = {};
  let scanned = 0;

  const walk = async (dir: string) => {
    if (scanned >= MAX_FILE_SCAN) return;
    let entries: Dirent[];
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      if (scanned >= MAX_FILE_SCAN) break;
      if (entry.name === '.git' || entry.name === 'node_modules' || entry.name.startsWith('.')) {
        continue;
      }
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(fullPath);
      } else {
        scanned += 1;
        const ext = path.extname(entry.name).toLowerCase() || 'unknown';
        languageCounts[ext] = (languageCounts[ext] || 0) + 1;
      }
    }
  };

  await walk(repoPath);
  return languageCounts;
}
