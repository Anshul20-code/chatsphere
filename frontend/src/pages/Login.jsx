import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, Eye, EyeOff, Loader2, MessageSquare } from 'lucide-react';

const Login = () => {
  // Access the login state from AuthContext
  const { login } = useAuth();
  const navigate = useNavigate();

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // UX states (loading indicators and server errors)
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Form validation and submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(''); // Clear past errors

    // Simple client-side validation check
    if (!email || !password) {
      setErrorMessage('Please fill in all fields.');
      return;
    }

    setIsSubmitting(true);
    
    // Call the global login function
    const result = await login(email, password);
    
    if (result.success) {
      // Redirect authenticated user to the placeholder chat route
      navigate('/chat');
    } else {
      // Display error message sent from server
      setErrorMessage(result.error);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 px-4 py-8">
      {/* Centered card with premium styling: dark theme glassmorphism, shadows, border */}
      <div className="w-full max-w-md bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl shadow-2xl p-8 transition-all duration-300 hover:shadow-indigo-500/10">
        
        {/* Brand Logo and Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="p-3 bg-indigo-600/15 rounded-2xl mb-3 text-indigo-400 border border-indigo-500/20">
            {/* Using Lucide icon for logo */}
            <MessageSquare size={32} className="animate-pulse" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Chat<span className="text-indigo-400">Sphere</span>
          </h1>
          <p className="text-slate-400 text-sm mt-2 text-center">
            Sign in to start messaging in real-time
          </p>
        </div>

        {/* Display backend/validation error message if it exists */}
        {errorMessage && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl animate-shake">
            {errorMessage}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email Input Group */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2" htmlFor="email">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                <Mail size={18} />
              </span>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-10 pr-4 py-3 bg-slate-950/50 border border-slate-800 rounded-xl text-white placeholder-slate-500 outline-none transition-all duration-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Password Input Group */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2" htmlFor="password">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                <Lock size={18} />
              </span>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-3 bg-slate-950/50 border border-slate-800 rounded-xl text-white placeholder-slate-500 outline-none transition-all duration-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
              {/* Show/Hide password toggle button */}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-xl shadow-lg hover:from-blue-500 hover:to-indigo-500 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-75 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Redirect Link to Signup page */}
        <div className="mt-8 text-center text-sm text-slate-400">
          Don't have an account?{' '}
          <Link
            to="/signup"
            className="text-indigo-400 hover:text-indigo-300 hover:underline font-medium transition-colors"
          >
            Sign up
          </Link>
        </div>

      </div>
    </div>
  );
};

export default Login;
