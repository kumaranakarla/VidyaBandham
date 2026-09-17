export interface User {
  id: string;
  role: 'teacher' | 'parent' | 'tet_subscriber' | 'admin';
  name: string;
  // tet_subscriber accounts aren't linked to any class — only teacher/parent
  // accounts have one.
  classId: string | null;
  studentId: string | null;
}
