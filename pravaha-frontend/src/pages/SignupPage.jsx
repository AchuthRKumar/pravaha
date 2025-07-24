import React, { useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { FcGoogle } from 'react-icons/fc'; // Import Google icon

const SignupPage = () => {
  const emailRef = useRef();
  const passwordRef = useRef();
  const passwordConfirmRef = useRef();
  const { signup, signInWithGoogle } = useAuth(); // Get signup and signInWithGoogle
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (passwordRef.current.value !== passwordConfirmRef.current.value) {
      return setError('Passwords do not match');
    }

    setError('');

    try {
      setLoading(true);
      await signup(emailRef.current.value, passwordRef.current.value);
      navigate('/feed');
    } catch (firebaseError) {
      console.error('Signup failed:', firebaseError);
      let errorMessage = 'Failed to create an account.';
      if (firebaseError.code === 'auth/email-already-in-use') {
        errorMessage = 'Email already in use. Please log in or use a different email.';
      } else if (firebaseError.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak. Please use at least 6 characters.';
      } else if (firebaseError.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address.';
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // New: Handle Google Sign-in for signup
  const handleGoogleSignIn = async () => {
    setError('');
    try {
      setLoading(true);
      await signInWithGoogle();
      navigate('/feed');
    } catch (googleError) {
      console.error('Google Sign-in failed:', googleError);
      if (googleError.code === 'auth/popup-closed-by-user') {
        setError('Google sign-up cancelled.');
      } else if (googleError.code === 'auth/cancelled-popup-request') {
        setError('Another sign-up attempt is already in progress.');
      } else {
        setError('Failed to sign up with Google. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-180px)] px-4">
      <div className="w-full max-w-md p-8 space-y-6 bg-gray-900 rounded-lg shadow-xl border border-gray-700/50">
        <h2 className="text-3xl font-bold text-white text-center">Sign Up</h2>
        {error && <div className="p-3 text-red-200 bg-red-800 rounded-md text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              ref={emailRef}
              required
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
              Password
            </label>
            <input
              type="password"
              id="password"
              ref={passwordRef}
              required
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500"
              placeholder="••••••••"
            />
          </div>
          <div>
            <label htmlFor="password-confirm" className="block text-sm font-medium text-gray-300 mb-1">
              Confirm Password
            </label>
            <input
              type="password"
              id="password-confirm"
              ref={passwordConfirmRef}
              required
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
          >
            {loading ? 'Signing Up...' : 'Sign Up'}
          </button>
        </form>

        {/* OR Divider */}
        <div className="relative flex items-center py-5">
          <div className="flex-grow border-t border-gray-700"></div>
          <span className="flex-shrink mx-4 text-gray-400 text-sm">OR</span>
          <div className="flex-grow border-t border-gray-700"></div>
        </div>

        {/* Google Sign-up Button */}
        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-700 rounded-md text-white bg-gray-800 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-600 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
        >
          <FcGoogle className="text-xl" /> Sign up with Google
        </button>

        <div className="text-center text-sm text-gray-400 mt-4">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-400 hover:underline">
            Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;