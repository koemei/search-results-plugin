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
