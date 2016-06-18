/*!
 * Connect Session - Firebase
 * Copyright(c) 2016 Ben Weier <ben.weier@gmail.com>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */
var Firebase = require('firebase');

/**
 * One day in milliseconds.
 */
var oneDayInMilliseconds = 86400000;

/**
 * Return the `FirebaseStore` extending `connect`'s session Store.
 *
 * @param {object} connect
 * @return {Function}
 * @api public
 */
module.exports = function (session) {
  /**
   * Connect's Store.
   */
  var Store = session.Store;

  /**
   * Initialize FirebaseStore with the given `options`.
   *
   * @param {Object} options
   * @param {Function} fn
   * @api public
   */
  var FirebaseStore = function FirebaseStore (options, fn) {
    options = options || {};
    Store.call(this, options);

    this.host = options.host;

    this.cleanSid = function cleanSid (sid) {
      // Firebase does not allow certain characters.
      return sid.replace(/\.|\$|#|\[|\]\//g, '_');
    };

    this.reapInterval = options.reapInterval || (oneDayInMilliseconds / 4);
    if (this.reapInterval > 0) {
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
    var now = +new Date;
    var sessionRef = new Firebase('https://' + this.host + '/sessions/' + sid);

    sessionRef.once('value', snapshot => {
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
            var sess = snapshot.val().sess.toString();
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
    var expires = typeof sess.cookie.maxAge === 'number' ? (+new Date()) + sess.cookie.maxAge : (+new Date()) + oneDayInMilliseconds;
    var jsonSess = JSON.stringify(sess);

    var sessionRef = new Firebase('https://' + this.host + '/sessions/' + sid);
    sessionRef.set({
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
    var sessionRef = new Firebase('https://' + this.host + '/sessions/' + sid);
    sessionRef.remove(fn);
  };

  /**
   * Clear all sessions.
   *
   * @param {Function} fn
   * @api public
   */
  FirebaseStore.prototype.clear = function clear (fn) {
    var sessionRef = new Firebase('https://' + this.host + '/sessions');
    sessionRef.remove(fn);
  };

  /**
   * Cleans up expired sessions
   *
   * @api public
   */
  FirebaseStore.prototype.reap = function reap (fn) {
    var sessionRef = new Firebase('https://' + this.host + '/sessions/');
    var count = 0;
    var now = +new Date;
    var removeList = [];

    sessionRef.once('value', snapshot => {
      if (snapshot && snapshot.val()) {
        snapshot.forEach(session => {
          if (session.val().expires < now) {
            removeList.push(session.key());
          }
        });
      }

      if (removeList.length === 0 && fn) return fn(null, null);

      removeList.forEach(sessionId => {
        sessionRef.child(sessionId).remove(() => {
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
    var sessionRef = new Firebase('https://' + this.host + '/sessions/' + sid);

    sessionRef.once('value', snapshot => {
      try {
        if (!snapshot || !snapshot.val()) {
          return fn();
        }
        else {
          var currentSess = snapshot.val().sess.toString();
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
