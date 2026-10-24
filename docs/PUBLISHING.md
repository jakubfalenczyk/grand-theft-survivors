# GitHub Pages deployment

The project uses a public [GitHub repository](https://github.com/jakubfalenczyk/grand-theft-survivors) and [GitHub Pages](https://jakubfalenczyk.github.io/grand-theft-survivors/). The original code and documentation use the MIT license, with attribution to Jakub Falenczyk. Third-party licenses remain separate.

## Release workflow

`.github/workflows/pages.yml` runs on pushes to `main` or a manual dispatch. Its build job installs Node.js 22 and locked npm dependencies, installs Chromium, and runs `npm run check`.

After the checks pass, it rebuilds with `--base=/grand-theft-survivors/`. A separate browser test loads that build at the repository path and checks the game canvas, dialogs, asset URLs and license links. GitHub receives only `dist/` as the Pages artifact. A deployment job publishes it through the `github-pages` environment.

The build job can read repository content and Pages configuration. The deployment job has `pages: write` and `id-token: write`. It does not need a stored personal access token. A newer deployment cancels an unfinished older one.

To reproduce the Pages build locally:

```sh
npm ci
npx playwright install chromium
npm run check
npm run build -- --base=/grand-theft-survivors/
npm run test:pages
npm run preview -- --base=/grand-theft-survivors/
```

Open `http://localhost:4173/grand-theft-survivors/`. The production build does not expose the development debug bridge. It includes the project license and dependency notices under `licenses/`.

## Licensing and visibility

MIT allows use, modification and redistribution, including commercial use. Copies must retain the copyright and license notices. It does not require a visible author credit on every screen. The game includes a voluntary author credit in its credits section. See [LICENSE](../LICENSE) and the [third-party register](THIRD-PARTY-ASSETS.md).

The `private` field in `package.json` prevents accidental npm publication. It does not control GitHub repository visibility.

Reference screenshots in `sources/` are not part of the MIT grant or the deployed build. Audio candidates remain research links, with no audio files included.

## Hosting limits

GitHub Free supports Pages from public repositories. GitHub Pro, Team and Enterprise also support private source repositories. See [Pages availability](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages).

GitHub documents a 1 GB published-site limit and a soft bandwidth limit of 100 GB per month. Recheck those limits before adding large audio files or changing hosting. See [Pages limits](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits).

The browser downloads the game's JavaScript and assets. Minification reduces their size; it does not prevent inspection or copying. Publishing the source supports bug reports and contributions. It also lets others reuse the code under MIT.
