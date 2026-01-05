import { inject } from '@angular/core';
import { ResolveFn, ActivatedRouteSnapshot } from '@angular/router';
import { WorkoutService } from '../services/workout.service';

export const workoutResolver: ResolveFn<void> = async (route: ActivatedRouteSnapshot) => {
  const workoutService = inject(WorkoutService);
  const programId = route.paramMap.get('programId');
  const dayId = route.paramMap.get('dayId');

  if (programId && dayId) {
    await workoutService.startWorkout(programId, dayId);
  }
};
