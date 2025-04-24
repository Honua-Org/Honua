import express from 'express';
import { getLinkPreview } from 'link-preview-js';
import { createClient } from '@supabase/supabase-js';

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
  throw new Error('SUPABASE_URL and SUPABASE_ANON_KEY must be set in .env');
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const router = express.Router();

interface LinkPreview {
  url: string;
  title: string;
  description: string;
  image?: string;
  siteName?: string;
  timestamp: number;
}

interface PreviewResponse {
  url: string;
  title?: string;
  siteName?: string;
  description?: string;
  mediaType: string;
  contentType?: string;
  images: string[];
  videos: Array<{
    url?: string;
    secureUrl?: string;
    type?: string;
    width?: string;
    height?: string;
  }>;
  favicons: string[];
}

// Cache duration in milliseconds (24 hours)
const CACHE_DURATION = 24 * 60 * 60 * 1000;

// Utility function to handle image URL resolution
const resolveImageUrl = (imageUrl: string, baseUrl: string): string => {
  try {
    if (!imageUrl) return '';
    // Handle relative URLs
    if (imageUrl.startsWith('/')) {
      const baseUrlObj = new URL(baseUrl);
      return `${baseUrlObj.protocol}//${baseUrlObj.host}${imageUrl}`;
    }
    // Handle protocol-relative URLs
    if (imageUrl.startsWith('//')) {
      return `https:${imageUrl}`;
    }
    // Return absolute URLs as-is
    return imageUrl;
  } catch {
    return '';
  }
};

// Get link preview with caching
router.get('/preview', async (req, res) => {
  try {
    const { url } = req.query;

    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'URL parameter is required' });
    }

    // Check cache first
    const { data: cachedPreview } = await supabase
      .from('link_previews')
      .select('*')
      .eq('url', url)
      .single();

    // If we have a valid cached preview that's not expired, return it
    if (cachedPreview && Date.now() - cachedPreview.timestamp < CACHE_DURATION) {
      res.setHeader('Content-Type', 'application/json');
      return res.json(cachedPreview);
    }

    // Validate URL format
    let urlObj: URL;
    try {
      urlObj = new URL(url);
    } catch (error) {
      return res.status(400).json({ error: 'Invalid URL format' });
    }

    // Fetch fresh preview with better error handling
    let preview: PreviewResponse;
    try {
      preview = await getLinkPreview(url, {
        headers: {
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9'
        },
        timeout: 15000, // 15 second timeout
        followRedirects: 'error'
      }) as PreviewResponse;

      const linkPreview: LinkPreview = {
        url,
        title: preview.title || urlObj.hostname,
        description: preview.description || '',
        image: preview.images && preview.images.length > 0
          ? resolveImageUrl(preview.images[0], url)
          : undefined,
        siteName: preview.siteName || urlObj.hostname,
        timestamp: Date.now()
      };

      // Update cache
      await supabase
        .from('link_previews')
        .upsert(linkPreview, { onConflict: 'url' });

      res.setHeader('Content-Type', 'application/json');
      return res.json(linkPreview);

    } catch (previewError) {
      console.error('Error fetching link preview:', previewError);
      // Log detailed error information for debugging
      console.log('URL:', url);
      if (previewError instanceof Error) {
        console.log('Error details:', previewError.message);
      }

      // Handle the error gracefully by falling back to basic URL info
      const fallbackPreview: LinkPreview = {
        url,
        title: urlObj.hostname,
        description: '',
        image: undefined,
        siteName: urlObj.hostname,
        timestamp: Date.now()
      };

      res.setHeader('Content-Type', 'application/json');
      return res.json(fallbackPreview);
    }
  } catch (error) {
    console.error('Error in link preview route:', error);
    return res.status(500).json({ error: 'Failed to fetch link preview' });
  }
});

export default router;