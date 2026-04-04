/* MagicMirror²
 * Module: MMM-Rest
 *
 * By Dirk Melchers
 * MIT Licensed.
 */

const Log = require('logger')
const NodeHelper = require('node_helper')
const { Agent, fetch } = require('undici')

const insecureAgent = new Agent({
  connect: {
    rejectUnauthorized: false,
  },
})

module.exports = NodeHelper.create({
  start: function () {
    Log.log('Starting node_helper for: ' + this.name)
  },

  async getData(payload) {
    const isInsecure = payload.allowSelfSignedCerts === true && payload.url.startsWith('https://')

    const fetchOptions = {
      method: 'GET',
    }

    if (isInsecure) {
      fetchOptions.dispatcher = insecureAgent
      Log.debug(`${payload.url} - insecure`)
    }
    else {
      Log.debug(`${payload.url} - secure`)
    }
    try {
      const url = payload.url
      const response = await fetch(url, fetchOptions)
      let data = await response.text()
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
