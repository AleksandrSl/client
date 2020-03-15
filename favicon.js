/**
 * Change favicon to show Logux synchronization status.
 *
 * @param {CrossTabClient} client Observed Client instance.
 * @param {object} links Set favicon links.
 * @param {string} [links.normal] Default favicon link. By default,
 *                                it will be taken from current favicon.
 * @param {string} [links.offline] Offline favicon link.
 * @param {string} [links.error] Error favicon link.
 *
 * @return {function} Unbind favicon listener.
 *
 * @example
 * import favicon from '@logux/client/favicon'
 * favicon(client, {
 *   normal: '/favicon.ico',
 *   offline: '/offline.ico',
 *   error: '/error.ico'
 * })
 */
function favicon (client, links) {
  let normal = links.normal
  let offline = links.offline
  let error = links.error

  let unbind = []
  let doc = document
  let fav = false
  let prevFav = false

  function update () {
    if (client.connected && prevFav !== normal) {
      fav.href = prevFav = normal
    } else if (
      !client.connected && offline &&
      prevFav !== offline && prevFav !== error
    ) {
      fav.href = prevFav = offline
    }
  }

  function setError () {
    if (error && prevFav !== error) {
      fav.href = prevFav = error
    }
  }

  if (doc) {
    fav = doc.querySelector('link[rel~="icon"]')

    if (typeof normal === 'undefined') {
      normal = fav ? fav.href : ''
    }

    if (!fav) {
      fav = doc.createElement('link')
      fav.rel = 'icon'
      fav.href = ''
      doc.head.appendChild(fav)
    }

    unbind.push(client.on('state', update))
    update()

    unbind.push(client.on('add', action => {
      if (action.type === 'logux/undo' && action.reason) setError()
    }))

    unbind.push(client.node.on('error', err => {
      if (err.type !== 'timeout') setError()
    }))
  }

  return () => {
    for (let i of unbind) i()
  }
}

module.exports = favicon
