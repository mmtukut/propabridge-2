# Propabridge Deployment Guide

## Environment Variables for Render Deployment

Set these environment variables in your Render backend service:

### Required Variables:
```
DATABASE_URL=postgresql://propabridge_db_user:jCJzkEWziyo3vpnPzbvue4uTZ0Gd46LR@dpg-d3qn0d63jp1c738o6c6g-a.oregon-postgres.render.com/propabridge_db
PORT=5000
NODE_ENV=production
```

### AI Service Configuration:
```
GEMINI_API_KEY=your_actual_gemini_api_key_here
```

### Optional WhatsApp Integration:
```
WHATSAPP_TOKEN=your_whatsapp_token_here
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id_here
```

## Database Setup

The application is configured to use the PostgreSQL database on Render. Make sure:

1. The database is properly initialized with the required tables
2. The DATABASE_URL is set correctly in environment variables
3. SSL is enabled for production connections

## Production Features

- ✅ Real database integration (no mock data)
- ✅ SSL-enabled database connections
- ✅ Proper error handling
- ✅ Production-ready logging
- ✅ Environment-based configuration

## Testing

To test the production setup:

1. Set the environment variables in Render
2. Deploy the backend
3. Update frontend API URL to point to deployed backend
4. Test property search functionality

## Notes

- All mock data and test files have been removed
- The application now requires proper database connection
- Gemini API key is required for AI functionality
- Frontend will show proper error messages if backend is unavailable
