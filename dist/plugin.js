var KomeiInput = (function() {
  'use strict';

  // constructor
  function KomeiInput(el, o) {
    this.el = el;
    this.options = o;
    this.query = this.getInputValue();

    this.bind();
  }

  // static methods
  KomeiInput.normalizeQuery = function(str) {
    // strips leading whitespace and condenses all whitespace
    return str.replace(/^\s*/g, '').replace(/\s{2,}/g, ' ');
  };

  // instance methods
  _.mixin(KomeiInput.prototype, {
    _onInput: function () {
      this._setQuery(this.getInputValue());
    },

    _setQuery: function (value, silent) {
      var areEquivalent;
      var hasDifferentWhitespace;

      if (value.length < this.options.minLength) return;

      areEquivalent = areQueriesEquivalent(value, this.query);
      hasDifferentWhitespace = areEquivalent ? this.query.length !== value.length : false;

      this.query = value;
      if (!areEquivalent) {
        this.emit('queryChanged', this.query);
      } else if ( hasDifferentWhitespace) {
        this.emit('whitespaceChanged', this.query);
      }
    },

    getInputValue: function () {
      return this.el.value;
    },

    setInputValue: function (value) {
      this.el.value = value;
    },

    resetInputValue: function () {
      this.setInputValue(this.query);
    },

    emit: function (name, value) {
      var event = new CustomEvent(name, {'detail': value });
      this.el.dispatchEvent(event);
    },

    bind: function () {
      var _this = this;

      _this.el.onkeyup = function(e) {
        if (!e) e = window.event;
        var keyCode = e.keyCode || e.which;
        if (keyCode == '13') {
          // Enter pressed
          _this._onInput()
        }

        if (_this.options.mode === 'onType')  _this._onInput();
      }
    }

  });

  return KomeiInput;

  // helper functions

  function areQueriesEquivalent(a, b) {
    return KomeiInput.normalizeQuery(a) === KomeiInput.normalizeQuery(b);
  }

})();

var KomeiSearchResults = (function() {
  'use strict';

  // constructor
  function KomeiSearchResults(o) {
    // come up with a way to extend defaults
    this.options = _.extend(this.defaults(), o);

    this.EMBED_KEY = this.options.key || '';
    this.limit = this.options.limit || 5;

    if (!this._validateEmbedKey()) {
      this.blocked = true;
      return;
    }
  }

  // instance methods
  _.mixin(KomeiSearchResults.prototype, {
    defaults: function () {
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
          suggestion: function (result) { return _this._getSuggestionTemplate(result);}
        },

        css: 'http://iplusstd.com/koemei/search-results-plugin/dist/style.min.css',
        fontcss: 'https://koemei.com/css/font.css'
      };
    },

    // ### private
    _validateEmbedKey: function () {
      if (!this.EMBED_KEY || this.EMBED_KEY === '') {
        logError('Koemei\'s Embed Key is required');
        return false;
      }

      return true;
    },

    _addCSS: function () {
      // append plugin css to page
      if (this.options.css) $('head').append('<link rel="stylesheet" href="' +
        this.options.css + '" type="text/css" />');

      // append font css to page
      if (this.options.fontcss) $('head').append('<link rel="stylesheet" href="' +
        this.options.fontcss + '" type="text/css" />');
    },

    _linkElements: function (inputEl, resultEl) {
      if (!inputEl) return logError('first parameter must be an input field.');
      if (!resultEl) return logError('second parameter must be a dom element.');

      this.input = new KomeiInput(inputEl, this.options);

      this.linkedEl = resultEl;
      this.linkedEl.innerHTML = '';

      var cnt = document.createElement('div');
      cnt.className = 'k-results';
      this.linkedEl.appendChild(cnt);

      this.resultsDom = cnt;

    },
    _setWidth: function () {
      if (this.options.width) this.linkedEl.style.width = this.options.width
    },

    _initialize: function (inputEl, resultEl) {
      if (this.blocked) return;

      this._linkElements(inputEl, resultEl);
      this._addCSS();
      this.clear();
      this._setWidth();
      this._initEngine();
      this._resetSuggestionElement();
      this._start()
    },

    _start: function () {
      var _this = this;

      if (!_this.input) return;

      this.input.el.addEventListener('queryChanged', function (e) {
        _this.update(e.detail);
      })
    },

    _initEngine: function () {
      var _this = this;
      var key = _this.EMBED_KEY;

      var engineOptions = {
        initialize: false,
        datumTokenizer: function (datum) {
          return Bloodhound.tokenizers.whitespace(datum._id);
        },
        queryTokenizer: Bloodhound.tokenizers.whitespace,
        remote: {
          url: _this.options.domain + _this.options.searchAPI,
          dataType: 'jsonp',
          transform: function (response) {
            return response.results;
          },
          replace: function (url, query) {
            return url + '?token=' + key + '&transcripts=true&q='+ query;
          }
        },
        identify: function(obj) {return obj._id;}
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
        .fail(function () {
          logError('[Bloodhound error]');
        });

    },

    _overwrite: function (query, suggestions) {
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

    _append: function (query, suggestions) {
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

    _resetSuggestionElement: function () {
      this.suggestionEl = null;
      delete this.suggestionEl;
    },

    _renderSearching: function (query) {
      this._resetSuggestionElement();
      this.resultsDom.innerHTML = '<div class="k-searching">' + this.options.templates.searching + '</div>';
    },

    _renderNoResults: function (query) {
      this._resetSuggestionElement();
      this.resultsDom.innerHTML = '<div class="k-no-results">' + this.options.templates.noResults + '</div>';
    },

    _empty: function () {
      this._resetSuggestionElement();
      this.resultsDom.innerHTML = '';
    },

    _getFooter: function (query, suggestions) {
      var footer = document.createElement('div');
      footer.className = 'k-results-footer'
      footer.innerHTML = 'powered by Koemei';
      return footer;
    },

    _getSuggestionElement: function (suggestion) {
      var suggestionEl = document.createElement('div');
      suggestionEl.className = 'k-suggestion'
      suggestionEl.innerHTML = this.options.templates.suggestion(suggestion);

      return suggestionEl;
    },

    _getSuggestionTemplate: function (result) {
      var _this = this;

      var image = result.pictureUrl || 'http://d3m8q0cwynqlq3.cloudfront.net/images/koemei-media-thumb.jpg';
      var date =  result.created.substring(0, 10);
      var suggestion = '';

      var length = toHHMMSS(result.length)

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
             '<div class="date-item">' + date + ' · by ' + result.creator.displayName +'</div>' +
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
            '<a href="' + addParameter(result.srcUrl, 'time', time) + '">' +
              '<span class="koemei-blue time">' + toHHMMSS(time) + '</span> ' +
              '<div class="MediaListItem-segment">' + matchingTranscript.highlight + '</div>' +
            '</a>' +
          '</li>';
        }
        suggestion += '</ul>';
      }

      suggestion += '</div>' ;
      return suggestion;
    },

    // ### public
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
        _this.cancel = function () {};
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
          _this.cancel = function () {};

          rendered += suggestions.length;

          _this._append(query, suggestions.slice(0, _this.limit - rendered));
        }
      }
    },

    cancel: function () {}, // when a new promise is called this will be overridden

    clear: function () {
      this._empty();
      this.cancel();
    }
  });

  return KomeiSearchResults;

  // helper functions
  // ----------------

  function logError ( message ) {
    if (window.console) {
      window.console.error( message );
    }
  };

  function toHHMMSS (length) {
    var sec_num = parseInt(length, 10);
    var hours = Math.floor(sec_num / 3600);
    var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
    var seconds = sec_num - (hours * 3600) - (minutes * 60);

    if (hours < 10) {hours   = '0' + hours;}
    if (minutes < 10) {minutes = '0' + minutes;}
    if (seconds < 10) {seconds = '0' + seconds;}

    hours = (hours > 0) ? hours + ':' : '';
    var time = hours + minutes + ':' + seconds;
    return time;
  };

  function addParameter  (url, paramName, paramValue) {
    if(!url) return '';
    if(!paramValue || !paramName) return url;
    var urlhash;
    var replaceDuplicates = true;
    if (url.indexOf('#') > 0) {
      var cl = url.indexOf('#');
      urlhash = url.substring(url.indexOf('#'),url.length);
    } else {
      urlhash = '';
      cl = url.length;
    }
    var sourceUrl = url.substring(0,cl);

    var urlParts = sourceUrl.split('?');
    var newQueryString = "";

    if (urlParts.length > 1) {
      var parameters = urlParts[1].split('&');
      for (var i=0; (i < parameters.length); i++) {
        var paramParts = parameters[i].split('=');

        if (!(replaceDuplicates && paramParts[0] == paramName)) {
          if (newQueryString == '') {
            newQueryString = '?';
          } else {
            newQueryString += '&';
          }

          newQueryString += paramParts[0] + '=' + (paramParts[1] ? paramParts[1] : '');
        }
      }
    }

    if (newQueryString == '') newQueryString = '?';

    if (newQueryString !== '' && newQueryString != '?') newQueryString += '&';
    newQueryString += paramName + '=' + (paramValue?paramValue:'');

    return urlParts[0] + newQueryString + urlhash;
  };
})();
