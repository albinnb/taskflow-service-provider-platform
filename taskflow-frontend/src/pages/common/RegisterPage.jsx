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

  // Redirect if already authenticated
  if (isAuthenticated) {
    if (user.role === 'admin') return <Navigate to="/admin/dashboard" />;
    if (user.role === 'provider') return <Navigate to="/provider/dashboard" />;
    return <Navigate to="/" />;
  }

  const onSubmit = async (data) => {
    try {
      await register(data);
    } catch (error) {
      // Error handled by toast in AuthContext
    }
  };

  const selectedRole = watch('role');

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-muted/40">
      <div className="max-w-md w-full space-y-8 bg-card p-8 rounded-xl shadow-lg border border-border">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-foreground tracking-tight">
            Create an account
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-primary hover:text-primary/90 transition-colors">
              Sign in
            </Link>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>

          {/* Role Selection */}
          <div className="flex justify-center space-x-4">
            <label className={`cursor-pointer border-2 rounded-lg p-3 w-1/2 text-center font-medium transition duration-300 ${selectedRole === 'customer'
              ? 'border-primary bg-primary/10 text-primary shadow-sm'
              : 'border-input bg-background/50 text-muted-foreground hover:border-primary/50'
              }`}>
              <input
                type="radio"
                value="customer"
                {...formRegister('role')}
                className="hidden"
              />
              I'm a Customer
            </label>
            <label className={`cursor-pointer border-2 rounded-lg p-3 w-1/2 text-center font-medium transition duration-300 ${selectedRole === 'provider'
              ? 'border-primary bg-primary/10 text-primary shadow-sm'
              : 'border-input bg-background/50 text-muted-foreground hover:border-primary/50'
              }`}>
              <input
                type="radio"
                value="provider"
                {...formRegister('role')}
                className="hidden"
              />
              I'm a Tasker
            </label>
          </div>

          <div className="space-y-4">
            {/* Name Input */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-foreground mb-1">Full Name</label>
              <input
                id="name"
                type="text"
                autoComplete="name"
                required
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="John Doe"
                {...formRegister('name', { required: 'Name is required' })}
              />
              {errors.name && <p className="mt-1 text-sm text-destructive">{errors.name.message}</p>}
            </div>

            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1">Email address</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="john@example.com"
                {...formRegister('email', { required: 'Email is required', pattern: { value: /^\S+@\S+$/i, message: "Invalid email format" } })}
              />
              {errors.email && <p className="mt-1 text-sm text-destructive">{errors.email.message}</p>}
            </div>

            {/* Phone Input */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-foreground mb-1">Phone Number</label>
              <input
                id="phone"
                type="tel"
                autoComplete="tel"
                required
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="9876543210 (10 digits)"
                {...formRegister('phone', {
                  required: 'Phone number is required',
                  pattern: { value: /^\d{10}$/, message: "Phone number must be exactly 10 digits" }
                })}
              />
              {errors.phone && <p className="mt-1 text-sm text-destructive">{errors.phone.message}</p>}
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground mb-1">Password</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pr-10"
                  placeholder="Min 8 chars, letters & numbers"
                  {...formRegister('password', {
                    required: 'Password is required',
                    minLength: { value: 8, message: 'Password must be at least 8 characters' },
                    pattern: { value: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/, message: 'Password must contain at least one letter and one number' }
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-sm text-destructive">{errors.password.message}</p>}
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="group relative w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-bold rounded-md text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring disabled:opacity-50 transition-all shadow-sm"
          >
            {isSubmitting ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;