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
} from './Icons';
import {
  chunkArrayInGroups,
  defaultPlatformVoice,
  srsMode_1,
  srsMode_2,
  srsMode_3,
} from './Utility/useful';
import {
  mockData,
  sentenceVoice as defaultSentenceVoice,
  translationVoice as defaultTranslationVoice,
  translationVoice2 as defaultTranslationVoice2,
  sortedData as defaultSortedData,
} from './constants';
import './App.scss';

const storage = global.localStorage || null;
class App extends Component {
  itemsPerPage = 50;
  allSentences = [];
  currentGroup = null;
  sentence = null;
  translation = null;
  currentWord = null;
  srsMode = { mode1: 'mode1', mode2: 'mode2', mode3: 'mode3', default: 'default' };
  isNewGroup = { pass1: 'pass1', pass2: 'pass2', pass3: 'pass3' };

  constructor(props) {
    super(props);

    const storedState = JSON.parse(storage?.getItem('state')) ?? {};
    let sentenceSpeed = storedState?.sentenceSpeed ?? 1.2;
    let sentenceVoice = storedState?.sentenceVoice ?? defaultSentenceVoice;
    let translationSpeed = storedState?.translationSpeed ?? 1.2;
    let translationVoice = storedState?.translationVoice ?? defaultTranslationVoice;
    let translationVoice2 = storedState?.translationVoice2 ?? defaultTranslationVoice2;
    let data = storedState?.data ?? [mockData];
    let sortedData = storedState?.sortedData ?? defaultSortedData;
    let currentPage = storedState?.currentPage ?? 0;
    let srsMode = storedState?.srsMode ?? this.srsMode.default;

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
      currentPosition_otherModes: 0,
      currentPage: currentPage,
      scroll: true,
      srsMode: srsMode,
      isNewGroup: this.isNewGroup.pass1,
      isReadingEachWordInTranslation: false,
      wordPositionInTranslation: 0,
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

  cleanUpHighlights() {
    this.sentence.classList.remove('highlightStyle');
    this.translation.classList.remove('highlightStyle');
    this.currentGroup.classList.remove('activeGroupHighlightStyle');
    this.translation.textContent = this.currentWord;
    this.setState({
      isNewGroup: this.isNewGroup.pass1,
      isReadingEachWordInTranslation: false,
      wordPositionInTranslation: 0,
    });
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
      isNewGroup,
      isReadingEachWordInTranslation,
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
    if (scroll)
      currentGroup.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });

    currentGroup.classList.add('activeGroupHighlightStyle');
    switch (isNewGroup) {
      case this.isNewGroup.pass1:
        sentence.classList.add('highlightStyle');
        text = sentence.textContent.trim();
        this.speech.setVoice(sentenceVoice.voice);
        this.speech.setLanguage(sentenceVoice.lang);
        this.speech.setRate(sentenceSpeed);
        break;
      case this.isNewGroup.pass2:
        if (isReadingEachWordInTranslation) {
          this.currentWord = translation.textContent;
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
          //   translation.innerHTML = this.currentWord.replace(
          //     text,
          //     `<span class="activeWordHighlightStyle">${text}</span>`
          //   );
          //   this.speech.setRate(1.0);
          break;
        }
        translation.classList.add('highlightStyle');
        text = translation.textContent.trim();
        this.speech.setVoice(translationVoice.voice);
        this.speech.setLanguage(translationVoice.lang);
        this.speech.setRate(translationSpeed);
        break;
      case this.isNewGroup.pass3:
        translation.classList.add('highlightStyle');
        text = translation.textContent.trim();
        this.speech.setVoice(translationVoice2.voice);
        this.speech.setLanguage(translationVoice2.lang);
        this.speech.setRate(translationSpeed);
        break;

      default:
        break;
    }

    if (!text) text = 'There is nothing to read!';
    this.speech
      .speak({
        text: text,
        queue: false, // false=current speech will be interrupted,
        listeners: {
          onstart: () => {},
          onend: () => {
            if (this.speech.speaking() || this.speech.pending()) return;

            switch (isNewGroup) {
              case this.isNewGroup.pass1:
                this.setState({ isNewGroup: this.isNewGroup.pass2 }, () => {
                  sentence.classList.remove('highlightStyle');
                  this.speak();
                });
                break;

              case this.isNewGroup.pass2:
                if (!isReadingEachWordInTranslation) {
                  //first time reading the translation
                  this.setState({ isReadingEachWordInTranslation: true }, () => this.speak());
                  break;
                }
                //this is where we iterate over and pronounce each word
                const isReadingEachWord =
                  isReadingEachWordInTranslation &&
                  wordPositionInTranslation < translation.textContent.trim().split(' ').length - 1;
                if (isReadingEachWord) {
                  this.setState({ wordPositionInTranslation: wordPositionInTranslation + 1 }, () =>
                    this.speak()
                  );
                } else {
                  // this is the end of reading each word, moves it to the next phase
                  this.setState(
                    {
                      isNewGroup: this.isNewGroup.pass3,
                      isReadingEachWordInTranslation: false,
                      wordPositionInTranslation: 0,
                    },
                    () => {
                      this.cleanUpHighlights();
                      this.speak();
                    }
                  );
                }
                break;

              case this.isNewGroup.pass3:
                if (
                  this.state.srsMode === this.srsMode.default &&
                  this.state.currentPosition_defaultMode >= this.allSentences.length - 1
                ) {
                  //if this is the last group: default SRS Mode
                  this.cleanUpHighlights();
                  return this.setState({
                    shouldSpeak: true,
                    isPlaying: false,
                    currentPosition_defaultMode: 0,
                  });
                } else if (
                  this.state.srsMode !== this.srsMode.default &&
                  this.state.currentPosition_otherModes >= this.state.sortedData.length - 1
                ) {
                  //if this is the last group: other SRS Modes
                  this.cleanUpHighlights();
                  return this.setState({
                    shouldSpeak: true,
                    isPlaying: false,
                    currentPosition_otherModes: 0,
                  });
                }
                // ===================================================

                if (this.state.srsMode === this.srsMode.default) {
                  this.setState(
                    (state, props) => {
                      return {
                        currentPosition_defaultMode: state.currentPosition_defaultMode + 1,
                        isNewGroup: this.isNewGroup.pass1,
                      };
                    },
                    () => {
                      currentGroup.classList.remove('activeGroupHighlightStyle');
                      translation.classList.remove('highlightStyle');
                      this.speak();
                    }
                  );
                } else {
                  this.setState(
                    (state, props) => {
                      return {
                        currentPosition_otherModes: state.currentPosition_otherModes + 1,
                        currentPosition_defaultMode:
                          state.sortedData[state.currentPosition_otherModes + 1],
                        isNewGroup: this.isNewGroup.pass1,
                      };
                    },
                    () => {
                      currentGroup.classList.remove('activeGroupHighlightStyle');
                      translation.classList.remove('highlightStyle');
                      this.speak();
                    }
                  );
                }
                break;

              default:
                break;
            }
          },
          onresume: () => {
            console.log('🚀 ==> Resume utterance');
          },
          onboundary: (event) => {},
        },
      })
      .then(() => {
        // console.log('then: Success !');
      })
      .catch((e) => {
        console.error('An error occurred :', e);
      });
    return;
  };

  handleBoundary(event) {
    if (event.name === 'sentence') {
      // we only care about word boundaries
      return;
    }
  }

  handleDoubleClick = (event) => {
    const { target, detail } = event;
    if (detail === 2) {
      if (this.currentGroup) this.cleanUpHighlights();

      let clickedPosition = target.parentNode.parentNode.getAttribute('class');
      clickedPosition = parseInt(clickedPosition.match(/\d+/g));

      if (this.state.srsMode === this.srsMode.default)
        return this.setState(
          {
            currentPosition_defaultMode: Math.max(clickedPosition, 0),
            isNewGroup: this.isNewGroup.pass1,
          } /*, () => console.log(clickedPosition)*/
        );

      let newCurrentPosition_otherModes = this.state.sortedData.findIndex((item) => {
        return item === clickedPosition ? true : false;
      });

      this.setState({
        currentPosition_defaultMode: Math.max(clickedPosition, 0),
        currentPosition_otherModes: newCurrentPosition_otherModes,
        isNewGroup: this.isNewGroup.pass1,
      });
    }
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
    if (this.currentGroup) this.cleanUpHighlights();
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
        currentPosition_otherModes: 0,
      },
      () => this.persistState()
    );
  };

  toggleScrolling = () => {
    this.setState({ scroll: !this.state.scroll });
  };
  handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // this.setState({ scroll: false });
  };

  handlePreviousPage = () => {
    this.play();
    this.setState(
      ({ currentPage }) => {
        return {
          currentPage: Math.max(currentPage - 1, 0),
          currentPosition_defaultMode: 0,
          currentPosition_otherModes: 0,
        };
      },
      () => {
        this.updateReferenceToDOMSentenceElements();
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
          currentPosition_otherModes: 0,
        };
      },
      () => {
        this.updateReferenceToDOMSentenceElements();
        this.persistState();
        this.handleScrollToTop();
        this.play();
      }
    );
  };
  handleFileChange = (event, results) => {
    if (!results.length) return;

    const [e, file] = results[0];
    if (file.type !== 'application/json') {
      return alert('Unsupported type');
    }
    let jsonValue = JSON.parse(new TextDecoder().decode(e.target.result));
    jsonValue = Object.entries(jsonValue)
      .map(([key, value]) => {
        return value.map((value) => {
          return { ...value, word: key };
        });
      })
      .flat()
      .map((item) => {
        let Translation = '';
        let Subtitle = '';
        if (!item?.Translation || !item?.Subtitle) {
          Translation = item?.translation;
          Subtitle = item?.text;
        } else {
          Translation = item?.Translation;
          Subtitle = item?.Subtitle;
        }
        return {
          word: item?.word ?? '',
          sentence: Translation.replace(/\[\w+\s*\w+?\]/g, '') /* [Sarah] or [John B] */,
          translation: Subtitle,
          id: uuid(),
        };
      });
    console.log(JSON.stringify(jsonValue));
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

  render() {
    let { data, sortedData, currentPage } = this.state;
    sortedData = data[currentPage];

    return (
      <>
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
                    <FileReaderInput as="buffer" onChange={this.handleFileChange}>
                      <img
                        src={UploadIcon}
                        className="Upload-button"
                        alt="Upload json or CSV file"
                      />
                    </FileReaderInput>
                  </div>
                  <button className="playback-button" onClick={this.play}>
                    <img
                      src={this.state.shouldSpeak && this.state.isPlaying ? pauseIcon : playIcon}
                      alt={this.state.shouldSpeak && this.state.isPlaying ? 'Pause' : 'Play'}
                    ></img>
                  </button>
                </div>
              </div>
            </header>
            {/* <ol start="100"> */}
            <ol start={currentPage * this.itemsPerPage + 1}>
              {sortedData.map(({ translation, sentence, id, word }, index) => {
                return (
                  <li
                    className={`orator-${index} group_style`}
                    key={id}
                    // onClick={this.handleDoubleClick}
                  >
                    <div className="sentence-item">
                      <h3 onClick={this.handleDoubleClick}>{word}</h3>
                      <p className="sentence sentence_style" onClick={this.handleDoubleClick}>
                        {sentence}
                      </p>
                      <p className="translation translation_style" onClick={this.handleDoubleClick}>
                        {translation}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>
        </div>
        <div className="lower-panel">
          <div>{`Page ${currentPage + 1} of ${data.length}`}</div>
          <div>
            <button className="backButton" onClick={this.handlePreviousPage}>
              <img src={BackIcon} className="Upload-button" alt="Back Button" />
            </button>
            <button
              className="scrollButton"
              onClick={this.play}
              style={{
                background: this.state.shouldSpeak && this.state.isPlaying ? 'green' : 'red',
              }}
            >
              <img
                src={this.state.shouldSpeak && this.state.isPlaying ? pauseIcon : playIcon}
                alt={this.state.shouldSpeak && this.state.isPlaying ? 'Pause' : 'Play'}
              ></img>
            </button>
            <button className="forwardButton" onClick={this.handleNextPage}>
              <img src={ForwardIcon} className="Upload-button" alt="Forward Button" />
            </button>
          </div>

          {/* ================== */}
          <div>
            <button className="srsMode" onClick={this.toggleSRSMode}>
              {parseInt(this.state.srsMode.match(/\d+/g))
                ? 'Shuffle-' + parseInt(this.state.srsMode.match(/\d+/g))
                : 'Default'}
            </button>
            <button
              className="scrollButton"
              onClick={this.toggleScrolling}
              style={{ background: this.state.scroll ? 'green' : 'red' }}
            >
              {this.state.scroll ? 'Scroll' : 'No Scroll'}
            </button>
            <button className="scroll-to-top" onClick={this.handleScrollToTop}>
              Scroll To Top
            </button>
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
