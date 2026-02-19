const dateTimeFormatter = new Intl.DateTimeFormat(undefined, {
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
//   fractionalSecondDigits: 3,
});
////
export const formatToLocaleDateTime = (dateTime: string) => {
  const date = new Date(dateTime);

  if (isNaN(date.getTime())) {
    return "Invalid date";
  }

  return dateTimeFormatter.format(date);
};
