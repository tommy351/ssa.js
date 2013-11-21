ssa.extend(function(ssa){
  var util = ssa.util = {};

  var isArray = util.isArray = Array.isArray || function(arr){
    return toString.call(arr) == '[object Array]';
  };

  var isObject = util.isObject = function(obj){
    return toString.call(obj) == '[object Object]';
  };

  var each = util.each = function(obj, iterator){
    if (isArray(obj)){
      for (var i = 0, len = obj.length; i < len; i++){
        var _return = iterator(obj[i], i);
        if (_return === false) break;
      }
    } else if (isObject(obj)){
      for (var i in obj){
        if (obj.hasOwnProperty(i)){
          var _return = iterator(obj[i], i);
          if (_return === false) break;
        }
      }
    }
  };

  var keys = util.keys = Object.keys || function(obj){
    var arr = [];

    for (var i in obj){
      if (obj.hasOwnProperty(i)){
        arr.push(i);
      }
    }

    return arr;
  };

  var extend = util.extend = function(){
    var args = Array.prototype.slice.call(arguments),
      obj = args.shift();

    each(args, function(data){
      if (!isObject(data)) return;

      each(data, function(val, key){
        if (isObject(val)){
          if (!obj.hasOwnProperty(key)) obj[key] = {};
          extend(obj[key], val);
        } else {
          obj[key] = val;
        }
      });
    });

    return obj;
  };

  util.lowerCamelCase = function(str){
    var arr = str.split(/(\s|-|_)+/),
      firstWord = arr[0];

    arr[0] = firstWord[0].toLowerCase() + firstWord.substring(1, firstWord.length);

    return arr.join('');
  };

  util.toHexColor = function(color){
    return 'rgb(' + color.r + ', ' + color.g + ', ' + color.b + ')';
  };

  util.toRgba = function(color){
    return 'rgba(' + color.r + ', ' + color.g + ', ' + color.b + ', ' + color.a + ')';
  };

  util.parseAbgr = function(str){
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

    return {
      r: parseInt(str.substring(6, 8), 16),
      g: parseInt(str.substring(4, 6), 16),
      b: parseInt(str.substring(2, 4), 16),
      a: parseOpacity(str.substring(0, 2))
    };
  };

  var parseOpacity = util.parseOpacity = function(str){
    return (255 - parseInt(str, 16)) / 255
  };

  util.parseAlignment = function(alignment, isASS){
    alignment = +alignment;

    var textAlign = 'center',
      textBaseline = 'bottom';

    if (isASS){
      // Horizontal alignment
      switch (alignment % 3){
        case 1:
          textAlign = 'left';
          break;

        case 0:
          textAlign = 'right';
          break;

        default:
          textAlign = 'center';
      }

      // Vertical alignment
      switch (parseInt((alignment - 1) / 3)){
        case 2:
          textBaseline = 'top';
          break;

        case 1:
          textBaseline = 'center';
          break;

        default:
          textBaseline = 'bottom';
      }
    } else {
      // Horizontal Alignment
      switch (alignment % 4){
        case 1:
          textAlign = 'left';
          break;

        case 3:
          textAlign = 'right';
          break;

        default:
          textAlign = 'center';
      }

      // Vertical alignment
      switch (parseInt(alignment / 4)){
        case 2:
          textBaseline = 'top';
          break;

        case 1:
          textBaseline = 'center';
          break;

        default:
          textBaseline = 'bottom';
      }
    }

    return {
      textAlign: textAlign,
      textBaseline: textBaseline
    };
  };

  util.startsWith = function(str, start){
    return str.substring(0, start.length) === start;
  };

  util.endsWith = function(str, end){
    return str.substring(str.length - end.length, str.length) === end;
  };

  util.advMatch = function(str, regex){
    var match = str.match(regex);

    if (!match) return null;

    var result = [],
      lastIndex = 0;

    each(match, function(text){
      var index = str.substring(lastIndex).indexOf(text);

      result.push({
        text: text,
        index: lastIndex + index
      });

      lastIndex += index + text.length;
    });

    return result;
  };
});
