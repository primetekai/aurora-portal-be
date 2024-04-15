import { Request } from 'express';

export const getIpFromRequest = (request: Request): string => {
  let ip = (request.headers['x-forwarded-for'] as string) || request?.ip;
  ip = ip.split(',')[0];
  ip = ip.split(':').slice(-1)[0];
  return ip;
};
