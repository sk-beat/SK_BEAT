-------------------------------------------------------------------------------
-- ADMINS
-------------------------------------------------------------------------------

CREATE POLICY "Authenticated users can view admins"
ON admins
FOR SELECT
TO authenticated
USING (true);


CREATE POLICY "Users can create own admin record"
ON admins
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = admin_id
);


-------------------------------------------------------------------------------
-- KABATAAN PROFILES
-------------------------------------------------------------------------------

CREATE POLICY "Authenticated users can view profiles"
ON kabataan_profiles
FOR SELECT
TO authenticated
USING (true);


CREATE POLICY "Users can create own profile"
ON kabataan_profiles
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = profile_id
);


CREATE POLICY "Users can update own profile"
ON kabataan_profiles
FOR UPDATE
TO authenticated
USING (
  auth.uid() = profile_id
)
WITH CHECK (
  auth.uid() = profile_id
);


-------------------------------------------------------------------------------
-- ANNUAL BUDGETS
-------------------------------------------------------------------------------

CREATE POLICY "Authenticated users can view budgets"
ON annual_budgets
FOR SELECT
TO authenticated
USING (true);


CREATE POLICY "Authenticated users can manage budgets"
ON annual_budgets
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);


-------------------------------------------------------------------------------
-- SURVEYS
-------------------------------------------------------------------------------

CREATE POLICY "Authenticated users can view surveys"
ON surveys
FOR SELECT
TO authenticated
USING (true);


CREATE POLICY "Authenticated users can manage surveys"
ON surveys
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);


CREATE POLICY "Authenticated users can view activities"
ON survey_activities
FOR SELECT
TO authenticated
USING (true);


CREATE POLICY "Authenticated users can manage activities"
ON survey_activities
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);


-------------------------------------------------------------------------------
-- SURVEY VOTES
-------------------------------------------------------------------------------

CREATE POLICY "Users can view votes"
ON survey_votes
FOR SELECT
TO authenticated
USING (true);


CREATE POLICY "Users can submit own votes"
ON survey_votes
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
);


CREATE POLICY "Users can delete own votes"
ON survey_votes
FOR DELETE
TO authenticated
USING (
  auth.uid() = user_id
);


-------------------------------------------------------------------------------
-- EVENTS
-------------------------------------------------------------------------------

CREATE POLICY "Authenticated users can view events"
ON events
FOR SELECT
TO authenticated
USING (true);


CREATE POLICY "Authenticated users can manage events"
ON events
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);


-------------------------------------------------------------------------------
-- EVENT EXPENSES
-------------------------------------------------------------------------------

CREATE POLICY "Authenticated users can view expenses"
ON event_expenses
FOR SELECT
TO authenticated
USING (true);


CREATE POLICY "Authenticated users can manage expenses"
ON event_expenses
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);


-------------------------------------------------------------------------------
-- EVENT REGISTRATIONS
-------------------------------------------------------------------------------

CREATE POLICY "Users can view registrations"
ON event_registrations
FOR SELECT
TO authenticated
USING (true);


CREATE POLICY "Users can register themselves"
ON event_registrations
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
);


CREATE POLICY "Users can cancel registrations"
ON event_registrations
FOR DELETE
TO authenticated
USING (
  auth.uid() = user_id
);


-------------------------------------------------------------------------------
-- FEEDBACK
-------------------------------------------------------------------------------

CREATE POLICY "Users can view feedback"
ON post_event_feedback
FOR SELECT
TO authenticated
USING (true);


CREATE POLICY "Users can submit feedback"
ON post_event_feedback
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
);


-------------------------------------------------------------------------------
-- KABATAAN SUGGESTIONS
-------------------------------------------------------------------------------

CREATE POLICY "Authenticated users can view suggestions"
ON kabataan_suggestions
FOR SELECT
TO authenticated
USING (true);


CREATE POLICY "Users can submit own suggestions"
ON kabataan_suggestions
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
);
