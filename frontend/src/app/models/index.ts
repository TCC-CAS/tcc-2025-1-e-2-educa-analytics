export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: Date;
}

export interface Student {
  id: string;
  name: string;
  email: string;
  enrollmentNumber: string;
  grade: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  instructor: string;
  students: Student[];
  createdAt: Date;
}

export interface Analytics {
  id: string;
  studentId: string;
  courseId: string;
  attendance: number;
  grades: number[];
  performance: number;
  lastAccess: Date;
}
