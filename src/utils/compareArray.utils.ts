export const findDifferentArray = (preVariations) => {
  return function (current) {
    return (
      preVariations.filter(function (newVariations) {
        return newVariations.barcode === current.barcode;
      }).length == 0
    );
  };
};

export const findMatchArray = (preVariations) => {
  return function (current) {
    return preVariations.some(function (newVariations) {
      return newVariations.barcode === current.barcode;
    });
  };
};
