# Project Management Tool

## Overview

The Project Management Tool is a web-based application designed to help teams and organizations plan, organize, track, and manage projects efficiently. The system enables project managers to assign tasks, monitor progress, manage deadlines, and improve collaboration among team members. It provides a centralized platform for project tracking, communication, and reporting.

---

## Features

### User Features

* User Registration and Login
* Profile Management
* View Assigned Projects and Tasks
* Update Task Status
* Collaborate with Team Members
* Receive Notifications and Reminders

### Project Manager Features

* Create, Update, and Delete Projects
* Assign Tasks to Team Members
* Set Deadlines and Priorities
* Monitor Project Progress
* Generate Project Reports

### Admin Features

* User Management
* Project Oversight
* Team Management
* System Monitoring
* Analytics Dashboard

### Security Features

* JWT Authentication
* Password Encryption using Bcrypt
* Role-Based Access Control
* Secure API Access

---

## Technologies Used

### Frontend

* React.js
* HTML5
* CSS3
* JavaScript
* Bootstrap / Tailwind CSS

### Backend

* Node.js
* Express.js

### Database

* MongoDB

### Authentication

* JWT (JSON Web Tokens)
* Bcrypt

---

## Program Structure

```text
project-management-tool/
│
├── client/                         # Frontend Application
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.js
│   │   │   ├── Sidebar.js
│   │   │   ├── TaskCard.js
│   │   │   ├── ProjectCard.js
│   │   │   └── Dashboard.js
│   │   │
│   │   ├── pages/
│   │   │   ├── Home.js
│   │   │   ├── Login.js
│   │   │   ├── Register.js
│   │   │   ├── Projects.js
│   │   │   ├── Tasks.js
│   │   │   ├── Team.js
│   │   │   └── Reports.js
│   │   │
│   │   ├── services/
│   │   │   ├── api.js
│   │   │   ├── authService.js
│   │   │   └── projectService.js
│   │   │
│   │   ├── App.js
│   │   └── index.js
│   │
│   └── package.json
│
├── server/                         # Backend Application
│   ├── config/
│   │   └── db.js
│   │
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── projectController.js
│   │   ├── taskController.js
│   │   ├── userController.js
│   │   └── reportController.js
│   │
│   ├── models/
│   │   ├── User.js
│   │   ├── Project.js
│   │   ├── Task.js
│   │   └── Team.js
│   │
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── projectRoutes.js
│   │   ├── taskRoutes.js
│   │   ├── userRoutes.js
│   │   └── reportRoutes.js
│   │
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   └── errorMiddleware.js
│   │
│   ├── server.js
│   └── package.json
│
├── .env
├── README.md
└── package.json
```

---

## Installation

### Prerequisites

* Node.js (v16 or above)
* MongoDB
* Git

### Clone Repository

```bash
git clone https://github.com/yourusername/project-management-tool.git
cd project-management-tool
```

### Install Dependencies

```bash
npm install
cd client
npm install
```

### Environment Variables

Create a `.env` file in the server directory:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
```

### Run Backend

```bash
npm run server
```

### Run Frontend

```bash
npm start
```

---

## Database Collections

### Users

```json
{
  "_id": "ObjectId",
  "name": "John Doe",
  "email": "john@example.com",
  "password": "hashed_password",
  "role": "Manager"
}
```

### Projects

```json
{
  "_id": "ObjectId",
  "projectName": "Website Development",
  "description": "E-commerce website project",
  "startDate": "2025-01-01",
  "endDate": "2025-03-30",
  "status": "In Progress"
}
```

### Tasks

```json
{
  "_id": "ObjectId",
  "projectId": "ObjectId",
  "assignedTo": "ObjectId",
  "taskName": "Design Homepage",
  "priority": "High",
  "status": "Pending"
}
```

### Teams

```json
{
  "_id": "ObjectId",
  "teamName": "Development Team",
  "members": []
}
```

---

## API Endpoints

### Authentication

* `POST /api/auth/register`
* `POST /api/auth/login`

### Projects

* `GET /api/projects`
* `POST /api/projects`
* `PUT /api/projects/:id`
* `DELETE /api/projects/:id`

### Tasks

* `GET /api/tasks`
* `POST /api/tasks`
* `PUT /api/tasks/:id`
* `DELETE /api/tasks/:id`

### Reports

* `GET /api/reports/project`
* `GET /api/reports/team`

---

## Future Enhancements

* Real-Time Team Chat
* Gantt Chart Visualization
* Kanban Board Integration
* Email and SMS Notifications
* File Sharing and Document Management
* Mobile Application Support
* AI-Based Task Recommendations
* Third-Party Integrations (GitHub, Slack, Google Calendar)

---

## Benefits

* Improved Team Collaboration
* Better Task Organization
* Efficient Resource Management
* Enhanced Project Visibility
* Increased Productivity
* Timely Project Delivery

The Project Management Tool is a comprehensive solution for planning, tracking, and managing projects. With features such as task assignment, project monitoring, team collaboration, and reporting, it helps organizations improve productivity and successfully achieve project goals. Its modular architecture and well-structured codebase make it easy to maintain, scale, and extend with future enhancements.
