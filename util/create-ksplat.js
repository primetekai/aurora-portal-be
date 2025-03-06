#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-var-requires */

const { execSync } = require('child_process');
const { existsSync } = require('fs');
const { resolve } = require('path');

if (process.argv.length < 3) {
  console.error('❌ Thiếu tham số! Sử dụng:');
  console.error(
    'node create-ksplat.js <input.ply/splat> <output.ksplat> [compression] [alpha] [center] [block] [bucket] [sh]',
  );
  process.exit(1);
}

const inputFile = resolve(process.argv[2]);
const outputFile = resolve(
  process.argv[3] || inputFile.replace(/\.(ply|splat)$/, '.ksplat'),
);
const compression = process.argv[4] || 1;
const alphaThreshold = process.argv[5] || 5;
const sceneCenter = process.argv[6] || '0,0,0';
const blockSize = process.argv[7] || 5.0;
const bucketSize = process.argv[8] || 256;
const shLevel = process.argv[9] || 0;

// 🔍 Kiểm tra file tồn tại
if (!existsSync(inputFile)) {
  console.error(`❌ File không tồn tại: ${inputFile}`);
  process.exit(1);
}

// 🚀 Chạy lệnh convert với `GaussianSplats3D`
const command = `npx @mkkellogg/gaussian-splats-3d convert "${inputFile}" "${outputFile}" ${compression} ${alphaThreshold} "${sceneCenter}" ${blockSize} ${bucketSize} ${shLevel}`;

console.log(`🚀 Đang chạy: ${command}`);
try {
  execSync(command, { stdio: 'inherit' });
  console.log(`✅ Chuyển đổi thành công: ${outputFile}`);
  process.exit(0);
} catch (error) {
  console.error(`❌ Lỗi khi convert: ${error.message}`);
  process.exit(1);
}
