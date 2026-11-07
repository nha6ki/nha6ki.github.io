export interface Article {
  id?: number;
  title: string;
  description?: string;
  url: string;
  cover_image?: string | null;
  social_image?: string | null;
  published_at?: string;
  reading_time_minutes?: number;
  tag_list?: string[] | string;
  tags?: string;
}

export function validUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null;

  try {
    const url = new URL(value);
    return url.protocol === 'https:' ? url.href : null;
  } catch {
    return null;
  }
}

function isArticle(value: unknown): value is Article {
  if (!value || typeof value !== 'object') return false;

  const item = value as Record<string, unknown>;
  const url = validUrl(item.url);

  return (
    typeof item.title === 'string' &&
    url !== null &&
    new URL(url).hostname === 'dev.to'
  );
}

// DEV.to's username-filtered API can serve a stale CDN response.
// The author RSS feed supplies recent posts that are not in that response yet.
async function fetchFeedArticles(): Promise<Article[]> {
  const response = await fetch('https://dev.to/feed/nha6ki', {
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`DEV.to RSS returned ${response.status}`);
  }

  const xml = new DOMParser().parseFromString(
    await response.text(),
    'application/xml'
  );

  if (xml.getElementsByTagName('parsererror').length > 0) {
    throw new Error('Invalid DEV.to RSS response');
  }

  const field = (element: Element, tag: string): string =>
    element.getElementsByTagName(tag)[0]?.textContent?.trim() ?? '';

  return Array.from(xml.getElementsByTagName('item'))
    .map((item): Article | null => {
      const title = field(item, 'title');
      const url = field(item, 'link');
      const rawDate = field(item, 'pubDate');
      const date = Date.parse(rawDate);
      const rawDescription = field(item, 'description');
      const description = new DOMParser()
        .parseFromString(rawDescription, 'text/html')
        .body.textContent?.replace(/\s+/g, ' ').trim().slice(0, 260) ?? '';
      const tag_list = Array.from(item.getElementsByTagName('category'))
        .map(category => category.textContent?.trim() ?? '')
        .filter(Boolean);

      const enclosure = Array.from(item.getElementsByTagName('enclosure'))
        .find(element => (element.getAttribute('type') ?? '').startsWith('image/'));
      const cover_image = enclosure?.getAttribute('url') ?? null;

      const article: Article = {
        title,
        url,
        description,
        tag_list,
        cover_image,
        ...(Number.isFinite(date)
          ? { published_at: new Date(date).toISOString() }
          : {}),
      };

      return isArticle(article) ? article : null;
    })
    .filter((article): article is Article => article !== null);
}

async function fetchApiArticles(all: boolean, pageSize: number): Promise<Article[]> {
  const results: Article[] = [];
  const perPage = all ? 100 : pageSize;
  let page = 1;

  while (true) {
    const url = new URL('https://dev.to/api/articles');
    url.searchParams.set('username', 'nha6ki');
    url.searchParams.set('per_page', String(perPage));
    url.searchParams.set('page', String(page));

    const response = await fetch(url, {
      cache: 'no-store',
      headers: { Accept: 'application/vnd.forem.api-v1+json' },
    });

    if (!response.ok) {
      throw new Error(`DEV.to API returned ${response.status}`);
    }

    const data: unknown = await response.json();
    if (!Array.isArray(data)) {
      throw new Error('Invalid DEV.to API response');
    }

    results.push(...data.filter(isArticle));
    if (!all || data.length < perPage) break;
    page += 1;
  }

  return results;
}

export async function fetchArticles(all: boolean, pageSize: number): Promise<Article[]> {
  const [rssResult, apiResult] = await Promise.allSettled([
    fetchFeedArticles(),
    fetchApiArticles(all, pageSize),
  ]);

  if (rssResult.status === 'rejected') {
    console.warn('DEV.to RSS unavailable:', rssResult.reason);
  }
  if (apiResult.status === 'rejected') {
    console.warn('DEV.to API unavailable:', apiResult.reason);
  }
  if (rssResult.status === 'rejected' && apiResult.status === 'rejected') {
    throw new Error('Both DEV.to data sources are unavailable');
  }

  const combined = new Map<string, Article>();
  // RSS first: API entries overwrite matches with richer metadata.
  for (const article of rssResult.status === 'fulfilled' ? rssResult.value : []) {
    combined.set(article.url.replace(/\/$/, ''), article);
  }
  for (const article of apiResult.status === 'fulfilled' ? apiResult.value : []) {
    const key = article.url.replace(/\/$/, '');
    const rssArticle = combined.get(key);
    combined.set(key, rssArticle ? {
      ...rssArticle,
      ...article,
      // RSS can still provide a missing image or description.
      cover_image: article.cover_image || rssArticle.cover_image,
      description: article.description || rssArticle.description,
    } : article);
  }

  const articles = Array.from(combined.values())
    .sort((a, b) =>
      (Date.parse(b.published_at ?? '') || 0) -
      (Date.parse(a.published_at ?? '') || 0)
    )
    .slice(0, all ? undefined : pageSize);

  // Refresh the latest six articles and fill missing images.
  // Individual article responses may be fresher than the list API.
  return Promise.all(articles.map(async (article, index) => {
    const hasImage =
      validUrl(article.cover_image) || validUrl(article.social_image);
    if (index >= 6 && hasImage) return article;

    const parts = new URL(article.url).pathname.split('/').filter(Boolean);
    if (parts.length !== 2) return article;

    const detailUrl =
      `https://dev.to/api/articles/${encodeURIComponent(parts[0])}/${encodeURIComponent(parts[1])}`;

    try {
      const response = await fetch(detailUrl, { cache: 'no-store' });
      if (!response.ok) return article;

      const detail: unknown = await response.json();
      if (!isArticle(detail)) return article;

      if (new URL(detail.url).pathname !== new URL(article.url).pathname) {
        return article;
      }

      return {
        ...article,
        cover_image: detail.cover_image === undefined
          ? article.cover_image : detail.cover_image,
        social_image: detail.social_image === undefined
          ? article.social_image : detail.social_image,
      };
    } catch (error) {
      console.warn('DEV.to article detail unavailable:', article.url, error);
      return article;
    }
  }));
}
