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

  Player.prototype.progress = function(sec){
    var subtitle = this.subtitle,
      sWidth = subtitle.width,
      sHeight = subtitle.height,
      styles = subtitle.styles,
      events = this.events,
      svg = this.svg;

    ssa.util.each(events, function(event, i){
      if (event == null) return;

      if (sec < event._ssa_start || sec > event._ssa_end){
        event.remove();
        events[i] = null;
      }
    });

    ssa.util.each(subtitle.events, function(event, i){
      if (events[i] || sec < event.start || sec > event.end) return;

      var style = styles[event.style] || styles.Default,
        marginLeft = event.marginLeft || style.marginLeft,
        marginRight = event.marginRight || style.marginRight,
        verticalMargin = event.verticalMargin || style.verticalMargin,
        group = svg.group();

      var text = svg.text(function(add){
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

      var stroke = svg.text(function(add){
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
        stroke: ssa.util.toHexColor(style.strokeColor),
        'stroke-opacity': style.strokeColor.a,
        'stroke-width': style.strokeWidth,
        'stroke-linejoin': 'round',
        'stroke-linecap': 'round'
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
});
