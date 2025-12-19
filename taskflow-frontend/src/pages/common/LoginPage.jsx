import React from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { FaSignInAlt, FaEye, FaEyeSlash } from 'react-icons/fa';
import { useState } from 'react';

/**
 * @desc Redesigned Login Page component with Dark Mode.
 */
const LoginPage = () => {
  const { register: formRegister, handleSubmit, formState: { errors, isSubmitting } } = useForm();
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  // Define reusable Tailwind classes for inputs
  const inputClass = "appearance-none relative block w-full px-4 py-3 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-lg shadow-sm placeholder-slate-400 dark:placeholder-slate-400 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 sm:text-sm";
  const errorClass = "mt-1 text-sm text-red-600";
  const labelClass = "block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1";

  // Redirect if already authenticated
  if (isAuthenticated) {
    if (user.role === 'admin') return <Navigate to="/admin/dashboard" />;
    if (user.role === 'provider') return <Navigate to="/provider/dashboard" />;
    return <Navigate to="/customer/dashboard" />;
  }

  const onSubmit = async (data) => {
    try {
      await login(data);
      // Don't manually navigate - let the component re-render with the updated user state
      // The isAuthenticated check at the top of the component will handle the redirect
    } catch (error) {
      // Error is already handled and toasted by AuthContext
    }
  };

  return (
    // Use the global light/dark background
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 p-10 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-800 dark:text-white">
            Sign in to TaskFlow
          </h2>
          <p className="mt-2 text-center text-sm text-slate-600 dark:text-slate-300">
            Don't have an account?{' '}
            <Link to="/register" className="font-medium text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-500 transition duration-300">
              Register here
            </Link>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>

          {/* Email Input */}
          <div>
            <label htmlFor="email" className={labelClass}>Email address</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              className={inputClass}
              placeholder="Email address"
              {...formRegister('email', { required: 'Email is required', pattern: { value: /^\S+@\S+$/i, message: "Invalid email format" } })}
            />
            {errors.email && <p className={errorClass}>{errors.email.message}</p>}
          </div>

          {/* Password Input */}
          <div>
            <label htmlFor="password" className={labelClass}>Password</label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                className={inputClass}
                placeholder="Password"
                {...formRegister('password', { required: 'Password is required' })}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 cursor-pointer focus:outline-none"
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            {errors.password && <p className={errorClass}>{errors.password.message}</p>}
          </div>

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-base font-semibold rounded-lg text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50 transition duration-300 ease-in-out"
            >
              <FaSignInAlt className='mr-2 mt-0.5' /> {isSubmitting ? 'Signing In...' : 'Sign In'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;