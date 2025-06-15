/*! parse-torrent. MIT License. WebTorrent LLC <https://webtorrent.io/opensource> */

import bencode from 'bencode'
import fs from 'fs' // browser exclude
import fetch from 'cross-fetch-ponyfill'
import magnet, { encode } from 'magnet-uri'
import path from 'path'
import { hash, arr2hex, text2arr, arr2text } from 'uint8-util'
import queueMicrotask from 'queue-microtask'

/**
 * Parse a torrent identifier (magnet uri, .torrent file, info hash)
 * @param  {string|ArrayBufferView|Object} torrentId
 * @param  {Object} options
 * @param  {string} options.hashMode - 'v1', 'v2', or 'both' (default: 'v1')
 * @return {Object}
 */
async function parseTorrent (torrentId, options = {}) {
  if (typeof torrentId === 'string') {
    if (/^(stream-)?magnet:/.test(torrentId)) {
      // if magnet uri (string)
      const torrentObj = magnet(torrentId)

      // infoHash (v1) or infoHashV2 (v2) won't be defined if a non-bittorrent magnet is passed
      if (!torrentObj.infoHash && !torrentObj.infoHashV2) {
        throw new Error('Invalid torrent identifier')
      }

      return torrentObj
    } else if (/^[a-f0-9]{40}$/i.test(torrentId) || /^[a-z2-7]{32}$/i.test(torrentId)) {
      // if info hash v1 (hex/base-32 string)
      return magnet(`magnet:?xt=urn:btih:${torrentId}`)
    } else if (/^[a-f0-9]{64}$/i.test(torrentId)) {
      // if info hash v2 (hex string)
      return magnet(`magnet:?xt=urn:btmh:1220${torrentId}`)
    }
  } else if (ArrayBuffer.isView(torrentId)) {
    if (torrentId.length === 20) {
      // if info hash v1 (buffer)
      return magnet(`magnet:?xt=urn:btih:${arr2hex(torrentId)}`)
    } else if (torrentId.length === 32) {
      // if info hash v2 (buffer)
      return magnet(`magnet:?xt=urn:btmh:1220${arr2hex(torrentId)}`)
    } else {
      // if .torrent file (buffer)
      return await decodeTorrentFile(torrentId, options) // might throw
    }
  } else if (torrentId && (torrentId.infoHash || torrentId.infoHashV2)) {
    // if parsed torrent (from `parse-torrent` or `magnet-uri`)
    if (torrentId.infoHash) {
      torrentId.infoHash = torrentId.infoHash.toLowerCase()
    }
    if (torrentId.infoHashV2) {
      torrentId.infoHashV2 = torrentId.infoHashV2.toLowerCase()
    }

    if (!torrentId.announce) torrentId.announce = []

    if (typeof torrentId.announce === 'string') {
      torrentId.announce = [torrentId.announce]
    }

    if (!torrentId.urlList) torrentId.urlList = []

    return torrentId
  } else {
    throw new Error('Invalid torrent identifier')
  }
}

async function parseTorrentRemote (torrentId, opts, cb) {
  if (typeof opts === 'function') return parseTorrentRemote(torrentId, {}, opts)
  if (typeof cb !== 'function') throw new Error('second argument must be a Function')

  let parsedTorrent
  try {
    parsedTorrent = await parseTorrent(torrentId, opts)
  } catch (err) {
    // If torrent fails to parse, it could be a Blob, http/https URL or
    // filesystem path, so don't consider it an error yet.
  }

  if (parsedTorrent && (parsedTorrent.infoHash || parsedTorrent.infoHashV2)) {
    queueMicrotask(() => {
      cb(null, parsedTorrent)
    })
  } else if (isBlob(torrentId)) {
    try {
      const torrentBuf = new Uint8Array(await torrentId.arrayBuffer())
      parseOrThrow(torrentBuf)
    } catch (err) {
      return cb(new Error(`Error converting Blob: ${err.message}`))
    }
  } else if (/^https?:/.test(torrentId)) {
    try {
      const res = await fetch(torrentId, {
        headers: { 'user-agent': 'WebTorrent (https://webtorrent.io)' },
        signal: AbortSignal.timeout(30 * 1000),
        ...opts
      })
      const torrentBuf = new Uint8Array(await res.arrayBuffer())
      parseOrThrow(torrentBuf)
    } catch (err) {
      return cb(new Error(`Error downloading torrent: ${err.message}`))
    }
  } else if (typeof fs.readFile === 'function' && typeof torrentId === 'string') {
    // assume it's a filesystem path
    fs.readFile(torrentId, (err, torrentBuf) => {
      if (err) return cb(new Error('Invalid torrent identifier'))
      parseOrThrow(torrentBuf)
    })
  } else {
    queueMicrotask(() => {
      cb(new Error('Invalid torrent identifier'))
    })
  }

  async function parseOrThrow (torrentBuf) {
    try {
      parsedTorrent = await parseTorrent(torrentBuf, opts)
    } catch (err) {
      return cb(err)
    }
    if (parsedTorrent && (parsedTorrent.infoHash || parsedTorrent.infoHashV2)) cb(null, parsedTorrent)
    else cb(new Error('Invalid torrent identifier'))
  }
}

/**
 * Parse a torrent. Throws an exception if the torrent is missing required fields.
 * @param  {ArrayBufferView|Object} torrent
 * @param  {Object} options
 * @param  {string} options.hashMode - 'v1', 'v2', or 'both' (default: 'v1')
 * @return {Object}        parsed torrent
 */
async function decodeTorrentFile (torrent, options = {}) {
  if (ArrayBuffer.isView(torrent)) {
    torrent = bencode.decode(torrent)
  }

  // sanity check
  ensure(torrent.info, 'info')
  ensure(torrent.info['name.utf-8'] || torrent.info.name, 'info.name')
  ensure(torrent.info['piece length'], 'info[\'piece length\']')

  const isV2 = torrent.info['meta version'] === 2

  if (isV2) {
    // BitTorrent v2 specific validation
    ensure(torrent.info['file tree'], 'info[\'file tree\']')
  } else {
    // BitTorrent v1 validation
    ensure(torrent.info.pieces, 'info.pieces')

    if (torrent.info.files) {
      torrent.info.files.forEach(file => {
        ensure(typeof file.length === 'number', 'info.files[0].length')
        ensure(file['path.utf-8'] || file.path, 'info.files[0].path')
      })
    } else {
      ensure(typeof torrent.info.length === 'number', 'info.length')
    }
  }

  const result = {
    info: torrent.info,
    infoBuffer: bencode.encode(torrent.info),
    name: arr2text(torrent.info['name.utf-8'] || torrent.info.name),
    announce: []
  }

  // Generate hashes based on user preference
  const { hashMode = 'v1' } = options

  if (hashMode === 'v1' || hashMode === 'both') {
    result.infoHashBuffer = await hash(result.infoBuffer)
    result.infoHash = arr2hex(result.infoHashBuffer)
  }

  if (hashMode === 'v2' || hashMode === 'both') {
    result.infoHashV2Buffer = await hash(result.infoBuffer, undefined, 'sha-256')
    result.infoHashV2 = arr2hex(result.infoHashV2Buffer)
  }

  if (torrent.info.private !== undefined) result.private = !!torrent.info.private

  if (torrent['creation date']) result.created = new Date(torrent['creation date'] * 1000)
  if (torrent['created by']) result.createdBy = arr2text(torrent['created by'])

  if (ArrayBuffer.isView(torrent.comment)) result.comment = arr2text(torrent.comment)

  // announce and announce-list will be missing if metadata fetched via ut_metadata
  if (Array.isArray(torrent['announce-list']) && torrent['announce-list'].length > 0) {
    torrent['announce-list'].forEach(urls => {
      urls.forEach(url => {
        result.announce.push(arr2text(url))
      })
    })
  } else if (torrent.announce) {
    result.announce.push(arr2text(torrent.announce))
  }

  // handle url-list (BEP19 / web seeding)
  if (ArrayBuffer.isView(torrent['url-list'])) {
    // some clients set url-list to empty string
    torrent['url-list'] = torrent['url-list'].length > 0
      ? [torrent['url-list']]
      : []
  }
  result.urlList = (torrent['url-list'] || []).map(url => arr2text(url))

  // remove duplicates by converting to Set and back
  result.announce = Array.from(new Set(result.announce))
  result.urlList = Array.from(new Set(result.urlList))

  // Process files (simplified to use same logic for v1 and v2)
  if (isV2 && torrent.info['file tree']) {
    // Convert v2 file tree to v1-style files array for consistent processing
    const files = []
    function processFileTree (tree, currentPath = []) {
      for (const [name, entry] of Object.entries(tree)) {
        const fullPath = [...currentPath, name]
        if (entry.length !== undefined) {
          files.push({
            'path.utf-8': fullPath,
            length: entry.length
          })
        } else {
          processFileTree(entry, fullPath)
        }
      }
    }
    processFileTree(torrent.info['file tree'])
    torrent.info.files = files
  }

  // Use unified file processing logic
  const files = torrent.info.files || [torrent.info]
  result.files = files.map((file, i) => {
    const parts = [].concat(result.name, file['path.utf-8'] || file.path || []).map(p => ArrayBuffer.isView(p) ? arr2text(p) : p)
    return {
      path: path.join.apply(null, [path.sep].concat(parts)).slice(1),
      name: parts[parts.length - 1],
      length: file.length,
      offset: files.slice(0, i).reduce(sumLength, 0)
    }
  })

  result.length = files.reduce(sumLength, 0)

  const lastFile = result.files[result.files.length - 1]

  result.pieceLength = torrent.info['piece length']
  result.lastPieceLength = ((lastFile.offset + lastFile.length) % result.pieceLength) || result.pieceLength

  // Simplified pieces handling - fall back to v1 logic for both
  if (torrent.info.pieces) {
    result.pieces = splitPieces(torrent.info.pieces)
  } else {
    // For v2 torrents without pieces, create empty array
    result.pieces = []
  }

  return result
}

/**
 * Convert a parsed torrent object back into a .torrent file buffer.
 * @param  {Object} parsed parsed torrent
 * @return {Uint8Array}
 */
function encodeTorrentFile (parsed) {
  const torrent = {
    info: parsed.info
  }

  torrent['announce-list'] = (parsed.announce || []).map(url => {
    if (!torrent.announce) torrent.announce = url
    url = text2arr(url)
    return [url]
  })

  torrent['url-list'] = parsed.urlList || []

  if (parsed.private !== undefined) {
    torrent.private = Number(parsed.private)
  }

  if (parsed.created) {
    torrent['creation date'] = (parsed.created.getTime() / 1000) | 0
  }

  if (parsed.createdBy) {
    torrent['created by'] = parsed.createdBy
  }

  if (parsed.comment) {
    torrent.comment = parsed.comment
  }

  return bencode.encode(torrent)
}

/**
 * Check if `obj` is a W3C `Blob` or `File` object
 * @param  {*} obj
 * @return {boolean}
 */
function isBlob (obj) {
  return typeof Blob !== 'undefined' && obj instanceof Blob
}

function sumLength (sum, file) {
  return sum + file.length
}

function splitPieces (buf) {
  const pieces = []
  for (let i = 0; i < buf.length; i += 20) {
    pieces.push(arr2hex(buf.slice(i, i + 20)))
  }
  return pieces
}

function ensure (bool, fieldName) {
  if (!bool) throw new Error(`Torrent is missing required field: ${fieldName}`)
}

export default parseTorrent
const toMagnetURI = encode
export { parseTorrentRemote as remote, encodeTorrentFile as toTorrentFile, toMagnetURI }
