/* Optional cloud configuration.
   Replace the empty strings after creating your Supabase project.
   The anon key is intended for browser use; never put a service_role key here. */
window.SUPABASE_CONFIG={url:'',anonKey:''};
(function(){try{const c=window.SUPABASE_CONFIG;if(c.url&&c.anonKey&&!localStorage.getItem('labPortfolioCloudConfig'))localStorage.setItem('labPortfolioCloudConfig',JSON.stringify(c))}catch(e){}})();
