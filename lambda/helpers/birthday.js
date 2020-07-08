function containsUserBirthDay(handlerInput) {
  const { day, month, year } = getBirthdayUserS3(handlerInput)

  return !!day && !!month && !!year;
}

function getBirthdayUserS3(handlerInput) {

  const attributesManager = handlerInput.attributesManager;
  const sessionAttributes = attributesManager.getSessionAttributes() || {};

  const year = sessionAttributes.hasOwnProperty('year') ? sessionAttributes.year : 0;
  const month = sessionAttributes.hasOwnProperty('month') ? sessionAttributes.month : 0;
  const day = sessionAttributes.hasOwnProperty('day') ? sessionAttributes.day : 0;

  return { year, month, day }
}

module.exports = { containsUserBirthDay, getBirthdayUserS3 }
