import { Injectable, signal, computed } from '@angular/core';
import { environment } from '../../../environments/environment';

export interface ExerciseDbItem {
  id: string;
  name: string;
  bodyPart: string;
  equipment: string;
  target: string;
  secondaryMuscles: string[];
  instructions: string[];
  gifUrl?: string;
  description?: string;
  difficulty?: string;
  category?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ExerciseDbService {
  private exercises = signal<ExerciseDbItem[]>([]);
  private searchQuery = signal<string>('');
  private loading = signal<boolean>(false);
  private error = signal<string | null>(null);
  private exercisesLoaded = false;

  readonly allExercises = this.exercises.asReadonly();
  readonly isLoading = this.loading.asReadonly();
  readonly loadError = this.error.asReadonly();

  readonly filteredExercises = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    if (!query) {
      return this.exercises().slice(0, 20);
    }
    return this.exercises().filter(e =>
      e.name.toLowerCase().includes(query) ||
      e.bodyPart.toLowerCase().includes(query) ||
      e.target.toLowerCase().includes(query) ||
      e.equipment.toLowerCase().includes(query)
    ).slice(0, 50);
  });

  private get apiHeaders(): HeadersInit {
    return {
      'x-rapidapi-key': environment.exerciseDbApiKey,
      'x-rapidapi-host': environment.exerciseDbApiHost
    };
  }

  async loadExercises(): Promise<void> {
    if (this.exercisesLoaded || this.loading()) return;

    this.loading.set(true);
    this.error.set(null);

    try {
      const response = await fetch('https://exercisedb.p.rapidapi.com/exercises?limit=0', {
        method: 'GET',
        headers: this.apiHeaders
      });

      if (!response.ok) {
        throw new Error('Failed to load exercises from ExerciseDB');
      }

      const data: ExerciseDbItem[] = await response.json();
      this.exercises.set(data);
      this.exercisesLoaded = true;
    } catch (err) {
      console.error('Error loading exercises from ExerciseDB:', err);
      this.error.set(err instanceof Error ? err.message : 'Failed to load exercises');
    } finally {
      this.loading.set(false);
    }
  }

  async getById(id: string): Promise<ExerciseDbItem | undefined> {
    const cached = this.exercises().find(e => e.id === id);
    if (cached) return cached;

    try {
      const response = await fetch(`https://exercisedb.p.rapidapi.com/exercises/exercise/${id}`, {
        method: 'GET',
        headers: this.apiHeaders
      });

      if (!response.ok) return undefined;

      const data: ExerciseDbItem = await response.json();
      return data;
    } catch (err) {
      console.error('Error fetching exercise from ExerciseDB:', err);
      return undefined;
    }
  }

  async searchExercises(query: string): Promise<ExerciseDbItem[]> {
    if (!query.trim()) {
      return this.exercises().slice(0, 20);
    }

    if (!this.exercisesLoaded) {
      await this.loadExercises();
    }

    this.searchQuery.set(query);
    return this.filteredExercises();
  }

  setSearchQuery(query: string): void {
    this.searchQuery.set(query);
  }

  clearSearch(): void {
    this.searchQuery.set('');
  }
}
