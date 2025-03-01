# Music Lyrics Maker

This project is an application for creating music lyric videos using Remotion.

> Created as a personal project and for lyric videos on YouTube

## Installation

1. Clone this repository:
    ```bash
    git clone https://github.com/FightFarewellFearless/musicLyricsMaker
    cd musicLyricsMaker
    ```

2. Install dependencies:
    ```bash
    npm install
    ```

## Running Remotion Studio

To run Remotion Studio and preview the music lyric video, use the following command:
```bash
npm run dev
```

## Creating Video

To create a music lyric video, use the following command:
```bash
npm run build
```

## Project Structure

- `src/ThumbnailCreator.tsx`: Component for creating video thumbnails.
- `src/Root.tsx`: Main component that sets up the composition and default properties.
- `src/Music.tsx`: Component for creating music lyric videos.
- `render.js`: Script for rendering videos and thumbnails.
- `.github/workflows/render.yml`: GitHub Actions workflow for automatically rendering videos.
- `.github/workflows/Matrix.yml`: GitHub Actions workflow for rendering videos using matrix renderer.

## Contribution

If you want to contribute to this project, please create a pull request or open a new issue.

## License

This project is licensed under the BSD+Patent license.

## Notice

For any distribution or rendered video, please include credits to the owner or a link to this repository.
