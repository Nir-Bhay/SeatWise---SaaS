# ExamWise SaaS - Automated Exam Management Platform

A comprehensive SaaS solution for educational institutions to automate exam seating arrangements, attendance sheets, and document generation.

## Features

- 🏫 Multi-tenant SaaS architecture
- 📊 Automated seating arrangement generation
- 📋 Attendance sheet creation
- 🏢 Building and room management
- 👥 Student data management with Excel import
- 📄 Professional PDF document generation
- 🎨 Customizable templates
- ⚙️ Advanced seating algorithms (anti-cheating, branch mixing)

## Tech Stack

### Backend
- Node.js + Express.js
- MongoDB with Mongoose
- JWT Authentication
- Puppeteer for PDF generation
- Multer for file uploads
- ExcelJS for Excel processing

### Frontend
- React.js 18
- Tailwind CSS
- React Router v6
- Axios for API calls
- React Hot Toast for notifications

## Installation

### Prerequisites
- Node.js (v16+)
- MongoDB (v5+)
- Chrome/Chromium (for PDF generation)

### Backend Setup
```bash
cd backend
npm install
cp .env.example .env  # Configure your environment variables
npm run dev
```

### **16. Deployment Scripts**

#### **package.json (Root)**
```json
{
  "name": "examwise-saas",
  "version": "1.0.0",
  "description": "Automated Exam Management SaaS Platform",
  "scripts": {
    "dev": "concurrently \"npm run server\" \"npm run client\"",
    "server": "cd backend && npm run dev",
    "client": "cd frontend && npm start",
    "build": "cd frontend && npm run build",
    "install-all": "npm install && cd backend && npm install && cd ../frontend && npm install",
    "start": "cd backend && npm start"
  },
  "devDependencies": {
    "concurrently": "^7.6.0"
  }
}
```


{
  "name": "examwise-saas-backend",
  "version": "1.0.0",
  "description": "ExamWise SaaS Backend",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "express": "^4.18.2",
    "handlebars": "^4.7.8",
    "jsonwebtoken": "^9.0.2",
    "moment": "^2.29.4",
    "mongoose": "^7.5.0",
    "multer": "^1.4.5-lts.1",
    "puppeteer": "^24.18.0",
    "uuid": "^9.0.0",
    "xlsx": "^0.18.5"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  }
}


{
    "name": "examwise-saas",
    "version": "1.0.0",
    "description": "Automated Exam Management SaaS Platform",
    "scripts": {
        "dev": "concurrently \"npm run server\" \"npm run client\"",
        "server": "cd backend && npm run dev",
        "client": "cd frontend && npm start",
        "build": "cd frontend && npm run build",
        "install-all": "npm install && cd backend && npm install && cd ../frontend && npm install",
        "start": "cd backend && npm start"
    },
    "devDependencies": {
        "concurrently": "^7.6.0"
    }
}