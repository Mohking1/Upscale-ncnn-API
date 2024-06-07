const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const { PNG } = require('png-metadata');

const supabaseUrl = 'https://hsnaumiotmaozcqyeggc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhzbmF1bWlvdG1hb3pjcXllZ2djIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcxNzU3OTc4MywiZXhwIjoyMDMzMTU1NzgzfQ.jrh-z6xSiVELtJKGZH2WhEoAhPpzYvBhmnmfcNllSNY';
const supabase = createClient(supabaseUrl, supabaseKey);



function extractPNGMetadata(imagePath, requestId) {
    const buffer = fs.readFileSync(imagePath);
    const png = new PNG(buffer);
    const creation = fs.statSync(filePath).birthtime;
    const width = png.width;
    const height = png.height;
    const color = png.depth;
    supabase.from('png_metadata')
        .update({ request_id: requestId, width: width, height: height, dpi: color, created_at: creation });
}
module.exports = { extractPNGMetadata };