import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import axios from 'axios';
import { FiUpload, FiX, FiFolder } from 'react-icons/fi';
import toast from 'react-hot-toast';

const UploadPage = () => {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const queryClient = useQueryClient();

  // Fetch only user's own galleries for dropdown (not shared galleries)
  const { data: galleriesData } = useQuery(
    ['galleries', 'owned'],
    async () => {
      const token = localStorage.getItem('token');
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      
      const response = await axios.get('http://localhost:5000/api/galleries?ownedOnly=true', config);
      return response.data;
    }
  );

  // Upload mutation
  const uploadMutation = useMutation(
    async (fileData) => {
      const formData = new FormData();
      formData.append('media', fileData.file);
      formData.append('title', fileData.title);
      formData.append('description', fileData.description);
      formData.append('tags', fileData.tags);

      if (fileData.galleryId) {
        formData.append('gallery', fileData.galleryId);
      }

      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
          ...(token && { Authorization: `Bearer ${token}` })
        },
      };

      const response = await axios.post('http://localhost:5000/api/media/upload', formData, config);
      return response.data;
    },
    {
      onSuccess: () => {
        toast.success('Media uploaded successfully!');
        queryClient.invalidateQueries('media');
        queryClient.invalidateQueries('galleries');
        setUploadedFiles([]);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Upload failed');
      },
    }
  );

  const onDrop = useCallback((acceptedFiles) => {
    const newFiles = acceptedFiles.map(file => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      title: file.name.replace(/\.[^/.]+$/, ''), // Remove extension
      description: '',
      tags: '',

      galleryId: '', // Add gallery selection
      preview: URL.createObjectURL(file)
    }));
    setUploadedFiles(prev => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png']
    },
    maxSize: 5 * 1024 * 1024, // 5MB
    multiple: true
  });

  const removeFile = (id) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== id));
  };

  const updateFileData = (id, field, value) => {
    setUploadedFiles(prev => 
      prev.map(file => 
        file.id === id ? { ...file, [field]: value } : file
      )
    );
  };

  const handleUpload = async () => {
    if (uploadedFiles.length === 0) {
      toast.error('Please select files to upload');
      return;
    }

    setUploading(true);
    
    try {
      for (const fileData of uploadedFiles) {
        await uploadMutation.mutateAsync(fileData);
      }
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const galleries = galleriesData?.galleries || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900">Upload Media</h1>
        <p className="text-gray-600 mt-2">
          Upload your images and add metadata. Supported formats: JPG, PNG (max 5MB each).
        </p>
      </div>

      {/* Upload Area */}
      <div className="bg-white rounded-lg shadow p-6">
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive
              ? 'border-primary-400 bg-primary-50'
              : 'border-gray-300 hover:border-primary-400'
          }`}
        >
          <input {...getInputProps()} />
          <FiUpload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          {isDragActive ? (
            <p className="text-primary-600 font-medium">Drop the files here...</p>
          ) : (
            <div>
              <p className="text-gray-600 mb-2">
                Drag & drop files here, or click to select files
              </p>
              <p className="text-sm text-gray-500">
                Supports JPG, PNG up to 5MB each
              </p>
            </div>
          )}
        </div>
      </div>

      {/* File List */}
      {uploadedFiles.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Files to Upload ({uploadedFiles.length})
            </h3>
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="btn-primary flex items-center"
            >
              {uploading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              ) : (
                <FiUpload className="mr-2 h-4 w-4" />
              )}
              {uploading ? 'Uploading...' : 'Upload All'}
            </button>
          </div>

          <div className="space-y-4">
            {uploadedFiles.map((fileData) => (
              <div key={fileData.id} className="border rounded-lg p-4">
                <div className="flex items-start space-x-4">
                  {/* Preview */}
                  <div className="flex-shrink-0">
                    <img
                      src={fileData.preview}
                      alt={fileData.title}
                      className="w-20 h-20 object-cover rounded"
                    />
                  </div>

                  {/* File Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {fileData.file.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatFileSize(fileData.file.size)}
                        </p>
                      </div>
                      <button
                        onClick={() => removeFile(fileData.id)}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <FiX className="h-5 w-5" />
                      </button>
                    </div>

                    {/* Metadata Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Title
                        </label>
                        <input
                          type="text"
                          value={fileData.title}
                          onChange={(e) => updateFileData(fileData.id, 'title', e.target.value)}
                          className="input-field text-sm"
                          placeholder="Enter title"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Tags
                        </label>
                        <input
                          type="text"
                          value={fileData.tags}
                          onChange={(e) => updateFileData(fileData.id, 'tags', e.target.value)}
                          className="input-field text-sm"
                          placeholder="Enter tags (comma separated)"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Gallery (Optional)
                        </label>
                        <div className="relative">
                          <FiFolder className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                          <select
                            value={fileData.galleryId}
                            onChange={(e) => updateFileData(fileData.id, 'galleryId', e.target.value)}
                            className="input-field text-sm pl-10"
                          >
                            <option value="">Select a gallery (optional)</option>
                            {galleries.map((gallery) => (
                              <option key={gallery._id} value={gallery._id}>
                                {gallery.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>



                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Description
                        </label>
                        <textarea
                          value={fileData.description}
                          onChange={(e) => updateFileData(fileData.id, 'description', e.target.value)}
                          className="input-field text-sm"
                          rows={2}
                          placeholder="Enter description"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-900 mb-2">Upload Tips:</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Supported formats: JPG, JPEG, PNG</li>
          <li>• Maximum file size: 5MB per file</li>
          <li>• Add descriptive titles and tags for better organization</li>
          <li>• Select a gallery to organize your images</li>
          <li>• Public images are visible to all users</li>
        </ul>
      </div>
    </div>
  );
};

export default UploadPage; 