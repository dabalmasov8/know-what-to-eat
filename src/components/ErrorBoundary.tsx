import { Component, type ComponentChildren } from 'preact';
import { t } from '../i18n';

export class ErrorBoundary extends Component<{ children: ComponentChildren }, { failed: boolean }> {
  state = { failed: false };
  componentDidCatch() {
    this.setState({ failed: true });
  }
  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div class="banner bad" role="alert">
        <p>{t('error.boundary')}</p>
        <button class="btn" onClick={() => location.reload()}>{t('error.boundary.reload')}</button>
      </div>
    );
  }
}
