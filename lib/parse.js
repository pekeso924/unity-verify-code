#!/usr/bin/env node
/**
 * $File: parse.js $
 * $Date: 2021-09-21 01:04:21 $
 * $Revision: $
 * $Creator: Jen-Chieh Shen $
 * $Notice: See LICENSE.txt for modification and distribution information
 *                   Copyright © 2021 by Shen, Jen-Chieh $
 */

"use strict";

function log(...args) { console.error(...args); }

const fs = require('fs');
let Imap;
try {
  Imap = require('imap');
} catch (e) {
  log('[unity-verify-code] Failed to load imap module:', e.message);
  Imap = null;
}
const inspect = require('util').inspect;

function getHost(email) {
  log(`[unity-verify-code] getHost called with email: ${email}`);
  if (email.includes('@gmail.com')) return 'imap.gmail.com';
  if (email.includes('@hotmail.com')) return 'imap-mail.outlook.com';
  if (email.includes('@outlook.com')) return 'imap-mail.outlook.com';
  if (email.includes('@yahoo.com')) return 'imap.mail.yahoo.com';
  if (email.includes('@foxmail.com')) return 'imap.qq.com';
  if (email.includes('@qq.com')) return 'imap.qq.com';
  return null;
}

function parse(email, password, port, tls, savePath, ImapClass = Imap) {
  log('[unity-verify-code] parse called');
  log(`[unity-verify-code] email=${email} port=${port} tls=${tls} savePath=${savePath}`);
  const host = getHost(email);
  log(`[unity-verify-code] Connecting to ${host}:${port} tls=${tls}`);

  const ImapImpl = ImapClass || Imap;
  if (!ImapImpl) {
    return Promise.reject(new Error('Imap module not available'));
  }

  return new Promise((resolve, reject) => {
    const imap = new ImapImpl({
      user: email,
      password: password,
      host: host,
      port: port,
      tls: tls,
      tlsOptions: {
        rejectUnauthorized: false
      },
      authTimeout: 3000,
    });

    imap.once('error', function (err) {
      log('[unity-verify-code] Source Server Error:', err);
      reject(err);
    });

    imap.once('end', function() {
      log('[unity-verify-code] Connection ended');
      resolve();
    });

  imap.once('ready', function () {
    log('[unity-verify-code] IMAP connection ready');
    imap.openBox('INBOX', false, function (err, box) {
      if (err) {
        log('[unity-verify-code] Failed to open INBOX:', err);
        return reject(err);
      }
      log('[unity-verify-code] INBOX opened');
      imap.search(['UNSEEN', ['OR', ['FROM', 'accounts@unity3d.com'], ['FROM', 'no-reply@unity3d.com']]], function (err, results) {
        if (err) {
          log('[unity-verify-code] Search error:', err);
          return reject(err);
        }
        if (!results || results.length === 0) {
          log('[unity-verify-code] No unseen verification emails found');
          log('[unity-verify-code] Closing IMAP connection');
          return imap.end();
        }

        log(`[unity-verify-code] Found ${results.length} message(s)`);
        log('[unity-verify-code] Fetching messages');
        let f = imap.fetch(results, { bodies: '', markSeen: true, });
        f.on('message', function(msg, seqno) {
          let prefix = '(#' + seqno + ') ';
          log(`[unity-verify-code] Processing message ${prefix}`);
          msg.on('body', function(stream, info) {
            stream.on('data', function (chunk) {
              log(`[unity-verify-code] Received ${chunk.length} bytes`);
              let content = chunk.toString('utf8');

              const patterns = [
                {
                  start: "verification code is ",
                  end: " and will be expired in",
                },
                {
                  start: "Verification code for your Unity ID is ",
                  end: " and will expire in",
                },
              ];

              let code = null;
              for (const p of patterns) {
                let s = content.indexOf(p.start);
                if (s === -1) continue;
                let e = content.indexOf(p.end, s);
                if (e === -1) continue;
                let part = content.substring(s + p.start.length, e).trim();
                if (/^\d{6}$/.test(part)) {
                  code = part;
                  break;
                }
              }

              if (!code) {
                let m = content.match(/\b\d{6}\b/);
                if (m) code = m[0];
              }

              if (code) {
                log(`[unity-verify-code] Verification code: ${code}`);
                log(`[unity-verify-code] Saving code to ${savePath}`);
                fs.writeFileSync(savePath, code, { encoding: 'utf8' });
              } else {
                log('[unity-verify-code] Verification code not found in email body');
              }
            });

            log('[unity-verify-code] Closing IMAP connection');
            return imap.end();
          });
        });
      });
    });
  });

    imap.connect();
    log('[unity-verify-code] Connection initiated');
  });
}

/*
 * Module Exports
 */
module.exports.parse = parse;
module.exports.getHost = getHost;
