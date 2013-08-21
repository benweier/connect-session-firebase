var firebase_url = 'connect-sessions.firebaseio.com';
var firebase_auth_token = 'qKtOKAQSTCxLFJI7uSeof6H7cfLpSuWYOhqOTQqz';

var should = require('should'),
    connect = require('connect'),
    FirebaseStore = require(__dirname + '/../lib/connect-firebase.js')(connect);

describe('FirebaseStore', function () {
    describe('Instantiation', function () {
        it('should be able to be created', function () {
            var store = new FirebaseStore({
                firebase_url: firebase_url,
                token: firebase_auth_token
            });
            store.should.be.an.instanceOf(FirebaseStore)
        });
    });
    describe('Setting', function () {
        it('should store data correctly', function (done) {
            var store = new FirebaseStore({
                firebase_url: firebase_url
            });
            store.set('1234', {
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
                firebase_url: firebase_url
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
                firebase_url: firebase_url
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
                firebase_url: firebase_url
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
                firebase_url: firebase_url
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
                firebase_url: firebase_url
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
                firebase_url: firebase_url
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
});
