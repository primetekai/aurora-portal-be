import * as fs from 'fs';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

export const checkAndRemoveFileNameExist = (
  storagePath: string,
  fileNameRoot?: string,
  fileName?: string,
): string => {
  let uniqueFileName = '';

  if (fileName) {
    const existingFilePath = join(storagePath, fileName);
    if (fs.existsSync(existingFilePath)) {
      fs.unlinkSync(existingFilePath);
      uniqueFileName = fileName;
    } else {
      uniqueFileName = fileName;
    }
  } else {
    uniqueFileName = `${uuidv4()}-${fileNameRoot}`;
  }
  return uniqueFileName;
};
