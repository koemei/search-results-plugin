var KoemeiInput = require('./KoemeiInput');
var utils = require('./utils');
var assign = require('object-assign');
var Bloodhound = require('typeahead.js/dist/bloodhound')

function KoemeiSearchResults(o) {
  this.options = assign(this.defaults(), o);

  this.EMBED_KEY = this.options.key || '';
  this.limit = this.options.limit || 5;

  if (!this._validateEmbedKey()) {
    this.blocked = true;
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
      target: 'self',
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
      fontcss: 'https://koemei.com/css/font.css'
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
    suggestionEl.innerHTML = this.options.templates.suggestion(suggestion);

    return suggestionEl;
  },

  _getSuggestionTemplate: function(result) {
    var _this = this;

    var image = result.pictureUrl || 'http://d3m8q0cwynqlq3.cloudfront.net/images/koemei-media-thumb.jpg';
    var date = result.created.substring(0, 10);
    var suggestion = '';

    var length = utils.toHHMMSS(result.length)

    var extracClass = (_this.options.openOnSelect) ? 'openOnSelect' : '';
    var suggestion = '<div class="' + extracClass + '">' +
      '<div class="wrapper-item">' +
      '<div class="wrapper-info">' +
      '<a class="img-item koemei-pullLeft" href="' + result.srcUrl + '">' +
      '<div class="gradient"></div>' +
      '<img src="' + image + '" alt="">' +
      '<div class="time-item">' + length + '</div>' +
      '</a>' +
      '<a href="' + result.srcUrl + '">' +
      '<div class="wrapper-title">' +
      '<div class="title-item">' + result.name + '</div>' +
      '<div class="date-item">' + date + ' · by ' + result.creator.displayName + '</div>' +
      '</div>' +
      '</a>' +
      ' </div>' +
      '</div>';

    if (_this.options.showTranscript && result.matchingTranscripts && result.matchingTranscripts.list) {
      suggestion += '<ul class="MediaListItem-segments active">';
      var matchingTranscript;
      var time;

      for (var i = 0; i < 2 && i < result.matchingTranscripts.list.length; i++) {
        matchingTranscript = result.matchingTranscripts.list[i];
        time = matchingTranscript.start / 100;
        suggestion += '<li>' +
          '<a href="' + utils.addParameter(result.srcUrl, 'time', time) + '">' +
          '<div class="koemei-highlight koemei-time">' + utils.toHHMMSS(time) + '</div> ' +
          '<div class="MediaListItem-segment">' + matchingTranscript.highlight + '</div>' +
          '</a>' +
          '</li>';
      }
      suggestion += '</ul>';
    }

    suggestion += '</div>';
    return suggestion;
  },

  // ### public
  initialize: function(inputEl, resultEl) {
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
    !syncCalled && sync([]);

    function sync(suggestions) {
      if (syncCalled) return;

      syncCalled = true;
      suggestions = (suggestions || []).slice(0, _this.limit);
      rendered = suggestions.length;

      _this._overwrite(query, suggestions);
    }

    function async(suggestions) {
      suggestions = suggestions || [];

      // if the update has been canceled or if the query has changed
      // do not render the suggestions as they've become outdated
      if (!canceled && rendered < _this.limit) {
        _this.cancel = utils.noop;

        rendered += suggestions.length;

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
