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
