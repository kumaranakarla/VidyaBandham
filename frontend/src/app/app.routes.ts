import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { LoginComponent } from './pages/login/login.component';
import { ShellComponent } from './pages/shell/shell.component';
import { DiaryComponent } from './pages/diary/diary.component';
import { HomeworkComponent } from './pages/homework/homework.component';
import { AttendanceComponent } from './pages/attendance/attendance.component';
import { FeesComponent } from './pages/fees/fees.component';
import { StudentsComponent } from './pages/students/students.component';
import { TetComponent } from './pages/tet/tet.component';
import { MockTestComponent } from './pages/mock-test/mock-test.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: '',
    component: ShellComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'diary', pathMatch: 'full' },
      { path: 'diary', component: DiaryComponent },
      { path: 'homework', component: HomeworkComponent },
      { path: 'attendance', component: AttendanceComponent },
      { path: 'fees', component: FeesComponent },
      { path: 'students', component: StudentsComponent },
      { path: 'tet', component: TetComponent },
      { path: 'mock-test', component: MockTestComponent },
    ],
  },
  { path: '**', redirectTo: '' },
];
