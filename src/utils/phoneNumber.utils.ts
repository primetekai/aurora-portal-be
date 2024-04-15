export const validatePhoneNumber = (phoneNumber: string): boolean => {
  const reg = /(([0-9]{8,12})\b)/g;

  if (reg.test(phoneNumber) == false) {
    return false;
  }
  return true;
};

export const stripeZeroOut = (phoneNumber: string): string => {
  return phoneNumber.replace(/^0+/, '');
};
