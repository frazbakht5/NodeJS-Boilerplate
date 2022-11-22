const passport = require('passport')
// const httpStatus = require('http-status');
const { OAuth2Client } = require('google-auth-library')
const { getToken } = require('../utils/commonFunctions')
const { tokenTypes } = require('../config/tokens')
const BadRequest = require('../utils/modules/Errors/BadRequest')
const { verifyToken } = require('../services/token.service')
const { TokenModel } = require('../models')
// const ApiError = require('../utils/ApiError');

const client = new OAuth2Client('799196653078-ujtnjsbcs98a303vounqf6np4bt0nbl3.apps.googleusercontent.com')

// const verifyCallback = (req, resolve, reject, requiredRights) => async (err, user, info) => {
//   if (err || info || !user) {
//     return reject(new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate'));
//   }
//   req.user = user;

//   resolve();
// };

const auth = async (req, res, next) => {
  const auth = await passport.authenticate('jwt', { session: false })

  console.log('auth info ===> ', auth)
  next()
}

const accessTokenAuth = async (req, res, next) => {
  const token = getToken(req)

  if (!token) {
    return res.json(new BadRequest('Provide a valid token in headers'))
  }

  let tokenData = null
  try {
    if (token.length <= 24) {
      let tokenFromDb = await TokenModel.findOne({ _id: token, is_active: true })
      tokenData = await verifyToken(tokenFromDb.token)
    } else {
      tokenData = await verifyToken(token)
    }
  } catch (error) {
    console.log('error ===> ', error)
    return res.json(new BadRequest('Error in token validation. Provide a valid token.'))
  }

  console.log(tokenData != null, tokenData.type === tokenTypes.ACCESS)
  if (tokenData != null && (tokenData.type === tokenTypes.ACCESS || tokenData.type === tokenTypes.NONSKEDING_USER_MEETING_SELECT)) {
    req.tokenData = tokenData
    next()
  } else {
    return res.json(new BadRequest("Token type is not 'ACCESS'. Provide a valid token."))
  }
}

const resetPasswordTokenAuth = async (req, res, next) => {
  const token = getToken(req)

  if (!token) {
    return res.json(new BadRequest('Provide a valid token in headers'))
  }

  let tokenData = null
  try {
    let tokenFromDb = await TokenModel.findOne({ _id: token, is_active: true })
    tokenData = await verifyToken(tokenFromDb.token)
  } catch (error) {
    return res.json(new BadRequest('Error in token validation. Provide a valid token.'))
  }

  if (token != null && token.type === tokenTypes.RESET_PASSWORD) {
    req.tokenData = tokenData
    next()
  } else {
    return res.json(new BadRequest("Token type is not 'RESET_PASSWORD'. Provide a valid token."))
  }
}

const verifyEmailTokenAuth = async (req, res, next) => {
  console.log('Fraz 1')
  const token = getToken(req)

  if (!token) {
    return res.json(new BadRequest('Provide a valid token in headers'))
  }

  let tokenData = null
  try {
    let tokenFromDb = await TokenModel.findOne({ _id: token, is_active: true })
    tokenData = await verifyToken(tokenFromDb.token)
  } catch (error) {
    return res.json(new BadRequest('Error in token validation. Provide a valid token.'))
  }

  // console.log("tokenData ===> ", tokenData);

  if (tokenData != null && tokenData.type === tokenTypes.VERIFY_EMAIL) {
    req.tokenData = tokenData
    req.verifyingAccount = true
    next()
  } else {
    return res.json(new BadRequest("Token type is not 'VERIFY_EMAIL'. Provide a valid token."))
  }
}

const nonskedingUserMeetingSelectTokenAuth = async (req, res, next) => {
  const token = getToken(req)

  if (!token) {
    return res.json(new BadRequest('Provide a valid token in headers'))
  }

  let tokenData = null
  try {
    let tokenFromDb = await TokenModel.findOne({ _id: token, is_active: true })
    tokenData = await verifyToken(tokenFromDb.token)
  } catch (error) {
    return res.json(new BadRequest('Error in token validation. Provide a valid token.'))
  }

  if (token != null && token.type === tokenTypes.NONSKEDING_USER_MEETING_SELECT) {
    req.tokenData = tokenData
    next()
  } else {
    return res.json(new BadRequest("Token type is not 'NONSKEDING_USER_MEETING_SELECT'. Provide a valid token."))
  }
}

const refreshTokenAuth = async (req, res, next) => {
  console.log('middleware')

  const token = getToken(req)

  if (!token) {
    return res.json(new BadRequest('Provide a valid token in headers'))
  }

  let tokenData = null
  try {
    tokenData = await verifyToken(token)
  } catch (error) {
    return res.json(new BadRequest('Error in token validation. Provide a valid token.'))
  }

  if (token != null && token.type === tokenTypes.REFRESH) {
    req.tokenData = tokenData
    next()
  } else {
    return res.json(new BadRequest("Token type is not 'REFRESH'. Provide a valid token."))
  }
}

const nonskedingUserPollSelectTokenAuth = async (req, res, next) => {
  console.log('middleware')

  const token = getToken(req)

  if (!token) {
    return res.json(new BadRequest('Provide a valid token in headers'))
  }

  let tokenData = null
  try {
    let tokenFromDb = await TokenModel.findOne({ _id: token, is_active: true })
    tokenData = await verifyToken(tokenFromDb.token)
  } catch (error) {
    return res.json(new BadRequest('Error in token validation. Provide a valid token.'))
  }

  if (token != null && token.type === tokenTypes.NONSKEDING_USER_POLL_SELECT) {
    req.tokenData = tokenData
    next()
  } else {
    return res.json(new BadRequest("Token type is not 'NONSKEDING_USER_POLL_SELECT'. Provide a valid token."))
  }
}

const shareableCalendarTokenAuth = async (req, res, next) => {
  const token = getToken(req)

  if (!token) {
    return res.json(new BadRequest('Provide a valid token in headers'))
  }

  let tokenData = null
  try {
    let tokenFromDb = await TokenModel.findOne({ _id: token, is_active: true })
    tokenData = await verifyToken(tokenFromDb.token)
  } catch (error) {
    console.log('error ===> ', error)
    return res.json(new BadRequest('Error in token validation. Provide a valid token.'))
  }

  // console.log(
  // tokenData != null,
  // tokenData.type === tokenTypes.USER_SHAREABLE_CALENDAR_LINK
  // );
  if (tokenData != null && tokenData.type === tokenTypes.USER_SHAREABLE_CALENDAR_LINK) {
    req.tokenData = tokenData
    next()
  } else {
    return res.json(new BadRequest("Token type is not 'USER_SHAREABLE_CALENDAR_LINK'. Provide a valid token."))
  }
}

const gooleAuth = async (req, res, next) => {
  console.log('=== amm landing ===')
  const { token } = req.body
  const ticket = await client
    .verifyIdToken({
      idToken: token,
      audience: '799196653078-ujtnjsbcs98a303vounqf6np4bt0nbl3.apps.googleusercontent.com',
    })
    .catch((data) => {
      console.log('data ====', data)
    })
  const { name, email, picture } = ticket.getPayload()
  console.log('name: ', name, '====== email: ', email, '====== picture :', picture)
  next()
}

const googleAuth = async (req, res, next) => {
  console.log('YOLO')
  return passport.authenticate('google', {
    scope: [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/contacts.readonly',
    ],
    accessType: 'offline',
    prompt: 'consent',
    session: true,
  })
}

module.exports = {
  auth,
  gooleAuth,
  googleAuth,
  accessTokenAuth,
  resetPasswordTokenAuth,
  verifyEmailTokenAuth,
  nonskedingUserMeetingSelectTokenAuth,
  nonskedingUserPollSelectTokenAuth,
  refreshTokenAuth,
  shareableCalendarTokenAuth,
}
