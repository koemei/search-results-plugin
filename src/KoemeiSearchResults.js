var KoemeiInput = require('./KoemeiInput');
var utils = require('./utils');
var assign = require('object-assign');
var Bloodhound = require('typeahead.js/dist/bloodhound')

function KoemeiSearchResults(o) {
  var _this = this;

  _this.options = assign(_this.defaults(), o);

  _this.EMBED_KEY = _this.options.key || '';
  _this.limit = _this.options.limit || 5;

  if (!_this._validateEmbedKey()) {
    _this.blocked = true;
    return;
  }
}

// instance methods
assign(KoemeiSearchResults.prototype, {
  defaults: function() {
    var _this = this;
    return {
      domain: 'https://koemei.com',
      searchAPI: '/api/search/files',
      prefetchAPI: '/api/files',

      width: '500px', // set to null/auto to remove width
      prefetch: true,
      showTranscript: true,
      target: '_self',

      onSelectFn: function (result, time) {
        return _this._defaultOnSelectFn(result, time);
      },
      customRendering: false,
      openOnSelect: false,
      limit: 5,
      mode: 'onType', // 'onEnter' or 'onType'
      minLength: 1,

      templates: {
        searching: 'Searching ...',
        noResults: 'No results found. Try another query.',
        suggestion: function(result) {
          return _this._getSuggestionTemplate(result);
        }
      },

      css: 'http://iplusstd.com/koemei/search-results-plugin/dist/style.min.css',
      fontcss: 'https://koemei.com/css/font.css',
      highlightColor: ''
    };
  },

  // ### private
  _validateEmbedKey: function() {
    if (!this.EMBED_KEY || this.EMBED_KEY === '') {
      utils.logError('Koemei\'s Embed Key is required');
      return false;
    }

    return true;
  },

  _addCSS: function() {
    // append plugin css to page
    if (this.options.css) utils.loadExternalAsset(this.options.css, 'css');

    // append font css to page
    if (this.options.fontcss) utils.loadExternalAsset(this.options.fontcss, 'css');

    this._buildCustomStyle();
  },

  _buildCustomStyle: function () {
    var css = '';

    // add css modifications
    if (this.options.highlightColor) {
      css += '.koemei-highlight,' +
        '.k-results .k-suggestion .koemei-highlight,' +
        '.k-results .k-suggestion .MediaListItem-segments li a:hover,' +
        '.k-results .k-suggestion.openOnSelect:hover .title-item,' +
        '.k-results .k-suggestion .wrapper-info:hover .title-item,' +
        '.koemei-cursor .wrapper-info .title-item,' +
        '.k-results .k-suggestion.openOnSelect:hover .date-item,' +
        '.k-results .k-suggestion .wrapper-info:hover .date-item,' +
        '.koemei-cursor .wrapper-info .date-item' +
          '{color:' + this.options.highlightColor + ' !important;}';

      css += '.k-results .k-suggestion .img-item:after { '+
        'background:' + this.options.highlightColor + ' !important;}';
    }

    if (css !== '') {
      body = document.body || document.getElementsByTagName('body')[0],
      style = document.createElement('style');

      style.type = 'text/css';
      if (style.styleSheet){
        style.styleSheet.cssText = css;
      } else {
        style.appendChild(document.createTextNode(css));
      }

      body.appendChild(style);
    }
  },

  _linkElements: function(inputEl, resultEl) {
    if (!inputEl) return utils.logError('first parameter must be an input field.');
    if (!resultEl) return utils.logError('second parameter must be a dom element.');

    this.input = new KoemeiInput(inputEl, this.options);

    this.linkedEl = resultEl;
    this.linkedEl.innerHTML = '';

    var cnt = document.createElement('div');
    cnt.className = 'k-results';
    this.linkedEl.appendChild(cnt);

    this.resultsDom = cnt;

  },
  _setWidth: function() {
    if (this.options.width) this.linkedEl.style.width = this.options.width
  },

  _initialize: function(inputEl, resultEl) {
    if (this.blocked) return;

    this._linkElements(inputEl, resultEl);
    this._addCSS();
    this.clear();
    this._setWidth();
    this._initEngine();
    this._resetSuggestionElement();
    this._start()
  },

  _start: function() {
    var _this = this;

    if (!_this.input) return;

    // listen to query events from Input before initializing it
    // might emit an event while initializing
    this.input.el.addEventListener('queryChanged', function (e) {
      _this.update(e.detail);
    });

    this.input.el.addEventListener('queryReset', function (e) {
      _this.clear();
    });

    this.input.initialize();
  },

  _initEngine: function() {
    var _this = this;
    var key = _this.EMBED_KEY;

    var engineOptions = {
      initialize: false,
      datumTokenizer: function(datum) {
        return Bloodhound.tokenizers.whitespace(datum._id);
      },
      queryTokenizer: Bloodhound.tokenizers.whitespace,
      remote: {
        url: _this.options.domain + _this.options.searchAPI,
        dataType: 'jsonp',
        transform: function(response) {
          return response.results;
        },
        replace: function(url, query) {
          return url + '?token=' + key + '&transcripts=true&q=' + query;
        }
      },
      identify: function(obj) {
        return obj._id;
      }
    }

    if (_this.options.prefetch) {
      engineOptions.prefetch = {
        url: _this.options.domain + _this.options.prefetchAPI + '?token=' + key,
        dataType: 'jsonp'
      }
    }

    // constructs the suggestion engine
    _this.engine = new Bloodhound(engineOptions);
    _this.engine.initialize()
      .fail(function() {
        utils.utils.logError('[Bloodhound error]');
      });

  },

  _overwrite: function(query, suggestions) {
    // defaults to empty array
    suggestions = suggestions || [];

    // got suggestions: overwrite dom with suggestions
    if (suggestions.length) {
      this._renderSuggestions(query, suggestions);
    }

    // no suggestions, overwrite dom with pending (if not empty)
    else if (this.options.templates.searching) {
      this._renderSearching(query);
    }

    // nothing to render: empty dom
    else {
      this._empty();
    }
  },

  _append: function(query, suggestions) {
    suggestions = suggestions || [];

    // got suggestions, sync suggestions exist: append suggestions to dom
    if (suggestions.length && this.suggestionEl) {
      this._appendSuggestions(query, suggestions);
    }

    // got suggestions, no sync suggestions: overwrite dom with suggestions
    else if (suggestions.length) {
      this._renderSuggestions(query, suggestions);
    }

    // no async/sync suggestions: overwrite dom with not found
    else if (!this.suggestionEl && this.options.templates.noResults) {
      this._renderNoResults(query);
    }
  },

  _renderSuggestions: function renderSuggestions(query, suggestions) {
    var suggestionEl = document.createElement('div');
    suggestionEl.className = 'k-suggestions'
    suggestionEl.innerHTML = '';

    this.resultsDom.innerHTML = '';
    this.resultsDom.appendChild(suggestionEl);
    this.resultsDom.appendChild(this._getFooter(query, suggestions));

    this.suggestionEl = suggestionEl;

    // add results to suggestion container
    this._appendSuggestions(query, suggestions);
  },

  _appendSuggestions: function appendSuggestions(query, suggestions) {
    var _this = this;

    for (var i = 0; i < suggestions.length; i++) {
      _this.suggestionEl.appendChild(_this._getSuggestionElement(suggestions[i]));
    };
  },

  _resetSuggestionElement: function() {
    this.suggestionEl = null;
    delete this.suggestionEl;
  },

  _renderSearching: function(query) {
    this._resetSuggestionElement();
    this.resultsDom.innerHTML = '<div class="k-searching">' + this.options.templates.searching + '</div>';
  },

  _renderNoResults: function(query) {
    this._resetSuggestionElement();
    this.resultsDom.innerHTML = '<div class="k-no-results">' + this.options.templates.noResults + '</div>';
  },

  _empty: function() {
    this._resetSuggestionElement();
    this.resultsDom.innerHTML = '';
  },

  _getFooter: function(query, suggestions) {
    var footer = document.createElement('div');
    footer.className = 'k-results-footer'
    footer.innerHTML = 'powered by <a href="//koemei.com" target="_blank"><img src="https://koemei.com/img/logo.svg" alt="koemei" /></a>';
    return footer;
  },

  _getSuggestionElement: function(suggestion) {
    var suggestionEl = document.createElement('div');
    suggestionEl.className = 'k-suggestion'
    suggestionEl.appendChild(this.options.templates.suggestion(suggestion));

    return suggestionEl;
  },

  _getSuggestionTemplate: function(result) {
    var _this = this;

    // main element
    var mainElement = document.createElement('div');

    if (_this.options.openOnSelect) {
      mainElement.className = 'openOnSelect';
      mainElement.onclick = function() {
        _this.options.onSelectFn(result);
      }
    }

    // main wrapper
    var wrapperItem = document.createElement('div');
    wrapperItem.className = "wrapper-item";

    var wrapperInfo = document.createElement('div');
    wrapperInfo.className = "wrapper-info";

    wrapperItem.appendChild(wrapperInfo);
    mainElement.appendChild(wrapperItem);

    // image
    var imgLinkEl = document.createElement('a');
    imgLinkEl.className = "img-item koemei-pullLeft";
    imgLinkEl.onclick = function() {
      _this.options.onSelectFn(result);
    }

    var gradientDiv = document.createElement('div');
    gradientDiv.className = "gradient";

    var imgCnt = document.createElement('img');
    imgCnt.src = result.pictureUrl || 'http://d3m8q0cwynqlq3.cloudfront.net/images/koemei-media-thumb.jpg';

    var timeDiv = document.createElement('div');
    timeDiv.className = "time-item";
    timeDiv.innerHTML = utils.toHHMMSS(result.length);

    imgLinkEl.appendChild(gradientDiv);
    imgLinkEl.appendChild(imgCnt);
    imgLinkEl.appendChild(timeDiv);
    wrapperInfo.appendChild(imgLinkEl);

    // title
    var titleLinkEl = document.createElement('a');
    titleLinkEl.onclick = function() {
      _this.options.onSelectFn(result);
    }

    var wrapperTitleDiv = document.createElement('div');
    wrapperTitleDiv.className = "wapper-title";

    var tittleDiv = document.createElement('div');
    tittleDiv.className = "title-item";
    tittleDiv.innerHTML = result.name;

    var dateDiv = document.createElement('div');
    dateDiv.className = "date-item";
    dateDiv.innerHTML = result.created.substring(0, 10);

    wrapperTitleDiv.appendChild(tittleDiv);
    wrapperTitleDiv.appendChild(dateDiv);
    titleLinkEl.appendChild(wrapperTitleDiv);
    wrapperInfo.appendChild(titleLinkEl);

    // matching transcripts
    if (_this.options.showTranscript && result.matchingTranscripts && result.matchingTranscripts.list) {
      var transUnorderedList = document.createElement('ul');
      transUnorderedList.className = "MediaListItem-segments active";
      mainElement.appendChild(transUnorderedList)

      var matchingTranscript;
      var time;

      for (var i = 0; i < 2 && i < result.matchingTranscripts.list.length; i++) {
        matchingTranscript = result.matchingTranscripts.list[i];
        time = matchingTranscript.start / 100;

        var listItem = document.createElement('li');
        var listLink = document.createElement('a');
        listLink.onclick = function() {
          _this.options.onSelectFn(result, time);
        }

        var listTimeDiv = document.createElement('div');
        listTimeDiv.className = "koemei-highlight koemei-time";
        listTimeDiv.innerHTML = utils.toHHMMSS(time);

        var listHighlightDiv = document.createElement('div');
        listHighlightDiv.className = "MediaListItem-segment";
        listHighlightDiv.innerHTML = matchingTranscript.highlight;

        listLink.appendChild(listTimeDiv);
        listLink.appendChild(listHighlightDiv);
        listItem.appendChild(listLink);
        transUnorderedList.appendChild(listItem);
      }
    }

    return mainElement;
  },

  _defaultOnSelectFn: function (result, time) {
    var url = (time) ? this.addParamtoLink(result.srcUrl, 'time', time) : result.srcUrl;
    window.open(url, this.options.target);
  },

  // ### public
  addParamtoLink: function (link, paramName, param) {
    return utils.addParameter(link, paramName, param);
  },
  initialize: function (inputEl, resultEl) {
    return this._initialize(inputEl, resultEl);
  },

  update: function(query) {
    var _this = this;
    var canceled = false;
    var syncCalled = false;
    var rendered = 0;

    // cancel possible pending update
    this.cancel();
    this.cancel = function cancel() {
      canceled = true;
      _this.cancel = utils.noop;
    };

    _this.engine.search(query, sync, async);


    function sync(suggestions) {
      if (syncCalled) return;

      syncCalled = true;
      suggestions = (suggestions || []).slice(0, _this.limit);
      rendered = suggestions.length;
      if (_this.options.customRendering) {
        return _this.options.customRendering(query, suggestions);
      }
      _this._overwrite(query, suggestions);
    }

    function async(suggestions) {
      suggestions = suggestions || [];

      // if the update has been canceled or if the query has changed
      // do not render the suggestions as they've become outdated
      if (!canceled && rendered < _this.limit) {
        _this.cancel = utils.noop;

        rendered += suggestions.length;
        if (_this.options.customRendering) {
          return _this.options.customRendering(query, suggestions);
        }
        _this._append(query, suggestions.slice(0, _this.limit - rendered));
      }
    }
  },

  cancel: utils.noop, // when a new promise is called this will be overridden

  clear: function() {
    this._empty();
    this.cancel();
  }
});

module.exports = KoemeiSearchResults;
