select cron.schedule(
  'spawn-coins-daily',
  '0 6 * * *',  -- runs every day at 6am UTC
  $$
  select net.http_post(
    url := 'https://anskelgrnddgcvcgxkcf.supabase.co/functions/v1/spawn-coins',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.service_role_key')
    )
  )
  $$
);
