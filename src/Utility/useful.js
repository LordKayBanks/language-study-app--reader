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

export function chunkArrayInGroups(arr, size) {
  var myArray = [];
  for (var i = 0; i < arr.length; i += size) {
    myArray.push(arr.slice(i, i + size));
  }
  return myArray;
}

export function srsMode_1(dataArray, splitSize = 5) {
  //   const dataArray = Array(600).map((item, index) => index);
  //   //   const dataArray = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
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
  //   console.log('result: ', result);
}
export function srsMode_2(dataArray, splitSize = 3) {
  const result = chunkArrayInGroups(dataArray, splitSize)
    .map((entry) => {
      return [...entry, ...entry];
    })
    .flat();

  return result;
  //   console.log('result: ', result);
}
