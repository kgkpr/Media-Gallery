import React, { useState } from 'react';
import { useMutation, useQueryClient } from 'react-query';
import axios from 'axios';
import { FiUser, FiMail, FiEdit, FiSave, FiX, FiLock, FiCalendar, FiShield } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || ''
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const queryClient = useQueryClient();

  // Update profile mutation
  const updateProfileMutation = useMutation(
    async (userData) => {
      const response = await axios.put(`http://localhost:5000/api/users/profile`, userData);
      return response.data;
    },
    {
      onSuccess: (data) => {
        updateUser(data.user);
        queryClient.invalidateQueries('user');
        toast.success('Profile updated successfully');
        setIsEditing(false);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update profile');
      }
    }
  );

  // Change password mutation
  const changePasswordMutation = useMutation(
    async (passwordData) => {
      const response = await axios.put(`http://localhost:5000/api/users/change-password`, passwordData);
      return response.data;
    },
    {
      onSuccess: () => {
        toast.success('Password changed successfully');
        setShowPasswordForm(false);
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to change password');
      }
    }
  );

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value
    });
  };

  const handleSaveProfile = () => {
    updateProfileMutation.mutate(formData);
  };

  const handleCancelEdit = () => {
    setFormData({
      name: user?.name || '',
      email: user?.email || ''
    });
    setIsEditing(false);
  };

  const handleChangePassword = () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }
    changePasswordMutation.mutate(passwordData);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
        <p className="text-gray-600 mt-2">
          Manage your account settings and information.
        </p>
      </div>

      {/* Profile Information */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="h-16 w-16 rounded-full bg-primary-600 flex items-center justify-center">
              <span className="text-xl font-medium text-white">
                {user?.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{user?.name}</h2>
              <p className="text-gray-600">{user?.email}</p>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                {user?.role}
              </span>
            </div>
          </div>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="btn-primary inline-flex items-center"
            >
              <FiEdit className="mr-2 h-4 w-4" />
              Edit Profile
            </button>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            {isEditing ? (
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="input-field mt-1"
              />
            ) : (
              <div className="mt-1 flex items-center">
                <FiUser className="h-5 w-5 text-gray-400 mr-2" />
                <span className="text-gray-900">{user?.name}</span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            {isEditing ? (
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="input-field mt-1"
              />
            ) : (
              <div className="mt-1 flex items-center">
                <FiMail className="h-5 w-5 text-gray-400 mr-2" />
                <span className="text-gray-900">{user?.email}</span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Role</label>
            <div className="mt-1 flex items-center">
              <FiShield className="h-5 w-5 text-gray-400 mr-2" />
              <span className="text-gray-900 capitalize">{user?.role}</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Member Since</label>
            <div className="mt-1 flex items-center">
              <FiCalendar className="h-5 w-5 text-gray-400 mr-2" />
              <span className="text-gray-900">{formatDate(user?.createdAt)}</span>
            </div>
          </div>

          {isEditing && (
            <div className="flex space-x-3 pt-4">
              <button
                onClick={handleSaveProfile}
                disabled={updateProfileMutation.isLoading}
                className="btn-primary inline-flex items-center"
              >
                <FiSave className="mr-2 h-4 w-4" />
                {updateProfileMutation.isLoading ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                onClick={handleCancelEdit}
                className="btn-secondary inline-flex items-center"
              >
                <FiX className="mr-2 h-4 w-4" />
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Password Change */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Change Password</h3>
          <button
            onClick={() => setShowPasswordForm(!showPasswordForm)}
            className="btn-secondary inline-flex items-center"
          >
            <FiLock className="mr-2 h-4 w-4" />
            {showPasswordForm ? 'Cancel' : 'Change Password'}
          </button>
        </div>

        {showPasswordForm && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Current Password</label>
              <input
                type="password"
                name="currentPassword"
                value={passwordData.currentPassword}
                onChange={handlePasswordChange}
                className="input-field mt-1"
                placeholder="Enter current password"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">New Password</label>
              <input
                type="password"
                name="newPassword"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
                className="input-field mt-1"
                placeholder="Enter new password"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Confirm New Password</label>
              <input
                type="password"
                name="confirmPassword"
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange}
                className="input-field mt-1"
                placeholder="Confirm new password"
              />
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                onClick={handleChangePassword}
                disabled={changePasswordMutation.isLoading}
                className="btn-primary"
              >
                {changePasswordMutation.isLoading ? 'Changing...' : 'Change Password'}
              </button>
              <button
                onClick={() => {
                  setShowPasswordForm(false);
                  setPasswordData({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                  });
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Account Statistics */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Account Statistics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center">
              <FiUser className="h-8 w-8 text-primary-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Account Status</p>
                <p className="text-lg font-semibold text-gray-900">
                  {user?.isActive ? 'Active' : 'Inactive'}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center">
              <FiCalendar className="h-8 w-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Member Since</p>
                <p className="text-lg font-semibold text-gray-900">
                  {formatDate(user?.createdAt)}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center">
              <FiShield className="h-8 w-8 text-purple-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Account Type</p>
                <p className="text-lg font-semibold text-gray-900 capitalize">
                  {user?.role}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage; 