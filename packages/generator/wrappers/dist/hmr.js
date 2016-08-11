"use strict";var _createClass=function(){function defineProperties(target,props){for(var i=0;i<props.length;i++){var descriptor=props[i];descriptor.enumerable=descriptor.enumerable||false;descriptor.configurable=true;if("value"in descriptor)descriptor.writable=true;Object.defineProperty(target,descriptor.key,descriptor)}}return function(Constructor,protoProps,staticProps){if(protoProps)defineProperties(Constructor.prototype,protoProps);if(staticProps)defineProperties(Constructor,staticProps);return Constructor}}();function _classCallCheck(instance,Constructor){if(!(instance instanceof Constructor)){throw new TypeError("Cannot call a class as a function")}}var global=typeof window!=="undefined"&&window||typeof self!=="undefined"&&self||{};var GLOBAL=global;var root=global;var __SB_PUNDLE_DEFAULT_EXPORT={};var __sb_pundle={cache:{},extensions:[".js"],resolve:function resolve(path){return path}};var __require=void 0;var __sb_pundle_hot=function(){function __sb_pundle_hot(){_classCallCheck(this,__sb_pundle_hot);this.data={};this.accepts=new Set;this.declines=new Set;this.callbacks_accept=new Set;this.callbacks_dispose=new Set}_createClass(__sb_pundle_hot,[{key:"accept",value:function accept(a,b){var clause=typeof a==="string"?a:"*";var callback=typeof a==="function"&&a||typeof b==="function"&&b||null;this.accepts.add(clause);if(callback){this.callbacks_accept.add({clause:clause,callback:callback})}}},{key:"decline",value:function decline(){var path=arguments.length<=0||arguments[0]===undefined?null:arguments[0];this.declines.add(typeof path==="string"?path:"*")}},{key:"dispose",value:function dispose(callback){this.callbacks_dispose.add(callback)}},{key:"addDisposeHandler",value:function addDisposeHandler(callback){this.callbacks_dispose.add(callback)}},{key:"removeDisposeHandler",value:function removeDisposeHandler(callback){this.callbacks_dispose.delete(callback)}}]);return __sb_pundle_hot}();function __sb_pundle_hmr_is_accepted(id,givenMatchAgainst){var module=__sb_pundle.cache[id];var matchAgainst=givenMatchAgainst||id;return module&&((module.hot.accepts.has("*")||module.hot.accepts.has(matchAgainst))&&1||module.parents.some(function(entry){return __sb_pundle_hmr_is_accepted(entry,matchAgainst)})&&2)}function __sb_pundle_hmr_debug_inter_requires(unresolved){var added=new Set;var toReturn=[];for(var i=0,length=unresolved.length;i<length;++i){var child=unresolved[i];var childModule=__sb_pundle.cache[child];for(var _i=0,_length=childModule.parents.length;_i<_length;++_i){var parent=childModule.parents[_i];var parentModule=__sb_pundle.cache[parent];for(var __i=0,__length=parentModule.parents.length;__i<__length;++__i){var item=parentModule.parents[__i];if(item===child&&!added.has(parent+"-"+child)&&!added.has(child+"-"+parent)){added.add(parent+"-"+child);toReturn.push({a:child,b:parent})}}}}return toReturn}function __sb_pundle_hmr_get_update_order(applyTo){var unresolved=[].concat(applyTo);var resolved=[];while(unresolved.length){var i=unresolved.length;var passed=true;var foundOne=false;var toRemove=[];while(i--){var _id=unresolved[i];var module=__sb_pundle.cache[_id];var acceptanceStatus=__sb_pundle_hmr_is_accepted(_id);if(!module||applyTo.indexOf(_id)!==-1&&!acceptanceStatus){passed=false}var parentsResolved=!module.parents.length||module.parents.every(function(parent){return resolved.indexOf(parent)!==-1});if(acceptanceStatus===1||parentsResolved){foundOne=true;resolved.push(_id);toRemove.push(_id)}else if(acceptanceStatus===2){for(var j=0,length=module.parents.length;j<length;++j){var parent=module.parents[j];if(resolved.indexOf(parent)===-1&&unresolved.indexOf(parent)===-1){foundOne=true;unresolved.push(parent)}}}}for(var _j=0,_length2=toRemove.length;_j<_length2;++_j){unresolved.splice(unresolved.indexOf(toRemove[_j]),1)}if(!passed&&!foundOne){var message="Unable to apply HMR. Page refresh will be required";var interRequires=__sb_pundle_hmr_debug_inter_requires(unresolved);if(interRequires.length){message="Unable to apply HMR because some modules require their parents";console.log("[HMR] Error: Update could not be applied because these modules require each other:\n"+interRequires.map(function(item){return"  • "+item.a+" <--> "+item.b}).join("\n"))}var error=new Error(message);error.code="HMR_REBOOT_REQUIRED";throw error}}return resolved.reverse()}function __sb_pundle_hmr_apply(applyTo){var modules=__sb_pundle_hmr_get_update_order(applyTo);var _loop=function _loop(i,length){var id=modules[i];var module=__sb_pundle.cache[id];var data={};var oldHot=module.hot;oldHot.callbacks_dispose.forEach(function(callback){callback(data)});module.exports={};module.hot=new __sb_pundle_hot;__sb_pundle.cache[id].callback.call(module.exports,module,module.exports);oldHot.callbacks_accept.forEach(function(_ref){var clause=_ref.clause;var callback=_ref.callback;if(clause==="*"||modules.indexOf(clause)!==-1){callback()}})};for(var i=0,length=modules.length;i<length;++i){_loop(i,length)}}function __sb_pundle_register(filePath,callback){if(__sb_pundle.cache[filePath]){__sb_pundle.cache[filePath].callback=callback}else{var module={id:filePath,hot:new __sb_pundle_hot,filePath:filePath,callback:callback,exports:__SB_PUNDLE_DEFAULT_EXPORT,parents:[]};__sb_pundle.cache[filePath]=module}}function __sb_pundle_require_module(fromModule,request){if(!(request in __sb_pundle.cache)){throw new Error("Module not found")}var module=__sb_pundle.cache[request];if(module.parents.indexOf(fromModule)===-1&&fromModule!=="$root"){module.parents.push(fromModule)}if(module.exports===__SB_PUNDLE_DEFAULT_EXPORT){module.exports={};module.callback.call(module.exports,module,module.exports)}return module.exports}function __sb_generate_require(moduleName){var bound=__sb_pundle_require_module.bind(null,moduleName);bound.cache=__sb_pundle.cache;bound.extensions=__sb_pundle.extensions;bound.resolve=__sb_pundle.resolve;return bound}__require=__sb_generate_require("$root");