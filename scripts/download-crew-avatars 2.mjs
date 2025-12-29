#!/usr/bin/env node

/**
 * Download crew member avatars from Memory Alpha
 * Run with: node scripts/download-crew-avatars.mjs
 */

import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const avatarDir = path.join(__dirname, '../public/crew-avatars');

// Memory Alpha image URLs for each crew member (scraped from actual pages)
const crewImages = {
  'captain_picard': {
    url: 'https://static.wikia.nocookie.net/memoryalpha/images/f/fc/Jean-Luc_Picard%2C_2364.jpg/revision/latest/scale-to-width-down/268?cb=20190707004441&path-prefix=en',
    filename: 'captain_picard.jpg'
  },
  'commander_riker': {
    url: 'https://static.wikia.nocookie.net/memoryalpha/images/c/c0/William_Riker%2C_2379.jpg/revision/latest?cb=20200213203951&path-prefix=en',
    filename: 'commander_riker.jpg'
  },
  'commander_data': {
    url: 'https://static.wikia.nocookie.net/memoryalpha/images/4/4f/Data%2C_2366.jpg/revision/latest/scale-to-width-down/268?cb=20130529102644&path-prefix=en',
    filename: 'commander_data.jpg'
  },
  'geordi_la_forge': {
    url: 'https://static.wikia.nocookie.net/memoryalpha/images/8/8a/Geordi_La_Forge%2C_2368.jpg/revision/latest/scale-to-width-down/268?cb=20120205164003&path-prefix=en',
    filename: 'geordi_la_forge.jpg'
  },
  'lieutenant_worf': {
    url: 'https://static.wikia.nocookie.net/memoryalpha/images/7/74/Worf%2C_2366.jpg/revision/latest/scale-to-width-down/268?cb=20180907023930&path-prefix=en',
    filename: 'lieutenant_worf.jpg'
  },
  'dr_crusher': {
    url: 'https://static.wikia.nocookie.net/memoryalpha/images/9/9e/Beverly_Crusher%2C_2364.jpg/revision/latest/scale-to-width-down/268?cb=20180906190246&path-prefix=en',
    filename: 'dr_crusher.jpg'
  },
  'counselor_troi': {
    url: 'https://static.wikia.nocookie.net/memoryalpha/images/7/7b/Deanna_Troi%2C_2379.jpg/revision/latest/scale-to-width-down/268?cb=20180906192757&path-prefix=en',
    filename: 'counselor_troi.jpg'
  },
  'chief_obrien': {
    url: 'https://static.wikia.nocookie.net/memoryalpha/images/d/de/Miles_O%27Brien%2C_2375.jpg/revision/latest/scale-to-width-down/268?cb=20170409165558&path-prefix=en',
    filename: 'chief_obrien.jpg'
  },
  'lieutenant_uhura': {
    url: 'https://static.wikia.nocookie.net/memoryalpha/images/4/49/Nyota_Uhura%2C_2266_%28operations%29.jpg/revision/latest/scale-to-width-down/268?cb=20110417164842&path-prefix=en',
    filename: 'lieutenant_uhura.jpg'
  },
  'quark': {
    url: 'https://static.wikia.nocookie.net/memoryalpha/images/2/28/Quark%2C_2375.jpg/revision/latest/scale-to-width-down/268?cb=20190827145039&path-prefix=en',
    filename: 'quark.jpg'
  }
};

// Ensure avatar directory exists
if (!fs.existsSync(avatarDir)) {
  fs.mkdirSync(avatarDir, { recursive: true });
}

function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    
    const request = https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      }
    }, (response) => {
      // Handle redirects
      if (response.statusCode === 301 || response.statusCode === 302) {
        const redirectUrl = response.headers.location;
        console.log(`  ↳ Redirecting to: ${redirectUrl}`);
        downloadImage(redirectUrl, filepath).then(resolve).catch(reject);
        return;
      }
      
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: ${response.statusCode}`));
        return;
      }
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        resolve();
      });
    });
    
    request.on('error', (err) => {
      fs.unlink(filepath, () => {}); // Delete the file on error
      reject(err);
    });
  });
}

async function downloadAllAvatars() {
  console.log('🖖 Downloading crew avatars from Memory Alpha...\n');
  
  for (const [crewId, info] of Object.entries(crewImages)) {
    const filepath = path.join(avatarDir, info.filename);
    console.log(`Downloading ${crewId}...`);
    
    try {
      await downloadImage(info.url, filepath);
      const stats = fs.statSync(filepath);
      console.log(`  ✅ Saved: ${info.filename} (${Math.round(stats.size / 1024)}KB)`);
    } catch (error) {
      console.log(`  ❌ Error: ${error.message}`);
    }
  }
  
  console.log('\n✅ Avatar download complete!');
  console.log(`📁 Avatars saved to: ${avatarDir}`);
}

downloadAllAvatars().catch(console.error);
