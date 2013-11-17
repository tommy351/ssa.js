ssa.extend(function(ssa){
  var ssaParser = ssa.parsers.ssa = function(){
    //
  };

  ssaParser.prototype.exec = function(str, options){
    // Removes UTF BOM
    str = str.replace(/^\uFEFF/, '');

    // Split in lines
    var lines = str.split(/(?:\r\n|\r|\n)/gm),
      attrs = [],
      self = this,
      current;

    var obj = {
      info: {},
      styles: {},
      events: []
    };

    ssa.util.forEach(lines, function(line, i){
      if (line[0] === ';') return;

      var group = line.match(/^\[(.*)\]$/);

      if (group){
        current = group[1];
        return;
      }

      var match = line.match(/(.*?)\s*:\s*(.*)/);

      if (!match) return;

      var key = ssa.util.lowerCamelCase(match[1]),
        value = match[2],
        split = value.split(/\s*,\s*/);

      switch (current){
        case 'Script Info':
          obj.info[key] = value;
          break;

        case 'V4 Styles':
        case 'V4+ Styles':
          if (key === 'format'){
            attrs = self.parseAttrList(value);
          } else if (attrs.length){
            var data = self.parseStyle(self.mapAttrs(split, attrs), current === 'V4+ Styles');
            obj.styles[data.name] = data;
          }

          break;

        case 'Events':
          if (key === 'format'){
            attrs = self.parseAttrList(value);
          } else if (attrs.length){
            obj.events.push(self.parseEvent(self.mapAttrs(split, attrs)));
          }

          break;
      }
    });

    return {
      width: +obj.info.playResX,
      height: +obj.info.playResY,
      styles: obj.styles,
      events: obj.events,
      isASS: obj.info.scriptType == 'v4.00+'
    };
  };

  ssaParser.prototype.parseAttrList = function(str){
    var split = str.split(/\s*,\s*/),
      arr = [];

    ssa.util.forEach(split, function(item){
      arr.push(ssa.util.lowerCamelCase(item));
    });

    return arr;
  };

  ssaParser.prototype.mapAttrs = function(arr, attrs){
    var obj = {};

    for (var i = 0, len = attrs.length; i < len - 1; i++){
      obj[attrs[i]] = arr[i];
    }

    obj[attrs[i]] = arr.slice(i).join(',');

    return obj;
  };

  ssaParser.prototype.parseStyle = function(obj, isASS){
    var self = this;

    ssa.util.forEach([
      'fontsize', 'spacing', 'angle', 'borderStyle', 'outline', 'outline',
      'shadow', 'alignment', 'marginL', 'marginR', 'marginV', 'encoding'
    ], function(key){
      if (obj[key]) obj[key] = +obj[key];
    });

    ssa.util.forEach(['scaleX', 'scaleY'], function(key){
      if (obj[key]) obj[key] = +obj[key] / 100;
    });

    ssa.util.forEach(['bold', 'italic', 'underline', 'strikeOut'], function(key){
      if (obj[key]) obj[key] = obj[key] == -1;
    });

    ssa.util.forEach([
      'primaryColour', 'secondaryColour', 'outlineColour', 'tertiaryColour', 'backColour'
    ], function(key){
      if (obj[key]){
        if (key === 'tertiaryColour'){
          var newKey = 'secondaryColor';
        } else {
          var newKey = key.substring(0, key.length - 6) + 'Color';
        }

        obj[newKey] = self.parseColor(obj[key]);
        delete obj[key];
      }
    });

    if (obj.fontsize){
      obj.fontSize = obj.fontsize;
      delete obj.fontsize;
    }

    if (obj.fontname){
      obj.fontFamily = obj.fontname;
      delete obj.fontname;
    }

    if (obj.strikeOut){
      obj.strike = obj.strikeOut;
      delete obj.strikeOut;
    }

    if (obj.alignment){
      if (isASS){
        // Horizontal alignment
        switch (obj.alignment % 3){
          case 1:
            obj.textAlign = 'left';
            break;

          case 0:
            obj.textAlign = 'right';
            break;

          default:
            obj.textAlign = 'center';
        }

        // Vertical alignment
        switch (parseInt((obj.alignment - 1) / 3)){
          case 2:
            obj.textBaseline = 'top';
            break;

          case 1:
            obj.textBaseline = 'center';
            break;

          default:
            obj.textBaseline = 'bottom';
        }
      } else {
        // Horizontal alignment
        switch (obj.alignment % 4){
          case 1:
            obj.textAlign = 'left';
            break;

          case 2:
            obj.textAlign = 'center';
            break;

          default:
            obj.textAlign = 'center';
        }

        // Vertical alignment
        switch (parseInt(obj.alignment / 4)){
          case 2:
            obj.textBaseline = 'top';
            break;

          case 1:
            obj.textBaseline = 'center';
            break;

          default:
            obj.textBaseline = 'bottom';
        }
      }
    } else {
      obj.textAlign = 'center';
      obj.textBaseline = 'bottom';
    }

    return obj;
  };

  ssaParser.prototype.parseEvent = function(obj){
    var self = this;

    ssa.util.forEach(['marked', 'layer', 'marginL', 'marginR', 'marginV'], function(key){
      if (obj[key]) obj[key] = +obj[key];
    });

    ssa.util.forEach(['start', 'end'], function(key){
      if (obj[key]) obj[key] = self.toSeconds(obj[key]);
    });

    return obj;
  };

  ssaParser.prototype.toSeconds = function(str){
    var split = str.split(':');

    return +(parseInt(split[0], 10) * 3600 + parseInt(split[1], 10) * 60 + parseFloat(split[2], 10)).toFixed(2);
  };

  ssaParser.prototype.parseColor = function(str){
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
      a: (255 - parseInt(str.substring(0, 2), 16)) / 255
    };
  };
});
