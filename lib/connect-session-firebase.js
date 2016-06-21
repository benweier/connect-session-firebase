/*!
 * Connect Session - Firebase
 * Copyright(c) 2016 Ben Weier <ben.weier@gmail.com>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */
const firebase = require('firebase');

/**
 * One day in milliseconds.
 */
const oneDayInMilliseconds = 86400000;

/**
 * Return the `FirebaseStore` extending `connect`'s session Store.
 *
 * @param {Object} connect
 * @return {Function}
 * @api public
 */
module.exports = function (session) {
  /**
   * Connect's Store.
   */
  const Store = session.Store;

  /**
   * Initialize FirebaseStore with the given `options`.
   *
   * @param {Object} options
   * @param {Function} fn
   * @api public
   */
  const FirebaseStore = function FirebaseStore (options, fn) {
    options = options || {};
    Store.call(options, fn);

    const db = options.database || false;
    const sessions = options.sessions || false;

    if (!db) {
      throw new Error('Connect Session Firebase must receive a `database` value.');
    }

    this.cleanSid = function cleanSid (sid) {
      // Firebase does not allow certain characters.
      return sid.replace(/\.|\$|#|\[|\]\//g, '_');
    };

    // Initialized `firebase.database` instance.
    if (db.ref) {
      this.db = db;
    }
    // Initialized `firebase` instance.
    else if (db.database) {
      this.db = db.database();
    }
    // Initialize a Firebase instance with the configuration object.
    else if (typeof db === 'object') {
      if (!db.serviceAccount) {
        throw new Error('`database` object must contain must have a `serviceAccount` value');
      }

      if (!db.databaseURL) {
        throw new Error('`database` object must contain must have a `databaseURL` value');
      }

      this.db = firebase.initializeApp(db).database();
    }
    else {
      throw new Error('Invalid `database` value provided.');
    }

    // Set a child reference to the sessions path.
    if (sessions.child) {
      this.sessions = sessions;
    }
    else {
      this.sessions = this.db.ref('sessions');
    }

    this.reapInterval = options.reapInterval || (oneDayInMilliseconds / 4);
    if (this.reapInterval) {
      setInterval(this.reap.bind(this), this.reapInterval);
    }
  };

  /*
   *  Inherit from `Store`.
   */
  // FirebaseStore.prototype.__proto__ = Store.prototype;
  FirebaseStore.prototype = Object.create(Store.prototype);

  /**
   * Attempt to fetch session by the given `sid`.
   *
   * @param {String} sid
   * @param {Function} fn
   * @api public
   */
  FirebaseStore.prototype.get = function get (sid, fn) {
    sid = this.cleanSid(sid);
    const now = Date.now();
    const session = this.sessions.child(sid);

    session.once('value', snapshot => {
      try {
        if (!snapshot || snapshot.val() === null) {
          return fn(null, null);
        }
        else {
          if (!snapshot.val()) return fn(null, null);
          else if (snapshot.val().expires && now >= snapshot.val().expires) {
            this.destroy(sid, fn);
          }
          else {
            let sess = snapshot.val().sess.toString();
            sess = JSON.parse(sess);
            return fn(null, sess);
          }
        }
      }
      catch (err) {
        fn(err);
      }
    });
  };

  /**
   * Commit the given `sess` object associated with the given `sid`.
   *
   * @param {String} sid
   * @param {Session} sess
   * @param {Function} fn
   * @api public
   */
  FirebaseStore.prototype.set = function set (sid, sess, fn) {
    sid = this.cleanSid(sid);
    const expires = typeof sess.cookie.maxAge === 'number' ? now + sess.cookie.maxAge : now + oneDayInMilliseconds;
    const jsonSess = JSON.stringify(sess);
    const now = Date.now();
    const session = this.sessions.child(sid);

    session.set({
      expires: JSON.stringify(expires),
      type: 'connect-session',
      sess: jsonSess
    }, fn);
  };

  /**
   * Destroy the session associated with the given `sid`.
   *
   * @param {String} sid
   * @param {Function} fn
   * @api public
   */
  FirebaseStore.prototype.destroy = function destroy (sid, fn) {
    sid = this.cleanSid(sid);
    const session = this.sessions.child(sid);
    session.remove(fn);
  };

  /**
   * Clear all sessions.
   *
   * @param {Function} fn
   * @api public
   */
  FirebaseStore.prototype.clear = function clear (fn) {
    this.sessions.remove(fn);
  };

  /**
   * Cleans up expired sessions
   *
   * @api public
   */
  FirebaseStore.prototype.reap = function reap (fn) {
    const count = 0;
    const now = Date.now();
    const removeList = [];
    const sessions = this.sessions;

    sessions.once('value', snapshot => {
      if (snapshot && snapshot.val()) {
        snapshot.forEach(session => {
          if (session.val().expires < now) {
            removeList.push(session.key());
          }
        });
      }

      if (!removeList.length && fn) {
        return fn(null, null);
      }

      removeList.forEach(sid => {
        sessions.child(sid).remove(() => {
          if (++count === removeList.length && fn) {
            return fn(null, removeList);
          }
        });
      });
    });
  };

  /**
   * Touch the given session object associated with the given session ID.
   *
   * @param {String} sid
   * @param {Object} sess
   * @param {Function} fn
   * @api public
   */
  FirebaseStore.prototype.touch = function touch (sid, sess, fn) {
    sid = this.cleanSid(sid);
    const session = this.sessions.child(sid);

    session.once('value', snapshot => {
      try {
        if (!snapshot || !snapshot.val()) {
          return fn();
        }
        else {
          let currentSess = snapshot.val().sess.toString();
          currentSess = JSON.parse(currentSess);
          currentSess.cookie = sess.cookie;

          return this.set(sid, currentSess, fn);
        }
      }
      catch (err) {
        fn(err);
      }
    });
  };

  return FirebaseStore;
};
