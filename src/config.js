'use strict'

import { execSync } from 'child_process'

function isDebug() {
  const debug = process.env.DEBUG
  if (debug) {
    if (debug == 'false' || debug == '0') return false
    return true
  }
  return false
}

function get_local_vm_ip() {
  if (env === 'development') {
    const cmd = 'docker-machine ip local'
    return execSync(cmd).toString().trim()
  }
  return
}

const env = process.env.NODE_ENV || 'development'
const debug = isDebug()
const local_vm_ip = get_local_vm_ip()
const secret = process.env.JWT_SECRET || '1234567890'
const port = process.env.PORT || 8080
const redis_ip = process.env.REDIS_IP || local_vm_ip
const mysql_ip = process.env.MYSQL_IP || local_vm_ip

export default {
  env: env,
  debug: debug,
  applicationName: "msg-session-broker",
  port: port,
  jwt: {
    algorithm: "HS256",      // signature and hash algorithm
    secret: secret,          // secret for signature signing and verification. can be replaced with certificate.
    expiresIn: 300,          // expiration of the token. 300 in seconds, or 2 days, 10h, 7d
    audience: "ibc",         // target the token is issued for
    subject: "fm auth",      // subject the token is issued for
    issuer: "bex msg"        // issuer of the token
  },
  storage: {
    redis: {
      host: redis_ip,
      port: 6379,
      family: 4,
      password: "pink5678",
      db: 0
    },
    mysql: {
      host: mysql_ip,
      port: 3306,
      database: "bex-msg",
      user: "pink",
      password: "5678"
    }
  },
  policy: {
  }
}
