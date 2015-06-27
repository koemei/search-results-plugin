var KomeiSearchResults = (function() {
  'use strict';

  var old = window && window.KomeiSearchResults;

  var logError = function( message ) {
    if (window.console) {
      window.console.error( message );
    }
  };

  // constructor
  function KomeiSearchResults(o) {
    // come up with a way to extend defaults
    this.options = this.defaults();
    // for now manually override key and disregard all others
    this.options.key = o.key
    this.EMBED_KEY = this.options.key || '';

    if (!this._validateEmbedKey()) return;
    this._initialize();
  }

  // static methods
  KomeiSearchResults.noConflict = function () {
    window && (window.KomeiSearchResults = old);
    return KomeiSearchResults;
  };

  // instance methods
  _.mixin(KomeiSearchResults.prototype, {
    defaults: function () {
      return {
        domain: 'https://koemei.com',
        searchAPI: '/api/search/files',
        prefetchAPI: '/api/files',
        prefetch: true,
        showTranscript: true,
        target: 'self',
        openOnSelect: false,
        limit: 10,
        minLength: 1,
        css: 'http://iplusstd.com/koemei/search-input-plugin/dist/style.min.css',
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
      // append font css to page
      if (this.options.fontcss) $('head').append('<link rel="stylesheet" href="' +
        this.options.fontcss + '" type="text/css" />');

      // append plugin css to page
      if (this.options.css) $('head').append('<link rel="stylesheet" href="' +
        this.options.css + '" type="text/css" />');
    },
    _initialize: function () {
      // in case this is a reinitialization, clear previous data
      this.clear();

      this._addCSS();

      console.log('initialized')
    },

    // ### public

    initialize: function (force) {
      return this._initialize();
    },

    clear: function () {
      console.log("cleared")
    }
  });

  return KomeiSearchResults;
})();
