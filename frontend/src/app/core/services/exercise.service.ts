import { Injectable, inject, signal, computed } from '@angular/core';
import { Exercise, MuscleGroup } from '../models';
import { SupabaseService } from './supabase.service';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ExerciseService {
  private supabaseService = inject(SupabaseService);
  private exercises = signal<Exercise[]>([]);
  private selectedCategory = signal<MuscleGroup | 'all'>('all');
  private searchQuery = signal<string>('');
  private loading = signal<boolean>(false);
  private error = signal<string | null>(null);

  readonly allExercises = this.exercises.asReadonly();
  readonly isLoading = this.loading.asReadonly();
  readonly loadError = this.error.asReadonly();

  readonly filteredExercises = computed(() => {
    let result = this.exercises();

    const category = this.selectedCategory();
    if (category !== 'all') {
      result = result.filter(e => e.muscleGroup === category);
    }

    const query = this.searchQuery().toLowerCase();
    if (query) {
      result = result.filter(e =>
        e.name.toLowerCase().includes(query) ||
        e.muscleGroup.toLowerCase().includes(query) ||
        e.equipment.toLowerCase().includes(query)
      );
    }

    return result;
  });

  readonly popularExercises = computed(() => {
    return [...this.exercises()]
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 3);
  });

  readonly recentExercises = computed(() => {
    return this.exercises().slice(3, 6);
  });

  constructor() {
    this.loadExercises();
  }

  async loadExercises(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const response = await fetch(`${environment.supabaseUrl}/functions/v1/exercises`, {
        headers: {
          'Authorization': `Bearer ${environment.supabaseAnonKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load exercises');
      }

      const data = await response.json();
      const mappedExercises: Exercise[] = data.map(this.mapExercise);
      this.exercises.set(mappedExercises);
    } catch (err) {
      console.error('Error loading exercises:', err);
      this.error.set(err instanceof Error ? err.message : 'Failed to load exercises');
    } finally {
      this.loading.set(false);
    }
  }

  async getById(id: string): Promise<Exercise | undefined> {
    // First check local cache
    const cached = this.exercises().find(e => e.id === id);
    if (cached) return cached;

    try {
      const response = await fetch(`${environment.supabaseUrl}/functions/v1/exercises/${id}`, {
        headers: {
          'Authorization': `Bearer ${environment.supabaseAnonKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) return undefined;

      const data = await response.json();
      return this.mapExercise(data);
    } catch (err) {
      console.error('Error fetching exercise:', err);
      return undefined;
    }
  }

  setCategory(category: MuscleGroup | 'all'): void {
    this.selectedCategory.set(category);
  }

  setSearchQuery(query: string): void {
    this.searchQuery.set(query);
  }

  getCategories(): { value: MuscleGroup | 'all'; label: string }[] {
    return [
      { value: 'all', label: 'All' },
      { value: 'chest', label: 'Chest' },
      { value: 'back', label: 'Back' },
      { value: 'legs', label: 'Legs' },
      { value: 'shoulders', label: 'Shoulders' },
      { value: 'biceps', label: 'Biceps' },
      { value: 'triceps', label: 'Triceps' }
    ];
  }

  private mapExercise(data: any): Exercise {
    return {
      id: data.id,
      name: data.name,
      muscleGroup: data.muscle_group,
      equipment: data.equipment,
      difficulty: data.difficulty,
      rating: parseFloat(data.rating) || 0,
      description: data.description || '',
      tips: (data.tips || []).map((tip: any) => ({
        title: tip.title,
        description: tip.description
      })),
      videoUrl: data.video_url || '',
      thumbnailUrl: data.thumbnail_url || '',
      targetMuscles: data.target_muscles || [],
      equipmentDetails: data.equipment_details || [],
      iconColor: data.icon_color || 'bg-blue-100 text-blue-600'
    };
  }
}
