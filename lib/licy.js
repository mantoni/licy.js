/*
 * licy.js
 *
 * Copyright (c) 2012-2015 Maximilian Antoni <mail@maxantoni.de>
 *
 * @license MIT
 */
'use strict';

var Hub      = require('hubjs').Hub;
var inherits = require('inherits');

var ARG_NAMES = ',a,b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t,u,v,w,x,y,z';

function functionName(fn) {
  /*jslint regexp: true*/
  var m = fn.toString().match(/function ([^\s\(]*)/);
  return m && m[1];
}

function destroyed(self) {
  return function () {
    throw new Error(self.toString() + ' destroyed');
  };
}

function destroyFilter(self) {
  return function (next, callback) {
    next(function () {
      self.removeAll();
      self.on('*', destroyed(self));
      callback();
    });
  };
}

function Licy() {
  Hub.call(this);
  this.addFilter('destroy', destroyFilter(this));
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

function registerListeners(type, keys, obj, Super) {
  keys.forEach(function (key) {
    var event = { event : key, scope : type };
    if (Super.prototype[key]) {
      type.addFilter(event, obj[key]);
    } else {
      type.on(event, obj[key]);
    }
  });
}

function invoke(call) {
  call();
}

function haltCalls(type) {
  var calls = [];
  function interceptor(next) {
    calls.push(next);
  }
  type.addFilter('*', interceptor);
  return function () {
    type.removeFilter('*', interceptor);
    calls.forEach(invoke);
  };
}

function emitter(event, fn) {
  /*jslint evil: true*/
  var name = fn.name || functionName(fn) || event;
  var args = ARG_NAMES.substring(0, fn.length * 2);
  return eval('(function ' + name + '(' + args.substring(1)
    + '){this.emit("' + event + '"' + args + ')})');
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

function delegateNoCtor(keys, obj, Super) {
  return function (type, args, unhalt) {
    /*jslint unparam: true*/
    registerListeners(type, keys, obj, Super);
    return unhalt;
  };
}

function delegateDefault(ctor, keys, obj, Super) {
  return function (type, args, unhalt) {
    ctor.apply(type, args);
    registerListeners(type, keys, obj, Super);
    return unhalt;
  };
}

function delegateCallback(ctor, keys, obj, Super) {
  return function (type, args, unhalt) {
    if (args.length < ctor.length) {
      unhalt = two(unhalt);
      args = Array.prototype.slice.call(args);
      args[ctor.length - 1] = unhalt;
    }
    ctor.apply(type, args);
    registerListeners(type, keys, obj, Super);
    return unhalt;
  };
}

function delegateReturn(ctor, Type, Super) {
  var keys;
  return function (type, args, unhalt) {
    var obj = ctor.apply(type, args);
    if (obj) {
      if (!keys) {
        keys = Object.keys(obj);
        definePrototype(Type, keys, obj);
      }
      registerListeners(type, keys, obj, Super);
    }
    return unhalt;
  };
}

function delegateCallbackReturn(ctor, Type, Super) {
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
      registerListeners(type, keys, obj, Super);
    }
    return unhalt;
  };
}

function Args(_) {
  this._ = _;
}

function defineType(parent, Super, ctor, keys, obj, useReturn) {
  var instances = [];
  var delegate;

  function Type(args) {
    if (!(this instanceof Type)) {
      return new Type(new Args(arguments));
    }
    args = (args instanceof Args)
      ? args._
      : Array.prototype.slice.call(arguments);
    if (!this.hasOwnProperty('_store')) {
      Licy.call(this);
    }
    if (!ctor && Super !== Licy) {
      Super.call(this);
    }
    var unhalt = delegate(this, args, haltCalls(this));
    if (instances) {
      instances.push([this, unhalt]);
    } else {
      Type.prototype.emit('create', this, unhalt);
    }

    var self = this;
    function dc(callback) {
      self.destroy(callback);
    }

    if (this.constructor === Type) {
      parent.addFilter('destroy', dc);
      this.on('destroy', function () {
        parent.removeFilter('destroy', dc);
      });
    }
  }

  if (ctor) {
    inherits(ctor, Super);
    inherits(Type, ctor);
    if (ctor.length) {
      delegate = useReturn
        ? delegateCallbackReturn(ctor, Type, Super)
        : delegateCallback(ctor, keys, obj, Super);
    } else {
      delegate = useReturn
        ? delegateReturn(ctor, Type, Super)
        : delegateDefault(ctor, keys, obj, Super);
    }
  } else {
    inherits(Type, Super);
    delegate = keys
      ? delegateNoCtor(keys, obj, Super)
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
    return defineType(this, Licy);
  }
  return this.extend(Licy, obj);
};

Licy.prototype.extend = function (Super, obj) {
  if (typeof obj === 'function') {
    return defineType(this, Super, obj, null, null, true);
  }
  if (Object.prototype.toString.call(obj) !== '[object Object]') {
    throw new TypeError('Function or object expected');
  }
  var ctor;
  if (obj.hasOwnProperty('constructor')) {
    if (typeof obj.constructor !== 'function') {
      throw new TypeError('Constructor must be a function');
    }
    ctor = obj.constructor;
    delete obj.constructor;
  }
  return defineType(this, Super, ctor, Object.keys(obj), obj);
};

Licy.prototype.create = function (Type) {
  if (!arguments.length) {
    Type = this.define();
  } else if (typeof Type !== 'function' || !(Type.prototype instanceof Licy)) {
    Type = this.define(Type);
  }
  return new Type();
};

Licy.prototype.destroy = function (callback) {
  this.emit('destroy', callback);
};


licy.Licy = Licy;

module.exports = licy;
