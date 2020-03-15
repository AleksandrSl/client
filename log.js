let browserSupportsLogStyles = require('browser-supports-log-styles')

function style (string) {
  return '%c' + string + '%c'
}

function colorify (color, text, action, meta) {
  text = '%cLogux%c ' + text
  if (!color) text = text.replace(/%c/g, '')

  let args = [text]

  if (color) {
    let styles = text.match(/%c[^%]+%c/g)
    for (let i = 0; i < styles.length; i++) {
      if (i === 0) {
        args.push('color:#ffa200;font-weight:bold')
      } else {
        args.push('font-weight:bold')
      }
      args.push('')
    }
  }

  if (action) args.push(action)
  if (meta) args.push(meta)

  return args
}

/**
 * Display Logux events in browser console.
 *
 * @param {CrossTabClient} client Observed Client instance.
 * @param {object} [messages] Disable specific message types.
 * @param {boolean} [messages.state] Disable connection state messages.
 * @param {boolean} [messages.role] Disable tab role messages.
 * @param {boolean} [messages.error] Disable error messages.
 * @param {boolean} [messages.add] Disable action add messages.
 * @param {boolean} [messages.clean] Disable action clean messages.
 * @param {boolean} [messages.color] Disable colors in logs.
 * @param {string[]} [messages.ignoreActions] Disable action messages
 *                                            for specific types.
 *
 * @return {function} Unbind log listener.
 *
 * @example
 * import log from '@logux/client/log'
 * log(client, { add: false })
 */
function log (client, messages = { }) {
  let node = client.node

  let color = messages.color !== false && browserSupportsLogStyles()

  let showLog = (text, action, meta) => {
    console.log.apply(console, colorify(color, text, action, meta))
  }

  let showError = error => {
    let text = 'error: ' + error.description
    if (error.received) text = 'server sent ' + text
    console.error.apply(console, colorify(color, text))
  }

  let unbind = []
  let prevConnected = false

  if (messages.state !== false) {
    unbind.push(client.on('state', () => {
      let postfix = ''

      if (client.state === 'connecting' && node.connection.url) {
        postfix = '. ' + style(node.localNodeId) + ' is connecting to ' +
                  style(node.connection.url) + '.'
      } else if (client.connected && !prevConnected && node.remoteNodeId) {
        postfix = '. Client was connected to ' + style(node.remoteNodeId) + '.'
        prevConnected = true
      } else if (!client.connected) {
        prevConnected = false
      }

      showLog('state is ' + style(client.state) + postfix)
    }))
  }

  if (messages.role !== false) {
    unbind.push(client.on('role', () => {
      showLog('tab role is ' + style(client.role))
    }))
  }

  if (messages.error !== false) {
    unbind.push(node.on('error', error => {
      showError(error)
    }))
    unbind.push(node.on('clientError', error => {
      showError(error)
    }))
  }

  let cleaned = { }
  let ignore = (messages.ignoreActions || []).reduce((all, i) => {
    all[i] = true
    return all
  }, { })

  if (messages.add !== false) {
    unbind.push(client.on('add', (action, meta) => {
      if (meta.tab && meta.tab !== client.tabId) return
      if (ignore[action.type]) return
      let message
      if (action.type === 'logux/subscribe') {
        message = 'subscribed to channel ' + style(action.channel)
        if (Object.keys(action).length === 2) {
          showLog(message)
        } else {
          showLog(message, action)
        }
      } else if (action.type === 'logux/processed') {
        showLog('action ' + style(action.id) + ' was processed')
      } else if (action.type === 'logux/undo') {
        message = 'action ' + style(action.id) + ' was undid because of ' +
          style(action.reason)
        if (Object.keys(action).length === 3) {
          showLog(message)
        } else {
          showLog(message, action)
        }
      } else {
        message = 'added '
        if (meta.reasons.length === 0) {
          cleaned[meta.id] = true
          message += 'and cleaned '
        }
        message += style(action.type) + ' action'
        let nodeId = meta.id.split(' ')[1]
        if (nodeId !== node.localNodeId) {
          message += ' from ' + style(nodeId)
        }
        showLog(message, action, meta)
      }
    }))
  }

  if (messages.clean !== false) {
    unbind.push(client.on('clean', (action, meta) => {
      if (cleaned[meta.id]) {
        delete cleaned[meta.id]
        return
      }
      if (meta.tab && meta.tab !== client.id) return
      if (ignore[action.type]) return
      if (action.type === 'logux/subscribe') return
      if (action.type === 'logux/processed') return
      if (action.type === 'logux/undo') return
      let message = 'cleaned ' + style(action.type) + ' action'
      showLog(message, action, meta)
    }))
  }

  return () => {
    for (let i of unbind) i()
  }
}

module.exports = log
