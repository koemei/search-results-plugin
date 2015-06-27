// var _ = (function() {
//   'use strict';

//   var objectProto =  Object.prototype;
//   var propertyIsEnumerable =  objectProto.propertyIsEnumerable;
//   var objToString = objectProto.toString;
//   return {
//     isLength: function (value) {
//       return typeof value == 'number' && value > -1 && value % 1 == 0 && value <= 9007199254740991;
//     },
//     isObject: function (value) {
//       // Avoid a V8 JIT bug in Chrome 19-20.
//       // See https://code.google.com/p/v8/issues/detail?id=2291 for more details.
//       var type = typeof value;
//       return !!value && (type == 'object' || type == 'function');
//     },

//     isFunction: function (value) {
//       // The use of `Object#toString` avoids issues with the `typeof` operator
//       // in older versions of Chrome and Safari which return 'function' for regexes
//       // and Safari 8 equivalents which return 'object' for typed array constructors.
//       return this.isObject(value) && objToString.call(value) == funcTag;
//     },

//     isObjectLike: function (value) {
//       return !!value && typeof value == 'object';
//     },

//     isArrayLike: function (value) {
//       return value != null && isLength(getLength(value));
//     },

//     isArguments: function (value) {
//       return isObjectLike(value) && isArrayLike(value) &&
//         hasOwnProperty.call(value, 'callee') && !propertyIsEnumerable.call(value, 'callee');
//     },
//     isString: function (value) {
//       return typeof value == 'string' || (isObjectLike(value) && objToString.call(value) == stringTag);
//     },
//     isIndex: function (value, length) {
//       value = (typeof value == 'number' || reIsUint.test(value)) ? +value : -1;
//       length = length == null ? MAX_SAFE_INTEGER : length;
//       return value > -1 && value % 1 == 0 && value < length;
//     },

//     getNative: function(object, key) {
//       var value = object == null ? undefined : object[key];
//       return isNative(value) ? value : undefined;
//     },

//     nativeKeys: this.getNative(Object, 'keys'),

//     shimKeys: function (object) {
//       var props = keysIn(object),
//           propsLength = props.length,
//           length = propsLength && object.length;

//       var allowIndexes = !!length && isLength(length) &&
//         (isArray(object) || isArguments(object) || isString(object));

//       var index = -1,
//           result = [];

//       while (++index < propsLength) {
//         var key = props[index];
//         if ((allowIndexes && isIndex(key, length)) || hasOwnProperty.call(object, key)) {
//           result.push(key);
//         }
//       }
//       return result;
//     },

//     keys: !this.nativeKeys ? shimKeys : function(object) {
//       var Ctor = object == null ? undefined : object.constructor;
//       if ((typeof Ctor == 'function' && Ctor.prototype === object) ||
//           (typeof object == 'function' ? false : isArrayLike(object))) {
//         return shimKeys(object);
//       }
//       return isObject(object) ? this.nativeKeys(object) : [];
//     },

//     mixin: function (object, source, options) { // taken from lodash
//       if (options == null) {
//         var isObj = this.isObject(source),
//             props = isObj ? keys(source) : undefined,
//             methodNames = (props && props.length) ? baseFunctions(source, props) : undefined;

//         if (!(methodNames ? methodNames.length : isObj)) {
//           methodNames = false;
//           options = source;
//           source = object;
//           object = this;
//         }
//       }
//       if (!methodNames) {
//         methodNames = baseFunctions(source, keys(source));
//       }
//       var chain = true,
//           index = -1,
//           isFunc = this.isFunction(object),
//           length = methodNames.length;

//       if (options === false) {
//         chain = false;
//       } else if (this.isObject(options) && 'chain' in options) {
//         chain = options.chain;
//       }
//       while (++index < length) {
//         var methodName = methodNames[index],
//             func = source[methodName];

//         object[methodName] = func;
//         if (isFunc) {
//           object.prototype[methodName] = (function(func) {
//             return function() {
//               var chainAll = this.__chain__;
//               if (chain || chainAll) {
//                 var result = object(this.__wrapped__),
//                     actions = result.__actions__ = arrayCopy(this.__actions__);

//                 actions.push({ 'func': func, 'args': arguments, 'thisArg': object });
//                 result.__chain__ = chainAll;
//                 return result;
//               }
//               return func.apply(object, arrayPush([this.value()], arguments));
//             };
//           }(func));
//         }
//       }
//       return object;
//     }
//   };
// })();
