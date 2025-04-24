import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { ForumPostWithAuthor, CommentWithReplies } from '../../types/forum';

export default function Post() {
  const { communityName, postId } = useParams<{ communityName: string; postId: string }>();
  const [post, setPost] = useState<ForumPostWithAuthor | null>(null);
  const [comments, setComments] = useState<CommentWithReplies[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userVote, setUserVote] = useState<1 | -1 | null>(null);

  useEffect(() => {
    if (postId) {
      fetchPost();
      fetchComments();
      checkUserVote();
    }
  }, [postId]);

  const fetchPost = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*, author:author_id(username), community:community_id(name)')
        .eq('id', postId)
        .single();

      if (error) throw error;
      setPost(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Post not found');
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          author:author_id(username)
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Organize comments into a tree structure
      const commentTree = buildCommentTree(data || []);
      setComments(commentTree);
    } catch (err) {
      console.error('Error fetching comments:', err);
    }
  };

  const buildCommentTree = (flatComments: CommentWithReplies[]): CommentWithReplies[] => {
    const commentMap = new Map<string, CommentWithReplies>();
    const rootComments: CommentWithReplies[] = [];

    // First pass: create a map of all comments
    flatComments.forEach(comment => {
      commentMap.set(comment.id, { ...comment, replies: [] });
    });

    // Second pass: build the tree structure
    flatComments.forEach(comment => {
      const commentWithReplies = commentMap.get(comment.id)!;
      if (comment.parent_id) {
        const parent = commentMap.get(comment.parent_id);
        if (parent) {
          parent.replies = parent.replies || [];
          parent.replies.push(commentWithReplies);
        }
      } else {
        rootComments.push(commentWithReplies);
      }
    });

    return rootComments;
  };

  const checkUserVote = async () => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) return;

      const { data, error } = await supabase
        .from('post_votes')
        .select('vote_type')
        .eq('post_id', postId)
        .eq('user_id', session.session.user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setUserVote(data?.vote_type || null);
    } catch (err) {
      console.error('Error checking user vote:', err);
    }
  };

  const handleVote = async (voteType: 1 | -1) => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        setError('Please sign in to vote');
        return;
      }

      if (userVote === voteType) {
        // Remove vote if clicking the same button
        await supabase
          .from('post_votes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', session.session.user.id);
        setUserVote(null);
      } else {
        // Upsert vote
        const { error } = await supabase
          .from('post_votes')
          .upsert({
            post_id: postId,
            user_id: session.session.user.id,
            vote_type: voteType
          });

        if (error) throw error;
        setUserVote(voteType);
      }

      // Refresh post to update karma score
      fetchPost();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to vote');
    }
  };

  const handleSubmitComment = async (parentId?: string) => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        setError('Please sign in to comment');
        return;
      }

      const { error } = await supabase
        .from('comments')
        .insert([
          {
            content: newComment,
            post_id: postId,
            parent_id: parentId
          }
        ]);

      if (error) throw error;

      setNewComment('');
      fetchComments(); // Refresh comments
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to post comment');
    }
  };

  const renderComment = (comment: CommentWithReplies, depth = 0) => (
    <div
      key={comment.id}
      className={`pl-${depth * 4} py-4 border-l-2 border-gray-100`}
    >
      <div className="flex items-start space-x-2">
        <div className="flex-1">
          <div className="text-sm text-gray-500">
            {comment.author?.username} • {new Date(comment.created_at).toLocaleDateString()}
          </div>
          <div className="mt-1">{comment.content}</div>
          <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
            <button className="hover:text-blue-500">Reply</button>
            <div className="flex items-center space-x-1">
              <button className="hover:text-blue-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              </button>
              <span>{comment.karma_score}</span>
              <button className="hover:text-red-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
      {comment.replies?.map(reply => renderComment(reply, depth + 1))}
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500">{error || 'Post not found'}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Post */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-start space-x-4">
            <div className="flex flex-col items-center space-y-1">
              <button
                onClick={() => handleVote(1)}
                className={`text-gray-500 hover:text-blue-500 ${userVote === 1 ? 'text-blue-500' : ''}`}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              </button>
              <span className="text-sm font-semibold">{post.karma_score}</span>
              <button
                onClick={() => handleVote(-1)}
                className={`text-gray-500 hover:text-red-500 ${userVote === -1 ? 'text-red-500' : ''}`}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-semibold">{post.title}</h1>
              <div className="mt-2 text-sm text-gray-500">
                Posted by {post.author?.username} in{' '}
                <Link to={`/communities/${communityName}`} className="text-blue-500 hover:underline">
                  {communityName}
                </Link>{' '}
                • {new Date(post.created_at).toLocaleDateString()}
              </div>
              {post.content && (
                <p className="mt-4 text-gray-700">{post.content}</p>
              )}
              {post.media_url && post.media_url.length > 0 && (
                <div className="mt-4">
                  <img
                    src={post.media_url[0]}
                    alt="Post media"
                    className="max-h-96 object-contain rounded-lg"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Comment Form */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Add a Comment</h2>
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="What are your thoughts?"
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500 min-h-[100px]"
          />
          <div className="mt-4 flex justify-end">
            <button
              onClick={() => handleSubmitComment()}
              className="px-6 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600"
            >
              Comment
            </button>
          </div>
        </div>

        {/* Comments */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4">{post.comment_count} Comments</h2>
          <div className="space-y-4">
            {comments.map(comment => renderComment(comment))}
          </div>
        </div>
      </div>
    </div>
  );
}