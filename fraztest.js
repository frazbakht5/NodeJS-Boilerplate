// const date = new Date();	// date of the local time zone

const convertDateToUTCMilliseconds = (date) => {
	// console.log(date.toString());

	let utcDate = 0;	// date of the UTC zone
	const offset = date.getTimezoneOffset();

	if (offset < 0) {
		utcDate = new Date(date.getTime() + offset * 60000);
	}
	else {
		utcDate = new Date(date.getTime() - offset * 60000);
	}
	// console.log(utcDate.toString());
	// return "" + utcDate.getTime();
	return utcDate.getTime();
}

const milliseconds = 1648448370966;

const convertUTCMillisecondsToDate = (milliseconds) => {
	let utcDate = new Date(milliseconds);
	let actualDate = 0;

	const offset = utcDate.getTimezoneOffset();

	if (offset < 0) {
		actualDate = new Date(utcDate.getTime() - offset * 60000);
	}
	else {
		actualDate = new Date(utcDate.getTime() + offset * 60000);
	}

	return actualDate;
}


const convertGoogleEventTimeToDate = (data) => {
	let startDatetime = null;
	let endDatetime = null;

	/*
"dates": {
				"start_date": "Sep 2",
				"when": "Fri, 7:30 – 11:30 PM"
			}
	*/
	let tokens = data.when.split(",");

	if (tokens.length === 5) {

		let startAndEnd = data.when.split("–");
		let startData = startAndEnd[0];
		let endData = startAndEnd[1];

		let startTokens = startData.split(",");
		let endTokens = endData.split(",");


		let startDate = startTokens[1];
		if (true) {
			startDate.replace("Jan", "January");
			startDate.replace("Feb", "February");
			startDate.replace("Mar", "March");
			startDate.replace("Apr", "April");
			startDate.replace("May", "May");
			startDate.replace("Jun", "June");
			startDate.replace("Jul", "July");
			startDate.replace("Aug", "August");
			startDate.replace("Sep", "September");
			startDate.replace("Oct", "October");
			startDate.replace("Nov", "November");
			startDate.replace("Dec", "December");
		}

		let startTime = startTokens[2].trim().split(" ");
		let startHours = startTime[0];
		let startMinutes = 0;
		if (startHours.includes(":")) {
			startMinutes = parseInt(startHours.split(":")[1]);
			startHours = parseInt(startHours.split(":")[0]);
		}
		else {
			startHours = parseInt(startHours);
		}

		if (startTime[1] == "PM")
			startHours += 12;

		startDatetime = new Date(`${startDate}, 2022 ${startHours}:${startMinutes}:00`);

		/********************************************************************* */

		let endDate = endTokens[1];
		if (true) {
			endDate.replace("Jan", "January");
			endDate.replace("Feb", "February");
			endDate.replace("Mar", "March");
			endDate.replace("Apr", "April");
			endDate.replace("May", "May");
			endDate.replace("Jun", "June");
			endDate.replace("Jul", "July");
			endDate.replace("Aug", "August");
			endDate.replace("Sep", "September");
			endDate.replace("Oct", "October");
			endDate.replace("Nov", "November");
			endDate.replace("Dec", "December");
		}

		let endTime = endTokens[2].trim().split(" ");
		let endHours = endTime[0];
		let endMinutes = 0;
		if (endHours.includes(":")) {
			endMinutes = parseInt(endHours.split(":")[1]);
			endHours = parseInt(endHours.split(":")[0]);
		}
		else {
			endHours = parseInt(endHours);
		}

		if (endTime[1] == "PM")
			endHours += 12;

		endDatetime = new Date(`${endDate}, 2022 ${endHours}:${endMinutes}:00`);
	}

	else if (tokens.length === 2) {
		let startDate = data.start_date;
		if (true) {
			startDate.replace("Jan", "January");
			startDate.replace("Feb", "February");
			startDate.replace("Mar", "March");
			startDate.replace("Apr", "April");
			startDate.replace("May", "May");
			startDate.replace("Jun", "June");
			startDate.replace("Jul", "July");
			startDate.replace("Aug", "August");
			startDate.replace("Sep", "September");
			startDate.replace("Oct", "October");
			startDate.replace("Nov", "November");
			startDate.replace("Dec", "December");
		}

		let startTime = data.when.split(",")[1].split(" – ")[0]
		let endTime = data.when.split(",")[1].split(" – ")[1]

		let startHours = startTime;
		let startMinutes = 0;
		if (startHours.includes(":")) {
			startMinutes = parseInt(startHours.split(":")[1]);
			startHours = parseInt(startHours.split(":")[0]);
		}
		else {
			startHours = parseInt(startHours);
		}

		if (data.when.includes("PM"))
			startHours += 12;

		startDatetime = new Date(`${startDate}, 2022 ${startHours}:${startMinutes}:00`);

		let endHours = endTime;
		let endMinutes = 0;
		if (endHours.includes(":")) {
			endMinutes = parseInt(endHours.split(":")[1]);
			endHours = parseInt(endHours.split(":")[0]);
		}
		else {
			endHours = parseInt(endHours);
		}

		if (data.when.includes("PM"))
			endHours += 12;

		endDatetime = new Date(`${startDate}, 2022 ${endHours}:${endMinutes}:00`);

		return {
			startDatetime: startDatetime.toString(),
			endDatetime: endDatetime.toString()
		}
	}
	else {
		return data;
	}

}

let data =
{
	"start_date": "Sep 2",
	"when": "Fri, 7:30 – 11:30 PM"
}
console.log(convertGoogleEventTimeToDate(data));