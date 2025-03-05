export const convertTextToNumber = (text) => {
  // Map các từ tiếng Việt sang số
  const vietnameseToNumberMap = {
    không: 0,
    một: 1,
    hai: 2,
    ba: 3,
    bốn: 4,
    năm: 5,
    sáu: 6,
    bảy: 7,
    tám: 8,
    chín: 9,
    mười: 10,
    mươi: 10,
    trăm: 100,
    nghìn: 1000,
    triệu: 1000000,
    tỷ: 1000000000,
  };

  let total = 0;
  let current = 0;

  text
    .toLowerCase()
    .split(/\s+/)
    .forEach((word) => {
      if (vietnameseToNumberMap[word] !== undefined) {
        const value = vietnameseToNumberMap[word];
        if (value >= 10) {
          current *= value;
        } else {
          current += value;
        }
      } else if (word === 'lẻ') {
        //
      } else {
        total += current;
        current = 0;
      }
    });

  total += current;
  return total;
};

// document.addEventListener('mousemove', (event) => {
//   console.log(`X: ${event.clientX}, Y: ${event.clientY}`);
// });
