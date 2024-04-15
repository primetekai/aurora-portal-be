export const toZpl = async (data: {
  price: string;
  name: string;
  variationName: string;
  barcode: string;
  rfid: string;
}): Promise<string> => {
  return new Promise(function (resolve, reject) {
    try {
      const price = `^FO300,100^FD${data.price}^FS\n`;
      const name = `^FO300,130^FD${data.name}^FS\n`;
      const variationName = `^FO300,150^FD${data.variationName}^FS\n`;
      const barcode = `^FD${data.barcode}^FS\n`;
      const rfid = `^FD${data.rfid}\n`;
      const zplTemplate =
        '^XA\n' +
        '\n' +
        '^FX Product info is here\n' +
        '^CF0,30\n' +
        price +
        '^CFA,15\n' +
        name +
        variationName +
        '\n' +
        '^FX Barcode EAN-8 is here\n' +
        '^FO300,180^BY3\n' +
        '^B8N,60,Y,N\n' +
        barcode +
        '\n' +
        '^FX EPC hexadecimal is here\n' +
        '^RFW,H\n' +
        rfid +
        '^FS\n' +
        '\n' +
        '^XZ';
      resolve(zplTemplate);
    } catch (e) {
      reject(e);
    }
  });
};

export const printZpl = async (data): Promise<any> => {
  return new Promise(async function (resolve, reject) {
    try {
      await toZpl(data)
        .then(function (response) {
          resolve(response);
        })
        .catch(function (error) {
          reject(error);
        });
    } catch (e) {
      reject(e);
    }
  });
};
