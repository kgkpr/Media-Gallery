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

## API Reference

Below is a concise API guide with routes, auth, and sample usage. All endpoints are prefixed with `/api`.

### Conventions
- Auth: Bearer JWT in `Authorization` header unless noted.
- Responses: JSON unless downloading files.
- Pagination: `page`, `limit` query params where applicable.

### Health
- GET `/api/health` → returns service status

### Authentication
- POST `/api/auth/register` → register with email/password
  - Body: `{ name, email, password }`
  - Notes: Sends 6-digit OTP to email
- POST `/api/auth/verify-email` → verify OTP
  - Body: `{ email, otp }`
- POST `/api/auth/login` → email/password login
  - Body: `{ email, password }`
  - Note: Soft-deleted or deactivated users cannot login
- POST `/api/auth/google-login` → Google ID token login
  - Body: `{ token }`
- POST `/api/auth/forgot-password` → request reset email
  - Body: `{ email }`
- POST `/api/auth/reset-password` → reset via token
  - Body: `{ token, newPassword }`
- GET `/api/auth/me` → current user (requires auth)

Usage example (login):
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"secret123"}'
```

### Media
- GET `/api/media` → list media with filters
  - Query: `search`, `tags`, `userId`, `isPublic`, `page`, `limit`, `sortBy`, `sortOrder`
  - Unauth users only see public items
- GET `/api/media/:id` → media details
  - Access rules: owner, admin, shared-gallery member, or public
  - Side-effect: increments `views` for authenticated users
- GET `/api/media/gallery/:galleryId` → list media in a gallery
  - Access: gallery owner, admin, shared with requester, or public gallery
- POST `/api/media/upload` → upload single file
  - Multipart field: `media`; optional body: `title, description, tags, isPublic, gallery`
- PUT `/api/media/:id` → update media (owner/admin)
- DELETE `/api/media/:id` → delete media (owner/admin)
- POST `/api/media/download-zip` → download selected media as ZIP
  - Body: `{ mediaIds: ["<id>", ...] }`
- GET `/api/media/stats` → media stats for current user (admin can pass `?userId=`)

Quick list example:
```bash
curl "http://localhost:5000/api/media?search=sunset&tags=beach,sky&limit=20"
```

### Galleries
- GET `/api/galleries` → list my galleries
- POST `/api/galleries` → create gallery
- GET `/api/galleries/:id` → gallery details
- PUT `/api/galleries/:id` → update gallery
- DELETE `/api/galleries/:id` → delete gallery

### Shared Galleries
- POST `/api/galleries/:id/share` → share a gallery
  - Body: `{ userId }` (recipient)
- DELETE `/api/galleries/:id/share/:userId` → revoke share
- GET `/api/media/gallery/:galleryId` → browse shared gallery media (see Media section)

### Contact
- POST `/api/contact` → create message
- GET `/api/contact/my-messages` → my messages
- PUT `/api/contact/:id` → update my message
- DELETE `/api/contact/:id` → delete my message
- GET `/api/contact/admin/all` → all messages (admin)
- DELETE `/api/contact/admin/:id` → delete any message (admin)

### Users
- GET `/api/users/profile` → my profile
- PUT `/api/users/profile` → update my profile
- GET `/api/users/stats` → my stats (admin can pass `?userId=`)

Admin routes
- GET `/api/users/admin/all` → list active users (excludes soft-deleted)
- GET `/api/users/admin/deleted` → list soft-deleted users
- GET `/api/users/admin/:id` → get user by id
- PUT `/api/users/admin/:id` → update user
- PUT `/api/users/admin/:id/reactivate` → reactivate deactivated user
- DELETE `/api/users/admin/:id` → soft-delete user (sets `deletedAt`)
- PUT `/api/users/admin/:id/recover` → recover soft-deleted user
- DELETE `/api/users/admin/:id/permanent` → permanently delete user

Examples:
```bash
# Soft-delete a user
curl -X DELETE http://localhost:5000/api/users/admin/USER_ID \
  -H "Authorization: Bearer <JWT>"

# List deleted users
curl http://localhost:5000/api/users/admin/deleted -H "Authorization: Bearer <JWT>"

# Recover a user
curl -X PUT http://localhost:5000/api/users/admin/USER_ID/recover \
  -H "Authorization: Bearer <JWT>"
```

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

Note: The server attempts Atlas first (`MONGODB_URI`). If that fails, it falls back to local MongoDB using `MONGODB_LOCAL_URI` or `mongodb://127.0.0.1:27017/media-gallery`.

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