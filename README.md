# Cbit, a class for encapsulating computation

This is a monad which represents a computational bit, or cbit. It doesn't use the traditional terms that monads use. So, `fork` becomes `run`, etc.

The implementation is pretty much copied verbatim from the [data.task](https://github.com/folktale/data.task) class in the Folktale framework. Except the names have been changed to be more internally consistent, at the expense of consistency with the fantasy-land spec (for instance, `orElse` becomes `rejectedChain`). I've also stripped it to just the functions I found myself actually using, plus a function that doesn't exist in data.task (bichain). Lastly, I wrapped the very helpful Async.parallel function from [control.async](https://github.com/folktale/control.async) into this class, as `Cbit.fromParallel`.

The goal is to have a "Task" monad implementation which is simple, and has consistent methods and consistent naming. If a method exists for one side of the disjunction, it should exist for the other and have a similar name.

Licence: MIT
