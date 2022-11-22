const UserService = require('../services/user.service')
const MeetingService = require('../services/meeting.service')
const ZoomService = require('../services/zoom.service')
const OutlookService = require('../services/outlook.service')
const MeetingPollService = require('../services/meetingPolls.service')
const {
  sendMeetingInviteEmail,
  sendMeetingResponseEmail,
  sendMeetingTimeSelectEmail,
  sendMeetingUpdateEmail,
  sendInstantMeetingInviteEmail,
  sendMeetingTimePollEmail,
} = require('../services/email.service')
const validator = require('validator')
const GoogleController = require('../controllers/google.controller')
const NotificationController = require('../controllers/notification.controller')
const { generateNonskedingUserMeetingSelectToken, generateNonskedingUserMeetingPollToken } = require('../services/token.service')
const { addMinutesToMilliseconds, addHoursToMilliseconds, addDaysToMilliseconds, debugLog1, debugLog2 } = require('./commonFunctions')
const {
  ALL_SKEDING_USERS,
  ONE_NONSKEDING_ONE_SKEDING_USER,
  ONE_NONSKEDING_MULTIPLE_SKEDING_USERS,
  ONE_SKEDING_MULTIPLE_NONSKEDING_USERS,
  MULTIPLE_SKEDING_MULTIPLE_NONSKEDING_USERS,
  TOTAL_DAYS_FOR_GETTING_TIME_SUGGESTIONS,
  TOTAL_DAYS_FOR_TIMESLOT_PARTICIPANT_AVAILIBILITY_DATA,
  INSTANT_MEETING,
  MEETING_TYPE_ZOOM,
  MEETING_TYPE_TEAMS,
  MEETING_TYPE_GOOGLE_MEET,
} = require('./Constants')
const { google } = require('googleapis')
const refresh = require('passport-oauth2-refresh')
const OutlookController = require('../controllers/outlook.controller')
const MeetingPoll = require('../models/meetingPolls.model')
const NotificationHelper = require('./NotificationHelper')
const TeamsController = require('../controllers/teams.controller')
const ZoomController = require('../controllers/zoom.controller')
const { tokenTypes } = require('../config/tokens')
const { OAuth2 } = google.auth
class MeetingHelper {
  static async sendMeetingTimePollEmailToNonskedingParticipants(participants, meeting) {
    debugLog1('In function MeetingHelper.sendMeetingTimePollEmailToNonskedingParticipants')

    // debugLog2('participants == ', participants)
    for (let i = 0; i < participants.length; i++) {
      const email = participants[i]

      const token = await generateNonskedingUserMeetingPollToken(meeting, email)

      sendMeetingTimePollEmail(email, meeting, token)
    }
  }

  static async sendMeetingTimeSelectEmail(participants, meeting) {
    debugLog1('In function MeetingHelper.sendMeetingTimeSelectEmail')

    for (let i = 0; i < participants.length; i++) {
      const email = participants[i]
      debugLog2('email ===> ', email)

      const userExists = await UserService.getUserByEmail(email)
      debugLog2('userExists ===> ', userExists)

      if (userExists) {
        //send notification to skeding user
        debugLog1('Skeding user')
        await MeetingHelper.sendEmailNotificationForInvitation([email], meeting)
      } else {
        debugLog1('Non-Skeding user')

        const token = await generateNonskedingUserMeetingSelectToken(meeting, email)
        if (token) {
          sendMeetingTimeSelectEmail(email, meeting, token)
        } else {
          console.error('Token could not be generated properly')
        }
      }
    }
  }

  static async sendSkedingNotificationForInvitation(initiator, skedingParticipants, newMeeting) {
    debugLog1('In function MeetingHelper.sendSkedingNotificationForInvitation')

    for (let i = 0; i < skedingParticipants.length; i++) {
      const userId = skedingParticipants[i].user_id
      let participant = await UserService.getUserById(userId)
      await NotificationHelper.sendMeetingInvitationReceivedNotification(initiator, participant, newMeeting)
    }
  }

  static async sendSkedingNotificationForMeetingUpdate(skedingParticipants, updatedMeeting) {
    debugLog1('In function MeetingHelper.sendSkedingNotificationForMeetingUpdate')

    for (let i = 0; i < skedingParticipants.length; i++) {
      const userId = skedingParticipants[i].user_id

      const data = {
        skeding_user_id: userId,
        type: 1,
        title: 'Meeting updated!',
        description: 'Your meeting has been updated. Kindly have a look.',
        meeting_id: updatedMeeting._id,
      }

      const isNotificationSent = await NotificationController.addNewNotification(data)

      if (!isNotificationSent) debugLog1('Notification not sent ===> ')
    }
  }
  /**
   *
   * @param {*} participants //array of emails
   * @param {*} newMeeting  //meeting object
   * @param {*} initiatorName
   * @param {*} initiatorEmail
   */
  static async sendEmailNotificationForInvitation(participants, newMeeting, initiatorName, initiatorEmail) {
    debugLog1('In function MeetingHelper.sendEmailNotificationForInvitation')

    for (let i = 0; i < participants.length; i++) {
      let participant = participants[i]
      let user = await UserService.getUserByEmail(participant)
      if (user) {
        let email = user.email
        if (user.is_email_notification_enabled) {
          sendMeetingInviteEmail(user, newMeeting, initiatorName, initiatorEmail, participants) // changed first argument to user object
        }
      } else {
        sendMeetingInviteEmail(participant, newMeeting, initiatorName, initiatorEmail, participants)
      }
    }
  }

  static async sendEmailNotificationToInitiatorForInvitation(initiator, non_sked_user, newMeeting) {
    debugLog1('In function MeetingHelper.sendEmailNotificationForInvitation')
    if (initiator.is_email_notification_enabled) {
      let fullName = initiator.first_name + ' ' + initiator.last_name
      sendMeetingInviteEmail(initiator, newMeeting, fullName, initiator.email, non_sked_user, true)
    }
  }

  static async RefreshOutlookToken(user) {
    debugLog1('In function MeetingHelper.RefreshOutlookToken')
    // const userRequestToken = await user.outlook_data.refreshToken
    // refresh.requestNewAccessToken('microsoft', userRequestToken, async function (err, accessToken, refreshToken) {
    //   if (err) {
    //     debugLogError1('error at referesh =>', err)
    //     return false
    //   }
    //   debugLog2('new tokens added')
    //   const outlook_data = {
    //     email: user.outlook_data.email,
    //     id: user.outlook_data.id,
    //     calendarId: user.outlook_data.email,
    //     provider: user.outlook_data.provider,
    //     token: accessToken,
    //     refreshToken: refreshToken,
    //     code: user.outlook_data.code,
    //   }
    //   return await UserService.updateUserById(user.id, { outlook_data })
    const userRequestToken = await user.outlook_data.refreshToken
    debugLog2('current token', userRequestToken)
    return new Promise((resolve, reject) => {
      refresh.requestNewAccessToken('microsoft', userRequestToken, async function (err, accessToken, refreshToken) {
        if (err) {
          debugLogError1('error at referesh =>', err)
          reject(false)
        } else {
          const outlook_data = {
            email: user.outlook_data.email,
            id: user.outlook_data.id,
            calendarId: user.outlook_data.email,
            provider: user.outlook_data.provider,
            token: accessToken,
            refreshToken: refreshToken,
            code: user.outlook_data.code,
          }
          const updatedUser = await UserService.updateUserById(user.id, { outlook_data })
          debugLog2('new tokens added')
          resolve(updatedUser)
        }
      })
    })
  }

  static async RefreshTeamsToken(user) {
    debugLog1('In function MeetingHelper.RefreshTeamsToken')
    const userRequestToken = await user.teams_data.refreshToken
    return new Promise((resolve, reject) => {
      refresh.requestNewAccessToken('microsoft', userRequestToken, async function (err, accessToken, refreshToken) {
        if (err) {
          debugLogError1('error at referesh (teams) =>', err)
          reject(false)
        } else {
          const teams_data = {
            email: user.teams_data.email,
            id: user.teams_data.id,
            token: accessToken,
            refreshToken: refreshToken,
            code: user.teams_data.code,
          }
          const updatedUser = UserService.updateUserById(user.id, { teams_data })
          debugLog1('new tokens added (teams)')
          resolve(updatedUser)
        }
      })
    })
  }

  static async sendEmailNotificationForMeetingUpdate(participants, updatedMeeting) {
    debugLog1('In function MeetingHelper.sendEmailNotificationForMeetingUpdate')

    for (let i = 0; i < participants.length; i++) {
      let participant = participants[i]
      if (participant.user_id) {
        //participant is skeding user
        let user = await UserService.getUserById(participant.user_id)
        let email = user.email

        if (user.is_email_notification_enabled) {
          sendMeetingUpdateEmail(email)
        }
      } else {
        //participant is nonskeding user
        sendMeetingUpdateEmail(participant)
      }
    }
  }

  /**
   * this function adds or update the status of calendar
   * @param {Array} participants: array of skeding participants
   * @param {Object} meeting; meeting object
   * @param {String} userId
   * @param {String} timeZone
   * @param {Number} offset
   * @returns
   */
  static async addMeetingToUserExternalCalendar(participants, meeting, userId, timeZone = null, offset, isAccepted = false) {
    debugLog1('In function MeetingHelper.addMeetingToUserExternalCalendar')
    const attendees = []
    for (let i = 0; i < participants.length; i++) {
      const email = participants[i]
      attendees.push({ email: email, responseStatus: isAccepted ? 'accepted' : 'needsAction' })
    }
    let event = {
      summary: meeting.title,
      location: meeting.location,
      description: meeting.description,
      start: {
        dateTime: new Date(meeting.start_datetime),
        timeZone: timeZone,
      },
      end: {
        dateTime: new Date(meeting.end_datetime ? meeting.end_datetime : meeting.start_datetime + addHoursToMilliseconds(0, 1)),
        timeZone: timeZone,
      },
      attendees: attendees,
      conferenceData: {
        createRequest: {
          requestId: meeting._id,
          conferenceSolutionKey: { type: 'hangoutsMeet' },
        },
      },
    }

    debugLog2('event ===> ', event)

    let initiatorGoogleToken = ''
    let initiatorOutlookToken = ''
    const userDetails = await UserService.getUserById(userId)
    // debugLog2("userDetails ===> ", userDetails);

    if (userDetails && userDetails.is_google_synced) {
      debugLog1('Inside function addMeetingToUserCalendar.google-condition')

      //teams meeting for google user
      if (meeting.location.toLowerCase() === MEETING_TYPE_TEAMS) {
        debugLog1('Inside function google user teams meeting')
        const teamMeeting = await TeamsController.createTeamsMeeting(userDetails, meeting, event)
        let eventObj = await event
        eventObj.conferenceData = null
        eventObj.location = teamMeeting.onlineMeeting.joinUrl
        initiatorGoogleToken = userDetails.google_data.refreshToken
        await GoogleController.createEventOnUserGoogleCalendar(initiatorGoogleToken, eventObj, meeting, userDetails.email)
        return
      }

      //meeting on zoom by google user
      if (meeting.location.toLowerCase() === MEETING_TYPE_ZOOM) {
        debugLog1('Inside function google user zoom meeting')
        const zoomMeeting = await ZoomController.createZoomMeeting(userDetails, meeting)
        if (zoomMeeting) {
          await MeetingService.updateMeetingById(meeting._id, { location: zoomMeeting.join_url, zoom_event_id: zoomMeeting.id })
          let eventObj = await event
          eventObj.conferenceData = null
          eventObj.description = event.description + ':link => ' + zoomMeeting.join_url
          initiatorGoogleToken = userDetails.google_data.refreshToken
          await GoogleController.createEventOnUserGoogleCalendar(initiatorGoogleToken, eventObj, meeting, userDetails.email)
          debugLog2('zoom meeting ===>')
        }
        return
      }

      //update meeting on google calendar
      if (meeting?.google_event_id) {
        debugLog1('In function update google event by google user')
        await GoogleController.createEventOnUserGoogleCalendar(userDetails.google_data.refreshToken, event, meeting, userDetails.email)
        return
      }

      //update meeting on outlook calendar
      if (meeting?.outlook_event_id) {
        debugLog1('Inside function update outlook event by google user')
        const initiator = await UserService.getUserById(meeting.initiator_user_id)
        let event = {
          summary: meeting.title,
          description: meeting.description,
        }
        await OutlookService.refreshOutlookToken(initiator)
        initiatorOutlookToken = initiator.outlook_data.token
        await OutlookController.createEventOnUserOutlookCalendar(initiatorOutlookToken, event, meeting, userDetails)
      }

      //meeting on google calendar
      initiatorGoogleToken = userDetails.google_data.refreshToken
      const googleEvent = await GoogleController.createEventOnUserGoogleCalendar(initiatorGoogleToken, event, meeting, userDetails.email)
      debugLog2('googleEvent ===> ', googleEvent)

      return
    } else if (userDetails && userDetails.is_microsoft_synced) {
      debugLog2('Inside function addMeetingToUserCalendar.outlook-condition')

      //token refresh in case of instant meeting
      if (meeting.case === INSTANT_MEETING) {
        debugLog2('Inside function outlook user instant meeting')

        const updatedUser = await OutlookService.refreshOutlookToken(userDetails)
        initiatorOutlookToken = updatedUser.outlook_data.token
      } else {
        initiatorOutlookToken = await userDetails.outlook_data.token
      }

      //teams meeting for outlook user
      if (meeting.location.toLowerCase() === MEETING_TYPE_TEAMS) {
        debugLog2('Inside function outlook user teams meeting')
        const teamMeeting = await TeamsController.createTeamsMeeting(userDetails, meeting, event)
        if (teamMeeting) {
          await MeetingService.updateMeetingById(meeting._id, { location: teamMeeting.onlineMeeting.joinUrl, outlook_event_id: teamMeeting.id })
          let eventObj = await event
          eventObj.description = event.description + ':link => ' + teamMeeting.onlineMeeting.joinUrl
          OutlookController.createEventOnUserOutlookCalendar(initiatorOutlookToken, eventObj, meeting, userDetails)
        }
        return
      }

      //zoom meeting for outlook user
      if (meeting.location.toLowerCase() === MEETING_TYPE_ZOOM) {
        debugLog2('Inside function outlook user zoom meeting')
        const zoomMeeting = await ZoomController.createMeeting(userDetails, meeting)
        if (zoomMeeting) {
          await MeetingService.updateMeetingById(meeting._id, { location: zoomMeeting.join_url, zoom_event_id: zoomMeeting.id })
          let eventObj = await event
          eventObj.description = event.description + ':link => ' + zoomMeeting.join_url
          OutlookController.createEventOnUserOutlookCalendar(initiatorOutlookToken, eventObj, meeting, userDetails)
          debugLog2('zoom meeting ===>')
        }
        return
      }
      //update meeting on outlook calendar
      if (meeting?.outlook_event_id) {
        debugLog2('In function update outlook event by outlook user')
        const updatedUser = await OutlookService.refreshOutlookToken(userDetails)
        await OutlookController.createEventOnUserOutlookCalendar(updatedUser.outlook_data.token, event, meeting, userDetails.email)
        return
      }

      //update meeting on google calendar
      if (meeting?.google_event_id) {
        const initiator = await UserService.getUserById(meeting.initiator_user_id)
        let event = {
          summary: meeting.title,
          description: meeting.description,
        }
        await GoogleController.createEventOnUserGoogleCalendar(initiator.google_data.refreshToken, event, meeting, userDetails.email)
        const updatedUser = await OutlookService.refreshOutlookToken(userDetails)
        initiatorOutlookToken = updatedUser.outlook_data.token
      }

      //meeting on outlook calendar
      const outlookEvent = await OutlookController.createEventOnUserOutlookCalendar(initiatorOutlookToken, event, meeting, userDetails)
      debugLog2('outlookEvent ===> ', outlookEvent)
      return
    } else {
      return false
    }
  }

  //not to be used
  static async convertUTCMillisecondsToTimezoneDate(milliseconds, offset) {
    if (offset == 0) {
      return milliseconds
    }
    let utcDate = new Date(milliseconds)

    let actualDate = 0

    if (offset < 0) {
      actualDate = new Date(utcDate.getTime() - offset * 60000)
    } else {
      actualDate = new Date(utcDate.getTime() + offset * 60000)
    }

    debugLog2('actualDate ===> ', actualDate.toString())
    return actualDate
  }

  static async sendSkedingNotificationForInvitationStatusUpdate(participantEmail, meeting, response) {
    debugLog1('In function MeetingHelper.sendSkedingNotificationForInvitationStatusUpdate')

    const data = {
      skeding_user_id: meeting.initiator_user_id,
      type: 1,
      title: 'Someone responded to your meeting invitation',
      description: `${participantEmail} ${response ? 'accepted' : 'declined'} your invitation for '${meeting.title}'`,
      meeting_id: meeting._id,
    }

    const isNotificationSent = await NotificationController.addNewNotification(data)

    if (!isNotificationSent) debugLog2('Notification not sent ===> ')
  }

  static async sendEmailNotificationForInvitationStatusUpdate(initiatorEmail, meeting, fullName, email, response) {
    debugLog1('In function MeetingHelper.sendEmailNotificationForInvitationStatusUpdate')

    sendMeetingResponseEmail(initiatorEmail, meeting, fullName, email, response)
  }

  static async decideWorkflow(req) {
    debugLog1('In function MeetingHelper.decideWorkflow')

    const bodyParams = req.body

    let skedingUsersIds = []
    let skedingUsersEmails = []
    let nonSkedingUsersEmails = []

    //Seperating skeding and non-skeding uers
    for (let i = 0; i < bodyParams.participants.length; i++) {
      const participantEmail = bodyParams.participants[i]
      // debugLog2("\n\nGetting info for email ===> ", participantEmail);

      let participantId = await UserService.getIdByEmail(participantEmail)
      // debugLog2("participantId ===> ", participantId);

      if (!participantId) {
        nonSkedingUsersEmails.push(participantEmail)
      } else {
        skedingUsersIds.push(participantId._id)
        skedingUsersEmails.push(participantEmail)
      }
    }

    let numOfSkedingUsers = skedingUsersIds.length + 1 //adding 1 because initiator is also skeding user
    let numOfNonSkedingUsers = nonSkedingUsersEmails.length

    let workflow = null

    if (numOfSkedingUsers > 0 && numOfNonSkedingUsers == 0) {
      workflow = ALL_SKEDING_USERS
    } else if (numOfSkedingUsers == 1 && numOfNonSkedingUsers == 1) {
      workflow = ONE_NONSKEDING_ONE_SKEDING_USER
    } else if (numOfSkedingUsers > 1 && numOfNonSkedingUsers == 1) {
      workflow = ONE_NONSKEDING_MULTIPLE_SKEDING_USERS
    } else if (numOfSkedingUsers == 1 && numOfNonSkedingUsers > 1) {
      workflow = ONE_SKEDING_MULTIPLE_NONSKEDING_USERS
    } else if (numOfSkedingUsers > 1 && numOfNonSkedingUsers > 1) {
      workflow = MULTIPLE_SKEDING_MULTIPLE_NONSKEDING_USERS
    } else {
      workflow = false
    }

    return { workflow, skedingUsersIds, skedingUsersEmails, nonSkedingUsersEmails }
  }

  static async checkUsersAvailibility(participants, nonSkedingUsersEmails, availableUsersEmails, unavailableUsersEmails, possibleStartTime, possibleEndTime) {
    debugLog1('In function MeetingHelper.checkUsersAvailibility')

    const possibleStartDate = new Date(possibleStartTime)
    const possibleEndDate = new Date(possibleEndTime)

    //categorizing all available and unavailable slots
    for (let i = 0; i < participants.length; i++) {
      const participantEmail = participants[i]
      // debugLog2("\n\nGetting info for email ===> ", participantEmail);

      let participantId = await UserService.getIdByEmail(participantEmail)
      // debugLog2("participantId ===> ", participantId);

      if (!participantId) {
        nonSkedingUsersEmails.push(participantEmail)
        continue
      }
      participantId = participantId._id

      const userMeetings = await MeetingService.getUserConfirmedMeetingsTimeOnly(participantId)

      const userPreferences = await UserService.getUserPreferences(participantId)

      const breaksDurationMilliseconds = addMinutesToMilliseconds(0, userPreferences.breaks_duration)

      let isSlotPossible = true
      let isPreferenceBlocking = false

      const preferencesReturnData = MeetingHelper.checkIfPreferencesAreBlockingSlot(userPreferences, possibleStartDate, possibleEndDate, isSlotPossible, isPreferenceBlocking)

      isSlotPossible = preferencesReturnData.isSlotPossible
      isPreferenceBlocking = preferencesReturnData.isPreferenceBlocking

      if (userMeetings && !isPreferenceBlocking) {
        isSlotPossible = MeetingHelper.checkIfMeetingsAreBlockingSlot(userMeetings, breaksDurationMilliseconds, possibleStartTime, possibleEndTime, isSlotPossible)
      }

      if (isSlotPossible) {
        availableUsersEmails.push(participantEmail)
      } else {
        unavailableUsersEmails.push(participantEmail)
      }
    }

    return { nonSkedingUsersEmails, availableUsersEmails, unavailableUsersEmails }
  }

  static async checkIfPreferencesAreBlockingSlot(userPreferences, possibleStartDate, possibleEndDate, isSlotPossible = true, isPreferenceBlocking = false) {
    debugLog2('In function MeetingHelper.checkIfPreferencesAreBlockingSlot')

    for (let j = 0; j < userPreferences.blocked_timeslots.length; j++) {
      const blockedTimeslot = userPreferences.blocked_timeslots[j]

      let possibleSlotStartMinutesPassed = possibleStartDate.getHours() * 60 + possibleStartDate.getMinutes()
      let possibleSlotEndMinutesPassed = possibleEndDate.getHours() * 60 + possibleEndDate.getMinutes()
      let blockedSlotStartMinutesPassed = blockedTimeslot.start_hours * 60 + blockedTimeslot.start_minutes
      let blockedSlotEndMinutesPassed = blockedTimeslot.end_hours * 60 + blockedTimeslot.end_minutes

      if (
        (possibleStartDate.getDay() == blockedTimeslot.start_day || possibleEndDate.getDay() == blockedTimeslot.start_day) &&
        blockedTimeslot.start_day == blockedTimeslot.end_day
      ) {
        if (possibleSlotStartMinutesPassed >= blockedSlotStartMinutesPassed && possibleSlotStartMinutesPassed < blockedSlotEndMinutesPassed) {
          debugLog2('Not possible 1')
          isSlotPossible = false
          isPreferenceBlocking = true
          break
        } else if (possibleSlotEndMinutesPassed > blockedSlotStartMinutesPassed && possibleSlotEndMinutesPassed < blockedSlotEndMinutesPassed) {
          debugLog2('Not possible 2')
          isSlotPossible = false
          isPreferenceBlocking = true
          break
        }
      }

      if (
        (possibleStartDate.getDay() == blockedTimeslot.start_day || possibleEndDate.getDay() == blockedTimeslot.start_day) &&
        blockedTimeslot.start_day != blockedTimeslot.end_day
      ) {
        if (
          (possibleSlotStartMinutesPassed >= blockedSlotStartMinutesPassed && possibleSlotStartMinutesPassed < TOTAL_MINUTES_IN_A_DAY) ||
          (possibleSlotStartMinutesPassed >= 0 && possibleSlotStartMinutesPassed < blockedSlotEndMinutesPassed) ||
          (possibleSlotEndMinutesPassed > blockedSlotStartMinutesPassed && possibleSlotEndMinutesPassed < TOTAL_MINUTES_IN_A_DAY) ||
          (possibleSlotStartMinutesPassed >= 0 && possibleSlotStartMinutesPassed < blockedSlotEndMinutesPassed)
        ) {
          debugLog2('Not possible 3')
          isSlotPossible = false
          isPreferenceBlocking = true
          break
        }
      }
    }

    return { isSlotPossible, isPreferenceBlocking }
  }

  static async checkIfMeetingsAreBlockingSlot(userMeetings, breaksDurationMilliseconds, possibleStartTime, possibleEndTime, isSlotPossible = true) {
    debugLog1('In function MeetingHelper.checkIfMeetingsAreBlockingSlot')

    // debugLog2("userMeetings ===> ", userMeetings);
    //padding the breaks on meetings
    for (let j = 0; j < userMeetings.length; j++) {
      const meeting = userMeetings[j]
      // debugLog2("meeting ===> ", meeting);

      const slot = {
        startTime: meeting.start_datetime - breaksDurationMilliseconds,
        endTime: meeting.end_datetime + breaksDurationMilliseconds,
      }

      if (possibleStartTime >= slot.startTime && possibleStartTime < slot.endTime) {
        debugLog2('Not possible 1')
        isSlotPossible = false
        break
      } else if (possibleEndTime > slot.startTime && possibleEndTime < slot.endTime) {
        debugLog2('Not possible 2')
        isSlotPossible = false
        break
      }
    }

    return isSlotPossible
  }

  static async checkIfTimeslotIsInFuture(timeslots, duration, currentDate) {
    debugLog1('In function MeetingHelper.checkIfTimeslotIsInFuture')

    let futureTimeslots = []

    for (let i = 0; i < timeslots.length; i++) {
      const slot = timeslots[i]
      const slotStart = slot.startTime

      if (slotStart >= currentDate + duration) {
        futureTimeslots.push(slot)
      }
    }

    return futureTimeslots
  }

  static async checkIfUserIsStillFreeInSlot(userEmail, timeslots) {
    debugLog1('In function MeetingHelper.checkIfUserIsStillFreeInSlot')

    let availableSlots = []

    for (let i = 0; i < timeslots.length; i++) {
      const slot = timeslots[i]
      const slotStart = slot.startTime
      const slotEnd = slot.endTime

      const dividedParticipantsData = await MeetingHelper.checkUsersAvailibility([userEmail], [], [], [], slotStart, slotEnd)

      let availableUsersEmails = dividedParticipantsData.availableUsersEmails

      if (availableUsersEmails.includes(userEmail)) {
        availableSlots.push(slot)
      }
    }

    return availableSlots
  }

  static async sendEmailNotificationForInvitationOfInstantMeeting(participants, newMeeting) {
    debugLog1('In function MeetingHelper.sendEmailNotificationForInvitationOfInstantMeeting')

    for (let i = 0; i < participants.length; i++) {
      let participant = participants[i]

      if (participant.user_id) {
        let user = await UserService.getUserById(participant.user_id)
        let email = user.email

        if (user.is_email_notification_enabled) {
          sendInstantMeetingInviteEmail(email, newMeeting)
        }
      } else {
        sendInstantMeetingInviteEmail(participant, newMeeting)
      }
    }
  }

  static async getPollingResultForSkedingUsers(req) {
    debugLog1('In function MeetingHelper.getPollingResultForSkedingUsers')

    const bodyParams = req.body

    let skedingParticipantsData = []

    debugLog2('Getting skedingParticipantsData...')

    for (let i = 0; i < req.body.skedingUsersIds.length; i++) {
      let participantId = req.body.skedingUsersIds[i]

      const user = await UserService.getUserById(participantId)

      const userMeetings = await MeetingService.getUserConfirmedMeetingsTimeOnly(participantId)

      let confirmedMeetings = []
      const breaksDurationMilliseconds = addMinutesToMilliseconds(0, user.breaks_duration)

      if (userMeetings) {
        //padding the breaks on meetings
        for (let j = 0; j < userMeetings.length; j++) {
          const meeting = userMeetings[j]

          const slot = {
            startTime: meeting.start_datetime - breaksDurationMilliseconds,
            endTime: meeting.end_datetime + breaksDurationMilliseconds,
          }

          confirmedMeetings.push(slot)
        }
      }

      const participantData = {
        userId: user._id,
        email: user.email,
        preferences: {
          is_email_notification_enabled: user.is_email_notification_enabled,
          breaks_duration: user.breaks_duration,
          blocked_timeslots: user.blocked_timeslots,
        },
        confirmedMeetings,
      }

      skedingParticipantsData.push(participantData)
    }

    // debugLog2('skedingParticipantsData ===> ', skedingParticipantsData)

    const currentDate = new Date(addMinutesToMilliseconds(bodyParams.current_date, bodyParams.duration_minutes))

    //	rounding off to quarter hour
    let tempMinutes = currentDate.getMinutes()

    if (tempMinutes > 0 && tempMinutes < 15) currentDate.setMinutes(15)
    else if (tempMinutes > 15 && tempMinutes < 30) currentDate.setMinutes(30)
    else if (tempMinutes > 30 && tempMinutes < 45) currentDate.setMinutes(45)
    else if (tempMinutes > 45 && tempMinutes < 60) {
      currentDate.setMinutes(0)
      let tempHours = currentDate.getHours()
      currentDate.setHours(tempHours + 1)
    }

    currentDate.setSeconds(0)
    currentDate.setMilliseconds(0)

    const endDate = addDaysToMilliseconds(currentDate.getTime(), TOTAL_DAYS_FOR_TIMESLOT_PARTICIPANT_AVAILIBILITY_DATA)

    let tempTime = currentDate.getTime()

    let slotsData = []

    debugLog2('Now iterating through slots...')

    //now we will check participants availibility for different time slots
    while (tempTime <= endDate) {
      const possibleStartTime = tempTime
      const possibleEndTime = addMinutesToMilliseconds(tempTime, bodyParams.duration_minutes)

      let slotData = await MeetingHelper.checkSkedingUsersAvailibilityForSlot(skedingParticipantsData, possibleStartTime, possibleEndTime)

      slotsData.push(slotData)

      tempTime = possibleEndTime
    }

    debugLog2('Returning slotsData...')

    return slotsData
  }

  static async getInstantanousPollingResult(req, meeting) {
    debugLog1('In function MeetingHelper.getInstantanousPollingResult')

    const bodyParams = req.body

    let slotsData = []

    let skedingParticipantsData = []

    let skedingParticipantsIds = [meeting.initiator_user_id]
    let nonskedingParticipantsEmails = meeting.non_skeding_participants
    let nonResponsiveNonSkedingParticipants = meeting.non_skeding_participants

    for (let i = 0; i < meeting.skeding_participants.length; i++) {
      let participantId = meeting.skeding_participants[i].user_id
      skedingParticipantsIds.push(participantId)
    }

    //filtering those nonskeding participants which are now skeding participants
    for (let i = 0; i < meeting.non_skeding_participants.length; i++) {
      let participantEmail = meeting.non_skeding_participants[i]

      let participantId = await UserService.getIdByEmail(participantEmail)

      if (participantId) {
        skedingParticipantsIds.push(participantId._id)
        nonskedingParticipantsEmails = nonskedingParticipantsEmails.filter((v) => v !== participantEmail)
        nonResponsiveNonSkedingParticipants = nonResponsiveNonSkedingParticipants.filter((v) => v !== participantEmail)
      }
    }

    debugLog1('Getting skedingParticipantsData...')

    for (let i = 0; i < skedingParticipantsIds.length; i++) {
      let participantId = skedingParticipantsIds[i]

      const user = await UserService.getUserById(participantId)

      const userMeetings = await MeetingService.getUserConfirmedMeetingsTimeOnly(participantId)

      let confirmedMeetings = []
      const breaksDurationMilliseconds = addMinutesToMilliseconds(0, user.breaks_duration)

      if (userMeetings) {
        //padding the breaks on meetings
        for (let j = 0; j < userMeetings.length; j++) {
          const meeting = userMeetings[j]

          const slot = {
            startTime: meeting.start_datetime - breaksDurationMilliseconds,
            endTime: meeting.end_datetime + breaksDurationMilliseconds,
          }

          confirmedMeetings.push(slot)
        }
      }

      const participantData = {
        userId: user._id,
        email: user.email,
        preferences: {
          is_email_notification_enabled: user.is_email_notification_enabled,
          breaks_duration: user.breaks_duration,
          blocked_timeslots: user.blocked_timeslots,
        },
        confirmedMeetings,
      }

      skedingParticipantsData.push(participantData)
    }

    const pollsDataForMeeting = await MeetingPollService.getAllMeetingPolls(meeting._id)

    debugLog1('polls for meeting', pollsDataForMeeting)

    for (let i = 0; i < meeting.proposed_timeslots.length; i++) {
      let slot = meeting.proposed_timeslots[i]

      //check for skeding users
      let slotEntry = await MeetingHelper.checkSkedingUsersAvailibilityForSlot(skedingParticipantsData, slot.startTime, slot.endTime)

      //check for nonskeding users
      for (let j = 0; j < pollsDataForMeeting.length; j++) {
        const response = pollsDataForMeeting[j]

        if (nonResponsiveNonSkedingParticipants.includes(response.email)) {
          nonResponsiveNonSkedingParticipants = nonResponsiveNonSkedingParticipants.filter((v) => v !== response.email)
        }

        for (let k = 0; k < response.preferred_timeslots.length; k++) {
          const responseSlot = response.preferred_timeslots[k]

          if (slot.startTime == responseSlot.startTime && slot.endTime == responseSlot.endTime) {
            slotEntry.availableParticipantsData.push({
              userId: null,
              email: response.email,
            })

            break
          }
        }
      }

      slotsData.push(slotEntry)
    }

    return { slotsData, nonResponsiveNonSkedingParticipants }
  }

  /**
   * This function tells which participant is available and whichis unavailable
   * during specific timing
   * @param {*} participantsData: Array of object with userId, email, preferences, confirmedMeetings
   * @param {*} slotStart
   * @param {*} slotEnd
   */
  static async checkSkedingUsersAvailibilityForSlot(participantsData, slotStart, slotEnd) {
    debugLog1('In function MeetingHelper.checkSkedingUsersAvailibilityForSlot')

    let availableParticipantsData = []
    let unavailableParticipantsData = []

    const possibleStartTime = slotStart
    const possibleEndTime = slotEnd

    let isSlotPossible = true

    const possibleStartDate = new Date(possibleStartTime)
    const possibleEndDate = new Date(possibleEndTime)

    let isPreferenceBlocking = false

    //check for preferences
    for (let i = 0; i < participantsData.length; i++) {
      const preference = participantsData[i].preferences

      for (let j = 0; j < preference.blocked_timeslots.length; j++) {
        const blockedTimeslot = preference.blocked_timeslots[j]

        let possibleSlotStartMinutesPassed = possibleStartDate.getHours() * 60 + possibleStartDate.getMinutes()
        let possibleSlotEndMinutesPassed = possibleEndDate.getHours() * 60 + possibleEndDate.getMinutes()
        let blockedSlotStartMinutesPassed = blockedTimeslot.start_hours * 60 + blockedTimeslot.start_minutes
        let blockedSlotEndMinutesPassed = blockedTimeslot.end_hours * 60 + blockedTimeslot.end_minutes

        if (blockedTimeslot.start_day === blockedTimeslot.end_day) {
          //blocked slot on same day
          let blockedSlotDay = blockedTimeslot.start_day

          if (possibleStartDate.getDay() === possibleEndDate.getDay()) {
            //blocked slot on same day && possible slot on same day
            let possibleDay = possibleStartDate.getDay()

            if (possibleDay === blockedSlotDay) {
              //

              if (possibleSlotStartMinutesPassed >= blockedSlotStartMinutesPassed && possibleSlotStartMinutesPassed < blockedSlotEndMinutesPassed) {
                isSlotPossible = false
                isPreferenceBlocking = true
                break
              } else if (possibleSlotEndMinutesPassed > blockedSlotStartMinutesPassed && possibleSlotEndMinutesPassed < blockedSlotEndMinutesPassed) {
                isSlotPossible = false
                isPreferenceBlocking = true
                break
              } else if (possibleSlotStartMinutesPassed < blockedSlotStartMinutesPassed && possibleSlotEndMinutesPassed > blockedSlotEndMinutesPassed) {
                isSlotPossible = false
                isPreferenceBlocking = true
                break
              }
            }
          }
          if (possibleStartDate.getDay() !== possibleEndDate.getDay()) {
            //blocked slot on same day && possible slot on different day

            if (possibleSlotStartMinutesPassed < blockedSlotEndMinutesPassed) {
              isSlotPossible = false
              isPreferenceBlocking = true
              break
            }
          }
        } else if (blockedTimeslot.start_day !== blockedTimeslot.end_day) {
          //blocked slot on different days

          if (possibleStartDate.getDay() === possibleEndDate.getDay()) {
            //blocked slot on different days && possible slot on same day
            let possibleDay = possibleStartDate.getDay()

            if (blockedTimeslot.start_day === possibleDay) {
              //blocked slot starts and possible slot starts & ends at same day
              if (possibleSlotEndMinutesPassed > blockedSlotStartMinutesPassed) {
                isSlotPossible = false
                isPreferenceBlocking = true
                break
              }
            } else if (blockedTimeslot.end_day === possibleDay) {
              //blocked slot ends and possible slot starts & ends at same day
              if (possibleSlotStartMinutesPassed < blockedSlotEndMinutesPassed) {
                isSlotPossible = false
                isPreferenceBlocking = true
                break
              }
            }
          } else if (possibleStartDate.getDay() !== possibleEndDate.getDay()) {
            //blocked slot on different days && possible slot on different days

            isSlotPossible = false
            isPreferenceBlocking = true
            break
          }
        }
      }

      if (isPreferenceBlocking) {
        const pDataShort = {
          userId: participantsData[i].userId,
          email: participantsData[i].email,
        }
        unavailableParticipantsData.push(pDataShort)
      } else {
        availableParticipantsData.push(participantsData[i])
      }
    }

    let availableParticipantsDataShort = []
    //participants who were included in available array after checking preferences are now to be checked. We see if any of their meetings are blocking them in the slot
    for (let i = 0; i < availableParticipantsData.length; i++) {
      const userMeetings = availableParticipantsData[i].confirmedMeetings //these meetings are assumed to already have preferences' breaks padding done

      if (userMeetings) {
        let isMeetingBlocking = false

        for (let j = 0; j < userMeetings.length; j++) {
          let meeting = userMeetings[j]

          if (possibleStartTime >= meeting.startTime && possibleStartTime < meeting.endTime) {
            let unavailableUser = availableParticipantsData.splice(i, 1) //remove from this array

            const pDataShort = {
              userId: unavailableUser[0].userId,
              email: unavailableUser[0].email,
            }
            unavailableParticipantsData.push(pDataShort) //add to this array
            isMeetingBlocking = true
            break
          } else if (possibleEndTime > meeting.startTime && possibleEndTime < meeting.endTime) {
            let unavailableUser = availableParticipantsData.splice(i, 1)
            const pDataShort = {
              userId: unavailableUser[0].userId,
              email: unavailableUser[0].email,
            }
            unavailableParticipantsData.push(pDataShort)
            isMeetingBlocking = true
            break
          }
        }

        if (!isMeetingBlocking) {
          const pDataShort = {
            userId: availableParticipantsData[i].userId,
            email: availableParticipantsData[i].email,
          }
          availableParticipantsDataShort.push(pDataShort)
        } else {
          unavailableParticipantsData.push(availableParticipantsData[i])
        }
      }
    }

    let returnObj = {
      slotStart,
      slotEnd,
      availableParticipantsData: availableParticipantsDataShort,
      unavailableParticipantsData,
    }

    return returnObj
  }

  static async getUserPreferencesFromUserData(user) {
    debugLog1('In function MeetingHelper.getUserPreferencesFromUserData')

    return {
      is_email_notification_enabled: user.is_email_notification_enabled,
      breaks_duration: user.breaks_duration,
      blocked_timeslots: user.blocked_timeslots,
      blocked_timeslots_utc: user.blocked_timeslots_utc ? user.blocked_timeslots_utc : user.blocked_timeslots,
      available_timeslots: user.available_timeslots,
      blocked_days: user.blocked_days,
    }
  }
  
  static async deleteEventFromUserExternalCalendar(user, updatedMeeting) {
    debugLog1('In function MeetingHelper.deleteEventFromUserExternalCalendar')
    let userDetails
    let tokenData = {}
    //if whole user is passed as a params
    if (user.token) {
      userDetails = user
      tokenData = {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        type: tokenTypes.ACCESS,
      }
    }
    //if only token data is passed as a params
    else {
      userDetails = await UserService.getUserById(user.id)
      tokenData = user
    }
    try {
      if (userDetails.is_google_synced) {
        await GoogleController.deleteMeetingFromUserGoogleCalendar(userDetails.google_data.refreshToken, updatedMeeting, tokenData)
      } else if (userDetails.is_microsoft_synced) {
        await OutlookService.refreshOutlookToken(userDetails)
        await OutlookController.deleteMeetingFromUserOutlookCalendar(userDetails.outlook_data.token, updatedMeeting, tokenData)
      }
    } catch (e) {
      debugLogError1('Event deletion exception')
    }
  }

  static async updateSkedingParticpants(meeting) {
    debugLog1('In function MeetingHelper.updateSkedingParticpants')
    let nonSkedingParticipantsNotYetResponded = meeting.non_skeding_participants_not_responded
    let nonSkedingParticipants = meeting.non_skeding_participants
    let skedingParticipants = meeting.skeding_participants

    const skedingUsersSignedUp = await UserService.getManyUsersByEmails(meeting.non_skeding_participants_not_responded)
    debugLog2('skedingUsersSignedUp => ', skedingUsersSignedUp)

    for (let i = 0; i < skedingUsersSignedUp.length; i++) {
      let user = skedingUsersSignedUp[i]
      if (nonSkedingParticipantsNotYetResponded.includes(user.email) && nonSkedingParticipants.includes(user.email)) {
        debugLog2('user.email => ', user.email)
        nonSkedingParticipantsNotYetResponded.splice(i, 1)
        nonSkedingParticipants.splice(i, 1)
        skedingParticipants.push({
          is_invitation_accepted: -1,
          user_id: user._id,
          email: user.email,
        })
      }
    }

    let updateBody = {
      non_skeding_participants_not_responded: nonSkedingParticipantsNotYetResponded,
      skeding_participants: skedingParticipants,
      non_skeding_participants: nonSkedingParticipants,
    }
    return await MeetingService.updateMeetingById(meeting._id, updateBody)
  }
}

module.exports = MeetingHelper
