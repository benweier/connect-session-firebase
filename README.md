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

## License

`connect-session-firebase` is licensed under the [MIT license](https://github.com/benweier/connect-session-firebase/blob/master/LICENSE).
