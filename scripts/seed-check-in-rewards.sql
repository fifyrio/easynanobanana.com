-- Seed check-in rewards table with 7-day progression
-- Day 1: Generous starter reward (5 credits)
-- Day 2-3: Standard rewards (2-3 credits)
-- Day 4: Bonus day (5 credits)
-- Day 5-6: Higher rewards (3-5 credits)
-- Day 7: Major bonus (10 credits)

INSERT INTO check_in_rewards (day, credits, is_bonus_day) VALUES
  (1, 5, false),    -- Day 1: 5 credits (generous starter!)
  (2, 2, false),    -- Day 2: 2 credits
  (3, 3, false),    -- Day 3: 3 credits
  (4, 5, true),     -- Day 4: 5 credits (bonus!)
  (5, 3, false),    -- Day 5: 3 credits
  (6, 5, false),    -- Day 6: 5 credits
  (7, 10, true)     -- Day 7: 10 credits (weekly bonus!)
ON CONFLICT (day) DO UPDATE SET
  credits = EXCLUDED.credits,
  is_bonus_day = EXCLUDED.is_bonus_day;