export interface LinkPreview {
  url: string;
  title: string;
  description: string;
  image?: string;
  siteName?: string;
}

// Backend API endpoint for link previews
const LINK_PREVIEW_API = '/api/link-preview/preview';

export const extractLinkPreviews = async (content: string): Promise<LinkPreview[]> => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const urls = content.match(urlRegex);

  if (!urls) return [];

  const uniqueUrls = Array.from(new Set(urls));

  try {
    const previews = await Promise.all(
      uniqueUrls.map(async (url) => {
        try {
          const response = await fetch(`${LINK_PREVIEW_API}?url=${encodeURIComponent(url)}`, {
            headers: {
              'Accept': 'application/json',
              'Cache-Control': 'no-cache'
            }
          });

          if (!response.ok) {
            // Handle 404 and other error statuses gracefully
            const urlObj = new URL(url);
            const domain = urlObj.hostname;
            const siteName = domain.split('.').slice(-2, -1)[0] || domain;
            const formattedSiteName = siteName.charAt(0).toUpperCase() + siteName.slice(1);
            
            return {
              url,
              title: formattedSiteName,
              description: `Content from ${domain}`,
              image: undefined,
              siteName: domain
            };
          }

          const preview = await response.json();
          if (!preview || typeof preview !== 'object') {
            throw new Error('Invalid preview data structure');
          }

          // Extract domain for better fallback information
          const urlObj = new URL(url);
          const domain = urlObj.hostname;
          const siteName = domain.split('.').slice(-2, -1)[0] || domain;
          const formattedSiteName = siteName.charAt(0).toUpperCase() + siteName.slice(1);

          // Validate and enhance preview data with improved fallbacks
          const validatedPreview: LinkPreview = {
            url: preview.url || url,
            title: preview.title || formattedSiteName,
            description: preview.description || `View content from ${domain}`,
            image: preview.image || undefined,
            siteName: preview.siteName || domain
          };

          // Ensure all required fields have meaningful values
          if (!validatedPreview.title.trim()) {
            validatedPreview.title = formattedSiteName;
          }
          if (!validatedPreview.description.trim()) {
            validatedPreview.description = `View content from ${domain}`;
          }

          return validatedPreview;
        } catch (error) {
          console.error(`Error fetching preview for ${url}:`, error);
          
          try {
            const urlObj = new URL(url);
            const domain = urlObj.hostname;
            const siteName = domain.split('.').slice(-2, -1)[0] || domain;
            const formattedSiteName = siteName.charAt(0).toUpperCase() + siteName.slice(1);
            
            // Return enhanced fallback preview with more meaningful information
            return {
              url,
              title: formattedSiteName,
              description: `Content preview from ${domain}`,
              image: undefined,
              siteName: domain
            };
          } catch (urlError) {
            console.error(`Invalid URL format: ${url}`, urlError);
            return null;
          }
        }
      })
    );

    return previews.filter((preview: LinkPreview | null): preview is LinkPreview => preview !== null);
  } catch (error) {
    console.error('Error extracting link previews:', error);
    return [];
  }
};