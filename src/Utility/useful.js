import { replacedWords, replacedWords_funny, funnyWords } from './constants';

export const replaceWord = (text) => {
  let pronounciation = text;
  for (let i = 0; i < replacedWords.length; i++) {
    let replacedWord = replacedWords[i];
    if (text.trim().toLowerCase() === replacedWord.input.toLowerCase()) {
      pronounciation = replacedWord.output;
      break;
    }
  }
  return pronounciation;
};

export const replaceWord_funny = (text) => {
  const chance = Math.floor(Math.random() * 10) + 1;
  const funnyWordChance = Math.floor(Math.random() * funnyWords.length);
  let pronounciation = text;
  if (chance >= 8) {
    if (replacedWords_funny.includes(text.trim().toLowerCase())) {
      pronounciation = `${text}-${funnyWords[funnyWordChance]}`;
    }
  }
  return pronounciation;
};

export const isMacintosh = () => {
  return navigator.platform.indexOf('Mac') > -1;
};

export const isWindows = () => {
  return navigator.platform.indexOf('Win') > -1;
};

export const getBrowserType = () => {
  let agent = window.navigator.userAgent.toLowerCase();
  switch (true) {
    case agent.indexOf('edge') > -1:
      return 'edge';
    case agent.indexOf('edg') > -1:
      return 'chromium based edge (dev or canary)';
    case agent.indexOf('opr') > -1 && !!window.opr:
      return 'opera';
    case agent.indexOf('chrome') > -1 && !!window.chrome:
      return 'chrome';
    case agent.indexOf('trident') > -1:
      return 'ie';
    case agent.indexOf('firefox') > -1:
      return 'firefox';
    case agent.indexOf('safari') > -1:
      return 'safari';
    default:
      return 'other';
  }
};

export const defaultPlatformVoice =
  getBrowserType() === 'chromium based edge (dev or canary)'
    ? {
        lang: 'en-US',
        voice: 'Microsoft David Desktop - English (United States)',
        // voice: "Microsoft Guy Online (Natural) - English (United States)",
        browser: 'chromium edge',
      }
    : getBrowserType() === 'chrome'
    ? {
        lang: 'en-GB',
        voice: 'Google UK English Female',
        browser: 'chrome',
      }
    : {
        lang: 'en-GB',
        voice: 'Google UK English Female',
        browser: 'other',
      };

export const removeItemFromArray = (array, item) => {
  var i = array.length;

  while (i--) {
    if (array[i] === item) {
      array.splice(i, 1);
    }
  }
};
function shuffleArray(array) {
  let currentIndex = array.length,
    randomIndex;

  // While there remain elements to shuffle.
  while (currentIndex != 0) {
    // Pick a remaining element.
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
  }

  return array;
}

export function chunkArrayInGroups(arr, size) {
  var myArray = [];
  for (var i = 0; i < arr.length; i += size) {
    myArray.push(arr.slice(i, i + size));
  }
  return myArray;
}

export function srsMode_1(dataArray_, splitSize = 3) {
  // 012==012==345==345==678==678
  let dataArray = dataArray_.map((item, index) => index);
  const result = chunkArrayInGroups(dataArray, splitSize)
    .map((entry, index) => {
      //   return [...entry, result[Math.min(index + 2, result.length - 1)], ...entry];
      return [...entry, ...entry];
    })
    .flat();

  return result;
}

export function srsMode_2(dataArray_, splitSize = 3) {
  let dataArray = dataArray_.map((item, index) => index);
  dataArray = chunkArrayInGroups(dataArray, splitSize);

  const result = [[]];
  for (let i = 0; i < dataArray.length; i++) {
    let tempArray = result.flat().slice(-10);
    tempArray = shuffleArray(tempArray).filter((entry) => entry.length !== splitSize);
    tempArray = chunkArrayInGroups(tempArray, splitSize);
    let randomPair = tempArray[Math.floor(Math.random() * tempArray.length)] ?? dataArray[i + 1];
    result.push(dataArray[i], randomPair);
  }
  return result.flat();
}
export function srsMode_3(dataArray_, splitSize = 3) {
  let dataArray = dataArray_.map((item, index) => index);
  dataArray = chunkArrayInGroups(dataArray, splitSize);

  const result = [[]];
  for (let i = 0; i < dataArray.length; i++) {
    let tempArray = result.flat();
    tempArray = shuffleArray(tempArray).filter((entry) => entry.length !== splitSize);
    tempArray = chunkArrayInGroups(tempArray, splitSize);
    let randomPair = tempArray[Math.floor(Math.random() * tempArray.length)] ?? dataArray[i + 1];
    result.push(dataArray[i], randomPair);
  }
  return result.flat();
}
// export function srsMode_3(dataArray_) {
//   // 0, 1, 0==1,2,1==2,3,2==3,4,3
//   return dataArray_
//     .map((entry, index) => {
//       return [Math.max(index - 1, 0), index, Math.max(index - 1, 0)];
//     })
//     .slice(1) // remove first array, it is a repeated [0,0,0]
//     .flat();
// }

function srsMode_test(dataArray_, splitSize = 5) {
  //   ==============================
  dataArray_ = Array(50).fill();
  //   ==============================
  // 2,3,4
  //   const dataArray_ = Array(600).fill().map((item, index) => index);
  //   dataArray_ = ['a', ' b', ' c', ' d', ' c', ' e', ' f', ' g', ' h', ' i'];
  let dataArray = dataArray_.map((item, index) => index);
  const result = [];
  let tempResult = [];

  let counter = 0;
  while (counter <= dataArray.length) {
    if (tempResult.length === splitSize) {
      result.push(...tempResult);
      tempResult = [];
      counter = counter - (splitSize - 1);
      continue;
    }
    tempResult.push(dataArray[counter]);
    counter++;
  }
  return result;
}
