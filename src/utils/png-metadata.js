const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const sharp = require('sharp');
const { PNG } = require('pngjs');
const sizeOf = require('image-size');
require('dotenv').config();

async function extractPNGMetadata(filePath, requestId) {
    try {
        const metadata = await sharp(filePath).metadata();
        const imageSize = sizeOf(filePath);
        const creation = fs.statSync(filePath).birthtime;

        let width, height, bitDepth, dpi;
        if (metadata.format === 'png') {
            const png = PNG.sync.read(fs.readFileSync(filePath));
            width = png.width;
            height = png.height;
            bitDepth = imageSize.depth || 0;
            dpi = metadata.density || 0;
        } else {
            width = metadata.width || 0;
            height = metadata.height || 0;
            bitDepth = 0;
            dpi = 0;
        }

        const { data: insertData, error } = await supabase.from('image_metadata').insert([
            {
                request_id: requestId,
                width: width,
                height: height,
                bit_depth: bitDepth,
                created_at: creation,
                dpi: dpi,
                format: metadata.format
            }
        ]);

        if (error) {
            console.error('Error inserting metadata:', error);
            return { success: false, error };
        }

        console.log('Metadata inserted successfully:', insertData);
        return { success: true, data: insertData };

    } catch (error) {
        console.error('Error extracting image metadata:', error);
        return { success: false, error };
    }
}

module.exports = { extractPNGMetadata };
