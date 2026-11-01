import { getContent } from '@/lib/content';
import { ContentGrid } from '@/components/content-grid';

export default async function HomePage() {
  const items = await getContent();

  return <ContentGrid initialItems={items} />;
}
