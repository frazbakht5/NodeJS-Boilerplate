const express = require('express')
const app = require('../../app')
const Meeting = require('../../models/meeting.model')
const User = require('../../models/user.model')
const { userService } = require('../../services')
const { debugLog1 } = require('../../utils/commonFunctions')
const HttpResponse = require('../../utils/modules/Response/HttpResponse')

const router = express.Router()

router.get('/', (req, res) => {
  const htttpResponse = HttpResponse.get({ msg: "Hurray! I'm working!" })

  debugLog1("Logging a statement!")
  
  return res.json(htttpResponse)
})

module.exports = router
