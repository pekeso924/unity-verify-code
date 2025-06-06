#!/usr/bin/env node
/**
 * $File: cli.js $
 * $Date: 2021-09-21 01:03:30 $
 * $Revision: $
 * $Creator: Jen-Chieh Shen $
 * $Notice: See LICENSE.txt for modification and distribution information
 *                   Copyright © 2021 by Shen, Jen-Chieh $
 */

"use strict";

function log(...args) { console.error(...args); }

const fs = require('fs');
const parse = require('./parse');
const args = require('./args');

const usage =
      "usage : unity-verify-code [--port] [--tls]\n" +
      "                          EMAIL [EMAIL ...] PASSWORD [PASSWORD ...]\n" +
      "                          SAVE_PATH [SAVE_PATH ...]\n" +
      "\n" +
      "Unity License Activate : An email parser to get 6 digit verification code.\n" +
      "\n" +
      "positional arguments:\n" +
      "  EMAIL          Username or Email you use to register for Unity account\n" +
      "  PASSWORD       Password to login Unity account\n" +
      "  SAVE_PATH      File path to save the 6 digit code.\n" +
      "\n" +
      "optional arguments:\n" +
      "  --port         Port number of the IMAP server. Default: 143\n" +
      "  --tls          boolean - Perform implicit TLS connection? Default: false\n";

/* CLI */
const cli_md = function () {
  log('[unity-verify-code] CLI started');
  let email = args.getArg(2);
  let password = args.getArg(3);
  let savePath = args.getArg(4);
  let port = args.getArg("--port", 993);
  let tls = args.getArg("--tls", true);

  log(`[unity-verify-code] email=${email} savePath=${savePath} port=${port} tls=${tls}`);

  // Check valid arguments.
  if (args.checkNull(email, password, savePath)) {
    log("[ERROR] Missing positional arguments");
    log(usage);
    return;
  }

  parse.parse(email, password, port, tls, savePath)
    .then(() => log('[unity-verify-code] CLI completed'))
    .catch(err => {
      log('[unity-verify-code] CLI error', err);
      process.exitCode = 1;
    });
};

/** CLI entry */
if (require.main === module) {
  cli_md();
}
