import * as functions from 'sparkcloud-sdk';

// Start writing functions
//
// https://docs.sparkcloud.link/functions/typescript/writing-functions

export const helloWorld = functions.https.onCall((data, context) => {
    return "Hello from SparkCloud!";
});