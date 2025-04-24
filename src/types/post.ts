export interface Author {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string;
}

export interface Post {
  id: string;
  content: string;
  user_id: string;
  author: Author;
  likes_count: number;
  reposts_count: number;
  comments_count: number;
  media_urls?: string[];
  created_at: string;
  updated_at: string;
  timestamp: string;
}

export interface PostProps extends Post {
  onLike?: (postId: string) => void;
  onRepost?: (postId: string) => void;
  onComment?: (postId: string) => void;
  onShare?: (postId: string) => void;
}