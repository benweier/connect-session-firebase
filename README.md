# Connect Firebase

connect-firebase is a Firebase session store backed by the [firebase sdk](https://www.firebase.com/docs/nodejs-quickstart.html)

## Installation

	  $ npm install connect-firebase

## Options
  
  - `firebase_url` An existing Firebase to store sessions
  - `token` (optional) A Firebase authentication token

## Usage

	var options = {
		// The URL you were given when you created your Firebase
		firebase_url: 'connect-sessions.firebaseio.com',

		// Optional. A Firebase authentication token
		token: 'qKtOKAQSTCxLFJI7uSeof6H7cfLpSuWYOhqOTQqz'
	};
	
	var connect = require('connect'),
		FirebaseStore = require('connect-firebase')(connect);
	connect()
		.use(connect.cookieParser())
		.use(connect.session({ store: new FirebaseStore(options), secret: 'keyboard cat'}))

 Or with [express](http://expressjs.com/)
 	
 	FirebaseStore = require('connect-firebase')(express);
 	var app = express(
		express.cookieParser(), 
		express.session({ store: new FirebaseStore(options), secret: 'keyboard cat'})
	);

## LICENSE - "MIT License"

Copyright (c) 2014 Mike Carson, http://ca98am79.com/

Permission is hereby granted, free of charge, to any person
obtaining a copy of this software and associated documentation
files (the "Software"), to deal in the Software without
restriction, including without limitation the rights to use,
copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following
conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.
