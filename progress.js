const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = 'https://hsnaumiotmaozcqyeggc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhzbmF1bWlvdG1hb3pjcXllZ2djIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcxNzU3OTc4MywiZXhwIjoyMDMzMTU1NzgzfQ.jrh-z6xSiVELtJKGZH2WhEoAhPpzYvBhmnmfcNllSNY';
const supabase = createClient(supabaseUrl, supabaseKey);

// Function to subscribe to realtime updates for requests in progress
const subscribeToProgressUpdates = (requestId, model_name, height, width, scale) => {
  const realtime = supabase
    .from('requests')
    .on('UPDATE', (payload) => {  
      const { new: updatedRow } = payload;
      console.log(`Received update for requestId ${requestId}:`, updatedRow);
      if (updatedRow.request_id === requestId && updatedRow.current_status === 1) {
        const newProgress = updatedRow.current_progress;
        console.log(`Progress update for requestId ${requestId}: ${newProgress}%`);
      } else if (updatedRow.request_id === requestId && updatedRow.current_status === 2) {
        console.log(`Request ${requestId} is complete. Unsubscribing...`);
        realtime.unsubscribe();
      }
    })
    .subscribe();

  realtime.on('SUBSCRIPTION_ERROR', (error) => {
    console.error('Subscription error:', error);
  });

  return realtime;
};

module.exports = { subscribeToProgressUpdates };