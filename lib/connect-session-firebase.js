/**
 * @file Exports the FirebaseStore class
 * @copyright 2017 Ben Weier <ben.weier@gmail.com>
 * @license MIT
 * @version 5.5.0
 */

/**
 * Six hours in milliseconds
 * @private
 */
const reapInterval = 21600000;

/**
 * Noop default reap callback function.
 * @return {this} The function scope.
 * @private
 */
const reapCallback = function reapCallback () {
  return this;
};

/**
 * Return Firebase session store extending Connect/Express session store.
 *
 * @module
 * @param  {Object} session Connect/Express Session Store
 * @return {Function}       FirebaseStore class
 */
const connectSessionFirebase = function connectSessionFirebase (session) {

  /**
   * Connect Store
   * @private
   */
  const Store = session.Store;

  /**
   * Create a new FirebaseStore.
   *
   * @constructor
   * @param {Object} args The configuration options for FirebaseStore
   */
  const FirebaseStore = function FirebaseStore (args) {
    const options = Object.assign({}, args);
    const db = options.database || {};
    const sessions = typeof options.sessions === 'string' ? options.sessions : 'sessions';

    Store.call(options);

    /**
     * Replace disallowed characters in a Firebase reference key.
     *
     * @inner
     * @param  {String} str A child reference key
     * @return {String}     A valid child reference key
     */
    this.cleanRef = function cleanRef (str) {
      return str.replace(/\.|\$|#|\[|\]|\//g, '_');
    };

    // Initialized `firebase` instance.
    if (db.ref) {
      this.db = db;
    } else if (db.database) {
      this.db = db.database();
    } else {
      throw new Error('Invalid Firebase reference');
    }

    // Set a child reference to the sessions path.
    this.sessions = this.cleanRef(sessions);

    this.reapInterval = options.reapInterval || reapInterval;
    this.reapCallback = options.reapCallback || reapCallback;
    if (typeof this.reapInterval === 'number' && typeof this.reapCallback === 'function') {
      setInterval(this.reap.bind(this, this.reapCallback), this.reapInterval);
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
   *
   * @param {String} sid  The session key
   * @param {Function} fn OnComplete callback function
   * @return {Promise}    A thenable Firebase reference
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
   *
   * @param  {String} sid  The session key
   * @param  {Object} sess The session data
   * @param  {Function} fn OnComplete callback function
   * @return {Promise}     A thenable Firebase reference
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
   *
   * @param  {String} sid  The session key
   * @param  {Function} fn OnComplete callback function
   * @return {Promise}     A thenable Firebase reference
   */
  FirebaseStore.prototype.destroy = function destroy (sid, fn) {
    const key = this.cleanRef(sid);
    const session = this.db.ref(this.sessions).child(key);

    return session.remove().then(fn);
  };

  /**
   * Remove all session references.
   *
   * @param  {Function} fn OnComplete callback function
   * @return {Promise}     A thenable Firebase reference
   */
  FirebaseStore.prototype.clear = function clear (fn) {
    return this.db.ref(this.sessions).remove().then(fn);
  };

  /**
   * Remove all expired session references.
   *
   * @param  {Function} fn OnComplete callback function
   * @return {Promise}     A thenable Firebase reference
   */
  FirebaseStore.prototype.reap = function reap (fn) {
    const now = Date.now();
    const sessions = this.db.ref(this.sessions);

    return sessions.once('value')
      .then(snapshot => {
        if (!snapshot.exists()) {
          return fn();
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
   *
   * @param  {String} sid  The session key
   * @param  {Object} sess The session data
   * @param  {Function} fn OnComplete callback function
   * @return {Promise}     A thenable Firebase reference
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
