export const ommittedHTMLTags = [
  "b",
  "abbr",
  "big",
  "bdi",
  "em",
  "i",
  "ins",
  "kbd",
  "mark",
  "pre",
  "q",
  "s",
  "small",
  "strong",
  "sub",
  "sup",
  "time",
  "u"
].map(tag => tag.toUpperCase());

export const replacedWords = [{ input: "Dr.", output: "Doctor" }];

export const funnyWords = [
  "fucking",
  "crazy",
  "fucking",
  "crazy",
  "bloody",
  "stupid"
];
export const replacedWords_funny = ["the", "a", "how", "so"];
