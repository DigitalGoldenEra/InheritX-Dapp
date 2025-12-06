# Cloudinary Setup Guide

This guide explains how to configure Cloudinary for KYC document storage in the InheritX backend.

## Why Cloudinary?

Cloudinary provides:
- **Cloud Storage**: No need for local file storage
- **Image Optimization**: Automatic compression and format optimization
- **CDN Delivery**: Fast global content delivery
- **Security**: Secure file access and management
- **Scalability**: Handles large files and high traffic

## Setup Instructions

### 1. Create a Cloudinary Account

1. Go to [https://cloudinary.com/users/register](https://cloudinary.com/users/register)
2. Sign up for a free account (includes 25GB storage and 25GB bandwidth)
3. Verify your email address

### 2. Get Your Credentials

1. Log in to your Cloudinary dashboard
2. Go to **Settings** → **Security** (or Dashboard)
3. Copy the following values:
   - **Cloud Name** (e.g., `your-cloud-name`)
   - **API Key** (e.g., `123456789012345`)
   - **API Secret** (e.g., `abcdefghijklmnopqrstuvwxyz123456`)

### 3. Add Environment Variables

Add the following to your `server/.env` file:

```env
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### 4. Install Dependencies

The required packages are already in `package.json`. If you need to reinstall:

```bash
cd server
npm install cloudinary multer-storage-cloudinary
```

### 5. Verify Configuration

The server will automatically:
- Check if Cloudinary is configured on startup
- Use Cloudinary storage if configured
- Fall back to memory storage (with warning) if not configured

Check your server logs for:
- ✅ `Cloudinary storage configured for KYC uploads` (success)
- ⚠️ `Cloudinary not configured. Using memory storage...` (needs configuration)

## How It Works

1. **Upload**: When a user submits KYC, the file is uploaded directly to Cloudinary
2. **Storage**: Files are stored in the `inheritx/kyc/` folder in your Cloudinary account
3. **URL Storage**: The Cloudinary secure URL is stored in the database
4. **Optimization**: Images are automatically optimized for web delivery
5. **Cleanup**: Old documents are deleted from Cloudinary when users resubmit

## File Organization

Files are organized in Cloudinary as:
```
inheritx/
  └── kyc/
      ├── kyc-1234567890-123456789.pdf
      ├── kyc-1234567891-987654321.jpg
      └── ...
```

## Security Best Practices

1. **Never commit credentials**: Keep `.env` file in `.gitignore`
2. **Use environment-specific accounts**: Different accounts for dev/staging/prod
3. **Set up access restrictions**: In Cloudinary dashboard, restrict API access
4. **Enable signed URLs**: For sensitive documents (optional, can be added later)

## Troubleshooting

### Error: "Cloudinary is not configured"
- Check that all three environment variables are set
- Restart the server after adding environment variables

### Error: "Failed to upload file to Cloudinary"
- Verify your API credentials are correct
- Check your Cloudinary account limits (free tier: 25GB)
- Ensure your API key has upload permissions

### Files not appearing in Cloudinary
- Check the Cloudinary dashboard → Media Library
- Look in the `inheritx/kyc/` folder
- Check server logs for upload errors

## Cost Considerations

**Free Tier** (sufficient for development):
- 25GB storage
- 25GB bandwidth/month
- 25GB transformations/month

**Paid Plans** (for production):
- Pay-as-you-go or monthly plans available
- See [Cloudinary Pricing](https://cloudinary.com/pricing) for details

## Additional Resources

- [Cloudinary Documentation](https://cloudinary.com/documentation)
- [Node.js SDK Guide](https://cloudinary.com/documentation/node_integration)
- [Image Transformations](https://cloudinary.com/documentation/image_transformations)
