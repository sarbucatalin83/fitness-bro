import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts';
import { createSupabaseClient } from '../_shared/supabase.ts';

serve(async (req: Request) => {
  // Handle CORS
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const supabase = createSupabaseClient(req);
  const url = new URL(req.url);
  const pathParts = url.pathname.split('/').filter(Boolean);

  try {
    // GET /exercises/:id - Get single exercise
    if (pathParts.length === 2 && req.method === 'GET') {
      const exerciseId = pathParts[1];

      const { data: exercise, error } = await supabase
        .from('exercises')
        .select(`
          *,
          tips:exercise_tips(id, title, description, sort_order)
        `)
        .eq('id', exerciseId)
        .single();

      if (error) {
        return errorResponse('Exercise not found', 404);
      }

      return jsonResponse(exercise);
    }

    // GET /exercises - List exercises with optional filters
    if (req.method === 'GET') {
      const muscleGroup = url.searchParams.get('muscleGroup');
      const equipment = url.searchParams.get('equipment');
      const difficulty = url.searchParams.get('difficulty');
      const search = url.searchParams.get('q');
      const limit = parseInt(url.searchParams.get('limit') ?? '50');
      const offset = parseInt(url.searchParams.get('offset') ?? '0');

      let query = supabase
        .from('exercises')
        .select(`
          *,
          tips:exercise_tips(id, title, description, sort_order)
        `, { count: 'exact' });

      // Apply filters
      if (muscleGroup && muscleGroup !== 'all') {
        query = query.eq('muscle_group', muscleGroup);
      }
      if (equipment) {
        query = query.eq('equipment', equipment);
      }
      if (difficulty) {
        query = query.eq('difficulty', difficulty);
      }
      if (search) {
        query = query.or(`name.ilike.%${search}%,muscle_group.ilike.%${search}%,equipment.ilike.%${search}%`);
      }

      // Pagination and ordering
      query = query
        .order('rating', { ascending: false })
        .range(offset, offset + limit - 1);

      const { data: exercises, error, count } = await query;

      if (error) {
        return errorResponse(error.message, 500);
      }

      return jsonResponse({
        data: exercises,
        count,
        limit,
        offset,
      });
    }

    return errorResponse('Method not allowed', 405);
  } catch (err) {
    return errorResponse(err.message, 500);
  }
});
