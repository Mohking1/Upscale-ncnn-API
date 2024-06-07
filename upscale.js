const { exec } = require('child_process');
const { updateStatus } = require('./updateStatus');
const { createClient } = require('@supabase/supabase-js');

// Supabase setup
const supabaseUrl = 'https://hsnaumiotmaozcqyeggc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhzbmF1bWlvdG1hb3pjcXllZ2djIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcxNzU3OTc4MywiZXhwIjoyMDMzMTU1NzgzfQ.jrh-z6xSiVELtJKGZH2WhEoAhPpzYvBhmnmfcNllSNY';
const supabase = createClient(supabaseUrl, supabaseKey);

console.log('updateStatus:', updateStatus);
const parseProgress = (data) => {
  const progressMatch = data.match(/(\d+\.\d+)%/);
  if (progressMatch) {
    return parseInt(progressMatch[1]);
  }
  return 0;
};
const upscaleImage = async (imagePath, requestId, model_name, height, width, res) => {
  const upscaledImagePath = `upscaled/${requestId}.png`;
  const command = `"D:\\Projects\\Internship\\Upscaly ncnn\\upscayl-ncnn\\build\\Release\\upscayl-bin.exe" -i "D:/Projects/Internship/Real-Esgran _API/"${imagePath} -o "D:/Projects/Internship/Real-Esgran _API/"${upscaledImagePath} -m "D:/Projects/Internship/Upscaly ncnn/upscayl-ncnn/build/Release/models" -n ${model_name} -c 0`;
  let retries = 0;

  const executeCommand = () => {
    const process = exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error upscaling image: ${stderr}`);
        if (retries < 3) {
          retries++;
          executeCommand();
        } else {
          updateStatus(requestId, 3, 100); // Status 3 for error
        }
      } else {
        updateStatus(requestId, 2, 100); // Status 2 for completed
      }
    });

    process.stderr.on('data', (data) => {
      const progressPercentage = parseProgress(data);
      updateStatus(requestId, 1, progressPercentage); // Status 1 for in progress
    });
  };

  executeCommand();
};

module.exports = { upscaleImage };