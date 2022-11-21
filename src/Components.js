import styled from 'styled-components';
import { createGlobalStyle } from 'styled-components';

export const Container = styled.div`
  font-size: 16px;
  position: absolute;
  top: ${(props) => (props.fullscreen ? 0 : 135)}px;
  left: ${(props) => (props.fullscreen ? 0 : 1)}rem;
  right: ${(props) => (props.fullscreen ? 0 : 1)}rem;
  bottom: ${(props) => (props.fullscreen ? 0 : 1)}rem;
  transition: all 0.6s ease;
  ${(props) => !props.fullscreen && '0 0 5px rgba(0,0,0,.3);'};
`;

export const GlobalStyle = createGlobalStyle`
  * {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
    margin: 0;
    padding: 0;
    color: inherit;
    font-size: inherit;
    font-weight: 300;
    line-height: 1.4;
    word-break: break-word;
  }
  html {
    font-size: 62.5%;
  }
  body {
    margin: 0;
    padding: 0;
    min-height: 100vh;
    font-size: 1.8rem;
    background: #333;
    position: absolute;
    height: 100%;
    width: 100%;
    color: #fff;
    min-width:360px;
    background: #928a8a;
    display: flex;
    justify-content: center;
    /* background: linear-gradient(to bottom, #f2f2f2 0%, #333 100%); */

  }
`;
