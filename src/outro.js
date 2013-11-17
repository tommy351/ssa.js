if (typeof define !== 'undefined' && define.amd){
  define([], function(){
    return ssa;
  });
} else if (typeof module !== 'undefined' && module.exports){
  module.exports = ssa;
} else {
  window.ssa = ssa;
}
})(this);
