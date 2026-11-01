import Parser from 'rss-parser';

export type ContentType = 'news' | 'programming' | 'ai' | 'video' | 'github';

export type ContentItem = {
  id: string;
  title: string;
  url: string;
  description: string;
  source: string;
  type: ContentType;
  publishedAt: string;
};

export type CustomSource = {
  id: string;
  label: string;
  url: string;
  type: ContentType;
};

const DEFAULT_SOURCES: Array<{ type: ContentType; label: string; url: string }> = [
  { type: 'news', label: 'Hacker News', url: 'https://hnrss.org/frontpage' },
  { type: 'programming', label: 'Lobsters', url: 'https://lobste.rs/rss' },
  { type: 'programming', label: 'GitHub Blog', url: 'https://github.blog/feed/' },
  { type: 'ai', label: 'Google AI Blog', url: 'https://ai.googleblog.com/feeds/posts/default?alt=rss' },
  { type: 'ai', label: 'OpenAI Blog', url: 'https://openai.com/news/rss/' },
  { type: 'ai', label: 'Anthropic', url: 'https://www.anthropic.com/news/feed' },
  { type: 'video', label: 'Google Developers', url: 'https://www.youtube.com/feeds/videos.xml?channel_id=UC_x5XG1OV2P6uZZ5FSM9Ttw' },
  { type: 'video', label: 'FreeCodeCamp', url: 'https://www.youtube.com/feeds/videos.xml?channel_id=UC8butISFwT-Wl7EV0hUK0BQ' },
  { type: 'programming', label: 'InfoQ', url: 'https://feed.infoq.com/' }
];

const parser = new Parser();

const FALLBACK_DESCRIPTIONS: Record<ContentType, string> = {
  news: 'Fresh stories and updates from the latest sources.',
  programming: 'Latest programming updates and engineering insight.',
  ai: 'Latest AI news, product updates, and research highlights.',
  video: 'Latest developer video highlights and tutorials.',
  github: 'Open-source projects and trending repositories.'
};

export function getStoredCustomSources(): CustomSource[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = localStorage.getItem('jareb-custom-sources');
    return raw ? (JSON.parse(raw) as CustomSource[]) : [];
  } catch {
    return [];
  }
}

export function saveCustomSources(items: CustomSource[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('jareb-custom-sources', JSON.stringify(items));
}

async function fetchSource(source: { type: ContentType; label: string; url: string }) {
  try {
    const feed = await parser.parseURL(source.url);
    return (feed.items || []).slice(0, 5).map((item) => ({
      id: `${source.label}-${item.link || item.title || Math.random().toString(16)}`,
      title: item.title || 'Untitled item',
      url: item.link || '#',
      description: item.contentSnippet || item.content || FALLBACK_DESCRIPTIONS[source.type],
      source: source.label,
      type: source.type,
      publishedAt: item.isoDate || new Date().toISOString()
    }));
  } catch (error) {
    console.error(`Failed to load feed ${source.url}:`, error);
    return [];
  }
}

async function fetchGitHubTrending(): Promise<ContentItem[]> {
  try {
    const response = await fetch('https://api.github.com/search/repositories?q=programming+OR+ai+stars:>1000&sort=stars&order=desc&per_page=6', {
      headers: { 'User-Agent': 'Jareb-Content-Hub' },
      next: { revalidate: 3600 }
    });

    if (!response.ok) throw new Error('GitHub API request failed');

    const json = await response.json();
    return (json.items || []).map((repo: any) => ({
      id: repo.full_name,
      title: repo.full_name,
      url: repo.html_url,
      description: repo.description || 'Popular open source project.',
      source: 'GitHub Trending',
      type: 'github',
      publishedAt: repo.updated_at || new Date().toISOString()
    }));
  } catch (error) {
    console.error('Failed to load GitHub trending:', error);
    return [
      {
        id: 'public-apis/public-apis',
        title: 'public-apis/public-apis',
        url: 'https://github.com/public-apis/public-apis',
        description: 'A collective list of free APIs for use in software and development projects.',
        source: 'GitHub Trending',
        type: 'github',
        publishedAt: new Date().toISOString()
      }
    ];
  }
}

export async function getContent(): Promise<ContentItem[]> {
  const rssResults = await Promise.all(DEFAULT_SOURCES.map(fetchSource));
  const githubResults = await fetchGitHubTrending();

  const items = [...rssResults.flat(), ...githubResults].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );

  return items.slice(0, 30);
}
