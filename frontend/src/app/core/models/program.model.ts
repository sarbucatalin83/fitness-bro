import { Difficulty } from './exercise.model';

export interface ProgramExercise {
  exerciseId: string;
  exerciseName: string;
  sets: number;
  reps: string; // e.g., "8-12" or "10"
}

export interface WorkoutDay {
  id: string;
  dayNumber: number;
  name: string;
  muscleGroups: string;
  exercises: ProgramExercise[];
  estimatedDuration: number; // in minutes
}

export interface Program {
  id: string;
  name: string;
  description: string;
  difficulty: Difficulty;
  durationWeeks: number;
  daysPerWeek: number;
  type: string; // e.g., "Strength", "Hypertrophy", "Cardio"
  days: WorkoutDay[];
  isActive: boolean;
  iconType: 'grid' | 'refresh' | 'run';
}

export interface ActiveProgram extends Program {
  currentWeek: number;
  completedWorkouts: number;
  totalWorkouts: number;
  nextWorkout: {
    dayId: string;
    dayName: string;
    exerciseCount: number;
    estimatedDuration: number;
  };
}
