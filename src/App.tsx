import { ChakraProvider } from '@chakra-ui/react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { SignIn } from './components/auth/SignIn';
import { SignUp } from './components/auth/SignUp';
import { HomeFeed } from './components/feed/HomeFeed';
import { RewardsPage } from './components/rewards/RewardsPage';

const App = () => {
  return (
    <ChakraProvider>
      <Router future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
        <Layout>
          <Routes>
            <Route path="/" element={<HomeFeed />} />
            <Route path="/signin" element={<SignIn />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/rewards" element={<RewardsPage />} />
          </Routes>
        </Layout>
      </Router>
    </ChakraProvider>
  );
}

export default App;
