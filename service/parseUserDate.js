module.exports = function parseUserDate(rawUserDates) {
  const month = rawUserDates[1];
  const day = rawUserDates[2];

  console.log(`month: ${month}`);
  console.log(`day: ${day}`);

  const validNumber = /^(\d+)$/;
  const monthInt = month.match(validNumber);
  const dayInt = day.match(validNumber);

  const error = new Error("invalid date format");

  if (monthInt == null || monthInt.input > 12 || monthInt.input < 1) {
    throw error;
  }

  if (monthInt == null || dayInt.input > 31 || dayInt.input < 1) {
    throw error;
  }

  return "".concat(String(monthInt.input), "月", String(dayInt.input), "日");
};
