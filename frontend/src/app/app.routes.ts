import { Routes } from '@angular/router';
import { authGuard, publicGuard } from './core/guards/auth.guard';
import { workoutResolver } from './core/resolvers/workout.resolver';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'programs',
    pathMatch: 'full'
  },
  // Public routes (only accessible when not logged in)
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then(
        m => m.LoginComponent
      ),
    canActivate: [publicGuard]
  },
  {
    path: 'signup',
    loadComponent: () =>
      import('./features/auth/signup/signup.component').then(
        m => m.SignupComponent
      ),
    canActivate: [publicGuard]
  },
  // Protected routes (require authentication)
  {
    path: 'programs',
    loadComponent: () =>
      import('./features/programs/my-programs/my-programs.component').then(
        m => m.MyProgramsComponent
      ),
    canActivate: [authGuard]
  },
  {
    path: 'programs/create',
    loadComponent: () =>
      import('./features/programs/create-program/create-program.component').then(
        m => m.CreateProgramComponent
      ),
    canActivate: [authGuard]
  },
  {
    path: 'exercises',
    loadComponent: () =>
      import('./features/exercises/exercise-database/exercise-database.component').then(
        m => m.ExerciseDatabaseComponent
      ),
    canActivate: [authGuard]
  },
  {
    path: 'exercises/:id',
    loadComponent: () =>
      import('./features/exercises/exercise-detail/exercise-detail.component').then(
        m => m.ExerciseDetailComponent
      ),
    canActivate: [authGuard]
  },
  {
    path: 'workout/:programId/:dayId',
    loadComponent: () =>
      import('./features/workout/workout-tracker/workout-tracker.component').then(
        m => m.WorkoutTrackerComponent
      ),
    canActivate: [authGuard],
    resolve: { workout: workoutResolver }
  },
  {
    path: '**',
    redirectTo: 'programs'
  }
];
