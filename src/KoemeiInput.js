var utils = require('./utils');
var assign = require('object-assign');

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
