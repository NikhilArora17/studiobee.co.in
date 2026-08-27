-- mystudiobee/supabase/migrations/0041_document_round_total.sql
alter table documents
  add column if not exists round_total boolean not null default false;
