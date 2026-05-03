# SchemaFlow

SchemaFlow is a full-stack Learning Management System designed to help teachers manage courses and study materials, while students can enroll, access unit-wise PDF notes, and view course content through a clean dashboard.

## Features

* Role-based authentication for Students and Teachers
* Teacher admin panel for course management
* Course creation with enrollment keys and seat tracking
* Student enrollment with transaction-safe database updates
* Unit-wise PDF upload and download support
* Teacher view to manage enrolled students
* Remove student from a course
* Interactive database visualization
* Responsive UI for mobile and desktop
* Light and dark mode support
* LAN support for testing across devices on the same Wi-Fi

## Tech Stack

* Frontend: React, Vite, Tailwind CSS
* Backend: Node.js, Express
* Database: MySQL
* Authentication: JWT, bcrypt
* File Uploads: Multer
* Local file serving for PDFs: Express static hosting

## Project Structure

```bash
SchemaFlow/
├── frontend/
├── backend/
├── uploads/
└── README.md
```

## Database Schema

The project uses a normalized relational schema with the following tables:

* `users`
* `courses`
* `enrollments`
* `units`
* `notes`

### Relationships

* One teacher can create many courses
* Students and courses have a many-to-many relationship through enrollments
* One course can have many units
* One unit can have many notes
* One teacher can upload many notes

## Setup Instructions

### 1. Clone the repository

```bash
git clone https://github.com/your-username/schemaflow-lms.git
cd schemaflow-lms
```

### 2. Backend setup

```bash
cd backend
npm install
```

Create a `.env` file inside `backend/`:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=lms_db
JWT_SECRET=your_jwt_secret
ADMIN_KEY=your_admin_key
PORT=5001
```

Start the backend:

```bash
node server.js
```

### 3. Frontend setup

```bash
cd ../frontend
npm install
```

Create a `.env` file inside `frontend/`:

```env
VITE_API_URL=http://localhost:5001
```

Start the frontend:

```bash
npm run dev
```

### 4. MySQL setup

Run the schema file inside MySQL Workbench or MySQL CLI:

```bash
mysql -u root -p < backend/config/schema.sql
```

Or open `backend/config/schema.sql` and run it manually in Workbench.

## Usage

* Sign up as a student or teacher
* Teachers can create courses, upload notes, and manage students
* Students can enroll in courses using the correct enrollment key
* Students can view and download PDF notes for each unit

## Notes

* PDFs are stored locally in the `uploads/` folder
* The backend serves uploaded files using Express static routing
* For LAN testing, the frontend and backend can be accessed using the host machine's IP address instead of localhost

## Demo Data

The database schema includes sample seed data for:

* Teachers
* Students
* Courses
* Enrollments
* Units
* Notes

## Future Improvements

* Cloud file storage instead of local uploads
* Cloud deployment for backend and database
* Better analytics for teachers
* Notifications for enrollments and uploaded notes
* Search and filtering across courses and materials

## License

This project is for educational use.

## Author

Built by Srujan.
