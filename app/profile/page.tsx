import Parser from 'rss-parser';
import { NextRequest, NextResponse } from 'next/server';

const parser = new Parser();

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');
  const type = request.nextUrl.searchParams.get('type') || 'programming';
  const label = request.nextUrl.searchParams.get('label') || 'Custom Source';

  if (!url) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
  }

  try {
    const feed = await parser.parseURL(url);
    const items = (feed.items || []).slice(0, 8).map((item) => ({
      id: `${label}-${item.link || item.title || Math.random().toString(16)}`,
      title: item.title || 'Untitled item',
      url: item.link || '#',
      description: item.contentSnippet || item.content || 'Latest content from the selected source.',
      source: label,
      type,
      publishedAt: item.isoDate || new Date().toISOString()
    }));

    return NextResponse.json(items);
  } catch (error) {
    console.error('RSS API error:', error);
    return NextResponse.json([], { status: 200 });
  }
}
