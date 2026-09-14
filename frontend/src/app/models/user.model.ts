export interface User {
  id: string;
  role: 'teacher' | 'parent';
  name: string;
  classId: string;
  studentId: string | null;
}
