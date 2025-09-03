-- Seed check-in rewards table with 7-day progression
-- Day 1-3: Standard rewards (1-2 credits)
-- Day 4: Bonus day (3 credits)  
-- Day 5-6: Higher rewards (2-3 credits)
-- Day 7: Major bonus (5 credits)

INSERT INTO check_in_rewards (day, credits, is_bonus_day) VALUES
  (1, 1, false),    -- Day 1: 1 credit
  (2, 1, false),    -- Day 2: 1 credit  
  (3, 2, false),    -- Day 3: 2 credits
  (4, 3, true),     -- Day 4: 3 credits (bonus!)
  (5, 2, false),    -- Day 5: 2 credits
  (6, 3, false),    -- Day 6: 3 credits
  (7, 5, true)      -- Day 7: 5 credits (weekly bonus!)
ON CONFLICT (day) DO UPDATE SET
  credits = EXCLUDED.credits,
  is_bonus_day = EXCLUDED.is_bonus_day;