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
    this.events = [];
    this.isReady = false;

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
      box = this.viewbox,
      existing = [];

    ssa.util.forEach(events, function(event, i){
      if (typeof event === 'undefined'){
        events.splice(i, 1);
      } else if (sec < event._ssa_start || sec > event._ssa_end){
        events.splice(i, 1);
        event.remove();
      } else {
        existing.push(event._ssa_id);
      }
    });

    ssa.util.forEach(subtitle.events, function(event, i){
      if (existing.indexOf(i) > -1 || sec < event.start || sec > event.end) return;

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
        'fill-opacity': style.primaryColor.a,
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

      group.add(text);

      group.move(x, y, true);

      group._ssa_start = event.start;
      group._ssa_end = event.end;
      group._ssa_id = i;

      events.push(group);
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
