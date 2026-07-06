import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import * as bcrypt from "bcryptjs";

const adapter = new PrismaBetterSqlite3({ url: "file:./dev.db" });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  // Clear existing data
  await prisma.auditLog.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.announcement.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.fee.deleteMany({});
  await prisma.certificate.deleteMany({});
  await prisma.reportCard.deleteMany({});
  await prisma.result.deleteMany({});
  await prisma.attendance.deleteMany({});
  await prisma.assignmentSubmission.deleteMany({});
  await prisma.assignment.deleteMany({});
  await prisma.answer.deleteMany({});
  await prisma.examAttempt.deleteMany({});
  await prisma.question.deleteMany({});
  await prisma.exam.deleteMany({});
  await prisma.lessonProgress.deleteMany({});
  await prisma.enrollment.deleteMany({});
  await prisma.lesson.deleteMany({});
  await prisma.courseModule.deleteMany({});
  await prisma.course.deleteMany({});
  await prisma.subject.deleteMany({});
  await prisma.class.deleteMany({});
  await prisma.term.deleteMany({});
  await prisma.session.deleteMany({});
  await prisma.student.deleteMany({});
  await prisma.teacher.deleteMany({});
  await prisma.parent.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.school.deleteMany({});
  await prisma.subscription.deleteMany({});

  // 1. Create Subscriptions
  console.log("Creating subscription plans...");
  const starterSub = await prisma.subscription.create({
    data: {
      name: "Starter",
      price: 49.99,
      duration: "monthly",
      maxStudents: 100,
      maxTeachers: 10,
      features: JSON.stringify(["pace_learning", "cbt_exams"]),
    },
  });

  const proSub = await prisma.subscription.create({
    data: {
      name: "Pro",
      price: 99.99,
      duration: "monthly",
      maxStudents: 500,
      maxTeachers: 50,
      features: JSON.stringify(["pace_learning", "active_learning", "cbt_exams", "parent_portal"]),
    },
  });

  const enterpriseSub = await prisma.subscription.create({
    data: {
      name: "Enterprise",
      price: 249.99,
      duration: "monthly",
      maxStudents: 2000,
      maxTeachers: 200,
      features: JSON.stringify(["pace_learning", "active_learning", "cbt_exams", "parent_portal", "custom_domain", "payroll"]),
    },
  });

  // Hash password
  const passwordHash = await bcrypt.hash("password123", 10);

  // 2. Create Super Admin
  console.log("Creating Super Admin...");
  const superAdmin = await prisma.user.create({
    data: {
      email: "superadmin@classnova.com",
      name: "Alex Sterling",
      passwordHash,
      role: "SUPER_ADMIN",
    },
  });

  // 3. Create Default School
  console.log("Creating default school...");
  const school = await prisma.school.create({
    data: {
      name: "ClassNova Academy",
      slug: "academy",
      logo: "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=200&h=200&fit=crop",
      themeColor: "#1e40af", // Royal Blue
      tagline: "One platform for self-paced and active learning.",
      about: "ClassNova Academy is our flagship demonstration school, combining cutting-edge self-paced courses with structured, active classroom management.",
      subscriptionId: proSub.id,
    },
  });

  // 4. Create School Admin
  console.log("Creating School Admin...");
  const schoolAdmin = await prisma.user.create({
    data: {
      email: "admin@classnova.com",
      name: "Principal Sarah Jenkins",
      passwordHash,
      role: "SCHOOL_ADMIN",
      schoolId: school.id,
    },
  });

  // 5. Create Teacher
  console.log("Creating Teacher...");
  const teacherUser = await prisma.user.create({
    data: {
      email: "teacher@classnova.com",
      name: "Dr. Marcus Vance",
      passwordHash,
      role: "TEACHER",
      schoolId: school.id,
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop",
    },
  });

  const teacher = await prisma.teacher.create({
    data: {
      userId: teacherUser.id,
      payrollSalary: 4500.0,
      bio: "Senior Physics and Computer Science instructor with over 10 years of classroom experience.",
      qualifications: "Ph.D. in Computer Science, M.Sc. in Physics",
    },
  });

  // 6. Create Parent
  console.log("Creating Parent...");
  const parentUser = await prisma.user.create({
    data: {
      email: "parent@classnova.com",
      name: "Robert Chen",
      passwordHash,
      role: "PARENT",
      schoolId: school.id,
    },
  });

  const parent = await prisma.parent.create({
    data: {
      userId: parentUser.id,
    },
  });

  // 7. Create Student
  console.log("Creating Student...");
  const studentUser = await prisma.user.create({
    data: {
      email: "student@classnova.com",
      name: "Tyler Chen",
      passwordHash,
      role: "STUDENT",
      schoolId: school.id,
      avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&h=150&fit=crop",
    },
  });

  // 8. Create Academic Structure
  console.log("Creating Academic Structure...");
  const session = await prisma.session.create({
    data: {
      name: "2025/2026",
      isCurrent: true,
      schoolId: school.id,
    },
  });

  const term = await prisma.term.create({
    data: {
      name: "First Term",
      isCurrent: true,
      sessionId: session.id,
    },
  });

  const activeClass = await prisma.class.create({
    data: {
      name: "Grade 10 - Science",
      schoolId: school.id,
      termId: term.id,
      formTeacherId: teacher.id,
      timetable: JSON.stringify({
        Monday: [
          { subject: "Physics", time: "09:00 - 10:30", room: "Lab 2" },
          { subject: "Mathematics", time: "11:00 - 12:30", room: "Room 104" },
        ],
        Wednesday: [
          { subject: "Physics", time: "09:00 - 10:30", room: "Lab 2" },
          { subject: "Computer Science", time: "13:30 - 15:00", room: "PC Room 1" },
        ],
      }),
    },
  });

  const student = await prisma.student.create({
    data: {
      userId: studentUser.id,
      studentId: "CN-2026-0001",
      parentId: parent.id,
      classId: activeClass.id,
    },
  });

  const subject = await prisma.subject.create({
    data: {
      name: "Physics 101",
      classId: activeClass.id,
      teacherId: teacher.id,
    },
  });

  // 9. Create Pace Learning Courses
  console.log("Creating self-paced courses...");
  const course1 = await prisma.course.create({
    data: {
      title: "Introduction to Web Development",
      description: "Learn the fundamentals of HTML, CSS, and JavaScript. Build responsive websites and understand modern web design workflows.",
      coverImage: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&h=400&fit=crop",
      price: 0.0, // Free course
      isPublished: true,
      schoolId: school.id,
    },
  });

  // Modules for Course 1
  const module1 = await prisma.courseModule.create({
    data: {
      title: "Module 1: HTML & CSS Basics",
      order: 1,
      courseId: course1.id,
    },
  });

  const lesson1 = await prisma.lesson.create({
    data: {
      title: "Introduction to HTML5",
      content: "HTML stands for HyperText Markup Language. It is the standard markup language for creating web pages. In this lesson, we will cover tags, elements, and document structure.",
      videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", // Rick Roll video link as placeholder
      duration: 15,
      order: 1,
      moduleId: module1.id,
    },
  });

  const lesson2 = await prisma.lesson.create({
    data: {
      title: "Styling with CSS3",
      content: "CSS stands for Cascading Style Sheets. It describes how HTML elements are to be displayed on screen, paper, or in other media. We will cover selectors, colors, fonts, and the box model.",
      videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      duration: 20,
      order: 2,
      moduleId: module1.id,
    },
  });

  const module2 = await prisma.courseModule.create({
    data: {
      title: "Module 2: JavaScript Fundamentals",
      order: 2,
      courseId: course1.id,
    },
  });

  const lesson3 = await prisma.lesson.create({
    data: {
      title: "Variables and Data Types",
      content: "JavaScript is a programming language that adds interactivity to your website. In this lesson, we will explore let, const, strings, numbers, booleans, and arrays.",
      videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      duration: 25,
      order: 1,
      moduleId: module2.id,
    },
  });

  // Enroll student in Course 1 and complete first two lessons
  console.log("Enrolling student in course...");
  const enrollment = await prisma.enrollment.create({
    data: {
      studentId: student.id,
      courseId: course1.id,
      progress: 66.6, // 2 out of 3 lessons completed
      isCompleted: false,
    },
  });

  await prisma.lessonProgress.create({
    data: {
      studentId: student.id,
      lessonId: lesson1.id,
      isCompleted: true,
    },
  });

  await prisma.lessonProgress.create({
    data: {
      studentId: student.id,
      lessonId: lesson2.id,
      isCompleted: true,
    },
  });

  // 10. Create CBT Exam for Course 1
  console.log("Creating CBT exam...");
  const exam = await prisma.exam.create({
    data: {
      title: "Web Development Fundamentals Certification Exam",
      instructions: "This is the final exam for the Introduction to Web Development course. It contains 4 questions covering HTML, CSS, and JS. Passing score is 75%.",
      duration: 30, // 30 minutes
      shuffle: true,
      showResult: true,
      isActive: true,
      courseId: course1.id,
    },
  });

  // Questions
  await prisma.question.create({
    data: {
      examId: exam.id,
      type: "MCQ",
      questionText: "What does HTML stand for?",
      options: JSON.stringify([
        "HyperText Markup Language",
        "Home Tool Markup Language",
        "Hyperlinks and Text Markup Language",
        "HyperTech Makeup Language",
      ]),
      correctAnswer: "HyperText Markup Language",
      points: 2.5,
    },
  });

  await prisma.question.create({
    data: {
      examId: exam.id,
      type: "TRUE_FALSE",
      questionText: "CSS is used to define the structure and layout of a web page, while HTML is used for styling.",
      options: JSON.stringify(["True", "False"]),
      correctAnswer: "False",
      points: 2.5,
    },
  });

  await prisma.question.create({
    data: {
      examId: exam.id,
      type: "SHORT_ANSWER",
      questionText: "Which JavaScript keyword is used to declare a block-scoped variable that cannot be reassigned?",
      correctAnswer: "const",
      points: 2.5,
    },
  });

  await prisma.question.create({
    data: {
      examId: exam.id,
      type: "THEORY",
      questionText: "Explain the difference between 'let' and 'var' in JavaScript, focusing on scoping and hoisting.",
      points: 2.5,
    },
  });

  // 11. Create Attendance, Fees, and Announcements
  console.log("Creating mock attendance, fees, and announcements...");
  
  // Attendance
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  await prisma.attendance.create({
    data: {
      studentId: student.id,
      date: yesterday,
      status: "PRESENT",
      remarks: "On time and participated actively.",
    },
  });

  await prisma.attendance.create({
    data: {
      studentId: student.id,
      date: today,
      status: "PRESENT",
      remarks: "Present.",
    },
  });

  // Tuition Fee
  const tuitionFee = await prisma.fee.create({
    data: {
      title: "First Term Tuition Fees - 2026",
      amount: 1200.0,
      dueDate: new Date("2026-09-15"),
      schoolId: school.id,
    },
  });

  // Partial Payment
  await prisma.payment.create({
    data: {
      feeId: tuitionFee.id,
      studentId: student.id,
      amountPaid: 600.0,
      status: "PARTIALLY_PAID",
      reference: "ref_mock_payment_10293",
      paidAt: yesterday,
    },
  });

  // Announcements
  await prisma.announcement.create({
    data: {
      schoolId: school.id,
      title: "Welcome to ClassNova Academy!",
      content: "We are thrilled to welcome all students, teachers, and parents to our new digital learning platform. Explore your dashboards, check your timetables, and let's have an amazing term!",
      target: "ALL",
    },
  });

  await prisma.announcement.create({
    data: {
      schoolId: school.id,
      title: "Staff Meeting on Monday",
      content: "Dear teachers, please note that we will have a brief curriculum planning meeting on Monday at 8:00 AM in the virtual staff room.",
      target: "TEACHERS",
    },
  });

  console.log("Seeding complete! Admin user: admin@classnova.com / password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
