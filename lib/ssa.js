(function(){
  var ssa = function(){
    //
  };

  var requestAnimationFrame =
    this.requestAnimationFrame ||
    this.mozRequestAnimationFrame ||
    this.webkitRequestAnimationFrame ||
    this.oRequestAnimationFrame ||
    this.msRequestAnimationFrame ||
    function(callback){
      this.setTimeout(callback, 1000 / 60);
    };

  var Canvas = ssa.Canvas = function(element, options){
    this.element = element;
    this.context = element.getContext('2d');
    this.options = options || {};
    this.subtitles = [];
    this.duration = 0;
    this.isPlaying = false;
  };

  Canvas.prototype.width = function(width){
    if (width){
      this.element.width = width;
      return this;
    } else {
      return this.element.width;
    }
  };

  Canvas.prototype.height = function(height){
    if (height){
      this.element.height = height;
      return this;
    } else {
      return this.element.height;
    }
  };

  Canvas.prototype.load = function(content){
    this.subtitles.push(new Subtitle(content));

    return this;
  };

  Canvas.prototype.start = function(){
    if (!this.isPlaying){
      var self = this;

      this.isPlaying = true;
      this.lastDate = Date.now();

      requestAnimationFrame(function(){
        self._step();
      });
    }

    return this;
  };

  Canvas.prototype.pause = function(){
    if (this.isPlaying){
      this.isPlaying = false;
    }

    return this;
  };

  Canvas.prototype.stop = function(){
    this.pause();
    this.duration = 0;

    return this;
  };

  Canvas.prototype.toggle = function(){
    this.isPlaying ? this.pause() : this.play();

    return this;
  };

  Canvas.prototype._step = function(){
    // Update duration
    var now = Date.now();
    this.duration += (now - this.lastDate) / 1000;
    this.lastDate = now;

    var duration = this.duration,
      context = this.context,
      canvasWidth = this.width(),
      canvasHeight = this.height(),
      self = this;

    // Clear canvas context
    context.clearRect(0, 0, canvasWidth, canvasHeight);

    forEach(this.subtitles, function(subtitle){
      var events = subtitle.query(duration),
        info = subtitle.info(),
        width = info.playResX || canvasWidth,
        height = info.playResY || canvasHeight,
        zoom = canvasWidth / width;

      forEach(events, function(event){
        var style = subtitle.style(event),
          metrics = context.measureText(event.text),
          fontsize = style.fontsize * zoom,
          marginL = ((event.marginL || style.marginL) * zoom),
          marginR = ((event.marginR || style.marginR) * zoom),
          marginV = ((event.marginV || style.marginV) * zoom)
          x = 0,
          y = 0;

        // Save current status
        context.save();

        context.font =
          (style.bold ? 'bold ' : '') +
          (style.italic ? 'italic ' : '') +
          fontsize + 'px "' + style.fontname + '"';

        context.fillStyle = style.primaryColour;
        context.lineWidth = style.outline * zoom;
        context.lineCap = 'round';
        context.lineJoin = 'round';
        context.strokeStyle = style.outlineColour;
        context.textBaseline = style.textBaseline;
        context.textAlign = style.textAlign;

        switch (style.textAlign){
          case 'left':
            x = marginL;
            break;

          case 'center':
            x = canvasWidth / 2;
            break;

          case 'right':
            x = marginR;
            break;
        }

        switch (style.textBaseline){
          case 'top':
            y = marginV;
            break;

          case 'center':
            y = canvasHeight / 2;
            break;

          case 'bottom':
            y = canvasHeight - marginV;
            break;
        }

        wrapText(context, event.text, {
          x: x,
          y: y,
          maxWidth: canvasWidth - marginL - marginR,
          fontsize: fontsize,
          stroke: style.borderStyle == 1
        });

        // Restore status
        context.restore();
      });
    });

    // Keep playing
    if (this.isPlaying){
      requestAnimationFrame(function(){
        self._step();
      });
    }
  };

  var wrapText = function(context, text, options){
    var words = text.split(' '),
      line = '',
      x = options.x,
      y = options.y,
      maxWidth = options.maxWidth,
      fontsize = options.fontsize,
      lineHeight = fontsize * (options.lineHeight || 1);

    forEach(words, function(word, i){
      var testLine = line + word + ' ',
        metrics = context.measureText(testLine),
        width = metrics.width;

      if (width > maxWidth && i > 0){
        context.fillText(line, x, y);
        context.strokeText(line, x, y);
        line = word + ' ';
        y += lineHeight;
      } else {
        line = testLine;
      }
    });

    context.fillText(line, x, y);
    if (options.stroke) context.strokeText(line, x, y);
  };

  var Subtitle = ssa.Subtitle = function(content){
    this.data = parse(content);
  };

  Subtitle.prototype.info = function(){
    return this.data.info;
  };

  Subtitle.prototype.query = function(sec){
    var arr = [];

    forEach(this.data.events, function(event){
      if (sec >= event.start && sec <= event.end){
        arr.push(event);
      }
    });

    return arr;
  };

  Subtitle.prototype.style = function(event){
    return this.data.styles[event.style || 'Default'];
  };

  var parse = ssa.parse = function(str){
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
            var data = parseStyle(mapAttrs(split, attrs), current === 'V4+ Styles');
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

    for (var i = 0, len = attrs.length; i < len - 1; i++){
      obj[attrs[i]] = arr[i];
    }

    obj[attrs[i]] = arr.slice(i).join(',');

    return obj;
  };

  var parseStyle = function(obj, isASS){
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
      'primaryColour', 'secondaryColour', 'outlineColour', 'tertiaryColour', 'backColour'
    ], function(key){
      if (obj[key]) obj[key] = parseColor(obj[key]);
    });

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

    var r = parseInt(str.substring(6, 8), 16),
      g = parseInt(str.substring(4, 6), 16),
      b = parseInt(str.substring(2, 4), 16),
      a = (255 - parseInt(str.substring(0, 2), 16)) / 255;

    return 'rgba(' + r + ', ' + g + ', ' + b + ', ' + a.toFixed(2) +')';
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