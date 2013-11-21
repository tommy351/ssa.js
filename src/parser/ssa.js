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

    ssa.util.each(lines, function(line, i){
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

    ssa.util.each(split, function(item){
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

    ssa.util.each([
      'fontsize', 'spacing', 'angle', 'borderStyle', 'outline', 'shadow',
      'alignment', 'marginL', 'marginR', 'marginV', 'encoding'
    ], function(key){
      if (obj[key] != null) obj[key] = +obj[key];
    });

    ssa.util.each(['scaleX', 'scaleY'], function(key){
      if (obj[key] != null) obj[key] = +obj[key] / 100;
    });

    ssa.util.each(['bold', 'italic', 'underline', 'strikeOut'], function(key){
      if (obj[key] != null) obj[key] = obj[key] == -1;
    });

    ssa.util.each([
      'primaryColour', 'secondaryColour', 'outlineColour', 'tertiaryColour', 'backColour'
    ], function(key){
      if (obj[key] != null){
        if (key === 'tertiaryColour'){
          var newKey = 'secondaryColor';
        } else {
          var newKey = key.substring(0, key.length - 6) + 'Color';
        }

        obj[newKey] = ssa.util.parseAbgr(obj[key]);
        delete obj[key];
      }
    });

    ssa.util.each({
      fontsize: 'fontSize',
      fontname: 'fontFamily',
      strikeOut: 'strike',
      marginL: 'marginLeft',
      marginR: 'marginRight',
      marginV: 'verticalMargin',
      outline: 'strokeWidth',
      outlineColor: 'strokeColor'
    }, function(val, key){
      if (obj[key] != null){
        obj[val] = obj[key];
        delete obj[key];
      }
    });

    if (obj.alignment){
      var alignment = ssa.util.parseAlignment(obj.alignment, isASS);

      obj.textAlign = alignment.textAlign;
      obj.textBaseline = alignment.textBaseline;
    } else {
      obj.textAlign = 'center';
      obj.textBaseline = 'bottom';
    }

    return obj;
  };

  ssaParser.prototype.parseEvent = function(obj){
    var self = this;

    ssa.util.each(['marked', 'layer', 'marginL', 'marginR', 'marginV'], function(key){
      if (obj[key]) obj[key] = +obj[key];
    });

    ssa.util.each(['start', 'end'], function(key){
      if (obj[key]) obj[key] = self.toSeconds(obj[key]);
    });

    ssa.util.each({
      marginL: 'marginLeft',
      marginR: 'marginRight',
      marginV: 'verticalMargin',
    }, function(val, key){
      if (obj[key] != null){
        obj[val] = obj[key];
        delete obj[key];
      }
    });

    return obj;
  };

  ssaParser.prototype.toSeconds = function(str){
    var split = str.split(':');

    return +(parseInt(split[0], 10) * 3600 + parseInt(split[1], 10) * 60 + parseFloat(split[2], 10)).toFixed(2);
  };
});
