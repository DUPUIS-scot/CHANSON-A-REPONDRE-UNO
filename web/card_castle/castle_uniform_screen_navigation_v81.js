// Single screen-navigation authority for Exterior -> Interior -> Laboratory.
// Keeps the exterior castle toolbar as the visual contract on every scene.
if (!window.__castleUniformScreenNavigationV81Installed) {
  window.__castleUniformScreenNavigationV81Installed = true;

  const mode = () => document.body.dataset.sceneMode || 'exterior';
  let style = document.getElementById('castle-uniform-navigation-v81-style');
  if (!style) {
    style = document.createElement('style');
    style.id = 'castle-uniform-navigation-v81-style';
    style.textContent = `
      #return-exterior,#bureau-of-ai{display:none!important;visibility:hidden!important;pointer-events:none!important}
      .castle-toolbar{z-index:2147483001!important}
      body[data-scene-mode="interior"] #back-to-categories,
      body[data-scene-mode="laboratory"] #back-to-categories{display:flex!important}
      @media(max-width:980px){
        .castle-toolbar{top:max(10px,env(safe-area-inset-top))!important;left:max(10px,env(safe-area-inset-left))!important;right:max(10px,env(safe-area-inset-right))!important}
        .castle-toolbar-group{gap:8px!important}
        .castle-control{width:64px!important;height:64px!important;min-width:0!important;padding:0!important}
      }
    `;
    document.head.appendChild(style);
  }

  function sync() {
    const back = document.getElementById('back-to-categories');
    if (!back) return;
    const current = mode();
    const medallion = back.querySelector('.control-medallion');
    const title = back.querySelector('.control-title');
    const subtitle = back.querySelector('.control-subtitle');
    if (medallion) medallion.textContent = '←';
    if (current === 'laboratory') {
      back.setAttribute('aria-label', 'Retour au château intérieur');
      if (title) title.textContent = 'INTÉRIEUR';
      if (subtitle) subtitle.textContent = 'Retour au château';
    } else if (current === 'interior') {
      back.setAttribute('aria-label', 'Retour au château extérieur');
      if (title) title.textContent = 'EXTÉRIEUR';
      if (subtitle) subtitle.textContent = 'Retour au château';
    } else {
      back.setAttribute('aria-label', 'Retour aux catégories');
      if (title) title.textContent = 'CATÉGORIES';
      if (subtitle) subtitle.textContent = 'Explorer les thèmes';
    }
    document.body.dataset.castleScreenNavigation = 'uniform-exterior-contract-v81';
    document.body.dataset.castleNavigationControls = 'single-authority-v81';
  }

  document.addEventListener('click', event => {
    const back = event.target?.closest?.('#back-to-categories');
    if (!back) return;
    const current = mode();
    if (current === 'exterior') return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (current === 'laboratory') {
      window.__castleRestoreInteriorFromLaboratory?.();
    } else {
      const legacyReturn = document.getElementById('return-exterior');
      if (legacyReturn) legacyReturn.click();
      else window.__castleSearchRuntime?.switchToExterior?.();
    }
    queueMicrotask(sync);
  }, true);

  const observer = new MutationObserver(sync);
  observer.observe(document.body, {attributes:true, attributeFilter:['data-scene-mode','data-laboratory-ready']});
  window.addEventListener('castleRuntimeReady', sync);
  window.addEventListener('resize', sync);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', sync, {once:true});
  else sync();
}
