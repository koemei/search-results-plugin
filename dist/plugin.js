var KomeiInput = (function() {
  'use strict';

  // constructor
  function KomeiInput(el, o) {
    this.el = el;
    this.options = o;

  }

  // static methods
  KomeiInput.normalizeQuery = function(str) {
    // strips leading whitespace and condenses all whitespace
    return str.replace(/^\s*/g, '').replace(/\s{2,}/g, ' ');
  };

  // instance methods
  _.mixin(KomeiInput.prototype, {
    _initialize: function () {
      this.query = '';
      this.bind();
      this._onInput(); // call once initially to take into account pre set search values
    },

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
    // public

    initialize: function () {
      this._initialize();
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

        if (_this.options.mode === 'onType')  {
          _this._onInput();
        } else { // mode is onEnter
          if (keyCode == '13') { // Enter pressed
            _this._onInput();
          }
        }
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
      if (this.options.css) loadExternalAsset(this.options.css, 'css')

      // append font css to page
      if (this.options.fontcss) loadExternalAsset(this.options.fontcss, 'css')
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

      // listen to query events from Input before initializing it
      // might emit an event while initializing
      this.input.el.addEventListener('queryChanged', function (e) {
        _this.update(e.detail);
      });

      this.input.initialize();
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
      footer.innerHTML = 'powered by <a href="//koemei.com" target="_blank"><icon>' + getLogo() + '</icon></a>';
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

  function loadExternalAsset(filename, filetype){
    //if filename is a external JavaScript file
    if (filetype == 'js') {
      var fileref = document.createElement('script')
      fileref.setAttribute('type','text/javascript')
      fileref.setAttribute('src', filename)
    }
    //if filename is an external CSS file
    else if (filetype == 'css') {
      var fileref=document.createElement('link')
      fileref.setAttribute('rel', 'stylesheet')
      fileref.setAttribute('type', 'text/css')
      fileref.setAttribute('href', filename)
    }

    if (typeof fileref != 'undefined')
      document.getElementsByTagName('head')[0].appendChild(fileref)
  };

  function getLogo () {
    return '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" x="0px" y="0px" viewBox="0 0 668.487 99.661" style="enable-background:new 0 0 668.487 99.661;" xml:space="preserve"><g id="Calque_1"><path d="M178.48,0.416h-34.814h-0.009c-27.361,0-49.541,22.182-49.541,49.543c0,27.358,22.18,49.54,49.541,49.54   c0,0,0.005,0,0.009,0h34.814c27.358-0.003,49.536-22.181,49.536-49.54C228.017,22.598,205.838,0.419,178.48,0.416z M178.486,78.512   c-0.021,0-0.041,0-0.062,0h-34.72c-0.021,0-0.043,0-0.064,0c-15.775,0-28.564-12.793-28.564-28.563   c0-15.777,12.788-28.57,28.564-28.57c0.005,0,0.007,0,0.008,0v-0.017h34.826v0.017c0.005,0,0.01,0,0.013,0   c15.775,0,28.565,12.793,28.565,28.57C207.052,65.72,194.262,78.512,178.486,78.512z M258.242,40.758h78.573v18.385h-78.57   c3.83,11.265,14.495,19.369,27.053,19.369c0.021,0,0.04,0,0.061,0h53.259l9.95,20.986h-63.246h-0.011   c-27.358,0-49.538-22.181-49.538-49.54c0-27.361,22.18-49.543,49.538-49.543c0.003,0,0.008,0,0.011,0h63.246l-9.943,20.947h-53.318   v0.017c-0.004,0-0.005,0-0.009,0C272.736,21.379,262.068,29.491,258.242,40.758z M542.806,40.758h78.565v18.385h-78.565   c3.829,11.265,14.492,19.369,27.051,19.369c0.02,0,0.043,0,0.066,0h53.257l9.943,20.986h-63.24h-0.013   c-27.356,0-49.537-22.181-49.537-49.54c0-27.361,22.182-49.543,49.537-49.543c0,0,0.006,0,0.013,0h63.24l-9.936,20.947h-53.323   v0.017c-0.003,0-0.003,0-0.007,0C557.295,21.379,546.628,29.491,542.806,40.758z M668.487,0.416v14.206l-20.986,6.738V0.416   H668.487z M647.501,28.408l20.986-6.734v77.819h-20.986V28.408z M493.101,16.044l25.195,83.587H497.34l-18.02-59.405l-6.438-21.221   l-6.417,21.155l-14.665,48.342l-0.759,2.499c-1.975,4.819-6.577,8.293-12.023,8.63c-0.291,0.02-0.581,0.029-0.879,0.029   c-0.29,0-0.587-0.01-0.878-0.029c-5.579-0.347-10.273-3.979-12.165-8.986l-0.542-1.78l-14.774-48.714l-6.414-21.145l-6.444,21.234   l-18.016,59.392H357.95l25.084-83.227l1.047-3.453c2.77-6.913,9.174-11.974,16.85-12.823h4.579   c7.817,0.865,14.321,6.104,16.995,13.219l0.951,3.367l14.72,52.244l14.49-51.706c0,0,0.699-2.938,1.222-4.364   c2.786-6.88,9.171-11.914,16.823-12.76C471.46,0.043,472.229,0,472.999,0c0.775,0,1.541,0.043,2.291,0.128   c7.801,0.862,14.288,6.078,16.982,13.166L493.101,16.044z M0,0.413h21.02v98.894H0V0.413z M57.215,59.11l49.895,40.184H77.155   L32.777,63.551l-1.018-0.819c-3.58-3.12-5.843-7.712-5.843-12.829c0-5.034,2.187-9.557,5.662-12.67l1.385-1.116L77.131,0.508   h29.955L57.224,40.706l-11.409,9.197L57.215,59.11z" /></g></svg>';
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
