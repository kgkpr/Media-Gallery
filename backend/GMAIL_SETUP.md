# Gmail SMTP Setup Guide

## Step 1: Enable 2-Factor Authentication
1. Go to your Google Account settings: https://myaccount.google.com/
2. Navigate to "Security" → "2-Step Verification"
3. Follow the instructions to enable 2-Factor Authentication

## Step 2: Generate App Password
1. Go to App Passwords: https://myaccount.google.com/apppasswords
2. Select "Mail" as the app
3. Select "Other (Custom name)" as the device
4. Enter "Media Gallery Backend" as the name
5. Click "Generate"
6. Copy the 16-character app password (it will look like: `abcd efgh ijkl mnop`)

## Step 3: Update Environment Variables
Open the `.env` file in the backend directory and update:

```env
GMAIL_USER=your-actual-gmail@gmail.com
GMAIL_PASS=your-16-character-app-password
```

**Important:** 
- Use your actual Gmail address for `GMAIL_USER`
- Use the 16-character app password (not your regular Gmail password) for `GMAIL_PASS`
- Remove any spaces from the app password

## Step 4: Test the Configuration
1. Restart your backend server: `npm run dev`
2. Try registering a new user
3. Check if you receive the OTP email in your inbox

## Troubleshooting
- **"Invalid login"**: Make sure you're using the app password, not your regular password
- **"Less secure app access"**: This is not needed with app passwords
- **Email not received**: Check spam folder, verify Gmail credentials
- **Connection timeout**: Check your internet connection and firewall settings

## Security Notes
- Never commit your `.env` file to version control
- Keep your app password secure
- Consider using environment-specific configurations for production
