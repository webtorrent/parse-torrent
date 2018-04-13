var fixtures = require('webtorrent-fixtures')
var parseTorrent = require('../')
var test = require('tape')

test('parseTorrent.toTorrentFile', function (t) {
  var parsedTorrent = parseTorrent(fixtures.leaves.torrent)
  var buf = parseTorrent.toTorrentFile(parsedTorrent)
  var doubleParsedTorrent = parseTorrent(buf)

  t.deepEqual(doubleParsedTorrent, parsedTorrent)
  t.end()
})

test('parseTorrent.toTorrentFile w/ comment field', function (t) {
  var parsedTorrent = parseTorrent(fixtures.leaves.torrent)
  parsedTorrent.comment = 'hi there!'
  var buf = parseTorrent.toTorrentFile(parsedTorrent)
  var doubleParsedTorrent = parseTorrent(buf)

  t.deepEqual(doubleParsedTorrent, parsedTorrent)
  t.end()
})
