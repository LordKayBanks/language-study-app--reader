import React, { Component } from 'react';
import Select from 'react-select';
import Speech from 'speak-tts';
import FileReaderInput from 'react-file-reader-input';
import _ from 'lodash';

import Navigator from './Utility/Navigator';
import { Container, GlobalStyle } from './Components';
import SpeedSlider from './modules/Components/SpeedSlider';

import { defaultPlatformVoice } from './Utility/useful';
import logoImage from './Icons/Logo.png';
import { Pause, Play, Upload, Wave } from './Icons';
import './App.scss';
//   Imports end
//======================================================

const storage = global.localStorage || null;

class App extends Component {
  allSentences = [];
  constructor(props) {
    super(props);

    let sentenceSpeed = JSON.parse(storage?.getItem('sentenceSpeed')) ?? '';
    let sentenceVoice = JSON.parse(storage?.getItem('sentenceVoice')) ?? '';
    let translationSpeed = JSON.parse(storage?.getItem('translationSpeed')) ?? '';
    let translationVoice = JSON.parse(storage?.getItem('translationVoice')) ?? '';

    this.state = {
      data: mockData,
      localName: null,
      largeText: !false,
      // =========
      voiceList: [],
      sentenceSpeed: sentenceSpeed ?? 1.3,
      sentenceVoice: sentenceVoice ?? {},
      translationSpeed: translationSpeed ?? 1.3,
      translationVoice: translationVoice ?? {},
      currentPosition: 0,
      isNewGroup: true,
      isPlaying: '',
    };
    this.speech = new Speech(); // will throw an exception if not browser supported
    if (this.speech.hasBrowserSupport()) {
      // returns a boolean
      console.log('speech synthesis supported');
    }
  }

  componentDidMount() {
    this.allSentences = [...document.querySelectorAll('[class^="orator-"]')];
    // console.log(this.allSentences);
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
          if (voices.length) {
            availableVoices = voices
              .map(({ lang, name }) => {
                return {
                  lang: lang,
                  voice: name,
                  label: `${lang} - ${name}`,
                };
              })
              .sort(({ lang: langA }, { lang: langB }) => {
                return langA.localeCompare(langB);
              });
          }

          this.setState({ voiceList: availableVoices } /*() => console.log(availableVoices)*/);
        },
      },
    });
  }
  componentWillUnmount() {
    // document.removeEventListener("keydown", this.handleKeyPress, false);
  }

  handleKeyPress = ({ key }) => {
    key && key === 'ArrowUp' && this.prevSentence();
    key && key === 'ArrowDown' && this.nextSentence();
    key && key === ' ' && this.play_Pause();
  };

  pauseResume({ key }) {
    if (key !== 'p') return;

    if (this.speech.paused()) {
      this.speech.resume();
    } else if (this.speech.speaking()) {
      this.speech.pause();
    }
  }

  speak = (text) => {
    const {
      currentPosition,
      isNewGroup,
      sentenceVoice,
      sentenceSpeed,
      translationVoice,
      translationSpeed,
    } = this.state;
    const currentGroup = this.allSentences[currentPosition];
    // console.log(this.allSentences);
    // return;
    const [sentence, translation] = currentGroup?.querySelectorAll('span');
    currentGroup.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
    // currentGroup.classList.add = 'currentGroupHighlightStyle';
    if (isNewGroup) {
      //   sentence.classList.add = 'highlightStyle';
      text = sentence.textContent.trim();
      this.speech.setVoice(sentenceVoice.voice);
      this.speech.setLanguage(sentenceVoice.lang);
      this.speech.setRate(sentenceSpeed);
    } else {
      //   translation.classList.add = 'highlightStyle';
      text = translation.textContent.trim();
      this.speech.setVoice(translationVoice.voice);
      this.speech.setLanguage(translationVoice.lang);
      this.speech.setRate(translationSpeed);
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
            if (isNewGroup) {
              this.setState(
                (state, props) => {
                  return {
                    isNewGroup: false,
                  };
                },
                () => {
                  //   sentence.classList.remove('highlightStyle');
                  this.speak();
                }
              );
            } else {
              this.setState(
                (state, props) => {
                  return {
                    currentPosition: state.currentPosition + 1,
                    isNewGroup: true,
                  };
                },
                () => {
                  //   currentGroup.classList.remove('currentGroupHighlightStyle');
                  //   translation.classList.remove('highlightStyle');
                  this.speak();
                }
              );
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

  stop = () => {
    if (this.state.isPlaying === 'stopped') return;

    this.play_Pause(); //pause
    this.speech.cancel();
    this.setState({ isPlaying: 'stopped' });
  };

  play_Pause = () => {
    if (this.state.isPlaying === 'stopped') {
      this.allPages = this.allPages_tempstorage;
      this.setState({ isPlaying: 'playing' });

      // this.speech.resume();
      // this.speech.cancel();

      this.speak();
      return;
    } else if (this.state.isPlaying === 'playing') {
      this.setState({ isPlaying: 'paused' });
      return this.speech.pause();
    } else if (this.state.isPlaying === 'paused') {
      this.setState({ isPlaying: 'playing' });
      return this.speech.resume();
    } else {
      // like for the first-time
      this.setState({ isPlaying: 'playing' });
      this.speech.cancel();
      return this.speak();
    }
  };

  handleClick = ({ target }) => {
    let currentPosition = target.parentNode.getAttribute('class');
    currentPosition = parseInt(currentPosition.match(/\d/g));
    this.setState({ currentPosition });
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
      .map(({ text, translation }, index) => {
        return { sentence: translation, translation: text, id: index };
      });
    // console.log(jsonValue);
    this.setState(
      {
        // data: jsonValue.slice(0, 10),
        data: jsonValue,
        currentPosition: 0,
      },
      () => {
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
                  {/* <div>Translation</div> */}
                </div>
                <div>
                  <button className="playback-button" onClick={(e) => this.speak()}>
                    <img
                      src={this.state.isPlaying === 'playing' ? Pause : Play}
                      alt={this.state.isPlaying === 'playing' ? 'Pause' : 'Play'}
                    ></img>
                  </button>
                </div>
                <div className="file-reader">
                  <FileReaderInput as="buffer" onChange={this.handleFileChange}>
                    <img src={Upload} className="Upload-button" alt="Book upload" />
                  </FileReaderInput>
                </div>
              </div>
            </div>
          </header>
          <Container>
            <ol>
              {data.map(({ translation, sentence, id }, index) => {
                return (
                  <li
                    className={`orator-${index}`}
                    key={id}
                    onClick={this.handleClick}
                    style={group_style}
                  >
                    <span className="sentence" style={sentence_style}>
                      {sentence}
                    </span>
                    <span className="translation" style={translation_style}>
                      {translation}
                    </span>
                  </li>
                );
              })}
            </ol>
          </Container>
          <Wave
            isPlaying={this.state.isPlaying === 'playing'}
            waveStyle={{ bottom: '-16px' }}
          ></Wave>
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
  display: 'flex',
  flexDirection: 'column',
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

const mockData = [
  { translation: 'Mein Vater sagte immer', sentence: 'My old man used to tell me', key: 1 },
  {
    translation: 'Ist das ein Witz? Sind wir in der Hölle oder',
    sentence: 'Is this a joke? Like, are we in hell or…?',
    key: 2,
  },
  {
    translation: 'Komm, Sarah. Lass uns gehen.',
    sentence: "Let's go, Sarah. Let's get out of here.",
    key: 3,
  },
  {
    translation: 'werden Sie wegen Mordes mit erschwerenden Umständen angeklagt.',
    sentence: 'you are charged with murder in the first degree with aggravated circumstances.',
    key: 4,
  },
  { translation: 'Mein Vater sagte immer', sentence: 'My old man used to tell me', key: 5 },
  {
    translation: 'Ist das ein Witz? Sind wir in der Hölle oder',
    sentence: 'Is this a joke? Like, are we in hell or…?',
    key: 6,
  },
  {
    translation: 'Komm, Sarah. Lass uns gehen.',
    sentence: "Let's go, Sarah. Let's get out of here.",
    key: 7,
  },
  {
    translation: 'werden Sie wegen Mordes mit erschwerenden Umständen angeklagt.',
    sentence: 'you are charged with murder in the first degree with aggravated circumstances.',
    key: 8,
  },
  { translation: 'Mein Vater sagte immer', sentence: 'My old man used to tell me' },
  {
    translation: 'Ist das ein Witz? Sind wir in der Hölle oder',
    sentence: 'Is this a joke? Like, are we in hell or…?',
    key: 9,
  },
  {
    translation: 'Komm, Sarah. Lass uns gehen.',
    sentence: "Let's go, Sarah. Let's get out of here.",
    key: 10,
  },
  { translation: 'Mein Vater sagte immer', sentence: 'My old man used to tell me', key: 11 },
  {
    translation: 'Ist das ein Witz? Sind wir in der Hölle oder',
    sentence: 'Is this a joke? Like, are we in hell or…?',
    key: 12,
  },
  {
    translation: 'Komm, Sarah. Lass uns gehen.',
    sentence: "Let's go, Sarah. Let's get out of here.",
    key: 13,
  },
  {
    translation: 'werden Sie wegen Mordes mit erschwerenden Umständen angeklagt.',
    sentence: 'you are charged with murder in the first degree with aggravated circumstances.',
    key: 14,
  },
  { translation: 'Mein Vater sagte immer', sentence: 'My old man used to tell me', key: 15 },
  {
    translation: 'Ist das ein Witz? Sind wir in der Hölle oder',
    sentence: 'Is this a joke? Like, are we in hell or…?',
    key: 16,
  },
  {
    translation: 'Komm, Sarah. Lass uns gehen.',
    sentence: "Let's go, Sarah. Let's get out of here.",
    key: 17,
  },
  {
    translation: 'werden Sie wegen Mordes mit erschwerenden Umständen angeklagt.',
    sentence: 'you are charged with murder in the first degree with aggravated circumstances.',
    key: 18,
  },
  { translation: 'Mein Vater sagte immer', sentence: 'My old man used to tell me' },
  {
    translation: 'Ist das ein Witz? Sind wir in der Hölle oder',
    sentence: 'Is this a joke? Like, are we in hell or…?',
    key: 19,
  },
  {
    translation: 'Komm, Sarah. Lass uns gehen.',
    sentence: "Let's go, Sarah. Let's get out of here.",
    key: 20,
  },
];
