const parseTorrent = require('../')
const test = require('tape')

test('exception thrown with non-bittorrent URNs', function (t) {
  // Non-bittorrent URNs (examples from Wikipedia)
  const magnets = [
    'magnet:?xt=urn:sha1:PDAQRAOQQRYS76MRZJ33LK4MMVZBDSCL',
    'magnet:?xt=urn:tree:tiger:IZZG2KNL4BKA7LYEKK5JAX6BQ27UV4QZKPL2JZQ',
    'magnet:?xt=urn:bitprint:QBMYI5FTYSFFSP7HJ37XALYNNVYLJE27.E6ITPBX6LSBBW34T3UGPIVJDNNJZIQOMP5WNEUI',
    'magnet:?xt=urn:ed2k:31D6CFE0D16AE931B73C59D7E0C089C0',
    'magnet:?xt=urn:aich:D6EUDGK2DBTBEZ2XVN3G6H4CINSTZD7M',
    'magnet:?xt=urn:kzhash:35759fdf77748ba01240b0d8901127bfaff929ed1849b9283f7694b37c192d038f535434',
    'magnet:?xt=urn:md5:4e7bef74677be349ccffc6a178e38299'
  ]

  magnets.forEach(function (magnet) {
    t.throws(() => parseTorrent(magnet))
  })

  t.end()
})
