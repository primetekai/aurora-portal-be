import * as faker from 'faker';
import * as moment from 'moment';

export const generateVerifyCode = (): number => {
  return faker.random.number({ min: 1000, max: 9999, precision: 4 });
};

// Check expired time
export const checkExpiredTime = (expiredAt: Date): boolean => {
  if (moment(expiredAt).isBefore(moment())) {
    return true;
  }
  return false;
};
