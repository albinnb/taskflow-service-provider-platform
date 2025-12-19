import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link, Navigate, useSearchParams } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { FaUserPlus, FaEye, FaEyeSlash } from 'react-icons/fa';

/**
 * @desc Redesigned Registration Page component with Dark Mode.
 */
const RegisterPage = () => {
  const [searchParams] = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const defaultRole = searchParams.get('role') || 'customer';

  const { register: formRegister, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm({
    defaultValues: { role: defaultRole }
  });

  const { register, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  // Define reusable Tailwind classes
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
      await register(data);
      // Don't manually navigate - let the component re-render with the updated user state
      // The isAuthenticated check at the top of the component will handle the redirect
    } catch (error) {
      // Error handled by toast in AuthContext
    }
  };

  const selectedRole = watch('role');

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 p-10 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-800 dark:text-white">
            Create your TaskFlow account
          </h2>
          <p className="mt-2 text-center text-sm text-slate-600 dark:text-slate-300">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-500 transition duration-300">
              Sign in
            </Link>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>

          {/* Role Selection */}
          <div className="flex justify-center space-x-4">
            <label className={`cursor-pointer border-2 rounded-lg p-3 w-1/2 text-center font-medium transition duration-300 ${selectedRole === 'customer' ? 'border-teal-600 bg-teal-50 dark:bg-teal-900 dark:text-teal-300 text-teal-700 shadow-sm' : 'border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:border-slate-400 dark:hover:border-slate-500'}`}>
              <input
                type="radio"
                value="customer"
                {...formRegister('role')}
                className="hidden"
              />
              I'm a Customer
            </label>
            <label className={`cursor-pointer border-2 rounded-lg p-3 w-1/2 text-center font-medium transition duration-300 ${selectedRole === 'provider' ? 'border-teal-600 bg-teal-50 dark:bg-teal-900 dark:text-teal-300 text-teal-700 shadow-sm' : 'border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:border-slate-400 dark:hover:border-slate-500'}`}>
              <input
                type="radio"
                value="provider"
                {...formRegister('role')}
                className="hidden"
              />
              I'm a Tasker
            </label>
          </div>

          {/* Name Input */}
          <div>
            <label htmlFor="name" className={labelClass}>Full Name</label>
            <input
              id="name"
              type="text"
              autoComplete="name"
              required
              className={inputClass}
              placeholder="Your full name"
              {...formRegister('name', { required: 'Name is required' })}
            />
            {errors.name && <p className={errorClass}>{errors.name.message}</p>}
          </div>

          {/* Email Input */}
          <div>
            <label htmlFor="email" className={labelClass}>Email address</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              className={inputClass}
              placeholder="Your email address"
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
                autoComplete="new-password"
                required
                className={inputClass}
                placeholder="Create a password (min 6 chars)"
                {...formRegister('password', { required: 'Password is required', minLength: { value: 6, message: 'Password must be at least 6 characters' } })}
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
              <FaUserPlus className='mr-2 mt-0.5' /> {isSubmitting ? 'Creating Account...' : 'Create Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;