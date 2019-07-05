const fs = require('fs')
const parseTorrent = require('../')
const path = require('path')
const test = require('tape')

const leavesUrlList = fs.readFileSync(path.join(__dirname, 'torrents/leaves-url-list.torrent'))

test('parse url-list for webseed support', t => {
  const torrent = parseTorrent(leavesUrlList)
  t.deepEqual(torrent.urlList, ['http://www2.hn.psu.edu/faculty/jmanis/whitman/leaves-of-grass6x9.pdf'])
  t.end()
})

test('parseTorrent.toTorrentFile url-list for webseed support', t => {
  const parsedTorrent = parseTorrent(leavesUrlList)
  const buf = parseTorrent.toTorrentFile(parsedTorrent)
  const doubleParsedTorrent = parseTorrent(buf)
  t.deepEqual(doubleParsedTorrent.urlList, ['http://www2.hn.psu.edu/faculty/jmanis/whitman/leaves-of-grass6x9.pdf'])
  t.end()
})
