const express = require('express')
const authRoute = require('./auth.route')
const contactRoute = require('./contact.route')
const meetingRoute = require('./meeting.route')
const preferenceRoute = require('./preference.route')
const notificationRoute = require('./notification.route')
const accountRoute = require('./account.route')
const googleRoute = require('./google.route.js')
const outlookRoute = require('./outlook.route.js')
const appleRoute = require('./apple.route.js')
const zoomRoute = require('./zoom.route.js')
const waitlistRoute = require('./waitlist.route.js')
const docsRoute = require('./docs.route')
const frazTestRoute = require('./fraztest.route')
const faqRoute = require('./faq.route')
const genusRoute = require('./genus.route')
const paymentRoute = require('./payment.route')
const meetingTemplateRoute = require('./meetingTemplate.route')
const webIntegrationRoute = require('./webIntegration.route')
const searchRoute = require('./search.route')
const todoRoute = require('./todo.route')
const config = require('../../config/config')

const router = express.Router()

const defaultRoutes = [
  {
    path: '/fraztest',
    route: frazTestRoute,
  },
  {
    path: '/auth',
    route: authRoute,
  },
  {
    path: '/contact',
    route: contactRoute,
  },
  {
    path: '/meeting',
    route: meetingRoute,
  },
  {
    path: '/notification',
    route: notificationRoute,
  },
  {
    path: '/preference',
    route: preferenceRoute,
  },
  {
    path: '/account',
    route: accountRoute,
  },
  {
    path: '/google',
    route: googleRoute,
  },
  {
    path: '/outlook',
    route: outlookRoute,
  },
  {
    path: '/apple',
    route: appleRoute,
  },
  {
    path: '/zoom',
    route: zoomRoute,
  },
  {
    path: '/faq',
    route: faqRoute,
  },
  {
    path: '/waitlist',
    route: waitlistRoute,
  },
  {
    path: '/genus',
    route: genusRoute,
  },
  {
    path: '/payment',
    route: paymentRoute
  },
  {
    path: '/meeting-template',
    route: meetingTemplateRoute
  },
  {
    path: '/web-integration',
    route: webIntegrationRoute
  },
  {
    path: '/search',
    route: searchRoute
  },
  {
    path: '/todo',
    route: todoRoute
  },
  {
    path: '/docs',
    route: docsRoute,
  },
]

const devRoutes = [
  // routes available only in development mode
  /*  {
     path: '/docs',
     route: docsRoute,
   }, */
]

defaultRoutes.forEach((route) => {
  router.use(route.path, route.route)
})

/* istanbul ignore next */
if (config.env === 'development') {
  devRoutes.forEach((route) => {
    router.use(route.path, route.route)
  })
}

module.exports = router
