import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import axios from 'axios';
import { FiSend, FiEdit, FiTrash2, FiMessageSquare } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const ContactPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    message: ''
  });
  const [editingMessage, setEditingMessage] = useState(null);

  // Fetch user's messages
  const { data: messages, isLoading } = useQuery('myMessages', async () => {
    const token = localStorage.getItem('token');
    const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
    const response = await axios.get('http://localhost:5000/api/contact/my-messages', config);
    return response.data;
  });

  // Submit message mutation
  const submitMutation = useMutation(
    async (data) => {
      const token = localStorage.getItem('token');
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      const response = await axios.post('http://localhost:5000/api/contact', data, config);
      return response.data;
    },
    {
      onSuccess: () => {
        toast.success('Message sent successfully!');
        setFormData({ name: user?.name || '', email: user?.email || '', message: '' });
        queryClient.invalidateQueries('myMessages');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to send message');
      }
    }
  );

  // Update message mutation
  const updateMutation = useMutation(
    async ({ id, message }) => {
      const token = localStorage.getItem('token');
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      const response = await axios.put(`http://localhost:5000/api/contact/${id}`, { message }, config);
      return response.data;
    },
    {
      onSuccess: () => {
        toast.success('Message updated successfully!');
        setEditingMessage(null);
        queryClient.invalidateQueries('myMessages');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update message');
      }
    }
  );

  // Delete message mutation
  const deleteMutation = useMutation(
    async (id) => {
      const token = localStorage.getItem('token');
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      await axios.delete(`http://localhost:5000/api/contact/${id}`, config);
    },
    {
      onSuccess: () => {
        toast.success('Message deleted successfully!');
        queryClient.invalidateQueries('myMessages');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete message');
      }
    }
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    submitMutation.mutate(formData);
  };

  const handleUpdate = (e) => {
    e.preventDefault();
    updateMutation.mutate({
      id: editingMessage._id,
      message: editingMessage.message
    });
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this message?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900">Contact Support</h1>
        <p className="text-gray-600 mt-2">
          Send us a message and we'll get back to you as soon as possible.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contact Form */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Send Message</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                className="input-field mt-1"
                value={formData.name}
                onChange={handleChange}
                placeholder="Your name"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                className="input-field mt-1"
                value={formData.email}
                onChange={handleChange}
                placeholder="your.email@example.com"
              />
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700">
                Message
              </label>
              <textarea
                id="message"
                name="message"
                rows={4}
                required
                className="input-field mt-1"
                value={formData.message}
                onChange={handleChange}
                placeholder="Tell us how we can help you..."
              />
            </div>

            <button
              type="submit"
              disabled={submitMutation.isLoading}
              className="btn-primary w-full flex items-center justify-center"
            >
              {submitMutation.isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <FiSend className="mr-2 h-4 w-4" />
                  Send Message
                </>
              )}
            </button>
          </form>
        </div>

        {/* My Messages */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">My Messages</h2>
          
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : messages?.messages && messages.messages.length > 0 ? (
            <div className="space-y-4">
              {messages.messages.map((message) => (
                <div key={message._id} className="border rounded-lg p-4">
                  {editingMessage?._id === message._id ? (
                    <form onSubmit={handleUpdate} className="space-y-3">
                      <textarea
                        rows={3}
                        className="input-field"
                        value={editingMessage.message}
                        onChange={(e) => setEditingMessage({
                          ...editingMessage,
                          message: e.target.value
                        })}
                      />
                      <div className="flex space-x-2">
                        <button
                          type="submit"
                          disabled={updateMutation.isLoading}
                          className="btn-primary text-sm"
                        >
                          {updateMutation.isLoading ? 'Saving...' : 'Save'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingMessage(null)}
                          className="btn-secondary text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm text-gray-600 mb-2">
                            <span className="font-medium">{message.name}</span> • {message.email}
                          </p>
                          <p className="text-gray-900">{message.message}</p>
                          <p className="text-xs text-gray-500 mt-2">
                            {new Date(message.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex space-x-2 ml-4">
                          <button
                            onClick={() => setEditingMessage(message)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <FiEdit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(message._id)}
                            className="text-gray-400 hover:text-red-600"
                          >
                            <FiTrash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FiMessageSquare className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No messages yet</h3>
              <p className="mt-1 text-sm text-gray-500">
                Send your first message to get started.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContactPage; 