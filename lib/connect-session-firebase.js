/**
 * @file Exports the FirebaseStore class
 * @copyright 2016 Ben Weier <ben.weier@gmail.com>
 * @license MIT
 * @version 3.4.2
 */
'use strict';

/**
 * Module dependencies
 * @private
 */
const firebase = require('firebase');

/**
 * Six hours in milliseconds
 * @private
 */
const reapInterval = 21600000;

/**
 * Return Firebase session store extending Connect/Express session store
 * @module
 * @param  {object} session Connect/Express Session Store
 * @return {function}       FirebaseStore class
 */
const connectSessionFirebase = function connectSessionFirebase (session) {

  /**
   * Connect Store
   * @private
   */
  const Store = session.Store;

  /**
   * Create a new FirebaseStore
   * @class
   * @param {object} args The configuration options for FirebaseStore
   */
  const FirebaseStore = function FirebaseStore (args) {
    const options = args || {};
    const db = options.database || false;
    const sessions = options.sessions || false;

    Store.call(options);

    if (!db) {
      throw new Error('Connect Session Firebase must receive a `database` value.');
    }

    /**
     * Replace disallowed characters in a Firebase reference key
     * @inner
     * @param  {string} str A child reference key
     * @return {string}     A valid child reference key
     */
    this.cleanRef = function cleanRef (str) {
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

    this.reapInterval = options.reapInterval || reapInterval;
    if (typeof this.reapInterval === 'number') {
      setInterval(this.reap.bind(this), this.reapInterval);
    }
  };

  /**
   * Inherit from `Store`
   * @private
   */
  // FirebaseStore.prototype.__proto__ = Store.prototype;
  FirebaseStore.prototype = Object.create(Store.prototype);

  /**
   * Fetch a keyed session reference.
   * @param {string} sid  The session key
   * @param {function} fn OnComplete callback function
   * @return {promise}    A thenable Firebase reference
   */
  FirebaseStore.prototype.get = function get (sid, fn) {
    const key = this.cleanRef(sid);
    const now = Date.now();
    const session = this.db.ref(this.sessions).child(key);

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
   * Save a keyed session reference.
   * @param  {string} sid  The session key
   * @param  {object} sess The session data
   * @param  {function} fn OnComplete callback function
   * @return {promise}     A thenable Firebase reference
   */
  FirebaseStore.prototype.set = function set (sid, sess, fn) {
    const key = this.cleanRef(sid);
    const now = Date.now();
    const expires = sess.cookie && typeof sess.cookie.maxAge === 'number' ? now + sess.cookie.maxAge : now + reapInterval;
    const session = this.db.ref(this.sessions).child(key);

    const data = {
      expires: expires,
      sess: JSON.stringify(sess),
      type: 'connect-session'
    };

    return session.set(data).then(fn).catch(fn);
  };

  /**
   * Remove a keyed session reference.
   * @param  {string} sid  The session key
   * @param  {function} fn OnComplete callback function
   * @return {promise}     A thenable Firebase reference
   */
  FirebaseStore.prototype.destroy = function destroy (sid, fn) {
    const key = this.cleanRef(sid);
    const session = this.db.ref(this.sessions).child(key);

    return session.remove().then(fn);
  };

  /**
   * Remove all session references.
   * @param  {function} fn OnComplete callback function
   * @return {promise}     A thenable Firebase reference
   */
  FirebaseStore.prototype.clear = function clear (fn) {
    return this.db.ref(this.sessions).remove().then(fn);
  };

  /**
   * Remove all expired session references.
   * @param  {function} fn OnComplete callback function
   * @return {promise}     A thenable Firebase reference
   */
  FirebaseStore.prototype.reap = function reap (fn) {
    const now = Date.now();
    const sessions = this.db.ref(this.sessions);

    return sessions.once('value')
      .then(snapshot => {
        if (!snapshot.exists()) {
          return;
        }

        const remove = [];

        snapshot.forEach(session => {
          if (session.val().expires < now) {
            remove.push(sessions.child(session.key).remove());
          }
        });

        Promise.all(remove)
          .then(fn)
          .catch(fn);
      })
      .catch(fn);
  };

  /**
   * Update a keyed session reference.
   * @param  {string} sid  The session key
   * @param  {object} sess The session data
   * @param  {function} fn OnComplete callback function
   * @return {promise}     A thenable Firebase reference
   */
  FirebaseStore.prototype.touch = function touch (sid, sess, fn) {
    const key = this.cleanRef(sid);
    const session = this.db.ref(this.sessions).child(key);

    return session.once('value')
      .then(snapshot => {
        if (!snapshot.exists()) {
          return fn();
        }

        const touched = Object.assign(
          {},
          JSON.parse(snapshot.val().sess),
          { cookie: sess.cookie }
        );

        return this.set(sid, touched, fn);
      })
      .catch(fn);
  };

  return FirebaseStore;
};

module.exports = connectSessionFirebase;
