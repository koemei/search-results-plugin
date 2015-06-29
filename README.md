# Search results plugin for  Koemei video platform

## Usage
  ```javascript
  <script src="dist/plugin.bundle.min.js"></script>

  <!-- Add demo js -->
  <script type="text/javascript">
    var komeiSearchResults = new KomeiSearchResults({key: 'YOUR_UNIQUE KEY'});
    komeiSearchResults.initialize(InputField, ResultsDiv);
  </script>
```
## TODO
* remove lodash dependency. (using lodash for mixin and extend functions only)

## Files
* `dev.html` loads local version of the plugin: `src/search-results.js` and `src/search-results.css`

* `index.html` loads the production ready plugin: `dist/plugin.bundle.min.js`

## Building the plugin
run `gulp build`

The following files will be generated inside `dist` folder

* `style.css`: _copy of the dev css file, not used by plugin but left for developers_
* `style.css.min`: _minified css file, loaded by the plugin _
* `plugin.js`: _copy of development plugin file, left for developers_
* `plugin.min.js`: _minified version of the plugin_
* `plugin.bundle.min.js`: _complete package, contains plugin.min.js and all dependencies_


## plugin options:
* `key`: Koemei Embed Key
* `width`: width of the results element
* `showTranscript`: If true will display matched transcripts. Defaults to true
* `openOnSelect`: If true when user clicks anywhere on the result it will open main video. If false, user should click on thumb/title to open video. Defaults to false
* `target`: target window when suggestion is selected. Defaults to self
* `prefetch`: prefetches popular vidoes. Defaults to true
* `limit`: limit suggestions. Defaults to 5
* `mode`: 'onEnter' or 'onType' defaults to 'onType'
* `minLength`: The minimum character length needed before suggestions start getting rendered. Defaults to 1.
* `hint`: If false, the typeahead will not show a hint. Defaults to true.
* `highlight`: If true pattern matches for the current query in text nodes will highlighted. Defaults to true.
* `css`: When set will override custom css.
* `fontcss`: When set will override custom font.

* `templates`:
  * `searching`: Rendered when `0` synchronous suggestions are available but asynchronous suggestions are expected. Can be either a HTML string or a precompiled template. If it's a precompiled template, the passed in context will contain `query`.
  * `noResults`: Rendered when `0` suggestions are available for the given query. Can be either a HTML string or a precompiled template. If it's a precompiled template, the passed in context will contain `query`.
  * `suggestion`: Used to render a single suggestion. If set, this has to be a precompiled template. The associated suggestion object will serve as the context. Defaults to the value of `display` wrapped in a `div` tag i.e. `<div>{{value}}</div>`.



