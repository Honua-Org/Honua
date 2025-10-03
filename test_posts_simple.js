async function testPostsAPI() {
  console.log('=== TESTING POSTS API ===');
  
  try {
    const response = await fetch('http://localhost:3000/api/posts');
    
    if (!response.ok) {
      console.error('❌ API request failed:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Error response:', errorText);
      return;
    }
    
    const posts = await response.json();
    console.log('✅ API request successful');
    console.log('Number of posts:', posts.length);
    
    if (posts.length > 0) {
      const firstPost = posts[0];
      console.log('\n=== FIRST POST STRUCTURE ===');
      console.log('Post ID:', firstPost.id);
      console.log('Content:', firstPost.content?.substring(0, 50) + '...');
      console.log('User object:', JSON.stringify(firstPost.user, null, 2));
      console.log('Profiles object:', JSON.stringify(firstPost.profiles, null, 2));
      console.log('Avatar URL from user:', firstPost.user?.avatar_url);
      console.log('Avatar URL from profiles:', firstPost.profiles?.avatar_url);
      
      console.log('\n=== CHECKING ALL POSTS FOR AVATAR URLS ===');
      posts.forEach((post, index) => {
        const hasUserAvatar = post.user?.avatar_url;
        const hasProfilesAvatar = post.profiles?.avatar_url;
        console.log(`Post ${index + 1}: user.avatar_url=${hasUserAvatar ? '✅' : '❌'}, profiles.avatar_url=${hasProfilesAvatar ? '✅' : '❌'}`);
      });
    } else {
      console.log('❌ No posts found');
    }
    
  } catch (error) {
    console.error('❌ Error testing posts API:', error);
  }
}

testPostsAPI();