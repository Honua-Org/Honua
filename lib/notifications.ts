import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

type NotificationType = 'like' | 'comment' | 'follow' | 'repost' | 'mention'

interface CreateNotificationParams {
  recipientId: string
  type: NotificationType
  postId?: string
  commentId?: string
  content?: string
}

export async function createNotification(params: CreateNotificationParams) {
  try {
    const response = await fetch('/api/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        recipient_id: params.recipientId,
        type: params.type,
        post_id: params.postId,
        comment_id: params.commentId,
        content: params.content,
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to create notification')
    }

    return await response.json()
  } catch (error) {
    console.error('Error creating notification:', error)
    throw error
  }
}

// Helper functions for specific notification types
export async function notifyLike(postId: string, postAuthorId: string) {
  return createNotification({
    recipientId: postAuthorId,
    type: 'like',
    postId,
    content: 'liked your post'
  })
}

export async function notifyComment(postId: string, postAuthorId: string, commentContent: string) {
  return createNotification({
    recipientId: postAuthorId,
    type: 'comment',
    postId,
    content: 'commented on your post',
  })
}

export async function notifyFollow(followedUserId: string) {
  return createNotification({
    recipientId: followedUserId,
    type: 'follow',
    content: 'started following you'
  })
}

export async function notifyRepost(postId: string, postAuthorId: string) {
  return createNotification({
    recipientId: postAuthorId,
    type: 'repost',
    postId,
    content: 'reposted your post'
  })
}

export async function notifyMention(postId: string, mentionedUserId: string, postContent: string) {
  return createNotification({
    recipientId: mentionedUserId,
    type: 'mention',
    postId,
    content: 'mentioned you in a post'
  })
}

// Function to extract mentions from post content
export function extractMentions(content: string): string[] {
  const mentionRegex = /@([a-zA-Z0-9_]+)/g
  const mentions: string[] = []
  let match

  while ((match = mentionRegex.exec(content)) !== null) {
    mentions.push(match[1]) // Extract username without @
  }

  return [...new Set(mentions)] // Remove duplicates
}

// Function to get user IDs from usernames for mentions
export async function getUserIdsByUsernames(usernames: string[]): Promise<{ [username: string]: string }> {
  if (usernames.length === 0) return {}

  const supabase = createClientComponentClient()
  
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, username')
    .in('username', usernames)

  if (error) {
    console.error('Error fetching user IDs:', error)
    return {}
  }

  const userMap: { [username: string]: string } = {}
  profiles?.forEach(profile => {
    userMap[profile.username] = profile.id
  })

  return userMap
}

// Function to handle mentions in a post
export async function handleMentions(postId: string, content: string) {
  const mentions = extractMentions(content)
  if (mentions.length === 0) return

  const userMap = await getUserIdsByUsernames(mentions)
  
  // Create notifications for each mentioned user
  const notificationPromises = Object.values(userMap).map(userId => 
    notifyMention(postId, userId, content)
  )

  try {
    await Promise.all(notificationPromises)
  } catch (error) {
    console.error('Error creating mention notifications:', error)
  }
}