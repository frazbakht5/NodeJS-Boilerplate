const httpStatus = require('http-status')
const catchAsync = require('../../utils/catchAsync')
const { authService, userService, tokenService, emailService } = require('../../services')
const HttpResponse = require('../../utils/modules/Response/HttpResponse')
const { verifyToken } = require('../../services/token.service')
const { getToken, debugLog1, syncUserExternalCalendar, debugLog2 } = require('../../utils/commonFunctions')
const NotFound = require('../../utils/modules/Errors/NotFound')
const { hash, compare } = require('bcryptjs')
// const bcrypt = require('bcrypt');
const Unauthorized = require('../../utils/modules/Errors/Unauthorized')
const { tokenTypes } = require('../../config/tokens')
const BadRequest = require('../../utils/modules/Errors/BadRequest')
const { sendAccountVerificationEmail, sendResetPasswordEmail } = require('../../services/email.service')
const Forbidden = require('../../utils/modules/Errors/Forbidden')
const { syncAllUserGoogleCalendarEvents } = require('../google.controller')
const OutlookController = require('../outlook.controller')
const OutlookService = require('../../services/outlook.service')

const getAvatar = catchAsync(async (req, res) => {
  debugLog1('In function auth.controller.getAvatar')

  const tokenData = req.tokenData

  const user = await userService.getUserById(tokenData.id)

  const httpResponse = HttpResponse.get({ avatar: user.picture })
  res.json(httpResponse)
})

const googleSignin = catchAsync(async (req, res) => {
  const user = await userService.createGoogleUser(req.body)
  // const tokens = await tokenService.generateAuthTokens(user);
  const httpResponse = HttpResponse.created(user)
  res.json(httpResponse)
})

const register = catchAsync(async (req, res) => {
  debugLog1('In function auth.controller.register')

  req.body.encrypted_password = await hash(req.body.password, 12)
  let user
  try {
    user = await userService.createUser(req.body)
  } catch (exception) {
    return res.json(new BadRequest(exception.message))
  }

  if (user) {
    const verifyEmailToken = await tokenService.generateVerifyEmailToken({ ...req.body, _id: user._id })
    // debugLog2("verifyEmailToken ===> ", verifyEmailToken);
    sendAccountVerificationEmail(req.body.email, verifyEmailToken)

    // const tokens = await tokenService.generateAuthTokens(user)

    // user = await userService.updateUserById(user.id, { token: tokens.access.token, refresh_token: tokens.refresh.token })
    // user.encrypted_password = undefined

    const httpResponse = HttpResponse.created({ emailSent: true })
    return res.json(httpResponse)
  } else {
    res.json(new BadRequest('User associated with this email already exists'))
  }
})

const isEmailVerified = catchAsync(async (req, res) => {
  const { email, password } = req.body
  debugLog2('YOLO')
  // const user = await authService.loginUserWithEmailAndPassword(email, password);
  let user = await userService.getUserByEmail(req.tokenData.email)
  // debugLog2('user ===> ', user)
  let tokens
  let isEmailVerified = false
  if (user) {
    isEmailVerified = true
    tokens = await tokenService.generateAuthTokens(user)
    user = await userService.updateUserById(user._id, { isEmailVerified: true, token: tokens.access.token, refresh_token: tokens.refresh.token })
  }

  const httpResponse = HttpResponse.get({ is_email_verified: isEmailVerified, user, tokens })
  res.json(httpResponse)
})

const login = catchAsync(async (req, res) => {
  const { email, password } = req.body
  // const user = await authService.loginUserWithEmailAndPassword(email, password);
  let user = await userService.getUserByEmailWithPassword(email)
  // debugLog2('user ===> ', user)
  if (user) {
    if (!user.isEmailVerified) {
      return res.json(new Forbidden('Email is not verified yet. Kindly check your inbox.'))
    }

    const match = await compare(password, user.encrypted_password ? user.encrypted_password : '')
    debugLog1('match ===> ', match)

    if (match) {
      debugLog1('Passwords matched succefully!')
      const tokens = await tokenService.generateAuthTokens(user)
      user = await userService.updateUserById(user.id, { token: tokens.access.token, refresh_token: tokens.refresh.token })
      user.encrypted_password = undefined

      if (user.is_google_synced) {
         syncAllUserGoogleCalendarEvents(user.google_data.refreshToken, user.id, user)
      } else if (user.is_microsoft_synced) {
        // @usama fill this
        user = await OutlookService.refreshOutlookToken(user)
         OutlookController.syncAllUserOutlookCalendarEvents(user.outlook_data, user.id)
      }

      // await syncUserExternalCalendar(user, user._id);
      const httpResponse = HttpResponse.get(user)
      return res.json(httpResponse)
    } else {
      return res.json(new Forbidden('Email or password incorect. Try again or click forgot password to reset it'))
    }
  } else {
    return res.json(new Forbidden('Email or password incorect. Try again or click forgot password to reset it'))
  }
})

const logout = catchAsync(async (req, res) => {
  const httpResponse = HttpResponse.notified()
  res.json(httpResponse)
})

const refreshTokens = catchAsync(async (req, res) => {
  const tokens = await authService.refreshAuth(req.body.refreshToken)
  res.send({ ...tokens })
})

const forgotPassword = catchAsync(async (req, res) => {
  let resetPasswordToken
  let user = await userService.getUserByEmailWithPassword(req.body.email)
  debugLog2('user ===> ', user)
  
  if (user) {
    resetPasswordToken = await tokenService.generateResetPasswordToken(user.email, user.first_name, user.last_name, user.id)
    sendResetPasswordEmail(user.email, resetPasswordToken, user.first_name, user.last_name)

    const httpResponse = HttpResponse.notified()
    return res.json(httpResponse)
  } else {
    const httpResponse = HttpResponse.notified()
    return res.json(httpResponse)
  }
})

const resetPassword = catchAsync(async (req, res) => {
  const hashedPassword = await hash(req.body.password, 12)
  try {
    await authService.resetPassword(req.query.token, hashedPassword)
  } catch (exception) {
    return res.json(new Unauthorized(exception.message))
  }
  const httpResponse = HttpResponse.notified({})
  return res.json(httpResponse)
})

const changePassword = catchAsync(async (req, res) => {
  const hashedPassword = await hash(req.body.new_password, 12)
  try {
    const changePasswordTokenDoc = await tokenService.verifyToken(resetPasswordToken, tokenTypes.ACCESS)
    const user = await userService.getUserById(changePasswordTokenDoc.id)

    const match = await compare(bodyreq.body.old_password, user.encrypted_password ? user.encrypted_password : '')

    if (match) {
      debugLog2('Passwords matched succefully!')
      await userService.updateUserById(user.id, { encrypted_password: hashedPassword })
      const httpResponse = HttpResponse.updated({})
      return res.json(httpResponse)
    } else {
      return res.json(new Unauthorized('Old password is incorrect'))
    }
  } catch (error) {
    return res.json(new Unauthorized('Invalid token'))
  }
})

const sendVerificationEmail = catchAsync(async (req, res) => {
  const verifyEmailToken = await tokenService.generateVerifyEmailToken(req.user)
  await emailService.sendVerificationEmail(req.user.email, verifyEmailToken)
  const httpResponse = HttpResponse.notified({})
  return res.json(httpResponse)
})

const verifyEmail = catchAsync(async (req, res) => {
  await authService.verifyEmail(req.query.token)
  res.status(httpStatus.NO_CONTENT).send()
})
const getCompleteUser = catchAsync(async (req, res) => {
  const currentUser = await userService.getUserById(req.params.userId)
  const httpResponse = HttpResponse.get(currentUser)
  return res.json(httpResponse)
})
module.exports = {
  getAvatar,
  register,
  isEmailVerified,
  login,
  logout,
  refreshTokens,
  forgotPassword,
  resetPassword,
  changePassword,
  sendVerificationEmail,
  verifyEmail,
  getCompleteUser,
  googleSignin,
}
