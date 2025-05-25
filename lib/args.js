#!/usr/bin/env node
/**
 * $File: args.js $
 * $Date: 2021-09-21 02:18:26 $
 * $Revision: $
 * $Creator: Jen-Chieh Shen $
 * $Notice: See LICENSE.txt for modification and distribution information
 *                   Copyright © 2021 by Shen, Jen-Chieh $
 */

"use strict";

function log(...args) { console.error(...args); }

/**
 * Return true, if there is one invalid arguments.
 */
function checkNull() {
  log('[unity-verify-code] checkNull called with', arguments);
  for (let index = 0; index < arguments.length; ++index) {
    if (!arguments[index]) {
      log(`[unity-verify-code] Argument at index ${index} is null/undefined`);
      return true;
    }
  }
  return false;
}

/**
 * Return argument by it's `name`.
 * @param { string } name - The name of the argument.
 * @param { any } defaultValue - Default value, this is for optional arguments.
 */
function getArg(name, defaultValue = null) {
  log(`[unity-verify-code] getArg called name=${name} default=${defaultValue}`);
  let args = process.argv;
  if (typeof name === 'number') {
    let v = args[name];
    log(`[unity-verify-code] getArg index ${name} => ${v}`);
    return v;
  } else {
    for (let index = 0; index < args.length; ++index) {
      if (args[index] === name && args.length > index + 1) {
        let v = args[index + 1];
        log(`[unity-verify-code] getArg flag ${name} => ${v}`);
        return v;
      }
    }
  }
  log(`[unity-verify-code] getArg using default => ${defaultValue}`);
  return defaultValue;
}

/*
 * Module Exports
 */
module.exports.checkNull = checkNull;
module.exports.getArg = getArg;
