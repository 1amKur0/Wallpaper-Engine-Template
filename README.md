# Web Wallpaper Template

A small HTML, CSS, and JavaScript wallpaper template for Wallpaper Engine.

## Features

- Fullscreen image wallpaper with subtle motion.
- Mouse parallax.
- Real-time clock.
- Media title and artist display.
- Scrolling text for long media names.
- Media cover placeholder.
- Media progress bar.
- Wallpaper Engine media integration for supported players.

## Add Your Image

Place your own image here:

```text
assets/images/wallpaper.jpg
```

The image is ignored by Git so you can keep the repository clean and avoid committing copyrighted artwork.

## Preview In Browser

Run a local server:

```powershell
python -m http.server 5173
```

Then open:

```text
http://localhost:5173/
```

## Use In Wallpaper Engine

1. Open Wallpaper Engine.
2. Open the Editor.
3. Create a new Web wallpaper.
4. Import `index.html`.
5. Test and customize the wallpaper.

## Notes

Media title, cover, playback state, and timeline depend on the media player and Wallpaper Engine media integration support.
