# Media Gallery Management System

A full-stack MERN (MongoDB, Express.js, React, Node.js) application for managing media files with user authentication, contact forms, and admin features.

## Features

### 🔐 Authentication
- Google OAuth 2.0 login
- Manual email/password registration with Gmail OTP verification
- Forgot password via Gmail OTP
- Protected routes using middleware

### 🖼️ Media Gallery
- Drag & drop image uploads (JPG/PNG, max 5MB)
- File preview, title, description, and tags
- Personal/shared galleries
- Search/filter by tags/titles
- Full-screen image view with slider
- CRUD operations (Add/edit/delete media)
- Multiple image selection
- ZIP generation for selected images

### 📧 Contact Form
- Submit messages via contact form
- Edit/delete own messages
- Admin can view all messages and delete them

### 👥 User Management (Admin Only)
- View/edit user profiles (name, email, role)
- Soft-delete/deactivate users

## Tech Stack

### Frontend
- React 18
- Tailwind CSS
- React Router DOM
- React Query
- Axios
- React Dropzone
- React Icons
- React Hot Toast

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose
- JWT Authentication
- Google OAuth 2.0
- Nodemailer (Gmail OTP)
- Multer (File uploads)
- Archiver (ZIP generation)
- Cloudinary (Optional file storage)

## Prerequisites

- Node.js (v14 or higher)
- MongoDB
- Gmail account (for OTP emails)
- Google OAuth credentials (optional)

## Installation

### 1. Clone the repository
```bash
git clone <repository-url>
cd media-gallery-system
```

### 2. Backend Setup
```bash
cd backend
npm install
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install
```

### 4. Environment Configuration

#### Backend (.env file in backend directory)
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/media-gallery
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret
GMAIL_USER=your-gmail-address@gmail.com
GMAIL_PASS=your-gmail-app-password
FRONTEND_URL=http://localhost:3000
```

#### Frontend (Update Google OAuth Client ID)
In `frontend/src/pages/LoginPage.jsx`, replace `your-google-client-id` with your actual Google OAuth client ID.

### 5. Database Setup
Make sure MongoDB is running on your system. The application will automatically create the necessary collections.

### 6. Running the Application

#### Start Backend
```bash
cd backend
npm run dev
```

#### Start Frontend
```bash
cd frontend
npm start
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/verify-email` - Verify email with OTP
- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/google-login` - Login with Google OAuth
- `POST /api/auth/forgot-password` - Send password reset email
- `POST /api/auth/reset-password` - Reset password
- `GET /api/auth/me` - Get current user

### Media
- `GET /api/media` - Get all media (with filters)
- `GET /api/media/:id` - Get single media
- `POST /api/media/upload` - Upload media
- `PUT /api/media/:id` - Update media
- `DELETE /api/media/:id` - Delete media
- `POST /api/media/download-zip` - Download media as ZIP
- `GET /api/media/stats` - Get media statistics

### Contact
- `POST /api/contact` - Submit message
- `GET /api/contact/my-messages` - Get user's messages
- `PUT /api/contact/:id` - Update message
- `DELETE /api/contact/:id` - Delete message
- `GET /api/contact/admin/all` - Get all messages (admin)
- `DELETE /api/contact/admin/:id` - Delete any message (admin)

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `GET /api/users/stats` - Get user statistics
- `GET /api/users/admin/all` - Get all users (admin)
- `GET /api/users/admin/:id` - Get user by ID (admin)
- `PUT /api/users/admin/:id` - Update user (admin)
- `DELETE /api/users/admin/:id` - Delete user (admin)

## Project Structure

```
project-root/
├── backend/
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── mediaController.js
│   │   ├── contactController.js
│   │   └── userController.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Media.js
│   │   └── Contact.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── mediaRoutes.js
│   │   ├── contactRoutes.js
│   │   └── userRoutes.js
│   ├── middlewares/
│   │   └── auth.js
│   ├── utils/
│   │   ├── otp.js
│   │   └── upload.js
│   ├── server.js
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Layout.jsx
│   │   │   ├── ProtectedRoute.jsx
│   │   │   └── AdminRoute.jsx
│   │   ├── contexts/
│   │   │   └── AuthContext.js
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── ContactPage.jsx
│   │   │   └── NotFoundPage.jsx
│   │   ├── App.jsx
│   │   └── index.js
│   └── package.json
└── README.md
```

## Features in Detail

### Authentication System
- **Google OAuth**: Users can sign in with their Google account
- **Email/Password**: Traditional registration with email verification
- **OTP Verification**: Gmail-based OTP for email verification and password reset
- **JWT Tokens**: Secure authentication with JSON Web Tokens

### Media Management
- **File Upload**: Drag & drop interface with file validation
- **Metadata**: Title, description, tags, and visibility settings
- **Search & Filter**: Find media by title, description, or tags
- **Gallery View**: Grid layout with image previews
- **Full-screen View**: Lightbox-style image viewer
- **ZIP Download**: Download multiple selected images as ZIP

### Contact System
- **Message Submission**: Contact form for user support
- **Message Management**: Users can edit/delete their own messages
- **Admin Panel**: Admins can view and manage all messages

### Admin Features
- **User Management**: View, edit, and deactivate users
- **Message Management**: View and delete contact messages
- **Statistics**: Overview of system usage

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting on API endpoints
- Input validation and sanitization
- CORS configuration
- Helmet.js for security headers

## Deployment

### Backend Deployment
1. Set up environment variables
2. Install dependencies: `npm install`
3. Start the server: `npm start`

### Frontend Deployment
1. Build the application: `npm run build`
2. Serve the build folder using a static file server

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support, please contact the development team or create an issue in the repository. 