#!/usr/bin/env node

/**
 * Icon Generation Script for Untitled88
 * 
 * This script generates all required favicon and icon sizes from the source logo
 * 
 * Usage:
 * 1. Install sharp: npm install sharp
 * 2. Run: node scripts/generate-icons.js
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const INPUT_LOGO = path.join(__dirname, '../public/logo-untitled88.png');
const OUTPUT_DIR = path.join(__dirname, '../public');

// Icon configurations
const ICON_CONFIGS = [
  // Favicon sizes
  { name: 'favicon-16.png', size: 16 },
  { name: 'favicon-32.png', size: 32 },
  
  // Apple Touch Icon
  { name: 'apple-touch-icon.png', size: 180 },
  
  // PWA Icons
  { name: 'icon-192.png', size: 192 },
  { name: 'icon-512.png', size: 512 },
  
  // Logo variations
  { name: 'logo.png', size: 200, width: 200, height: 60 }, // Maintain aspect ratio
  { name: 'logo-small.png', size: 100, width: 100, height: 30 },
  
  // Social sharing image (will be created separately)
];

async function generateIcons() {
  try {
    console.log('🎨 Starting icon generation from logo-untitled88.png...');
    
    // Check if input file exists
    if (!fs.existsSync(INPUT_LOGO)) {
      throw new Error(`Input logo not found: ${INPUT_LOGO}`);
    }
    
    // Get original image metadata
    const metadata = await sharp(INPUT_LOGO).metadata();
    console.log(`📏 Original image: ${metadata.width}x${metadata.height}`);
    
    // Generate each icon size
    for (const config of ICON_CONFIGS) {
      const outputPath = path.join(OUTPUT_DIR, config.name);
      
      let sharpInstance = sharp(INPUT_LOGO);
      
      if (config.width && config.height) {
        // Resize with specific dimensions (for logos)
        sharpInstance = sharpInstance.resize(config.width, config.height, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 } // Transparent background
        });
      } else {
        // Square resize (for icons)
        sharpInstance = sharpInstance.resize(config.size, config.size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 } // Transparent background
        });
      }
      
      await sharpInstance.png().toFile(outputPath);
      console.log(`✅ Generated: ${config.name} (${config.size || `${config.width}x${config.height}`})`);
    }
    
    // Generate ICO file (combining 16x16 and 32x32)
    console.log('🔄 Generating favicon.ico...');
    await generateFaviconIco();
    
    // Generate social sharing image
    console.log('🔄 Generating social sharing image...');
    await generateSocialImage();
    
    console.log('🎉 All icons generated successfully!');
    console.log('\n📋 Generated files:');
    ICON_CONFIGS.forEach(config => {
      console.log(`   - ${config.name}`);
    });
    console.log('   - favicon.ico');
    console.log('   - og-image.png');
    
  } catch (error) {
    console.error('❌ Error generating icons:', error.message);
    process.exit(1);
  }
}

async function generateFaviconIco() {
  // For ICO generation, we'll create a 32x32 PNG and rename it
  // (True ICO generation requires additional libraries)
  const faviconPath = path.join(OUTPUT_DIR, 'favicon.ico');
  const favicon32Path = path.join(OUTPUT_DIR, 'favicon-32.png');
  
  // Copy the 32x32 PNG as ICO (browsers will accept PNG with .ico extension)
  if (fs.existsSync(favicon32Path)) {
    fs.copyFileSync(favicon32Path, faviconPath);
    console.log('✅ Generated: favicon.ico');
  }
}

async function generateSocialImage() {
  const socialImagePath = path.join(OUTPUT_DIR, 'og-image.png');
  
  // Create a 1200x630 social sharing image with logo centered
  await sharp({
    create: {
      width: 1200,
      height: 630,
      channels: 4,
      background: { r: 59, g: 130, b: 246, alpha: 1 } // Blue background (#3b82f6)
    }
  })
  .composite([
    {
      input: await sharp(INPUT_LOGO)
        .resize(400, 120, { 
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 }
        })
        .png()
        .toBuffer(),
      gravity: 'center'
    }
  ])
  .png()
  .toFile(socialImagePath);
  
  console.log('✅ Generated: og-image.png (1200x630)');
}

// Run the script
if (require.main === module) {
  generateIcons();
}

module.exports = { generateIcons };
