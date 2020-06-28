// This sample demonstrates handling intents from an Alexa skill using the Alexa Skills Kit SDK (v2).
// Please visit https://alexa.design/cookbook for additional examples on implementing slots, dialog management,
// session persistence, api calls, and more.
const Alexa = require('ask-sdk-core');
const persistenceAdapter = require('ask-sdk-s3-persistence-adapter');
const { containsUserBirthDay, getBirthdayUserS3 } = require('./helpers/birthday')

const LaunchRequestHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
  },
  handle(handlerInput) {
    const speakOutput = 'Olá! Bem-vindo a Cake Time. Quando você nasceu?';
    const reprompt = 'Nasci em seis de novembro de dois mil e quatorze. Quando você nasceu?'
    return handlerInput.responseBuilder
      .speak(speakOutput)
      .reprompt(reprompt)
      .getResponse();
  }
};

const HasBirthdayLaunchRequestHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'LaunchRequest'
      && containsUserBirthDay(handlerInput);
  },
  handle(handlerInput) {

    const { day, month, year } = getBirthdayUserS3(handlerInput);

    // TODO:: Use the settings API to get current date and then compute how many days until user's birthday
    // TODO:: Say Happy birthday on the user's birthday

    const speakOutput = `Bem vindo de volta, a data de seu aniversário é ${day} de  ${month} de ${year}`;
    return handlerInput.responseBuilder
      .speak(speakOutput)
      .getResponse();
  }
};
const CaptureBirthdayIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'CaptureBirthdayIntent';
  },
  async handle(handlerInput) {
    const year = handlerInput.requestEnvelope.request.intent.slots.year.value;
    const month = handlerInput.requestEnvelope.request.intent.slots.month.value;
    const day = handlerInput.requestEnvelope.request.intent.slots.day.value;

    const attributesManager = handlerInput.attributesManager;

    const birthdayAttributes = {
      "year": year,
      "month": month,
      "day": day

    };
    attributesManager.setPersistentAttributes(birthdayAttributes);
    await attributesManager.savePersistentAttributes();

    const speakOutput = `Obrigado, lembrarei que seu aniversário é no dia ${day} de ${month}, e que você nasceu no ano de ${year}`;
    return handlerInput.responseBuilder
      .speak(speakOutput)
      //.reprompt('add a reprompt if you want to keep the session open for the user to respond')
      .getResponse();
  }
};

const HelpIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.HelpIntent';
  },
  handle(handlerInput) {
    const speechText = 'You can say hello to me! How can I help?';

    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(speechText)
      .getResponse();
  }
};
const CancelAndStopIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && (handlerInput.requestEnvelope.request.intent.name === 'AMAZON.CancelIntent'
        || handlerInput.requestEnvelope.request.intent.name === 'AMAZON.StopIntent');
  },
  handle(handlerInput) {
    const speechText = 'Goodbye!';
    return handlerInput.responseBuilder
      .speak(speechText)
      .getResponse();
  }
};
const SessionEndedRequestHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'SessionEndedRequest';
  },
  handle(handlerInput) {
    // Any cleanup logic goes here.
    return handlerInput.responseBuilder.getResponse();
  }
};

// The intent reflector is used for interaction model testing and debugging.
// It will simply repeat the intent the user said. You can create custom handlers
// for your intents by defining them above, then also adding them to the request
// handler chain below.
const IntentReflectorHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest';
  },
  handle(handlerInput) {
    const intentName = handlerInput.requestEnvelope.request.intent.name;
    const speechText = `You just triggered ${intentName}`;

    return handlerInput.responseBuilder
      .speak(speechText)
      //.reprompt('add a reprompt if you want to keep the session open for the user to respond')
      .getResponse();
  }
};

// Generic error handling to capture any syntax or routing errors. If you receive an error
// stating the request handler chain is not found, you have not implemented a handler for
// the intent being invoked or included it in the skill builder below.
const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.log(`~~~~ Error handled: ${error.message}`);
    const speakOutput = `Desculpe, tive problemas para fazer o que você pediu. Por favor, tente novamente.`;

    return handlerInput.responseBuilder
      .speak(speakOutput)
      .reprompt(speakOutput)
      .getResponse();
  }
};

const LoadBirthdayInterceptor = {
  async process(handlerInput) {
    const attributesManager = handlerInput.attributesManager;
    const sessionAttributes = await attributesManager.getPersistentAttributes() || {};

    const year = sessionAttributes.hasOwnProperty('year') ? sessionAttributes.year : 0;
    const month = sessionAttributes.hasOwnProperty('month') ? sessionAttributes.month : 0;
    const day = sessionAttributes.hasOwnProperty('day') ? sessionAttributes.day : 0;

    if (year && month && day) {
      attributesManager.setSessionAttributes(sessionAttributes);
    }
  }
}

// This handler acts as the entry point for your skill, routing all request and response
// payloads to the handlers above. Make sure any new handlers or interceptors you've
// defined are included below. The order matters - they're processed top to bottom.
exports.handler = Alexa.SkillBuilders.custom()
  .withPersistenceAdapter(
    new persistenceAdapter.S3PersistenceAdapter({ bucketName: process.env.S3_PERSISTENCE_BUCKET })
  )
  .addRequestHandlers(
    HasBirthdayLaunchRequestHandler,
    LaunchRequestHandler,
    CaptureBirthdayIntentHandler,
    HelpIntentHandler,
    CancelAndStopIntentHandler,
    SessionEndedRequestHandler,
    IntentReflectorHandler) // make sure IntentReflectorHandler is last so it doesn't override your custom intent handlers
  .addRequestInterceptors(
    LoadBirthdayInterceptor
  )
  .addErrorHandlers(
    ErrorHandler)
  .lambda();
