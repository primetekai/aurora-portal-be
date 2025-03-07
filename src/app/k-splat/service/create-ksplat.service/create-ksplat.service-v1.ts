import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as fs from 'fs';
import * as GaussianSplats3D from '@mkkellogg/gaussian-splats-3d';
import * as THREE from 'three';

@Injectable()
export class CreateKSplatService {
  async convertToKSplat(
    inputFile: string,
    outputFile: string,
    compressionLevel: number = 0,
    splatAlphaRemovalThreshold: number = 1,
    sceneCenter: string = '0,0,0',
    blockSize: number = 5.0,
    bucketSize: number = 256,
    sphericalHarmonicsLevel: number = 0,
  ): Promise<string> {
    if (!fs.existsSync(inputFile)) {
      throw new InternalServerErrorException(
        `❌ File does not exist: ${inputFile}`,
      );
    }

    // 🔍 Check file size before processing
    const fileStats = fs.statSync(inputFile);
    if (fileStats.size < 100) {
      throw new InternalServerErrorException(
        `❌ File is too small or invalid: ${inputFile}`,
      );
    }

    try {
      console.log(`🚀 Converting file: ${inputFile} ➝ ${outputFile}`);

      const fileData = fs.readFileSync(inputFile);
      const filePath = inputFile.toLowerCase().trim();
      const format = GaussianSplats3D.LoaderUtils.sceneFormatFromPath(filePath);

      if (!format) {
        throw new InternalServerErrorException(
          `❌ Unsupported file format: ${inputFile}`,
        );
      }

      const splatBuffer = this.fileBufferToSplatBuffer(
        fileData.buffer as ArrayBuffer,
        format,
        compressionLevel,
        splatAlphaRemovalThreshold,
        sceneCenter,
        blockSize,
        bucketSize,
        sphericalHarmonicsLevel,
      );

      fs.writeFileSync(outputFile, Buffer.from(splatBuffer.bufferData));

      console.log(`✅ Conversion successful: ${outputFile}`);
      return outputFile;
    } catch (error) {
      console.error(`❌ Conversion error: ${error.message}`);
      throw new InternalServerErrorException(
        `Error during file conversion: ${error.message}`,
      );
    }
  }

  private fileBufferToSplatBuffer(
    fileBufferData: ArrayBuffer,
    format: any,
    compressionLevel: number,
    alphaRemovalThreshold: number,
    sceneCenter: string,
    blockSize: number,
    bucketSize: number,
    sphericalHarmonicsLevel: number,
  ) {
    let splatBuffer;
    const parsedSceneCenter = new THREE.Vector3().fromArray(
      sceneCenter.split(',').map(parseFloat),
    );

    if (
      format === GaussianSplats3D.SceneFormat.Ply ||
      format === GaussianSplats3D.SceneFormat.Splat
    ) {
      let splatArray;

      if (format === GaussianSplats3D.SceneFormat.Ply) {
        splatArray = GaussianSplats3D.PlyParser.parseToUncompressedSplatArray(
          fileBufferData,
          sphericalHarmonicsLevel,
        );
      } else {
        splatArray =
          GaussianSplats3D.SplatParser.parseStandardSplatToUncompressedSplatArray(
            fileBufferData,
          );
      }

      if (!splatArray || splatArray.length === 0) {
        throw new InternalServerErrorException(
          `❌ No valid data found in the file`,
        );
      }

      const splatBufferGenerator =
        GaussianSplats3D.SplatBufferGenerator.getStandardGenerator(
          alphaRemovalThreshold,
          compressionLevel,
          0,
          parsedSceneCenter,
          blockSize,
          bucketSize,
        );

      splatBuffer =
        splatBufferGenerator.generateFromUncompressedSplatArray(splatArray);
    } else {
      throw new InternalServerErrorException(`❌ Invalid file format`);
    }

    return splatBuffer;
  }
}
