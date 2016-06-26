# Connect Session Firebase

`connect-session-firebase` is a Connect/Express compatible session store backed by the [Firebase SDK](https://firebase.google.com/docs/server/setup).

It is a fork of [connect-firebase](https://github.com/ca98am79/connect-firebase) by *ca98am79* due to incompatibility with the latest version of [Firebase](http://npmjs.org/package/firebase). The dependency version and package version have been bumped to match the latest major version of Firebase.

## Installation

    $ npm install connect-session-firebase --save

## Options

  - `database` A pre-initialized Firebase Database app instance or Firebase configuration object.
  - `sessions` (optional) A string to the Firebase reference for session storage. (defaults to "sessions")
  - `reapInterval` (optional) how often expired sessions should be cleaned up (defaults to 21600000) (6 hours in milliseconds)

## Usage

With [Connect](http://senchalabs.github.io/connect)

```js
const connect = require('connect');
const FirebaseStore = require('connect-session-firebase')(connect);
const firebase = require('firebase');
const ref = firebase.initializeApp({
  serviceAccount: 'path/to/serviceAccountCredentials.json',
  databaseURL: 'https://databaseName.firebaseio.com'
});

connect()
  .use(connect.cookieParser())
  .use(connect.session({
    store: new FirebaseStore({
      database: ref.database()
    }),
    secret: 'keyboard cat'
  }));
```

 Or with [Express](http://expressjs.com)

 **NOTE:** Due to changes in Express 4, we now need to pass `express-session` to the function `connect-session-firebase` exports in order to extend `express-session.Store`:

```js
const express = require('express');
const session = require('express-session');
const FirebaseStore = require('connect-session-firebase')(session);
const firebase = require('firebase');
const ref = firebase.initializeApp({
  serviceAccount: 'path/to/serviceAccountCredentials.json',
  databaseURL: 'https://databaseName.firebaseio.com'
});

express()
  .use(session({
    store: new FirebaseStore({
      database: ref.database()
    }),
    secret: 'keyboard cat'
    resave: true,
    saveUninitialized: true
  }));
```

## Tests

To run tests against `connect-session-firebase` you will need your own Firebase Database available. With Firebase 3.0.0, connecting to the database requires a `serviceAccount` object which is provisioned in a JSON file through the [Firebase IAM & Admin Console](https://console.firebase.google.com/iam-admin/projects).

Checkout the repo locally and create two files in the project root:
- .env
- serviceAccount.json

With the content:

*.env*
```
FIREBASE_SERVICE_ACCOUNT=./serviceAccount.json
FIREBASE_DATABASE_URL=https://[app].firebaseio.com
```

*serviceAccount.json*
```
{
  "type": "service_account",
  "project_id": "",
  "private_key_id": "",
  "private_key": "",
  "client_email": "",
  "client_id": "",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://accounts.google.com/o/oauth2/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": ""
}
```

Install the dev dependencies:

    $ npm install

Run the tests:

    $ node_modules/.bin/mocha

## License

`connect-session-firebase` is licensed under the [MIT license](https://github.com/benweier/connect-session-firebase/blob/master/LICENSE).
