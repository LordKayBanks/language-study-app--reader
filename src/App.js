import React, { Component } from 'react';
import Select from 'react-select';
import Speech from 'speak-tts';
import FileReaderInput from 'react-file-reader-input';
import { v4 as uuid } from 'uuid';

import SpeedSlider from './modules/Components/SpeedSlider';
import logoImage from './Icons/Logo.png';
import {
  Pause as pauseIcon,
  Play as playIcon,
  Upload as UploadIcon,
  Back as BackIcon,
  Forward as ForwardIcon,
  FavoriteAdd as FavoriteAddIcon,
  FavoriteRemove as FavoriteRemoveIcon,
} from './Icons';
import {
  chunkArrayInGroups,
  defaultPlatformVoice,
  srsMode_1,
  srsMode_2,
  srsMode_3,
  removeItemFromArray,
} from './Utility/useful';
import {
  sentenceVoice as defaultSentenceVoice,
  translationVoice as defaultTranslationVoice,
  translationVoice2 as defaultTranslationVoice2,
  sortedData as defaultSortedData,
} from './constants';
import { mockData } from './data/french.data';
import './App.scss';

// https://www.npmjs.com/package/react-tagsinput#addkeys
import { ModalComponent } from './components/modal.component';
import TagsInput from 'react-tagsinput';
import 'react-tagsinput/react-tagsinput.css';

const storage = global.localStorage || null;
class App extends Component {
  itemsPerPage = 30;
  allSentences = [];
  currentGroup = null;
  sentence = null;
  translation = null;
  previousTranslation = null;
  srsMode = { default: 'default', mode1: 'mode1', mode2: 'mode2', mode3: 'mode3' };

  readingSequenceTypes = {
    READ_PRIMARY_SENTENCE: 'READ_PRIMARY_SENTENCE',
    READ_TRANSLATION_FULL_SENTENCE_1: 'READ_TRANSLATION_FULL_SENTENCE_1',
    PRONOUNCE_EACH_WORD_IN_TRANSLATION: 'PRONOUNCE_EACH_WORD_IN_TRANSLATION',
    END_SEQUENCE: 'END_SEQUENCE',
  };

  // default setting
  defaultReadingSequence = [
    this.readingSequenceTypes.PRONOUNCE_EACH_WORD_IN_TRANSLATION,
    this.readingSequenceTypes.READ_TRANSLATION_FULL_SENTENCE_1,
    this.readingSequenceTypes.READ_PRIMARY_SENTENCE,
    this.readingSequenceTypes.READ_TRANSLATION_FULL_SENTENCE_1,
    this.readingSequenceTypes.READ_TRANSLATION_FULL_SENTENCE_1,
    // // //
    this.readingSequenceTypes.END_SEQUENCE,
  ];

  constructor(props) {
    super(props);

    const storedState = JSON.parse(storage?.getItem('state'));
    let sentenceSpeed = storedState?.sentenceSpeed ?? 1.2;
    let sentenceVoice = storedState?.sentenceVoice ?? defaultSentenceVoice;
    let translationSpeed = storedState?.translationSpeed ?? 1.2;
    let translationVoice = storedState?.translationVoice ?? defaultTranslationVoice;
    let translationVoice2 = storedState?.translationVoice2 ?? defaultTranslationVoice2;

    let data = storedState?.data ?? mockData;
    let sortedData = storedState?.sortedData ?? defaultSortedData;
    let currentPage = storedState?.currentPage ?? 0;
    let srsMode = storedState?.srsMode ?? this.srsMode.default;
    let readingSequence = storedState?.readingSequence ?? this.defaultReadingSequence;

    this.state = {
      data: data,
      sortedData: sortedData,
      voiceList: [],
      sentenceSpeed: sentenceSpeed,
      sentenceVoice: sentenceVoice,
      translationSpeed: translationSpeed,
      translationVoice: translationVoice,
      translationVoice2: translationVoice2,
      shouldSpeak: true,
      isPlaying: false,
      currentPosition_defaultMode: 0,
      currentPosition_shuffleModes: 0,
      currentPage: currentPage,
      scroll: true,
      srsMode: srsMode,
      positionInReadingSequence: 0,
      wordPositionInTranslation: 0,
      shouldAutomaticallyPlayNextPage: true,
      readingSequence: readingSequence,
    };
    this.speech = new Speech(); // will throw an exception if not browser supported
    if (this.speech.hasBrowserSupport()) {
      // returns a boolean
      console.log('speech synthesis supported');
    }
  }

  componentDidMount() {
    this.updateReferenceToDOMSentenceElements();

    const defaultSpeed = 1.0;
    this.utterance = this.speech.init({
      lang: this.state.sentenceVoice.lang || defaultPlatformVoice.lang,
      voice: this.state.sentenceVoice.voice || defaultPlatformVoice.voice,
      rate: this.state.sentenceSpeed || defaultSpeed,
      volume: 1,
      pitch: 1,
      splitSentences: false,
      listeners: {
        onvoiceschanged: (voices) => {
          let availableVoices = null;
          let preferredVoices = null;
          let otherVoices = null;
          let sortedVoices = null;
          if (voices.length) {
            availableVoices = voices.map(({ lang, name }) => {
              return {
                lang: lang,
                voice: name,
                label: `${lang} - ${name}`,
              };
            });
            preferredVoices = availableVoices
              .filter(({ lang }) => {
                if (lang.includes('en') || lang.includes('de')) return true;
                else return false;
              })
              .sort(({ lang: langA }, { lang: langB }) => {
                return langA.localeCompare(langB);
              });
            otherVoices = availableVoices
              .filter(({ lang }) => {
                if (lang.includes('en') || lang.includes('de')) return false;
                else return true;
              })
              .sort(({ lang: langA }, { lang: langB }) => {
                return langA.localeCompare(langB);
              });

            sortedVoices = [...preferredVoices, ...otherVoices];
          }

          this.setState({ voiceList: sortedVoices }, () => this.persistState());
        },
      },
    });
  }
  componentWillUnmount() {
    // document.removeEventListener('scroll', this.handleScroll, false);
  }

  persistState = () => {
    const state = JSON.stringify(this.state);
    storage && storage.setItem(`state`, state);
  };

  updateReferenceToDOMSentenceElements = () =>
    (this.allSentences = [...document.querySelectorAll('[class^="orator-"]')]);

  cleanUpHighlights(context) {
    context.sentence.classList.remove('highlightStyle');
    context.currentGroup.classList.remove('activeGroupHighlightStyle');
    context.translation.classList.remove('highlightStyle');
    const translations = document.querySelectorAll('.translation');
    translations.forEach((translation) => {
      translation.textContent = translation.textContent;
    });

    // context.translation.textContent = context.previousTranslation;
  }

  play = () => {
    if (this.state.shouldSpeak && !this.state.isPlaying) {
      //start position
      this.speak();
      return this.setState({ isPlaying: true });
    } else if (this.state.shouldSpeak && this.state.isPlaying) {
      //pause it here
      this.speech.cancel();
      return this.setState({ shouldSpeak: false, isPlaying: false });
    } else if (!this.state.shouldSpeak && !this.state.isPlaying) {
      //resume it here
      return this.setState({ shouldSpeak: true, isPlaying: true }, () => this.speak());
    }
  };
  speak = () => {
    const {
      currentPosition_defaultMode,
      wordPositionInTranslation,
      sentenceVoice,
      sentenceSpeed,
      translationVoice,
      translationSpeed,
      translationVoice2,
      scroll,
      shouldSpeak,
    } = this.state;
    if (!shouldSpeak) return;

    let text = '';
    const currentGroup = this.allSentences[currentPosition_defaultMode];
    const [sentence, translation] = currentGroup?.querySelectorAll('p');
    this.currentGroup = currentGroup;
    this.sentence = sentence;
    this.translation = translation;
    currentGroup.classList.add('activeGroupHighlightStyle');

    this.scrollActiveIntoView(scroll, this.currentGroup);
    switch (this.state.readingSequence[this.state.positionInReadingSequence]) {
      case this.readingSequenceTypes.READ_PRIMARY_SENTENCE:
        sentence.classList.add('highlightStyle');
        text = sentence.textContent.trim();
        this.speech.setVoice(sentenceVoice.voice);
        this.speech.setLanguage(sentenceVoice.lang);
        this.speech.setRate(sentenceSpeed);
        break;

      case this.readingSequenceTypes.READ_TRANSLATION_FULL_SENTENCE_1:
        translation.classList.add('highlightStyle');
        text = translation.textContent.trim();
        this.speech.setVoice(translationVoice.voice);
        this.speech.setLanguage(translationVoice.lang);

        if (text.split(' ').length > 5 && !text.includes(',')) this.speech.setRate(1.0);
        else this.speech.setRate(translationSpeed);
        break;

      case this.readingSequenceTypes.PRONOUNCE_EACH_WORD_IN_TRANSLATION:
        this.previousTranslation = translation.textContent;
        const textArray = translation.textContent.trim().split(' ');
        text = textArray[wordPositionInTranslation];
        let found = false;
        translation.innerHTML = textArray
          .map((item, index) => {
            if (!found && index >= wordPositionInTranslation && item === text) {
              found = true;
              return `<span class="activeWordHighlightStyle">${text}</span>`;
            }
            return item;
          })
          .join(' ');

        this.speech.setVoice(translationVoice.voice);
        this.speech.setLanguage(translationVoice.lang);
        this.speech.setRate(1.5);
        break;

      case this.readingSequenceTypes.END_SEQUENCE:
        return this.handleOnEnd();
        break;

      default:
        text = 'Empty text!';
        break;
    }

    this.speech
      .speak({
        text: text,
        queue: false, // false=current speech will be interrupted,
        listeners: {
          onstart: (event) => {},
          onend: this.handleOnEnd,
          onresume: (event) => {},
          onboundary: (event) => {},
        },
      })
      .then((result) => {})
      .catch((e) => {
        console.error('An error occurred :', e);
      });
    return;
  };

  handleOnEnd = (event) => {
    if (this.speech.speaking() || this.speech.pending()) return;

    switch (this.state.readingSequence[this.state.positionInReadingSequence]) {
      // ========================
      case this.readingSequenceTypes.READ_PRIMARY_SENTENCE:
        this.gotoNextReadingSequence();
        break;

      case this.readingSequenceTypes.READ_TRANSLATION_FULL_SENTENCE_1:
        this.gotoNextReadingSequence();
        break;

      case this.readingSequenceTypes.PRONOUNCE_EACH_WORD_IN_TRANSLATION:
        this.pronounceEachWordInTranslation();
        break;
      // ========================

      case this.readingSequenceTypes.END_SEQUENCE:
        this.gotoNextCardOrNextPage();
        break;

      //handleLastTranslationItemOnPage
      default:
        this.gotoNextPage();
        break;
    }
  };

  pronounceEachWordInTranslation = () => {
    const { wordPositionInTranslation } = this.state;
    const { translation, speak, cleanUpHighlights } = this;
    let updatePayload = {};
    const totalWordCount = translation.textContent.trim().split(' ').length - 1;
    const canPronounceEachWord = wordPositionInTranslation < totalWordCount;

    if (canPronounceEachWord) {
      updatePayload = { wordPositionInTranslation: wordPositionInTranslation + 1 };
    } else {
      //  end of word pronunciation
      updatePayload = {
        wordPositionInTranslation: 0,
        positionInReadingSequence: this.state.positionInReadingSequence + 1,
      };
    }

    this.setState({ ...updatePayload }, () => {
      if (!canPronounceEachWord) cleanUpHighlights(this);
      speak();
    });
  };
  gotoNextCardOrNextPage() {
    let updatePayload = {};
    let isLastGroup = false;
    const isDefaultSRSMode = this.state.srsMode === this.srsMode.default;
    if (isDefaultSRSMode) {
      const currentPosition_defaultMode = this.state.currentPosition_defaultMode + 1;
      isLastGroup = currentPosition_defaultMode >= this.allSentences.length;

      updatePayload = {
        currentPosition_defaultMode,
        positionInReadingSequence: 0,
      };
    } else {
      const currentPosition_shuffleModes = this.state.currentPosition_shuffleModes + 1;
      isLastGroup = currentPosition_shuffleModes >= this.state.sortedData.length;

      updatePayload = {
        currentPosition_shuffleModes,
        currentPosition_defaultMode: this.state.sortedData[currentPosition_shuffleModes],
        positionInReadingSequence: 0,
      };
    }

    if (isLastGroup) {
      return this.gotoNextPage();
    }
    return this.setState({ ...updatePayload }, () => {
      this.cleanUpHighlights(this);
      this.speak();
    });
  }

  gotoNextPage = () => {
    const { shouldAutomaticallyPlayNextPage } = this.state;
    const isLastGroup =
      this.state.currentPosition_defaultMode >= this.allSentences.length - 1 ||
      this.state.currentPosition_shuffleModes >= this.state.sortedData.length - 1;

    if (isLastGroup) {
      window.scroll({ top: 0, left: 0, behavior: 'smooth' });
      shouldAutomaticallyPlayNextPage && this.handleNextPage();
      return;
    }
  };

  gotoNextReadingSequence() {
    let { positionInReadingSequence } = this.state;
    const newPositionInReadingSequence = positionInReadingSequence++;
    this.setState({ positionInReadingSequence, newPositionInReadingSequence }, () => {
      this.cleanUpHighlights(this);
      this.speak();
    });
  }

  handleBoundary(event) {
    if (event.name === 'sentence') {
      // we only care about word boundaries
      return;
    }
  }

  handleClickToPlay = (clickedPosition) => {
    // do nothing if playback hasn't started at all
    if (this.state.shouldSpeak && !this.state.isPlaying) return;
    // if playButton is pressed on the currently playing card. pause and unpause
    if (this.state.currentPosition_defaultMode === clickedPosition) return this.play();

    this.play();
    // this.cleanUpHighlights(this);
    let updatePayload = {};
    if (this.state.srsMode === this.srsMode.default) {
      updatePayload = {
        currentPosition_defaultMode: Math.max(clickedPosition, 0),
        positionInReadingSequence: 0,
      };
    } else {
      // below are the actions for shuffle modes
      let currentPosition_shuffleModes = this.state.sortedData.findIndex((item) => {
        return item === clickedPosition ? true : false;
      });
      updatePayload = {
        currentPosition_defaultMode: Math.max(clickedPosition, 0),
        currentPosition_shuffleModes,
        positionInReadingSequence: 0,
      };
    }

    this.setState({ ...updatePayload, wordPositionInTranslation: 0 }, () => {
      this.updateReferenceToDOMSentenceElements();
      this.cleanUpHighlights(this);
      this.persistState();
      this.play();
    });
  };

  handleSentenceVoiceChange = (sentenceVoice) => {
    this.setState(
      {
        sentenceVoice: {
          lang: sentenceVoice.lang,
          voice: sentenceVoice.voice,
          label: sentenceVoice.label,
        },
      },
      () => {
        this.speech.setVoice(this.state.sentenceVoice.voice);
        this.speech.setLanguage(this.state.sentenceVoice.lang);
        this.speech.cancel();
        this.persistState();
      }
    );
  };

  handleTranslationVoiceChange = (translationVoice) => {
    this.setState(
      {
        translationVoice: {
          lang: translationVoice.lang,
          voice: translationVoice.voice,
          label: translationVoice.label,
        },
      },
      () => {
        this.speech.setVoice(this.state.translationVoice.voice);
        this.speech.setLanguage(this.state.translationVoice.lang);
        this.speech.cancel();
        this.persistState();
      }
    );
  };

  handleTranslationVoiceChange2 = (translationVoice) => {
    this.setState(
      {
        translationVoice2: {
          lang: translationVoice.lang,
          voice: translationVoice.voice,
          label: translationVoice.label,
        },
      },
      () => {
        this.speech.setVoice(this.state.translationVoice2.voice);
        this.speech.setLanguage(this.state.translationVoice2.lang);
        this.speech.cancel();
        this.persistState();
      }
    );
  };

  handleSentenceSpeedChange = (value) => {
    this.speech.cancel();
    this.setState(
      {
        sentenceSpeed: value,
      },
      () => {
        this.speech.setRate(this.state.sentenceSpeed);
        this.persistState();
      }
    );
  };

  handleTranslationSpeedChange = (value) => {
    this.speech.cancel();
    this.setState(
      {
        translationSpeed: value,
      },
      () => {
        this.speech.setRate(this.state.translationSpeed);
        this.persistState();
      }
    );
  };

  toggleSRSMode = () => {
    if (this.currentGroup) this.cleanUpHighlights(this);
    const { currentPage, data } = this.state;

    let srsMode = this.srsMode.mode1;
    let sortedData = [];
    switch (this.state.srsMode) {
      case this.srsMode.default:
        srsMode = this.srsMode.mode1;
        sortedData = srsMode_1(data[currentPage]);
        break;
      case this.srsMode.mode1:
        srsMode = this.srsMode.mode2;
        sortedData = srsMode_2(data[currentPage]);
        break;
      case this.srsMode.mode2:
        srsMode = this.srsMode.mode3;
        sortedData = srsMode_3(data[currentPage]);
        break;
      case this.srsMode.mode3:
        srsMode = this.srsMode.default;
        sortedData = data[currentPage];
        break;

      default:
        break;
    }
    this.setState(
      {
        srsMode,
        sortedData,
        currentPosition_shuffleModes: 0,
      },
      () => this.persistState()
    );
  };

  scrollActiveIntoView(scroll, currentGroup) {
    if (scroll && currentGroup)
      currentGroup.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
  }

  toggleScrolling = () => {
    this.setState({ scroll: !this.state.scroll }, () => {
      const { scroll } = this.state;
      this.scrollActiveIntoView(scroll, this.currentGroup);
    });
  };

  handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  handlePreviousPage = () => {
    this.play();
    this.setState(
      ({ currentPage }) => {
        return {
          currentPage: Math.max(currentPage - 1, 0),
          currentPosition_defaultMode: 0,
          currentPosition_shuffleModes: 0,
          positionInReadingSequence: 0,
        };
      },
      () => {
        this.updateReferenceToDOMSentenceElements();
        this.cleanUpHighlights(this);
        this.persistState();
        this.handleScrollToTop();
        this.play();
      }
    );
  };
  handleNextPage = () => {
    this.play();
    this.setState(
      ({ currentPage, data }) => {
        return {
          currentPage: Math.min(currentPage + 1, data.length - 1),
          currentPosition_defaultMode: 0,
          currentPosition_shuffleModes: 0,
          positionInReadingSequence: 0,
        };
      },
      () => {
        this.updateReferenceToDOMSentenceElements();
        this.cleanUpHighlights(this);
        this.persistState();
        this.handleScrollToTop();
        this.play();
      }
    );
  };
  addTag = (tag) => {
    const { readingSequence } = this.state;
    let updatedReadingSequence = [...readingSequence];
    updatedReadingSequence.push(tag);
    this.handleReadingSequence(updatedReadingSequence);
  };

  handleReadingSequence = (readingSequence) => {
    let update = [...readingSequence];
    removeItemFromArray(update, this.readingSequenceTypes.END_SEQUENCE);
    update.push(this.readingSequenceTypes.END_SEQUENCE);
    this.setState({ readingSequence: update }, () => {
      this.persistState();
    });
  };
  handleFileUpload = (event, results) => {
    if (!results.length) return;

    const [e, file] = results[0];
    if (file.type !== 'application/json') {
      return alert('Unsupported type');
    }
    let jsonValue = JSON.parse(new TextDecoder().decode(e.target.result));

    const { Subtitles } = jsonValue;
    // data from Netflix
    if (Subtitles?.length) {
      jsonValue = Subtitles.map(({ Subtitle, Translation }) => {
        return {
          sentence: Translation.replace(/\[\w+\s*\w+?\]/g, '') /* [Sarah] or [John B] */,
          translation: Subtitle,
          id: uuid(),
        };
      });
    } //standard JSON data
    else {
      jsonValue = Object.entries(jsonValue)
        .map(([word, value]) => {
          const { examples, wordTranslations } = value;
          return examples?.map((value) => {
            return { ...value, word, wordTranslations };
          });
        })
        .flat()
        .map(({ word, text, translation, wordTranslations }) => {
          return {
            word: word ?? '',
            wordTranslations: wordTranslations ?? [],
            sentence: text ?? '',
            translation: translation ?? '',
            id: uuid(),
          };
        });
    }

    // console.log(JSON.stringify(jsonValue));
    jsonValue = chunkArrayInGroups(jsonValue, this.itemsPerPage);
    this.setState(
      {
        data: jsonValue,
        currentPage: 0,
        currentPosition_defaultMode: 0,
      },
      () => {
        this.updateReferenceToDOMSentenceElements();
        this.persistState();
      }
    );
  };

  translationTags = (wordTranslations = [], word = '') => {
    const result = wordTranslations.map(({ pos, translations }) => {
      return (
        <>
          <span className="word-partOfSpeech tags">{pos}</span>
          {translations.slice(0, 6).map((entry) => {
            return (
              <span key={entry} className="word-translations tags">
                {entry}
              </span>
            );
          })}
        </>
      );
    });
    result.unshift(<span className="word">{word}:</span>);
    return result;
  };
  render() {
    let {
      data,
      sortedData,
      currentPage,
      srsMode,
      currentPosition_defaultMode,
      currentPosition_shuffleModes,
    } = this.state;

    const progressPercentageDefaultMode =
      ((currentPosition_defaultMode + 1) / data[currentPage]?.length) * 100;
    const progressPercentageShuffleMode =
      ((currentPosition_shuffleModes + 1) / sortedData?.length) * 100;
    const progressPercentage =
      srsMode === this.srsMode.default
        ? progressPercentageDefaultMode
        : progressPercentageShuffleMode;
    const minimumWidthToShowProgress = 2;

    const activeCardIndex =
      srsMode === this.srsMode.default ? currentPosition_defaultMode : currentPosition_shuffleModes;
    const totalCardCount =
      srsMode === this.srsMode.default ? data[currentPage]?.length : sortedData?.length;

    const isCurrentlyPlaying = this.state.shouldSpeak && this.state.isPlaying;
    return (
      <>
        <div
          className="progress-bar"
          style={{
            display: progressPercentage > minimumWidthToShowProgress ? 'block' : 'none',
          }}
        >
          <div
            style={{
              width: `calc(${progressPercentage}vw - 5px)`,
              'animation-iteration-count': `${isCurrentlyPlaying ? 'infinite' : 0}`,
            }}
          ></div>
        </div>

        <div className="container">
          <section>
            <header className="bar">
              <div className="logo-wrapper">
                <img className="logo" src={logoImage} alt="Orator - Sentence Memorizer" />
              </div>
              <div className="control-wrapper">
                <div className="control">
                  <div className="voice-group">
                    <SpeedSlider
                      label="Sentence"
                      defaultSpeed={this.state.sentenceSpeed}
                      handleSpeedChange={this.handleSentenceSpeedChange}
                    ></SpeedSlider>
                    <Select
                      className="control-voice"
                      value={{
                        value: this.state.sentenceVoice.voice,
                        label: `${this.state.sentenceVoice.lang} - ${this.state.sentenceVoice.voice}`,
                      }}
                      onChange={this.handleSentenceVoiceChange}
                      options={this.state.voiceList}
                    />
                  </div>
                  <div className="voice-group">
                    <SpeedSlider
                      label="Translation"
                      defaultSpeed={this.state.translationSpeed}
                      handleSpeedChange={this.handleTranslationSpeedChange}
                    ></SpeedSlider>
                    <Select
                      className="control-voice"
                      value={{
                        value: this.state.translationVoice.voice,
                        label: `${this.state.translationVoice.lang} - ${this.state.translationVoice.voice}`,
                      }}
                      onChange={this.handleTranslationVoiceChange}
                      options={this.state.voiceList}
                    />
                    <Select
                      className="control-voice"
                      value={{
                        value: this.state.translationVoice2.voice,
                        label: `${this.state.translationVoice2.lang} - ${this.state.translationVoice2.voice}`,
                      }}
                      onChange={this.handleTranslationVoiceChange2}
                      options={this.state.voiceList}
                    />
                  </div>
                </div>
                <div className="file-reader__wrapper">
                  <div className="file-reader">
                    <FileReaderInput as="buffer" onChange={this.handleFileUpload}>
                      <img
                        src={UploadIcon}
                        className="Upload-button"
                        alt="Upload json or CSV file"
                      />
                    </FileReaderInput>
                  </div>
                  <button
                    className="playback-button"
                    onClick={() => {
                      this.state.shouldSpeak && this.state.isPlaying && this.play();
                      const isEmpty = this.state.readingSequence.length === 1;
                      if (isEmpty) this.setState({ readingSequence: this.defaultReadingSequence });
                    }}
                  >
                    <ModalComponent>
                      <div className="reading-sequence">
                        <h3>Click tags below to add a Sequence</h3>
                        <div>
                          {[...new Set(Object.values(this.defaultReadingSequence))]
                            .filter((item) => item !== this.readingSequenceTypes.END_SEQUENCE)
                            .map((item) => {
                              return (
                                <button onClick={() => this.addTag(item)} key={item}>
                                  {item}
                                </button>
                              );
                            })}
                        </div>
                      </div>
                      <TagsInput
                        validate={(tag) => Object.values(this.readingSequenceTypes).includes(tag)}
                        value={this.state.readingSequence.filter(
                          (item) => item !== this.readingSequenceTypes.END_SEQUENCE
                        )}
                        onChange={this.handleReadingSequence}
                      />
                    </ModalComponent>
                  </button>
                  <button className="playback-button" onClick={this.play}>
                    <img
                      src={isCurrentlyPlaying ? pauseIcon : playIcon}
                      alt={isCurrentlyPlaying ? 'Pause' : 'Play'}
                    ></img>
                  </button>
                </div>
              </div>
            </header>
            <ol start={currentPage * this.itemsPerPage + 1}>
              {data[currentPage]?.map(
                ({ translation, sentence, id, word, wordTranslations }, index) => {
                  return (
                    <li className={`orator-${index} group_style`} key={id}>
                      <div className="sentence-item">
                        <h3 className="word-definition">
                          <span className="tag-container">
                            {this.translationTags(wordTranslations, word)}
                          </span>
                        </h3>
                        <p className="sentence sentence_style">{sentence}</p>
                        <p className="translation translation_style">{translation}</p>
                      </div>
                      <div className="card-buttons__container">
                        <button class="card-buttons">
                          <img src={FavoriteAddIcon} alt="Add as Favorite"></img>
                        </button>
                        <button
                          class={`card-buttons ${
                            this.state.shouldSpeak && !this.state.isPlaying
                              ? 'card-buttons__inactive'
                              : ''
                          } `}
                          style={{
                            background:
                              this.state.currentPosition_defaultMode === index ? 'red' : 'green',
                          }}
                          onClick={() => this.handleClickToPlay(index)}
                        >
                          <img
                            src={
                              isCurrentlyPlaying && this.state.currentPosition_defaultMode === index
                                ? pauseIcon
                                : playIcon
                            }
                            alt={isCurrentlyPlaying ? 'Pause' : 'Play'}
                          ></img>
                        </button>
                      </div>
                    </li>
                  );
                }
              )}
            </ol>
          </section>
        </div>
        <div className="lower-panel">
          <div>
            <span>{`#${activeCardIndex + 1} of ${totalCardCount}`}</span>{' '}
            <span>{`Page ${currentPage + 1} of ${data.length}`}</span>
          </div>
          <div>
            <button
              className="backButton"
              onClick={this.handlePreviousPage}
              style={{ opacity: currentPage <= 0 ? '0.4' : '1' }}
              disabled={currentPage <= 0}
            >
              <img src={BackIcon} className="Upload-button" alt="Back Button" />
            </button>
            <button
              className="scrollButton"
              onClick={this.toggleScrolling}
              style={{ opacity: this.state.scroll ? '0.4' : '1' }}
            >
              {this.state.scroll ? 'No Scroll' : 'Scroll'}
            </button>
            <button
              className="forwardButton"
              onClick={this.handleNextPage}
              style={{ opacity: currentPage >= data.length - 1 ? '0.4' : '1' }}
              disabled={currentPage >= data.length - 1}
            >
              <img src={ForwardIcon} className="Upload-button" alt="Forward Button" />
            </button>
          </div>

          {/* ================== */}
          <div>
            <button className="srsMode" onClick={this.toggleSRSMode}>
              {parseInt(this.state.srsMode.match(/\d+/g))
                ? 'Mode-' + parseInt(this.state.srsMode.match(/\d+/g))
                : 'Default'}
            </button>
            <button className="scroll-to-top" onClick={this.handleScrollToTop}>
              Scroll To Top
            </button>
            <button className="scroll-to-top">Settings</button>
          </div>

          {/* ================== */}
          {/* <button className="exampleButton" onClick={this.toggleScrolling}>
              Default English Voices
            </button> */}
          {/* <div className="info-container">
            <p> Try These Samples</p>
            <button className="exampleButton" onClick={this.toggleScrolling}>
              DE-EN
            </button>
            <button className="exampleButton" onClick={this.toggleSRSMode}>
              DE-RU
            </button>
          </div>
          <a href="#"> For more visit: contact LordKayBanks</a> */}
        </div>
      </>
    );
  }
}

export default App;
