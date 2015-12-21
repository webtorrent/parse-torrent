/* global Blob */

var extend = require('xtend')
var fs = require('fs')
var parseTorrent = require('../')
var test = require('tape')

var leaves = fs.readFileSync(__dirname + '/torrents/leaves.torrent')
var leavesParsed = parseTorrent(leaves)
var leavesMagnet = fs.readFileSync(__dirname + '/torrents/leaves-magnet.torrent')
var leavesCorrupt = fs.readFileSync(__dirname + '/torrents/leaves-corrupt.torrent')
var leavesUrlList = fs.readFileSync(__dirname + '/torrents/leaves-url-list.torrent')
var pride = fs.readFileSync(__dirname + '/torrents/pride.torrent')

test('Test supported torrentInfo types', function (t) {
  var parsed

  // info hash (as a hex string)
  parsed = parseTorrent(leavesParsed.infoHash)
  t.equal(parsed.infoHash, leavesParsed.infoHash)
  t.equal(parsed.name, undefined)
  t.deepEqual(parsed.announce, [])

  // info hash (as a Buffer)
  parsed = parseTorrent(new Buffer(leavesParsed.infoHash, 'hex'))
  t.equal(parsed.infoHash, leavesParsed.infoHash)
  t.equal(parsed.name, undefined)
  t.deepEqual(parsed.announce, [])

  // magnet uri (as a utf8 string)
  var magnet = 'magnet:?xt=urn:btih:' + leavesParsed.infoHash
  parsed = parseTorrent(magnet)
  t.equal(parsed.infoHash, leavesParsed.infoHash)
  t.equal(parsed.name, undefined)
  t.deepEqual(parsed.announce, [])

  // magnet uri with name
  parsed = parseTorrent(magnet + '&dn=' + encodeURIComponent(leavesParsed.name))
  t.equal(parsed.infoHash, leavesParsed.infoHash)
  t.equal(parsed.name, leavesParsed.name)
  t.deepEqual(parsed.announce, [])

  // magnet uri with trackers
  parsed = parseTorrent(magnet + '&tr=' + encodeURIComponent('udp://tracker.example.com:80'))
  t.equal(parsed.infoHash, leavesParsed.infoHash)
  t.equal(parsed.name, undefined)
  t.deepEqual(parsed.announce, [ 'udp://tracker.example.com:80' ])

  // .torrent file (as a Buffer)
  parsed = parseTorrent(leaves)
  t.equal(parsed.infoHash, leavesParsed.infoHash)
  t.equal(parsed.name, leavesParsed.name)
  t.deepEqual(parsed.announce, leavesParsed.announce)

  // leavesParsed torrent (as an Object)
  parsed = parseTorrent(leavesParsed)
  t.equal(parsed.infoHash, leavesParsed.infoHash)
  t.equal(parsed.name, leavesParsed.name)
  t.deepEqual(parsed.announce, leavesParsed.announce)

  // leavesParsed torrent (as an Object), with string 'announce' property
  var leavesParsedModified = extend(leavesParsed, { announce: 'udp://tracker.example.com:80' })
  parsed = parseTorrent(leavesParsedModified)
  t.equal(parsed.infoHash, leavesParsed.infoHash)
  t.equal(parsed.name, leavesParsed.name)
  t.deepEqual(parsed.announce, [ 'udp://tracker.example.com:80' ])

  // leavesParsed torrent (as an Object), with array 'announce' property
  leavesParsedModified = extend(leavesParsed, {
    announce: [ 'udp://tracker.example.com:80', 'udp://tracker.example.com:81' ]
  })
  parsed = parseTorrent(leavesParsedModified)
  t.equal(parsed.infoHash, leavesParsed.infoHash)
  t.equal(parsed.name, leavesParsed.name)
  t.deepEqual(parsed.announce, [
    'udp://tracker.example.com:80',
    'udp://tracker.example.com:81'
  ])

  // leavesParsed torrent (as an Object), with empty 'announce' property
  leavesParsedModified = extend(leavesParsed, { announce: undefined })
  parsed = parseTorrent(leavesParsedModified)
  t.equal(parsed.infoHash, leavesParsed.infoHash)
  t.equal(parsed.name, leavesParsed.name)
  t.deepEqual(parsed.announce, [])

  t.end()
})

var leavesMagnetParsed = {
  infoHash: 'd2474e86c95b19b8bcfdb92bc12c9d44667cfa36',
  name: 'Leaves of Grass by Walt Whitman.epub',
  announce: []
}

var prideParsed = {
  infoHash: '455a2295b558ac64e0348fb0c61f433224484908',
  name: 'PRIDE AND PREJUDICE  - Jane Austen',
  announce: []
}

test('parse single file torrent', function (t) {
  var parsed = parseTorrent(leaves)
  t.equal(parsed.infoHash, leavesParsed.infoHash)
  t.equal(parsed.name, leavesParsed.name)
  t.deepEquals(parsed.announce, leavesParsed.announce)
  t.end()
})

test('parse "torrent" from magnet metadata protocol', function (t) {
  var parsed = parseTorrent(leavesMagnet)
  t.equal(parsed.infoHash, leavesMagnetParsed.infoHash)
  t.equal(parsed.name, leavesMagnetParsed.name)
  t.deepEquals(parsed.announce, leavesMagnetParsed.announce)
  t.end()
})

test('parse multiple file torrent', function (t) {
  var parsed = parseTorrent(pride)
  t.equal(parsed.infoHash, prideParsed.infoHash)
  t.equal(parsed.name, prideParsed.name)
  t.deepEquals(parsed.announce, prideParsed.announce)
  t.end()
})

test('torrent file missing `name` field throws', function (t) {
  t.throws(function () {
    parseTorrent(leavesCorrupt)
  })
  t.end()
})

test('parse url-list for webseed support', function (t) {
  var torrent = parseTorrent(leavesUrlList)
  t.deepEqual(torrent.urlList, [ 'http://www2.hn.psu.edu/faculty/jmanis/whitman/leaves-of-grass6x9.pdf' ])
  t.end()
})

function makeBlobShim (buf, name) {
  var file = new Blob([ buf ])
  file.name = name
  return file
}

test('parse single file torrent from Blob', function (t) {
  if (typeof Blob === 'undefined') {
    t.pass('Skipping Blob test')
    t.end()
    return
  }

  t.plan(4)
  var leavesBlob = makeBlobShim(leaves)
  parseTorrent.remote(leavesBlob, function (err, parsed) {
    t.error(err)
    t.equal(parsed.infoHash, leavesParsed.infoHash)
    t.equal(parsed.name, leavesParsed.name)
    t.deepEquals(parsed.announce, leavesParsed.announce)
  })
})
