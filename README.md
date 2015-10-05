# Connect Firebase

connect-firebase is a Firebase session store backed by the [firebase sdk](https://www.firebase.com/docs/nodejs-quickstart.html)

[![NPM](https://nodei.co/npm/connect-firebase.png)](https://nodei.co/npm/connect-firebase/)
[![NPM](https://nodei.co/npm-dl/connect-firebase.png)](https://nodei.co/npm-dl/connect-firebase/)

## Installation

      $ npm install connect-firebase

## Options
  
  - `host` An existing Firebase to store sessions
  - `token` (optional) A Firebase authentication token
  - `reapInterval` (optional) how often expired sessions should be cleaned up (defaults to 21600000) (6 hours in milliseconds)


## Usage

```js
var options = {

  // The URL you were given when you created your Firebase
  host: 'connect-sessions.firebaseio.com',

  // Optional. A Firebase authentication token
  token: 'qKtOKAQSTCxLFJI7uSeof6H7cfLpSuWYOhqOTQqz',

  // Optional. How often expired sessions should be cleaned up.
  // Defaults to 21600000 (6 hours).
  reapInterval: 600000

};

var connect = require('connect'),
  FirebaseStore = require('connect-firebase')(connect);
connect()
  .use(connect.cookieParser())
  .use(connect.session({ store: new FirebaseStore(options), secret: 'keyboard cat'}))
```

 Or with [express](http://expressjs.com/)
 
 **NOTE:** Due to express 4.x.x changes, we now need to pass express-session to the function `connect-firebase` exports in order to extend `express-session.Store`:

```js
var session = require('express-session'),
  FirebaseStore = require('connect-firebase')(session);
app.use(session({
  store: new FirebaseStore(options), 
  secret: 'keyboard cat' 
  resave: true, 
  saveUninitialized: true
}));
```

## License

connect-firebase is licensed under the [MIT license.](https://github.com/ca98am79/connect-firebase/blob/master/LICENSE)
