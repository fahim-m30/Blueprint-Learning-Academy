# Concrete Path Academy - Professional Online Course & Learning Management Platform

A modern, full-stack online learning and course enrollment platform inspired by real-world engineering academies, built with **Next.js (App Router)**, **Express.js**, **MongoDB (Mongoose)**, and **Tailwind CSS**.

---

## 🌟 Key Features & Workflow

### 1. Dual Actors (Student & Admin)
- **Student / User Portal:**
  - View enrolled courses with live countdown timer of remaining course validity.
  - One-click direct button to join the course **WhatsApp Group**.
  - **Embedded Video Lectures** with notes and YouTube playback.
  - **Live Class Schedule** with Google Meet / Zoom direct join links.
  - **Assignments & Tasks:** View instructions, submit Google Drive links/solutions, and view instructor grading & feedback.
  - **Course Chat:** Dedicated real-time discussion channel with the instructor for each course.
- **Admin Management Portal:**
  - Dynamic analytics dashboard: Total Students, Total Verified Revenue, Pending Approvals, Active Courses.
  - **Course Hub with Button Selectors:** Click any course button to manage its video uploads, live Google Meet sessions, homework assignments, and discussion chat.
  - **Student Credentials Access:** View every enrolled student's name, phone, address, **and login email & generated password** directly on screen.
  - **Account Control (Block / Pause):** Block access with mandatory reason entry, which automatically dispatches an official explanation email to the student.
  - **Payment & Site Settings:** Edit official bKash, Nagad, Rocket numbers, homepage helpline phone, WhatsApp number, and emails dynamically.
  - **Automatic Expiration Cleanup:** Scheduled background cron job that permanently deletes courses whose duration has expired, removing all associated enrollments, tasks, and chat records from the database.

### 2. Enrollment & bKash / Nagad Payment Flow
1. User browses courses on the homepage with an infinite scrolling marquee and class-by-class syllabus breakdown.
2. Clicking **Enroll Now** opens a 3-step enrollment wizard:
   - **Step 1:** Enter Student Name, Mobile Number, Email, and Address.
   - **Step 2:** Choose payment method (bKash, Nagad, Rocket). View the admin-configured payment numbers with 1-click copy buttons and exact amount.
   - **Step 3:** Enter Sender Number and Transaction ID (TrxID).
3. The enrollment is marked as `pending`.
4. Admin reviews the TrxID in the Admin Portal and clicks **Approve & Send Email**.
5. The system automatically creates the student user account, generates a secure password, and dispatches a rich HTML confirmation email containing:
   - Course Welcome & WhatsApp Batch Group Link.
   - Login URL.
   - Student Login Email & Auto-Generated Password.

---

## 📁 Project Architecture

```
career-path-academy/
├── client/                     # Next.js 14 Frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx        # Homepage with Hero, Course Marquee, Syllabus, FAQs
│   │   │   ├── login/page.tsx  # Dual Student & Admin Login Portal
│   │   │   ├── dashboard/page.tsx # Student Learning Dashboard
│   │   │   ├── admin/page.tsx  # Full Admin Management Portal
│   │   │   └── globals.css     # Dark engineering aesthetic styles
│   │   ├── components/
│   │   │   ├── Navbar.tsx      # Dynamic header with contact numbers
│   │   │   ├── Footer.tsx      # Dynamic footer
│   │   │   ├── CourseModal.tsx # Full class syllabus modal
│   │   │   └── EnrollmentModal.tsx # 3-step bKash payment & TrxID form
│   │   └── lib/
│   │       ├── api.ts          # API fetch client & JWT token management
│   │       └── types.ts        # TypeScript data interfaces
│   └── package.json
│
└── server/                     # Express.js Backend API
    ├── models/
    │   ├── User.js             # Student and Admin schema (with admin-viewable password)
    │   ├── Course.js           # Course, Syllabus, Videos, Live Classes, Tasks
    │   ├── Enrollment.js       # Payment applications & TrxIDs
    │   ├── TaskSubmission.js   # Student homework submissions & grades
    │   ├── ChatMessage.js      # Course-specific student-instructor chat
    │   └── SiteSettings.js     # Dynamic bKash/Nagad numbers & contact info
    ├── routes/
    │   ├── authRoutes.js       # Login, profile, password change
    │   ├── publicRoutes.js     # Public courses, site settings, enrollment submit
    │   ├── studentRoutes.js    # Student course access, video streaming, task submission
    │   └── adminRoutes.js      # Approvals, course hub, blocking, settings
    ├── services/
    │   └── cronService.js      # Automatic cleanup of expired courses from DB
    ├── utils/
    │   └── emailService.js     # HTML email delivery for credentials and block notices
    ├── seed.js                 # Database seeder with 6 pre-built civil engineering courses
    ├── server.js               # Express application entrypoint
    ├── .env                    # Environment variables
    └── package.json
```

---

## 🚀 Local Development Setup

### 1. Prerequisites
- **Node.js**: v18+ or v20+
- **MongoDB**: Local MongoDB community service (`mongodb://127.0.0.1:27017`) or free MongoDB Atlas cluster.

### 2. Backend Setup
```bash
cd server
npm install

# Seed the database with default admin, settings, and 6 courses
npm run seed

# Start server
npm run dev
# Server will run on http://localhost:5000
```

#### Default Seeded Credentials:
- **Admin Portal:** `admin@careerpath.com` | Password: `admin123`
- **Demo Student:** `student@example.com` | Password: `student123`

### 3. Frontend Setup
```bash
cd client
npm install
npm run dev
# Client will run on http://localhost:3000
```

---

## 🌐 100% Free Production Deployment Guide

You can host this entire application online for **$0 (completely free)** using standard modern cloud tiers:

### Step 1: Free MongoDB Database (MongoDB Atlas)
1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas) and sign up for a free account.
2. Create an **M0 Free Shared Cluster** (512 MB storage, always free).
3. Under **Database Access**, create a database user (e.g., `academyuser` with a secure password).
4. Under **Network Access**, click **Add IP Address** and choose **Allow Access From Anywhere** (`0.0.0.0/0`).
5. Click **Connect** -> **Drivers** and copy your connection string:
   ```
   mongodb+srv://academyuser:<password>@cluster0.mongodb.net/careerpathacademy?retryWrites=true&w=majority
   ```

### Step 2: Free Backend Hosting (Render.com or Railway)
1. Push your code to GitHub.
2. Sign in to [Render.com](https://render.com).
3. Click **New +** -> **Web Service** and connect your GitHub repository.
4. Set:
   - **Root Directory:** `server`
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
   - **Environment Variables:**
     - `MONGO_URI`: *Your MongoDB Atlas connection string from Step 1*
     - `JWT_SECRET`: *Any random 32-character secret string*
     - `FRONTEND_URL`: *Your Vercel frontend URL (from Step 3)*
     - `EMAIL_USER`: *(Optional) your Gmail address for Nodemailer*
     - `EMAIL_PASS`: *(Optional) your 16-character Gmail App Password*
5. Click **Deploy Web Service**. You will get a free HTTPS URL like: `https://career-path-api.onrender.com`.

### Step 3: Free Frontend Hosting (Vercel)
1. Sign in to [Vercel](https://vercel.com).
2. Click **Add New** -> **Project** and import your GitHub repository.
3. Configure the project:
   - **Root Directory:** select `client`
   - **Framework Preset:** Next.js
   - **Environment Variables:**
     - `NEXT_PUBLIC_API_URL`: `https://career-path-api.onrender.com/api` (your Render backend URL)
4. Click **Deploy**. Vercel will build and give you a free HTTPS domain like: `https://careerpathacademy.vercel.app`.

### Step 4: Free Email Dispatch Setup (Gmail App Password / Brevo)
- To send real emails when admin confirms an enrollment or blocks an account:
  1. In your Google Account, enable **2-Step Verification**.
  2. Search for **App Passwords**, create a new one named "Academy App", and copy the 16-character code.
  3. Set `EMAIL_USER=yourgmail@gmail.com` and `EMAIL_PASS=xxxx xxxx xxxx xxxx` in your backend environment variables on Render.

---

## 🔒 Security & Best Practices
- Passwords are encrypted with `bcryptjs`.
- JWT Tokens safeguard student and administrator routes.
- Netlify / Vercel Edge ready.
- Real-time auto-uppercase formatting for bKash/Nagad Transaction IDs.
- Blocked students receive customized email notifications explaining the administrator's official reason.
