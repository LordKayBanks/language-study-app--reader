import React, { Component } from 'react';
import Select from 'react-select';
import Speech from 'speak-tts';
import FileReaderInput from 'react-file-reader-input';
import _ from 'lodash';
import { v4 as uuid } from 'uuid';

import Navigator from './Utility/Navigator';
import { GlobalStyle } from './Components';
import SpeedSlider from './modules/Components/SpeedSlider';

import { defaultPlatformVoice } from './Utility/useful';
import logoImage from './Icons/Logo.png';
import { Pause as pauseIcon, Play as playIcon, Upload, Wave } from './Icons';
import {
  mockData,
  sentenceVoice as defaultSentenceVoice,
  translationVoice as defaultTranslationVoice,
  translationVoice2 as defaultTranslationVoice2,
} from './constants';
import './App.scss';
//   Imports end
//======================================================

const storage = global.localStorage || null;

class App extends Component {
  allSentences = [];
  constructor(props) {
    super(props);

    let sentenceSpeed = JSON.parse(storage?.getItem('sentenceSpeed')) ?? 1.2;
    let sentenceVoice = JSON.parse(storage?.getItem('sentenceVoice')) ?? defaultSentenceVoice;
    let translationSpeed = JSON.parse(storage?.getItem('translationSpeed')) ?? 1.2;
    let translationVoice =
      JSON.parse(storage?.getItem('translationVoice')) ?? defaultTranslationVoice;
    let translationVoice2 =
      JSON.parse(storage?.getItem('translationVoice2')) ?? defaultTranslationVoice2;
    let data = JSON.parse(storage?.getItem('file')) ?? mockData;

    this.state = {
      data: data,
      voiceList: [],
      sentenceSpeed: sentenceSpeed,
      sentenceVoice: sentenceVoice,
      translationSpeed: translationSpeed,
      translationVoice: translationVoice,
      translationVoice2: translationVoice2,
      currentPosition: 0,
      isNewGroup: 1,
      shouldSpeak: true,
      isPlaying: false,
      scroll: true,
    };
    this.speech = new Speech(); // will throw an exception if not browser supported
    if (this.speech.hasBrowserSupport()) {
      // returns a boolean
      console.log('speech synthesis supported');
    }
  }

  componentDidMount() {
    this.allSentences = [...document.querySelectorAll('[class^="orator-"]')];
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

          this.setState({ voiceList: sortedVoices } /*, () => console.log(sortedVoices)*/);
        },
      },
    });
  }
  componentWillUnmount() {
    // document.removeEventListener("keydown", this.handleKeyPress, false);
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
      currentPosition,
      isNewGroup,
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
    const currentGroup = this.allSentences[currentPosition];
    const [sentence, translation] = currentGroup?.querySelectorAll('div');
    if (scroll)
      currentGroup.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });

    currentGroup.classList.add('activeGroupHighlightStyle');
    switch (isNewGroup) {
      case 1:
        sentence.classList.add('highlightStyle');
        text = sentence.textContent.trim();
        this.speech.setVoice(sentenceVoice.voice);
        this.speech.setLanguage(sentenceVoice.lang);
        this.speech.setRate(sentenceSpeed);
        break;
      case 2:
        translation.classList.add('highlightStyle');
        text = translation.textContent.trim();
        this.speech.setVoice(translationVoice.voice);
        this.speech.setLanguage(translationVoice.lang);
        this.speech.setRate(translationSpeed);
        break;
      case 3:
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
          onstart: () => {
            // console.log('🚀 ==> onstart');
          },
          onend: () => {
            if (this.speech.speaking() || this.speech.pending()) return;
            // console.log('🚀 ==> End');
            switch (isNewGroup) {
              case 1:
                this.setState({ isNewGroup: 2 }, () => {
                  sentence.classList.remove('highlightStyle');
                  this.speak();
                });
                break;
              case 2:
                this.setState({ isNewGroup: 3 }, () => this.speak());
                break;
              case 3:
                this.setState(
                  (state, props) => {
                    return {
                      currentPosition: state.currentPosition + 1,
                      isNewGroup: 1,
                    };
                  },
                  () => {
                    currentGroup.classList.remove('activeGroupHighlightStyle');
                    translation.classList.remove('highlightStyle');
                    this.speak();
                  }
                );
                break;

              default:
                break;
            }
          },
          onresume: () => {
            console.log('🚀 ==> Resume utterance');
          },
          onboundary: (event) => {
            // this.handleBoundary(event);
            // console.log('🚀 ==> onboundary');
          },
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

  handleClick = ({ target }) => {
    let currentPosition = target.parentNode.getAttribute('class');
    currentPosition = parseInt(currentPosition.match(/\d+/g));
    this.setState(
      {
        currentPosition: currentPosition >= 1 ? currentPosition - 1 : 0,
        isNewGroup: true,
      } /*, () => console.log(currentPosition)*/
    );
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
        const voice = JSON.stringify(this.state.sentenceVoice);
        storage && storage.setItem(`sentenceVoice`, voice);
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
        const voice = JSON.stringify(this.state.translationVoice);
        storage && storage.setItem(`translationVoice`, voice);
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
        const voice = JSON.stringify(this.state.translationVoice2);
        storage && storage.setItem(`translationVoice2`, voice);
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
        const value = JSON.stringify(this.state.sentenceSpeed);
        storage && storage.setItem(`sentenceSpeed`, value);
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
        const value = JSON.stringify(this.state.translationSpeed);
        storage && storage.setItem(`translationSpeed`, value);
      }
    );
  };
  // =======================================
  // =======================================

  handleScroll = () => {
    this.setState({ scroll: !this.state.scroll });
  };
  handleFileChange = (event, results) => {
    if (!results.length) return;

    const [e, file] = results[0];
    if (file.type !== 'application/json') {
      return alert('Unsupported type');
    }
    let jsonValue = JSON.parse(new TextDecoder().decode(e.target.result));
    jsonValue = Object.entries(jsonValue)
      .map(([key, value]) => value)
      .flat()
      .map(({ text, translation }) => {
        return { sentence: translation, translation: text, id: uuid() };
      });

    // console.log(file);
    // console.log(JSON.stringify(jsonValue));
    this.setState(
      {
        data: jsonValue,
        currentPosition: 0,
      },
      () => {
        localStorage.setItem('file', JSON.stringify(jsonValue));
        this.allSentences = [...document.querySelectorAll('[class^="orator-"]')];
      }
    );
  };

  render() {
    const { data } = this.state;
    return (
      <>
        <div className="container">
          <GlobalStyle customeFontSize={this.bigFont} />
          <header className="bar">
            <div className="logo-wrapper">
              <img className="logo" src={logoImage} alt="Orator Ebook Reader" />
            </div>

            <div className="control-wrapper">
              <div className="control">
                <div className="voice-group">
                  <SpeedSlider
                    defaultSpeed={this.state.sentenceSpeed}
                    handleSpeedChange={this.handleSentenceSpeedChange}
                  ></SpeedSlider>
                  <Select
                    className="control-voice"
                    value={{
                      value: this.state.sentenceVoice.voice,
                      label: `${this.state.sentenceVoice.lang} - ${this.state.sentenceVoice.voice}`,
                      //   label: `${this.state.sentenceVoice.voice || 'Select voice'}`,
                    }}
                    onChange={this.handleSentenceVoiceChange}
                    options={this.state.voiceList}
                  />
                  {/* <div>Sentence</div> */}
                </div>
                <div className="voice-group">
                  <SpeedSlider
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
                  {/* <div>Translation</div> */}
                </div>
                <div>
                  <button className="playback-button" onClick={this.play}>
                    <img
                      src={this.state.shouldSpeak && this.state.isPlaying ? pauseIcon : playIcon}
                      alt={this.state.shouldSpeak && this.state.isPlaying ? 'Pause' : 'Play'}
                    ></img>
                  </button>
                </div>
                <div className="file-reader">
                  <FileReaderInput as="buffer" onChange={this.handleFileChange}>
                    <img src={Upload} className="Upload-button" alt="Upload json or CSV file" />
                  </FileReaderInput>
                </div>
              </div>
            </div>
          </header>
          <ol style={{ marginTop: '55px' }}>
            {data.map(({ translation, sentence, id }, index) => {
              return (
                <li
                  className={`orator-${index}`}
                  key={id}
                  onClick={this.handleClick}
                  style={group_style}
                >
                  <div className="sentence" style={sentence_style}>
                    {sentence}
                  </div>
                  <div className="translation" style={translation_style}>
                    {translation}
                  </div>
                </li>
              );
            })}
          </ol>
          <button
            className="scrollButton"
            onClick={this.handleScroll}
            style={{ background: this.state.scroll ? 'green' : 'red' }}
          >
            {this.state.scroll ? 'Scroll' : 'No Scroll'}
          </button>
        </div>
      </>
    );
  }
}

export default App;
const group_style = {
  background: '#3a3233',
  padding: '5px 10px',
  marginBottom: '10px',
  borderRadius: '5px',
  //   display: 'flex',
  //   flexDirection: 'column',
};
const sentence_style = {
  color: 'deeppink',
  fontSize: '16px',
  //   display: 'inline',
};
const translation_style = {
  color: 'lime',
  fontSize: '20px',
  //   display: 'inline',
};
