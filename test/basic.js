/* global Blob */

import extend from 'xtend'
import fixtures from 'webtorrent-fixtures'
import parseTorrent, { remote } from '../index.js'
import test from 'tape'

test('Test supported torrentInfo types', t => {
  let parsed

  // info hash (as a hex string)
  parsed = parseTorrent(fixtures.leaves.parsedTorrent.infoHash)
  t.equal(parsed.infoHash, fixtures.leaves.parsedTorrent.infoHash)
  t.equal(parsed.name, undefined)
  t.deepEqual(parsed.announce, [])

  // info hash (as a Buffer)
  parsed = parseTorrent(Buffer.from(fixtures.leaves.parsedTorrent.infoHash, 'hex'))
  t.equal(parsed.infoHash, fixtures.leaves.parsedTorrent.infoHash)
  t.equal(parsed.name, undefined)
  t.deepEqual(parsed.announce, [])

  // magnet uri (as a utf8 string)
  const magnet = `magnet:?xt=urn:btih:${fixtures.leaves.parsedTorrent.infoHash}`
  parsed = parseTorrent(magnet)
  t.equal(parsed.infoHash, fixtures.leaves.parsedTorrent.infoHash)
  t.equal(parsed.name, undefined)
  t.deepEqual(parsed.announce, [])

  // stream-magnet uri (as a utf8 string)
  const streamMagnet = `stream-magnet:?xt=urn:btih:${fixtures.leaves.parsedTorrent.infoHash}`
  parsed = parseTorrent(streamMagnet)
  t.equal(parsed.infoHash, fixtures.leaves.parsedTorrent.infoHash)
  t.equal(parsed.name, undefined)
  t.deepEqual(parsed.announce, [])

  // magnet uri with name
  parsed = parseTorrent(`${magnet}&dn=${encodeURIComponent(fixtures.leaves.parsedTorrent.name)}`)
  t.equal(parsed.infoHash, fixtures.leaves.parsedTorrent.infoHash)
  t.equal(parsed.name, fixtures.leaves.parsedTorrent.name)
  t.deepEqual(parsed.announce, [])

  // magnet uri with trackers
  parsed = parseTorrent(`${magnet}&tr=${encodeURIComponent('udp://tracker.example.com:80')}`)
  t.equal(parsed.infoHash, fixtures.leaves.parsedTorrent.infoHash)
  t.equal(parsed.name, undefined)
  t.deepEqual(parsed.announce, ['udp://tracker.example.com:80'])

  // .torrent file (as a Buffer)
  parsed = parseTorrent(fixtures.leaves.torrent)
  t.equal(parsed.infoHash, fixtures.leaves.parsedTorrent.infoHash)
  t.equal(parsed.name, fixtures.leaves.parsedTorrent.name)
  t.deepEqual(parsed.announce, fixtures.leaves.parsedTorrent.announce)

  // parsed torrent (as an Object)
  parsed = parseTorrent(fixtures.leaves.parsedTorrent)
  t.equal(parsed.infoHash, fixtures.leaves.parsedTorrent.infoHash)
  t.equal(parsed.name, fixtures.leaves.parsedTorrent.name)
  t.deepEqual(parsed.announce, fixtures.leaves.parsedTorrent.announce)

  // parsed torrent (as an Object), with string 'announce' property
  let leavesParsedModified = extend(fixtures.leaves.parsedTorrent, { announce: 'udp://tracker.example.com:80' })
  parsed = parseTorrent(leavesParsedModified)
  t.equal(parsed.infoHash, fixtures.leaves.parsedTorrent.infoHash)
  t.equal(parsed.name, fixtures.leaves.parsedTorrent.name)
  t.deepEqual(parsed.announce, ['udp://tracker.example.com:80'])

  // parsed torrent (as an Object), with array 'announce' property
  leavesParsedModified = extend(fixtures.leaves.parsedTorrent, {
    announce: ['udp://tracker.example.com:80', 'udp://tracker.example.com:81']
  })
  parsed = parseTorrent(leavesParsedModified)
  t.equal(parsed.infoHash, fixtures.leaves.parsedTorrent.infoHash)
  t.equal(parsed.name, fixtures.leaves.parsedTorrent.name)
  t.deepEqual(parsed.announce, [
    'udp://tracker.example.com:80',
    'udp://tracker.example.com:81'
  ])

  // parsed torrent (as an Object), with empty 'announce' property
  leavesParsedModified = extend(fixtures.leaves.parsedTorrent, { announce: undefined })
  parsed = parseTorrent(leavesParsedModified)
  t.equal(parsed.infoHash, fixtures.leaves.parsedTorrent.infoHash)
  t.equal(parsed.name, fixtures.leaves.parsedTorrent.name)
  t.deepEqual(parsed.announce, [])

  t.end()
})

test('parse single file torrent', t => {
  const parsed = parseTorrent(fixtures.leaves.torrent)
  t.equal(parsed.infoHash, fixtures.leaves.parsedTorrent.infoHash)
  t.equal(parsed.name, fixtures.leaves.parsedTorrent.name)
  t.deepEquals(parsed.announce, fixtures.leaves.parsedTorrent.announce)
  t.end()
})

test('parse multiple file torrent', t => {
  const parsed = parseTorrent(fixtures.numbers.torrent)
  t.equal(parsed.infoHash, fixtures.numbers.parsedTorrent.infoHash)
  t.equal(parsed.name, fixtures.numbers.parsedTorrent.name)
  t.deepEquals(parsed.files, fixtures.numbers.parsedTorrent.files)
  t.deepEquals(parsed.announce, fixtures.numbers.parsedTorrent.announce)
  t.end()
})

test('torrent file missing `name` field throws', t => {
  t.throws(() => {
    parseTorrent(fixtures.invalid.torrent)
  })
  t.end()
})

test('parse url-list for webseed support', t => {
  const torrent = parseTorrent(fixtures.bunny.torrent)
  t.deepEqual(torrent.urlList, ['http://distribution.bbb3d.renderfarming.net/video/mp4/bbb_sunflower_1080p_30fps_stereo_abl.mp4'])
  t.end()
})

test('parse single file torrent from Blob', t => {
  if (typeof Blob === 'undefined') {
    t.pass('Skipping Blob test')
    t.end()
    return
  }

  t.plan(4)
  const leavesBlob = makeBlobShim(fixtures.leaves.torrent)
  remote(leavesBlob, (err, parsed) => {
    t.error(err)
    t.equal(parsed.infoHash, fixtures.leaves.parsedTorrent.infoHash)
    t.equal(parsed.name, fixtures.leaves.parsedTorrent.name)
    t.deepEquals(parsed.announce, fixtures.leaves.parsedTorrent.announce)
  })
})

function makeBlobShim (buf, name) {
  const file = new Blob([buf])
  file.name = name
  return file
}
