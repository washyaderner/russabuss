import { createClient, type Entry, type Asset } from 'contentful';
import { documentToHtmlString } from '@contentful/rich-text-html-renderer';

// TypeScript interface for Blog Post
export interface BlogPost {
  title: string;
  slug: string;
  publishDate: string;
  excerpt: string;
  content: any; // rich text from Contentful
  featuredImage?: {
    url: string;
    title: string;
  };
}

// Check if Contentful credentials are available
const hasCredentials = () => {
  const spaceId = process.env.CONTENTFUL_SPACE_ID || import.meta.env.PUBLIC_CONTENTFUL_SPACE_ID;
  const accessToken = process.env.CONTENTFUL_ACCESS_TOKEN || import.meta.env.PUBLIC_CONTENTFUL_ACCESS_TOKEN;
  return !!(spaceId && accessToken);
};

// Create Contentful client with credentials
const createContentfulClient = () => {
  const spaceId = process.env.CONTENTFUL_SPACE_ID || import.meta.env.PUBLIC_CONTENTFUL_SPACE_ID || '';
  const accessToken = process.env.CONTENTFUL_ACCESS_TOKEN || import.meta.env.PUBLIC_CONTENTFUL_ACCESS_TOKEN || '';

  if (!spaceId || !accessToken) {
    console.warn('[Contentful] Missing credentials. Blog will show placeholder content.');
    return null;
  }

  try {
    return createClient({
      space: spaceId,
      accessToken: accessToken
    });
  } catch (error) {
    console.error('[Contentful] Error creating client:', error);
    return null;
  }
};

const client = createContentfulClient();

// Transform Contentful entry to BlogPost interface
const transformPost = (entry: Entry<any>): BlogPost | null => {
  try {
    const fields = entry.fields;

    return {
      title: fields.title || 'Untitled',
      slug: fields.slug || '',
      publishDate: fields.publishDate || entry.sys.createdAt,
      excerpt: fields.excerpt || '',
      content: fields.content || null,
      featuredImage: fields.featuredImage ? {
        url: `https:${(fields.featuredImage as Asset).fields.file?.url}`,
        title: (fields.featuredImage as Asset).fields.title || ''
      } : undefined
    };
  } catch (error) {
    console.error('[Contentful] Error transforming post:', error);
    return null;
  }
};

// Get all blog posts sorted by publish date (newest first)
export async function getAllPosts(): Promise<BlogPost[]> {
  if (!hasCredentials() || !client) {
    console.warn('[Contentful] No credentials configured. Returning empty array.');
    return [];
  }

  try {
    const response = await client.getEntries({
      content_type: 'blogPost',
      order: ['-fields.publishDate']
    });

    const posts = response.items
      .map(transformPost)
      .filter((post): post is BlogPost => post !== null);

    return posts;
  } catch (error) {
    console.error('[Contentful] Error fetching posts:', error);
    return [];
  }
}

// Get a single blog post by slug
export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  if (!hasCredentials() || !client) {
    console.warn('[Contentful] No credentials configured. Returning null.');
    return null;
  }

  try {
    const response = await client.getEntries({
      content_type: 'blogPost',
      'fields.slug': slug,
      limit: 1
    });

    if (response.items.length === 0) {
      return null;
    }

    return transformPost(response.items[0]);
  } catch (error) {
    console.error('[Contentful] Error fetching post by slug:', error);
    return null;
  }
}

// Convert Contentful rich text to HTML string
export function renderRichText(richText: any): string {
  if (!richText) {
    return '';
  }

  try {
    return documentToHtmlString(richText);
  } catch (error) {
    console.error('[Contentful] Error rendering rich text:', error);
    return '<p>Error rendering content.</p>';
  }
}
