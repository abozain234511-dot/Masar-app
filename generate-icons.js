const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Create icons directory if it doesn't exist
const iconsDir = path.join(__dirname, 'icons');
if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
}

// SVG content for the icon (purple background with dumbbell emoji)
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
    <rect fill="#8b5cf6" width="512" height="512" rx="100"/>
    <text x="256" y="340" font-size="280" text-anchor="middle" fill="white">🏋️</text>
</svg>`;

// Generate PNG icons
async function generateIcons() {
    try {
        // Generate 192x192 icon
        await sharp(Buffer.from(svgContent))
            .resize(192, 192)
            .png()
            .toFile(path.join(iconsDir, 'icon-192.png'));

        console.log('Created icon-192.png');

        // Generate 512x512 icon
        await sharp(Buffer.from(svgContent))
            .resize(512, 512)
            .png()
            .toFile(path.join(iconsDir, 'icon-512.png'));

        console.log('Created icon-512.png');

        console.log('Icons generated successfully!');
    } catch (error) {
        console.error('Error generating icons:', error);
        process.exit(1);
    }
}

generateIcons();
