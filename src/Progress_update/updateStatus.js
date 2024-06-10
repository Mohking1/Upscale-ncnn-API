const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

supabaseUrl = process.env.supabaseUrl;
supabaseKey = process.env.supabaseKey;
const supabase = createClient(supabaseUrl, supabaseKey);

const updateStatus = async (requestId, status, progressPercentage) => {
    const { error } = await supabase
      .from('requests')
      .update({ current_status: status, current_progress: progressPercentage })
      .eq('request_id', requestId);
  
    if (error) console.error('Error updating status:', error);
  };
  module.exports = { updateStatus };