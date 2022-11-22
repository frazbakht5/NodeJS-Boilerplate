const NotificationService = require('../services/notification.service')
const {
  MEETING_CANCELLED,
  MEETING_INVITATION_REJECTED,
  MEETING_INVITATION_ACCEPTED,
  MEETING_INVITATION_ACCEPTED_BY_ALL,
  MEETING_INVITATION_RECEIVED,
  MEETING_NEW_TIMESLOTS_SUGGESTED,
  MEETING_NO_TIMESLOTS_AVAILABLE,
  MEETING_REMINDER,
  MEETING_REMINDER_MINUTES,
  MEETING_RESPONSE_REMINDER,
} = require('./Constants')

const schedule = require('node-schedule')
const { addMinutesToMilliseconds, debugLog1, debugLog2, debugLog3 } = require('./commonFunctions')
const App = require('../app')

class NotificationHelper {
  static async addToDbAndSendNotification(user, notification) {
    debugLog1('In function NotificationHelper.addToDbAndSendNotification')

    const newNotification = await NotificationService.createNotification(notification)

    if (newNotification) {
      //send to user via socket/fcm
      let socketTopic = user.socket_id + '-newNotifications'
      console.log('socket emitting to scoketTopic ===> ', socketTopic)

      App.socketEmit(socketTopic, `You have new notifications`)
      // io.emit(socketTopic, `You have new notifications`);

      return newNotification
    } else return false
  }

  static async sendMeetingCancelledNotification(user, meeting) {
    debugLog1('In function NotificationHelper.sendMeetingCancelledNotification')
    let notification = {
      skeding_user_id: user._id,
      type: MEETING_CANCELLED,
      title: 'Cancelled: ' + meeting.title,
      description: "Your meeting '" + meeting.title + "' has been cancelled.",
      meeting_id: meeting._id,
    }

    return await NotificationHelper.addToDbAndSendNotification(user, notification)
  }

  static async sendMeetingInvitationRejectedNotification(initiator, participant, meeting) {
    debugLog1('In function NotificationHelper.sendMeetingInvitationRejectedNotification')

    let notification = {
      skeding_user_id: initiator._id,
      type: MEETING_INVITATION_REJECTED,
      title: `${participant.first_name} ${participant.last_name} rejected: ${meeting.title}`,
      description: `${participant.first_name} ${participant.last_name} rejected your invitation for meeting '${meeting.title}'`,
      meeting_id: meeting._id,
    }

    return await NotificationHelper.addToDbAndSendNotification(initiator, notification)
  }

  static async sendMeetingInvitationAccepedNotification(initiator, participant, meeting) {
    debugLog1('In function NotificationHelper.sendMeetingInvitationAccepedNotification')

    let notification = {
      skeding_user_id: initiator._id,
      type: MEETING_INVITATION_ACCEPTED,
      title: `${participant.first_name} ${participant.last_name} accepted: ${meeting.title}`,
      description: `${participant.first_name} ${participant.last_name} accepted your invitation for meeting '${meeting.title}'`,
      meeting_id: meeting._id,
    }

    return await NotificationHelper.addToDbAndSendNotification(initiator, notification)
  }
  static async sendMeetingInvitationAccepedNotificationByNonSkeding(initiator, participant, meeting) {
    debugLog1('In function NotificationHelper.sendMeetingInvitationAccepedNotification')

    let notification = {
      skeding_user_id: initiator._id,
      type: MEETING_INVITATION_ACCEPTED,
      title: `${participant} accepted: ${meeting.title}`,
      description: `${participant} accepted your invitation for meeting '${meeting.title}'`,
      meeting_id: meeting._id,
    }

    return await NotificationHelper.addToDbAndSendNotification(initiator, notification)
  }

  static async sendMeetingInvitationAccepedByAllNotification(user, meeting) {
    debugLog1('In function NotificationHelper.sendMeetingInvitationAccepedByAllNotification')

    let notification = {
      skeding_user_id: user._id,
      type: MEETING_INVITATION_ACCEPTED_BY_ALL,
      title: 'All participants accepted: ' + meeting.title,
      description: "All participants accepted invitation for meeting '" + meeting.title + "'.",
      meeting_id: meeting._id,
    }

    return await NotificationHelper.addToDbAndSendNotification(user, notification)
  }

  static async sendMeetingInvitationReceivedNotification(initiator, participant, meeting) {
    debugLog1('In function NotificationHelper.sendMeetingInvitationReceivedNotification')

    let notification = {
      skeding_user_id: participant._id,
      type: MEETING_INVITATION_RECEIVED,
      title: 'Meeting Invitation: ' + meeting.title,
      description: "You have been invited to meeting '" + meeting.title + "' by " + initiator.first_name + ' ' + initiator.last_name,
      meeting_id: meeting._id,
    }

    return await NotificationHelper.addToDbAndSendNotification(participant, notification)
  }
  static async sendMeetingInvitationReceivedInitiatorNotification(initiator, participant, meeting) {
    debugLog1('In function NotificationHelper.sendMeetingInvitationReceivedNotification')

    let notification = {
      skeding_user_id: initiator._id,
      type: MEETING_INVITATION_RECEIVED,
      title: 'Meeting Invitation: ' + meeting.title,
      description: "You have been invited to meeting '" + meeting.title + "' by " + participant.participant_name,
      meeting_id: meeting._id,
    }

    return await NotificationHelper.addToDbAndSendNotification(initiator, notification)
  }

  static async sendMeetingNewTimeslotsSuggestedNotification(user, meeting) {
    debugLog1('In function NotificationHelper.sendMeetingNewTimeslotsSuggestedNotification')

    let notification = {
      skeding_user_id: user._id,
      type: MEETING_NEW_TIMESLOTS_SUGGESTED,
      title: 'New timeslots suggested: ' + meeting.title,
      description: "New timeslots suggested by user for your meeting '" + meeting.title + "'.",
      meeting_id: meeting._id,
    }

    return await NotificationHelper.addToDbAndSendNotification(user, notification)
  }

  static async sendMeetingNoTimeslotsAvailableNotification(initiator, participant, meeting) {
    debugLog1('In function NotificationHelper.sendMeetingNoTimeslotsAvailableNotification')

    let notification = {
      skeding_user_id: initiator._id,
      type: MEETING_NO_TIMESLOTS_AVAILABLE,
      title: `${participant.first_name} ${participant.last_name} has no timeslot available: ${meeting.title}`,
      description: `${participant.first_name} ${participant.last_name} has no timeslot available for your invitation of meeting '${meeting.title}'`,
      meeting_id: meeting._id,
    }

    return await NotificationHelper.addToDbAndSendNotification(initiator, notification)
  }

  static async sendMeetingReminderNotification(user, meeting) {
    debugLog1('In function NotificationHelper.sendMeetingNoTimeslotsAvailableNotification')

    if (meeting.start_datetime == undefined) return

    let notification = {
      skeding_user_id: user._id,
      type: MEETING_REMINDER,
      title: 'Reminder: ' + meeting.title,
      description: "Your meeting '" + meeting.title + "' starts in " + MEETING_REMINDER_MINUTES + ' minutes.',
      meeting_id: meeting._id,
    }

    let newNotification = await NotificationHelper.addToDbAndSendNotification(initiator, notification)

    if (newNotification) {
      //schedule the notification

      let reminderTime = addMinutesToMilliseconds(0, MEETING_REMINDER_MINUTES)

      reminderTime = meeting.start_datetime - reminderTime

      const reminderDatetime = new Date(reminderTime)

      let jobName = `${user._id}+${meeting._id}`

      const job = schedule.scheduleJob(jobName, reminderDatetime, function () {
        console.log('Notification scheduled.')
      })

      return newNotification
    } else {
      console.log('Notification could not be created.')
      return false
    }
  }

  static async cancelMeetingReminderNotification(user, meeting) {
    debugLog1('In function NotificationHelper.sendMeetingNoTimeslotsAvailableNotification')

    let conditions = {
      skeding_user_id: user._id,
      type: MEETING_REMINDER,
      title: 'Reminder: ' + meeting.title,
      description: "Your meeting '" + meeting.title + "' starts in " + MEETING_REMINDER_MINUTES + ' minutes.',
      meeting_id: meeting._id,
    }

    let removedNotification = await NotificationService.removeNotification(conditions)

    if (removedNotification) {
      //removed from scheduler now as well

      let jobName = `${user._id}+${meeting._id}`
      let job = schedule.scheduledJobs[jobName]
      job.cancel()
    }
  }

  static async sendMeetingResponseReminderNotification(participant, meeting) {
    debugLog1('In function NotificationHelper.sendMeetingNoTimeslotsAvailableNotification')

    let notification = {
      skeding_user_id: participant._id,
      type: MEETING_RESPONSE_REMINDER,
      title: `Pending meeting response for meeting: ${meeting.title}`,
      description: `You have not yet responded for your invitation of meeting '${meeting.title}'`,
      meeting_id: meeting._id,
    }

    return await NotificationHelper.addToDbAndSendNotification(participant, notification)
  }
}

module.exports = NotificationHelper
