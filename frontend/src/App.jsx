import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Import Pages
import Login from './pages/Login';
import Signup from './pages/Signup';
import Chat from './pages/Chat';

/**
 * Guard Component for Protected Routes.
 * If the user is authenticated, it allows entry to the requested screen.
 * Otherwise, it redirects them to the login page.
 */
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    // If not authenticated, redirect to /login
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

/**
 * Guard Component for Public Routes (like Login and Signup).
 * Prevents logged-in users from accessing credentials forms.
 * If they are logged in, it redirects them to the chat screen.
 */
const PublicRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  
  if (isAuthenticated) {
    // If already logged in, redirect to /chat
    return <Navigate to="/chat" replace />;
  }
  
  return children;
};

function App() {
  return (
    <Routes>
      {/* Public routes (Only accessible when NOT logged in) */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/signup"
        element={
          <PublicRoute>
            <Signup />
          </PublicRoute>
        }
      />

      {/* Protected routes (Only accessible when LOGGED in) */}
      <Route
        path="/chat"
        element={
          <ProtectedRoute>
            <Chat />
          </ProtectedRoute>
        }
      />

      {/* Catch-all route: redirects to /chat (which redirects to /login if unauthenticated) */}
      <Route path="*" element={<Navigate to="/chat" replace />} />
    </Routes>
  );
}

export default App;
