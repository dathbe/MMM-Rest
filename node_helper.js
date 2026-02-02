/* MagicMirror²
 * Module: MMM-Rest
 *
 * By Dirk Melchers
 * MIT Licensed.
 */

const Log = require('logger')
const NodeHelper = require('node_helper')
const undici = require('undici')

module.exports = NodeHelper.create({
  start: function () {
    Log.log('Starting node_helper for: ' + this.name)
  },

  async getData(payload) {
    try {
      if (payload.allowSelfSignedCerts == true && payload.url.startsWith('https')) {
        var agent = new undici.Agent({ connect: { rejectUnauthorized: false } })
        Log.debug(`${payload.url} - insecure`)
      }
      else {
        agent = new undici.Agent({ connect: { rejectUnauthorized: true } })
        Log.debug(`${payload.url} - secure`)
      }
      const url = payload.url
      const response = await fetch(url, {
        method: 'GET',
        dispatcher: agent,
      })
      var data = await response.text()
      data = data.replace(/\n+$/, '')
      this.sendSocketNotification('MMM_REST_RESPONSE', {
        id: payload.id,
        data: data,
        tableID: payload.tableID,
      })
    }
    catch (error) {
      Log.error('[MMM-Rest] Could not load data.', error)
    }
  },

  socketNotificationReceived: function (notification, payload) {
    if (notification === 'MMM_REST_REQUEST') {
      this.getData(payload)
    }
  },
})
