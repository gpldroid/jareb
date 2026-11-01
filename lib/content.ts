import Parser from 'rss-parser';

export type ContentType = 'news' | 'programming' | 'video' | 'github' | 'ai';

export type ContentItem = {
  id: string;
  title: string;
  url: string;
  description: string;
  source: string;
  type: ContentType;
  publishedAt: string;
};

const CUSTOM_RSS_SOURCES = [
  { type: 'news' as const, label: 'Hacker News', url: 'https://hnrss.org/frontpage' },
  { type: 'programming' as const, label: 'Lobsters', url: 'https://lobste.rs/rss' },
  { type: 'programming' as const, label: 'GitHub Blog', url: 'https://github.blog/feed/' },
  { type: 'ai' as const, label: 'Google AI Blog', url: 'https://ai.googleblog.com/feeds/posts/default?alt=rss' },
  { type: 'ai' as const, label: 'OpenAI Blog', url: 'https://openai.com/news/rss/' },
  { type: 'ai' as const, label: 'Anthropic', url: 'https://www.anthropic.com/news/feed' },
  { type: 'video' as const, label: 'Google Developers', url: 'https://www.youtube.com/feeds/videos.xml?channel_id=UC_x5XG1OV2P6uZZ5FSM9Ttw' },
  { type: 'video' as const, label: 'FreeCodeCamp', url: 'https://www.youtube.com/feeds/videos.xml?channel_id=UC8butISFwT-Wl7EV0hUK0BQ' },
  { type: 'programming' as const, label: 'InfoQ', url: 'https://feed.infoq.com/' }
];

const parser = new Parser();

function normalizeType(type: ContentType): ContentType {
  return type;
}

function getFallbackDescription(type: ContentType) {
  if (type === 'github') return 'Trending repository from GitHub.';
  if (type === 'video') return 'Latest video from a developer channel.';
  if (type === 'ai') return 'Latest AI news and product updates.';
  if (type === 'programming') return 'Latest programming and engineering updates.';
  return 'Fresh stories from the latest sources.';
}

async function fetchRssSource(source: { type: ContentType; label: string; url: string }) {
  try {
    const feed = await parser.parseURL(source.url);
    return (feed.items || []).slice(0, 5).map((item) => ({
      id: `${source.label}-${item.link || item.title || Math.random().toString(16)}`,
      title: item.title || 'Untitled item',
      url: item.link || '#',
      description: item.contentSnippet || item.content || getFallbackDescription(source.type),
      source: source.label,
      type: normalizeType(source.type),
      publishedAt: item.isoDate || new Date().toISOString()
    }));
  } catch (error) {
    console.error(`Failed to load feed ${source.url}:`, error);
    return [];
  }
}

async function fetchGitHubTrending() {
  try {
    const response = await fetch('https://api.github.com/search/repositories?q=programming+OR+ai+stars:>1000&sort=stars&order=desc&per_page=6', {
      headers: {
        'User-Agent': 'Jareb-Content-Hub'
      },
      next: { revalidate: 3600 }
    });

    if (!response.ok) {
      throw new Error('GitHub API request failed');
    }

    const json = await response.json();
    return (json.items || []).map((repo: any) => ({
      id: repo.full_name,
      title: repo.full_name,
      url: repo.html_url,
      description: repo.description || 'Popular open source project.',
      source: 'GitHub Trending',
      type: 'github' as const,
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
        type: 'github' as const,
        publishedAt: new Date().toISOString()
      }
    ];
  }
}

export async function getContent(): Promise<ContentItem[]> {
  const [rssResults, githubResults] = await Promise.all([
    Promise.all(CUSTOM_RSS_SOURCES.map(fetchRssSource)),
    fetchGitHubTrending()
  ]);

  const items = [...rssResults.flat(), ...githubResults].sort((a, b) => {
    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
  });

  return items.slice(0, 30);
}

export type { ContentType };
