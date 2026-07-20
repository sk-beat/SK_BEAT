revoke update on public.kabataan_suggestions from public, anon, authenticated;

grant update (
  feedback_comment,
  feedback_updated_at,
  feedback_updated_by
) on public.kabataan_suggestions to authenticated;
