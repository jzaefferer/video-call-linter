# video-call-linter

This experminent is using [face-api.js](https://github.com/justadudewhohacks/face-api.js) to detect a face in your camera stream and tries to make recommendations for position and distance (too close to the edge, too far away, too close). It uses a machine learning model for face recognition shipped with face-api.js, so limitations of that model will apply here for the face recognition itself. Only the recommendations are built on top, but are also likely to have flaws.

If you're [testing this](https://jzaefferer.github.io/video-call-linter/) and you're getting odd results, [please share them](https://github.com/jzaefferer/video-call-linter/issues/new). Generally any constructive feedback is welcome!

[Further reading](https://joerns-recurse-ideas.glitch.me/#video-call-linter)

## Features

**Number of faces**: Shows an error when no face or multiple faces are found.

**Position**: Based on face detection, calculates if your face is too close to the top, right, bottom or left edge.

**Distance**: Based on face detection and the ratio between your face and the dimensions of the video, calculates if you're too close or too far away.

**Lighting**: Samples the image, in a grid of 6 by 6, looking for overexposed sections, from sampled pixels with RGB values of 250 or higher (where RGB 255 is perfect white).

## Improvements

These are some ideas for enhancements.

### UI

- Use big icons to illustrate the text, like arrow up when too close too the bottom
- On the intro text, give a hint to pick the camera used for calls (maybe detect if there's more than one?). Also give an [option to switch the camera](https://h3manth.com/new/blog/2018/switch-cameras-getusermedia/).

### Checks and recommendations

**Angle**: Maybe with feature detection, to calculate the angle of the face?

**Network**: Ping some server to check for latency (in ms)? Use browser API to check for connection type (2G = bad)?

**Audio**: Record an audio sample, play it back, for a self-test. Sample noise, sample voice, calculate signal-to-noise. Try to transcribe the voice (with language input?) - if it works, others should understand you, too.

## Local Testing

```
# run once to generate certs
openssl req -newkey rsa:2048 -new -nodes -x509 -days 3650 -keyout key.pem -out cert.pem
# run to support https, required for testing getUserMedia on other devices (not localhost)
# and turn off cache!
npx http-server -S -c-1
```

[Remote Debugging (on Android)](https://developers.google.com/web/tools/chrome-devtools/remote-debugging) helps a lot.
