# Publishing and repository visibility

Reviewed 2026-10-24. Repository: <https://github.com/jakubfalenczyk/grand-theft-survivors>, currently **private**. Initial commit: `ba42ca3` (`init`). No hosting deployment, second repository, visibility change or project license has been approved.

## GitHub Pages eligibility

GitHub Free supports Pages from public repositories. It does not require choosing an open-source license. GitHub Pro, Team and Enterprise also support Pages from private repositories. Private source visibility should not be confused with access control on a published website. [GitHub Pages availability](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages).

| Option                                             | Source visibility                                          | Tradeoff                                                                  |
| -------------------------------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------- |
| Public source repository + Pages                   | Source/history visible                                     | Straightforward community workflow; choose reuse permissions deliberately |
| Private source + public build repository + Pages   | Editable source/history private; deployed JS/assets public | Free Pages route with a second release destination to maintain            |
| Private source + eligible paid GitHub plan + Pages | Source private; deployed client assets still downloadable  | Simpler repository arrangement; depends on account plan                   |

## Build-only public repository

This is technically feasible: run checks and build from the private repository, then copy only `dist/` to a separate public repository and deploy it there. For project Pages, build with `vite build --base=/PUBLIC_REPOSITORY_NAME/` and verify all asset/license links at that path. Do not copy source history, `sources/`, credentials or editor files. Keep sourcemaps disabled unless intentionally publishing them; do not strip required license notices.

A manual initial release can avoid cross-repository automation credentials. If automated later, the source workflow needs explicit, narrowly scoped access to the destination; its default repository token should not be assumed to write another repository. Configure publication in the destination repository. GitHub's Pages artifact workflow is documented in [custom Pages workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

Minification is a delivery optimization, not source protection: the browser downloads and executes JavaScript and downloads game assets. It hides TypeScript source structure, comments and private history, but a determined person can format and inspect the shipped code. Private server logic can remain secret; this prototype has no server.

Pages currently limits published sites to 1 GB and has a soft 100 GB/month bandwidth limit. Revisit hosting before adding large audio packs or a substantial audience. [Pages limits](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits).

## Public source and community value

My recommendation for the proposed YouTube/devlog direction is to consider a public repository once the project identity, asset rights and desired reuse policy are settled. It can provide concrete material for discussion, reproducible bug reports and visible development progress. This is a project strategy judgment, not a forecast of audience growth.

Anyone with public access can technically clone the repository. There is no defensible numerical estimate here for whether someone will turn this particular prototype into a competing game. Repository privacy reduces immediate access to editable sources; it does not prevent others from copying a published game's observable mechanics. Ongoing design, balancing, recognizable art and community interaction are valuable beyond the initial code snapshot.

Public does not automatically mean open source. GitHub distinguishes publication from licensing and permits viewing/forking public repositories under its terms; selecting a license defines broader reuse permissions. MIT/Apache-style licenses intentionally permit broad reuse, including commercial reuse subject to conditions. Copyleft is a different sharing choice, not clone prevention. Code, original art and third-party assets may need distinct notices. [GitHub repository licensing](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/licensing-a-repository).

Before deciding on public source, review reference screenshots separately from shipped assets and select a policy for original code/art. Existing dependency licenses must still be honored; using open tools, public references or AI assistance does not by itself pick a license for the whole project. No license or ownership conclusion is inferred merely from the development method.

Decision pending: remain private with build-only hosting, use private-source Pages under an eligible plan, or publish the source for community development. No action on these options is scheduled.
