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

  // Test v2 torrent with default settings (v1 hash only)
  const v2Default = await parseTorrent(v2Buf)
  t.ok(v2Default.infoHash, 'v2 torrent should have v1 hash by default')
  t.notOk(v2Default.infoHashV2, 'v2 torrent should not have v2 hash by default')

  // Test v2 torrent with both hashes
  const v2Both = await parseTorrent(v2Buf, { hashMode: 'both' })
  t.ok(v2Both.infoHash, 'Should have v1 hash')
  t.ok(v2Both.infoHashV2, 'Should have v2 hash')
  t.equal(v2Both.infoHash.length, 40, 'v1 hash should be 40 chars')
  t.equal(v2Both.infoHashV2.length, 64, 'v2 hash should be 64 chars')

  // Test v2 torrent with v2 hash only
  const v2Only = await parseTorrent(v2Buf, { hashMode: 'v2' })
  t.notOk(v2Only.infoHash, 'Should not have v1 hash')
  t.ok(v2Only.infoHashV2, 'Should have v2 hash')

  // Test hybrid torrent
  const hybrid = await parseTorrent(hybridBuf, { hashMode: 'both' })
  t.ok(hybrid.infoHash, 'Hybrid should have v1 hash')
  t.ok(hybrid.infoHashV2, 'Hybrid should have v2 hash')

  // All should have standard properties
  ;[v2Default, v2Both, v2Only, hybrid].forEach(parsed => {
    t.ok(parsed.name, 'Should have name')
    t.ok(Array.isArray(parsed.files), 'Should have files array')
    t.ok(typeof parsed.length === 'number', 'Should have length')
  })

  t.end()
})

test('Test hash mode options', async t => {
  const torrentBuf = fs.readFileSync('./test/torrents/bittorrent-v2-test.torrent')

  // Test v1 mode (default)
  const v1Mode = await parseTorrent(torrentBuf, { hashMode: 'v1' })
  t.ok(v1Mode.infoHash, 'v1 mode should generate v1 hash')
  t.notOk(v1Mode.infoHashV2, 'v1 mode should not generate v2 hash')

  // Test v2 mode
  const v2Mode = await parseTorrent(torrentBuf, { hashMode: 'v2' })
  t.notOk(v2Mode.infoHash, 'v2 mode should not generate v1 hash')
  t.ok(v2Mode.infoHashV2, 'v2 mode should generate v2 hash')

  // Test both mode
  const bothMode = await parseTorrent(torrentBuf, { hashMode: 'both' })
  t.ok(bothMode.infoHash, 'both mode should generate v1 hash')
  t.ok(bothMode.infoHashV2, 'both mode should generate v2 hash')

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
