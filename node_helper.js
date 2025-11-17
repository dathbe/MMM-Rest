/* MagicMirror²
 * Module: MMM-Rest
 *
 * By Dirk Melchers 
 * MIT Licensed.
 */

const Log = require('logger')
const NodeHelper = require('node_helper');

module.exports = NodeHelper.create({
  start: function () {
      console.log(this.name + ' helper started ...');
  },

  async getData(payload) {
    try {
      const url = payload.url
      const response = await fetch(url, {
      method: 'GET',
      })
      const data = await response.text()
      this.sendSocketNotification('MMM_REST_RESPONSE', {
        id: payload.id,
        data: data,
        tableID: payload.tableID
      });
    }
    catch (error) {
      Log.error('[MMM-Rest] Could not load data.', error)
    }
  },

  socketNotificationReceived: function(notification, payload) {
    if (notification === 'MMM_REST_REQUEST') {
      this.getData(payload)
    }
  }
});
