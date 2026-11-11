# STIY Browser

STIY is a lightweight, black-themed browser-style web application designed for GitHub Pages.

## Features

- Google search and URL recognition
- Internal tab bar
- Back, forward, reload, and home controls
- Bookmarks saved in local storage
- Search engine selection (Google, DuckDuckGo, Bing)
- Responsive layout for desktop, iPad, and mobile
- Website display using an iframe when the destination permits embedding

## Important limitations

STIY is a website, not a standalone Chromium/Brave browser engine. A webpage cannot force arbitrary websites to load inside an iframe. Many sites (including some search, video, and gaming sites) send security headers or policies that prevent embedding. Cross-origin browser security also prevents STIY from reading another site's page title or controlling its internal navigation history.

STIY does not bypass school network filters, website access controls, or provider restrictions. Whether a website is reachable depends on the network and the website.

If a site refuses to embed, use an approved browser or ask the network administrator about access.

## Run locally

Open `index.html` in a modern browser, or serve this folder with a local static web server. Some browsers restrict features when files are opened directly from `file://`.

## Deploy to GitHub Pages

1. Create a GitHub repository.
2. Upload `index.html`, `style.css`, `script.js`, and the `assets` folder to the repository root.
3. Open repository **Settings → Pages**.
4. Under Build and deployment, select **Deploy from a branch**.
5. Select the `main` branch and `/ (root)` folder, then save.
6. Wait for GitHub Pages to publish the site.

## Files

- `index.html` — app structure
- `style.css` — black responsive interface
- `script.js` — tabs, address parsing, navigation, bookmarks, settings
- `assets/stiy.svg` — STIY favicon
