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
  t.equal(parsed.name, undefined)
  t.deepEqual(parsed.announce, [])

  // magnet uri with v2 hash (btmh)
  const magnetV2 = `magnet:?xt=urn:btmh:1220${v2Hash}`
  parsed = await parseTorrent(magnetV2)
  t.ok(parsed.infoHashV2)
  t.equal(parsed.name, undefined)
  t.deepEqual(parsed.announce, [])

  // parsed torrent with v2 hash
  const torrentObjV2 = { infoHashV2: v2Hash }
  parsed = await parseTorrent(torrentObjV2)
  t.equal(parsed.infoHashV2, v2Hash.toLowerCase())
  t.deepEqual(parsed.announce, [])
  t.deepEqual(parsed.urlList, [])

  // parsed torrent with both v1 and v2 hashes (hybrid)
  const torrentObjHybrid = {
    infoHash: 'd2474e86c95b19b8bcfdb92bc12c9d44667cfa36',
    infoHashV2: v2Hash
  }
  parsed = await parseTorrent(torrentObjHybrid)
  t.equal(parsed.infoHash, 'd2474e86c95b19b8bcfdb92bc12c9d44667cfa36')
  t.equal(parsed.infoHashV2, v2Hash.toLowerCase())
  t.deepEqual(parsed.announce, [])
  t.deepEqual(parsed.urlList, [])

  t.end()
})

test('Parse BitTorrent v2 torrent file', async t => {
  const torrentBuf = fs.readFileSync('./test/torrents/bittorrent-v2-test.torrent')

  try {
    const parsed = await parseTorrent(torrentBuf)

    // Should have both v1 and v2 hashes
    t.ok(parsed.infoHash, 'Should have v1 infoHash')
    t.ok(parsed.infoHashV2, 'Should have v2 infoHashV2')
    t.equal(typeof parsed.infoHash, 'string', 'infoHash should be string')
    t.equal(typeof parsed.infoHashV2, 'string', 'infoHashV2 should be string')
    t.equal(parsed.infoHash.length, 40, 'v1 hash should be 40 chars')
    t.equal(parsed.infoHashV2.length, 64, 'v2 hash should be 64 chars')

    // Should have standard torrent properties
    t.ok(parsed.name, 'Should have name')
    t.ok(Array.isArray(parsed.files), 'Should have files array')
    t.ok(typeof parsed.length === 'number', 'Should have length')
    t.ok(typeof parsed.pieceLength === 'number', 'Should have pieceLength')

    t.pass('BitTorrent v2 torrent parsed successfully')
  } catch (err) {
    t.fail(`Failed to parse v2 torrent: ${err.message}`)
  }

  t.end()
})

test('Parse BitTorrent v2 hybrid torrent file', async t => {
  const torrentBuf = fs.readFileSync('./test/torrents/bittorrent-v2-hybrid-test.torrent')

  try {
    const parsed = await parseTorrent(torrentBuf)

    // Hybrid torrents should have both v1 and v2 hashes
    t.ok(parsed.infoHash, 'Hybrid should have v1 infoHash')
    t.ok(parsed.infoHashV2, 'Hybrid should have v2 infoHashV2')
    t.equal(typeof parsed.infoHash, 'string', 'infoHash should be string')
    t.equal(typeof parsed.infoHashV2, 'string', 'infoHashV2 should be string')
    t.equal(parsed.infoHash.length, 40, 'v1 hash should be 40 chars')
    t.equal(parsed.infoHashV2.length, 64, 'v2 hash should be 64 chars')

    // Should have standard torrent properties
    t.ok(parsed.name, 'Should have name')
    t.ok(Array.isArray(parsed.files), 'Should have files array')
    t.ok(typeof parsed.length === 'number', 'Should have length')
    t.ok(typeof parsed.pieceLength === 'number', 'Should have pieceLength')

    t.pass('BitTorrent v2 hybrid torrent parsed successfully')
  } catch (err) {
    t.fail(`Failed to parse v2 hybrid torrent: ${err.message}`)
  }

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
