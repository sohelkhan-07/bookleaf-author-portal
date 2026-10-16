BookLeaf Author Portal

A full-stack author support and ticket management platform built to streamline communication between authors and the BookLeaf publishing operations team. The application provides an author portal for managing books and support requests, alongside an administrative dashboard for handling tickets with AI-assisted classification, priority assessment, and response drafting.

🚀 Live Demo

Live Application: "BookLeaf Author Portal" (https://YOUR-LIVE-DEMO-URL)

📸 Screenshots

Login Page

"Login Page" (docs/screenshots/login.png)

Author Dashboard

"Author Dashboard" (docs/screenshots/author-dashboard.png)

My Books

"My Books" (docs/screenshots/my-books.png)

My Tickets

"My Tickets" (docs/screenshots/my-tickets.png)

Admin Ticket Queue

"Admin Ticket Queue" (docs/screenshots/admin-ticket-queue.png)

📑 Table of Contents

- "Introduction" (#bookleaf-author-portal)
- "Live Demo" (#-live-demo)
- "Screenshots" (#-screenshots)
- "Features" (#-features)
- "Technology Stack" (#-technology-stack)
- "System Architecture" (#-system-architecture)
- "Project Structure" (#-project-structure)
- "Prerequisites" (#-prerequisites)
- "Installation and Setup" (#-installation-and-setup)
- "Environment Variables" (#-environment-variables)
- "Running the Application" (#-running-the-application)
- "Available Scripts" (#-available-scripts)
- "API Documentation" (#-api-documentation)
- "Authentication and Authorization" (#-authentication-and-authorization)
- "Database Models" (#-database-models)
- "AI Integration" (#-ai-integration)
- "Real-Time Communication" (#-real-time-communication)
- "Database Seeding" (#-database-seeding)
- "Troubleshooting" (#-troubleshooting)
- "Security Considerations" (#-security-considerations)
- "Future Improvements" (#-future-improvements)
- "License" (#-license)

✨ Features

Author Portal

- User Authentication: Registration and login using JWT-based authentication.
- Author Dashboard: A dedicated dashboard for authors.
- Book Management: View book-related information associated with the author's account.
- Support Ticket Creation: Submit support queries through the ticket system.
- Ticket Tracking: View submitted tickets and monitor their status.
- Ticket Conversations: Communicate with the support team through ticket messages.
- Role-Based Access: Access author-specific features and resources.

Admin Portal

- Administrative Dashboard: A dedicated interface for support operations.
- Centralized Ticket Queue: Review tickets submitted by authors.
- Ticket Classification: AI-assisted categorization of support requests.
- Priority Assessment: Categorize ticket urgency using priority levels.
- AI-Assisted Responses: Generate draft responses to help administrators handle queries.
- Ticket Workflow Management: Manage ticket statuses and support operations.

AI-Assisted Support

The backend includes dedicated services for Google Gemini integration, ticket AI processing, and a BookLeaf knowledge base. These services support AI-assisted ticket handling while keeping AI logic separate from the main route handlers.

Real-Time Communication

Socket.IO is integrated into the application to support real-time communication between the client and server.

🛠️ Technology Stack

Category| Technologies
Frontend| React, JavaScript, Vite
Styling| Tailwind CSS
Icons| Lucide React
Routing| React Router
Backend| Node.js, Express.js
Database| MongoDB, Mongoose
Authentication| JSON Web Tokens, bcryptjs
AI Integration| Google Gemini API, "@google/genai"
Real-Time Communication| Socket.IO
Input Validation| Zod
Development Tools| ESLint, Nodemon

🏗️ System Architecture

The application follows a client-server architecture with separate frontend and backend applications.

                   ┌──────────────────────┐
                   │        Users         │
                   │   Authors / Admins   │
                   └──────────┬───────────┘
                              │
                              ▼
                   ┌──────────────────────┐
                   │   React Frontend     │
                   │   Vite + Router      │
                   └──────────┬───────────┘
                              │
                     REST API / Socket.IO
                              │
                              ▼
                   ┌──────────────────────┐
                   │   Express Backend    │
                   │ Authentication       │
                   │ Authorization        │
                   │ API Routes           │
                   │ AI Services          │
                   └──────────┬───────────┘
                              │
                    ┌─────────┴──────────┐
                    ▼                    ▼
          ┌─────────────────┐  ┌─────────────────┐
          │    MongoDB      │  │   Gemini API    │
          │ Application Data│  │  AI Processing  │
          └─────────────────┘  └─────────────────┘

Architecture Components

- Frontend: React-based interfaces for authors and administrators.
- REST API: Express routes handle authentication, books, tickets, and administrative operations.
- Authentication Middleware: Validates JWTs and enforces access permissions.
- Database Layer: Mongoose models manage MongoDB records.
- AI Services: Process ticket-related AI tasks and provide BookLeaf knowledge-base context.
- Socket.IO: Provides real-time communication infrastructure.

📁 Project Structure

bookleaf-author-portal/
├── .gitignore
├── README.md
├── package.json
├── package-lock.json
├── docs/
│   └── screenshots/
│       ├── login.png
│       ├── author-dashboard.png
│       ├── my-books.png
│       ├── my-tickets.png
│       └── admin-ticket-queue.png
│
├── client/
│   ├── .gitignore
│   ├── eslint.config.js
│   ├── index.html
│   ├── package.json
│   ├── package-lock.json
│   ├── vite.config.js
│   ├── public/
│   │   ├── bookleaf-logo.png
│   │   └── favicon.png
│   └── src/
│       ├── App.jsx
│       ├── index.css
│       ├── main.jsx
│       ├── components/
│       │   ├── AuthLayout.jsx
│       │   ├── Brand.jsx
│       │   ├── FormField.jsx
│       │   ├── LoadingState.jsx
│       │   └── ProtectedRoute.jsx
│       ├── context/
│       │   ├── AuthContext.js
│       │   ├── AuthContext.jsx
│       │   └── useAuth.js
│       ├── layouts/
│       │   ├── AdminLayout.jsx
│       │   └── AuthorLayout.jsx
│       ├── lib/
│       │   ├── api.js
│       │   └── socket.js
│       └── pages/
│           ├── NotFoundPage.jsx
│           ├── admin/
│           │   ├── AdminDashboard.jsx
│           │   └── TicketQueuePage.jsx
│           ├── auth/
│           │   ├── LoginPage.jsx
│           │   └── RegisterPage.jsx
│           └── author/
│               ├── AuthorDashboard.jsx
│               ├── MyBooksPage.jsx
│               └── MyTicketsPage.jsx
│
└── server/
    ├── db.js
    ├── package.json
    ├── package-lock.json
    ├── realtime.js
    ├── seed-admin.js
    ├── seed.js
    ├── server.js
    ├── socket.js
    ├── data/
    │   └── sample-data.json
    ├── middleware/
    │   └── auth.js
    ├── models/
    │   ├── Book.js
    │   ├── Ticket.js
    │   └── User.js
    ├── routes/
    │   ├── admin.routes.js
    │   ├── auth.routes.js
    │   ├── books.routes.js
    │   └── tickets.routes.js
    └── services/
        ├── bookleaf-knowledge-base.js
        ├── gemini.service.js
        └── ticket-ai.service.js

Directory Overview

Directory / File| Description
"client/src/components/"| Reusable interface components.
"client/src/context/"| Authentication context and related hooks.
"client/src/layouts/"| Author and admin layouts.
"client/src/lib/"| API and Socket.IO client utilities.
"client/src/pages/"| Application pages grouped by role and purpose.
"server/models/"| MongoDB schemas and data models.
"server/routes/"| REST API route handlers.
"server/middleware/"| Authentication and authorization middleware.
"server/services/"| AI integration and knowledge-base logic.
"server/data/"| Sample application data.
"server/server.js"| Backend application entry point.
"server/db.js"| Database connection logic.

Dependency directories such as "node_modules/" are excluded from version control.

📋 Prerequisites

Ensure the following tools and services are available before setting up the project:

- "Node.js" (https://nodejs.org/)
- npm, included with Node.js
- "MongoDB" (https://www.mongodb.com/) local installation or hosted database
- "Google Gemini API key" (https://aistudio.google.com/)
- "Git" (https://git-scm.com/)

Verify the installations:

node --version
npm --version
git --version

🚀 Installation and Setup

1. Clone the Repository

git clone https://github.com/sohelkhan-07/bookleaf-author-portal.git
cd bookleaf-author-portal

2. Install Frontend Dependencies

cd client
npm install

3. Install Backend Dependencies

Open another terminal in the project root and run:

cd server
npm install

The frontend and backend maintain separate dependency configurations.

4. Configure Environment Variables

Create the environment files described in the next section before starting the application.

🔐 Environment Variables

Backend Configuration

Create "server/.env":

PORT=5000
CLIENT_URL=http://localhost:5173

MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_long_random_jwt_secret
GEMINI_API_KEY=your_gemini_api_key

ADMIN_NAME=Your Admin Name
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=your_admin_password

SEED_AUTHOR_PASSWORD=your_test_author_password

Replace the example values with your own development configuration. Do not commit this file to version control.

Variable| Description
"PORT"| Port on which the backend server listens.
"CLIENT_URL"| Frontend origin configuration.
"MONGODB_URI"| MongoDB connection string.
"JWT_SECRET"| Secret used for JWT signing and verification.
"GEMINI_API_KEY"| API key for the Gemini integration.
"ADMIN_NAME"| Administrator name used by the admin seed configuration.
"ADMIN_EMAIL"| Administrator email used by the admin seed configuration.
"ADMIN_PASSWORD"| Administrator password used by the admin seed configuration.
"SEED_AUTHOR_PASSWORD"| Password used by the author seed configuration.

Frontend Configuration

Create "client/.env":

VITE_API_URL=http://localhost:5000/api

The frontend uses "VITE_API_URL" to determine the backend API base URL. If the variable is not set, the API helper falls back to "http://localhost:5000/api".

Security note: Variables prefixed with "VITE_" are exposed to frontend code. Never store database credentials, JWT secrets, administrator passwords, or AI API keys in frontend environment variables.

▶️ Running the Application

Start the backend and frontend in separate terminals.

Start the Backend

cd server
npm run dev

The development command uses Nodemon to restart the backend when files change.

To run the backend without Nodemon:

npm start

The backend defaults to port "5000" when no custom port is configured.

Start the Frontend

In a second terminal:

cd client
npm run dev

Open the local development URL displayed by Vite. The default is usually:

http://localhost:5173

Ensure that MongoDB is reachable and both the backend and frontend are running.

📜 Available Scripts

Frontend Scripts

Run these commands from the "client/" directory.

Command| Description
"npm run dev"| Start the Vite development server.
"npm run build"| Build the frontend for production.
"npm run lint"| Run ESLint checks.
"npm run preview"| Preview the production build locally.

Backend Scripts

Run these commands from the "server/" directory.

Command| Description
"npm start"| Start the backend with Node.js.
"npm run dev"| Start the backend with Nodemon.

🔌 API Documentation

The Express server mounts four main API route groups.

Base Endpoint| Responsibility
"/api/auth"| Authentication and current-user operations.
"/api/books"| Book-related operations.
"/api/tickets"| Author ticket operations and conversations.
"/api/admin"| Administrative support operations.

Authentication Endpoints

Method| Endpoint| Description| Access
"POST"| "/api/auth/register"| Register a user account.| Public registration flow
"POST"| "/api/auth/login"| Authenticate a user.| Public
"GET"| "/api/auth/me"| Retrieve the authenticated user's information.| Authenticated

Ticket Endpoints

Method| Endpoint| Description| Access
"POST"| "/api/tickets"| Create a support ticket.| Author
"GET"| "/api/tickets/my-tickets"| Retrieve tickets belonging to the author.| Author
"GET"| "/api/tickets/:id"| Retrieve a ticket by ID.| Author, subject to route authorization
"POST"| "/api/tickets/:id/messages"| Add a message to a ticket.| Author, subject to route authorization

Authentication Header

Protected API requests use a JWT Bearer token:

Authorization: Bearer YOUR_JWT_TOKEN

Books and Administrative Routes

Additional routes are available under "/api/books" and "/api/admin". Their exact methods, paths, query parameters, and request payloads are defined in:

- "server/routes/books.routes.js"
- "server/routes/admin.routes.js"

🛡️ Authentication and Authorization

The application uses JSON Web Tokens for authentication and "bcryptjs" for password hashing support.

The backend includes authentication middleware and role-based authorization for protected functionality.

The defined user roles are:

- "author"
- "admin"

Access to protected resources should be validated on the backend. Author access should be restricted to the authenticated author's own data, while administrative operations should require the appropriate permissions.

🗄️ Database Models

The application uses MongoDB with Mongoose.

User

Defined in "server/models/User.js", this model represents user accounts and includes role information.

Book

Defined in "server/models/Book.js", this model represents book records used by the author portal.

Ticket

Defined in "server/models/Ticket.js", this model represents support requests, associated users and books, and ticket conversations.

The ticket schema defines the following statuses:

- "Open"
- "In Progress"
- "Waiting for Author"
- "Resolved"
- "Closed"

Supported priority levels include:

- "Critical"
- "High"
- "Medium"
- "Low"

The schema also defines ticket categories and conversation message roles.

Refer to the model files for the exact fields, references, defaults, and validation rules.

🤖 AI Integration

AI-related functionality is separated into dedicated backend service modules:

- "server/services/gemini.service.js"
- "server/services/ticket-ai.service.js"
- "server/services/bookleaf-knowledge-base.js"

The application uses the Google Gemini SDK through the "@google/genai" package.

AI-Assisted Workflow

1. An author submits a support ticket.
2. The backend processes the ticket request.
3. AI services can assist with ticket categorization and priority assessment.
4. An administrator can use an AI-generated response draft as a starting point.
5. The administrator can review and respond to the author through the ticket workflow.

The knowledge-base service provides a dedicated location for BookLeaf-specific information used by AI support features.

AI Reliability

AI providers may enforce request quotas, rate limits, or daily usage limits. If the quota is exhausted, AI-generated classification or response drafting may be unavailable until access is restored or the quota resets.

Ticket persistence and AI response generation are separate concerns. A ticket may be saved even when AI processing fails, depending on the backend's error-handling implementation.

For production use, AI integrations should include:

- Graceful handling of provider errors and rate limits.
- Input and output validation.
- Human review before sending AI-generated replies.
- Prompt-size and token-usage controls.
- Safe logging that avoids exposing sensitive data.
- A manual response path when AI functionality is unavailable.

⚡ Real-Time Communication

Socket.IO is integrated into both the backend and frontend.

Relevant files include:

- "server/socket.js"
- "server/realtime.js"
- "client/src/lib/socket.js"

The frontend socket client is configured to reconnect after connection interruptions.

Actual ticket event names, payloads, authorization rules, and update behavior are defined in the Socket.IO implementation.

🌱 Database Seeding

The backend includes the following seed-related files:

- "server/seed.js"
- "server/seed-admin.js"
- "server/data/sample-data.json"

These files support the project's sample-data and administrator setup workflows.

Before executing a seed script, review its source to understand which records it creates or modifies. Use a development database when testing and ensure the relevant environment variables are configured.

🧰 Troubleshooting

Frontend Cannot Connect to the Backend

- Confirm that the backend is running.
- Check "VITE_API_URL" in "client/.env".
- Verify the backend port and API base URL.
- Inspect the browser console and network panel for request failures.
- Restart the Vite development server after changing environment variables.

MongoDB Connection Errors

- Verify the "MONGODB_URI" value.
- Ensure the MongoDB instance is running and reachable.
- Check database credentials and network access settings.
- Review backend terminal logs for connection errors.

Authentication Problems

- Verify the account credentials.
- Ensure "JWT_SECRET" is configured.
- Confirm that protected requests include the Bearer token.
- Inspect backend responses for authentication and authorization errors.

AI Daily Limit or Quota Errors

- Verify that "GEMINI_API_KEY" is valid.
- Check the Gemini API quota and usage limits.
- Review backend logs to identify the failed AI operation.
- Check whether the ticket was saved before the AI request failed.
- Use the administrative interface's manual response capability if it is available.

Real-Time Updates Not Working

- Ensure both frontend and backend are running.
- Check the browser console for Socket.IO errors.
- Review server event handlers and frontend event subscriptions.
- Confirm that the connection and authorization requirements are satisfied.

🔒 Security Considerations

- Keep environment files out of version control.
- Never expose API keys or server secrets in frontend code.
- Use strong, unique credentials.
- Validate user input on the backend.
- Enforce resource ownership and role permissions on the server.
- Avoid logging passwords, tokens, and sensitive ticket conversations.
- Use HTTPS and appropriately restricted CORS settings in production.
- Rotate any credentials that are accidentally exposed.

🔮 Future Improvements

- OpenAPI or Swagger documentation for all API endpoints.
- Automated unit, integration, and end-to-end tests.
- More detailed administrative audit logs.
- Improved AI failure monitoring and usage analytics.
- Rate limiting and additional production security controls.
- Expanded support analytics and ticket resolution metrics.
- Deployment automation and production environment documentation.
- More detailed documentation for real-time event payloads.

