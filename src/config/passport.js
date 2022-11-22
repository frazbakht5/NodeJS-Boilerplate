const { Strategy: JwtStrategy, ExtractJwt } = require('passport-jwt')
const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy
const passport = require('passport')
const OutlookStrategy = require('passport-outlook')
const AppleStrategy = require('passport-apple')
const config = require('./config')
const { tokenTypes } = require('./tokens')
const { User } = require('../models')
const GoogleController = require('../controllers/google.controller')
var MicrosoftStrategy = require('passport-microsoft').Strategy
const path = require('path')
const jwt = require('jsonwebtoken')
var ZoomStrategy = require('@giorgosavgeris/passport-zoom-oauth2')
const { debugLog1, debugLog2 } = require('../utils/commonFunctions')

const jwtOptions = {
  secretOrKey: config.jwt.secret,
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
}

const jwtVerify = async (payload, done) => {
  try {
    if (payload.type !== tokenTypes.ACCESS) {
      throw new Error('Invalid token type')
    }
    const user = await User.findById(payload.id)
    if (!user) {
      return done(null, false)
    }
    done(null, user)
  } catch (error) {
    done(error, false)
  }
}

passport.serializeUser(function (user, done) {
  /*
  From the user take just the id (to minimize the cookie size) and just pass the id of the user
  to the done callback
  PS: You dont have to do it like this its just usually done like this
  */
  done(null, user)
})

passport.deserializeUser(function (user, done) {
  /*
  Instead of user this function usually recives the id 
  then you use the id to select the user from the db and pass the user obj to the done callback
  PS: You can later access this data in any routes in: req.user
  */
  done(null, user)
})

const Google = new GoogleStrategy(
  {
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK,
    passReqToCallback: true,
  },
  function (req, accessToken, refreshToken, profile, done) {
    debugLog2('process.env.GOOGLE_CALLBACK ===> ', process.env.GOOGLE_CALLBACK)

    const googleUserData = { accessToken, refreshToken, profile }
    // debugLog2("req ===> ", req);
    process.nextTick(async function () {
      // await GoogleController.googleSignin(accessToken, refreshToken, profile);
      done(null, googleUserData)
    })
  }
)

const GoogleIntegration = new GoogleStrategy(
  {
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_INTEGRATION_CALLBACK,
    passReqToCallback: true,
  },
  function (req, accessToken, refreshToken, profile, done) {
    // debugLog2("profile ===> ", profile);
    // debugLog2("accessToken ===> ", accessToken);
    // debugLog2("refreshToken ===> ", refreshToken);
    const googleUserData = { accessToken, refreshToken, profile }

    process.nextTick(async function () {
      // await GoogleController.googleSignin(accessToken, refreshToken, profile);
      done(null, googleUserData)
    })
  }
)

//swati genus
// const Outlook = new MicrosoftStrategy(
//   {
//     clientID: '96009f13-e497-4f0d-85cc-2202556b4ca2',
//     clientSecret: 'qiy8Q~xDG2uXCNjlBLm4m1Qgwyykd3xw8Yeelbp9',
//     callbackURL: process.env.OUTLOOK_CALLBACK,
//     scope: ['openid', 'profile', 'user.read', 'calendars.ReadWrite', 'offline_access'],
//     // tokenURL: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
//   },
//   function (accessToken, refreshToken, profile, done) {
//     const outlookUserData = { accessToken, refreshToken, profile }

//     process.nextTick(async function () {
//       done(null, outlookUserData)
//     })
//   }
// )

//skedingapp
const Teams = new MicrosoftStrategy(
  {
    clientID: process.env.TEAMS_CLIENT_ID,
    clientSecret: process.env.TEAMS_CLIENT_SECRET,
    callbackURL: process.env.TEAMS_CALLBACK,
    scope: ['openid', 'profile', 'user.read', 'calendars.ReadWrite', 'offline_access'],
  },
  function (accessToken, refreshToken, profile, done) {
    const outlookUserData = { accessToken, refreshToken, profile }

    process.nextTick(async function () {
      done(null, outlookUserData)
    })
  }
)

const Outlook = new MicrosoftStrategy(
  {
    clientID: process.env.OUTLOOK_CLIENT_ID,
    clientSecret: process.env.OUTLOOK_CLIENT_SECRET,
    callbackURL: process.env.OUTLOOK_CALLBACK,
    scope: ['openid', 'profile', 'user.read', 'calendars.ReadWrite', 'offline_access', 'contacts.Read'],
  },
  function (accessToken, refreshToken, profile, done) {
    const teamsUserData = { accessToken, refreshToken, profile }

    process.nextTick(async function () {
      done(null, teamsUserData)
    })
  }
)

const outlookIntegration = new MicrosoftStrategy(
  {
    clientID: process.env.OUTLOOK_CLIENT_ID,
    clientSecret: process.env.OUTLOOK_CLIENT_SECRET,
    callbackURL: process.env.OUTLOOK_INTEGRATION_CALLBACK,
    scope: ['openid', 'profile', 'user.read', 'calendars.ReadWrite', 'offline_access'],
  },
  function (accessToken, refreshToken, profile, done) {
    const teamsUserData = { accessToken, refreshToken, profile }

    process.nextTick(async function () {
      done(null, teamsUserData)
    })
  }
)

const Apple = new AppleStrategy(
  {
    clientID: process.env.APPLE_CLIENT_ID,
    teamID: process.env.TEAM_ID,
    callbackURL: process.env.APPLE_CALLBACK,
    keyID: process.env.APPLE_KEY_ID,
    privateKeyLocation: path.join(__dirname, './apple.p8'),
    passReqToCallback: true,
    scope: ['name', 'email'],
  },
  function (req, accessToken, refreshToken, idToken, profile, done) {
    debugLog2('ID', JSON.stringify(idToken) + '--' + JSON.stringify(profile) + '--' + accessToken + '--' + refreshToken)

    const appleUserData = { accessToken, refreshToken, idToken }
    process.nextTick(async function () {
      done(null, appleUserData)
    })
  }
)

const Zoom = new ZoomStrategy(
  {
    clientID: process.env.ZOOM_CLIENT_ID,
    clientSecret: process.env.ZOOM_CLIENT_SECRET,
    callbackURL: process.env.ZOOM_CALLBACK,
  },
  function (accessToken, refreshToken, profile, done) {
    debugLog2('a', accessToken, 'r', refreshToken, 'p', profile)
  }
)

const jwtStrategy = new JwtStrategy(jwtOptions, jwtVerify)

module.exports = {
  jwtStrategy,
  Google,
  GoogleIntegration,
  Outlook,
  Apple,
  Zoom,
  Teams,
  outlookIntegration,
}
