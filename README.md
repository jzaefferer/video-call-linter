# video-call-linter

This experminent is using [face-api.js](https://github.com/justadudewhohacks/face-api.js) to detect a face in your camera stream and tries to make recommendations for position and distance (too close to the edge, too far away, too close). It uses a machine learning model for face recognition shipped with face-api.js, so limitations of that model will apply here for the face recognition itself. Only the recommendations are built on top, but are also likely to have flaws.

If you're [testing this](https://jzaefferer.github.io/video-call-linter/) and you're getting odd results, [please share them](https://github.com/jzaefferer/video-call-linter/issues/new). Generally any constructive feedback is welcome!

[Further reading](https://joerns-recurse-ideas.glitch.me/#video-call-linter)
