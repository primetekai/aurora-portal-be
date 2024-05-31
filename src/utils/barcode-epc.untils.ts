import epc from 'node-epc';

const Filter = 3;

export const toSgtin96TagUri = async (
  CompanyPrefix,
  ItemReference,
  SerialNumber,
): Promise<string> => {
  return new Promise(function (resolve, reject) {
    try {
      if (CompanyPrefix.length + ItemReference.length === 13) {
        const sgtin96TagUri = `urn:epc:tag:sgtin-96:${Filter}.${CompanyPrefix}.${ItemReference}.${SerialNumber}`;
        resolve(sgtin96TagUri);
      } else {
        throw new Error(
          'CompanyPrefix.length +ItemReference.length must be 13',
        );
      }
    } catch (e) {
      reject(e);
    }
  });
};

/**
 * Convert SGTIN-96 EPC Tag URI to EPC in Hexdecimal
 * @example urn:epc:tag:sgtin-96:3.0614141.812345.6789
 * @param {string} epcTagUri - SGTIN-96 EPC in tag URI format
 * @return {string} EPC in Hexdecimal format
 * @example 3074257BF7194E4000001A85
 */
export const sgtin96TagUriToHex = async (epcTagUri): Promise<string> => {
  return new Promise(function (resolve, reject) {
    try {
      const headerValue = '48';
      const fiterValue = epcTagUri.split(':')[4].split('.')[0];
      const companyPrefix = epcTagUri.split(':')[4].split('.')[1];
      const reference = epcTagUri.split(':')[4].split('.')[2];
      const serial = epcTagUri.split(':')[4].split('.')[3];
      const companyPrefixLen = companyPrefix.length;
      // key company is length, value is partion
      const partionValueMap = {
        12: 0,
        11: 1,
        10: 2,
        9: 3,
        8: 4,
        7: 5,
        6: 6,
      };

      // key company is length, value is company Bit length
      const companyBitMap = {
        12: 40,
        11: 37,
        10: 34,
        9: 30,
        8: 27,
        7: 24,
        6: 20,
      };

      // key company is length, value is serial Bit length
      const referenceBitMap = {
        12: 4,
        11: 7,
        10: 10,
        9: 14,
        8: 17,
        7: 20,
        6: 24,
      };

      const partion = partionValueMap[companyPrefixLen];

      const epcHeader = 96;
      const epcHeaderBin = parseInt(headerValue, 10)
        .toString(2)
        .padStart(8, '0');
      const filterBin = parseInt(fiterValue, 10).toString(2).padStart(3, '0');
      const partionBin = parseInt(partion, 10).toString(2).padStart(3, '0');
      const companyPrefixBin = parseInt(companyPrefix, 10)
        .toString(2)
        .padStart(companyBitMap[companyPrefixLen], '0');
      const referenceBin = parseInt(reference, 10)
        .toString(2)
        .padStart(referenceBitMap[companyPrefixLen], '0');
      const serialBinLength =
        epcHeader -
        epcHeaderBin.length -
        filterBin.length -
        partionBin.length -
        companyPrefixBin.length -
        referenceBin.length;
      const serialBin = parseInt(serial, 10)
        .toString(2)
        .padStart(serialBinLength, '0');

      const epcBinary = `${epcHeaderBin}${filterBin}${partionBin}${companyPrefixBin}${referenceBin}${serialBin}`;
      console.warn({
        headerValue,
        epcHeaderBin,
        epcHeaderBinLength: epcHeaderBin.length,
        fiterValue,
        filterBin,
        filterBinLength: filterBin.length,
        partion,
        partionBin,
        companyPrefix,
        companyPrefixBin,
        companyPrefixBinLength: companyPrefixBin.length,
        reference,
        referenceBin,
        referenceBinLength: referenceBin.length,
        serial,
        serialBin,
        serialBinLength: serialBin.length,
        epcBinary,
      });
      // because of limitation of length, EPCBin is divided into two half
      const middlelength = Math.ceil(epcBinary.length / 2);
      const firstHalfBin = epcBinary.slice(0, middlelength);
      const secondHalfBin = epcBinary.slice(middlelength);
      const hexa1 = parseInt(firstHalfBin, 2).toString(16).toUpperCase();
      const hexa2 = parseInt(secondHalfBin, 2).toString(16).toUpperCase();

      const epcHex = `${hexa1}${hexa2}`;
      resolve(epcHex);
    } catch (e) {
      reject(e);
    }
  });
};

/**
 * Convert EPC in Hexdecimal to SGTIN-96 EPC Tag URI
 * @param {string} epcHexadecimal - EPC in Hexdecimal format
 * @example 3074257BF7194E4000001A85
 * @return {string} epcTagUri - SGTIN-96 EPC in tag URI format
 * @example urn:epc:tag:sgtin-96:3.0614141.812345.6789
 */
export const hexToSgtin96TagUri = async (epcHexadecimal): Promise<string> => {
  return new Promise(function (resolve, reject) {
    try {
      epc.getParser('SGTIN').then(function (sgtin) {
        sgtin
          .parse(epcHexadecimal)
          .then(function (parsed) {
            const { Filter, CompanyPrefix, ItemReference, SerialNumber } =
              parsed.parts;

            const sgtin96TagUri = `urn:epc:tag:sgtin-96:${Filter}.${CompanyPrefix}.${ItemReference}.${SerialNumber}`;
            resolve(sgtin96TagUri);
          })
          .fail(function (err) {
            reject(err);
          });
      });
    } catch (e) {
      reject(e);
    }
  });
};
