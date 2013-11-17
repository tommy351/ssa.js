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
    this.viewbox = this.svg.viewbox(0, 0, subtitle.width, subtitle.height);
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

  Player.prototype.progress = function(sec){
    var subtitle = this.subtitle,
      sWidth = subtitle.width,
      sHeight = subtitle.height,
      styles = subtitle.styles,
      events = this.events,
      box = this.viewbox;

    this.isProgress = true;

    for (var i in events){
      var event = events[i];

      if (event == null) continue;

      if (sec < event._ssa_start || sec > event._ssa_end){
        event.remove();
        events[i] = null;
      }
    }

    ssa.util.forEach(subtitle.events, function(event, i){
      if (events[i] || sec < event.start || sec > event.end) return;

      var style = styles[event.style] || styles.Default,
        marginL = event.marginL || style.marginL,
        marginR = event.marginR || style.marginR,
        marginV = event.marginV || style.marginV,
        group = box.group();

      var text = box.text(function(add){
        add.tspan(event.text).attr({
          'alignment-baseline': 'text-before-edge'
        });
      });

      text.font({
        family: style.fontFamily,
        size: style.fontSize,
        anchor: textAlignToAnchor(style.textAlign)
      });

      text.attr({
        fill: ssa.util.toHexColor(style.primaryColor),
        'fill-opacity': style.primaryColor.a
      });

      var stroke = box.text(function(add){
        add.tspan(event.text).attr({
          'alignment-baseline': 'text-before-edge'
        });
      });

      stroke.font({
        family: style.fontFamily,
        size: style.fontSize,
        anchor: textAlignToAnchor(style.textAlign)
      });

      stroke.attr({
        'fill-opacity': 0,
        stroke: ssa.util.toHexColor(style.outlineColor),
        'stroke-opacity': style.outlineColor.a,
        'stroke-width': style.outline,
        'stroke-linejoin': 'round',
        'stroke-linecap': 'round'
      });

      switch (style.textAlign){
        case 'left':
          x = marginL;
          break;

        case 'center':
          x = sWidth / 2;
          break;

        case 'right':
          x = sWidth - marginR;
          break;
      }

      switch (style.textBaseline){
        case 'top':
          y = marginV;
          break;

        case 'center':
          y = sHeight / 2;
          break;

        case 'bottom':
          y = sHeight - marginV - text.node.scrollHeight;
          break;
      }

      group.move(x, y, true);

      group.add(stroke);
      group.add(text);

      group._ssa_start = event.start;
      group._ssa_end = event.end;
      self.isProgress = false;
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
        if (!self.isProgress) self.progress(self.duration);
        self._step();
      });
    }
  };
});
