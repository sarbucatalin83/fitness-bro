export interface WorkoutSet {
  id?: string;
  setNumber: number;
  weight: number | null;
  reps: number | null;
  completed: boolean;
  previousWeight: number | null;
  previousReps: number | null;
}

export interface WorkoutExercise {
  exerciseId: string;
  exerciseName: string;
  targetSets: number;
  targetReps: string;
  sets: WorkoutSet[];
  lastPerformance?: {
    weight: number;
    reps: number;
  };
}

export interface ActiveWorkout {
  id: string;
  programId: string;
  dayId: string;
  dayName: string;
  exercises: WorkoutExercise[];
  currentExerciseIndex: number;
  currentSetIndex: number;
  startTime: Date;
  restTimer: number; // seconds
}

export interface VolumeData {
  day: string;
  volume: number;
}

export interface WeeklyStats {
  volumeTrend: VolumeData[];
  totalWorkouts: number;
  totalVolume: number;
}
