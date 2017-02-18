/**
 * Change favicon on Logux state
 *
 * @param {Syncable|BaseSync} sync Observed Sync instance.
 * @param {object} [links] Set favicon links.
 * @param {string} [links.default] Default favicon link.
 * @param {string} [links.offline] Offline favicon link.
 * @param {string} [links.error] Error favicon link.
 *
 * @return {Function} Unbind favicon listener.
 *
 * @example
 * import favicon from 'logux-status/favicon'
 * favicon(client, {
 *   default: '/favicon.ico',
 *   offline: '/offline.ico',
 *   error: '/error.ico'
 * })
 */
function favicon (sync, links) {
  if (sync.sync) sync = sync.sync
  links = links || {}

  var normal = links.default
  var offline = links.offline
  var error = links.error

  var unbind = []
  var doc = document
  var fav = false
  var prevFav = false

  if (typeof doc !== 'undefined') {
    fav = doc.querySelector('link[rel~="icon"]')

    if (!fav) {
      fav = document.createElement('link')
      fav.rel = 'icon'
      fav.href = ''
      document.head.appendChild(fav)
    }

    unbind.push(sync.on('state', function () {
      if (sync.connected && normal && prevFav !== normal) {
        fav.href = prevFav = normal
      } else if (!sync.connected && offline &&
                 prevFav !== offline && prevFav !== error) {
        fav.href = prevFav = offline
      }
    }))

    unbind.push(sync.on('error', function (err) {
      if (err.type !== 'timeout' && error && prevFav !== error) {
        fav.href = prevFav = error
      }
    }))
  }

  return function () {
    for (var i = 0; i < unbind.length; i++) {
      unbind[i]()
    }
  }
}

module.exports = favicon
