import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ChakraProvider } from '@chakra-ui/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { theme } from './lib/theme';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import MainFeed from './pages/MainFeed';
import Profile from './pages/Profile';
import Messages from './pages/Messages';
import Settings from './pages/Settings';
import Explore from './pages/Explore';
import Bookmarks from './pages/Bookmarks';
import Notifications from './pages/Notifications';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProfileEdit from './pages/ProfileEdit';
import AuthCallback from './pages/auth/AuthCallback';
import Communities from './pages/communities/Communities';
import Community from './pages/communities/Community';
import CreateCommunity from './pages/communities/CreateCommunity';
import CreatePost from './pages/communities/CreatePost';
import Post from './pages/communities/Post';
import SinglePost from './pages/SinglePost';
import VerifyEmail from './pages/auth/VerifyEmail';

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/feed" replace /> : <Login />} />
        <Route path="/register" element={user ? <Navigate to="/feed" replace /> : <Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/feed" element={!user ? <Navigate to="/login" replace /> : <MainFeed />} />
        <Route path="/profile/edit" element={!user ? <Navigate to="/login" replace /> : <ProfileEdit />} />
        <Route path="/profile" element={!user ? <Navigate to="/login" replace /> : <Profile />} />
        <Route path="/:username" element={!user ? <Navigate to="/login" replace /> : <Profile />} />
        <Route path="/messages" element={!user ? <Navigate to="/login" replace /> : <Messages />} />
        <Route path="/settings" element={!user ? <Navigate to="/login" replace /> : <Settings />} />
        <Route path="/explore" element={!user ? <Navigate to="/login" replace /> : <Explore />} />
        <Route path="/bookmarks" element={!user ? <Navigate to="/login" replace /> : <Bookmarks />} />
        <Route path="/notifications" element={!user ? <Navigate to="/login" replace /> : <Notifications />} />
        <Route path="/profile/edit" element={!user ? <Navigate to="/login" replace /> : <ProfileEdit />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/communities" element={!user ? <Navigate to="/login" replace /> : <Communities />} />
        <Route path="/communities/create" element={!user ? <Navigate to="/login" replace /> : <CreateCommunity />} />
        <Route path="/communities/:communityName" element={!user ? <Navigate to="/login" replace /> : <Community />} />
        <Route path="/communities/:communityName/submit" element={!user ? <Navigate to="/login" replace /> : <CreatePost />} />
        <Route path="/communities/:communityName/posts/:postId" element={!user ? <Navigate to="/login" replace /> : <Post />} />
        <Route path="/post/:id" element={<SinglePost />} />
        <Route path="/:username/post/:id" element={<SinglePost />} />
        <Route path="/" element={user ? <Navigate to="/feed" replace /> : <Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ChakraProvider theme={theme}>
          <AppRoutes />
        </ChakraProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}