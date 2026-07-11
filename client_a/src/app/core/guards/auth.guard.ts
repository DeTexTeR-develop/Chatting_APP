import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, map, take } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return toObservable(auth.status).pipe(
    filter(s => s !== 'loading'),
    take(1),
    map(s => s === 'authenticated' ? true : router.createUrlTree(['/login']))
  );
};

export const publicOnlyGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return toObservable(auth.status).pipe(
    filter(s => s !== 'loading'),
    take(1),
    map(s => s === 'unauthenticated' ? true : router.createUrlTree(['/conversations']))
  );
};
