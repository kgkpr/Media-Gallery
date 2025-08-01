import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  // Configure axios defaults
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // Check if user is authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      if (token) {
        try {
          const response = await axios.get('http://localhost:5000/api/auth/me');
          setUser(response.data.user);
        } catch (error) {
          console.error('Auth check failed:', error);
          logout();
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, [token]);

  const login = async (email, password) => {
    try {
      const response = await axios.post('http://localhost:5000/api/auth/login', {
        email,
        password
      });
      
      const { token: newToken, user: userData } = response.data;
      
      setToken(newToken);
      setUser(userData);
      localStorage.setItem('token', newToken);
      
      toast.success('Login successful!');
      return true;
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      toast.error(message);
      return false;
    }
  };

  const googleLogin = async (googleToken) => {
    try {
      const response = await axios.post('http://localhost:5000/api/auth/google-login', {
        token: googleToken
      });
      
      const { token: newToken, user: userData } = response.data;
      
      setToken(newToken);
      setUser(userData);
      localStorage.setItem('token', newToken);
      
      toast.success('Google login successful!');
      return true;
    } catch (error) {
      const message = error.response?.data?.message || 'Google login failed';
      toast.error(message);
      return false;
    }
  };

  const register = async (name, email, password) => {
    try {
      const response = await axios.post('http://localhost:5000/api/auth/register', {
        name,
        email,
        password
      });
      
      // Handle the new response format with token
      if (response.data.token) {
        const { token: newToken, user: userData } = response.data;
        
        setToken(newToken);
        setUser(userData);
        localStorage.setItem('token', newToken);
        
        toast.success('Registration successful! You can now login.');
        return true;
      } else {
        toast.success('Registration successful! Please check your email for verification.');
        return true;
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed';
      toast.error(message);
      return false;
    }
  };

  const verifyEmail = async (email, otp) => {
    try {
      const response = await axios.post('http://localhost:5000/api/auth/verify-email', {
        email,
        otp
      });
      
      const { token: newToken, user: userData } = response.data;
      
      setToken(newToken);
      setUser(userData);
      localStorage.setItem('token', newToken);
      
      toast.success('Email verified successfully!');
      return true;
    } catch (error) {
      const message = error.response?.data?.message || 'Email verification failed';
      toast.error(message);
      return false;
    }
  };

  const forgotPassword = async (email) => {
    try {
      await axios.post('http://localhost:5000/api/auth/forgot-password', { email });
      toast.success('Password reset email sent!');
      return true;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to send reset email';
      toast.error(message);
      return false;
    }
  };

  const resetPassword = async (token, newPassword) => {
    try {
      await axios.post('http://localhost:5000/api/auth/reset-password', {
        token,
        newPassword
      });
      toast.success('Password reset successful!');
      return true;
    } catch (error) {
      const message = error.response?.data?.message || 'Password reset failed';
      toast.error(message);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    toast.success('Logged out successfully');
  };

  const updateUser = (userData) => {
    setUser(userData);
  };

  const value = {
    user,
    loading,
    login,
    googleLogin,
    register,
    verifyEmail,
    forgotPassword,
    resetPassword,
    logout,
    updateUser,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin'
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 