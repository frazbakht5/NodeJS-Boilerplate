const logger = require('../config/logger')
const { DEBUGGER2, DEBUGGER3, DEBUGGER1 } = require('./Constants')

const getToken = (req) => {
  return req.headers.token
}

const addDaysToMilliseconds = (milliseconds, days) => {
  return milliseconds + days * 24 * 60 * 60 * 1000
}

const addHoursToMilliseconds = (milliseconds, hours) => {
  return milliseconds + hours * 60 * 60 * 1000
}

const addMinutesToMilliseconds = (milliseconds, minutes) => {
  return milliseconds + minutes * 60 * 1000
}

const addSecondsToMilliseconds = (seconds, minutes) => {
  return milliseconds + seconds * 1000
}

const convertMillisecondsToMinutes = (milliseconds) => {
  return milliseconds / 60000
}

const convertDateToUTCMilliseconds = (date) => {
  return date.getTime()
  /*
  logger.info("Converting to utc ===> ", date.toString());

  let utcDate = 0;	// date of the UTC zone
  const offset = date.getTimezoneOffset();

  if (offset < 0) {
    utcDate = new Date(date.getTime() + offset * 60000);
  }
  else {
    utcDate = new Date(date.getTime() - offset * 60000);
  }
  logger.info("utc ===> ", utcDate.toString());
  // return "" + utcDate.getTime();

  logger.info("original millis ===> ", date.getTime());
  logger.info("returning millis ===> ", utcDate.getTime());
  return utcDate.getTime();
  */
}

const convertUTCMillisecondsToDate = (milliseconds) => {
  let actualDate = new Date(milliseconds)
  return actualDate
  /*
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
  */
}

const removeOffsetFromMilliseconds = (milliseconds, offset) => {
  let utcDate = new Date(milliseconds)
  let actualDate = 0
  //   logger.info('utc', utcDate)
  //   logger.info('offet', offset)
  if (offset > 0) {
    actualDate = new Date(utcDate.getTime() - offset * 60000)
  } else {
    actualDate = new Date(utcDate.getTime() + offset * 60000)
  }
  //   logger.info('actual date', actualDate)
  return actualDate
}

const addOffsetToMilliseconds = (milliseconds, offset) => {
  let result = 0
  //   logger.info('utc', utcDate)
  //   logger.info('offet', offset)
  if (offset > 0) {
    result = milliseconds + offset * 60000
  } else {
    result = milliseconds - offset * 60000
  }
  //   logger.info('result', result)
  return result
}

// Function to Sort the Data by given Property
const sortByProperty = (property) => {
  return function (a, b) {
    let sortStatus = 0,
      aProp = a[property],
      bProp = b[property]
    if (aProp < bProp) {
      sortStatus = -1
    } else if (aProp > bProp) {
      sortStatus = 1
    }
    return sortStatus
  }
}

const debugLog2 = (s, data) => {
  if (DEBUGGER2) {
    if (data != undefined) {
      logger.info(s + '', data)
    } else {
      logger.info(s)
    }
  }
}

const debugLog3 = (s, data) => {
  if (DEBUGGER3) {
    if (data != undefined) {
      logger.info(s + '', data)
    } else {
      logger.info(s)
    }
  }
}

const debugLog1 = (s, data) => {
  if (DEBUGGER1) {
    if (data != undefined) {
      logger.info(s + '', data)
    } else {
      logger.info(s)
    }
  }
}

const debugLogError1 = (s, data) => {
  if (DEBUGGER3) {
    if (data != undefined) {
      logger.error(s + '', data)
    } else {
      logger.error(s)
    }
  }
}

const convertDateToUTC = (date) => {
  return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds())
}

module.exports = {
  getToken,
  addDaysToMilliseconds,
  addHoursToMilliseconds,
  addMinutesToMilliseconds,
  addSecondsToMilliseconds,
  convertMillisecondsToMinutes,
  convertDateToUTCMilliseconds,
  convertUTCMillisecondsToDate,
  sortByProperty,
  removeOffsetFromMilliseconds,
  addOffsetToMilliseconds,
  debugLog1,
  debugLog2,
  debugLog3,
  debugLogError1,
  convertDateToUTC,
}
