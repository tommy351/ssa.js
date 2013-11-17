ssa.extend(function(ssa){
  var util = ssa.util = {};

  var isArray = util.isArray = Array.isArray || function(arr){
    return toString.call(arr) == '[object Array]';
  };

  var isObject = util.isObject = function(obj){
    return toString.call(obj) == '[object Object]';
  };

  util.each = function(obj, iterator){
    if (isArray(obj)){
      for (var i = 0, len = obj.length; i < len; i++){
        iterator(obj[i], i);
      }
    } else if (isObject(obj)){
      for (var i in obj){
        iterator(obj[i], i);
      }
    }
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
  }
});
