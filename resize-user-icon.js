const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Create icons directory if it doesn't exist
const iconsDir = path.join(__dirname, 'icons');
if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
}

// User's image path
const userImagePath = path.join(__dirname, 'user-icon.png');

async function resizeUserImage() {
    try {
        // Check if file exists
        if (!fs.existsSync(userImagePath)) {
            console.error('User image not found at:', userImagePath);
            process.exit(1);
        }

        // Get original image info
        const metadata = await sharp(userImagePath).metadata();
        console.log('Original image:', metadata.width, 'x', metadata.height);

        // Generate 192x192 icon
        await sharp(userImagePath)
            .resize(192, 192, {
                fit: 'cover',
                position: 'center'
            })
            .png()
            .toFile(path.join(iconsDir, 'icon-192.png'));

        console.log('Created icon-192.png');

        // Generate 512x512 icon
        await sharp(userImagePath)
            .resize(512, 512, {
                fit: 'cover',
                position: 'center'
            })
            .png()
            .toFile(path.join(iconsDir, 'icon-512.png'));

        console.log('Created icon-512.png');

        console.log('Icons generated successfully from your image!');
    } catch (error) {
        console.error('Error generating icons:', error);
        process.exit(1);
    }
}

resizeUserImage();
