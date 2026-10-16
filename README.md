BookLeaf Author Portal

A full-stack author support and ticket management platform built to streamline communication between authors and the BookLeaf publishing operations team. The application provides an author portal for managing books and support requests, alongside an administrative dashboard for handling tickets with AI-assisted classification, priority assessment, and response drafting.

---

Live Demo

Live Application: "BookLeaf Author Portal" (https://YOUR-LIVE-DEMO-URL)

---

Screenshots

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

---

Table of Contents

- "Overview" (#overview)
- "Features" (#features)
- "Technology Stack" (#technology-stack)
- "System Architecture" (#system-architecture)
- "Project Structure" (#project-structure)
- "Getting Started" (#getting-started)
- "Environment Configuration" (#environment-configuration)
- "Running the Application" (#running-the-application)
- "Available Scripts" (#available-scripts)
- "API Documentation" (#api-documentation)
- "Authentication and Authorization" (#authentication-and-authorization)
- "Database Models" (#database-models)
- "AI Integration" (#ai-integration)
- "Real-Time Communication" (#real-time-communication)
- "Database Seeding" (#database-seeding)
- "Troubleshooting" (#troubleshooting)
- "Security Considerations" (#security-considerations)
- "Future Improvements" (#future-improvements)
- "License" (#license)

---

Overview

BookLeaf Author Portal is designed to improve the way authors interact with the BookLeaf publishing operations team. It provides a centralized platform for book-related information, support tickets, and communication between authors and administrators.

The application combines a React frontend with an Express backend, MongoDB for data persistence, Socket.IO for real-time communication, and Google's Gemini API for AI-assisted ticket processing.

The platform separates author and administrator workflows through role-based access control, providing dedicated interfaces for submitting and tracking support requests and managing tickets.

Features

Author Portal

- Secure registration and login.
- Author dashboard for accessing relevant information.
- Book listing and book-related information.
- Support ticket creation and tracking.
- Ticket conversation and messaging functionality.
- Dedicated author interface for managing support requests.

Administrative Dashboard

- Dedicated administrator interface.
- Centralized ticket queue.
- Ticket management and status tracking.
- Ticket priority and category information.
- Support workflow for handling author requests.

AI-Assisted Support

- Gemini-powered AI service integration.
- AI-assisted ticket classification and priority assessment.
- AI-assisted response drafting.
- BookLeaf knowledge-base service integration.

AI-generated responses depend on API availability, quota limits, and successful processing. AI functionality may be unavailable when the configured service reaches its usage limit.

Real-Time Communication

- Socket.IO integration between the frontend and backend.
- Real-time communication infrastructure for supported application events.
- Automatic reconnection configuration in the frontend socket client.

Security and Data Management

- JWT-based authentication.
- Password hashing with bcrypt.
- Role-based authorization middleware.
- MongoDB data persistence using Mongoose.
- Environment-based configuration for secrets and connection settings.

---

Technology Stack

Layer| Technologies
Frontend| React, Vite, JavaScript
Routing| React Router
Styling| Tailwind CSS 4
Icons| Lucide React
Backend| Node.js, Express
Database| MongoDB, Mongoose
Authentication| JSON Web Tokens, bcryptjs
Real-time communication| Socket.IO
AI integration| Google Gemini API through "@google/genai"
Validation| Zod
Frontend tooling| ESLint
Backend development| Nodemon

---

System Architecture

The application follows a client-server architecture.

+---------------------------+
|       React Frontend      |
|                           |
|  Author Portal            |
|  Admin Dashboard          |
|  Authentication           |
+-------------+-------------+
              |
              | HTTP / REST API
              | Socket.IO
              |
+-------------v-------------+
|      Express Backend      |
|                           |
|  Authentication Routes    |
|  Book Routes              |
|  Ticket Routes            |
|  Admin Routes             |
|  Authentication Middleware|
|  AI Services              |
+----------+---------+------+
           |         |
           |         |
+----------v---+ +---v----------------+
|   MongoDB    | | Google Gemini API  |
|              | |                    |
| Users        | | AI-assisted ticket |
| Books        | | processing         |
| Tickets      | |                    |
+--------------+ +--------------------+

The frontend communicates with the backend through REST API endpoints and Socket.IO. The backend handles authentication, business logic, database operations, and integration with the AI service.

---

Project Structure

bookleaf-author-portal/
├── .gitignore
├── package.json
├── package-lock.json
├── README.md
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
    ├── package.json
    ├── db.js
    ├── server.js
    ├── realtime.js
    ├── socket.js
    ├── seed.js
    ├── seed-admin.js
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

The "node_modules/" directories and local environment files are generated or machine-specific and are not included in this project structure.

---

Getting Started

Prerequisites

Make sure the following are installed on your system:

- "Node.js" (https://nodejs.org/) with npm.
- "Git" (https://git-scm.com/).
- A MongoDB database, either locally or through "MongoDB Atlas" (https://www.mongodb.com/atlas).
- A Google Gemini API key for AI-assisted functionality.

Installation

1. Clone the repository

git clone https://github.com/sohelkhan-07/bookleaf-author-portal.git

2. Navigate to the project directory

cd bookleaf-author-portal

3. Install frontend dependencies

cd client
npm install

4. Install backend dependencies

Open a second terminal from the project root, then run:

cd server
npm install

The frontend and backend have separate package files and must be installed separately.

---

Environment Configuration

The application uses environment variables for database access, authentication, frontend connectivity, and AI integration.

Backend Configuration

Create a file named ".env" inside the "server/" directory.

File: "server/.env"

PORT=5000
CLIENT_URL=http://localhost:5173

MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_long_random_jwt_secret

GEMINI_API_KEY=your_gemini_api_key

ADMIN_NAME=Your Admin Name
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=your_admin_password

SEED_AUTHOR_PASSWORD=your_test_author_password

Replace the example values with your own configuration. Use a strong, unique JWT secret and secure passwords.

Frontend Configuration

Create a file named ".env" inside the "client/" directory.

File: "client/.env"

VITE_API_URL=http://localhost:5000/api

The frontend uses this variable to determine the backend API base URL. If it is not configured, the API helper defaults to "http://localhost:5000/api".

Environment Variable Reference

Variable| Purpose
"PORT"| Port on which the backend server listens.
"CLIENT_URL"| Frontend origin configuration.
"MONGODB_URI"| MongoDB connection string.
"JWT_SECRET"| Secret used for signing and verifying JWTs.
"GEMINI_API_KEY"| API key for Gemini integration.
"ADMIN_NAME"| Administrator name used by the admin seed configuration.
"ADMIN_EMAIL"| Administrator email used by the admin seed configuration.
"ADMIN_PASSWORD"| Administrator password used by the admin seed configuration.
"SEED_AUTHOR_PASSWORD"| Password used by the author seed configuration.
"VITE_API_URL"| Frontend API base URL.

Never commit real ".env" files, database credentials, API keys, or authentication secrets to version control.

---

Running the Application

The frontend and backend must run in separate terminals during local development.

Start the Backend

In the first terminal:

cd server
npm run dev

To run the backend without Nodemon:

npm start

The default backend port is "5000", unless overridden by the "PORT" environment variable.

Start the Frontend

In the second terminal:

cd client
npm run dev

Vite will display the local development URL in the terminal. With the default configuration, this is typically:

http://localhost:5173

Open the displayed frontend URL in your browser.

Build the Frontend for Production

From the "client/" directory:

npm run build

The production build is generated in the frontend's "dist/" directory.

---

Available Scripts

Frontend Scripts

Run these commands from "client/".

Command| Description
"npm run dev"| Starts the Vite development server.
"npm run build"| Builds the frontend for production.
"npm run lint"| Runs ESLint.
"npm run preview"| Previews the production build locally.

Backend Scripts

Run these commands from "server/".

Command| Description
"npm start"| Starts the Express server.
"npm run dev"| Starts the server using Nodemon.

---

API Documentation

The backend exposes REST API routes under the "/api" prefix.

Base URL for local development:

http://localhost:5000/api

Authentication Routes

Base path: "/api/auth"

Method| Endpoint| Description
"POST"| "/api/auth/register"| Registers an author.
"POST"| "/api/auth/login"| Authenticates a user.
"GET"| "/api/auth/me"| Retrieves the authenticated user's information.

The "/me" endpoint requires authentication.

Book Routes

Base path: "/api/books"

Book-related operations are handled by "server/routes/books.routes.js". Consult that file for the exact supported methods, endpoints, request payloads, and authorization requirements.

Ticket Routes

Base path: "/api/tickets"

Method| Endpoint| Description
"POST"| "/api/tickets"| Creates a support ticket for an authenticated author.
"GET"| "/api/tickets/my-tickets"| Retrieves the authenticated author's tickets.
"GET"| "/api/tickets/:id"| Retrieves a ticket by its ID, subject to authorization.
"POST"| "/api/tickets/:id/messages"| Adds a message to a ticket conversation.

These ticket routes use authentication middleware. The ticket creation and messaging routes include author-role restrictions where configured in the route definitions.

Administrative Routes

Base path: "/api/admin"

Administrative operations are implemented in "server/routes/admin.routes.js". Refer to the route definitions for the exact endpoints and required permissions.

Authentication Header

For protected endpoints, send the JWT using the Bearer authorization scheme:

Authorization: Bearer YOUR_JWT_TOKEN

The exact request body and response format depend on the individual endpoint implementation.

---

Authentication and Authorization

The application uses JSON Web Tokens for authentication.

The authentication system includes:

- User registration and login endpoints.
- Password hashing using "bcryptjs".
- JWT-based authentication.
- Middleware for verifying authenticated requests.
- Role-based authorization for author and administrator workflows.
- Protected frontend routes.

The "User" model defines the supported roles as "author" and "admin".

Authentication and role checks should be enforced on the backend rather than relying exclusively on frontend route protection.

---

Database Models

The application uses MongoDB with Mongoose schemas to organize persistent data.

User

The "User" model represents registered users and their application roles.

The role field supports:

- "author"
- "admin"

Authentication-related information is handled by the backend.

Book

The "Book" model represents book records used by the author portal. It includes a reference to the associated user.

See "server/models/Book.js" for the complete schema and default values.

Ticket

The "Ticket" model represents author support requests and their associated conversations.

The schema includes references to users and books, ticket status, priority, category, and conversation messages.

Supported ticket statuses:

- "Open"
- "In Progress"
- "Waiting for Author"
- "Resolved"
- "Closed"

Supported priority levels:

- "Critical"
- "High"
- "Medium"
- "Low"

Conversation message roles include:

- "ai"
- "author"
- "admin"

The schema defines "Open" as the default status and "Medium" as the default priority.

For the complete field definitions and validation rules, refer to the model files in "server/models/".

---

AI Integration

The application integrates with Google's Gemini API through the "@google/genai" package.

AI-related services are organized under "server/services/":

File| Responsibility
"gemini.service.js"| Gemini API integration.
"ticket-ai.service.js"| AI-assisted ticket processing.
"bookleaf-knowledge-base.js"| BookLeaf-related knowledge-base functionality.

The AI integration supports workflows such as ticket classification, priority assessment, and response drafting, depending on the implemented service flow.

API Quotas and Availability

Gemini API requests may fail when the configured API key is invalid, the service is unavailable, or usage quotas and rate limits are reached.

If AI processing fails, inspect the backend logs and the relevant service implementation. Do not assume that a missing AI response means the ticket itself was not saved; verify the ticket in the application or database.

---

Real-Time Communication

The application uses Socket.IO for real-time communication.

Relevant files include:

- "server/socket.js"
- "server/realtime.js"
- "client/src/lib/socket.js"

The frontend socket client is configured for reconnection and derives the server URL from the configured API base URL.

Real-time functionality depends on a running backend server and a valid frontend-to-backend connection.

---

Database Seeding

The backend contains seed scripts for initializing application data and administrator configuration.

Relevant files:

- "server/seed.js"
- "server/seed-admin.js"
- "server/data/sample-data.json"

The seed scripts may rely on environment variables such as "ADMIN_NAME", "ADMIN_EMAIL", "ADMIN_PASSWORD", and "SEED_AUTHOR_PASSWORD".

Review the relevant script before executing it to understand which records it creates or modifies.

Run seed scripts from the "server/" directory using Node.js when required by your development setup. For example:

node seed.js

The administrator seed script can be inspected and run separately if needed:

node seed-admin.js

Do not run seed scripts against production data without reviewing their behavior first.

---

Troubleshooting

Frontend Cannot Connect to the Backend

- Confirm that the backend is running.
- Verify "VITE_API_URL" in "client/.env".
- Check the backend port and the configured frontend origin.
- Restart the Vite development server after changing environment variables.

MongoDB Connection Errors

- Verify "MONGODB_URI".
- Confirm that the database service is running or that your MongoDB Atlas cluster is accessible.
- Check database network access and authentication settings.
- Review the backend logs for connection errors.

Authentication Errors

- Verify that the backend has a valid "JWT_SECRET".
- Ensure the frontend sends the token using the Bearer authorization header.
- Check whether the token is missing, invalid, or expired.
- Confirm that the account has the required role for the requested operation.

AI Responses Are Missing

- Verify "GEMINI_API_KEY".
- Inspect the backend logs for API errors.
- Check whether the Gemini API quota or rate limit has been reached.
- Verify that the relevant AI service is being invoked by the ticket workflow.

Socket.IO Connection Issues

- Ensure the backend server is running.
- Verify the frontend API URL.
- Inspect browser developer tools and backend logs for connection errors.
- Confirm that the deployment environment supports persistent Socket.IO connections.

Frontend Build Errors

Run the following commands from "client/":

npm install
npm run lint
npm run build

Review any reported dependency, linting, or compilation errors before deploying.

---

Security Considerations

- Never commit ".env" files or API credentials.
- Use strong, unique secrets for JWT signing.
- Store passwords using secure password hashing.
- Validate incoming request data on the backend.
- Enforce authentication and role-based authorization for protected endpoints.
- Configure CORS appropriately for the intended deployment.
- Protect database credentials and restrict database access.
- Review seed scripts before using them with production data.
- Avoid exposing sensitive information in application logs or API responses.

---

Future Improvements

Potential areas for further development include:

- Automated testing for frontend components and backend routes.
- More comprehensive API documentation with request and response examples.
- Enhanced ticket analytics and reporting.
- Improved AI failure handling and fallback workflows.
- Expanded administrative filtering and search capabilities.
- Production deployment with environment-specific configuration.
- Monitoring and structured logging for backend services.

---

