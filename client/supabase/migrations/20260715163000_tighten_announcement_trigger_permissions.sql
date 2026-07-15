begin;

create index if not exists announcements_created_by_idx
on public.announcements(created_by);

revoke all on function public.set_announcement_audit_fields()
from public, anon, authenticated;

commit;
