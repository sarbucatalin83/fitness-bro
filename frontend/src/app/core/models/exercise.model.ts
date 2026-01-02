export type MuscleGroup = 'chest' | 'back' | 'legs' | 'shoulders' | 'biceps' | 'triceps' | 'core' | 'cardio';
export type Equipment = 'barbell' | 'dumbbell' | 'bodyweight' | 'cable' | 'machine' | 'kettlebell' | 'bands';
export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

export interface ExerciseTip {
  title: string;
  description: string;
}

export interface Exercise {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  equipment: Equipment;
  difficulty: Difficulty;
  rating: number;
  description: string;
  tips: ExerciseTip[];
  videoUrl?: string;
  thumbnailUrl?: string;
  targetMuscles: string[];
  equipmentDetails: string[];
  iconColor: string;
}
