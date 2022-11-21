import { replacedWords, replacedWords_funny, funnyWords } from "./constants";

export const replaceWord = text => {
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

export const replaceWord_funny = text => {
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
  return navigator.platform.indexOf("Mac") > -1;
};

export const isWindows = () => {
  return navigator.platform.indexOf("Win") > -1;
};

export const getBrowserType = () => {
  let agent = window.navigator.userAgent.toLowerCase();
  switch (true) {
    case agent.indexOf("edge") > -1:
      return "edge";
    case agent.indexOf("edg") > -1:
      return "chromium based edge (dev or canary)";
    case agent.indexOf("opr") > -1 && !!window.opr:
      return "opera";
    case agent.indexOf("chrome") > -1 && !!window.chrome:
      return "chrome";
    case agent.indexOf("trident") > -1:
      return "ie";
    case agent.indexOf("firefox") > -1:
      return "firefox";
    case agent.indexOf("safari") > -1:
      return "safari";
    default:
      return "other";
  }
};

export const defaultPlatformVoice =
  getBrowserType() === "chromium based edge (dev or canary)"
    ? {
        lang: "en-US",
        voice: "Microsoft David Desktop - English (United States)",
        // voice: "Microsoft Guy Online (Natural) - English (United States)",
        browser: "chromium edge"
      }
    : getBrowserType() === "chrome"
    ? {
        lang: "en-GB",
        voice: "Google UK English Female",
        browser: "chrome"
      }
    : {
        lang: "en-GB",
        voice: "Google UK English Female",
        browser: "other"
      };
