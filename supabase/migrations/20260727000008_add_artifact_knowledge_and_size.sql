alter table artifacts
add column knowledge_id uuid references knowledge_entries(id) on delete set null,
add column size_bytes bigint,
add column checksum text;

create index if not exists idx_artifacts_knowledge_id on artifacts(knowledge_id);
create index if not exists idx_artifacts_mission_id on artifacts(mission_id);
create index if not exists idx_artifacts_employee_id on artifacts(employee_id);
