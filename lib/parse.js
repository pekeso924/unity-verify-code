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

const fs = require('fs');
const Imap = require('imap'), inspect = require('util').inspect;

function getHost(email) {
  if (email.includes('@gmail.com')) return 'imap.gmail.com';
  if (email.includes('@hotmail.com')) return 'imap-mail.outlook.com';
  if (email.includes('@outlook.com')) return 'imap-mail.outlook.com';
  if (email.includes('@yahoo.com')) return 'imap.mail.yahoo.com';
  if (email.includes('@foxmail.com')) return 'imap.qq.com';
  if (email.includes('@qq.com')) return 'imap.qq.com';
  return null;
}

function parse(email, password, port, tls, savePath) {
  const host = getHost(email);
  console.log(`[unity-verify-code] Connecting to ${host}:${port} tls=${tls}`);

  const imap = new Imap({
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
    console.log('[unity-verify-code] Source Server Error:', err);
  });

  imap.once('ready', function () {
    console.log('[unity-verify-code] IMAP connection ready');
    imap.openBox('INBOX', false, function (err, box) {
      if (err) {
        console.log('[unity-verify-code] Failed to open INBOX:', err);
        throw err;
      }
      console.log('[unity-verify-code] INBOX opened');
      imap.search(['UNSEEN', ['OR', ['FROM', 'accounts@unity3d.com'], ['FROM', 'no-reply@unity3d.com']]], function (err, results) {
        if (err) {
          console.log('[unity-verify-code] Search error:', err);
          throw err;
        }
        if (!results || results.length === 0) {
          console.log('[unity-verify-code] No unseen verification emails found');
          console.log('[unity-verify-code] Closing IMAP connection');
          return imap.end();
        }

        console.log(`[unity-verify-code] Found ${results.length} message(s)`);
        console.log('[unity-verify-code] Fetching messages');
        let f = imap.fetch(results, { bodies: '', markSeen: true, });
        f.on('message', function(msg, seqno) {
          let prefix = '(#' + seqno + ') ';
          console.log(`[unity-verify-code] Processing message ${prefix}`);
          msg.on('body', function(stream, info) {
            stream.on('data', function (chunk) {
              console.log(`[unity-verify-code] Received ${chunk.length} bytes`);
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
                console.log(`[unity-verify-code] Verification code: ${code}`);
                console.log(`[unity-verify-code] Saving code to ${savePath}`);
                fs.writeFileSync(savePath, code, { encoding: 'utf8' });
              } else {
                console.log('[unity-verify-code] Verification code not found in email body');
              }
            });

            console.log('[unity-verify-code] Closing IMAP connection');
            return imap.end();
          });
        });
      });
    });
  });

  imap.connect();
  console.log('[unity-verify-code] Connection initiated');
}

/*
 * Module Exports
 */
module.exports.parse = parse;
