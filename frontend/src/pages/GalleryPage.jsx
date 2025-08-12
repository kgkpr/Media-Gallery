import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FiEye, FiDownload, FiTrash2, FiEdit, FiArrowLeft, FiPlus, FiSearch, FiFilter, FiShare2 } from 'react-icons/fi';
import toast from 'react-hot-toast';

const GalleryPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareEmail, setShareEmail] = useState('');
  const [selectedMedia, setSelectedMedia] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  // Download selected media as ZIP
  const handleDownloadZip = async () => {
    if (selectedMedia.length === 0) return;
    
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` })
        },
        responseType: 'blob'
      };
      
      const response = await axios.post(
        'http://localhost:5000/api/media/download-zip',
        { mediaIds: selectedMedia },
        config
      );
      
      // Create a blob and trigger download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'media-gallery.zip');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      // Clear selection after successful download
      setSelectedMedia([]);
      toast.success('Download completed successfully!');
    } catch (error) {
      console.error('Download ZIP error:', error);
      toast.error('Failed to download ZIP: ' + (error.response?.data?.message || error.message));
    }
  };

  // Check if this is "My images" page (no gallery ID) or specific gallery page
  const isMyImagesPage = !id;

  // Fetch gallery details (only if we have a gallery ID)
  const { data: galleryData, isLoading: galleryLoading } = useQuery(
    ['gallery', id],
    async () => {
      const token = localStorage.getItem('token');
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      
      const response = await axios.get(`http://localhost:5000/api/galleries/${id}`, config);
      return response.data;
    },
    {
      enabled: !!id,
      onError: (error) => {
        if (error.response?.status === 404) {
          toast.error('Gallery not found');
          navigate('/galleries');
        }
      }
    }
  );

  // Fetch media - either all user media or gallery-specific media
  const { data: mediaData, isLoading: mediaLoading, refetch } = useQuery(
    ['media', id, search, selectedTags.join(',')],
    async () => {
      const token = localStorage.getItem('token');
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      
      let response;
      
      if (id) {
        // For specific gallery, use the gallery-specific endpoint
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        if (selectedTags.length > 0) params.append('tags', selectedTags.join(','));
        
        response = await axios.get(`http://localhost:5000/api/media/gallery/${id}?${params.toString()}`, config);
        return response.data;
      } else {
        // For "My Images" page, use the general media endpoint
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        if (selectedTags.length > 0) params.append('tags', selectedTags.join(','));
        
        response = await axios.get(`http://localhost:5000/api/media?${params.toString()}`, config);
        return response.data;
      }
    }
  );

  // Delete gallery mutation (only for specific gallery pages)
  const deleteGalleryMutation = useMutation(
    async () => {
      const token = localStorage.getItem('token');
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      
      const response = await axios.delete(`http://localhost:5000/api/galleries/${id}`, config);
      return response.data;
    },
    {
      onSuccess: () => {
        toast.success('Gallery deleted successfully!');
        navigate('/galleries');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete gallery');
      }
    }
  );

  // Share gallery mutation
  const shareGalleryMutation = useMutation(
    async (email) => {
      const token = localStorage.getItem('token');
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      
      const response = await axios.post(`http://localhost:5000/api/galleries/${id}/share`, 
        { email }, 
        config
      );
      return response.data;
    },
    {
      onSuccess: () => {
        toast.success('Gallery shared successfully!');
        setShowShareModal(false);
        setShareEmail('');
        queryClient.invalidateQueries(['gallery', id]);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to share gallery');
      }
    }
  );

  const handleDeleteGallery = () => {
    if (window.confirm(`Are you sure you want to delete the gallery "${galleryData?.gallery?.name}"?`)) {
      deleteGalleryMutation.mutate();
    }
  };

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

  const toggleMediaSelection = (mediaId) => {
    setSelectedMedia(prev => 
      prev.includes(mediaId) 
        ? prev.filter(id => id !== mediaId)
        : [...prev, mediaId]
    );
  };

  const handleSearch = (e) => {
    e.preventDefault();
    refetch();
  };

  const handleTagFilter = (tag) => {
    setSelectedTags(prev => 
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  // Get unique tags from all media
  const allTags = mediaData?.media?.reduce((tags, media) => {
    if (media.tags) {
      media.tags.forEach(tag => {
        if (!tags.includes(tag)) tags.push(tag);
      });
    }
    return tags;
  }, []) || [];

  if (galleryLoading && id) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (id && !galleryData?.gallery) {
    return (
      <div className="bg-white rounded-lg shadow p-12 text-center">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Gallery not found</h3>
        <Link to="/galleries" className="btn-primary">
          Back to Galleries
        </Link>
      </div>
    );
  }

  const gallery = galleryData?.gallery;
  const media = mediaData?.media || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {id && (
              <Link to="/galleries" className="text-gray-400 hover:text-gray-600">
                <FiArrowLeft className="h-6 w-6" />
              </Link>
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {isMyImagesPage ? 'My Images' : gallery?.name}
              </h1>
              {isMyImagesPage ? (
                <p className="text-gray-600 mt-1">
                  {mediaData?.total || 0} items • {formatFileSize(mediaData?.media?.reduce((sum, m) => sum + (m.fileSize || 0), 0) || 0)}
                </p>
              ) : (
                <>
                  {gallery?.description && (
                    <p className="text-gray-600 mt-1">{gallery.description}</p>
                  )}
                  <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                    <span>
                      {gallery?.isShared ? 'Shared ' : 'Created '}
                      {formatDate(gallery?.isShared ? gallery?.sharedAt : gallery?.createdAt)}
                    </span>
                    {gallery?.isShared && (
                      <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                        Shared by {gallery?.sharedBy?.name || gallery?.sharedBy?.email}
                      </span>
                    )}

                  </div>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {!isMyImagesPage && (
              <button
                onClick={() => setShowShareModal(true)}
                className="btn-primary flex items-center"
              >
                <FiShare2 className="mr-2 h-4 w-4" />
                Share Gallery
              </button>
            )}
            <Link to="/upload" className="btn-primary flex items-center">
              <FiPlus className="mr-2 h-4 w-4" />
              Upload Media
            </Link>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <form onSubmit={handleSearch} className="flex items-center space-x-4 mb-4">
          <div className="flex-1">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by image name, description, or tags..."
                className="input-field pl-10"
              />
            </div>
          </div>
          <button type="submit" className="btn-primary">
            Search
          </button>
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className="btn-outline flex items-center"
          >
            <FiFilter className="mr-2 h-4 w-4" />
            Filters
          </button>
        </form>

        {/* Tags Filter */}
        {showFilters && allTags.length > 0 && (
          <div className="border-t pt-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Filter by Tags:</h3>
            <div className="flex flex-wrap gap-2">
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => handleTagFilter(tag)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    selectedTags.includes(tag)
                      ? 'bg-primary-100 text-primary-800 border border-primary-200'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Gallery Stats (only for specific galleries) */}
      {!isMyImagesPage && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-600">{media.length}</div>
              <div className="text-sm text-gray-600">Total Items</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-600">
                {formatFileSize(media.reduce((sum, m) => sum + (m.fileSize || 0), 0))}
              </div>
              <div className="text-sm text-gray-600">Total Size</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-600">
                {media.reduce((sum, m) => sum + (m.views || 0), 0)}
              </div>
              <div className="text-sm text-gray-600">Total Views</div>
            </div>
          </div>
        </div>
      )}

      {/* Media Grid */}
      {mediaLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : media.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {media.map((item) => (
            <div
              key={item._id}
              className="bg-white rounded-lg shadow hover:shadow-md transition-shadow"
            >
              {/* Image */}
              <div className="mb-4">
                <div className="relative">
                  <img
                    src={`http://localhost:5000${item.fileUrl}`}
                    alt={item.title}
                    className="object-cover rounded bg-gray-100 w-full h-48"
                    onError={(e) => {
                      console.error('Image failed to load:', item.fileUrl);
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
              <div className="p-4">
                <h3 className="font-medium text-gray-900 truncate mb-1">{item.title}</h3>
                <p className="text-sm text-gray-500 mb-2">{formatDate(item.createdAt)}</p>
                
                {item.description && (
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">{item.description}</p>
                )}

                {/* Tags */}
                {item.tags && item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {item.tags.slice(0, 3).map((tag, index) => (
                      <span key={index} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                        {tag}
                      </span>
                    ))}
                    {item.tags.length > 3 && (
                      <span className="text-gray-500 text-xs">+{item.tags.length - 3} more</span>
                    )}
                  </div>
                )}

                {/* Stats */}
                <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                  <span>{item.views || 0} views • {item.downloads || 0} downloads</span>

                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2">
                  <Link
                    to={`/media/${item._id}`}
                    className="btn-primary text-xs py-1 px-3 flex items-center"
                  >
                    <FiEye className="mr-1 h-3 w-3" />
                    View
                  </Link>
                  <button
                    onClick={() => toggleMediaSelection(item._id)}
                    className={`text-xs py-1 px-3 rounded border transition-colors ${
                      selectedMedia.includes(item._id)
                        ? 'bg-primary-100 text-primary-800 border-primary-200'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    Select
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {isMyImagesPage ? 'No images found' : 'No media in this gallery'}
          </h3>
          <p className="text-gray-500 mb-6">
            {isMyImagesPage 
              ? 'Start by uploading your first image.'
              : 'Add some media to get started with your gallery.'
            }
          </p>
          <Link to="/upload" className="btn-primary">
            Upload Media
          </Link>
        </div>
      )}

      {/* Bulk Actions */}
      {selectedMedia.length > 0 && (
        <div className="fixed bottom-6 right-6 bg-white rounded-lg shadow-lg p-4 border">
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              {selectedMedia.length} item{selectedMedia.length !== 1 ? 's' : ''} selected
            </span>
            <button 
              onClick={handleDownloadZip}
              className="btn-secondary text-xs py-1 px-3 flex items-center"
            >
              <FiDownload className="mr-1 h-3 w-3" />
              Download
            </button>
            <button 
              onClick={() => setSelectedMedia([])}
              className="btn-outline text-xs py-1 px-3"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Share Gallery Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Share Gallery</h3>
              <button
                onClick={() => setShowShareModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              if (shareEmail.trim()) {
                shareGalleryMutation.mutate(shareEmail.trim());
              }
            }}>
              <div className="mb-4">
                <label htmlFor="shareEmail" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  id="shareEmail"
                  value={shareEmail}
                  onChange={(e) => setShareEmail(e.target.value)}
                  placeholder="Enter email address..."
                  className="input-field w-full"
                  required
                  autoFocus
                />
              </div>
              
              <div className="mb-4">
                <p className="text-sm text-gray-600">
                  This will send an email invitation to view this gallery. The recipient will be able to access the gallery if they have an account.
                </p>
              </div>
              
              <div className="flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowShareModal(false)}
                  className="btn-outline"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={shareGalleryMutation.isLoading || !shareEmail.trim()}
                  className="btn-primary"
                >
                  {shareGalleryMutation.isLoading ? 'Sharing...' : 'Send Invitation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Media Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Add Media to Gallery</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">
                This feature is coming soon! For now, you can upload media from the upload page.
              </p>
              <Link to="/upload" className="btn-primary">
                Go to Upload
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GalleryPage; 