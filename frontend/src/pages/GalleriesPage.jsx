import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { FiEye, FiFolder, FiTag, FiPlus } from 'react-icons/fi';
import toast from 'react-hot-toast';

const GalleriesPage = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGalleryName, setNewGalleryName] = useState('');
  const queryClient = useQueryClient();

  const { data: mediaData, isLoading } = useQuery(
    ['galleries'],
    async () => {
      const token = localStorage.getItem('token');
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      
      const response = await axios.get('http://localhost:5000/api/media', config);
      return response.data;
    }
  );

  // Create new gallery mutation
  const createGalleryMutation = useMutation(
    async (galleryName) => {
      const token = localStorage.getItem('token');
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      
      const response = await axios.post('http://localhost:5000/api/galleries', 
        { name: galleryName }, 
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



  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  // Group media by category
  const mediaByCategory = mediaData?.media?.reduce((groups, media) => {
    const category = media.tags && media.tags.length > 0 ? media.tags[0] : 'Uncategorized';
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(media);
    return groups;
  }, {}) || {};

  const handleCreateGallery = (e) => {
    e.preventDefault();
    if (newGalleryName.trim()) {
      createGalleryMutation.mutate(newGalleryName.trim());
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Galleries</h1>
            <p className="text-gray-600 mt-1">
              Browse images organized by categories
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

      

      {/* Galleries by Category */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : Object.keys(mediaByCategory).length > 0 ? (
        <div className="space-y-8">
          {Object.entries(mediaByCategory).map(([category, mediaItems]) => (
            <div key={category} className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center space-x-2">
                  <FiFolder className="h-5 w-5 text-primary-600" />
                  <h2 className="text-lg font-semibold text-gray-900">{category}</h2>
                  <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">
                    {mediaItems.length} item{mediaItems.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
              
              <div className="p-6">
                                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                   {mediaItems.map((media) => (
                     <div
                       key={media._id}
                       className="bg-gray-50 rounded-lg p-4 hover:shadow-md transition-shadow"
                     >
                                             {/* Image */}
                       <div className="mb-4">
                         <div className="relative">
                           <img
                             src={`http://localhost:5000${media.fileUrl}`}
                             alt={media.title}
                             className="object-cover rounded bg-gray-100 w-full h-48"
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
                             className="absolute inset-0 bg-gray-200 flex items-center justify-center rounded w-full h-48"
                            style={{ display: 'none' }}
                          >
                            <div className="text-center">
                              <svg className="mx-auto h-8 w-8 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2z" />
                              </svg>
                              <span className="text-gray-500 text-xs">Image</span>
                            </div>
                          </div>
                        </div>
                      </div>

                                             {/* Content */}
                       <div>
                        <h3 className="font-medium text-gray-900 truncate mb-1">{media.title}</h3>
                        <p className="text-sm text-gray-500 mb-2">{formatDate(media.createdAt)}</p>
                        
                        {media.description && (
                          <p className="text-sm text-gray-600 mb-2 line-clamp-2">{media.description}</p>
                        )}

                        {/* Tags */}
                        {media.tags && media.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {media.tags.slice(0, 3).map((tag, index) => (
                              <span key={index} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs flex items-center">
                                <FiTag className="mr-1 h-3 w-3" />
                                {tag}
                              </span>
                            ))}
                            {media.tags.length > 3 && (
                              <span className="text-gray-500 text-xs">+{media.tags.length - 3} more</span>
                            )}
                          </div>
                        )}

                        {/* Stats */}
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                          <span>{media.views || 0} views • {media.downloads || 0} downloads</span>
                          <span className={media.isPublic ? 'text-green-600' : 'text-gray-400'}>
                            {media.isPublic ? 'Public' : 'Private'}
                          </span>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center space-x-2">
                          <Link
                            to={`/media/${media._id}`}
                            className="btn-primary text-xs py-1 px-3 flex items-center"
                          >
                            <FiEye className="mr-1 h-3 w-3" />
                            View
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
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
          <h3 className="text-lg font-medium text-gray-900 mb-2">No galleries found</h3>
                     <p className="text-gray-500 mb-6">
             Start by uploading images with tags to create galleries.
           </p>
          <Link to="/upload" className="btn-primary">
            Upload Media
          </Link>
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
                   Gallery Name
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