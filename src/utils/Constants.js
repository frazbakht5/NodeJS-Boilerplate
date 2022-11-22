module.exports.TOTAL_MINUTES_IN_A_DAY = 1440
module.exports.TOTAL_DAYS_FOR_GETTING_TIME_SUGGESTIONS = 7
module.exports.TOTAL_DAYS_FOR_TIMESLOT_PARTICIPANT_AVAILIBILITY_DATA = 30
module.exports.NUMBER_OF_DAYS_FOR_EXTERNAL_CALENDAR_SUGGESTIONS = 60

//meeting types
module.exports.INSTANT_MEETING = 'instantMeeting'
module.exports.ALL_SKEDING_USERS = 'allSkedingUsers'
module.exports.ONE_NONSKEDING_ONE_SKEDING_USER = 'oneNonskedingOneSkedingUser'
module.exports.ONE_NONSKEDING_MULTIPLE_SKEDING_USERS = 'oneNonskedingMultipleSkedingUser'
module.exports.ONE_SKEDING_MULTIPLE_NONSKEDING_USERS = 'oneSkedingMultipleNonskedingUsers'
module.exports.MULTIPLE_SKEDING_MULTIPLE_NONSKEDING_USERS = 'multipleSkedingMultipleNonskedingUsers'
module.exports.MEETING_THROUGH_SHAREABLE_CALENDAR = 'meetingThroughShareableCalendar'
module.exports.MEETING_THROUGH_WEB_INTEGRATION_CALENDAR = 'meetingThroughWebIntegrationCalendar'
module.exports.MEETING_THROUGH_QR_CODE = 'meetingThroughQrCode'
module.exports.GOOGLE_CALENDAR_EVENT = 'googleCalendarEvent'
module.exports.OUTLOOK_CALENDAR_EVENT = 'outlookCalendarEvent'
module.exports.SEARCH_EVENT = 'searchEvent'

//meeting location types
module.exports.MEETING_TYPE_GOOGLE_MEET = 'google meet'
module.exports.MEETING_TYPE_TEAMS = 'teams'
module.exports.MEETING_TYPE_ZOOM = 'zoom'
module.exports.MEETING_TYPE_OUTLOOK = 'outlook'

//frontend paths
module.exports.ALL_SKEDING_MEETING_INVITATION_RESPONSE_PATH = '/meeting-response?meetingId='
module.exports.NON_SKEDING_MEETING_POLL_RESPONSE_PATH = '/meeting-poll'
module.exports.VIEW_MEETING_POLL_RESULTS = '/meeting-poll/results'
module.exports.VERIFY_EMAIL_PATH = '/dashboard?userSignup=true&token='
module.exports.SHAREABLE_CALENDAR_PATH = '/shareable-calendar?token='
module.exports.WEB_INTEGRATION_CALENDAR_PATH = '/public-calendar?userId='

//meeting details
module.exports.SKEDING_MEETING_TITLE_PREFIX = 'Skeding: '
module.exports.SKEDING_MEETING_DESCRIPTION_SUFFIX = ' (This meething has been organized by skeding.io)'

//notification types
module.exports.MEETING_REMINDER = 'reminder'
module.exports.MEETING_RESCHEDULED = 'rescheduled '
module.exports.MEETING_CANCELLED = 'cancelled'
module.exports.MEETING_INVITATION_RECEIVED = 'invitationReceived'
module.exports.MEETING_INVITATION_REJECTED = 'invitationRejected'
module.exports.MEETING_INVITATION_ACCEPTED = 'invitationAccepted'
module.exports.MEETING_INVITATION_ACCEPTED_BY_ALL = 'invitationAcceptedByAll'
module.exports.MEETING_NEW_TIMESLOTS_SUGGESTED = 'newTimeslotsSuggested'
module.exports.MEETING_NO_TIMESLOTS_AVAILABLE = 'noTimeslotsAvailable'
module.exports.MEETING_RESPONSE_REMINDER = 'meetingResponseReminder'

//remind for meeting 'n' minutes before
module.exports.MEETING_REMINDER_MINUTES = 90

//stripe paths
module.exports.STRIPE_REFRESH_URL = process.env.SERVER_HOST + '/payment/account/refresh?accountId='
module.exports.STRIPE_RETURN_URL = process.env.SERVER_HOST + '/payment/account/return?accountId='

//Debugging logging statments check
module.exports.DEBUGGER1 = true
module.exports.DEBUGGER2 = false
module.exports.DEBUGGER3 = false
