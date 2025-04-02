export interface ICaptureGoogleEarth {
  videoPath: string;
  videoZoomPath: string;
}

export interface IVideoMetadata {
  videoPath: string;
  size: {
    bytes: number;
    megabytes: number;
  };
}
