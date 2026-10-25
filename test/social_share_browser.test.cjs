// Run with: node --test test/social_share_browser.test.cjs
const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '../web/social-share-uniform-v1.js'), 'utf8');

function browser(href = 'https://www.chanson-a-repondre-uno.scot/') {
  const calls = [];
  const location = new URL(href);
  const navigator = {
    share: async (payload) => { calls.push(payload); },
    canShare: () => true,
    clipboard: { writeText: async (value) => { calls.push({ clipboard: value }); } },
  };
  const window = {};
  vm.runInNewContext(source, { window, navigator, location, URL });
  return { authority: window.ChansonSocialShare, calls, navigator };
}

test('card URL is canonical and retains its card-specific preview route', async () => {
  const { authority, calls } = browser();
  await authority.share({
    title: 'Carte 007',
    url: 'https://www.chanson-a-repondre-uno.scot/share/UNO-007/?utm_source=chatgpt.com',
  });
  assert.equal(calls[0].url, 'https://www.chanson-a-repondre-uno.scot/share/UNO-007/');
  assert.equal(calls[0].files, undefined);
  assert.equal(authority.isCardShareUrl(calls[0].url), true);
});

test('generic shares do not attach a file over the link preview', async () => {
  const { navigator, calls } = browser();
  await navigator.share({ title: 'UNO', url: '/play?utm_source=chatgpt.com' });
  assert.equal(calls[0].url, 'https://www.chanson-a-repondre-uno.scot/play/');
  assert.equal(calls[0].files, undefined);
});

test('preserves LUBIAK moment state but drops tracking', () => {
  const { authority } = browser();
  assert.equal(authority.minimalUrl('/lubiak/share/?moment=abc123&utm_source=chatgpt.com'),
    'https://www.chanson-a-repondre-uno.scot/lubiak/share/?moment=abc123');
});

test('does not rewrite external URLs', () => {
  const { authority } = browser();
  assert.equal(authority.minimalUrl('https://example.com/?important=yes'),
    'https://example.com/?important=yes');
});

test('copy link uses the same canonicalization', async () => {
  const { authority, calls } = browser();
  await authority.copyLink('/share/BRIO-004/?utm_medium=share');
  assert.equal(calls[0].clipboard, 'https://www.chanson-a-repondre-uno.scot/share/BRIO-004/');
});

test('Settings Visit Card has a dedicated static crawler preview', () => {
  const page = fs.readFileSync(path.join(__dirname, '../web/share/credits/index.html'), 'utf8');
  const image = 'https://www.chanson-a-repondre-uno.scot/social/credits-sherlock-visit.jpg';
  assert.ok(page.includes('property="og:image" content="' + image + '"'));
  assert.ok(page.includes('name="twitter:image" content="' + image + '"'));
  assert.ok(page.includes('property="og:url" content="https://www.chanson-a-repondre-uno.scot/share/credits/"'));
  assert.ok(page.includes('content="image/jpeg"'));
});
