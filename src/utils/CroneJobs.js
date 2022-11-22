const cron = require('node-cron');
const GoogleController = require('../controllers/google.controller');
const OutlookController = require('../controllers/outlook.controller');
const { UserModel } = require('../models');
const { outlookService } = require('../services');
const { debugLog1, debugLog2, debugLog3 } = require('./commonFunctions');


const cron1 = (s) => {
	cron.schedule('1 0 * * *', syncAllUserCalendars, {
		scheduled: true,
		timezone: "America/New_York"
	});

}

const syncAllUserCalendars = async () => {
	// cron.schedule('* * * * * *', async () => {
	debugLog1('Running syncing cron job');

	let count = await UserModel.count({});
	let synced = 0;

	debugLog2("count ===> ", count);

	while (synced < count) {
		const users = await UserModel.find({ is_active: true }).sort({ createdAt: -1 }).limit(5).skip(synced).select({
			email: 1,
			isEmailVerified: 1,
			is_google_synced: 1,
			is_microsoft_synced: 1,
			is_teams_synced: 1,
			is_zoom_synced: 1,
			is_apple_synced: 1,
			calendar_sync_time: 1,
			google_data: 1,
			outlook_data: 1,
			teams_data: 1,
			apple_data: 1,
			zoom_data: 1,
			last_synced: 1,
		});

		debugLog3("users ===> ", users)

		for (let i = 0; i < users.length; i++) {
			const user = users[i];
			debugLog2("\n\nSyncing user ===> ", user.email);

			try {
				if (user.is_google_synced) {
					await GoogleController.syncAllUserGoogleCalendarEvents(user.google_data.refreshToken, user.id, user)
					//fetching all contacts
					GoogleController.getAllUserGoogleContacts(reqParams.refreshToken, user.id);
				} else if (user.is_microsoft_synced) {
					// @usama fill this
					user = await outlookService.refreshOutlookToken(user)
					await OutlookController.syncAllUserOutlookCalendarEvents(user.outlook_data, user.id)
				}
			}
			catch (err) {
				debugLog2("Error in syncing for user ===> ", user.email);
			}
			synced++;
			if (synced == count)
			debugLog2("synced ===> ", synced);

		}
	}

	debugLog1("Syncing complete!")

}

module.exports = {
	cron1,
	syncAllUserCalendars
}