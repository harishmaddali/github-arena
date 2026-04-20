-- pgTAP tests for the public.profiles table.
-- Run with: supabase db test
begin;

-- Load pgTAP (available in Supabase's local Postgres image).
create extension if not exists pgtap with schema extensions;

select plan(12);

-- Table existence
select has_table('public', 'profiles', 'public.profiles table should exist');

-- Columns exist
select has_column('public', 'profiles', 'id',         'profiles.id column should exist');
select has_column('public', 'profiles', 'username',   'profiles.username column should exist');
select has_column('public', 'profiles', 'full_name',  'profiles.full_name column should exist');
select has_column('public', 'profiles', 'avatar_url', 'profiles.avatar_url column should exist');
select has_column('public', 'profiles', 'created_at', 'profiles.created_at column should exist');
select has_column('public', 'profiles', 'updated_at', 'profiles.updated_at column should exist');

-- Column types
select col_type_is('public', 'profiles', 'id',         'uuid',                     'profiles.id should be uuid');
select col_type_is('public', 'profiles', 'username',   'text',                     'profiles.username should be text');
select col_type_is('public', 'profiles', 'created_at', 'timestamp with time zone', 'profiles.created_at should be timestamptz');

-- Primary key
select col_is_pk('public', 'profiles', 'id', 'profiles.id should be the primary key');

-- Row Level Security should be enabled
select ok(
    (select relrowsecurity from pg_class where oid = 'public.profiles'::regclass),
    'Row Level Security should be enabled on profiles'
);

select * from finish();

rollback;
