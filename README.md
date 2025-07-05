# CORTUANT - Cloud File Organizer & Uploader

CORTUANT is a full-stack Node.js web application for authenticated users to create folders, upload files (stored on Cloudinary), view, delete, and download them. The system supports secure authentication, session management using Prisma, and responsive UI using EJS templating.

---

## Features

- User Signup and Login with hashed passwords
- Session-based authentication using Passport.js
- Folder CRUD operations
- Cloud-based file uploading via Cloudinary
- File listing within folders
- Secure file deletion (both from Cloudinary and the database)
- Streamed file download
- Responsive UI with modal-based interactions
- Prisma ORM for PostgreSQL integration

---

## Technologies Used

- **Backend:** Node.js and Express.js
- **Templating Engine:** EJS
- **Authentication:** Passport.js with session support
- **Validation:** express-validator
- **Password Hashing:** bcryptjs
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Session Storage:** PrismaSessionStore with express-session
- **File Upload Middleware:** Multer
- **Cloud Storage:** Cloudinary
- **Environment Configuration:** dotenv

## Project Structure
Cortuant-File-Uploader/
├── app.js # Main Express server entry
├── views/ # EJS templates
│ ├── login.ejs
│ ├── signup.ejs
│ └── application.ejs
├── controllers/
│ └── main.js # Application logic
├── public/
│ ├── style.css
│ └── images/
├── config/
│ └── cloudinary.js
├── prisma/
│ ├── schema.prisma
│ └── migrations/
├── .env
├── package.json
└── README.md