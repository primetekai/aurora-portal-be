import { extname } from 'path';
import { diskStorage } from 'multer';
import * as multer from 'multer';
import * as AWS from 'aws-sdk';
import * as multerS3 from 'multer-s3';
import { environment } from '@app/environment';
import { HttpException, HttpStatus } from '@nestjs/common';
import { existsSync, mkdirSync } from 'fs';
import fs from 'fs';
import path from 'path';

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

enum TypeServer {
  s3,
  server,
}
type TypeOfServerStrings = keyof typeof TypeServer;

export const fileInterceptor = (type: TypeOfServerStrings) => {
  const date = new Date();
  let upload;

  if (type === 's3') {
    // Save image to S3
    upload = multer({
      storage: multerS3({
        s3: new AWS.S3(),
        bucket: process.env.AWS_BUCKET,
        acl: 'public-read',
        key: function (request, file, cb) {
          cb(null, `${Date.now().toString()}-${file.originalname}`);
        },
      }),
    }).array('upload', 1);
  } else {
    // Save image in local server
    upload = {
      storage: diskStorage({
        destination: `${environment.images.path}/${genratePath()}/`,
        filename: editFileName,
      }),
      fileFilter: imageFileFilter,
      // Limit file size 3MB
      limits: {
        fileSize: eval(process.env.IMAGE_FILE_SIZE),
      },
    };
  }
  return upload;
};

export const imageFileFilter = (req, file, callback) => {
  file.originalname = file.originalname.toLowerCase();
  if (!file.originalname.match(/\.(jpg|JPG|webp)$/)) {
    return callback(new Error('Type of photos allow ".jpg, .webp"!'), false);
  }
  callback(null, true);
};

export const editFileName = (req, file, callback) => {
  let name = file.originalname.split('.')[0];
  name = name.replace(/ /g, '-');
  const fileExtName = extname(file.originalname);
  const randomName = Array(4)
    .fill(null)
    .map(() => Math.round(Math.random() * 16).toString(16))
    .join('');
  callback(null, `${name}-${randomName}${fileExtName}`);
};

export const genratePath = () => {
  const date = new Date();
  return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
};
export const getImageUrl = (images: any, isMultiple?: boolean): any => {
  const host = `/${process.env.IMAGE_API}`;
  let resData;

  if (isMultiple) {
    resData = [];
    for (let i = 0; i < images.length; i++) {
      if (typeof images[i] === 'string') {
        resData.push(images[i]);
      } else {
        images[i].path = `${host}/${encodeURIComponent(images[i].path)}`;
        resData.push(images[i]);
      }
    }
  } else {
    if (typeof images === 'string') {
      resData = images;
    } else {
      images.path = `${host}/${encodeURIComponent(images.path)}`;
      resData = images;
    }
  }

  return resData;
};

export const excelFileFilter = (req: any, file: any, cb: any) => {
  const fileExension = extname(file.originalname);
  if (fileExension === '.xlsx' || fileExension === '.xls') {
    // Allow storage of file
    cb(null, true);
  } else {
    // Reject file
    cb(
      new HttpException(
        `Unsupported file type ${extname(file.originalname)}`,
        HttpStatus.BAD_REQUEST,
      ),
      false,
    );
  }
};

export const excelMulterOptions = {
  // Check file extension
  fileFilter: excelFileFilter,
  // Storage properties
  storage: diskStorage({
    // Destination storage path details
    destination: (req: any, file: any, cb: any) => {
      const uploadPath = process.env.UPLOAD_FILE_PATH;
      // Create folder if doesn't exist
      if (!existsSync(uploadPath)) {
        mkdirSync(uploadPath);
      }
      cb(null, uploadPath);
    },
    // File modification details
    filename: editFileName,
  }),
  // Limit file size 5MB
  limits: {
    fileSize: eval(process.env.UPLOAD_FILE_SIZE),
  },
};

export const imageFilter = (file) => {
  file.originalname = file.originalname.toLowerCase();
  if (!file.originalname.match(/\.(jpg|JPG|webp|null)$/)) {
    return new Error('Only image files are allowed!'), false;
  }
  return;
};

export const editImageName = (file) => {
  let name = file.originalname.split('.')[0];
  name = name.replace(/ /g, '-');
  const fileExtName = extname(file.originalname);
  const randomName = Array(4)
    .fill(null)
    .map(() => Math.round(Math.random() * 16).toString(16))
    .join('');
  return `${name}-${randomName}${fileExtName}`;
};

export const saveImage = (file) => {
  try {
    imageFilter(file);
    file.originalname = editImageName(file);
    const imgPath = `./${environment.images.path}/${genratePath()}/${file.originalname}`;
    const imgToSavePath = path.join(__dirname.replace('dist', ''), imgPath);
    fs.writeFile(imgToSavePath, file.buffer, (err) => {
      if (err) {
        throw err;
      }
    });
    const image = {
      filename: file.originalname,
      path: imgPath.replace('./', ''),
    };

    return image;
  } catch (e) {
    throw e;
  }
};
