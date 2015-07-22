'use strict';

// rejVal = rejected value
// resVal = resolved value

module.exports = Cbit

// Construct a Cbit (short for "computational bit", which encapsulates a computation.
// The computation is potentially asynchronous.
// The result of the computation may be considered as either "rejected" or "resolved"
// When the computation is complete, functions may be applied to it based on whether
// it was rejected or resolved. Whichever case results, the functions present to handle
// the other case are no-ops. These functions may be arranged and scheduled before the initial
// computation is begun, and they may return their own cbits. To apply a function to the result of
// a cbit and receive a cbit in the same state as the initial one back, use functions like 'map'. To
// apply a function to the result of a cbit and be able to return a cbit, which may end up in a different
// state than the initial one, use functions like "chain".
function Cbit(computation) {
  this.run = computation
}

Cbit.prototype.fork = function(reject, resolve) {
  return this.run(reject, resolve)
}

Cbit.prototype.resolved = function(resVal) {
  return new Cbit(function(_, resolve) {
    return resolve(resVal)
  })
}

Cbit.resolved = Cbit.prototype.resolved

Cbit.prototype.rejected = function(rejVal) {
  return new Cbit(function(reject, _) {
    return reject(rejVal)
  })
}

Cbit.rejected = Cbit.prototype.rejected

Cbit.prototype.map = function(resMapper) {
  var run = this.run

  // Returns a cbit which applies the mapper only to a resolved value
  return new Cbit(function(reject, resolve) {
    return run(function(rejVal) {
      return reject(rejVal)
    }, function(resVal) {
      return resolve(resMapper(resVal))
    })
  })
}

Cbit.prototype.rejectedMap = function(rejMapper) {
  var run = this.run

  // Returns a cbit which applies the mapper only to a rejected value
  return new Cbit(function(reject, resolve) {
    return run(function(rejVal) {
      return reject(rejMapper(rejVal))
    }, function(resVal) {
      return resolve(resVal)
    })
  })
}

Cbit.prototype.chain = function(resChainer) {
  var run = this.run;

  // Returns the chainer applied to a resolved value (the chainer must return a cbit)
  return new Cbit(function(reject, resolve) {
    return run(function(rejVal) {
      return reject(rejVal)
    }, function(resVal) {
      return resChainer(resVal).run(reject, resolve)
    })
  })
}

Cbit.prototype.rejectedChain = function(rejChainer) {
  var run = this.run;

  // Returns the chainer applied to a rejected value (the chainer must return a cbit)
  return new Cbit(function(reject, resolve) {
    return run(function(rejVal) {
      return rejChainer(rejVal).run(reject, resolve)
    }, function(resVal) {
      return resolve(resVal)
    })
  })
}

Cbit.prototype.bimap = function(rejMapper, resMapper) {
  var run = this.run;

  // If the value is rejected, calls rejMapper on it and returns a rejected value.
  // If the value is resolved, calls resMapper on it and returns a resolved value.
  return new Cbit(function(reject, resolve) {
    return run(function(rejVal) {
      return reject(rejMapper(rejVal))
    }, function(resVal) {
      return resolve(resMapper(resVal))
    })
  })
}

Cbit.prototype.bichain = function(rejChainer, resChainer) {
  var run = this.run;

  // If the value is rejected, calls rejChainer on it and then runs the returned cbit (rejChainer must return a cbit)
  // If the value is resolved, calls resChainer on it and then runs the returned cbit (resChainer must return a cbit)
  return new Cbit(function(reject, resolve) {
    return run(function(rejVal) {
      return rejChainer(rejVal).run(reject, resolve)
    }, function(resVal) {
      return resChainer(resVal).run(reject, resolve)
    })
  })
}

// Consumes an array of cbits that can be run in parallel and condenses that array into a single cbit.
// When the resulting cbit (the "parallel" cbit) is run, it will run each of the cbits
// it contains. If any cbit in the group is rejected, the parallel cbit will be rejected,
// and its value will be the value of the rejected cbit. If all of the cbits in the group
// are resolved, the parallel cbit will be resolved, and its value will be an array of the
// resolved values of each of the cbits in the group (in the order of the original cbits array)
Cbit.fromParallel = function(cbits) {
  return new Cbit(function(reject, resolve) {
    var numCbits = cbits.length
    var result = new Array(numCbits)
    var completed = false

    if (numCbits === 0) {
      resolve([])
    } else {
      cbits.forEach(runCbit)
    }

    function runCbit(cbit, index) {
      return cbit.run(function(rejVal) {
        if (completed) {
          return
        }
        completed = true
        reject(rejVal)
      }, function(resVal) {
        if (completed) {
          return
        }
        result[index] = resVal
        numCbits = numCbits - 1
        if (numCbits === 0) {
          completed = true
          resolve(result)
        }
      })
    }
  })
}
