-- one-product-project S1.2 — one project. Every statement is pinned to ids read 2026-10-08 and guarded on the
-- state it expects, so a re-run changes nothing. demo = c7af5b7a… (golden-beans-demo → golden-frijoles), gb = 2a709135…
begin;

update projects set slug = 'golden-frijoles'
 where id = 'c7af5b7a-11f2-4496-9649-baf17915ef55' and slug = 'golden-beans-demo';

update features set project_id = 'c7af5b7a-11f2-4496-9649-baf17915ef55'
 where project_id = '2a709135-c801-4443-a733-a788f3ac41c2'
   and key in ('waitlist_conversion', 'activation', 'methodology_reading');

-- One North Star: the synthetic payable_sellers retires (backed up), the real proven_bets moves in with its inputs.
delete from north_star_metrics
 where id = '2b8f4531-1d4f-425c-8eef-ebdf6fbc1ba0' and project_id = 'c7af5b7a-11f2-4496-9649-baf17915ef55';

update north_star_metrics set project_id = 'c7af5b7a-11f2-4496-9649-baf17915ef55'
 where id = 'baa1e79a-15d2-4154-83f8-1a2d80ea1c24' and project_id = '2a709135-c801-4443-a733-a788f3ac41c2';

update leading_inputs set project_id = 'c7af5b7a-11f2-4496-9649-baf17915ef55'
 where metric_id = 'baa1e79a-15d2-4154-83f8-1a2d80ea1c24' and project_id = '2a709135-c801-4443-a733-a788f3ac41c2';

-- Vercel's SELF_PROJECT_API_KEY: re-pointed, not re-minted (D4).
update api_keys set project_id = 'c7af5b7a-11f2-4496-9649-baf17915ef55'
 where id = 'd2bf557b-e1fe-42a9-a77b-70c857088104' and project_id = '2a709135-c801-4443-a733-a788f3ac41c2'
   and revoked_at is null;

-- golden-beans archived: no live credential left.
update connector_tokens set revoked_at = now()
 where id = '6225230f-cf80-4927-8f1d-31801fd12391' and revoked_at is null;

select
  (select slug from projects where id = 'c7af5b7a-11f2-4496-9649-baf17915ef55') as slug,
  (select count(*) from features where project_id = 'c7af5b7a-11f2-4496-9649-baf17915ef55') as features,
  (select string_agg(key, ',') from north_star_metrics where project_id = 'c7af5b7a-11f2-4496-9649-baf17915ef55') as north_star,
  (select count(*) from leading_inputs where project_id = 'c7af5b7a-11f2-4496-9649-baf17915ef55') as inputs,
  (select count(*) from api_keys where project_id = '2a709135-c801-4443-a733-a788f3ac41c2' and revoked_at is null) as gb_live_keys,
  (select count(*) from connector_tokens where project_id = '2a709135-c801-4443-a733-a788f3ac41c2' and revoked_at is null) as gb_live_tokens;

commit;
