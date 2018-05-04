# 3.3.0

## Major updates

## Updates

### Core Engine

- Add the choice of [forming a closed loop](http://doc.babylonjs.com/how_to/how_to_use_curve3#catmull-rom-spline) to the catamull-rom-spline curve3 ([johnk](https://github.com/babylonjsguide))
- Add support for specifying the center of rotation to textures ([bghgary](http://www.github.com/bghgary))

### glTF Loader

- Add support for KHR_texture_transform ([bghgary](http://www.github.com/bghgary))

### Viewer

- No fullscreen button on small devices ([RaananW](https://github.com/RaananW))
- Nav-Bar is now disaplayed on fullscreen per default  ([RaananW](https://github.com/RaananW))

## Bug fixes

### Core Engine

- Fix ```shadowEnabled``` property on lights. Shadows are not visble anymore when disabled ([sebavan](http://www.github.com/sebavan))

### Viewer

- Fix Navbar Interaction on Mozilla/Firefox ([SzeyinLee](https://github.com/SzeyinLee))
- Fix Animation Slider Interaction on Mozilla/Firefox ([sebavan](http://www.github.com/sebavan))
- Fix Animation Slider Clickable area size Cross Plat ([sebavan](http://www.github.com/sebavan))
- Ground material didn't take the default main color is no material definition was provided ([RaananW](https://github.com/RaananW))

## Breaking changes
