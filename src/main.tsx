import { render } from 'preact';
import { App } from './app';
import { lang } from './i18n';
import './styles.css';

document.documentElement.lang = lang.value;
render(<App />, document.getElementById('app')!);
