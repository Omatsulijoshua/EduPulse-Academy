# EduPulse Academy 🌐🎓

**EduPulse Academy** is a state-of-the-art, multi-tenant online school platform and Learning Management System (LMS) built with Next.js, React, Tailwind CSS, Prisma, and SQLite. It provides robust dashboards for all stakeholders in a school ecosystem: **Super Admins**, **School Admins**, **Teachers**, **Students**, and **Parents**.

The platform is designed to support **two distinct learning structures**:
1. **Pace Learning Mode**: Self-paced, independent study with linear lesson completion locks, quizzes, and automated certificate generation.
2. **Active Learning Mode**: Live classroom environment mimicking a physical school, complete with class sections, terms, weekly timetables, homework assignments, attendance tracking, report cards, and Computer Based Test (CBT) exams with built-in anti-cheat visibility tracking.

---

## 🚀 Key Features by Dashboard Role

### 👑 1. Super Admin Dashboard (SaaS Portal)
* **MRR & Subscriber Metrics**: Live statistics reporting platform revenue, total registered schools, active user accounts, and billing statistics.
* **School Approvals Ledger**: Register new schools, review applications, and suspend or activate school licenses.
* **Subscription Management**: Define pricing plan tiers and features.
* **Global System Audit Logs**: A security trail logging every critical action across all school subdomains.

### 🏫 2. School Admin Dashboard (Academy Setup Panel)
* **Academic Configurations**: Create Sessions (academic years), Terms (semesters), Class Sections, and Subjects.
* **User Accounts Console**: Invite, register, and link Teachers, Students, and Parents. Generates custom unique student registration IDs (e.g. `CN-2026-0001`).
* **Branding Website Customizer**: Customize Logo URLs, accent colors, taglines, and "About Us" statements for the school's public website.
* **Fee Administration**: Manage fees, track paid vs unpaid logs, and review outstanding accounts.
* **Academic Report Card Compiler**: Generate GPAs (4.0 scale) automatically calculated from homework and CBT scores, append principal remarks, and log verification reference IDs.
* **Bulletins & Announcements**: Post system-wide broadcast alerts that display instantly in student and parent sidebars.

### 👨‍🏫 3. Teacher Dashboard
* **Syllabus & Course Outline Builder**: Upload self-paced modules and lessons with HTML5 video embeds, study descriptions, and file attachments.
* **Active Classroom Panel**: Track daily attendance registers (Present, Absent, Late, Excused), upload notes, and distribute homework assignments.
* **Homework Grading Queue**: Grade student assignment uploads (0-100 score scale) and write feedback.
* **CBT Exam Constructor**: Create online assessments (MCQs, True/False, Short answers, and Essays) with custom timer durations and question shuffling.
* **Theory Grading Portal**: Review essay questions and finalize CBT scores.

### 🎓 4. Student Dashboard
* **Learning Format Selector**: Choose between Pace Learning (self-paced LMS) and Active Learning (assigned classroom).
* **Course Video Player**: Learn with sequential course progression. Lessons are locked until the preceding lesson is completed.
* **Vintage Graduation Certificates**: Download elegant graduation credentials with principal stamps and verification hashes.
* **Classroom Tracker**: View timetables, download class notes, submit homework responses, and check attendance history.
* **CBT Exam Engine**: Take online exams with countdown timers.
* **Anti-Cheat Monitor**: Uses the HTML5 Page Visibility API. Detects window blur/tab switches, warns the student, and automatically submits the paper upon the 4th infraction.
* **Report Cards Tab**: View and print academic records detailing subject grades, principal remarks, and GPAs.

### 👪 5. Parent Dashboard
* **Child Selector Panel**: Toggle between profiles of multiple linked children.
* **Performance Overview**: Track real-time attendance ratios, GPA averages, and pending invoices.
* **Tuition Statement Ledger**: Settle student tuition fees using a Stripe Sandboxed Checkout simulation page.
* **Grade Reports**: View all test results, homework submissions, and detailed calendar attendance history.

### 🛡️ 6. Public Credentials Verification Portal (`/verify`)
* **Public Search Gate**: An unauthenticated route allowing employers or institutions to input a Certificate Code or Report Card Reference ID.
* **Ledger Validation**: Queries database records and displays validated credentials details with green status stamps.

---

## 🛠️ Architecture & Tech Stack
* **Framework**: Next.js (App Router)
* **Frontend**: React, Tailwind CSS (Glassmorphism & premium UI designs), Lucide Icons, Framer Motion
* **Database**: SQLite (local database file `dev.db`)
* **ORM**: Prisma
* **Authentication**: JWT cookies (stateless verification) & bcryptjs passwords hashing
* **Payment Integration**: Stripe sandbox simulation

---

## ⚙️ Getting Started & Installation

### 1. Clone the repository
```bash
git clone https://github.com/Omatsulijoshua/EduPulse-Academy.git
cd EduPulse-Academy
```

### 2. Install dependencies
```bash
npm install
```

### 3. Setup Environment Variables
Create a `.env` file in the root directory:
```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="super-secret-key-edupulse-academy-2026"
```

### 4. Database Setup & Seeding
Run migrations and populate the database with the pre-seeded demo credentials:
```bash
npx prisma migrate dev --name init
npx prisma db seed
```

### 5. Run the development server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) on your browser.

---

## 🔐 Prefilled Test Credentials
When visiting the login screen, you can use the **Quick Prefill Panel** or input the following credentials:
* **Super Admin**: `superadmin@classnova.com` / `password123`
* **School Admin**: `admin@classnova.com` / `password123`
* **Teacher**: `teacher@classnova.com` / `password123`
* **Student**: `student@classnova.com` / `password123`
* **Parent**: `parent@classnova.com` / `password123`

---

## 📄 License
This project is licensed under the MIT License.
