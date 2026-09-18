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
import { MockTestComponent } from './pages/mock-test/mock-test.component';
import { Tet2026Component } from './pages/tet-2026/tet-2026.component';
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
      { path: 'mock-test', component: MockTestComponent },
      // Its own route on purpose, not a query param on 'tet' — this content
      // is planned to move behind a subscription later, and a separate
      // route means a guard (e.g. canActivate: [subscriptionGuard]) can be
      // added here later without touching the 'tet'/'mock-test' routes.
      { path: 'tet-2026', component: Tet2026Component },
      { path: 'grand-test', component: GrandTestComponent },
    ],
  },
  { path: '**', redirectTo: '' },
];
