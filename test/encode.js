const fixtures = require('webtorrent-fixtures')
const parseTorrent = require('../')
const test = require('tape')

test('parseTorrent.toTorrentFile', t => {
  const parsedTorrent = parseTorrent(fixtures.leaves.torrent)
  const buf = parseTorrent.toTorrentFile(parsedTorrent)
  const doubleParsedTorrent = parseTorrent(buf)

  t.deepEqual(doubleParsedTorrent, parsedTorrent)
  t.end()
})

test('parseTorrent.toTorrentFile w/ comment field', t => {
  const parsedTorrent = parseTorrent(fixtures.leaves.torrent)
  parsedTorrent.comment = 'hi there!'
  const buf = parseTorrent.toTorrentFile(parsedTorrent)
  const doubleParsedTorrent = parseTorrent(buf)

  t.deepEqual(doubleParsedTorrent, parsedTorrent)
  t.end()
})
