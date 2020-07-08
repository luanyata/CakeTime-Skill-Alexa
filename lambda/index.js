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
    const speakOutput = 'Olá! Bem-vindo a Cake Time. Quando é seu aniversário?';
    const reprompt = 'Nasci em seis de novembro de dois mil e quatorze. Quando você nasceu?'
    return handlerInput.responseBuilder
      .speak(speakOutput)
      .reprompt(reprompt)
      .getResponse();
  }
};

const HasBirthdayLaunchRequestHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest'
      && containsUserBirthDay(handlerInput);

  },
  async handle(handlerInput) {
    const serviceClientFactory = handlerInput.serviceClientFactory;
    const deviceId = Alexa.getDeviceId(handlerInput.requestEnvelope);

    const { day, month, year } = getBirthdayUserS3(handlerInput);

    let userTimeZone;

    try {
      const upsServiceClient = serviceClientFactory.getUpsServiceClient();
      userTimeZone = await upsServiceClient.getSystemTimeZone(deviceId);
    } catch (error) {

      if (error !== 'ServiceError') {
        return handlerInput
          .responseBuilder
          .speak('Estou com o problema de comunicação com o servidor')
          .getResponse();
      }
      console.log('error', error.mesage);
    }

    const currentDateTime = new Date(new Date().toLocaleString("pt-BR", { timeZone: userTimeZone }))

    const currentDate = new Date(
      currentDateTime.getFullYear(),
      currentDateTime.getMonth(),
      currentDateTime.getDate()
    );
    const currentYear = currentDate.getFullYear();

    let nextBirthday = Date.parse(`${month} ${day}, ${currentYear}`);

    if (currentDate.getTime() > nextBirthday) {
      nextBirthday = Date.parse(`${month} ${day}, ${currentYear + 1}`);
    }

    const oneDay = 1000 * 3600 * 24;

    let speakOutput = `Feliz aniversário, parabêns pelos seus ${currentYear - year} anos!`;

    if (currentDate.getTime() !== nextBirthday) {
      const diffDays = Math.round(Math.abs((currentDate.getTime() - nextBirthday) / oneDay));
      speakOutput = `Bem vindo de volta. Faltam ${diffDays} dias para o seu aniversário de ${(currentYear - year) + 1} anos.`
    }

    return handlerInput.responseBuilder
      .speak(speakOutput)
      .getResponse();
  }
};
const CaptureBirthdayIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'CaptureBirthdayIntent';
  },
  async handle(handlerInput) {
    const year = Alexa.getSlotValue(handlerInput.requestEnvelope, 'year');
    const month = Alexa.getSlotValue(handlerInput.requestEnvelope, 'month');
    const day = Alexa.getSlotValue(handlerInput.requestEnvelope, 'day');

    const attributesManager = handlerInput.attributesManager;

    const birthdayAttributes = {
      year,
      month,
      day
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
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.HelpIntent';
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
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.CancelIntent'
        || Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.StopIntent');
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
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'SessionEndedRequest';
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
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest';
  },
  handle(handlerInput) {
    const intentName = Alexa.getIntentName(handlerInput.requestEnvelope);
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
  .withApiClient(new Alexa.DefaultApiClient())
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
