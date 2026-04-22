import fs from 'fs'
import parseTorrent from '../index.js'
import test from 'tape'

test('Test BitTorrent v2 hash support', async t => {
  let parsed

  // v2 info hash (as a hex string - 64 characters)
  const v2Hash = 'a'.repeat(64)
  parsed = await parseTorrent(v2Hash)
  t.equal(parsed.infoHashV2, v2Hash.toLowerCase())
  t.equal(parsed.infoHash, undefined, 'v2-only should not have v1 infoHash')
  t.equal(parsed.name, undefined)
  t.deepEqual(parsed.announce, [])

  // v2 info hash (as a Buffer - 32 bytes)
  const v2HashBuffer = Buffer.from(v2Hash, 'hex')
  parsed = await parseTorrent(v2HashBuffer)
  t.equal(parsed.infoHashV2, v2Hash.toLowerCase())

  // magnet uri with v2 hash (btmh)
  const magnetV2 = `magnet:?xt=urn:btmh:1220${v2Hash}`
  parsed = await parseTorrent(magnetV2)
  t.equal(parsed.infoHashV2, v2Hash.toLowerCase(), 'magnet v2 hash should match')

  // hybrid magnet uri (both btih and btmh)
  const hybridMagnet = 'magnet:?xt=urn:btih:631a31dd0a46257d5078c0dee4e66e26f73e42ac&xt=urn:btmh:1220d8dd32ac93357c368556af3ac1d95c9d76bd0dff6fa9833ecdac3d53134efabb'
  parsed = await parseTorrent(hybridMagnet)
  t.equal(parsed.infoHash, '631a31dd0a46257d5078c0dee4e66e26f73e42ac', 'hybrid magnet should have v1 infoHash')
  t.equal(parsed.infoHashV2, 'd8dd32ac93357c368556af3ac1d95c9d76bd0dff6fa9833ecdac3d53134efabb', 'hybrid magnet should have v2 infoHash')

  // parsed torrent with both v1 and v2 hashes (hybrid)
  const torrentObjHybrid = {
    infoHash: 'd2474e86c95b19b8bcfdb92bc12c9d44667cfa36',
    infoHashV2: v2Hash
  }
  parsed = await parseTorrent(torrentObjHybrid)
  t.equal(parsed.infoHash, 'd2474e86c95b19b8bcfdb92bc12c9d44667cfa36')
  t.equal(parsed.infoHashV2, v2Hash.toLowerCase())

  t.end()
})

test('Parse BitTorrent v2 torrent files', async t => {
  const v2Buf = fs.readFileSync('./test/torrents/bittorrent-v2-test.torrent')
  const hybridBuf = fs.readFileSync('./test/torrents/bittorrent-v2-hybrid-test.torrent')

  // Test v2 torrent (should auto-detect and generate v2 hash)
  const v2Parsed = await parseTorrent(v2Buf)
  t.equal(v2Parsed.infoHashV2, 'caf1e1c30e81cb361b9ee167c4aa64228a7fa4fa9f6105232b28ad099f3a302e', 'v2 torrent should have correct v2 hash')
  t.equal(v2Parsed.infoHash, undefined, 'v2-only torrent should not have v1 infoHash')
  t.equal(v2Parsed.pieces, undefined, 'v2-only torrent should not have pieces')

  // Test hybrid torrent (should auto-detect and generate both hashes)
  const hybrid = await parseTorrent(hybridBuf)
  t.equal(hybrid.infoHash, '631a31dd0a46257d5078c0dee4e66e26f73e42ac', 'Hybrid should have correct v1 hash')
  t.equal(hybrid.infoHashV2, 'd8dd32ac93357c368556af3ac1d95c9d76bd0dff6fa9833ecdac3d53134efabb', 'Hybrid should have correct v2 hash')

  // All should have standard properties
  ;[v2Parsed, hybrid].forEach(parsed => {
    t.ok(parsed.name, 'Should have name')
    t.ok(Array.isArray(parsed.files), 'Should have files array')
    t.ok(typeof parsed.length === 'number', 'Should have length')
  })

  t.end()
})

test('Test auto-detection behavior', async t => {
  const torrentBuf = fs.readFileSync('./test/torrents/bittorrent-v2-test.torrent')

  // Test that v2 torrent auto-detects and generates appropriate hashes
  const parsed = await parseTorrent(torrentBuf)
  t.equal(parsed.infoHashV2, 'caf1e1c30e81cb361b9ee167c4aa64228a7fa4fa9f6105232b28ad099f3a302e', 'v2 torrent should have correct auto-generated v2 hash')
  t.equal(parsed.infoHash, undefined, 'v2-only should not have v1 infoHash')
  t.equal(parsed.pieces, undefined, 'v2-only should not have pieces')

  t.end()
})

test('Test validation requires either v1 or v2 hash', async t => {
  // Test that magnet with no valid hash fails
  try {
    await parseTorrent('magnet:?xt=urn:invalid:123')
    t.fail('Should have thrown error for invalid magnet')
  } catch (err) {
    t.ok(err instanceof Error)
    t.ok(err.message.includes('Invalid torrent identifier'))
  }

  // Test that object with neither hash fails
  try {
    await parseTorrent({ name: 'test' })
    t.fail('Should have thrown error for object without hashes')
  } catch (err) {
    t.ok(err instanceof Error)
    t.ok(err.message.includes('Invalid torrent identifier'))
  }

  t.end()
})
