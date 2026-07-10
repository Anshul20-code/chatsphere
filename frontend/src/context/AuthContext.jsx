import React, { createContext, useState, useEffect, useContext } from 'react';
import API from '../api/axios';


// Initialize the AuthContext
// This creates a Context object that components can subscribe to for auth state
const AuthContext = createContext(null);

/**
 * AuthProvider component that wraps the entire application.
 * It provides the global authentication state and methods to children.
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);


  // useEffect runs once when the application boots up
  // It checks if a user session is already saved in the browser's localStorage
  useEffect(() => {
    const checkLoggedIn = () => {
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          // If user details exist, parse and load them into our React state
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error('Failed to parse stored user session:', error);
        localStorage.removeItem('user'); // Clear corrupted storage
      } finally {
        // Turn off loading indicator once the check is done
        setLoading(false);
      }
    };

    checkLoggedIn();
  }, []);

  /**
   * Signup function
   * Calls backend register API, saves credentials locally, and updates global state
   */
  const signup = async (username, email, password) => {
    try {
      // POST data to our backend signup route
      const response = await API.post('/api/auth/signup', { username, email, password });
      
      // Destructure data from backend response
      const userData = response.data;
      
      // Save user details (id, username, email, token) to localStorage
      localStorage.setItem('user', JSON.stringify(userData));
      
      // Save details to React state
      setUser(userData);
      return { success: true };
    } catch (error) {
      // Extract error message from API response or fallback to generic message
      const message = error.response?.data?.message || 'Signup failed. Please try again.';
      return { success: false, error: message };
    }
  };

  /**
   * Login function
   * Authenticates email and password, saves token locally, and updates state
   */
  const login = async (email, password) => {
    try {
      // POST data to our backend login route
      const response = await API.post('/api/auth/login', { email, password });
      
      const userData = response.data;
      
      // Save details to localStorage and state
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed. Please verify credentials.';
      return { success: false, error: message };
    }
  };

  /**
   * Logout function
   * Clears state and localStorage, effectively ending the user session
   */
  const logout = () => {
    localStorage.removeItem('user');
    setUser(null);
  };

  // The value prop contains the data/functions that will be accessible to all child components
  const value = {
    user,
    loading,
    login,
    signup,
    logout,
    isAuthenticated: !!user, // Helper boolean indicating if user is authenticated
  };

  return (
    <AuthContext.Provider value={value}>
      {/* Render children only when we have finished checking localStorage */}
      {!loading && children}
    </AuthContext.Provider>
  );
};

/**
 * Custom hook to easily consume the AuthContext in any functional component.
 * Instead of importing AuthContext and useContext everywhere, we can just call: const { user, login } = useAuth();
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
