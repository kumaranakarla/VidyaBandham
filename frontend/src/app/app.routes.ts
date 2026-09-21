import { Routes } from '@angular/router';
import { authGuard, homeRedirectGuard, adminGuard } from './guards/auth.guard';
import { LoginComponent } from './pages/login/login.component';
import { PolicyPageComponent } from './pages/policy/policy-page.component';
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
import { Tet2026Component } from './pages/tet-2026/tet-2026.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'signup', component: SignupComponent },
  // Public legal pages — no authGuard, since Razorpay checkout and
  // prospective sign-ups need to reach these without an account. All three
  // share PolicyPageComponent, which branches on the route path.
  { path: 'terms', component: PolicyPageComponent },
  { path: 'privacy', component: PolicyPageComponent },
  { path: 'refund-policy', component: PolicyPageComponent },
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
      // 2026 (New) shows every official 2026 paper as a straight
      // filter-and-browse Q&A page (Tet2026Component) — pick a paper,
      // see its questions with instant right/wrong feedback per question,
      // no setup screen or timer. The timed, full-exam-conditions
      // experience (subject-wise mix, a real clock, answers only at the
      // end) lives under MockTest(TET) / the hidden Grand Test tab
      // (GrandTestComponent) instead, so the two don't duplicate each other.
      { path: 'tet-2026', component: Tet2026Component },
      { path: 'grand-test', component: GrandTestComponent },
    ],
  },
  { path: '**', redirectTo: '' },
];
