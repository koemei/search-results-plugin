(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("jQuery"));
	else if(typeof define === 'function' && define.amd)
		define(["jQuery"], factory);
	else if(typeof exports === 'object')
		exports["KoemeiSearchResults"] = factory(require("jQuery"));
	else
		root["KoemeiSearchResults"] = factory(root["jQuery"]);
})(this, function(__WEBPACK_EXTERNAL_MODULE_8__) {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	__webpack_require__(1);
	module.exports = __webpack_require__(3);


/***/ },
/* 1 */
/***/ function(module, exports) {

	// removed by extract-text-webpack-plugin

/***/ },
/* 2 */,
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	var KoemeiInput = __webpack_require__(4);
	var utils = __webpack_require__(5);
	var assign = __webpack_require__(6);
	var Bloodhound = __webpack_require__(7)

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
	          '<span class="koemei-blue time">' + utils.toHHMMSS(time) + '</span> ' +
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


/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	var utils = __webpack_require__(5);
	var assign = __webpack_require__(6);

	// constructor
	function KoemeiInput(el, o) {
	  this.el = el;
	  this.options = o;
	}

	// instance methods
	assign(KoemeiInput.prototype, {
	  // ### private
	  _initialize: function () {
	    this.query = '';
	    this.bind();
	    this._onInput(); // call once to take into account preset search values
	  },

	  _onInput: function() {
	    this._setQuery(this.getInputValue());
	  },

	  _setQuery: function(value, silent) {
	    var areEquivalent;
	    var hasDifferentWhitespace;

	    areEquivalent = utils.areQueriesEquivalent(value, this.query);
	    hasDifferentWhitespace = areEquivalent ? this.query.length !== value.length : false;

	    this.query = value;

	    if (!areEquivalent && this.query === '') this.emit('queryReset');

	    if (value.length < this.options.minLength) return;

	    if (!areEquivalent) {
	      this.emit('queryChanged', this.query);
	    } else if (hasDifferentWhitespace) {
	      this.emit('whitespaceChanged', this.query);
	    }
	  },

	  // ### public
	  initialize: function () {
	    this._initialize();
	  },

	  getInputValue: function() {
	    return this.el.value;
	  },

	  setInputValue: function(value) {
	    this.el.value = value;
	  },

	  resetInputValue: function() {
	    this.setInputValue(this.query);
	  },

	  emit: function(name, value) {
	    var event = new CustomEvent(name, {
	      'detail': value
	    });
	    this.el.dispatchEvent(event);
	  },

	  bind: function() {
	    var _this = this;

	    _this.el.onkeyup = function(e) {
	      if (!e) e = window.event;
	      var keyCode = e.keyCode || e.which;

	      if (_this.options.mode === 'onType') {
	        _this._onInput();
	      } else { // mode === 'onEnter'
	        if (keyCode === '13') { // Enter pressed
	          // Enter pressed
	          _this._onInput()
	        }
	      }
	    }
	  }

	});

	module.exports = KoemeiInput;


/***/ },
/* 5 */
/***/ function(module, exports) {

	function normalizeQuery(str) {
	  // strips leading whitespace and condenses all whitespace
	  return str.replace(/^\s*/g, '').replace(/\s{2,}/g, ' ');
	}

	exports.areQueriesEquivalent = function areQueriesEquivalent(a, b) {
	  return normalizeQuery(a) === normalizeQuery(b);
	}

	exports.logError = function logError(message) {
	  if (window.console) {
	    window.console.error(message);
	  }
	};

	exports.toHHMMSS = function toHHMMSS(length) {
	  var sec_num = parseInt(length, 10);
	  var hours = Math.floor(sec_num / 3600);
	  var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
	  var seconds = sec_num - (hours * 3600) - (minutes * 60);

	  if (hours < 10) {
	    hours = '0' + hours;
	  }
	  if (minutes < 10) {
	    minutes = '0' + minutes;
	  }
	  if (seconds < 10) {
	    seconds = '0' + seconds;
	  }

	  hours = (hours > 0) ? hours + ':' : '';
	  var time = hours + minutes + ':' + seconds;
	  return time;
	};

	exports.loadExternalAsset = function loadExternalAsset(filename, filetype){
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

	exports.noop = function noop () {

	};

	exports.addParameter = function addParameter(url, paramName, paramValue) {
	  if (!url) return '';
	  if (!paramValue || !paramName) return url;
	  var urlhash;
	  var replaceDuplicates = true;
	  if (url.indexOf('#') > 0) {
	    var cl = url.indexOf('#');
	    urlhash = url.substring(url.indexOf('#'), url.length);
	  } else {
	    urlhash = '';
	    cl = url.length;
	  }
	  var sourceUrl = url.substring(0, cl);

	  var urlParts = sourceUrl.split('?');
	  var newQueryString = "";

	  if (urlParts.length > 1) {
	    var parameters = urlParts[1].split('&');
	    for (var i = 0;
	      (i < parameters.length); i++) {
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
	  newQueryString += paramName + '=' + (paramValue ? paramValue : '');

	  return urlParts[0] + newQueryString + urlhash;
	};


/***/ },
/* 6 */
/***/ function(module, exports) {

	'use strict';
	var propIsEnumerable = Object.prototype.propertyIsEnumerable;

	function ToObject(val) {
		if (val == null) {
			throw new TypeError('Object.assign cannot be called with null or undefined');
		}

		return Object(val);
	}

	function ownEnumerableKeys(obj) {
		var keys = Object.getOwnPropertyNames(obj);

		if (Object.getOwnPropertySymbols) {
			keys = keys.concat(Object.getOwnPropertySymbols(obj));
		}

		return keys.filter(function (key) {
			return propIsEnumerable.call(obj, key);
		});
	}

	module.exports = Object.assign || function (target, source) {
		var from;
		var keys;
		var to = ToObject(target);

		for (var s = 1; s < arguments.length; s++) {
			from = arguments[s];
			keys = ownEnumerableKeys(Object(from));

			for (var i = 0; i < keys.length; i++) {
				to[keys[i]] = from[keys[i]];
			}
		}

		return to;
	};


/***/ },
/* 7 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;/*!
	 * typeahead.js 0.11.1
	 * https://github.com/twitter/typeahead.js
	 * Copyright 2013-2015 Twitter, Inc. and other contributors; Licensed MIT
	 */

	(function(root, factory) {
	    if (true) {
	        !(__WEBPACK_AMD_DEFINE_ARRAY__ = [ __webpack_require__(8) ], __WEBPACK_AMD_DEFINE_RESULT__ = function(a0) {
	            return root["Bloodhound"] = factory(a0);
	        }.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
	    } else if (typeof exports === "object") {
	        module.exports = factory(require("jquery"));
	    } else {
	        root["Bloodhound"] = factory(jQuery);
	    }
	})(this, function($) {
	    var _ = function() {
	        "use strict";
	        return {
	            isMsie: function() {
	                return /(msie|trident)/i.test(navigator.userAgent) ? navigator.userAgent.match(/(msie |rv:)(\d+(.\d+)?)/i)[2] : false;
	            },
	            isBlankString: function(str) {
	                return !str || /^\s*$/.test(str);
	            },
	            escapeRegExChars: function(str) {
	                return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
	            },
	            isString: function(obj) {
	                return typeof obj === "string";
	            },
	            isNumber: function(obj) {
	                return typeof obj === "number";
	            },
	            isArray: $.isArray,
	            isFunction: $.isFunction,
	            isObject: $.isPlainObject,
	            isUndefined: function(obj) {
	                return typeof obj === "undefined";
	            },
	            isElement: function(obj) {
	                return !!(obj && obj.nodeType === 1);
	            },
	            isJQuery: function(obj) {
	                return obj instanceof $;
	            },
	            toStr: function toStr(s) {
	                return _.isUndefined(s) || s === null ? "" : s + "";
	            },
	            bind: $.proxy,
	            each: function(collection, cb) {
	                $.each(collection, reverseArgs);
	                function reverseArgs(index, value) {
	                    return cb(value, index);
	                }
	            },
	            map: $.map,
	            filter: $.grep,
	            every: function(obj, test) {
	                var result = true;
	                if (!obj) {
	                    return result;
	                }
	                $.each(obj, function(key, val) {
	                    if (!(result = test.call(null, val, key, obj))) {
	                        return false;
	                    }
	                });
	                return !!result;
	            },
	            some: function(obj, test) {
	                var result = false;
	                if (!obj) {
	                    return result;
	                }
	                $.each(obj, function(key, val) {
	                    if (result = test.call(null, val, key, obj)) {
	                        return false;
	                    }
	                });
	                return !!result;
	            },
	            mixin: $.extend,
	            identity: function(x) {
	                return x;
	            },
	            clone: function(obj) {
	                return $.extend(true, {}, obj);
	            },
	            getIdGenerator: function() {
	                var counter = 0;
	                return function() {
	                    return counter++;
	                };
	            },
	            templatify: function templatify(obj) {
	                return $.isFunction(obj) ? obj : template;
	                function template() {
	                    return String(obj);
	                }
	            },
	            defer: function(fn) {
	                setTimeout(fn, 0);
	            },
	            debounce: function(func, wait, immediate) {
	                var timeout, result;
	                return function() {
	                    var context = this, args = arguments, later, callNow;
	                    later = function() {
	                        timeout = null;
	                        if (!immediate) {
	                            result = func.apply(context, args);
	                        }
	                    };
	                    callNow = immediate && !timeout;
	                    clearTimeout(timeout);
	                    timeout = setTimeout(later, wait);
	                    if (callNow) {
	                        result = func.apply(context, args);
	                    }
	                    return result;
	                };
	            },
	            throttle: function(func, wait) {
	                var context, args, timeout, result, previous, later;
	                previous = 0;
	                later = function() {
	                    previous = new Date();
	                    timeout = null;
	                    result = func.apply(context, args);
	                };
	                return function() {
	                    var now = new Date(), remaining = wait - (now - previous);
	                    context = this;
	                    args = arguments;
	                    if (remaining <= 0) {
	                        clearTimeout(timeout);
	                        timeout = null;
	                        previous = now;
	                        result = func.apply(context, args);
	                    } else if (!timeout) {
	                        timeout = setTimeout(later, remaining);
	                    }
	                    return result;
	                };
	            },
	            stringify: function(val) {
	                return _.isString(val) ? val : JSON.stringify(val);
	            },
	            noop: function() {}
	        };
	    }();
	    var VERSION = "0.11.1";
	    var tokenizers = function() {
	        "use strict";
	        return {
	            nonword: nonword,
	            whitespace: whitespace,
	            obj: {
	                nonword: getObjTokenizer(nonword),
	                whitespace: getObjTokenizer(whitespace)
	            }
	        };
	        function whitespace(str) {
	            str = _.toStr(str);
	            return str ? str.split(/\s+/) : [];
	        }
	        function nonword(str) {
	            str = _.toStr(str);
	            return str ? str.split(/\W+/) : [];
	        }
	        function getObjTokenizer(tokenizer) {
	            return function setKey(keys) {
	                keys = _.isArray(keys) ? keys : [].slice.call(arguments, 0);
	                return function tokenize(o) {
	                    var tokens = [];
	                    _.each(keys, function(k) {
	                        tokens = tokens.concat(tokenizer(_.toStr(o[k])));
	                    });
	                    return tokens;
	                };
	            };
	        }
	    }();
	    var LruCache = function() {
	        "use strict";
	        function LruCache(maxSize) {
	            this.maxSize = _.isNumber(maxSize) ? maxSize : 100;
	            this.reset();
	            if (this.maxSize <= 0) {
	                this.set = this.get = $.noop;
	            }
	        }
	        _.mixin(LruCache.prototype, {
	            set: function set(key, val) {
	                var tailItem = this.list.tail, node;
	                if (this.size >= this.maxSize) {
	                    this.list.remove(tailItem);
	                    delete this.hash[tailItem.key];
	                    this.size--;
	                }
	                if (node = this.hash[key]) {
	                    node.val = val;
	                    this.list.moveToFront(node);
	                } else {
	                    node = new Node(key, val);
	                    this.list.add(node);
	                    this.hash[key] = node;
	                    this.size++;
	                }
	            },
	            get: function get(key) {
	                var node = this.hash[key];
	                if (node) {
	                    this.list.moveToFront(node);
	                    return node.val;
	                }
	            },
	            reset: function reset() {
	                this.size = 0;
	                this.hash = {};
	                this.list = new List();
	            }
	        });
	        function List() {
	            this.head = this.tail = null;
	        }
	        _.mixin(List.prototype, {
	            add: function add(node) {
	                if (this.head) {
	                    node.next = this.head;
	                    this.head.prev = node;
	                }
	                this.head = node;
	                this.tail = this.tail || node;
	            },
	            remove: function remove(node) {
	                node.prev ? node.prev.next = node.next : this.head = node.next;
	                node.next ? node.next.prev = node.prev : this.tail = node.prev;
	            },
	            moveToFront: function(node) {
	                this.remove(node);
	                this.add(node);
	            }
	        });
	        function Node(key, val) {
	            this.key = key;
	            this.val = val;
	            this.prev = this.next = null;
	        }
	        return LruCache;
	    }();
	    var PersistentStorage = function() {
	        "use strict";
	        var LOCAL_STORAGE;
	        try {
	            LOCAL_STORAGE = window.localStorage;
	            LOCAL_STORAGE.setItem("~~~", "!");
	            LOCAL_STORAGE.removeItem("~~~");
	        } catch (err) {
	            LOCAL_STORAGE = null;
	        }
	        function PersistentStorage(namespace, override) {
	            this.prefix = [ "__", namespace, "__" ].join("");
	            this.ttlKey = "__ttl__";
	            this.keyMatcher = new RegExp("^" + _.escapeRegExChars(this.prefix));
	            this.ls = override || LOCAL_STORAGE;
	            !this.ls && this._noop();
	        }
	        _.mixin(PersistentStorage.prototype, {
	            _prefix: function(key) {
	                return this.prefix + key;
	            },
	            _ttlKey: function(key) {
	                return this._prefix(key) + this.ttlKey;
	            },
	            _noop: function() {
	                this.get = this.set = this.remove = this.clear = this.isExpired = _.noop;
	            },
	            _safeSet: function(key, val) {
	                try {
	                    this.ls.setItem(key, val);
	                } catch (err) {
	                    if (err.name === "QuotaExceededError") {
	                        this.clear();
	                        this._noop();
	                    }
	                }
	            },
	            get: function(key) {
	                if (this.isExpired(key)) {
	                    this.remove(key);
	                }
	                return decode(this.ls.getItem(this._prefix(key)));
	            },
	            set: function(key, val, ttl) {
	                if (_.isNumber(ttl)) {
	                    this._safeSet(this._ttlKey(key), encode(now() + ttl));
	                } else {
	                    this.ls.removeItem(this._ttlKey(key));
	                }
	                return this._safeSet(this._prefix(key), encode(val));
	            },
	            remove: function(key) {
	                this.ls.removeItem(this._ttlKey(key));
	                this.ls.removeItem(this._prefix(key));
	                return this;
	            },
	            clear: function() {
	                var i, keys = gatherMatchingKeys(this.keyMatcher);
	                for (i = keys.length; i--; ) {
	                    this.remove(keys[i]);
	                }
	                return this;
	            },
	            isExpired: function(key) {
	                var ttl = decode(this.ls.getItem(this._ttlKey(key)));
	                return _.isNumber(ttl) && now() > ttl ? true : false;
	            }
	        });
	        return PersistentStorage;
	        function now() {
	            return new Date().getTime();
	        }
	        function encode(val) {
	            return JSON.stringify(_.isUndefined(val) ? null : val);
	        }
	        function decode(val) {
	            return $.parseJSON(val);
	        }
	        function gatherMatchingKeys(keyMatcher) {
	            var i, key, keys = [], len = LOCAL_STORAGE.length;
	            for (i = 0; i < len; i++) {
	                if ((key = LOCAL_STORAGE.key(i)).match(keyMatcher)) {
	                    keys.push(key.replace(keyMatcher, ""));
	                }
	            }
	            return keys;
	        }
	    }();
	    var Transport = function() {
	        "use strict";
	        var pendingRequestsCount = 0, pendingRequests = {}, maxPendingRequests = 6, sharedCache = new LruCache(10);
	        function Transport(o) {
	            o = o || {};
	            this.cancelled = false;
	            this.lastReq = null;
	            this._send = o.transport;
	            this._get = o.limiter ? o.limiter(this._get) : this._get;
	            this._cache = o.cache === false ? new LruCache(0) : sharedCache;
	        }
	        Transport.setMaxPendingRequests = function setMaxPendingRequests(num) {
	            maxPendingRequests = num;
	        };
	        Transport.resetCache = function resetCache() {
	            sharedCache.reset();
	        };
	        _.mixin(Transport.prototype, {
	            _fingerprint: function fingerprint(o) {
	                o = o || {};
	                return o.url + o.type + $.param(o.data || {});
	            },
	            _get: function(o, cb) {
	                var that = this, fingerprint, jqXhr;
	                fingerprint = this._fingerprint(o);
	                if (this.cancelled || fingerprint !== this.lastReq) {
	                    return;
	                }
	                if (jqXhr = pendingRequests[fingerprint]) {
	                    jqXhr.done(done).fail(fail);
	                } else if (pendingRequestsCount < maxPendingRequests) {
	                    pendingRequestsCount++;
	                    pendingRequests[fingerprint] = this._send(o).done(done).fail(fail).always(always);
	                } else {
	                    this.onDeckRequestArgs = [].slice.call(arguments, 0);
	                }
	                function done(resp) {
	                    cb(null, resp);
	                    that._cache.set(fingerprint, resp);
	                }
	                function fail() {
	                    cb(true);
	                }
	                function always() {
	                    pendingRequestsCount--;
	                    delete pendingRequests[fingerprint];
	                    if (that.onDeckRequestArgs) {
	                        that._get.apply(that, that.onDeckRequestArgs);
	                        that.onDeckRequestArgs = null;
	                    }
	                }
	            },
	            get: function(o, cb) {
	                var resp, fingerprint;
	                cb = cb || $.noop;
	                o = _.isString(o) ? {
	                    url: o
	                } : o || {};
	                fingerprint = this._fingerprint(o);
	                this.cancelled = false;
	                this.lastReq = fingerprint;
	                if (resp = this._cache.get(fingerprint)) {
	                    cb(null, resp);
	                } else {
	                    this._get(o, cb);
	                }
	            },
	            cancel: function() {
	                this.cancelled = true;
	            }
	        });
	        return Transport;
	    }();
	    var SearchIndex = window.SearchIndex = function() {
	        "use strict";
	        var CHILDREN = "c", IDS = "i";
	        function SearchIndex(o) {
	            o = o || {};
	            if (!o.datumTokenizer || !o.queryTokenizer) {
	                $.error("datumTokenizer and queryTokenizer are both required");
	            }
	            this.identify = o.identify || _.stringify;
	            this.datumTokenizer = o.datumTokenizer;
	            this.queryTokenizer = o.queryTokenizer;
	            this.reset();
	        }
	        _.mixin(SearchIndex.prototype, {
	            bootstrap: function bootstrap(o) {
	                this.datums = o.datums;
	                this.trie = o.trie;
	            },
	            add: function(data) {
	                var that = this;
	                data = _.isArray(data) ? data : [ data ];
	                _.each(data, function(datum) {
	                    var id, tokens;
	                    that.datums[id = that.identify(datum)] = datum;
	                    tokens = normalizeTokens(that.datumTokenizer(datum));
	                    _.each(tokens, function(token) {
	                        var node, chars, ch;
	                        node = that.trie;
	                        chars = token.split("");
	                        while (ch = chars.shift()) {
	                            node = node[CHILDREN][ch] || (node[CHILDREN][ch] = newNode());
	                            node[IDS].push(id);
	                        }
	                    });
	                });
	            },
	            get: function get(ids) {
	                var that = this;
	                return _.map(ids, function(id) {
	                    return that.datums[id];
	                });
	            },
	            search: function search(query) {
	                var that = this, tokens, matches;
	                tokens = normalizeTokens(this.queryTokenizer(query));
	                _.each(tokens, function(token) {
	                    var node, chars, ch, ids;
	                    if (matches && matches.length === 0) {
	                        return false;
	                    }
	                    node = that.trie;
	                    chars = token.split("");
	                    while (node && (ch = chars.shift())) {
	                        node = node[CHILDREN][ch];
	                    }
	                    if (node && chars.length === 0) {
	                        ids = node[IDS].slice(0);
	                        matches = matches ? getIntersection(matches, ids) : ids;
	                    } else {
	                        matches = [];
	                        return false;
	                    }
	                });
	                return matches ? _.map(unique(matches), function(id) {
	                    return that.datums[id];
	                }) : [];
	            },
	            all: function all() {
	                var values = [];
	                for (var key in this.datums) {
	                    values.push(this.datums[key]);
	                }
	                return values;
	            },
	            reset: function reset() {
	                this.datums = {};
	                this.trie = newNode();
	            },
	            serialize: function serialize() {
	                return {
	                    datums: this.datums,
	                    trie: this.trie
	                };
	            }
	        });
	        return SearchIndex;
	        function normalizeTokens(tokens) {
	            tokens = _.filter(tokens, function(token) {
	                return !!token;
	            });
	            tokens = _.map(tokens, function(token) {
	                return token.toLowerCase();
	            });
	            return tokens;
	        }
	        function newNode() {
	            var node = {};
	            node[IDS] = [];
	            node[CHILDREN] = {};
	            return node;
	        }
	        function unique(array) {
	            var seen = {}, uniques = [];
	            for (var i = 0, len = array.length; i < len; i++) {
	                if (!seen[array[i]]) {
	                    seen[array[i]] = true;
	                    uniques.push(array[i]);
	                }
	            }
	            return uniques;
	        }
	        function getIntersection(arrayA, arrayB) {
	            var ai = 0, bi = 0, intersection = [];
	            arrayA = arrayA.sort();
	            arrayB = arrayB.sort();
	            var lenArrayA = arrayA.length, lenArrayB = arrayB.length;
	            while (ai < lenArrayA && bi < lenArrayB) {
	                if (arrayA[ai] < arrayB[bi]) {
	                    ai++;
	                } else if (arrayA[ai] > arrayB[bi]) {
	                    bi++;
	                } else {
	                    intersection.push(arrayA[ai]);
	                    ai++;
	                    bi++;
	                }
	            }
	            return intersection;
	        }
	    }();
	    var Prefetch = function() {
	        "use strict";
	        var keys;
	        keys = {
	            data: "data",
	            protocol: "protocol",
	            thumbprint: "thumbprint"
	        };
	        function Prefetch(o) {
	            this.url = o.url;
	            this.ttl = o.ttl;
	            this.cache = o.cache;
	            this.prepare = o.prepare;
	            this.transform = o.transform;
	            this.transport = o.transport;
	            this.thumbprint = o.thumbprint;
	            this.storage = new PersistentStorage(o.cacheKey);
	        }
	        _.mixin(Prefetch.prototype, {
	            _settings: function settings() {
	                return {
	                    url: this.url,
	                    type: "GET",
	                    dataType: "json"
	                };
	            },
	            store: function store(data) {
	                if (!this.cache) {
	                    return;
	                }
	                this.storage.set(keys.data, data, this.ttl);
	                this.storage.set(keys.protocol, location.protocol, this.ttl);
	                this.storage.set(keys.thumbprint, this.thumbprint, this.ttl);
	            },
	            fromCache: function fromCache() {
	                var stored = {}, isExpired;
	                if (!this.cache) {
	                    return null;
	                }
	                stored.data = this.storage.get(keys.data);
	                stored.protocol = this.storage.get(keys.protocol);
	                stored.thumbprint = this.storage.get(keys.thumbprint);
	                isExpired = stored.thumbprint !== this.thumbprint || stored.protocol !== location.protocol;
	                return stored.data && !isExpired ? stored.data : null;
	            },
	            fromNetwork: function(cb) {
	                var that = this, settings;
	                if (!cb) {
	                    return;
	                }
	                settings = this.prepare(this._settings());
	                this.transport(settings).fail(onError).done(onResponse);
	                function onError() {
	                    cb(true);
	                }
	                function onResponse(resp) {
	                    cb(null, that.transform(resp));
	                }
	            },
	            clear: function clear() {
	                this.storage.clear();
	                return this;
	            }
	        });
	        return Prefetch;
	    }();
	    var Remote = function() {
	        "use strict";
	        function Remote(o) {
	            this.url = o.url;
	            this.prepare = o.prepare;
	            this.transform = o.transform;
	            this.transport = new Transport({
	                cache: o.cache,
	                limiter: o.limiter,
	                transport: o.transport
	            });
	        }
	        _.mixin(Remote.prototype, {
	            _settings: function settings() {
	                return {
	                    url: this.url,
	                    type: "GET",
	                    dataType: "json"
	                };
	            },
	            get: function get(query, cb) {
	                var that = this, settings;
	                if (!cb) {
	                    return;
	                }
	                query = query || "";
	                settings = this.prepare(query, this._settings());
	                return this.transport.get(settings, onResponse);
	                function onResponse(err, resp) {
	                    err ? cb([]) : cb(that.transform(resp));
	                }
	            },
	            cancelLastRequest: function cancelLastRequest() {
	                this.transport.cancel();
	            }
	        });
	        return Remote;
	    }();
	    var oParser = function() {
	        "use strict";
	        return function parse(o) {
	            var defaults, sorter;
	            defaults = {
	                initialize: true,
	                identify: _.stringify,
	                datumTokenizer: null,
	                queryTokenizer: null,
	                sufficient: 5,
	                sorter: null,
	                local: [],
	                prefetch: null,
	                remote: null
	            };
	            o = _.mixin(defaults, o || {});
	            !o.datumTokenizer && $.error("datumTokenizer is required");
	            !o.queryTokenizer && $.error("queryTokenizer is required");
	            sorter = o.sorter;
	            o.sorter = sorter ? function(x) {
	                return x.sort(sorter);
	            } : _.identity;
	            o.local = _.isFunction(o.local) ? o.local() : o.local;
	            o.prefetch = parsePrefetch(o.prefetch);
	            o.remote = parseRemote(o.remote);
	            return o;
	        };
	        function parsePrefetch(o) {
	            var defaults;
	            if (!o) {
	                return null;
	            }
	            defaults = {
	                url: null,
	                ttl: 24 * 60 * 60 * 1e3,
	                cache: true,
	                cacheKey: null,
	                thumbprint: "",
	                prepare: _.identity,
	                transform: _.identity,
	                transport: null
	            };
	            o = _.isString(o) ? {
	                url: o
	            } : o;
	            o = _.mixin(defaults, o);
	            !o.url && $.error("prefetch requires url to be set");
	            o.transform = o.filter || o.transform;
	            o.cacheKey = o.cacheKey || o.url;
	            o.thumbprint = VERSION + o.thumbprint;
	            o.transport = o.transport ? callbackToDeferred(o.transport) : $.ajax;
	            return o;
	        }
	        function parseRemote(o) {
	            var defaults;
	            if (!o) {
	                return;
	            }
	            defaults = {
	                url: null,
	                cache: true,
	                prepare: null,
	                replace: null,
	                wildcard: null,
	                limiter: null,
	                rateLimitBy: "debounce",
	                rateLimitWait: 300,
	                transform: _.identity,
	                transport: null
	            };
	            o = _.isString(o) ? {
	                url: o
	            } : o;
	            o = _.mixin(defaults, o);
	            !o.url && $.error("remote requires url to be set");
	            o.transform = o.filter || o.transform;
	            o.prepare = toRemotePrepare(o);
	            o.limiter = toLimiter(o);
	            o.transport = o.transport ? callbackToDeferred(o.transport) : $.ajax;
	            delete o.replace;
	            delete o.wildcard;
	            delete o.rateLimitBy;
	            delete o.rateLimitWait;
	            return o;
	        }
	        function toRemotePrepare(o) {
	            var prepare, replace, wildcard;
	            prepare = o.prepare;
	            replace = o.replace;
	            wildcard = o.wildcard;
	            if (prepare) {
	                return prepare;
	            }
	            if (replace) {
	                prepare = prepareByReplace;
	            } else if (o.wildcard) {
	                prepare = prepareByWildcard;
	            } else {
	                prepare = idenityPrepare;
	            }
	            return prepare;
	            function prepareByReplace(query, settings) {
	                settings.url = replace(settings.url, query);
	                return settings;
	            }
	            function prepareByWildcard(query, settings) {
	                settings.url = settings.url.replace(wildcard, encodeURIComponent(query));
	                return settings;
	            }
	            function idenityPrepare(query, settings) {
	                return settings;
	            }
	        }
	        function toLimiter(o) {
	            var limiter, method, wait;
	            limiter = o.limiter;
	            method = o.rateLimitBy;
	            wait = o.rateLimitWait;
	            if (!limiter) {
	                limiter = /^throttle$/i.test(method) ? throttle(wait) : debounce(wait);
	            }
	            return limiter;
	            function debounce(wait) {
	                return function debounce(fn) {
	                    return _.debounce(fn, wait);
	                };
	            }
	            function throttle(wait) {
	                return function throttle(fn) {
	                    return _.throttle(fn, wait);
	                };
	            }
	        }
	        function callbackToDeferred(fn) {
	            return function wrapper(o) {
	                var deferred = $.Deferred();
	                fn(o, onSuccess, onError);
	                return deferred;
	                function onSuccess(resp) {
	                    _.defer(function() {
	                        deferred.resolve(resp);
	                    });
	                }
	                function onError(err) {
	                    _.defer(function() {
	                        deferred.reject(err);
	                    });
	                }
	            };
	        }
	    }();
	    var Bloodhound = function() {
	        "use strict";
	        var old;
	        old = window && window.Bloodhound;
	        function Bloodhound(o) {
	            o = oParser(o);
	            this.sorter = o.sorter;
	            this.identify = o.identify;
	            this.sufficient = o.sufficient;
	            this.local = o.local;
	            this.remote = o.remote ? new Remote(o.remote) : null;
	            this.prefetch = o.prefetch ? new Prefetch(o.prefetch) : null;
	            this.index = new SearchIndex({
	                identify: this.identify,
	                datumTokenizer: o.datumTokenizer,
	                queryTokenizer: o.queryTokenizer
	            });
	            o.initialize !== false && this.initialize();
	        }
	        Bloodhound.noConflict = function noConflict() {
	            window && (window.Bloodhound = old);
	            return Bloodhound;
	        };
	        Bloodhound.tokenizers = tokenizers;
	        _.mixin(Bloodhound.prototype, {
	            __ttAdapter: function ttAdapter() {
	                var that = this;
	                return this.remote ? withAsync : withoutAsync;
	                function withAsync(query, sync, async) {
	                    return that.search(query, sync, async);
	                }
	                function withoutAsync(query, sync) {
	                    return that.search(query, sync);
	                }
	            },
	            _loadPrefetch: function loadPrefetch() {
	                var that = this, deferred, serialized;
	                deferred = $.Deferred();
	                if (!this.prefetch) {
	                    deferred.resolve();
	                } else if (serialized = this.prefetch.fromCache()) {
	                    this.index.bootstrap(serialized);
	                    deferred.resolve();
	                } else {
	                    this.prefetch.fromNetwork(done);
	                }
	                return deferred.promise();
	                function done(err, data) {
	                    if (err) {
	                        return deferred.reject();
	                    }
	                    that.add(data);
	                    that.prefetch.store(that.index.serialize());
	                    deferred.resolve();
	                }
	            },
	            _initialize: function initialize() {
	                var that = this, deferred;
	                this.clear();
	                (this.initPromise = this._loadPrefetch()).done(addLocalToIndex);
	                return this.initPromise;
	                function addLocalToIndex() {
	                    that.add(that.local);
	                }
	            },
	            initialize: function initialize(force) {
	                return !this.initPromise || force ? this._initialize() : this.initPromise;
	            },
	            add: function add(data) {
	                this.index.add(data);
	                return this;
	            },
	            get: function get(ids) {
	                ids = _.isArray(ids) ? ids : [].slice.call(arguments);
	                return this.index.get(ids);
	            },
	            search: function search(query, sync, async) {
	                var that = this, local;
	                local = this.sorter(this.index.search(query));
	                sync(this.remote ? local.slice() : local);
	                if (this.remote && local.length < this.sufficient) {
	                    this.remote.get(query, processRemote);
	                } else if (this.remote) {
	                    this.remote.cancelLastRequest();
	                }
	                return this;
	                function processRemote(remote) {
	                    var nonDuplicates = [];
	                    _.each(remote, function(r) {
	                        !_.some(local, function(l) {
	                            return that.identify(r) === that.identify(l);
	                        }) && nonDuplicates.push(r);
	                    });
	                    async && async(nonDuplicates);
	                }
	            },
	            all: function all() {
	                return this.index.all();
	            },
	            clear: function clear() {
	                this.index.reset();
	                return this;
	            },
	            clearPrefetchCache: function clearPrefetchCache() {
	                this.prefetch && this.prefetch.clear();
	                return this;
	            },
	            clearRemoteCache: function clearRemoteCache() {
	                Transport.resetCache();
	                return this;
	            },
	            ttAdapter: function ttAdapter() {
	                return this.__ttAdapter();
	            }
	        });
	        return Bloodhound;
	    }();
	    return Bloodhound;
	});

/***/ },
/* 8 */
/***/ function(module, exports) {

	module.exports = __WEBPACK_EXTERNAL_MODULE_8__;

/***/ }
/******/ ])
});
;