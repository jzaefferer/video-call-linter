# video-call-linter

This experminent is using [face-api.js](https://github.com/justadudewhohacks/face-api.js) to detect a face in your camera stream and tries to make recommendations for position and distance (too close to the edge, too far away, too close). It uses a machine learning model for face recognition shipped with face-api.js, so limitations of that model will apply here for the face recognition itself. Only the recommendations are built on top, but are also likely to have flaws.

If you're [testing this](https://jzaefferer.github.io/video-call-linter/) and you're getting odd results, [please share them](https://github.com/jzaefferer/video-call-linter/issues/new). Generally any constructive feedback is welcome!

[Further reading](https://joerns-recurse-ideas.glitch.me/#video-call-linter)

# Improvements

## UI

- Move messages to the top of the video, with bigger font size
- Use big icons to illustrate the text, liek arrow up when too close too the bottom
- Test on smartphones!

On the intro text, give a hint to pick the camera used for calls (maybe detect if there's more than one?). Also give an [option to switch the camera](https://h3manth.com/new/blog/2018/switch-cameras-getusermedia/).

Pause when tab is in the background!

## Checks and recommendations

**Angle**: Maybe with feature detection, to calculate the angle of the face?

**Lighting**, Background: Sample the surroundings, or the whole image, to see if there's too much (bright) white (like #fffeff, #fbfcfd)? Maybe start by turning it grayscale, then try to detect overexposed areas (sort all pixels by color? Check the ratio of almost-perfect white to other colors?). [See also](https://www.pyimagesearch.com/2016/10/31/detecting-multiple-bright-spots-in-an-image-with-python-and-opencv/), [or this lib](https://github.com/Vibrant-Colors/node-vibrant)

**Network**: Ping some server to check for latency (in ms)? Use browser API to check for connection type (2G = bad)?

Audio: Record an audio sample, play it back, for a self-test. Sample noise, sample voice, calculate signal-to-noise. Try to transcribe the voice (with language input?) - if it works, others should understand you, too.
