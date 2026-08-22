if (!window.__castleLaboratoryEventBridgeV69Installed) {
  window.__castleLaboratoryEventBridgeV69Installed = true;

  const mode = () => document.body.dataset.sceneMode || 'exterior';

  function forwardToCore(attempt = 0) {
    if (mode() !== 'interior') return;
    const button = document.getElementById('bureau-of-ai');
    if (!button) {
      if (attempt < 40) {
        setTimeout(() => forwardToCore(attempt + 1), 50);
        return;
      }
      document.body.dataset.laboratoryEntryOwner = 'core-event-bridge-missing-v69';
      window.__castleHideSceneLoader?.();
      return;
    }
    document.body.dataset.laboratoryEntryOwner = 'core-event-bridge-v69';
    button.dispatchEvent(new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      view: window,
    }));
  }

  window.addEventListener('castle-open-laboratory', event => {
    if (mode() !== 'interior') return;
    if (typeof window.__castleOpenLaboratory === 'function') return;
    event?.preventDefault?.();
    window.__castleShowSceneLoader?.('LABORATORY LOADING');
    window.__castleSetSceneLoaderProgress?.(12);
    forwardToCore();
  }, true);
}
