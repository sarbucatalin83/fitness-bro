-- ============================================
-- FitnessBro Seed Data
-- ============================================

-- Clear existing data (for development)
TRUNCATE exercise_tips, exercises CASCADE;

-- ============================================
-- EXERCISES
-- ============================================

INSERT INTO exercises (id, name, muscle_group, equipment, difficulty, rating, description, video_url, thumbnail_url, target_muscles, equipment_details, icon_color)
VALUES
  -- Bench Press
  (
    'e1000000-0000-0000-0000-000000000001',
    'Bench Press',
    'chest',
    'barbell',
    'intermediate',
    4.8,
    'The bench press is a classic compound exercise that primarily targets the pectoralis major, anterior deltoids, and triceps. It is fundamental for building upper body pushing strength and muscle mass.',
    '',
    'https://images.unsplash.com/photo-1534368420009-621bfab424a8?w=400',
    ARRAY['Pectorals', 'Triceps', 'Anterior Delts'],
    ARRAY['Barbell', 'Flat Bench', 'Rack'],
    'bg-blue-100 text-blue-600'
  ),
  -- Squat
  (
    'e1000000-0000-0000-0000-000000000002',
    'Squat',
    'legs',
    'barbell',
    'intermediate',
    4.9,
    'The barbell squat is the king of lower body exercises, targeting the quadriceps, hamstrings, glutes, and core. Essential for building leg strength and overall athletic performance.',
    '',
    'https://images.unsplash.com/photo-1566241142559-40e1dab266c6?w=400',
    ARRAY['Quadriceps', 'Glutes', 'Hamstrings'],
    ARRAY['Barbell', 'Squat Rack'],
    'bg-orange-100 text-orange-600'
  ),
  -- Deadlift
  (
    'e1000000-0000-0000-0000-000000000003',
    'Deadlift',
    'back',
    'barbell',
    'advanced',
    4.9,
    'The deadlift is a full-body compound movement that builds incredible posterior chain strength, targeting the back, glutes, hamstrings, and grip.',
    '',
    'https://images.unsplash.com/photo-1598575468023-85b93d887c3f?w=400',
    ARRAY['Erector Spinae', 'Glutes', 'Hamstrings'],
    ARRAY['Barbell', 'Weight Plates'],
    'bg-purple-100 text-purple-600'
  ),
  -- Pull Up
  (
    'e1000000-0000-0000-0000-000000000004',
    'Pull Up',
    'back',
    'bodyweight',
    'intermediate',
    4.7,
    'Pull-ups are a fundamental bodyweight exercise that builds a strong, wide back by targeting the latissimus dorsi, rhomboids, and biceps.',
    '',
    'https://images.unsplash.com/photo-1598971639058-fab3c3109a00?w=400',
    ARRAY['Latissimus Dorsi', 'Biceps', 'Rhomboids'],
    ARRAY['Pull-up Bar'],
    'bg-green-100 text-green-600'
  ),
  -- Overhead Press
  (
    'e1000000-0000-0000-0000-000000000005',
    'Overhead Press',
    'shoulders',
    'barbell',
    'intermediate',
    4.6,
    'The overhead press is the premier shoulder builder, developing strength and size in the deltoids, triceps, and upper chest while improving core stability.',
    '',
    'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=400',
    ARRAY['Deltoids', 'Triceps', 'Upper Chest'],
    ARRAY['Barbell', 'Rack'],
    'bg-red-100 text-red-600'
  ),
  -- Dumbbell Curl
  (
    'e1000000-0000-0000-0000-000000000006',
    'Dumbbell Curl',
    'biceps',
    'dumbbell',
    'beginner',
    4.4,
    'The dumbbell curl is an isolation exercise that directly targets the biceps brachii, building arm size and strength.',
    '',
    'https://images.unsplash.com/photo-1581009146145-b5ef050c149a?w=400',
    ARRAY['Biceps Brachii', 'Brachialis', 'Forearms'],
    ARRAY['Dumbbells'],
    'bg-teal-100 text-teal-600'
  ),
  -- Incline Dumbbell Press
  (
    'e1000000-0000-0000-0000-000000000007',
    'Incline Dumbbell Press',
    'chest',
    'dumbbell',
    'intermediate',
    4.5,
    'The incline dumbbell press targets the upper chest and front deltoids, helping to build a well-rounded chest.',
    '',
    'https://images.unsplash.com/photo-1534368420009-621bfab424a8?w=400',
    ARRAY['Upper Pectorals', 'Anterior Delts', 'Triceps'],
    ARRAY['Dumbbells', 'Incline Bench'],
    'bg-blue-100 text-blue-600'
  ),
  -- Tricep Pushdown
  (
    'e1000000-0000-0000-0000-000000000008',
    'Tricep Pushdown',
    'triceps',
    'cable',
    'beginner',
    4.3,
    'The tricep pushdown is an effective isolation exercise for building tricep size and strength using a cable machine.',
    '',
    'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400',
    ARRAY['Triceps'],
    ARRAY['Cable Machine', 'Rope or Bar Attachment'],
    'bg-indigo-100 text-indigo-600'
  );

-- ============================================
-- EXERCISE TIPS
-- ============================================

-- Bench Press Tips
INSERT INTO exercise_tips (exercise_id, title, description, sort_order)
VALUES
  ('e1000000-0000-0000-0000-000000000001', 'Plant your feet', 'Keep your feet flat on the floor to generate power and maintain stability throughout the lift.', 1),
  ('e1000000-0000-0000-0000-000000000001', 'Control the descent', 'Lower the bar slowly to your mid-chest, avoiding bouncing it off your ribcage.', 2),
  ('e1000000-0000-0000-0000-000000000001', 'Eye position', 'Eyes should be directly under the bar when un-racking to prevent hitting the pins.', 3);

-- Squat Tips
INSERT INTO exercise_tips (exercise_id, title, description, sort_order)
VALUES
  ('e1000000-0000-0000-0000-000000000002', 'Keep chest up', 'Maintain an upright torso throughout the movement to protect your lower back.', 1),
  ('e1000000-0000-0000-0000-000000000002', 'Knees track toes', 'Let your knees travel in line with your toes, not caving inward.', 2),
  ('e1000000-0000-0000-0000-000000000002', 'Depth matters', 'Aim for parallel or below for full muscle activation.', 3);

-- Deadlift Tips
INSERT INTO exercise_tips (exercise_id, title, description, sort_order)
VALUES
  ('e1000000-0000-0000-0000-000000000003', 'Engage lats', 'Pull your shoulders back and down before lifting to protect your spine.', 1),
  ('e1000000-0000-0000-0000-000000000003', 'Hip hinge', 'Push your hips back rather than squatting down to initiate the lift.', 2),
  ('e1000000-0000-0000-0000-000000000003', 'Bar path', 'Keep the bar close to your body throughout the entire movement.', 3);

-- Pull Up Tips
INSERT INTO exercise_tips (exercise_id, title, description, sort_order)
VALUES
  ('e1000000-0000-0000-0000-000000000004', 'Full range', 'Start from a dead hang and pull until your chin clears the bar.', 1),
  ('e1000000-0000-0000-0000-000000000004', 'Squeeze shoulder blades', 'Initiate the pull by depressing and retracting your scapulae.', 2),
  ('e1000000-0000-0000-0000-000000000004', 'Control the negative', 'Lower yourself slowly for maximum muscle engagement.', 3);

-- Overhead Press Tips
INSERT INTO exercise_tips (exercise_id, title, description, sort_order)
VALUES
  ('e1000000-0000-0000-0000-000000000005', 'Brace your core', 'Squeeze your glutes and abs to create a stable base.', 1),
  ('e1000000-0000-0000-0000-000000000005', 'Bar path', 'Press the bar in a slight arc around your face, then straight up.', 2),
  ('e1000000-0000-0000-0000-000000000005', 'Full lockout', 'Finish with arms fully extended and shrug slightly at the top.', 3);

-- Dumbbell Curl Tips
INSERT INTO exercise_tips (exercise_id, title, description, sort_order)
VALUES
  ('e1000000-0000-0000-0000-000000000006', 'No swinging', 'Keep your upper arms stationary throughout the movement.', 1),
  ('e1000000-0000-0000-0000-000000000006', 'Supinate at top', 'Rotate your wrists outward at the top for peak contraction.', 2),
  ('e1000000-0000-0000-0000-000000000006', 'Control both phases', 'Lower the weight slowly, don''t just drop it.', 3);

-- Incline Dumbbell Press Tips
INSERT INTO exercise_tips (exercise_id, title, description, sort_order)
VALUES
  ('e1000000-0000-0000-0000-000000000007', 'Angle matters', 'Set the bench to 30-45 degrees for optimal upper chest activation.', 1),
  ('e1000000-0000-0000-0000-000000000007', 'Squeeze at top', 'Bring the dumbbells together at the top for peak contraction.', 2),
  ('e1000000-0000-0000-0000-000000000007', 'Elbows at 45°', 'Keep elbows at 45 degrees to your torso to protect shoulders.', 3);

-- Tricep Pushdown Tips
INSERT INTO exercise_tips (exercise_id, title, description, sort_order)
VALUES
  ('e1000000-0000-0000-0000-000000000008', 'Lock elbows', 'Keep your elbows pinned to your sides throughout the movement.', 1),
  ('e1000000-0000-0000-0000-000000000008', 'Full extension', 'Squeeze at the bottom for maximum tricep activation.', 2),
  ('e1000000-0000-0000-0000-000000000008', 'Control the return', 'Don''t let the weight stack pull your arms up quickly.', 3);
