# Search results plugin for Koemei

## Usage
  ```javascript
  // link to the plugin:
  <script src="dist/koemei-search-results.min.js"></script>

  // minimal settings
  var koemeiSearchResults = new KoemeiSearchResults({key: 'EMBED_KEY'});
  koemeiSearchResults.initialize(InputElement, ResultsDiv);
  ```
  __Optional__: You can link to the css directly and set `options.css` to `empty/null`

    ```javascript
    <script src="dist/style.min.js"></script>
    <script src="dist/koemei-search-results.min.js"></script>

    var koemeiSearchResults = new KoemeiSearchResults({key: 'EMBED_KEY', css: ''});
    koemeiSearchResults.initialize(InputElement, ResultsDiv);
    ```


## plugin options:
* `key`: Koemei Embed Key
* `width`: width of the results element
* `showTranscript`: If true will display matched transcripts. Defaults to true
* `onSelectFn`: Callback function when a result is selected. `function (result, time)` time is passed only when user clicks on transcript line
* `target`: target window when suggestion is selected. Defaults to "_self". Works with default `onSelectFn`
* `openOnSelect`: If true when user clicks anywhere on the result it will open main video. If false, user should click on thumb/title to open video. Defaults to false
* `prefetch`: prefetches popular vidoes. Defaults to true
* `limit`: limit suggestions. Defaults to 5
* `mode`: 'onEnter' or 'onType' defaults to 'onType'
* `minLength`: The minimum character length needed before suggestions start getting rendered. Defaults to 1.
* `hint`: If false, the typeahead will not show a hint. Defaults to true.
* `highlight`: If true pattern matches for the current query in text nodes will highlighted. Defaults to true.
* `css`: When set will override custom css.
* `fontcss`: When set will override custom font.
* `highlightColor`: When set will override highlight/hover color.

* `templates`:
  * `searching`: Rendered when `0` synchronous suggestions are available but asynchronous suggestions are expected. Can be either a HTML string or a precompiled template. If it's a precompiled template, the passed in context will contain `query`.
  * `noResults`: Rendered when `0` suggestions are available for the given query. Can be either a HTML string or a precompiled template. If it's a precompiled template, the passed in context will contain `query`.
  * `suggestion`: Used to render a single suggestion. If set, this has to be a precompiled template. The associated suggestion object will serve as the context. Defaults to the value of `display` wrapped in a `div` tag i.e. `<div>{{value}}</div>`.




# Development process
```
npm install

```

```
npm start

```
go to http://localhost:8000/examples

```
npm run build && npm start

```
go to http://localhost:8000/examples/prod.html
