#!/usr/bin/env node

var fs = require('fs')
var parseTorrent = require('../')

function usage () {
  console.error('Usage: parse-torrent /path/to/torrent')
  console.error('       parse-torrent magnet_uri')
}

var torrentId = process.argv[2]

if (!torrentId) {
  usage()
  process.exit(-1)
}

var parsedTorrent
try {
  parsedTorrent = parseTorrent(fs.readFileSync(torrentId))
} catch (err) {
  parsedTorrent = parseTorrent(torrentId)
}

if (!parsedTorrent) {
  console.error('Invalid torrent identifier\n')
  usage()
  process.exit(-1)
}

delete parsedTorrent.info
delete parsedTorrent.infoBuffer

console.log(JSON.stringify(parsedTorrent, undefined, 2))
