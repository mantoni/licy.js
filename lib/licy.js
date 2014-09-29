'use strict';

var Hub      = require('hubjs').Hub;
var inherits = require('inherits');

var ARG_NAMES = ',a,b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t,u,v,w,x,y,z';

function functionName(fn) {
  /*jslint regexp: true*/
  var m = fn.toString().match(/function ([^\s\(]*)/);
  return m && m[1];
}


function Licy() {
  Hub.call(this);
  var self = this;
  this.addFilter('destroy', function (next, callback) {
    next(function () {
      self.removeAllFilters();
      self.removeAllListeners();
      callback();
    });
  });
}

inherits(Licy, Hub);

Licy.prototype.toString = function () {
  var ctor = this.constructor;
  var name;
  if (ctor === Licy) {
    name = 'Licy';
  } else if (ctor.super_ === Licy) {
    name = 'Type';
  } else {
    name = ctor.super_.name || functionName(ctor.super_) || 'Type';
  }
  return '[licy ' + name + ']';
};

var licy = new Licy();


function emitter(event, fn) {
  /*jslint unparam: true, evil: true*/
  var name = fn.name || functionName(fn) || event;
  var args = ARG_NAMES.substring(0, fn.length * 2);
  return eval('(function ' + name + '(' + args.substring(1)
    + '){this.emit("' + event + '"' + args + ')})');
}

function registerListeners(type, keys, obj) {
  keys.forEach(function (key) {
    type.on({ event : key, scope : type }, obj[key]);
  });
}

function haltCalls(type) {
  var calls = [];
  function interceptor(next) {
    calls.push(next);
  }
  type.addFilter('*', interceptor);
  return function () {
    type.removeFilter('*', interceptor);
    calls.forEach(function (call) {
      call();
    });
  };
}

function definePrototype(Type, keys, obj) {
  keys.forEach(function (key) {
    if (key !== 'destroy') {
      Type.prototype[key] = emitter(key, obj[key]);
    }
  });
}

function two(then) {
  var count = 0;
  return function () {
    if (++count === 2) {
      then();
    }
  };
}

function delegateNoop(type, args, unhalt) {
  /*jslint unparam: true*/
  return unhalt;
}

function delegateNoCtor(keys, obj) {
  return function (type, args, unhalt) {
    /*jslint unparam: true*/
    registerListeners(type, keys, obj);
    return unhalt;
  };
}

function delegateDefault(ctor, keys, obj) {
  return function (type, args, unhalt) {
    ctor.apply(type, args);
    registerListeners(type, keys, obj);
    return unhalt;
  };
}

function delegateCallback(ctor, keys, obj) {
  return function (type, args, unhalt) {
    if (args.length < ctor.length) {
      unhalt = two(unhalt);
      args = Array.prototype.slice.call(args);
      args[ctor.length - 1] = unhalt;
    }
    ctor.apply(type, args);
    registerListeners(type, keys, obj);
    return unhalt;
  };
}

function delegateReturn(ctor, Type) {
  var keys;
  return function (type, args, unhalt) {
    var obj = ctor.apply(type, args);
    if (obj) {
      if (!keys) {
        keys = Object.keys(obj);
        definePrototype(Type, keys, obj);
      }
      registerListeners(type, keys, obj);
    }
    return unhalt;
  };
}

function delegateCallbackReturn(ctor, Type) {
  var keys;
  return function (type, args, unhalt) {
    if (args.length < ctor.length) {
      unhalt = two(unhalt);
      args = Array.prototype.slice.call(args);
      args[ctor.length - 1] = unhalt;
    }
    var obj = ctor.apply(type, args);
    if (obj) {
      if (!keys) {
        keys = Object.keys(obj);
        definePrototype(Type, keys, obj);
      }
      registerListeners(type, keys, obj);
    }
    return unhalt;
  };
}

function Args(_) {
  this._ = _;
}

function defineType(ctor, keys, obj, useReturn) {
  var instances = [];
  var delegate;

  function Type(args) {
    if (!(this instanceof Type)) {
      return new Type(new Args(arguments));
    }
    args = (args instanceof Args)
      ? args._
      : Array.prototype.slice.call(arguments);
    Licy.call(this);
    var unhalt = delegate(this, args, haltCalls(this));
    if (instances) {
      instances.push([this, unhalt]);
    } else {
      Type.prototype.emit('create', this, unhalt);
    }
  }

  if (ctor) {
    inherits(ctor, Licy);
    inherits(Type, ctor);
    if (ctor.length) {
      delegate = useReturn
        ? delegateCallbackReturn(ctor, Type)
        : delegateCallback(ctor, keys, obj);
    } else {
      delegate = useReturn
        ? delegateReturn(ctor, Type)
        : delegateDefault(ctor, keys, obj);
    }
  } else {
    inherits(Type, Licy);
    delegate = keys
      ? delegateNoCtor(keys, obj)
      : delegateNoop;
  }
  Licy.call(Type.prototype);

  if (keys) {
    definePrototype(Type, keys, obj);
  }
  Type.prototype.on('create', function (type, obj, callback) {
    /*jslint unparam: true*/
    licy.emit('create', type, Type, callback);
  });
  licy.emit('define', Type, function () {
    instances.forEach(function (d) {
      Type.prototype.emit('create', d[0], d[1]);
    });
    instances = null;
  });
  return Type;
}

Licy.prototype.define = function (obj) {
  if (!arguments.length) {
    return defineType();
  }
  if (typeof obj === 'function') {
    return defineType(obj, null, null, true);
  }
  if (Object.prototype.toString.call(obj) !== '[object Object]') {
    throw new TypeError();
  }
  var ctor;
  if (obj.hasOwnProperty('constructor')) {
    if (typeof obj.constructor !== 'function') {
      throw new TypeError();
    }
    ctor = obj.constructor;
    delete obj.constructor;
  }
  return defineType(ctor, Object.keys(obj), obj);
};

Licy.prototype.create = function (Type) {
  if (!arguments.length) {
    Type = this.define();
  } else if (typeof Type !== 'function' || !(Type.prototype instanceof Licy)) {
    Type = this.define(Type);
  }
  var type = new Type();

  function dc(callback) {
    type.destroy(callback);
  }

  var self = this;
  this.addFilter('destroy', dc);
  type.on('destroy', function () {
    self.removeFilter('destroy', dc);
  });
  return type;
};

Licy.prototype.destroy = function (callback) {
  this.emit('destroy', callback);
};


licy.Licy = Licy;

module.exports = licy;
