0.0.9 / 2015-12-21
==================
  * Add touch method to FirebaseStore (thanks brianneisler)

0.0.8 / 2015-07-07
==================
  * Fixed Firebase Warning auth is being deprecated (thanks acolby)

0.0.7 / 2014-12-05
==================
  * Implementation of reap method to clean up expired sessions (issue #5, thanks fpereira1)
  
0.0.5 / 2014-08-02
==================
  * Remove `connect` dependency. Now pass `session` to module (to be compatible with express 4.x)
  * Change option `firebase_url` to `host`
  * Change option `clean_sid` to `cleanSid`
  * Add `.jshintrc` + Code clean up

0.0.4 / 2013-08-20
==================

  * Add clear()
  
0.0.3 / 2013-08-20
==================

  * Fixes to session id characters, use Firebase.once() instead of Firebase.on() for get()
  
0.0.2 / 2013-08-11
==================

  * Add auth token support
  
0.0.1 / 2013-08-10
==================

  * Initial commit
