import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { FiSearch, FiFilter, FiGrid, FiList, FiDownload, FiEye, FiTrash2, FiEdit } from 'react-icons/fi';

const GalleryPage = () => {
  const [search, setSearch] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [viewMode, setViewMode] = useState('grid'); // grid or list
  const [selectedMedia, setSelectedMedia] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  const { data: mediaData, isLoading, refetch } = useQuery(
    ['media', search, selectedTags.join(',')],
    async () => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (selectedTags.length > 0) params.append('tags', selectedTags.join(','));
      
      const token = localStorage.getItem('token');
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      
      const response = await axios.get(`http://localhost:5000/api/media?${params.toString()}`, config);
      return response.data;
    }
  );

  const handleSearch = (e) => {
    e.preventDefault();
    refetch();
  };

  const toggleMediaSelection = (mediaId) => {
    setSelectedMedia(prev => 
      prev.includes(mediaId) 
        ? prev.filter(id => id !== mediaId)
        : [...prev, mediaId]
    );
  };

  const handleTagFilter = (tag) => {
    setSelectedTags(prev => 
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
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

  // Get unique tags from all media
  const allTags = mediaData?.media?.reduce((tags, media) => {
    if (media.tags) {
      media.tags.forEach(tag => {
        if (!tags.includes(tag)) tags.push(tag);
      });
    }
    return tags;
  }, []) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Media Gallery</h1>
            <p className="text-gray-600 mt-1">
              {mediaData?.total || 0} items • {formatFileSize(mediaData?.media?.reduce((sum, m) => sum + (m.fileSize || 0), 0) || 0)}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              className="btn-outline flex items-center"
            >
              {viewMode === 'grid' ? <FiList className="mr-2 h-4 w-4" /> : <FiGrid className="mr-2 h-4 w-4" />}
              {viewMode === 'grid' ? 'List' : 'Grid'}
            </button>
            <Link to="/upload" className="btn-primary">
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
                placeholder="Search by title, description, or tags..."
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

      {/* Media Grid/List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : mediaData?.media?.length > 0 ? (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' : 'space-y-4'}>
          {mediaData.media.map((media) => (
            <div
              key={media._id}
              className={`bg-white rounded-lg shadow hover:shadow-md transition-shadow ${
                viewMode === 'list' ? 'flex items-center space-x-4 p-4' : 'p-4'
              }`}
            >
              {/* Image */}
              <div className={viewMode === 'list' ? 'flex-shrink-0' : 'mb-4'}>
                <div className="relative">
                  <img
                    src={`http://localhost:5000${media.fileUrl}`}
                    alt={media.title}
                    className={`object-cover rounded bg-gray-100 ${
                      viewMode === 'list' ? 'w-20 h-20' : 'w-full h-48'
                    }`}
                    onError={(e) => {
                      console.error('Image failed to load:', media.fileUrl);
                      e.target.style.display = 'none';
                      if (e.target.nextSibling) {
                        e.target.nextSibling.style.display = 'flex';
                      }
                    }}
                    onLoad={(e) => {
                      console.log('Image loaded successfully:', media.fileUrl);
                    }}
                    crossOrigin="anonymous"
                  />
                  <div 
                    className={`absolute inset-0 bg-gray-200 flex items-center justify-center rounded ${
                      viewMode === 'list' ? 'w-20 h-20' : 'w-full h-48'
                    }`}
                    style={{ display: 'none' }}
                  >
                    <div className="text-center">
                      <svg className="mx-auto h-8 w-8 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-gray-500 text-xs">Image</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className={viewMode === 'list' ? 'flex-1 min-w-0' : ''}>
                <h3 className="font-medium text-gray-900 truncate mb-1">{media.title}</h3>
                <p className="text-sm text-gray-500 mb-2">{formatDate(media.createdAt)}</p>
                
                {media.description && (
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">{media.description}</p>
                )}

                {/* Tags */}
                {media.tags && media.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {media.tags.slice(0, 3).map((tag, index) => (
                      <span key={index} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
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
                  <button
                    onClick={() => toggleMediaSelection(media._id)}
                    className={`text-xs py-1 px-3 rounded border transition-colors ${
                      selectedMedia.includes(media._id)
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No media found</h3>
          <p className="text-gray-500 mb-6">
            {search || selectedTags.length > 0 
              ? 'Try adjusting your search or filters.'
              : 'Start by uploading your first image.'
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
            <button className="btn-secondary text-xs py-1 px-3 flex items-center">
              <FiDownload className="mr-1 h-3 w-3" />
              Download
            </button>
            <button className="btn-outline text-xs py-1 px-3">
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GalleryPage; 