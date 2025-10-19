# Propabridge Backend

This is the backend service for the Propabridge WhatsApp property bot. It provides the API endpoints for the frontend and handles the WhatsApp webhook integration.

## Prerequisites

- Node.js v18 or higher
- npm (comes with Node.js)
- PostgreSQL
- Redis
- WhatsApp Business API access
- OpenAI API key

## Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/mmtukut/propabridge.git
   cd propabridge/backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   - Copy `.env.example` to `.env`
   - Update the values in `.env` with your configuration

4. **Start the development server**
   ```bash
   npm run dev
   ```

## Available Scripts

- `npm start` - Start the production server
- `npm run dev` - Start the development server with nodemon
- `npm test` - Run tests
- `npm run lint` - Lint the code

## Project Structure

```
backend/
├── config/           # Configuration files
├── controllers/      # Route controllers
├── middlewares/      # Custom express middlewares
├── models/           # Database models
├── routes/           # API routes
├── services/         # Business logic
├── utils/            # Utility functions
├── .env              # Environment variables
├── .gitignore        # Git ignore file
├── index.js          # Application entry point
└── package.json      # Project dependencies and scripts
```

## API Endpoints

### WhatsApp Webhook

- `POST /api/v1/webhook` - WhatsApp webhook endpoint

### Properties

- `GET /api/v1/properties` - Get all properties
- `GET /api/v1/properties/:id` - Get a single property
- `POST /api/v1/properties` - Create a new property
- `PUT /api/v1/properties/:id` - Update a property
- `DELETE /api/v1/properties/:id` - Delete a property

### Matches

- `POST /api/v1/matches` - Find property matches
- `GET /api/v1/matches/:id` - Get match details

## Environment Variables

See `.env.example` for the list of required environment variables.

## License

This project is licensed under the ISC License.
