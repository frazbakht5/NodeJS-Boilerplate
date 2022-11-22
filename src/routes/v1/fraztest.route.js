const express = require('express')
const app = require('../../app')
const { debugLog1 } = require('../../utils/commonFunctions')
const HttpResponse = require('../../utils/modules/Response/HttpResponse')

const router = express.Router()

router.get('/', (req, res) => {
  const htttpResponse = HttpResponse.get({ msg: "Hurray! I'm working!" })

  debugLog1("Logging a statement!")
  
  return res.json(htttpResponse)
})

module.exports = router
