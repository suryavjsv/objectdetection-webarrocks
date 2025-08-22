# WebAR.rocks.object lighter dragon demo


## Presentation

This directory is fully standalone. We use a neural network trained by *WebAR.rocks.train* to detect and track a lighter. We use it in a web augmented reality application to display a 3D placeholder on the lighter.
This directory is a subset of [WebAR.rocks.object](https://github.com/WebAR-rocks/WebAR.rocks.object).


## Quick start

To test it, run from this path:

```bash
# facultative: use Node >= 22:
nvm use 22
#
npm install
npm run dev -- --host
```

Then open https://localhost:5173/ in your web browser.


## Production build

```bash
npm run build
```


## References

* [Three Fiber Github repo](https://github.com/pmndrs/react-three-fiber)
* [WebAR.rocks.object Github repo](https://github.com/WebAR-rocks/WebAR.rocks.object)
* [The Lonely Candle - flame with THREE.js](https://discourse.threejs.org/t/the-lonely-candle/4097)
* [The Lonely Candle - CodePen](https://codepen.io/prisoner849/pen/XPVGLp)
* [three-particle-fire - Github repo](https://github.com/yomotsu/three-particle-fire)
* [Gold Dragon - Sketchfab](https://sketchfab.com/3d-models/gold-dragon-2dd017082cca4597bdf75fa30dc3855c#download)