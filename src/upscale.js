const { exec } = require('child_process');
const { updateStatus } = require('./Progress_update/updateStatus');
require('dotenv').config();


const parseProgress = (data) => {
  const progressMatch = data.match(/(\d+\.\d+)%/);
  if (progressMatch) {
    return parseInt(progressMatch[1]);
  }
  return 0;
};
const upscaleImage = async (imagePath, requestId, model_name, scale) => {
  const bin_location = process.env.upscayl_bin_location
  const input_location = process.env.upscayl_input_location
  const output_location = process.env.upscayl_output_location
  const model_location = process.env.upscayl_model_location
  const upscaledImagePath = `upscaled/${requestId}.png`;
  const command = `"${bin_location}" -i "${input_location}${imagePath}" -o "${output_location}${upscaledImagePath}" -m "${model_location}" -n ${model_name} -c 0 -s ${scale}`;   
  let retries = 0;

  const executeCommand = () => {
    const process = exec(command, (error, stderr) => {
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