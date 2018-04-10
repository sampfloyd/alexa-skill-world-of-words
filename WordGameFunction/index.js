/* eslint-disable  func-names */
/* eslint quote-props: ["error", "consistent"]*/
/**
 * This lambda is for the Word Game skill: https://developer.amazon.com/alexa/console/ask/build/custom/amzn1.ask.skill.7b88990d-3ea3-47ea-95cc-783e885be1dd/development/en_US/endpoint
 * The Intent Schema, Custom Slot and Sample Utterances for this skill, as well
 * as testing instructions are located at https://github.com/alexa/skill-sample-nodejs-howto
 **/

'use strict';

const Alexa = require('alexa-sdk');

const APP_ID = 'amzn1.ask.skill.7b88990d-3ea3-47ea-95cc-783e885be1dd';

const languageStrings = {
    'en': {
        translation: {
            SKILL_NAME: 'Word Game',
            WELCOME_MESSAGE: "Welcome to the world of words. Let's begin. ",
            WELCOME_REPROMT: "Are you ready to play a word game? ",
            DISPLAY_CARD_TITLE: "",
            HELP_MESSAGE: "To play a game, just say open world of words. Say STOP to quit. ",
            HELP_REPROMT: "To play a game, just say open world of words. Say STOP to quit. ",
            STOP_MESSAGE: 'Goodbye!',
        },
    },
    'en-US': {
        translation: {
            SKILL_NAME: 'American Word Game',
        },
    },
    'en-GB': {
        translation: {
            SKILL_NAME: 'British Word Game',
        },
    },
    'de': {
        translation: {
            SKILL_NAME: 'Deutsch Word Game',
        },
    },
};

const quizBank = [
    {"question": "Let's play a memory game. Try to remember these words. Apple, Cat, Hat, Boy. What was the second word I said?", "answer": ["cat"], "type": "memory"},
    {"question": "Let's play a word shuffle game. What other word can you make from the word Beta?", "answer": ["beat"], "type": "shuffle"},
    {"question": "Let's play a palindrom game. Which of these words are not a palindrome? pop, civic, madam, lemon, kayak, level.", "answer": ["lemon"], "type": "palindrome"},
    {"question": "Let's play a word shuffle game. What other word can you make from the word Left?", "answer": ["felt"], "type": "shuffle"},
    {"question": "Let's play a word scramble game. What word can you make from the word t c a?", "answer": ["cat"], "type": "scramble"}
  ];

var responsePrompt = '';

const handlers = {
    'LaunchRequest': function () {
        responsePrompt = this.t('WELCOME_MESSAGE');
        this.emit('PlayWordGameIntent');
    },
    'PlayWordGameIntent': function () {
        // retrieve questionQueue from session
        var questionQueue = this.event.session.attributes['questionQueue'];

        // retrieve gameTypeSlot
        var gameType = undefined;
        if (this.event.request.intent && this.event.request.intent.slots && this.event.request.intent.slots.GameType) {
            switch(this.event.request.intent.slots.GameType.value) {
                case 'shuffle':
                    gameType = 'shuffle';
                    break;
                case 'scramble':
                    gameType = 'scramble';
                    break;
                case 'memory':
                    gameType = 'memory';
                    break;
                case 'palindrome':
                    gameType = 'palindrome';
                    break;
                default:
                    gameType = undefined;
            }
        }

        // generate a question queue for the current user.
        // if the questionQueue is undefined or empty, generate a new queue
        if (questionQueue === undefined || questionQueue.length == 0) {
            questionQueue = [];
            for (var i=0; i<quizBank.length; i++) {
                // if the user specified a game type, generate a queue of of that type
                if (gameType) {
                    if (quizBank[i].type === gameType) {
                        questionQueue.push(i);
                    }
                } else {
                    questionQueue.push(i);
                }
            }
            this.event.session.attributes['questionQueueLength'] = questionQueue.length;
        }

        //generate a random questionNumber from the questionQueue
        var randomQuestionNumber = Math.floor(Math.random() * questionQueue.length);
        
        // splice the questionQueue to pick the question number
        var activeQuestionNumber = questionQueue.splice(randomQuestionNumber, 1)[0];
        
        // store the in session
        this.event.session.attributes['activeQuestionNumber'] = activeQuestionNumber;
        
        // store the questionQueue in session
        this.event.session.attributes['questionQueue'] = questionQueue;
        
        // append the question to prompt
        responsePrompt += quizBank[activeQuestionNumber].question;
        
        // emit the reponse to user
        this.emit(':ask', responsePrompt);
        this.emit(':responseReady');
    },
    'AMAZON.YesIntent': function() {
        this.emit('WhatWasTheWordIntent');
    },
    'WhatWasTheWordIntent': function() {
        var activeQuestionNumber = this.event.session.attributes['activeQuestionNumber'];
        if (activeQuestionNumber !== undefined) {
            const userAnswer = this.event.request.intent.slots.GuessWord.value;
            if (quizBank[activeQuestionNumber].answer.includes(userAnswer)) {
                var score = this.event.session.attributes['score'];
                if (score) {
                    score ++;
                } else {
                    score = 1;
                }
                this.event.session.attributes['score'] = score;
                responsePrompt = "<say-as interpret-as='interjection'>Well done!</say-as> Your answer is correct. <break strength='strong'/>";
            } else {
                responsePrompt =  "<say-as interpret-as='interjection'>Sorry, that's not right.</say-as><break strength='strong'/> The right answer is " + 
                    quizBank[activeQuestionNumber].answer.toString() + ". <break strength='strong'/> "
            }
            this.event.session.attributes['activeQuestionNumber'] = undefined;
        } else {
            this.emit(':tell', "Please try again.");
        }
        // if the user has played all questions, tell the score and end the game
        if (this.event.session.attributes['questionQueue'] && this.event.session.attributes['questionQueue'].length == 0) {
            var questionQueueLength = this.event.session.attributes['questionQueueLength'];
            var score = this.event.session.attributes['score'];
            var endString = " Great! You scored " + score + " out of " + questionQueueLength + ". Ask Alexa to open world of words to play again. ";
            endString = responsePrompt + endString;
            responsePrompt = '';
            this.emit(':tell', endString);
        } else {
            this.emit('PlayWordGameIntent');
        }
    },
    'AMAZON.NoIntent': function() {
        this.emit(':tell', "Okay.");
    },
    'AMAZON.HelpIntent': function () {
        this.attributes.speechOutput = this.t('HELP_MESSAGE');
        this.attributes.repromptSpeech = this.t('HELP_REPROMT');
        this.emit(':ask', this.attributes.speechOutput, this.attributes.repromptSpeech);
    },
    'AMAZON.RepeatIntent': function () {
        this.emit(':ask', this.attributes.speechOutput, this.attributes.repromptSpeech);
    },
    'AMAZON.StopIntent': function () {
        this.emit('SessionEndedRequest');
    },
    'AMAZON.CancelIntent': function () {
        this.emit('SessionEndedRequest');
    },
    'SessionEndedRequest': function () {
        this.emit(':tell', this.t('STOP_MESSAGE'));
    },
    'Unhandled': function () {
        this.attributes.speechOutput = this.t('HELP_MESSAGE');
        this.attributes.repromptSpeech = this.t('HELP_REPROMPT');
        this.emit(':ask', this.attributes.speechOutput, this.attributes.repromptSpeech);
    },
};

exports.handler = function (event, context) {
    const alexa = Alexa.handler(event, context);
    alexa.APP_ID = APP_ID;
    // To enable string internationalization (i18n) features, set a resources object.
    alexa.resources = languageStrings;
    alexa.registerHandlers(handlers);
    alexa.execute();
};
