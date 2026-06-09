import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import ProtectedRoute, { PublicRoute } from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import BoardsPage from './pages/BoardsPage';
import BoardPage from './pages/BoardPage';
import EmailSettings from './pages/EmailSettings';

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

export default function App() {
  const app = (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/boards" element={<ProtectedRoute><BoardsPage /></ProtectedRoute>} />
        <Route path="/board/:id" element={<ProtectedRoute><BoardPage /></ProtectedRoute>} />
        <Route path="/settings/email" element={<ProtectedRoute><EmailSettings /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );

  if (googleClientId) {
    return <GoogleOAuthProvider clientId={googleClientId}>{app}</GoogleOAuthProvider>;
  }

  return app;
}
