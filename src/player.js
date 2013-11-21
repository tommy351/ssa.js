ssa.extend(function(ssa){
  var requestAnimationFrame =
    window.requestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.oRequestAnimationFrame ||
    window.msRequestAnimationFrame ||
    function(callback){
      window.setTimeout(callback, 1000 / 60);
    };

  var Player = ssa.Player = function(element, subtitle, options){
    this.svg = SVG(element);
    this.options = options || {};
    this.duration = 0;
    this.isPlaying = false;
    this.events = {};
    this.isReady = false;
    this.isProgress = false;

    if (subtitle){
      this.load(subtitle);
    }
  };

  Player.prototype.load = function(subtitle){
    this.svg.viewbox(0, 0, subtitle.width, subtitle.height);
    this.subtitle = subtitle;
    this.isReady = true;
  };

  Player.prototype.play = function(){
    if (!this.isPlaying){
      this.isPlaying = true;
      this._step();
    }

    return this;
  };

  Player.prototype.pause = function(){
    if (this.isPlaying){
      this.isPlaying = false;
    }

    return this;
  };

  Player.prototype.stop = function(){
    this.pause();
    this.svg.clear();
    this.duration = 0;

    return this;
  };

  Player.prototype.toggle = function(){
    this.isPlaying ? this.pause() : this.play();
  };

  var textAlignToAnchor = function(str){
    switch (str){
      case 'left':
        return 'start';

      case 'center':
        return 'middle';

      case 'right':
        return 'end';
    }
  };

  var rAssStyle = /\{\\(.+?)\}/g;

  Player.prototype._textFn = function(event){
    var text = event.text.replace(/\\h/g, ' '),
      lines = [],
      util = ssa.util,
      each = util.each,
      extend = util.extend;

    each(text.split('\N'), function(line){
      if (!line.match(rAssStyle)){
        return lines.push([{text: line}]);
      }

      var match = ssa.util.advMatch(line, rAssStyle),
        spans = [];

      each(match, function(obj, i){
        var next = match[i + 1],
          start = obj.index + obj.text.length,
          end = next ? next.index : line.length,
          commands = [];

        var span = {
          text: line.substring(start, end)
        };

        each(obj.text.substring(2, obj.text.length - 1).split('\\'), function(cmd){
          var key = findCommand(cmd);

          if (!key) return;

          extend(span, Commands[key](cmd.substring(key.length - 1)));
        });

        spans.push(span);
      });

      lines.push(spans);
    });

    return function(add){
      each(lines, function(spans, i){
        each(spans, function(span, j){
          var text = add.tspan(span.text).attr({
            'alignment-baseline': 'text-before-edge'
          });

          if (j == 0){
            text.x(0).dy((i * 1.2) + 'em');
          }
        });
      });
    }
  };

  Player.prototype.progress = function(sec){
    var subtitle = this.subtitle,
      sWidth = subtitle.width,
      sHeight = subtitle.height,
      styles = subtitle.styles,
      events = this.events,
      svg = this.svg,
      self = this;

    ssa.util.each(events, function(event, i){
      if (event == null) return;

      if (sec < event._ssa_start || sec > event._ssa_end){
        event.remove();
        delete events[i];
      }
    });

    ssa.util.each(subtitle.events, function(event, i){
      if (events[i] || sec < event.start || sec > event.end) return;

      var style = styles[event.style] || styles.Default,
        marginLeft = event.marginLeft || style.marginLeft,
        marginRight = event.marginRight || style.marginRight,
        verticalMargin = event.verticalMargin || style.verticalMargin,
        group = svg.group();

      var textFn = self._textFn(event);

      var text = svg.text(textFn);

      text.font({
        family: style.fontFamily,
        size: style.fontSize + 'px',
        anchor: textAlignToAnchor(style.textAlign)
      });

      text.attr({
        fill: ssa.util.toHexColor(style.primaryColor),
        'fill-opacity': style.primaryColor.a
      });

      var stroke = svg.text(textFn);

      stroke.font({
        family: style.fontFamily,
        size: style.fontSize + 'px',
        anchor: textAlignToAnchor(style.textAlign)
      });

      stroke.attr({
        fill: ssa.util.toHexColor(style.strokeColor),
        'fill-opacity': style.strokeColor.a
      });

      var strokeFilter = stroke.filter(function(add){
        var strokeEffect = new SVG.MorphologyEffect;

        strokeEffect.attr({
          operator: 'dilate',
          radius: style.strokeWidth * 2
        });

        add.put(strokeEffect);
      });

      switch (style.textAlign){
        case 'left':
          x = marginLeft;
          break;

        case 'center':
          x = sWidth / 2;
          break;

        case 'right':
          x = sWidth - marginRight;
          break;
      }

      switch (style.textBaseline){
        case 'top':
          y = verticalMargin;
          break;

        case 'center':
          y = sHeight / 2;
          break;

        case 'bottom':
          y = sHeight - verticalMargin - text.node.scrollHeight;
          break;
      }

      group.move(x, y, true);

      group.add(strokeFilter);
      group.add(stroke);
      group.add(text);

      group._ssa_start = event.start;
      group._ssa_end = event.end;
      events[i] = group;
    });
  };

  Player.prototype._step = function(){
    // Update duration
    var now = Date.now(),
      self = this;

    if (this.lastDate){
      this.duration += (now - this.lastDate) / 1000;
    }

    this.lastDate = now;

    // Keep playing
    if (this.isPlaying){
      requestAnimationFrame(function(){
        self.progress(self.duration);
        self._step();
      });
    }
  };

  // http://docs.aegisub.org/manual/ASS_Tags
  var Commands = {};

  var findCommand = function(cmd){
    var key;

    ssa.util.each(Commands, function(fn, i){
      if (ssa.util.startsWith(cmd, i.substring(1))){
        key = i;
        return false;
      }
    });

    return key;
  };

  var createParamRegex = function(length){
    var str = '\\(\\s*(\\d+)';

    for (var i = 1; i < length; i++){
      str += '\\s*,\\s*(\\d+)';
    }

    return new RegExp(str + '\\s*\\)');
  };

  var rCommandTwoParams = createParamRegex(2);

  // Border size
  Commands.$bord = function(str){
    //
  };

  // Blur edges
  Commands.$be = function(str){
    //
  };

  // Blur edges (gaussian kernel)
  Commands.$blur = function(str){
    //
  };

  // Shadow distance
  Commands.$shad = function(str){
    //
  };

  // Shadow distance (X)
  Commands.$xshad = function(str){
    //
  };

  // Shadow distance (Y)
  Commands.$yshad = function(str){
    //
  };

  // Font name
  Commands.$fn = function(str){
    return {
      fontFamily: str
    }
  };

  // Font scale (X)
  Commands.$fscx = function(str){
    //
  };

  // Font scale (Y)
  Commands.$fscy = function(str){
    //
  };

  // Letter spacing
  Commands.$fsp = function(str){
    //
  };

  // Font size
  Commands.$fs = function(str){
    //
  };

  // Text rotation (X)
  Commands.$frx = function(str){
    //
  };

  // Text rotation (Y)
  Commands.$fry = function(str){
    //
  };

  // Text rotation (Z)
  Commands.$frz = function(str){
    //
  };

  // Text rotation
  Commands.$fr = function(str){
    //
  };

  // Text shearing (X)
  Commands.$fax = function(str){
    //
  };

  // Text shearing (Y)
  Commands.$fay = function(str){
    //
  };

  // Font encoding
  Commands.$fe = function(str){
    //
  };

  // Movement
  Commands.$move = function(str){
    //
  };

  // Set position
  Commands.$pos = function(str){
    var match = str.match(rCommandTwoParams);

    if (!match) return;
  };

  var rCommandFade = createParamRegex(7);

  // Fade (complex)
  Commands.$fade = function(str){
    var match = str.match(rCommandFade);

    if (!match) return;
  };

  // Fade
  Commands.$fad = function(str){
    var match = str.match(rCommandTwoParams);

    if (!match) return;

    return {
      fadeInOpacity: 0,
      opacity: 1,
      fadeOutOpacity: 0,
      fadeInDuration: +match[1],
      fadeOutDuration: +match[2]
    }
  };

  // All alpha
  Commands.$alpha = function(str){
    //
  };

  // Primary alpha
  Commands.$1a = function(str){
    //
  };

  // Secondary alpha
  Commands.$2a = function(str){
    //
  };

  // Stroke alpha
  Commands.$3a = function(str){
    //
  };

  // Shadow alpha
  Commands.$4a = function(str){
    //
  };

  // Reset style
  Commands.$r = function(str){
    return {
      reset: true
    }
  };

  // Rotation origin
  Commands.$org = function(str){
    //
  };

  // Line alignment
  Commands.$an = function(str){
    //
  };

  // Karaoke effect
  Commands.$ko = function(str){
    //
  };

  // Karaoke effect
  Commands.$K = Commands.$kf = function(str){
    //
  };

  // Karaoke effect
  Commands.$k = function(str){
    //
  };

  // Clip
  Commands.$clip = function(str){
    //
  };

  // Clip
  Commands.$iclip = function(str){
    //
  };

  // Drawing
  Commands.$p = function(str){
    //
  };

  // Transform
  Commands.$t = function(str){
    //
  };

  // Wrap style
  Commands.$q = function(str){
    //
  };

  // Line alignment (Legacy)
  Commands.$a = function(str){
    //
  };

  // Primary color
  Commands.$c = Commands.$1c = function(str){
    str = str.replace(/&$/, '');

    return {
      primaryColor: ssa.util.parseAbgr(str)
    }
  };

  // Secondary color
  Commands.$2c = function(str){
    str = str.replace(/&$/, '');

    return {
      secondaryColor: ssa.util.parseAbgr(str)
    }
  };

  // Stroke color
  Commands.$3c = function(str){
    str = str.replace(/&$/, '');

    return {
      strokeColor: ssa.util.parseAbgr(str)
    }
  };

  // Shadow color
  Commands.$4c = function(str){
    return {
      shadowColor: ssa.util.parseAbgr(str)
    }
  };

  // Bold
  Commands.$b = function(str){
    if (str >= 100){
      var value = +str;
    } else {
      var value = str > 0;
    }

    return {
      bold: value
    }
  };

  // Italic
  Commands.$i = function(str){
    return {
      italic: str > 0
    }
  };

  // Underline
  Commands.$u = function(str){
    return {
      underline: str > 0
    }
  };

  // Strike
  Commands.$s = function(str){
    return {
      strike: str > 0
    }
  };
});
