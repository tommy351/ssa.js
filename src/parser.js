ssa.extend(function(ssa){
  var parsers = ssa.parsers = {};

  ssa.parse = function(str, type, options){
    type = type || 'ssa';
    options = options || {};

    if (parsers.hasOwnProperty(type)){
      var parser = new parsers[type]();

      return parser.exec(str, options);
    } else {
      throw new Error('File type "' + type + '" is not supported');
    }
  };
});
