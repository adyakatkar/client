NovaNews Backend
This repository contains the Node.js and Express server for the NovaNews application. It handles news data retrieval from NewsAPI, AI summarization using the Gemini API, and database management via Supabase.

Prerequisites
Node.js installed

npm (Node Package Manager)

Local Setup
Clone the repository to your local machine.

Open a terminal in the server folder.

Install the required dependencies:
npm install

Configuration
Create a file named .env in the root directory.

Add the following environment variables (replace with actual keys):

NEWS_API_KEY=your_key

GEMINI_API_KEY=your_key

SUPABASE_URL=your_supabase_url

SUPABASE_KEY=your_supabase_anon_key

Running the Server
Start the server using the command:
node server.js

The backend will be accessible at http://localhost:5000.

2. For the Frontend Repository (client/README.md)
NovaNews Frontend
This repository contains the React.js frontend for the NovaNews application. It provides an interface to browse news, search by category, and save articles with AI-generated summaries.

Prerequisites
Node.js installed

npm (Node Package Manager)

The NovaNews Backend must be running on port 5000 for full functionality.

Local Setup
Clone the repository to your local machine.

Open a terminal in the client folder.

Install the required dependencies:
npm install

Connection Setup
Open the file src/App.js.

Ensure the API_BASE_URL constant is set to http://localhost:5000 to communicate with the local backend.

Running the Application
Start the development server:
npm start

The application will open automatically in your browser at http://localhost:3000.
