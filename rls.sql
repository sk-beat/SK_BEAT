-------------------------------------------------------------------------------
-- 1. ADMINS TABLE POLICIES
-------------------------------------------------------------------------------
-- Admins can view the admin roster
CREATE POLICY "Admins can view admin list" 
ON admins FOR SELECT 
TO authenticated 
USING (true);

-- Only an admin can modify or create admin records
CREATE POLICY "Admins can manage admin accounts" 
ON admins FOR ALL 
TO authenticated 
USING (EXISTS (SELECT 1 FROM admins WHERE admin_id = auth.uid()));

-------------------------------------------------------------------------------
-- 2. KABATAAN_PROFILES TABLE POLICIES
-------------------------------------------------------------------------------
-- Authenticated users (Admins and other youth) can view profiles
CREATE POLICY "Authenticated users can view profiles" 
ON kabataan_profiles FOR SELECT 
TO authenticated 
USING (true);

-- Users can only update their own profile data
CREATE POLICY "Users can update own profile" 
ON kabataan_profiles FOR UPDATE 
TO authenticated 
USING (auth.uid() = profile_id)
WITH CHECK (auth.uid() = profile_id);

-- Admins have full power to approve/reject or delete profiles
CREATE POLICY "Admins can manage youth profiles" 
ON kabataan_profiles FOR ALL 
TO authenticated 
USING (EXISTS (SELECT 1 FROM admins WHERE admin_id = auth.uid()));

-------------------------------------------------------------------------------
-- 3. ANNUAL_BUDGETS TABLE POLICIES
-------------------------------------------------------------------------------
-- Everyone logged in can view the financial dashboard summaries
CREATE POLICY "Authenticated users can view annual budgets" 
ON annual_budgets FOR SELECT 
TO authenticated 
USING (true);

-- Only admins can allocate or modify the master budget
CREATE POLICY "Admins can manage annual budgets" 
ON annual_budgets FOR ALL 
TO authenticated 
USING (EXISTS (SELECT 1 FROM admins WHERE admin_id = auth.uid()));

-------------------------------------------------------------------------------
-- 4. SURVEYS & SURVEY_ACTIVITIES POLICIES
-------------------------------------------------------------------------------
-- Everyone logged in can view surveys and their activities
CREATE POLICY "Authenticated users can view surveys" 
ON surveys FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can view survey activities" 
ON survey_activities FOR SELECT TO authenticated USING (true);

-- Only admins can create, delete, or activate surveys
CREATE POLICY "Admins can manage surveys" 
ON surveys FOR ALL TO authenticated 
USING (EXISTS (SELECT 1 FROM admins WHERE admin_id = auth.uid()));

CREATE POLICY "Admins can manage survey activities" 
ON survey_activities FOR ALL TO authenticated 
USING (EXISTS (SELECT 1 FROM admins WHERE admin_id = auth.uid()));

-------------------------------------------------------------------------------
-- 5. SURVEY_VOTES TABLE POLICIES (Lalabas sa Survey)
-------------------------------------------------------------------------------
-- Admins can view all votes to aggregate the top 3 picks
CREATE POLICY "Admins can view all votes" 
ON survey_votes FOR SELECT 
TO authenticated 
USING (EXISTS (SELECT 1 FROM admins WHERE admin_id = auth.uid()));

-- Youth can cast a vote, but only under their own UUID
CREATE POLICY "Youth can cast own vote" 
ON survey_votes FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

-- Youth can see their own cast votes
CREATE POLICY "Youth can view own votes" 
ON survey_votes FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

-- Youth can change/retract their own vote if they change their mind
CREATE POLICY "Youth can delete own vote" 
ON survey_votes FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id);

-------------------------------------------------------------------------------
-- 6. EVENTS TABLE POLICIES
-------------------------------------------------------------------------------
-- Everyone can view events (drafts, scheduled, completed)
CREATE POLICY "Authenticated users can view events" 
ON events FOR SELECT 
TO authenticated 
USING (true);

-- Only admins can create, schedule, budget, or change event status
CREATE POLICY "Admins can manage events" 
ON events FOR ALL 
TO authenticated 
USING (EXISTS (SELECT 1 FROM admins WHERE admin_id = auth.uid()));

-------------------------------------------------------------------------------
-- 7. EVENT_EXPENSES TABLE POLICIES
-------------------------------------------------------------------------------
-- Everyone can view the transparency/financial data of events
CREATE POLICY "Authenticated users can view expenses" 
ON event_expenses FOR SELECT 
TO authenticated 
USING (true);

-- Only admins can log receipts and deduct funds
CREATE POLICY "Admins can manage expenses" 
ON event_expenses FOR ALL 
TO authenticated 
USING (EXISTS (SELECT 1 FROM admins WHERE admin_id = auth.uid()));

-------------------------------------------------------------------------------
-- 8. EVENT_REGISTRATIONS TABLE POLICIES
-------------------------------------------------------------------------------
-- Admins can see who is attending what event
CREATE POLICY "Admins can view all registrations" 
ON event_registrations FOR SELECT 
TO authenticated 
USING (EXISTS (SELECT 1 FROM admins WHERE admin_id = auth.uid()));

-- Youth can see what events they are signed up for
CREATE POLICY "Youth can view own registrations" 
ON event_registrations FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

-- Youth can click "Register" using their own UUID session
CREATE POLICY "Youth can register themselves for events" 
ON event_registrations FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

-- Youth can cancel/leave an event registration
CREATE POLICY "Youth can cancel own registration" 
ON event_registrations FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id);

-------------------------------------------------------------------------------
-- 9. POST_EVENT_FEEDBACK TABLE POLICIES (QR Code Feedback)
-------------------------------------------------------------------------------
-- Everyone can view the feedback ratings
CREATE POLICY "Authenticated users can view feedback" 
ON post_event_feedback FOR SELECT 
TO authenticated 
USING (true);

-- Users can submit feedback using their own session id
CREATE POLICY "Youth can submit event feedback" 
ON post_event_feedback FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);


CREATE POLICY "Allow initial profile creation during signup" 
ON kabataan_profiles FOR INSERT 
TO authenticated, anon
WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Allow initial admin creation" 
ON admins FOR INSERT 
TO authenticated, anon
WITH CHECK (auth.uid() = admin_id);
