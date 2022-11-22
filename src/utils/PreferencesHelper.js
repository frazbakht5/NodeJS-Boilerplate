const { debugLog2 } = require("./commonFunctions")


class PreferencesHelper {

	static async applyOffsetToPreferenceTimeslot(timeslot, clientOffset) {
		debugLog2('In function PreferencesHelper.applyOffsetToPreferenceTimeslot')

		// debugLog2("clientOffset ===> ", clientOffset);
		debugLog2('timeslot ===> ', timeslot)

		let hours = parseInt(clientOffset / 60)
		let min = clientOffset - (60 * hours)

		// debugLog2("hours ===> ", hours);
		// debugLog2("min ===> ", min);

		let start_day = timeslot.start_day
		let start_hours = timeslot.start_hours + hours
		let start_minutes = timeslot.start_minutes + min
		let end_day = timeslot.end_day
		let end_hours = timeslot.end_hours + hours
		let end_minutes = timeslot.end_minutes + min

		if (start_minutes > 59) {
			start_hours++
			start_minutes -= 60
		}
		if (start_minutes < 0) {
			start_hours--
			start_minutes = 60 + start_minutes
		}

		if (end_minutes > 59) {
			end_hours++
			end_minutes -= 60
		}
		if (end_minutes < 0) {
			end_hours--
			end_minutes = 60 + end_minutes
		}
		/**************************************************** */
		if (start_hours > 23) {
			start_day++
			start_hours = start_hours - 24
		}
		if (start_hours < 0) {
			start_day--
			start_hours = 24 + start_hours
		}

		if (end_hours > 23) {
			end_day++
			end_hours = end_hours - 24
		}
		if (end_hours < 0) {
			end_day--
			end_hours = 24 + end_hours
		}
		/**************************************************** */
		if (start_day > 6) {
			start_day = 7 - start_day;
		}
		if (end_day > 6) {
			end_day = 7 - end_day;
		}

		if (start_day < 0) {
			start_day = 7 + start_day;
		}
		if (end_day < 0) {
			end_day = 7 + end_day;
		}
		/**************************************************** */

		let toReturn = {
			start_day,
			start_hours,
			start_minutes,
			end_day,
			end_hours,
			end_minutes,
		}

		debugLog2('toReturn ===> ', toReturn)
		debugLog2("\n")
		return toReturn
	}

}

module.exports = PreferencesHelper
