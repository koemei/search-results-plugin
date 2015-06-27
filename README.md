# Search results plugin for  Koemei video platform

## Usage


## Files
* __dev.html__ loads local version of the plugin: `src/search-results.js` and `src/search-results.css`

* __index.html__ loads the production ready plugin: `dist/plugin.bundle.min.js`

## Building the plugin
run `gulp build`

The following files will be generated inside `dist` folder

* __style.css__: _copy of the dev css file, not used by plugin but left for developers_
* __style.css.min__: _minified css file, loaded by the plugin _
* __plugin.js__: _copy of development plugin file, left for developers_
* __plugin.min.js__: _minified version of the plugin_
* __plugin.bundle.min.js__: _complete package, contains plugin.min.js and all dependencies_


## plugin options:
* __key__: Koemei Embed Key
* __showTranscript__: If true will display matched transcripts. Defaults to true
* __openOnSelect__: If true when user clicks anywhere on the result it will open main video. If false, user should click on thumb/title to open video. Defaults to false
* __target__: target window when suggestion is selected. Defaults to self
* __limit__: limit suggestions. Defaults to 5
* __minLength__: The minimum character length needed before suggestions start getting rendered. Defaults to 1.
* __css__: When set will override custom css.
* __fontcss__: When set will override custom font.
