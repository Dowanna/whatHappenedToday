module.exports = function parseUserDate(rawUserDates) {
  let month = rawUserDates[1];
  let day = rawUserDates[2];

  console.log(`month: ${month}`);
  console.log(`day: ${day}`);

  let validNumber = /^(\d+)$/;
  let monthInt = month.match(validNumber);
  let dayInt = day.match(validNumber);

  let error = new Error("invalid date format");

  if (monthInt == null || monthInt.input > 12 || monthInt.input < 1) {
    throw error;
  }

  if (monthInt == null || dayInt.input > 31 || dayInt.input < 1) {
    throw error;
  }

  return "".concat(String(monthInt.input), "月", String(dayInt.input), "日");
};
