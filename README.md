# Wei Wang — Academic Homepage

Source code for [Wei Wang's academic homepage](https://icdatwang.github.io/).

Wei Wang is a PhD candidate in Mechanical Engineering at Northwestern Polytechnical University. His research focuses on prognostics and health management, remaining useful life prediction, and uncertainty quantification.

## Content

- English content: `content/`
- Chinese content: `content_zh/`
- Publication data: `content/publications.bib`
- Profile photo and other static files: `public/`

## Local development

Node.js 22 or later is recommended.

```bash
npm ci
npm run dev
```

Create a production build with:

```bash
npm run build
```

The site is statically exported to `out/`. Pushing to `main` triggers the GitHub Pages deployment workflow.

## Credits

This website is based on the open-source [PRISM](https://github.com/xyjoey/PRISM) academic homepage template and retains its MIT license.
