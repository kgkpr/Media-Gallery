import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { FiEye, FiFolder, FiTag, FiPlus, FiEdit, FiTrash2 } from 'react-icons/fi';
import toast from 'react-hot-toast';

const GalleriesPage = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGalleryName, setNewGalleryName] = useState('');
  const queryClient = useQueryClient();

  // Fetch galleries instead of media
  const { data: galleriesData, isLoading } = useQuery(
    ['galleries'],
    async () => {
      const token = localStorage.getItem('token');
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      
      const response = await axios.get('http://localhost:5000/api/galleries', config);
      return response.data;
    }
  );

  // Create new gallery mutation
  const createGalleryMutation = useMutation(
    async (galleryData) => {
      const token = localStorage.getItem('token');
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      
      const response = await axios.post('http://localhost:5000/api/galleries', 
        galleryData, 
        config
      );
      return response.data;
    },
    {
      onSuccess: () => {
        toast.success('Gallery created successfully!');
        setShowCreateModal(false);
        setNewGalleryName('');
        queryClient.invalidateQueries(['galleries']);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to create gallery');
      }
    }
  );

  // Delete gallery mutation
  const deleteGalleryMutation = useMutation(
    async (galleryId) => {
      const token = localStorage.getItem('token');
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      
      const response = await axios.delete(`http://localhost:5000/api/galleries/${galleryId}`, config);
      return response.data;
    },
    {
      onSuccess: () => {
        toast.success('Gallery deleted successfully!');
        queryClient.invalidateQueries(['galleries']);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete gallery');
      }
    }
  );

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleCreateGallery = (e) => {
    e.preventDefault();
    if (newGalleryName.trim()) {
      createGalleryMutation.mutate({
        name: newGalleryName.trim(),
        isPublic: false
      });
    }
  };

  const handleDeleteGallery = (galleryId, galleryName) => {
    if (window.confirm(`Are you sure you want to delete the gallery "${galleryName}"?`)) {
      deleteGalleryMutation.mutate(galleryId);
    }
  };

  const galleries = galleriesData?.galleries || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Galleries</h1>
            <p className="text-gray-600 mt-1">
              Organize your images into collections
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center shadow-sm hover:shadow-md"
            >
              <FiPlus className="mr-2 h-4 w-4" />
              New Gallery
            </button>
          </div>
        </div>
      </div>

      {/* Galleries List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : galleries.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {galleries.map((gallery) => (
            <div
              key={gallery._id}
              className="bg-white rounded-lg shadow hover:shadow-md transition-shadow"
            >
              {/* Gallery Cover */}
              <div className="h-48 bg-gray-100 rounded-t-lg flex items-center justify-center">
                <FiFolder className="h-12 w-12 text-gray-400" />
              </div>
              
              {/* Gallery Content */}
              <div className="p-6">
                                 <div className="flex items-start justify-between mb-3">
                   <div className="flex-1">
                     <h3 className="text-lg font-semibold text-gray-900 mb-1">
                       {gallery.name}
                     </h3>
                     {gallery.isShared && (
                       <p className="text-sm text-blue-600">
                         Shared by {gallery.sharedBy?.name || gallery.sharedBy?.email}
                       </p>
                     )}
                   </div>
                 </div>

                                 {/* Gallery Stats */}
                 <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                   <span>
                     {gallery.isShared ? 'Shared ' : 'Created '}
                     {formatDate(gallery.isShared ? gallery.sharedAt : gallery.createdAt)}
                   </span>
                   <div className="flex items-center space-x-2">
                     {gallery.isShared && (
                       <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                         Shared
                       </span>
                     )}
                     <span className={`px-2 py-1 rounded-full text-xs ${
                       gallery.isPublic 
                         ? 'bg-green-100 text-green-800' 
                         : 'bg-gray-100 text-gray-800'
                     }`}>
                       {gallery.isPublic ? 'Public' : 'Private'}
                     </span>
                   </div>
                 </div>

                                 {/* Actions */}
                 <div className="flex items-center space-x-2">
                   <Link
                     to={`/gallery/${gallery._id}`}
                     className="btn-primary text-sm py-2 px-4 flex items-center flex-1 justify-center"
                   >
                     <FiEye className="mr-2 h-4 w-4" />
                     View Gallery
                   </Link>
                   {!gallery.isShared && (
                     <button
                       onClick={() => handleDeleteGallery(gallery._id, gallery.name)}
                       className="btn-danger text-sm py-2 px-3 flex items-center"
                       title="Delete gallery"
                     >
                       <FiTrash2 className="h-4 w-4" />
                     </button>
                   )}
                 </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="text-gray-400 mb-4">
            <FiFolder className="mx-auto h-12 w-12" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No galleries yet</h3>
          <p className="text-gray-500 mb-6">
            Create your first gallery to start organizing your images.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary"
          >
            Create Gallery
          </button>
        </div>
      )}

      {/* Create Gallery Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Create New Gallery</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleCreateGallery}>
              <div className="mb-4">
                <label htmlFor="galleryName" className="block text-sm font-medium text-gray-700 mb-2">
                  Gallery Name *
                </label>
                <input
                  type="text"
                  id="galleryName"
                  value={newGalleryName}
                  onChange={(e) => setNewGalleryName(e.target.value)}
                  placeholder="Enter gallery name..."
                  className="input-field w-full"
                  required
                  autoFocus
                />
              </div>
              
              <div className="flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn-outline"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createGalleryMutation.isLoading || !newGalleryName.trim()}
                  className="btn-primary"
                >
                  {createGalleryMutation.isLoading ? 'Creating...' : 'Create Gallery'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GalleriesPage; 