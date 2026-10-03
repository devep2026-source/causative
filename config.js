/* Public runtime config (values from .env.local).
   The anon key is safe to ship: every table is protected by Row Level Security. */
(function (w) {
  w.APP_CONFIG = w.APP_CONFIG || {
    SUPABASE_URL: 'https://kbuxkcvunpyynzydhzgp.supabase.co',
    SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtidXhrY3Z1bnB5eW56eWRoemdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA5ODU2NDQsImV4cCI6MjEwNjU2MTY0NH0.5_hiPpM3dslTE1CFmPRWp5VtFn8tYOnu4E4dbmPaYOA'
  };
})(window);
