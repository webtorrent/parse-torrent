import fs from 'fs'
import parseTorrent from '../index.js'
import test from 'tape'

test('Test BitTorrent v2 hash support', async t => {
  let parsed

  // v2 info hash (as a hex string - 64 characters)
  const v2Hash = 'a'.repeat(64)
  parsed = await parseTorrent(v2Hash)
  t.equal(parsed.infoHashV2, v2Hash.toLowerCase())
  t.equal(parsed.name, undefined)
  t.deepEqual(parsed.announce, [])

  // v2 info hash (as a Buffer - 32 bytes)
  const v2HashBuffer = Buffer.from(v2Hash, 'hex')
  parsed = await parseTorrent(v2HashBuffer)
  t.equal(parsed.infoHashV2, v2Hash.toLowerCase())

  // magnet uri with v2 hash (btmh)
  const magnetV2 = `magnet:?xt=urn:btmh:1220${v2Hash}`
  parsed = await parseTorrent(magnetV2)
  t.ok(parsed.infoHashV2)

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
  t.ok(v2Parsed.infoHashV2, 'v2 torrent should have v2 hash')
  t.equal(v2Parsed.infoHashV2.length, 64, 'v2 hash should be 64 chars')

  // Test hybrid torrent (should auto-detect and generate both hashes)
  const hybrid = await parseTorrent(hybridBuf)
  t.ok(hybrid.infoHash, 'Hybrid should have v1 hash')
  t.ok(hybrid.infoHashV2, 'Hybrid should have v2 hash')
  t.equal(hybrid.infoHash.length, 40, 'v1 hash should be 40 chars')
  t.equal(hybrid.infoHashV2.length, 64, 'v2 hash should be 64 chars')

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
  t.ok(parsed.infoHashV2, 'v2 torrent should auto-generate v2 hash')

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
