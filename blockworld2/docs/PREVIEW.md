# Isolated test web app

The preview target is https://novice-builder.github.io/blockworld-2-preview/ — **proposed, not deployed or verified**. It is outside Neighborhood 06's /object-builder/ worker scope. Different project paths share browser-origin storage, so all BlockWorld 2 caches/database keys remain separately named. Do not unregister old workers or clear origin-wide storage.

This session cannot create/configure a Pages repository: the connector lacks those actions, and `gh auth status` reports invalid CLI authentication. The source, built archive, app manifest, raster icons, exact-scope service worker and local save infrastructure are preserved for publication by an authenticated operator.

After authenticating GitHub CLI in an appropriate environment:

```sh
cd blockworld2
npm ci
node tools/publish-preview.mjs --publish-test-preview
```

The guarded helper creates only novice-builder/blockworld-2-preview, copies only built static files (no source secrets or player saves), and configures that new repository's gh-pages branch. It never targets object-builder. It refuses a non-fast-forward push; subsequent updates should clone the preview repository and commit new dist files to its gh-pages branch, preserving history. If Pages is already configured, do not repeat the POST; use its existing configuration.

For manual publication: create the empty public test repository, commit dist contents plus .nojekyll to gh-pages, and select that branch as its Pages source. Never use the original repository's Pages settings. Check the returned deployment URL and release.json before calling it deployed.

Android: open the HTTPS URL, wait for caching, reload, then install/add to Home screen. Safari: Share → Add to Home Screen. Confirm a cold airplane-mode launch, save/reload and backup restoration on the actual device. Initial offline population requires network access. Desktop Chromium checks do not establish physical Lenovo/iPhone support.
