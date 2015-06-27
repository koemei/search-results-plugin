(function($, window, undefined) {
  $.KoemeiSearchInputPlugin = function (options, element) {
    this.$el = $(element);
    this._init(options);
  };

  $.KoemeiSearchInputPlugin.defaults = {
    domain: 'https://koemei.com',
    searchAPI: '/api/search/files',
    prefetchAPI: '/api/files',
    prefetch: true,
    showTranscript: true,
    target: 'self',
    openOnSelect: false,
    limit: 10,
    minLength: 1,
    hint: true,
    highlight: true,
    width: 500,
    align: 'default', // 'default', 'left', 'right'
    css: 'http://iplusstd.com/koemei/search-input-plugin/dist/style.min.css',
    fontcss: 'https://koemei.com/css/font.css'
  };

  var toHHMMSS = function (length) {
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

  var addParameter = function (url, paramName, paramValue) {
    if(!url) return '';
    if(!paramValue || !paramName) return url;

    var replaceDuplicates = true;
    if (url.indexOf('#') > 0) {
      var cl = url.indexOf('#');
      urlhash = url.substring(url.indexOf('#'),url.length);
    } else {
      urlhash = '';
      cl = url.length;
    }
    sourceUrl = url.substring(0,cl);

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

  $.KoemeiSearchInputPlugin.prototype = {
    _init : function (options) {
      this.options = $.extend( true, {}, $.KoemeiSearchInputPlugin.defaults, options);

      this.EMBED_KEY = this.options.key || '';

      if (!this._validateEmbedKey()) return;

      this._addCSS();
      this._initTypeAhead();
      this._positionEl();
    },
    _validateEmbedKey: function () {
      if (!this.EMBED_KEY || this.EMBED_KEY === '') {
        logError('Embed Key is required');
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
    // properly position the drop down list based on options
    _positionEl: function () {
      var inputSize = this.$el.outerWidth();
      var dropdownWidth = this.options.width;
      var offset = this.$el.offset().left;

      if (this.options.align === 'left') {
        return; // user asked for absolute left positioning. CSS takes care of this.
      }

      if (this.options.align === 'right') {
        var shiftLeft = dropdownWidth - inputSize;

        $('body').append('<style>.koemei-menu{left: -' + shiftLeft + 'px !important;}</style>');
        return;
      }

      // else align is default

      if (inputSize >= dropdownWidth) return; // will fit

      var space = window.innerWidth - offset;

      if (space >= dropdownWidth) return; // will fit

      var shiftLeft =  dropdownWidth - space + 8;
      $('body').append('<style>.koemei-menu{left: -' + shiftLeft + 'px !important;}</style>');
    },
    _initTypeAhead: function () {
      var _this = this;
      var key = _this.EMBED_KEY;

      // suggestion engine options
      var engineOptions = {
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
      var engine = new Bloodhound(engineOptions);

      engine.initialize();

      this.$el.typeahead({
        hint: this.options.hint,
        highlight: this.options.highlight,
        minLength: _this.options.minLength,
        limit: _this.options.limit,
        classNames: {
          suggestion: 'koemei-suggestion',
          cursor: 'koemei-cursor',
          highlight: 'koemei-highlight',
          empty: 'koemei-empty',
          menu: 'koemei-menu',
          hint: 'koemei-hint',
          input: 'koemei-input',
          open: 'koemei-open',
          dataset: 'koemei-dataset',
        }
      },
      {
        name: 'koemeiSearch',
        source: engine.ttAdapter(),
        templates: {
          empty: '<div class="koemei-empty">No videos found. Try another query.</div',
          suggestion: function (result) {
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
          }
        },
        display: function (result) {
          return result.name;
        }
      }).on('typeahead:selected', function (ev, result) {
        if (_this.options.openOnSelect) {
          if (_this.options.target === '_blank') {
            window.open(result.srcUrl, '_blank');
          } else {
            window.location.href = result.srcUrl;
          }
        }
      })
    }
  };

  var logError = function( message ) {
    if (window.console) {
      window.console.error( message );
    }
  };

  $.fn.KoemeiSearchInput = function (options) {
    var instance = $.data(this, 'KoemeiSearchInput');

    if (typeof options === 'string' ) {
      var args = Array.prototype.slice.call( arguments, 1 );
      this.each(function() {
        if (!instance) {
          logError( "cannot call methods on koemei Search Input prior to initialization; " +
          "attempted to call method '" + options + "'" );
          return;
        }
        if (!$.isFunction(instance[options]) || options.charAt(0) === "_") {
          logError( "no such method '" + options + "' for koemei Search Input instance" );
          return;
        }
        instance[ options ].apply(instance, args);
      });
    } else {
      this.each(function() {
        if (instance) {
          instance._init();
        } else {
          instance = $.data( this, 'KoemeiSearchInput', new $.KoemeiSearchInputPlugin( options, this ) );
        }
      });
    }
    return instance;
  };
})(jQuery, window);
