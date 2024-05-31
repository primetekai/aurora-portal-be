import * as crypto from 'crypto';

export const generatePassword = (
  length = 20,
  characters = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz~!@-#$',
) =>
  Array.from(crypto.randomFillSync(new Uint32Array(length)))
    .map((x) => characters[x % characters.length])
    .join('');
