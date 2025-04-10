import { getLinkPreview } from 'link-preview-js';

export interface LinkPreview {
  url: string;
  title: string;
  description: string;
  image?: string;
  siteName?: string;
}

export const extractLinkPreviews = async (content: string): Promise<LinkPreview[]> => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const urls = content.match(urlRegex);

  if (!urls) return [];

  const uniqueUrls = Array.from(new Set(urls));

  try {
    const previews = await Promise.all(
      uniqueUrls.map(async (url) => {
        try {
          const preview = await getLinkPreview(url, {
            headers: {
              'user-agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'
            }
          });
          
          if ('title' in preview) {
            return {
              url,
              title: preview.title || '',
              description: preview.description || '',
              image: Array.isArray(preview.images) && preview.images.length > 0 ? preview.images[0] : undefined,
              siteName: preview.siteName
            } as LinkPreview;
          }
          
          // Handle fallback case for minimal metadata
          return {
            url,
            title: url,
            description: '',
            image: undefined,
            siteName: undefined
          };
        } catch (error) {
          console.error(`Error fetching preview for ${url}:`, error);
          return null;
        }
      })
    );

    return previews.filter((preview): preview is LinkPreview => preview !== null);
  } catch (error) {
    console.error('Error extracting link previews:', error);
    return [];
  }
};