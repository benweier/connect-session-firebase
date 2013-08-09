/*!
 * Connect - Firebase
 * Copyright(c) 2013 Mike Carson <ca98am79@gmail.com>
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

module.exports = function (connect) {
    /**
     * Connect's Store.
     */

    var Store = connect.session.Store;

    /**
     * Initialize FirebaseStore with the given `options`.
     *
     * @param {Object} options
     * @api public
     */

    function FirebaseStore(options) {
        options = options || {};
        Store.call(this, options);

        this.firebase = options.firebase;

    };

    /*
     *  Inherit from `Store`.
     */

    FirebaseStore.prototype.__proto__ = Store.prototype;

    /**
     * Attempt to fetch session by the given `sid`.
     *
     * @param {String} sid
     * @param {Function} fn
     * @api public
     */

    FirebaseStore.prototype.get = function (sid, fn) {

        var now = +new Date;
        var sessionRef = new Firebase('https://' + this.firebase + '/sessions/' + sid);

        sessionRef.on('value', function (snapshot) {
            if (snapshot.val() === null) {
                return fn(null, null);
            } else {
                var session = snapshot.val();
                sess = JSON.parse(session.sess);

                fn(null, sess);
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

    FirebaseStore.prototype.set = function (sid, sess, fn) {

        var expires = typeof sess.cookie.maxAge === 'number' ? (+new Date()) + sess.cookie.maxAge : (+new Date()) + oneDayInMilliseconds;
        sess_string = JSON.stringify(sess);

        var sessionRef = new Firebase('https://' + this.firebase + '/sessions/' + sid);
        sessionRef.set({
            expires: JSON.stringify(expires),
            type: 'connect-session',
            sess: sess_string
        }, function (error) {
            if (error) {
                fn(error);
            } else {
                fn(null, sess);
            }
        });
    }

    /**
     * Destroy the session associated with the given `sid`.
     *
     * @param {String} sid
     * @param {Function} fn
     * @api public
     */

    FirebaseStore.prototype.destroy = function (sid, fn) {

        var sessionRef = new Firebase('https://' + this.firebase + '/sessions/' + sid);
        sessionRef.remove(fn);
    };

    return FirebaseStore;
};