const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const sharp = require('sharp');
const { PNG } = require('pngjs');
const sizeOf = require('image-size');

const supabaseUrl = 'https://hsnaumiotmaozcqyeggc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhzbmF1bWlvdG1hb3pjcXllZ2djIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcxNzU3OTc4MywiZXhwIjoyMDMzMTU1NzgzfQ.jrh-z6xSiVELtJKGZH2WhEoAhPpzYvBhmnmfcNllSNY';
const supabase = createClient(supabaseUrl, supabaseKey);

async function extractPNGMetadata(filePath, requestId) {
    try {
        const metadata = await sharp(filePath).metadata();
        const imageSize = sizeOf(filePath);
        const data = fs.readFileSync(filePath);
        const png = PNG.sync.read(data);
        const creation = fs.statSync(filePath).birthtime;
        const width = png.width;
        const height = png.height;
        const bitDepth = imageSize.depth ? imageSize.depth : 0; 
        const dpi = metadata.density ? metadata.density : 0; 

        const { data: insertData, error } = await supabase.from('png_metadata').insert([
            {
                request_id: requestId,
                width: width,
                height: height,
                bit_depth: bitDepth,
                created_at: creation,
                dpi: dpi
            }
        ]);

        if (error) {
            console.error('Error inserting metadata:', error);
            return { success: false, error };
        }

        console.log('Metadata inserted successfully:', insertData);
        return { success: true, data: insertData };

    } catch (error) {
        console.error('Error extracting PNG metadata:', error);
        return { success: false, error };
    }
}

module.exports = { extractPNGMetadata };
