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

    for (var i = 0, len = lines.length; i < len; i++){
      var line = lines[i];

      if (line[0] === ';') continue;

      var group = line.match(/^\[(.*)\]$/);

      if (group){
        current = group[1];
        continue;
      }

      var match = line.match(/(.*?)\s*:\s*(.*)/);

      if (!match) continue;

      var key = match[1],
        value = match[2],
        split = value.split(/\s*,\s*/);

      switch (current){
        case 'Script Info':
          obj.info[key] = value;
          break;

        case 'V4 Styles':
        case 'V4+ Styles':
          if (key === 'Format'){
            attrs = parseAttrList(value);
          } else if (attrs.length){
            var data = parseStyle(mapAttrs(split, attrs));
            obj.styles[data.name] = data;
          }

          break;

        case 'Events':
          if (key === 'Format'){
            attrs = parseAttrList(value);
          } else if (attrs.length){
            obj.events.push(parseEvent(mapAttrs(split, attrs)));
          }

          break;
      }
    }

    return obj;
  };

  var parseAttrList = function(str){
    var split = str.split(/\s*,\s*/),
      arr = [];

    for (var i = 0, len = split.length; i < len; i++){
      var item = split[i];

      arr.push(item[0].toLowerCase() + item.substring(1, item.length));
    }

    return arr;
  };

  var mapAttrs = function(arr, attrs){
    var obj = {};

    for (var i = 0, len = attrs.length; i < len; i++){
      obj[attrs[i]] = arr[i];
    }

    return obj;
  };

  var parseStyle = function(obj){
    if (obj.fontsize) obj.fontsize = parseInt(obj.fontsize, 10);

    return obj;
  };

  var parseEvent = function(obj){
    if (obj.layer) obj.layer = parseInt(obj.layer, 10);
    if (obj.start) obj.start = toSeconds(obj.start);
    if (obj.end) obj.end = toSeconds(obj.end);

    return obj;
  };

  var toSeconds = function(str){
    var split = str.split(':');

    return +(parseInt(split[0], 10) * 3600 + parseInt(split[1], 10) * 60 + parseFloat(split[2], 10)).toFixed(2);
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