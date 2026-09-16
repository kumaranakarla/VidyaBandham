import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.user() && auth.token) return true;
  router.navigate(['/login']);
  return false;
};

// The bare '' route can't `redirectTo` a fixed path any more, now that
// tet_subscriber accounts exist — they have no class, so 'diary' (the
// default for teacher/parent) would just error out for them. This guard
// picks the right landing page per role and always returns false (it always
// navigates itself instead of letting the route render).
export const homeRedirectGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  router.navigate([auth.isSubscriberOnly() ? '/tet-2026' : '/diary']);
  return false;
};
