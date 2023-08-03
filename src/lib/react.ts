import ReactNamespace from 'react/index';
import ReactDomNamespace from 'react-dom';

const React = eval('window.React') as typeof ReactNamespace;
const ReactDOM = eval('window.ReactDOM') as typeof ReactDomNamespace;
const GetElementById = (elementId: string) => {
  return eval('window.document').getElementById(elementId) as HTMLElement | null;
}

export default React;

export {
  ReactDOM,
  GetElementById
}