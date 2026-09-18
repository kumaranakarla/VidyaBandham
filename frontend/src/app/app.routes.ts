import { Routes } from '@angular/router';
import { authGuard, homeRedirectGuard, adminGuard } from './guards/auth.guard';
import { LoginComponent } from './pages/login/login.component';
import { SignupComponent } from './pages/signup/signup.component';
import { ShellComponent } from './pages/shell/shell.component';
import { AdminComponent } from './pages/admin/admin.component';
import { DiaryComponent } from './pages/diary/diary.component';
import { HomeworkComponent } from './pages/homework/homework.component';
import { AttendanceComponent } from './pages/attendance/attendance.component';
import { FeesComponent } from './pages/fees/fees.component';
import { StudentsComponent } from './pages/students/students.component';
import { TetComponent } from './pages/tet/tet.component';
import { GrandTestComponent } from './pages/grand-test/grand-test.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'signup', component: SignupComponent },
  // Standalone route, deliberately outside ShellComponent's children — the
  // admin dashboard has nothing to do with the school-management nav
  // (Diary/Homework/etc.) or the TET tabs, so it gets its own tiny header
  // instead of hiding half of ShellComponent's nav for one role.
  { path: 'admin', component: AdminComponent, canActivate: [adminGuard] },
  {
    path: '',
    component: ShellComponent,
    canActivate: [authGuard],
    children: [
      // See homeRedirectGuard's comment — the landing page depends on role.
      // No `component`/`redirectTo`: the guard always navigates elsewhere
      // and returns false, so this route itself never actually renders.
      // `pathMatch: 'full'` keeps it from swallowing every other child path.
      { path: '', pathMatch: 'full', canActivate: [homeRedirectGuard], children: [] },
      { path: 'diary', component: DiaryComponent },
      { path: 'homework', component: HomeworkComponent },
      { path: 'attendance', component: AttendanceComponent },
      { path: 'fees', component: FeesComponent },
      { path: 'students', component: StudentsComponent },
      { path: 'tet', component: TetComponent },
      // Mock Test now shows the same real-exam "Grand Test" experience as
      // /grand-test (paper picker -> subject-wise setup card -> timed test
      // with instant feedback -> results) rather than the old custom
      // Year/Subject/Count builder — see GrandTestComponent. Both routes
      // intentionally point at the same component so neither nav link
      // disappears; the old MockTestComponent file is unused now.
      { path: 'mock-test', component: GrandTestComponent },
      // 2026 (New) now shows the same Grand Test experience too (full
      // 12-paper picker, since this route doesn't auto-skip like
      // 'mock-test' does) — question-count selection, a timed test, and
      // the bilingual results/answer-key screen, instead of the old
      // filter-and-browse-everything page. The old Tet2026Component file
      // is unused now, same as MockTestComponent above.
      { path: 'tet-2026', component: GrandTestComponent },
      { path: 'grand-test', component: GrandTestComponent },
    ],
  },
  { path: '**', redirectTo: '' },
];
