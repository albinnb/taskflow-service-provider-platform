import React, { createContext, useState, useEffect } from 'react';
import { authApi } from '../api/serviceApi'; // <-- Standard path: src/context to src/api
import { toast, ToastContainer } from 'react-toastify';

export const AuthContext = createContext();

// --- Helper Function to Save/Clear Token ---
const TOKEN_KEY = 'locallink-token';

// CRITICAL FIX: The setAuthToken helper MUST be outside the component
const setAuthToken = (token) => {
    console.log('setAuthToken called with token:', token ? token.substring(0, 50) + '...' : 'null');
    if (token) {
        localStorage.setItem(TOKEN_KEY, token);
        console.log('Token saved. Verify:', localStorage.getItem(TOKEN_KEY) ? 'SUCCESS' : 'FAILED');
    } else {
        localStorage.removeItem(TOKEN_KEY);
        console.log('Token cleared from localStorage');
    }
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [roleProfile, setRoleProfile] = useState(null);
  
  // State variable to track if the required profile data is filled
  const [isProfileComplete, setIsProfileComplete] = useState(true); 

  // --- Load User Function (Check Auth Status) ---
  const loadUser = async () => {
    setLoading(true); 
    try {
      // Check if token exists before trying to fetch
      if (!localStorage.getItem(TOKEN_KEY)) {
        throw new Error('No token found');
      }

      const res = await authApi.getMe(); 
      
      setUser(res.data); // Backend returns the user object directly: res.data
      
      // Capture the profile completion status
      setIsProfileComplete(res.data.isProfileComplete ?? true); 

      // Load the provider profile if the user is a provider
      if (res.data.role === 'provider') {
          const profileRes = await authApi.getProviderProfile(); 
          setRoleProfile(profileRes.data || null);
      }
      
    } catch (err) {
      // User is not logged in or token is invalid/expired (401 error)
      setAuthToken(null); // Clear invalid token
      setUser(null);
      setRoleProfile(null);
      setIsProfileComplete(true); 
    }
    setLoading(false);
  };

  useEffect(() => {
    loadUser();
  }, []); // Runs once on app load


  // --- Auth Actions ---

  const login = async (formData) => {
    try {
      setLoading(true);
      const res = await authApi.login(formData);
      
      console.log('Login response:', res.data);
      
      // CRITICAL FIX: Save the token received from the backend response
      setAuthToken(res.data.token);
      
      // Set user immediately from response
      setUser(res.data);
      setIsProfileComplete(res.data.isProfileComplete ?? true);
      
      // Then fetch full user data in background
      try {
        const fullUserRes = await authApi.getMe();
        setUser(fullUserRes.data);
        setIsProfileComplete(fullUserRes.data.isProfileComplete ?? true);
        
        if (fullUserRes.data.role === 'provider') {
          const profileRes = await authApi.getProviderProfile();
          setRoleProfile(profileRes.data || null);
        }
      } catch (err) {
        console.error('Error loading full user data:', err);
      }
      
      setLoading(false);
      toast.success('Login successful!');
      return true; 
    } catch (error) {
      setLoading(false);
      console.error('Login error:', error);
    }
  };

  const register = async (formData) => {
    try {
      setLoading(true);
      const res = await authApi.register(formData);
      
      console.log('Register response:', res.data);
      console.log('Token from response:', res.data.token);
      
      // CRITICAL FIX: Save the token received from the backend response
      if (res.data.token) {
        setAuthToken(res.data.token);
        console.log('Token saved to localStorage');
        console.log('Verify localStorage:', localStorage.getItem(TOKEN_KEY));
      } else {
        console.error('No token in register response!');
      }
      
      // Set user immediately from response
      setUser(res.data);
      setIsProfileComplete(res.data.isProfileComplete ?? true);
      
      // Then fetch full user data in background
      try {
        const fullUserRes = await authApi.getMe();
        console.log('getMe response:', fullUserRes.data);
        setUser(fullUserRes.data);
        setIsProfileComplete(fullUserRes.data.isProfileComplete ?? true);
        
        if (fullUserRes.data.role === 'provider') {
          const profileRes = await authApi.getProviderProfile();
          setRoleProfile(profileRes.data || null);
        }
      } catch (err) {
        console.error('Error loading full user data:', err);
      }
      
      setLoading(false);
      toast.success('Registration successful! Welcome to LocalLink.');
      return true;
    } catch (error) {
      setLoading(false);
      console.error('Register error:', error);
    }
  };

  const logout = async () => {
    try {
      await authApi.logout(); 
    } catch (error) {
      console.error('Logout failed on server:', error);
    } finally {
      setAuthToken(null); // Clear token from storage
      setUser(null);
      setRoleProfile(null);
      setIsProfileComplete(true); 
      toast.info('You have been logged out.');
    }
  };

  const contextValue = {
    user,
    roleProfile,
    loading,
    isProfileComplete, 
    setIsProfileComplete, 
    isAuthenticated: !!user,
    login,
    logout,
    register,
    loadUser,
    setUser,
    setRoleProfile,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      <ToastContainer position="bottom-right" autoClose={3000} /> 
      {children}
    </AuthContext.Provider>
  );
};