const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://hsnaumiotmaozcqyeggc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhzbmF1bWlvdG1hb3pjcXllZ2djIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcxNzU3OTc4MywiZXhwIjoyMDMzMTU1NzgzfQ.jrh-z6xSiVELtJKGZH2WhEoAhPpzYvBhmnmfcNllSNY';
const supabase = createClient(supabaseUrl, supabaseKey);

const updateStatus = async (requestId, status, progressPercentage) => {
    const { error } = await supabase
      .from('requests')
      .update({ current_status: status, current_progress: progressPercentage })
      .eq('request_id', requestId);
  
    if (error) console.error('Error updating status:', error);
  };
  module.exports = { updateStatus };
  console.log('Exporting updateStatus:', updateStatus);