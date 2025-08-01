import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import axios from 'axios';
import { FiEye, FiDownload, FiEdit, FiTrash2, FiX, FiTag, FiCalendar, FiUser, FiEye as FiViews, FiDownload as FiDownloads, FiShare2 } from 'react-icons/fi';
import toast from 'react-hot-toast';

const MediaDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});

  // Fetch media details
  const { data: media, isLoading, error } = useQuery(
    ['media', id],
    async () => {
      console.log('Fetching media with ID:', id);
      const token = localStorage.getItem('token');
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      const response = await axios.get(`http://localhost:5000/api/media/${id}`, config);
      console.log('Media response:', response.data);
      return response.data.media || response.data;
    },
    {
      onError: (error) => {
        console.error('Error fetching media:', error);
        toast.error('Failed to load media details');
        navigate('/gallery');
      }
    }
  );

  // Delete mutation
  const deleteMutation = useMutation(
    async () => {
      await axios.delete(`http://localhost:5000/api/media/${id}`);
    },
    {
      onSuccess: () => {
        toast.success('Media deleted successfully');
        queryClient.invalidateQueries('media');
        navigate('/gallery');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete media');
      }
    }
  );

  // Update mutation
  const updateMutation = useMutation(
    async (data) => {
      const response = await axios.put(`http://localhost:5000/api/media/${id}`, data);
      return response.data;
    },
    {
      onSuccess: () => {
        toast.success('Media updated successfully');
        queryClient.invalidateQueries(['media', id]);
        setIsEditing(false);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update media');
      }
    }
  );

  // Download mutation
  const downloadMutation = useMutation(
    async () => {
      const response = await axios.get(`http://localhost:5000/api/media/${id}/download`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', media.filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    },
    {
      onSuccess: () => {
        toast.success('Download started');
      },
      onError: (error) => {
        toast.error('Failed to download file');
      }
    }
  );

  useEffect(() => {
    if (media && !isEditing) {
      setEditData({
        title: media.title || '',
        description: media.description || '',
        tags: Array.isArray(media.tags) ? media.tags.join(', ') : (media.tags || ''),
        isPublic: media.isPublic || false
      });
    }
  }, [media, isEditing]);

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this media?')) {
      deleteMutation.mutate();
    }
  };

  const handleUpdate = () => {
    const updateData = {
      ...editData,
      tags: editData.tags ? editData.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : []
    };
    updateMutation.mutate(updateData);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error || !media) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900">Media not found</h2>
        <p className="text-gray-600 mt-2">The requested media could not be found.</p>
        <button
          onClick={() => navigate('/gallery')}
          className="btn-primary mt-4"
        >
          Back to Gallery
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Media Details</h1>
            <p className="text-gray-600 mt-1">View and manage media file information</p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setIsFullscreen(true)}
              className="btn-secondary flex items-center"
            >
              <FiEye className="mr-2 h-4 w-4" />
              Full Screen
            </button>
            <button
              onClick={() => navigate('/gallery')}
              className="btn-outline"
            >
              Back to Gallery
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Image Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="relative">
                         <img
               src={`http://localhost:5000${media.fileUrl}`}
               alt={media.title}
               className="w-full h-auto rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
               onClick={() => setIsFullscreen(true)}
               onError={(e) => {
                 console.error('Image failed to load:', media.fileUrl);
                 e.target.style.display = 'none';
                 if (e.target.nextSibling) {
                   e.target.nextSibling.style.display = 'flex';
                 }
               }}
               crossOrigin="anonymous"
             />
            <div 
              className="absolute inset-0 bg-gray-200 flex items-center justify-center rounded-lg"
              style={{ display: 'none' }}
            >
              <div className="text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-gray-500">Image not available</span>
              </div>
            </div>
            <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
              {media.dimensions?.width} x {media.dimensions?.height}
            </div>
          </div>
        </div>

        {/* Details Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="space-y-6">
            {/* Basic Info */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Media Information</h3>
              
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                    <input
                      type="text"
                      value={editData.title}
                      onChange={(e) => setEditData({...editData, title: e.target.value})}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={editData.description}
                      onChange={(e) => setEditData({...editData, description: e.target.value})}
                      className="input-field"
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                    <input
                      type="text"
                      value={editData.tags}
                      onChange={(e) => setEditData({...editData, tags: e.target.value})}
                      className="input-field"
                      placeholder="Enter tags separated by commas"
                    />
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={editData.isPublic}
                      onChange={(e) => setEditData({...editData, isPublic: e.target.checked})}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Make public</span>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={handleUpdate}
                      disabled={updateMutation.isLoading}
                      className="btn-primary"
                    >
                      {updateMutation.isLoading ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="btn-outline"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-medium text-gray-500">Title</span>
                    <p className="text-gray-900">{media.title || 'Untitled'}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Description</span>
                    <p className="text-gray-900">{media.description || 'No description'}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Tags</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {media.tags && media.tags.length > 0 ? media.tags.map((tag, index) => (
                        <span key={index} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                          {tag}
                        </span>
                      )) : (
                        <span className="text-gray-400 text-sm">No tags</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Visibility</span>
                    <p className="text-gray-900">{media.isPublic ? 'Public' : 'Private'}</p>
                  </div>
                </div>
              )}
            </div>

            {/* File Details */}
            <div className="border-t pt-4">
              <h4 className="text-md font-semibold text-gray-900 mb-3">File Details</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Filename:</span>
                  <span className="text-gray-900">{media.filename}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">File size:</span>
                  <span className="text-gray-900">{formatFileSize(media.fileSize)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Type:</span>
                  <span className="text-gray-900">{media.mimeType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Uploaded:</span>
                  <span className="text-gray-900">{formatDate(media.createdAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Views:</span>
                  <span className="text-gray-900">{media.views || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Downloads:</span>
                  <span className="text-gray-900">{media.downloads || 0}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="border-t pt-4">
              <h4 className="text-md font-semibold text-gray-900 mb-3">Actions</h4>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => downloadMutation.mutate()}
                  disabled={downloadMutation.isLoading}
                  className="btn-secondary flex items-center justify-center"
                >
                  <FiDownload className="mr-2 h-4 w-4" />
                  {downloadMutation.isLoading ? 'Downloading...' : 'Download'}
                </button>
                <button
                  onClick={() => setIsEditing(true)}
                  className="btn-outline flex items-center justify-center"
                >
                  <FiEdit className="mr-2 h-4 w-4" />
                  Edit
                </button>
                <button
                  onClick={() => setIsFullscreen(true)}
                  className="btn-outline flex items-center justify-center"
                >
                  <FiEye className="mr-2 h-4 w-4" />
                  Full Screen
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleteMutation.isLoading}
                  className="btn-danger flex items-center justify-center"
                >
                  <FiTrash2 className="mr-2 h-4 w-4" />
                  {deleteMutation.isLoading ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen Modal */}
      {isFullscreen && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
          <div className="relative max-w-4xl max-h-full">
            <button
              onClick={() => setIsFullscreen(false)}
              className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
            >
              <FiX className="h-8 w-8" />
            </button>
                         <img
               src={`http://localhost:5000${media.fileUrl}`}
               alt={media.title}
               className="max-w-full max-h-full object-contain"
               onError={(e) => {
                 console.error('Fullscreen image failed to load:', media.fileUrl);
                 e.target.style.display = 'none';
               }}
               crossOrigin="anonymous"
             />
          </div>
        </div>
      )}
    </div>
  );
};

export default MediaDetailPage; 