/* MagicMirror²
 * Module: MMM-Rest
 *
 * By Dirk Melchers
 * MIT Licensed.
 */

const Log = require('logger')
const NodeHelper = require('node_helper')
const https = require('https')
const http = require('http')
const crypto = require('crypto')

module.exports = NodeHelper.create({
  start: function () {
    Log.log('Starting node_helper for: ' + this.name)
  },

  getData(payload) {
    const urlString = payload.url
    const isHttps = urlString.startsWith('https://')
    const allowInsecure = payload.allowSelfSignedCerts === true && isHttps

    const client = isHttps ? https : http

    const options = {
      method: 'GET',
    }

    if (allowInsecure) {
      options.rejectUnauthorized = false
      // Workaround for OpenHAB backend TLS 1.3 decode/length mismatch bugs:
      // This forces the client connection to gracefully negotiate or drop problematic TLS 1.3 tickets if necessary
      options.secureOptions = crypto.constants.SSL_OP_NO_TLSv1_3 | crypto.constants.SSL_OP_ALLOW_UNSAFE_LEGACY_RENEGOTIATION
      Log.debug(`${urlString} - insecure (self-signed certs & OpenHAB TLS workaround allowed)`)
    } else {
      Log.debug(`${urlString} - secure`)
    }

    const req = client.request(urlString, options, (res) => {
      let data = ''

      res.on('data', (chunk) => {
        data += chunk
      })

      res.on('end', () => {
        data = data.replace(/\n+$/, '')
        this.sendSocketNotification('MMM_REST_RESPONSE', {
          id: payload.id,
          data: data,
          tableID: payload.tableID,
        })
      })
    })

    req.on('error', (error) => {
      Log.error('[MMM-Rest] Could not load data or TLS handshake failed.', error)
    })

    req.end()
  },

  socketNotificationReceived: function (notification, payload) {
    if (notification === 'MMM_REST_REQUEST') {
      this.getData(payload)
    }
  },
})