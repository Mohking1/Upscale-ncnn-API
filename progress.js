const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://hsnaumiotmaozcqyeggc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhzbmF1bWlvdG1hb3pjcXllZ2djIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcxNzU3OTc4MywiZXhwIjoyMDMzMTU1NzgzfQ.jrh-z6xSiVELtJKGZH2WhEoAhPpzYvBhmnmfcNllSNY';  // Replace with your actual key
const supabase = createClient(supabaseUrl, supabaseKey);


const subscribeToProgressUpdates = (requestId, api_key) => {
  const channel = supabase
    .channel('public:requests')
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'requests' }, async (payload) => {
      const updatedRow = payload.new;
      console.log(`Received update for requestId ${requestId}:`, updatedRow);
      if (updatedRow.request_id === requestId && updatedRow.current_status === 1) {
        const newProgress = updatedRow.current_progress;
        console.log(`Progress update for requestId ${requestId}: ${newProgress}%`);
      } else if (updatedRow.request_id === requestId && updatedRow.current_status === 2) {
        console.log(`Request ${requestId} is complete. Unsubscribing...`);
        const { data, error } = await supabase
        .rpc('update_daily_quota', { api_key_param: api_key })
        .single();
        supabase.removeChannel(channel);
      }
    })
    .subscribe((status, error) => {
      if (status === 'SUBSCRIPTION_ERROR') {
        console.error('Subscription error:', error);
      }
    });

  return channel;
};

module.exports = { subscribeToProgressUpdates };
