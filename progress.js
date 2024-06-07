const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = 'https://hsnaumiotmaozcqyeggc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhzbmF1bWlvdG1hb3pjcXllZ2djIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcxNzU3OTc4MywiZXhwIjoyMDMzMTU1NzgzfQ.jrh-z6xSiVELtJKGZH2WhEoAhPpzYvBhmnmfcNllSNY';  // Replace with your actual key
const supabase = createClient(supabaseUrl, supabaseKey);



// Function to subscribe to realtime updates for requests in progress
const subscribeToProgressUpdates = (requestId) => {
  const channel = supabase
    .channel('public:requests')
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'requests' }, (payload) => {
      const updatedRow = payload.new;
      console.log(`Received update for requestId ${requestId}:`, updatedRow);
      if (updatedRow.request_id === requestId && updatedRow.current_status === 1) {
        const newProgress = updatedRow.current_progress;
        console.log(`Progress update for requestId ${requestId}: ${newProgress}%`);
      } else if (updatedRow.request_id === requestId && updatedRow.current_status === 2) {
        console.log(`Request ${requestId} is complete. Unsubscribing...`);
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
