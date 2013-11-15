(function(){
  var ssa = function(){
    //
  };

  ssa.parse = function(str){
    // Removes UTF BOM
    str = str.replace(/^\uFEFF/, '');

    // Split in lines
    var lines = str.split(/(?:\r\n|\r|\n)/gm),
      attrs = [],
      current;

    var obj = {
      info: {},
      styles: {},
      events: []
    };

    forEach(lines, function(line, i){
      if (line[0] === ';') return;

      var group = line.match(/^\[(.*)\]$/);

      if (group){
        current = group[1];
        return;
      }

      var match = line.match(/(.*?)\s*:\s*(.*)/);

      if (!match) return;

      var key = lowerCamelCase(match[1]),
        value = match[2],
        split = value.split(/\s*,\s*/);

      switch (current){
        case 'Script Info':
          obj.info[key] = value;
          break;

        case 'V4 Styles':
        case 'V4+ Styles':
          if (key === 'format'){
            attrs = parseAttrList(value);
          } else if (attrs.length){
            var data = parseStyle(mapAttrs(split, attrs));
            obj.styles[data.name] = data;
          }

          break;

        case 'Events':
          if (key === 'format'){
            attrs = parseAttrList(value);
          } else if (attrs.length){
            obj.events.push(parseEvent(mapAttrs(split, attrs)));
          }

          break;
      }
    });

    parseInfo(obj.info);

    return obj;
  };

  var parseInfo = function(obj){
    forEach([
      'playResX', 'playResY', 'wrapStyle', 'scrollPosition', 'activeLine',
      'videoZoomPercent', 'videoPosition', 'videoZoom'
    ], function(key){
      if (obj[key]) obj[key] = +obj[key];
    });

    forEach(['scaledBorderAndShadow'], function(key){
      if (obj[key]) obj[key] = obj[key] == 'yes';
    });

    obj.isASS = obj.scriptType == 'v4.00+';

    return obj;
  };

  var parseAttrList = function(str){
    var split = str.split(/\s*,\s*/),
      arr = [];

    forEach(split, function(item){
      arr.push(lowerCamelCase(item));
    });

    return arr;
  };

  var lowerCamelCase = function(str){
    var arr = str.split(' '),
      firstWord = arr[0];

    arr[0] = firstWord[0].toLowerCase() + firstWord.substring(1, firstWord.length);

    return arr.join('');
  };

  var mapAttrs = function(arr, attrs){
    var obj = {};

    forEach(attrs, function(attr, i){
      obj[attr] = arr[i];
    });

    return obj;
  };

  var parseStyle = function(obj){
    forEach([
      'fontsize', 'spacing', 'angle', 'borderStyle', 'outline', 'outline',
      'shadow', 'alignment', 'marginL', 'marginR', 'marginV', 'encoding'
    ], function(key){
      if (obj[key]) obj[key] = +obj[key];
    });

    forEach(['scaleX', 'scaleY'], function(key){
      if (obj[key]) obj[key] = +obj[key] / 100;
    });

    forEach(['bold', 'italic', 'underline', 'strikeOut'], function(key){
      if (obj[key]) obj[key] = obj[key] == -1;
    });

    forEach([
      'primaryColour', 'secondaryColour', 'outlineColour', 'backColour'
    ], function(key){
      if (obj[key]) obj[key] = parseColor(obj[key]);
    });

    return obj;
  };

  var parseEvent = function(obj){
    forEach(['marked', 'layer', 'marginL', 'marginR', 'marginV'], function(key){
      if (obj[key]) obj[key] = +obj[key];
    });

    forEach(['start', 'end'], function(key){
      if (obj[key]) obj[key] = toSeconds(obj[key]);
    });

    return obj;
  };

  var toSeconds = function(str){
    var split = str.split(':');

    return +(parseInt(split[0], 10) * 3600 + parseInt(split[1], 10) * 60 + parseFloat(split[2], 10)).toFixed(2);
  };

  var parseColor = function(str){
    str = str.replace(/^&H/, '');

    if (str.length == 6){
      str = '00' + str;
    } else {
      if (str.length == 3){
        str = '0' + str;
      }

      if (str.length == 4){
        var newStr = '';

        for (var i = 0; i <= 3; i++){
          newStr += str[i] + str[i];
        }

        str = newStr;
      }
    }

    return [
      parseInt(str.substring(6, 8), 16), // red
      parseInt(str.substring(4, 6), 16), // green
      parseInt(str.substring(2, 4), 16), // blue
      (255 - parseInt(str.substring(0, 2), 16)) / 255 // alpha
    ]
  };

  var forEach = function(arr, iterator){
    for (var i = 0, len = arr.length; i < len; i++){
      iterator(arr[i], i);
    }
  };

  if (typeof define !== 'undefined' && define.amd){
    define([], function(){
      return ssa;
    });
  } else if (typeof module !== 'undefined' && module.exports){
    module.exports = ssa;
  } else {
    this.ssa = ssa;
  }
})();