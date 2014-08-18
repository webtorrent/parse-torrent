var magnet = require('magnet-uri')
var parseTorrentFile = require('parse-torrent-file')

/**
 * Parse a torrent identifier (magnet uri, .torrent file, info hash)
 * @param  {string|Buffer|Object} torrentId
 * @return {Object}
 */
module.exports = function parseTorrent (torrentId) {
  if (typeof torrentId === 'string' && /magnet:/.test(torrentId)) {
    // magnet uri (string)
    return magnet(torrentId)
  } else if (typeof torrentId === 'string' &&
      (torrentId.length === 40 || torrentId.length === 32)) {
    // info hash (hex/base-32 string)
    var info = magnet('magnet:?xt=urn:btih:' + torrentId)
    if (info)
      return { infoHash: info.infoHash }
    else
      return null
  } else if (Buffer.isBuffer(torrentId) && torrentId.length === 20) {
    // info hash (buffer)
    return { infoHash: torrentId.toString('hex') }
  } else if (Buffer.isBuffer(torrentId)) {
    // .torrent file (buffer)
    try {
      return parseTorrentFile(torrentId)
    } catch (err) {
      return null
    }
  } else if (torrentId && torrentId.infoHash) {
    // parsed torrent (from `parse-torrent` or `magnet-uri` module)
    return torrentId
  } else {
    return null
  }
}

module.exports.toBuffer = parseTorrentFile.toBuffer
