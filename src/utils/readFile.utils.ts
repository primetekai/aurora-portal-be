import excelToJson from 'convert-excel-to-json';

export const readFileExcell = (path) => {
  const data = excelToJson({
    sourceFile: path,
    columnToKey: {
      '*': '{{columnHeader}}',
    },
  }).Sheet1;
  data.shift();

  let createProduct = [];
  for (let i = 0; i < data.length; i++) {
    if (data[i].variation ? data[i].variation === 'TRUE' : false) {
      data[i].variations = [];
      const keys = Object.keys(data[i]);
      const type = 'variation_name_';
      const value = 'variation_value_';
      const quantity = 'variation_quantity_';
      let count = 1;
      let checkConvertVariant = true;
      while (checkConvertVariant) {
        const obj = keys.filter((el) => {
          return (
            el === type + count ||
            el === value + count ||
            el === quantity + count
          );
        });

        if (obj.length == 0) {
          createProduct = data;
          checkConvertVariant = false;
        }

        const element = {};
        for (const k in obj) {
          element[changeNameOfKey(obj[k])] = data[i][obj[k]];
          delete data[i][obj[k]];
        }

        data[i].variations[count - 1] = element;
        count += 1;
      }
    }
  }

  createProduct.forEach((item) => {
    if (item.variations) {
      const options = createProductOptions(item.variations);
      item.option = JSON.stringify(options);
      item.variations = createVariationOptions(item.variations, options);
    }
  });
  return createProduct;
};

export const changeNameOfKey = (rawKey) => {
  let key;
  if (rawKey.includes('name')) {
    key = 'name';
  } else if (rawKey.includes('value')) {
    key = 'variationName';
  } else key = 'quantity';
  return key;
};

export const createProductOptions = (variations) => {
  const productOptions = [];
  const variationName = variations[0].name.split(',');

  for (let i = 0; i < variationName.length; i++) {
    const tmp = [];
    const options = {
      id: generateNextOptionId(),
      name: variationName[i],
      value: [],
    };
    for (let j = 0; j < variations.length; j++) {
      if (variations[j].variationName) {
        const value = variations[j].variationName.split(',');

        if (!tmp.includes(value[i])) {
          options.value.push({
            id: generateNextOptionId(),
            value: value[i],
          });
          tmp.push(value[i]);
        }
      }
    }
    productOptions.push(options);
  }

  return productOptions;
};

export const createVariationOptions = (variations, options) => {
  for (let i = 0; i < variations.length; i++) {
    if (variations[i].name || variations[i].variationName) {
      variations[i].option = [];
      const names = variations[i].name.split(',');
      const value = variations[i].variationName.split(',');

      names.forEach((name, idx) => {
        let optionOfNames;
        optionOfNames = options.filter((option) => name === option.name);
        optionOfNames[0].value.forEach((optionOfName) => {
          if (value[idx] === optionOfName.value) {
            variations[i].option.push(optionOfName.id);
          }
        });
      });
    } else {
      variations.splice(i, 1);
    }
  }

  return variations;
};

export function generateNextOptionId(): string {
  return Math.random().toString(36).substring(2, 15);
}
