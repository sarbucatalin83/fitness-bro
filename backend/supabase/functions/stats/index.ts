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
    // GET /stats/weekly - Get weekly volume statistics
    if (pathParts.length === 2 && pathParts[1] === 'weekly' && req.method === 'GET') {
      const weeks = parseInt(url.searchParams.get('weeks') ?? '1');
      const daysAgo = weeks * 7;

      // Get all workout sessions from the past N weeks
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysAgo);

      const { data: sessions, error } = await supabase
        .from('workout_sessions')
        .select(`
          id,
          started_at,
          completed_at,
          total_volume,
          sets:workout_sets(weight, reps, completed)
        `)
        .eq('user_id', user.id)
        .gte('started_at', startDate.toISOString())
        .order('started_at', { ascending: true });

      if (error) {
        return errorResponse(error.message, 500);
      }

      // Group by day of week
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const volumeByDay: Record<string, number> = {};

      // Initialize all days with 0
      dayNames.forEach(day => {
        volumeByDay[day] = 0;
      });

      // Calculate volume for each session
      sessions?.forEach(session => {
        const sessionDate = new Date(session.started_at);
        const dayName = dayNames[sessionDate.getDay()];

        // Use stored total_volume if available, otherwise calculate from sets
        if (session.total_volume) {
          volumeByDay[dayName] += parseFloat(session.total_volume);
        } else if (session.sets) {
          const sessionVolume = session.sets
            .filter((set: any) => set.completed)
            .reduce((sum: number, set: any) => {
              return sum + (set.weight || 0) * (set.reps || 0);
            }, 0);
          volumeByDay[dayName] += sessionVolume;
        }
      });

      // Format response
      const volumeTrend = dayNames.map(day => ({
        day,
        volume: Math.round(volumeByDay[day]),
      }));

      const totalWorkouts = sessions?.filter(s => s.completed_at).length || 0;
      const totalVolume = Object.values(volumeByDay).reduce((sum, v) => sum + v, 0);

      return jsonResponse({
        volumeTrend,
        totalWorkouts,
        totalVolume: Math.round(totalVolume),
        period: `${weeks} week${weeks > 1 ? 's' : ''}`,
      });
    }

    // GET /stats/exercise/:exerciseId - Get stats for specific exercise
    if (pathParts.length === 3 && pathParts[1] === 'exercise' && req.method === 'GET') {
      const exerciseId = pathParts[2];
      const limit = parseInt(url.searchParams.get('limit') ?? '10');

      const { data: sets, error } = await supabase
        .from('workout_sets')
        .select(`
          weight,
          reps,
          created_at,
          session:workout_sessions!inner(user_id)
        `)
        .eq('exercise_id', exerciseId)
        .eq('completed', true)
        .eq('session.user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        return errorResponse(error.message, 500);
      }

      // Calculate personal records
      const maxWeight = sets?.reduce((max, set) => Math.max(max, set.weight || 0), 0) || 0;
      const maxVolume = sets?.reduce((max, set) => {
        const volume = (set.weight || 0) * (set.reps || 0);
        return Math.max(max, volume);
      }, 0) || 0;

      // Get last performance
      const lastPerformance = sets?.[0] ? {
        weight: sets[0].weight,
        reps: sets[0].reps,
        date: sets[0].created_at,
      } : null;

      return jsonResponse({
        exerciseId,
        personalRecords: {
          maxWeight,
          maxVolume,
        },
        lastPerformance,
        recentSets: sets?.slice(0, 5) || [],
      });
    }

    // GET /stats/summary - Get overall summary
    if (pathParts.length === 2 && pathParts[1] === 'summary' && req.method === 'GET') {
      // Total workouts
      const { count: totalWorkouts } = await supabase
        .from('workout_sessions')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .not('completed_at', 'is', null);

      // Total volume all time
      const { data: allSessions } = await supabase
        .from('workout_sessions')
        .select('total_volume')
        .eq('user_id', user.id)
        .not('completed_at', 'is', null);

      const totalVolume = allSessions?.reduce((sum, s) => sum + (parseFloat(s.total_volume) || 0), 0) || 0;

      // Current streak (consecutive days with workouts)
      const { data: recentWorkouts } = await supabase
        .from('workout_sessions')
        .select('started_at')
        .eq('user_id', user.id)
        .not('completed_at', 'is', null)
        .order('started_at', { ascending: false })
        .limit(30);

      let streak = 0;
      if (recentWorkouts && recentWorkouts.length > 0) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const workoutDates = new Set(
          recentWorkouts.map(w => {
            const d = new Date(w.started_at);
            d.setHours(0, 0, 0, 0);
            return d.getTime();
          })
        );

        for (let i = 0; i < 30; i++) {
          const checkDate = new Date(today);
          checkDate.setDate(checkDate.getDate() - i);
          if (workoutDates.has(checkDate.getTime())) {
            streak++;
          } else if (i > 0) {
            break;
          }
        }
      }

      return jsonResponse({
        totalWorkouts: totalWorkouts || 0,
        totalVolume: Math.round(totalVolume),
        currentStreak: streak,
      });
    }

    return errorResponse('Method not allowed', 405);
  } catch (err) {
    return errorResponse(err.message, 500);
  }
});
