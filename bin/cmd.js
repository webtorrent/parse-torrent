#!/usr/bin/env node

var fs = require('fs')
var parseTorrent = require('../')

function usage () {
  console.error('Usage: parse-torrent /path/to/torrent')
  console.error('       parse-torrent magnet_uri')
}

function error (err) {
  console.error('Invalid torrent identifier\n')
  if (err) console.error(err)
  usage()
  process.exit(-1)
}

var torrentId = process.argv[2]

if (!torrentId) {
  usage()
  process.exit(-1)
}

var parsedTorrent = parseTorrent(torrentId)
if (!parsedTorrent || !parsedTorrent.infoHash) {
  try {
    parsedTorrent = parseTorrent(fs.readFileSync(torrentId))
  } catch (err) {
    error(err)
  }
}

if (!parsedTorrent) error()

delete parsedTorrent.info
delete parsedTorrent.infoBuffer

console.log(JSON.stringify(parsedTorrent, undefined, 2))
