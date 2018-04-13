var fs = require('fs')
var parseTorrent = require('../')
var path = require('path')
var test = require('tape')

var leavesUrlList = fs.readFileSync(path.join(__dirname, 'torrents/leaves-url-list.torrent'))

test('parse url-list for webseed support', function (t) {
  var torrent = parseTorrent(leavesUrlList)
  t.deepEqual(torrent.urlList, [ 'http://www2.hn.psu.edu/faculty/jmanis/whitman/leaves-of-grass6x9.pdf' ])
  t.end()
})

test('parseTorrent.toTorrentFile url-list for webseed support', function (t) {
  var parsedTorrent = parseTorrent(leavesUrlList)
  var buf = parseTorrent.toTorrentFile(parsedTorrent)
  var doubleParsedTorrent = parseTorrent(buf)
  t.deepEqual(doubleParsedTorrent.urlList, [ 'http://www2.hn.psu.edu/faculty/jmanis/whitman/leaves-of-grass6x9.pdf' ])
  t.end()
})
