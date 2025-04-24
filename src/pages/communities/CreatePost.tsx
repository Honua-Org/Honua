import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Container, Grid, GridItem } from '@chakra-ui/react';
import Navigation from '../../components/Navigation';
import TrendingTopics from '../../components/TrendingTopics';
import { supabase } from '../../lib/supabase';

type PostType = 'text' | 'link' | 'image';

export default function CreatePost() {
  const { communityName } = useParams<{ communityName: string }>();
  const navigate = useNavigate();

  const [postType, setPostType] = useState<PostType>('text');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Get the community ID first
      const { data: communityData, error: communityError } = await supabase
        .from('communities')
        .select('id')
        .eq('name', communityName)
        .single();

      if (communityError) throw communityError;
      if (!communityData) throw new Error('Community not found');

      let mediaUrl: string[] = [];

      // Handle media upload if present
      if (mediaFile && postType === 'image') {
        const fileExt = mediaFile.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `post-media/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('media')
          .upload(filePath, mediaFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('media')
          .getPublicUrl(filePath);

        mediaUrl = [publicUrl];
      }

      // Create the post
      const { error: postError } = await supabase
        .from('posts')
        .insert([
          {
            title,
            content,
            community_id: communityData.id,
            post_type: postType,
            media_url: mediaUrl
          }
        ]);

      if (postError) throw postError;

      // Redirect to the community page
      navigate(`/communities/${communityName}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }
      setMediaFile(file);
    }
  };

  return (
    <Container maxW="container.xl" py={4}>
      <Grid templateColumns={{ base: '1fr', md: '1fr 3fr 1fr' }} gap={6}>
        <GridItem display={{ base: 'none', md: 'block' }}>
          <Box position="sticky" top={4}>
            <Navigation />
          </Box>
        </GridItem>
        <GridItem>
          <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-6">Create a Post</h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => setPostType('text')}
            className={`px-4 py-2 rounded-full ${postType === 'text' ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}
          >
            Text
          </button>
          <button
            onClick={() => setPostType('link')}
            className={`px-4 py-2 rounded-full ${postType === 'link' ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}
          >
            Link
          </button>
          <button
            onClick={() => setPostType('image')}
            className={`px-4 py-2 rounded-full ${postType === 'image' ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}
          >
            Image
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <input
              type="text"
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          {postType === 'text' && (
            <div className="mb-4">
              <textarea
                placeholder="Text (optional)"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500 min-h-[200px]"
              />
            </div>
          )}

          {postType === 'link' && (
            <div className="mb-4">
              <input
                type="url"
                placeholder="URL"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                required
              />
            </div>
          )}

          {postType === 'image' && (
            <div className="mb-4">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                required
              />
              {mediaFile && (
                <img
                  src={URL.createObjectURL(mediaFile)}
                  alt="Preview"
                  className="mt-4 max-h-96 object-contain rounded-lg"
                />
              )}
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className={`px-6 py-2 rounded-full ${loading ? 'bg-gray-400' : 'bg-blue-500 hover:bg-blue-600'} text-white`}
            >
              {loading ? 'Creating...' : 'Create Post'}
            </button>
          </div>
        </form>
          </div>
        </GridItem>
        <GridItem display={{ base: 'none', md: 'block' }}>
          <TrendingTopics />
        </GridItem>
      </Grid>
    </Container>
  );
}