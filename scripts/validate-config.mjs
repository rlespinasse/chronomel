#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

const configPath = 'src/config.ts';
const publicDataDir = 'public/data';
const errors = [];
const warnings = [];

console.log('🔍 Validating ChronoMEL configuration...\n');

// Check if config file exists
if (!fs.existsSync(configPath)) {
  errors.push(`Config file not found: ${configPath}`);
  printResults();
  process.exit(1);
}

// Read config file
const configContent = fs.readFileSync(configPath, 'utf-8');

// Parse layer groups and context layers
const layerGroupsMatch = configContent.match(/layerGroups:\s*\[([\s\S]*?)\]/);
const contextLayersMatch = configContent.match(/contextLayers:\s*\[([\s\S]*?)\]/);

if (!layerGroupsMatch && !contextLayersMatch) {
  warnings.push('No layerGroups or contextLayers found in config');
} else {
  // Extract layer IDs from config
  const layerIdRegex = /id:\s*['"]([^'"]+)['"]/g;
  const allLayers = new Set();
  let match;

  while ((match = layerIdRegex.exec(configContent)) !== null) {
    allLayers.add(match[1]);
  }

  console.log(`Found ${allLayers.size} layers in config\n`);

  // Check each layer's GeoJSON file
  allLayers.forEach((layerId) => {
    const fileMatch = configContent.match(
      new RegExp(`id:\\s*['"]${layerId}['"].*?file:\\s*['"]([^'"]+)['"]`)
    );

    if (fileMatch) {
      const filePath = path.join(publicDataDir, fileMatch[1].replace('data/', ''));

      if (!fs.existsSync(filePath)) {
        errors.push(`Layer "${layerId}": GeoJSON file not found: ${filePath}`);
      } else {
        const stats = fs.statSync(filePath);
        const sizeKb = (stats.size / 1024).toFixed(1);
        console.log(`  ✓ ${layerId}: ${filePath} (${sizeKb} KB)`);

        // Try to validate GeoJSON syntax
        try {
          const geojsonContent = fs.readFileSync(filePath, 'utf-8');
          JSON.parse(geojsonContent);
        } catch (e) {
          errors.push(`Layer "${layerId}": Invalid GeoJSON in ${filePath} - ${e.message}`);
        }
      }
    }
  });
}

// Check config references geometry types
if (configContent.includes('geometryTypes:')) {
  console.log('\n✓ Geometry types declared');
} else {
  warnings.push('No geometryTypes declared (should be present for proper z-ordering)');
}

// Check required sections
const requiredSections = ['styles', 'tooltips', 'detailBuilders'];
requiredSections.forEach((section) => {
  if (configContent.includes(`${section}:`)) {
    console.log(`✓ ${section} section found`);
  } else {
    warnings.push(`Missing ${section} section`);
  }
});

// Print results
printResults();

function printResults() {
  console.log('\n' + '='.repeat(50));

  if (errors.length === 0 && warnings.length === 0) {
    console.log('✅ Configuration is valid!\n');
    process.exit(0);
  }

  if (warnings.length > 0) {
    console.log(`⚠️  ${warnings.length} warning(s):\n`);
    warnings.forEach((w) => console.log(`  • ${w}`));
    console.log();
  }

  if (errors.length > 0) {
    console.log(`❌ ${errors.length} error(s):\n`);
    errors.forEach((e) => console.log(`  • ${e}`));
    console.log();
    process.exit(1);
  } else {
    process.exit(0);
  }
}
