# Propabridge - Complete Setup & Deployment Guide

## 🎯 Overview

Propabridge is an AI-powered property marketplace for Nigeria with WhatsApp integration. This guide will help you set up, run, and deploy the application.

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Local Development Setup](#local-development-setup)
3. [Database Setup](#database-setup)
4. [Environment Configuration](#environment-configuration)
5. [Running the Application](#running-the-application)
6. [Testing](#testing)
7. [Deployment](#deployment)
8. [API Documentation](#api-documentation)

---

## Prerequisites

### Required Software

- **Node.js** v18+ ([Download](https://nodejs.org/))
- **PostgreSQL** 14+ ([Download](https://www.postgresql.org/download/))
- **Git** ([Download](https://git-scm.com/downloads))
- **Redis** (Optional, for production caching) ([Download](https://redis.io/download))

### Required Accounts

- **Google AI (Gemini)** - For AI processing ([Get API Key](https://makersuite.google.com/app/apikey))
- **WhatsApp Business API** - For messaging ([Meta Business Suite](https://business.facebook.com/))
- **Cloudinary** (Optional) - For image uploads ([Sign up](https://cloudinary.com/))

---

## Local Development Setup

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/propabridge.git
cd propabridge
```

### 2. Install Dependencies

```bash
# Backend dependencies
cd backend
npm install

# Return to root
cd ..
```

### 3. Create Environment Files

Create `.env` file in the `backend` directory:

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` with your credentials (see [Environment Configuration](#environment-configuration)).

---

## Database Setup

### 1. Create PostgreSQL Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE propabridge;

# Exit
\q
```

### 2. Run Database Initialization

```bash
cd backend

# Run init script
psql -U postgres -d propabridge -f db/init.sql
```

### 3. Seed Database with Sample Data

```bash
# Make sure you're in backend directory
npm run seed
```

You should see:
```
✅ Database seeded successfully!
   - 50 properties created
   - 50 users created
   - Ready for production!
```

---

## Environment Configuration

### Backend `.env` File

```env
# Server Configuration
NODE_ENV=development
PORT=5000

# Database
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/propabridge

# Google Gemini AI
GEMINI_API_KEY=your_gemini_api_key_here

# WhatsApp Business API
WHATSAPP_ACCESS_TOKEN=your_whatsapp_access_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_WEBHOOK_VERIFY_TOKEN=your_custom_verify_token

# Authentication
JWT_SECRET=your_super_secret_jwt_key_min_32_characters

# Optional: Image Upload (Cloudinary)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Optional: SMS Provider (for OTP)
# TWILIO_ACCOUNT_SID=your_twilio_sid
# TWILIO_AUTH_TOKEN=your_twilio_token
# TWILIO_PHONE_NUMBER=your_twilio_number
```

### Getting API Keys

#### Google Gemini API Key
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Click "Get API Key"
3. Copy the key to your `.env` file

#### WhatsApp Business API Setup
1. Go to [Meta Business Suite](https://business.facebook.com/)
2. Create a WhatsApp Business App
3. Get your:
   - Access Token
   - Phone Number ID
   - Create a webhook verify token (any random string)

---

## Running the Application

### Development Mode

```bash
# Terminal 1: Run backend
cd backend
npm run dev

# Backend will start on http://localhost:5000
```

Open browser to `http://localhost:5000` to see the app.

### Production Mode

```bash
cd backend
npm start
```

---

## Testing

### Test Database Connection

```bash
cd backend
node test-db.js
```

Expected output:
```
✅ Database connection successful!
✅ Properties table exists
✅ Conversations table exists
```

### Test API Endpoints

```bash
# Test health check
curl http://localhost:5000/api/v1/properties/search

# Test authentication
curl -X POST http://localhost:5000/api/v1/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone":"+2348012345678"}'
```

### Test WhatsApp Webhook

1. Use [ngrok](https://ngrok.com/) to expose local server:
```bash
ngrok http 5000
```

2. Copy the ngrok URL (e.g., `https://abc123.ngrok.io`)

3. Set webhook in Meta Business Suite:
   - Webhook URL: `https://abc123.ngrok.io/api/v1/webhook`
   - Verify Token: (your `WHATSAPP_WEBHOOK_VERIFY_TOKEN`)

4. Send a WhatsApp message to your test number

---

## Deployment

### Option 1: Deploy to Render.com (Recommended)

#### Backend Deployment

1. **Create Render Account** - [Sign up](https://render.com/)

2. **Create PostgreSQL Database**
   - Go to Dashboard → New → PostgreSQL
   - Name: `propabridge-db`
   - Copy the "Internal Database URL"

3. **Create Web Service**
   - Go to Dashboard → New → Web Service
   - Connect your GitHub repository
   - Settings:
     - Name: `propabridge-api`
     - Environment: `Node`
     - Build Command: `cd backend && npm install`
     - Start Command: `cd backend && npm start`

4. **Set Environment Variables**
   - Add all variables from your `.env` file
   - Set `DATABASE_URL` to the PostgreSQL URL from step 2

5. **Run Database Setup**
   - Open Render Shell
   - Run: `cd backend && node db/seed.js`

#### Frontend Deployment to Vercel

1. **Install Vercel CLI**
```bash
npm install -g vercel
```

2. **Deploy Frontend**
```bash
cd frontend
vercel --prod
```

3. **Update API Base URL**
   - In `frontend/api.js`, update `API_BASE_URL` to your Render backend URL

### Option 2: Deploy to Railway.app

1. **Create Railway Account** - [Sign up](https://railway.app/)

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"

3. **Add PostgreSQL**
   - Click "New" → "Database" → "PostgreSQL"
   - Copy connection string

4. **Add Environment Variables**
   - Go to Variables tab
   - Add all env variables

5. **Deploy**
   - Railway will auto-deploy on git push

### Option 3: Deploy to Your Own VPS

#### Using Ubuntu Server

```bash
# 1. SSH into your server
ssh user@your-server-ip

# 2. Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. Install PostgreSQL
sudo apt install postgresql postgresql-contrib

# 4. Clone repository
git clone https://github.com/your-username/propabridge.git
cd propabridge

# 5. Install dependencies
cd backend && npm install

# 6. Setup database
sudo -u postgres psql
CREATE DATABASE propabridge;
\q

psql -U postgres -d propabridge -f db/init.sql
node db/seed.js

# 7. Install PM2 for process management
sudo npm install -g pm2

# 8. Start application
pm2 start index.js --name propabridge

# 9. Setup PM2 startup
pm2 startup
pm2 save

# 10. Setup Nginx reverse proxy
sudo apt install nginx
sudo nano /etc/nginx/sites-available/propabridge
```

Nginx configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/propabridge /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Setup SSL with Let's Encrypt
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

## API Documentation

### Authentication Endpoints

#### Send OTP
```http
POST /api/v1/auth/send-otp
Content-Type: application/json

{
  "phone": "+2348012345678"
}
```

#### Verify OTP
```http
POST /api/v1/auth/verify-otp
Content-Type: application/json

{
  "phone": "+2348012345678",
  "code": "123456"
}
```

### Property Endpoints

#### Search Properties
```http
GET /api/v1/properties/search?location=Lekki&maxPrice=5000000&bedrooms=3
```

#### Get Property by ID
```http
GET /api/v1/properties/123
```

#### Create Property (Requires Auth)
```http
POST /api/v1/properties
Authorization: Bearer your_token_here
Content-Type: application/json

{
  "type": "3 Bed Flat",
  "location": "Lekki, Lagos",
  "price": 3500000,
  "bedrooms": 3,
  "bathrooms": 3,
  "area": 180,
  "features": "Pool, gym, 24/7 power",
  "amenities": ["parking", "power", "security", "pool"]
}
```

### WhatsApp Webhook

```http
GET /api/v1/webhook?hub.mode=subscribe&hub.verify_token=your_token&hub.challenge=123
POST /api/v1/webhook
```

---

## Troubleshooting

### Database Connection Errors

```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Restart PostgreSQL
sudo systemctl restart postgresql

# Check connection
psql -U postgres -d propabridge -c "SELECT 1"
```

### WhatsApp Webhook Not Receiving Messages

1. Check webhook URL is correct in Meta Business Suite
2. Verify verify token matches `.env`
3. Check server logs for errors
4. Test with ngrok first before production

### Gemini AI API Errors

- Verify API key is correct
- Check API quota/limits
- Ensure proper error handling in `aiService.js`

---

## Production Checklist

Before going live:

- [ ] Database is backed up regularly
- [ ] Environment variables are secured
- [ ] HTTPS is enabled (SSL certificate)
- [ ] Rate limiting is configured
- [ ] Error monitoring is set up (Sentry)
- [ ] Analytics are configured (Google Analytics)
- [ ] WhatsApp Business API is verified
- [ ] Terms of Service and Privacy Policy are added
- [ ] Admin panel is secured
- [ ] Database indexes are optimized
- [ ] CDN is configured for static assets
- [ ] Backup server/failover is ready

---

## Support

For issues or questions:
- GitHub Issues: [Report a bug](https://github.com/your-username/propabridge/issues)
- Email: support@propabridge.ng
- WhatsApp: +234 805 526 9579

---

## License

ISC License - See LICENSE file for details

---

Built with ❤️ for Nigerian property seekers

