import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts';
import { createSupabaseClient, getUser } from '../_shared/supabase.ts';

serve(async (req: Request) => {
  // Handle CORS
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const supabase = createSupabaseClient(req);
  const url = new URL(req.url);
  const pathParts = url.pathname.split('/').filter(Boolean);

  // Require authentication
  const user = await getUser(req);
  if (!user) {
    return errorResponse('Unauthorized', 401);
  }

  try {
    // GET /workouts/:id - Get single workout session
    if (pathParts.length === 2 && req.method === 'GET') {
      const sessionId = pathParts[1];

      const { data: session, error } = await supabase
        .from('workout_sessions')
        .select(`
          *,
          program:programs(id, name),
          workout_day:workout_days(id, name, muscle_groups),
          sets:workout_sets(
            *,
            exercise:exercises(id, name, muscle_group, equipment)
          )
        `)
        .eq('id', sessionId)
        .eq('user_id', user.id)
        .single();

      if (error) {
        return errorResponse('Workout session not found', 404);
      }

      return jsonResponse(session);
    }

    // POST /workouts/:id/sets - Add a set to workout
    if (pathParts.length === 3 && pathParts[2] === 'sets' && req.method === 'POST') {
      const sessionId = pathParts[1];
      const body = await req.json();

      // Verify session belongs to user
      const { data: session } = await supabase
        .from('workout_sessions')
        .select('id')
        .eq('id', sessionId)
        .eq('user_id', user.id)
        .single();

      if (!session) {
        return errorResponse('Session not found', 404);
      }

      const { data: workoutSet, error } = await supabase
        .from('workout_sets')
        .insert({
          session_id: sessionId,
          exercise_id: body.exerciseId,
          set_number: body.setNumber,
          weight: body.weight,
          reps: body.reps,
          completed: body.completed || false,
        })
        .select()
        .single();

      if (error) {
        return errorResponse(error.message, 400);
      }

      return jsonResponse(workoutSet, 201);
    }

    // PATCH /workouts/:id/sets/:setId - Update a set
    if (pathParts.length === 4 && pathParts[2] === 'sets' && req.method === 'PATCH') {
      const sessionId = pathParts[1];
      const setId = pathParts[3];
      const body = await req.json();

      // Verify session belongs to user
      const { data: session } = await supabase
        .from('workout_sessions')
        .select('id')
        .eq('id', sessionId)
        .eq('user_id', user.id)
        .single();

      if (!session) {
        return errorResponse('Session not found', 404);
      }

      const { data: workoutSet, error } = await supabase
        .from('workout_sets')
        .update({
          weight: body.weight,
          reps: body.reps,
          completed: body.completed,
        })
        .eq('id', setId)
        .eq('session_id', sessionId)
        .select()
        .single();

      if (error) {
        return errorResponse(error.message, 400);
      }

      return jsonResponse(workoutSet);
    }

    // PUT /workouts/:id/complete - Complete a workout
    if (pathParts.length === 3 && pathParts[2] === 'complete' && req.method === 'PUT') {
      const sessionId = pathParts[1];
      const body = await req.json();

      // Calculate total volume
      const { data: sets } = await supabase
        .from('workout_sets')
        .select('weight, reps')
        .eq('session_id', sessionId)
        .eq('completed', true);

      const totalVolume = sets?.reduce((sum, set) => {
        return sum + (set.weight || 0) * (set.reps || 0);
      }, 0) || 0;

      const { data: session, error } = await supabase
        .from('workout_sessions')
        .update({
          completed_at: new Date().toISOString(),
          total_volume: totalVolume,
          notes: body.notes,
        })
        .eq('id', sessionId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        return errorResponse(error.message, 400);
      }

      return jsonResponse(session);
    }

    // GET /workouts - List workout sessions
    if (req.method === 'GET') {
      const limit = parseInt(url.searchParams.get('limit') ?? '20');
      const offset = parseInt(url.searchParams.get('offset') ?? '0');

      const { data: sessions, error, count } = await supabase
        .from('workout_sessions')
        .select(`
          *,
          program:programs(id, name),
          workout_day:workout_days(id, name)
        `, { count: 'exact' })
        .eq('user_id', user.id)
        .order('started_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        return errorResponse(error.message, 500);
      }

      return jsonResponse({ data: sessions, count, limit, offset });
    }

    // POST /workouts - Start new workout session
    if (req.method === 'POST') {
      const body = await req.json();

      const { data: session, error } = await supabase
        .from('workout_sessions')
        .insert({
          user_id: user.id,
          program_id: body.programId,
          workout_day_id: body.dayId,
        })
        .select(`
          *,
          program:programs(id, name),
          workout_day:workout_days(
            *,
            exercises:program_exercises(
              *,
              exercise:exercises(id, name, muscle_group, equipment)
            )
          )
        `)
        .single();

      if (error) {
        return errorResponse(error.message, 400);
      }

      // Pre-create sets based on program exercises
      if (session.workout_day?.exercises) {
        const setsToCreate: any[] = [];

        for (const programEx of session.workout_day.exercises) {
          for (let i = 1; i <= programEx.sets; i++) {
            setsToCreate.push({
              session_id: session.id,
              exercise_id: programEx.exercise_id,
              set_number: i,
              weight: null,
              reps: null,
              completed: false,
            });
          }
        }

        if (setsToCreate.length > 0) {
          await supabase.from('workout_sets').insert(setsToCreate);
        }
      }

      // Fetch complete session with sets
      const { data: completeSession } = await supabase
        .from('workout_sessions')
        .select(`
          *,
          program:programs(id, name),
          workout_day:workout_days(id, name, muscle_groups),
          sets:workout_sets(
            *,
            exercise:exercises(id, name, muscle_group, equipment)
          )
        `)
        .eq('id', session.id)
        .single();

      return jsonResponse(completeSession, 201);
    }

    // DELETE /workouts/:id - Delete workout session
    if (pathParts.length === 2 && req.method === 'DELETE') {
      const sessionId = pathParts[1];

      const { error } = await supabase
        .from('workout_sessions')
        .delete()
        .eq('id', sessionId)
        .eq('user_id', user.id);

      if (error) {
        return errorResponse(error.message, 400);
      }

      return jsonResponse({ success: true });
    }

    return errorResponse('Method not allowed', 405);
  } catch (err) {
    return errorResponse(err.message, 500);
  }
});
