import fixtures from 'webtorrent-fixtures'
import parseTorrent, { toTorrentFile } from '../index.js'
import test from 'tape'

test('parseTorrent.toTorrentFile', t => {
  const parsedTorrent = parseTorrent(fixtures.leaves.torrent)
  const buf = toTorrentFile(parsedTorrent)
  const doubleParsedTorrent = parseTorrent(buf)

  t.deepEqual(doubleParsedTorrent, parsedTorrent)
  t.end()
})

test('parseTorrent.toTorrentFile w/ comment field', t => {
  const parsedTorrent = parseTorrent(fixtures.leaves.torrent)
  parsedTorrent.comment = 'hi there!'
  const buf = toTorrentFile(parsedTorrent)
  const doubleParsedTorrent = parseTorrent(buf)

  t.deepEqual(doubleParsedTorrent, parsedTorrent)
  t.end()
})
