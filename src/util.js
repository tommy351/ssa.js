ssa.extend(function(ssa){
  var util = ssa.util = {};

  util.forEach = function(arr, iterator){
    for (var i = 0, len = arr.length; i < len; i++){
      iterator(arr[i], i);
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
