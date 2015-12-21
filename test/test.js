/* global describe, it, before */
var host = 'xxx.firebaseio.com';
var authToken = 'xxxxx';

var should = require('should'),
    session = require('express-session'),
    FirebaseStore = require(__dirname + '/../lib/connect-firebase.js')(session);

describe('FirebaseStore', function () {
    this.timeout(0);

    describe('Instantiation', function () {
        it('should be able to be created', function () {
            var store = new FirebaseStore({
                host: host,
                token: authToken
            });
            store.should.be.an.instanceOf(FirebaseStore);
        });
    });
    describe('Setting', function () {
        it('should store data correctly', function (done) {
            var store = new FirebaseStore({
                host: host
            });
            store.set('1234_#$[]', {
                cookie: {
                    maxAge: 2000
                },
                name: 'tj'
            }, function (err, res) {
                if (err) throw err;

                done();
            });
        });

    });
    describe('Getting', function () {
        before(function () {
            var store = new FirebaseStore({
                host: host
            });
            store.set('1234', {
                cookie: {
                    maxAge: 2000
                },
                name: 'tj'
            }, function () {});
        });

        it('should get data correctly', function (done) {
            var store = new FirebaseStore({
                host: host
            });
            store.get('1234', function (err, res) {
                if (err) throw err;
                res.cookie.should.eql({
                    maxAge: 2000
                });
                res.name.should.eql('tj');

                done();
            });
        });

    });
    describe('Destroying', function () {
        before(function () {
            var store = new FirebaseStore({
                host: host
            });
            store.set('12345', {
                cookie: {
                    maxAge: 2000
                },
                name: 'tj'
            }, function () {});
        });

        it('should destroy data correctly', function (done) {
            var store = new FirebaseStore({
                host: host
            });
            store.destroy('12345', function (err, res) {
                if (err) throw err;

                store.get('12345', function (err, res) {
                    if (err) throw err;
                    should.not.exist(res);

                    done();
                });
            });
        });

    });
    describe('Clearing', function () {
        before(function () {
            var store = new FirebaseStore({
                host: host
            });
            store.set('abcd', {
                cookie: {
                    maxAge: 2000
                },
                name: 'tj'
            }, function () {});
            store.set('abcdef', {
                cookie: {
                    maxAge: 2000
                },
                name: 'tj'
            }, function () {});
        });

        it('should clear sessions correctly', function (done) {
            var store = new FirebaseStore({
                host: host
            });
            store.clear(function (err, res) {
                if (err) throw err;

                store.get('abcd', function (err, res) {
                    if (err) throw err;
                    should.not.exist(res);

                    store.get('abcdef', function (err, res) {
                        if (err) throw err;
                        should.not.exist(res);

                        done();
                    });
                });
            });
        });

    });
    describe('Reaping', function () {
        before(function (done) {
            var store = new FirebaseStore({
                host: host
            });
            store.set('abcd', {
                cookie: {
                    maxAge: -2000
                },
                name: 'tj'
            }, done);
        });

        it('should reap data correctly', function (done) {
            var store = new FirebaseStore({
                host: host
            });
            store.reap(function (err, res) {
                if (err) throw err;

                store.get('abcd', function (err, res) {
                    if (err) throw err;
                    should.not.exist(res);

                    done();

                });
            });
        });

    });
    describe('Touching', function () {
        before(function (done) {
            var store = new FirebaseStore({
                host: host
            });
            store.set('abcd', {
                cookie: {
                    maxAge: 2000
                },
                name: 'tj'
            }, done);
        });

        it('should touch data correctly', function (done) {
            var store = new FirebaseStore({
                host: host
            });
            store.touch('abcd', {
                cookie: {
                    maxAge: 3000
                },
                name: 'bn'
            }, function (err) {
                if (err) throw err;

                store.get('abcd', function (err, res) {
                    if (err) throw err;
                    res.cookie.should.eql({
                        maxAge: 3000
                    });
                    res.name.should.eql('tj');

                    done();
                });
            });
        });

    });
});
