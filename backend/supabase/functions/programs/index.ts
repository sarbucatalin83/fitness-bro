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

  // Require authentication for all program endpoints
  const user = await getUser(req);
  if (!user) {
    return errorResponse('Unauthorized', 401);
  }

  try {
    // GET /programs/:id - Get single program with days and exercises
    if (pathParts.length === 2 && req.method === 'GET') {
      const programId = pathParts[1];

      const { data: program, error } = await supabase
        .from('programs')
        .select(`
          *,
          days:workout_days(
            *,
            exercises:program_exercises(
              *,
              exercise:exercises(id, name, muscle_group, equipment, icon_color)
            )
          )
        `)
        .eq('id', programId)
        .eq('user_id', user.id)
        .order('day_number', { foreignTable: 'workout_days', ascending: true })
        .single();

      if (error) {
        return errorResponse('Program not found', 404);
      }

      return jsonResponse(program);
    }

    // PATCH /programs/:id/activate - Activate a program
    if (pathParts.length === 3 && pathParts[2] === 'activate' && req.method === 'PATCH') {
      const programId = pathParts[1];

      const { data: program, error } = await supabase
        .from('programs')
        .update({ is_active: true, updated_at: new Date().toISOString() })
        .eq('id', programId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        return errorResponse(error.message, 400);
      }

      return jsonResponse(program);
    }

    // GET /programs - List all user programs
    if (req.method === 'GET') {
      const activeOnly = url.searchParams.get('active') === 'true';

      let query = supabase
        .from('programs')
        .select(`
          *,
          days:workout_days(count)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (activeOnly) {
        query = query.eq('is_active', true);
      }

      const { data: programs, error } = await query;

      if (error) {
        return errorResponse(error.message, 500);
      }

      return jsonResponse(programs);
    }

    // POST /programs - Create new program
    if (req.method === 'POST') {
      const body = await req.json();

      // Insert program
      const { data: program, error: programError } = await supabase
        .from('programs')
        .insert({
          user_id: user.id,
          name: body.name,
          description: body.description,
          difficulty: body.difficulty,
          duration_weeks: body.durationWeeks || 4,
          days_per_week: body.days?.length || 3,
          type: body.type || 'Custom',
          icon_type: body.iconType || 'grid',
          is_active: body.isActive || false,
        })
        .select()
        .single();

      if (programError) {
        return errorResponse(programError.message, 400);
      }

      // Insert workout days
      if (body.days && body.days.length > 0) {
        for (const day of body.days) {
          const { data: workoutDay, error: dayError } = await supabase
            .from('workout_days')
            .insert({
              program_id: program.id,
              day_number: day.dayNumber,
              name: day.name,
              muscle_groups: day.muscleGroups,
              estimated_duration: day.estimatedDuration || 45,
            })
            .select()
            .single();

          if (dayError) {
            console.error('Day insert error:', dayError);
            continue;
          }

          // Insert program exercises
          if (day.exercises && day.exercises.length > 0) {
            const exercisesToInsert = day.exercises.map((ex: any, index: number) => ({
              workout_day_id: workoutDay.id,
              exercise_id: ex.exerciseId,
              sets: ex.sets || 3,
              reps: ex.reps || '10',
              sort_order: index,
            }));

            await supabase.from('program_exercises').insert(exercisesToInsert);
          }
        }
      }

      // Fetch complete program
      const { data: completeProgram } = await supabase
        .from('programs')
        .select(`
          *,
          days:workout_days(
            *,
            exercises:program_exercises(
              *,
              exercise:exercises(id, name, muscle_group, equipment, icon_color)
            )
          )
        `)
        .eq('id', program.id)
        .single();

      return jsonResponse(completeProgram, 201);
    }

    // PUT /programs/:id - Update program
    if (pathParts.length === 2 && req.method === 'PUT') {
      const programId = pathParts[1];
      const body = await req.json();

      const { data: program, error } = await supabase
        .from('programs')
        .update({
          name: body.name,
          description: body.description,
          difficulty: body.difficulty,
          duration_weeks: body.durationWeeks,
          type: body.type,
          icon_type: body.iconType,
          updated_at: new Date().toISOString(),
        })
        .eq('id', programId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        return errorResponse(error.message, 400);
      }

      return jsonResponse(program);
    }

    // DELETE /programs/:id - Delete program
    if (pathParts.length === 2 && req.method === 'DELETE') {
      const programId = pathParts[1];

      const { error } = await supabase
        .from('programs')
        .delete()
        .eq('id', programId)
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
