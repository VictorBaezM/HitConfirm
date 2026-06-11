-- 2024-06-11: Enable pg_cron and pg_net to schedule hourly frame data refresh
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Unschedules the job if it already exists to prevent duplicate entries on rerun
SELECT cron.unschedule('refresh-frame-data-hourly') WHERE EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'refresh-frame-data-hourly'
);

SELECT cron.schedule('refresh-frame-data-hourly', '0 * * * *', $$
  SELECT net.http_post(
    url := 'https://jepptvwtzyinhqmapnzo.supabase.co/functions/v1/refresh-frame-data',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImplcHB0dnd0enlpbmhxbWFwbnpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA3MTY1NjQsImV4cCI6MjA5NjI5MjU2NH0.mgzgw8KpwmdysMALboUBj3iiu-EUcxnqMmKPcVMSDGI'
    ),
    body := '{}'::jsonb
  ) AS request_id;
$$);
