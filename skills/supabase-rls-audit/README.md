# supabase-rls-audit

Audits Supabase Row Level Security for the failure modes that have
caused real data leaks — CVE-2025-48757 (inverted RLS policies) and the
Moltbook incident (RLS disabled on a token table). Walks six checks in
priority order: tables with RLS off, tables with RLS on but no
policies, anon-role access, inverted policy logic, service role key in
client code, anon key in the bundle. Ranks findings critical / high /
medium / low and gives the exact SQL fix for each. Example: "Audit my
Supabase project before I launch on Friday."
