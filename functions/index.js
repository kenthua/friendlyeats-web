/**
 * Copyright 2016 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
'use strict';

const functions = require('firebase-functions');

// The Firebase Admin SDK to access the Firebase Realtime Database. 
const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);
const fbDbTest1RefUpdate = admin.database().ref('/updates/http');
const fbDbTest2RefUpdate = admin.database().ref('/updates/db');
const fbDbTestRefUpdate = admin.database().ref('/updates');

const fbFSTestRefUpdate = admin.firestore();

exports.onDBEntryUpdate = functions.database
  .ref('/test/{testId}').onUpdate(event => {
    const message = event.data.val();

    const promiseDelay1 = message.promiseDelay1;
    const promiseDelay2 = message.promiseDelay2; 
    const sleepDuration = message.sleepDuration;
    const text = message.text;
    console.log('START');
    console.log('Text: ', text);
    console.log('Sleep Duration: ', sleepDuration);
    console.log('Promise Delay 1', promiseDelay1);
    console.log('Promise Delay 2', promiseDelay2);
    
    //really sleep
    console.log('Sleep Start');
    sleep(sleepDuration);
    console.log('Sleep End');

    // testing promise
    console.log('Delay 1', promiseDelay1);
    var delay1 = delay(promiseDelay1).then(() => {
      console.log('In Delay 1 function call: ', promiseDelay1);
      fbDbTest2RefUpdate.update({
        inDBCall1: true
      });
    });
    console.log('Delay 2', promiseDelay2);  
    var delay2 = delay(promiseDelay2).then(() => {
      console.log('In Delay 2 function call: ', promiseDelay2);
      fbDbTest2RefUpdate.update({
        inDBCall2: true
      });
    });  
// if return is inside the promise i.e. reutrn fbDbTest2RefUpdate, it the promises will 
// finish after the function is complete.  
// non-HTTP functions need to return promises this way, while http is based on the
// doSomethingPromiseWrapped example
    return Promise.all([delay1, delay2])
      .then(() => {
        fbDbTest2RefUpdate.update({
          updatedDB: true
        });
      })
      .catch(err => {
        console.error(err);
        fbDbTest2RefUpdate.update({
          updatedDB: false
        });
      });
  });

exports.fsRestaurantDocUpdated = functions.firestore.document('restaurants/{restaurantId}').onUpdate(event => {
  // Get the note document
  const doc = event.data.data();
  console.log("Restaurant Name updated: " + doc.name);
  const ts = new Date();
  
  // Add a new document in collection "functions"
  return fbFSTestRefUpdate.collection("functions").doc("updates").set({
    updated: true,
    updatedContent: doc.name + ", " + doc.year,
    timestamp: ts
  })
  .then(function() {
    console.log("Document successfully written!");
  })
  .catch(function(error) {
    console.error("Error writing document: ", error);
  });
});

exports.fsFunctionsDocUpdated = functions.firestore.document('functions/tests/users/{userId}').onUpdate(event => {
  // Get the note document
  const doc = event.data.data();
  console.log("Functions Doc updated: " + doc.name);
  const ts = new Date();
  
  // Add a new document in collection "functions"
  return fbFSTestRefUpdate.collection("functions").doc("updates").set({
    updated: true,
    updatedContent: doc.name + ", " + doc.category,
    timestamp: ts
  })
  .then(function() {
    console.log("Document successfully written!");
  })
  .catch(function(error) {
    console.error("Error writing document: ", error);
  });
});

exports.doFSTest = functions.https.onRequest((req, res) => {
  console.log('START');
  console.log('END');

  fbFSTestRefUpdate.collection("functions").get().then(function(querySnapshot) {
    querySnapshot.forEach(function(doc) {
        console.log(doc.id, " => ", doc.data());
        console.log(doc.data().name);
    });
  });

  // Add a new document in collection "cities"
  fbFSTestRefUpdate.collection("functions").doc("updates").set({
    updated: true
    })
    .then(function() {
      console.log("Document successfully written!");
    })
    .catch(function(error) {
      console.error("Error writing document: ", error);
    });

    res.redirect(200, '/');
});

exports.updates = functions.database
  .ref('/messages/{messageId}').onUpdate(event => {
    console.log('OnUpdate START');
    const message = event.data.val();
    console.log('message', message)
    console.log('message text', message.text);
    
    const { exec } = require('child_process');
    exec('free -m', (err, stdout, stderr) => {
      if (err) {
        console.log(err, 'err could not execute');
        // node couldn't execute the command
        return;
      }
    
      // the *entire* stdout and stderr (buffered)
      console.log(`stdout: ${stdout}`);
      console.log(`stderr: ${stderr}`);
    });

    // this is needed if we make an update on the return function, so we don't infinite loop the onUpdate event
    if(message.updated == true) {
      return
    }
    const updated = true;
    console.log('OnUpdate END');
    
    return event.data.adminRef.update({
      updated: true
    });

  })

