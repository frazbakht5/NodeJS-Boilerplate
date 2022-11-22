require('module-alias/register')
require('./pathAlias')
const express = require('express')
const helmet = require('helmet')
const xss = require('xss-clean')
const mongoSanitize = require('express-mongo-sanitize')
const compression = require('compression')
const cors = require('cors')
const passport = require('passport')
const httpStatus = require('http-status')
const config = require('./config/config')
const morgan = require('./config/morgan')
const { jwtStrategy, Google, GoogleIntegration, Outlook, Apple, Zoom, Teams, outlookIntegration } = require('./config/passport')
const { authLimiter } = require('./middlewares/rateLimiter')
const routes = require('./routes/v1')
const { errorConverter, errorHandler } = require('./middlewares/error')
const ApiError = require('./utils/ApiError')
const bodyParser = require('body-parser')
const refresh = require('passport-oauth2-refresh')
const app = express()
const http = require('http')
const { userService } = require('./services')
const { cron1, syncAllUserCalendars } = require('./utils/CroneJobs')
const httpServer = http.createServer(app)
const io = require('socket.io')(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
})

if (process.env.NODE_ENV == 'production')
  cron1("s");
// syncAllUserCalendars();

// const io = require('socket.io')(server, {
//   cors: {
//     origin: 'http://localhost:3000',
//     methods: ['GET', 'POST'],
//   },
// })

app.get('/', (req, res) => {
  res.send("skeding")
});

if (config.env !== 'test') {
  app.use(morgan.successHandler)
  app.use(morgan.errorHandler)
}

// enable cors
app.use(cors())
app.options('*', cors())

app.use(bodyParser.json({ limit: '50mb' }))
app.use(
  bodyParser.urlencoded({
    limit: '50mb',
    extended: false,
  })
)

// set security HTTP headers
app.use(helmet())

// parse json request body
app.use(express.json())

// parse urlencoded request body
app.use(express.urlencoded({ extended: true }))

// sanitize request data
app.use(xss())
app.use(mongoSanitize())

// gzip compression
app.use(compression())

// jwt authentication
app.use(passport.initialize())
passport.use('jwt', jwtStrategy)
passport.use('google', Google)
passport.use('outlook', Outlook)
refresh.use(Outlook)
passport.use('apple', Apple)
passport.use('zoom', Zoom)
passport.use('teams', Teams)
passport.use('google_integration', GoogleIntegration)
passport.use('outlook_integration', outlookIntegration)

io.on('connection', (socket) => {
  socket.on('sendingUserId', async (userId) => {
    // console.log('socket', socket.id)
    // console.log(userId)
    await userService.updateUserById(userId, { socket_id: socket.id })

    // let socketTopic = socket.id + '-newNotifications';
    // socket.emit(socketTopic, `you socket id is ==>  ${socket.id}`)
  })
})

module.exports.socketEmit = (topic, msg) => {
  io.emit(topic, msg)
}

// console.log("Type of socketEmit ===> ", socketEmit);

// limit repeated failed requests to auth endpoints
if (config.env === 'production') {
  app.use('/api/v1/auth', authLimiter)
}

// v1 api routes
app.use('/api/v1', routes)

// send back a 404 error for any unknown api request
app.use((req, res, next) => {
  next(new ApiError(httpStatus.NOT_FOUND, 'Not found'))
})

// convert error to ApiError, if needed
app.use(errorConverter)

// handle error
app.use(errorHandler)

module.exports.httpServer = httpServer
