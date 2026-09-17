import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterOutlet } from '@angular/router';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `<router-outlet></router-outlet>`,
})
export class AppComponent implements OnInit {
  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    // A single fire-and-forget beacon per app load, purely for the admin
    // dashboard's "site hits" curiosity number — see backend/src/routes/track.js.
    // Never blocks or affects the app if it fails (offline, ad blocker, etc).
    this.http.post(`${environment.apiUrl}/track/visit`, {}).subscribe({ error: () => {} });
  }
}
