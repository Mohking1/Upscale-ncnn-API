const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();


supabaseUrl = process.env.supabaseUrl;
supabaseKey = process.env.supabaseKey;
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
        .rpc('update_api_quotas', { api_key_param: api_key })
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
