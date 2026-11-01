import Parser from 'rss-parser';

export type ContentType = 'all' | 'news' | 'video' | 'github';

export type ContentItem = {
  id: string;
  title: string;
  url: string;
  description: string;
  source: string;
  type: Exclude<ContentType, 'all'>;
  publishedAt: string;
};

const RSS_SOURCES = [
  { type: 'news' as const, label: 'Hacker News', url: 'https://hnrss.org/frontpage' },
  { type: 'news' as const, label: 'Reddit /r/programming', url: 'https://www.reddit.com/r/programming/.rss' },
  { type: 'news' as const, label: 'TechCrunch', url: 'https://techcrunch.com/feed/' },
  { type: 'video' as const, label: 'Google Developers', url: 'https://www.youtube.com/feeds/videos.xml?channel_id=UC_x5XG1OV2P6uZZ5FSM9Ttw' }
];

const parser = new Parser();

function getFallbackDescription(type: Exclude<ContentType, 'all'>) {
  if (type === 'github') return 'Trending repository from GitHub.';
  if (type === 'video') return 'Latest video update from a creator channel.';
  return 'Fresh story from the latest feeds.';
}

async function fetchRssSource(source: { type: 'news' | 'video'; label: string; url: string }) {
  try {
    const feed = await parser.parseURL(source.url);
    return (feed.items || []).slice(0, 5).map((item) => ({
      id: item.link || `${source.label}-${item.title}`,
      title: item.title || 'Untitled item',
      url: item.link || '#',
      description: item.contentSnippet || item.content || getFallbackDescription(source.type),
      source: source.label,
      type: source.type,
      publishedAt: item.isoDate || new Date().toISOString()
    }));
  } catch (error) {
    console.error(`Failed to load feed ${source.url}:`, error);
    return [];
  }
}

async function fetchGitHubTrending() {
  try {
    const response = await fetch('https://api.github.com/search/repositories?q=stars:>1000&sort=stars&order=desc&per_page=6', {
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
      description: repo.description || 'Open source project on GitHub.',
      source: 'GitHub Trending',
      type: 'github' as const,
      publishedAt: repo.updated_at || new Date().toISOString()
    }));
  } catch (error) {
    console.error('Failed to load GitHub trending:', error);
    return [
      {
        id: 'github-demo-1',
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
    Promise.all(RSS_SOURCES.map(fetchRssSource)),
    fetchGitHubTrending()
  ]);

  const items = [...rssResults.flat(), ...githubResults].sort((a, b) => {
    const dateA = new Date(a.publishedAt).getTime();
    const dateB = new Date(b.publishedAt).getTime();
    return dateB - dateA;
  });

  return items.slice(0, 24);
}
