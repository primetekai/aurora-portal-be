import xl from 'excel4node';

export const exportProductsToExcel = (products) => {
  const wb = new xl.Workbook();
  const ws = wb.addWorksheet('Sheet1');
  const headingColumnNames = getHeadingProduct(products);
  const data = convertProduct(headingColumnNames, products);

  let headingColumnIndex = 1;
  headingColumnNames.forEach((heading) => {
    if (typeof heading === 'string') {
      ws.cell(1, headingColumnIndex++).string(heading);
    } else if (typeof heading === 'number') {
      ws.cell(1, headingColumnIndex++).number(heading);
    }
  });

  let rowIndex = 2;
  data.forEach((record) => {
    let columnIndex = 1;
    Object.keys(record).forEach((columnName) => {
      if (typeof record[columnName] === 'string') {
        ws.cell(rowIndex, columnIndex++).string(record[columnName]);
      } else if (typeof record[columnName] === 'number') {
        ws.cell(rowIndex, columnIndex++).number(record[columnName]);
      } else {
        ws.cell(rowIndex, columnIndex++).string('');
      }
    });
    rowIndex++;
  });

  return wb.writeToBuffer();
};

export const getHeadingProduct = (products) => {
  const heading = [
    'no',
    'name',
    'category',
    'sku',
    'quantity',
    'price',
    'variation',
  ];
  let max = 0;

  products.forEach((product) => {
    max = product.children.length > max ? product.children.length : max;
  });

  for (let i = 0; i < max; i++) {
    heading.push(
      `variation_name_${i + 1}`,
      `variation_value_${i + 1}`,
      `variation_quantity_${i + 1}`,
    );
  }

  return heading;
};

export const convertProduct = (headers, products) => {
  const productsConverted = [];

  for (let i = 0; i < products.length; i++) {
    const product = {};
    headers.forEach((header) => {
      switch (header) {
        case 'no':
          product[header] = i + 1;
          break;
        case 'name':
          product[header] = products[i].name;
          break;
        case 'category':
          product[header] = products[i].category.key;
          break;
        case 'sku':
          product[header] = products[i].sku;
          break;
        case 'quantity':
          product[header] = parseInt(products[i].quantity);
          break;
        case 'price':
          product[header] = parseInt(products[i].price);
          break;
        case 'variation':
          product[header] = products[i].children.length > 0 ? 'TRUE' : 'FALSE';
          break;
        default:
          product[header] = undefined;
      }
    });

    if (products[i].children.length > 0) {
      let productQuantity = 0;
      products[i].children.forEach((variant, idx) => {
        product[`variation_name_${idx + 1}`] = null;
        product[`variation_value_${idx + 1}`] = variant.variationName;
        product[`variation_quantity_${idx + 1}`] = parseInt(variant.quantity);
        productQuantity += parseInt(variant.quantity);
      });
      product['quantity'] = productQuantity;
    }
    productsConverted.push(product);
  }

  return productsConverted;
};
