/*!
 * Connect Session - Firebase
 * Copyright(c) 2016 Ben Weier <ben.weier@gmail.com>
 * MIT Licensed
 */
'use strict';

/**
 * Module dependencies.
 */
const firebase = require('firebase');

/**
 * Six hours in milliseconds.
 */
const sixHoursInMilliseconds = 21600000;

/**
 * Return the `FirebaseStore` extending `connect`'s session Store.
 *
 * @param {Object} session
 * @return {Function}
 * @api public
 */
const connectSessionFirebase = function connectSessionFirebase (session) {
  /**
   * Connect's Store.
   */
  const Store = session.Store;

  /**
   * FirebaseStore constructor.
   *
   * @param {Object} args
   * @param {Function} fn
   * @api public
   */
  const FirebaseStore = function FirebaseStore (args, fn) {
    const options = args || {};
    const db = options.database || false;
    const sessions = options.sessions || false;

    Store.call(options, fn);

    if (!db) {
      throw new Error('Connect Session Firebase must receive a `database` value.');
    }

    this.cleanRef = function cleanRef (str) {
      // Firebase does not allow certain characters.
      return str.replace(/\.|\$|#|\[|\]|\//g, '_');
    };

    // Initialized `firebase` instance.
    if (db.ref) {
      this.db = db;
    } else if (db.database) {
      this.db = db.database();
    } else if (typeof db === 'object') {
      // Initialize a Firebase instance with the configuration object.
      if (!db.databaseURL) {
        throw new Error('`database` object must have a `databaseURL` value');
      }

      this.db = firebase.initializeApp(db).database();
    } else {
      throw new Error('Invalid `database` value provided.');
    }

    // Set a child reference to the sessions path.
    this.sessions = typeof sessions === 'string' ? this.cleanRef(sessions) : 'sessions';

    this.reapInterval = options.reapInterval || sixHoursInMilliseconds;
    if (typeof this.reapInterval === 'number') {
      setInterval(this.reap.bind(this), this.reapInterval);
    }
  };

  /**
   *  Inherit from `Store`.
   */
  // FirebaseStore.prototype.__proto__ = Store.prototype;
  FirebaseStore.prototype = Object.create(Store.prototype);

  /**
   * Fetch a session by the given `sid`.
   *
   * @param {String} sid
   * @param {Function} fn
   * @api public
   */
  FirebaseStore.prototype.get = function get (sid, fn) {
    sid = this.cleanRef(sid);
    const now = Date.now();
    const session = this.db.ref(this.sessions).child(sid);

    return session.once('value')
      .then(snapshot => {
        if (!snapshot.exists()) {
          return fn();
        }

        if (snapshot.val().expires < now) {
          return this.destroy(sid, fn);
        }

        const sess = snapshot.val().sess.toString();

        return fn(null, JSON.parse(sess));
      })
      .catch(fn);
  };

  /**
   * Save the `sess` object with the given `sid`.
   *
   * @param {String} sid
   * @param {Session} sess
   * @param {Function} fn
   * @api public
   */
  FirebaseStore.prototype.set = function set (sid, sess, fn) {
    sid = this.cleanRef(sid);
    const now = Date.now();
    const expires = sess.cookie && typeof sess.cookie.maxAge === 'number' ? now + sess.cookie.maxAge : now + sixHoursInMilliseconds;
    const session = this.db.ref(this.sessions).child(sid);

    const data = {
      expires: expires,
      sess: JSON.stringify(sess),
      type: 'connect-session'
    };

    return session.set(data).then(fn).catch(fn);
  };

  /**
   * Remove the session with the given `sid`.
   *
   * @param {String} sid
   * @param {Function} fn
   * @api public
   */
  FirebaseStore.prototype.destroy = function destroy (sid, fn) {
    sid = this.cleanRef(sid);
    const session = this.db.ref(this.sessions).child(sid);

    return session.remove().then(fn);
  };

  /**
   * Remove all sessions.
   *
   * @param {Function} fn
   * @api public
   */
  FirebaseStore.prototype.clear = function clear (fn) {
    return this.db.ref(this.sessions).remove().then(fn);
  };

  /**
   * Remove expired sessions.
   *
   * @param {Function} fn
   * @api public
   */
  FirebaseStore.prototype.reap = function reap (fn) {
    const now = Date.now();
    const sessions = this.db.ref(this.sessions);

    return sessions.once('value')
      .then(snapshot => {
        if (!snapshot.exists()) {
          return fn();
        }

        Promise.all(snapshot.forEach(session => {
          if (session.val().expires < now) {
            sessions.child(session.key).remove();
          }
        }))
        .then(fn);

      })
      .catch(fn);
  };

  /**
   * Update a session object with the given `sid`.
   *
   * @param {String} sid
   * @param {Object} sess
   * @param {Function} fn
   * @api public
   */
  FirebaseStore.prototype.touch = function touch (sid, sess, fn) {
    sid = this.cleanRef(sid);
    const session = this.db.ref(this.sessions).child(sid);

    return session.once('value')
      .then(snapshot => {
        if (!snapshot.exists()) {
          return fn();
        }

        let currentSess = JSON.parse(snapshot.val().sess);
        currentSess.cookie = sess.cookie;

        return this.set(sid, currentSess, fn);
      })
      .catch(fn);
  };

  return FirebaseStore;
};

module.exports = connectSessionFirebase;
