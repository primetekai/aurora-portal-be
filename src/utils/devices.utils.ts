import { UAParser } from 'ua-parser-js';

interface IUserAgent {
  name: string;
  browserName?: string | null;
  browserVersion?: string | null;
  osName?: string | null;
  osVersion?: string | null;
  deviceVendor?: string | null;
  deviceModel?: string | null;
}

export interface ILocation {
  country: string;
  region: string;
  city: string;
}

export const formatUserAgent = (userAgent: string): IUserAgent => {
  const ua = new UAParser(userAgent).getResult();
  let name: string;

  if (!ua.browser.name) {
    name = userAgent;
  } else {
    if (ua.device.vendor) {
      name = ua.device.vendor;
    } else {
      name = ua.browser.name + ' on ' + ua.os.name;
    }
  }

  return {
    name: name,
    browserName: ua.browser.name ? ua.browser.name : null,
    browserVersion: ua.browser.version ? ua.browser.version : null,
    osName: ua.os.name ? ua.os.name : null,
    osVersion: ua.os.version ? ua.os.version : null,
    deviceVendor: ua.device.vendor ? ua.device.vendor : null,
    deviceModel: ua.device.model ? ua.device.model : null,
  };
};
