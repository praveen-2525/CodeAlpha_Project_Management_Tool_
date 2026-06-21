# Project Management Platform

## Features Included
- JWT Authentication (Login/Register)
- Workspace & Project Management
- Kanban Board with Drag and Drop (`@hello-pangea/dnd`)
- Task Management & Comments
- Real-time updates with `Socket.IO`
- Modern Glassmorphism UI with Bootstrap & Lucide icons

## Tech Stack
- Frontend: React (Vite), React Router, React Bootstrap, Axios
- Backend: Node.js, Express, MongoDB, Mongoose, Socket.io, JsonWebToken, Bcrypt

## Running the App
1. Setup MongoDB (local or Atlas) and create a `.env` in the `backend/` folder:
   ```
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   CLIENT_URL=http://localhost:5173
   ```
2. Start the backend:
   ```bash
   cd backend
   npm install
   npm run dev
   ```
3. Start the frontend:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
