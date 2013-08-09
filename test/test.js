var firebase = 'connect-sessions.firebaseIO-demo.com';

var should = require('should'),
    connect = require('connect'),
    FirebaseStore = require(__dirname + '/../lib/connect-firebase.js')(connect);

describe('FirebaseStore', function () {
    describe('Instantiation', function () {
        it('should be able to be created', function () {
            var store = new FirebaseStore({
                firebase: firebase
            });
            store.should.be.an.instanceOf(FirebaseStore)
        });
    });
    describe('Setting', function () {
        it('should store data correctly', function (done) {
            var store = new FirebaseStore({
                firebase: firebase
            });
            store.set('1234', {
                cookie: {
                    maxAge: 2000
                },
                name: 'tj'
            }, function (err, res) {
                if (err) throw err;
                res.cookie.should.eql({
                    maxAge: 2000
                });
                res.name.should.eql('tj');

                done();
            });
        });

    });
    describe('Getting', function () {
        before(function () {
            var store = new FirebaseStore({
                firebase: firebase
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
                firebase: firebase
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
                firebase: firebase
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
                firebase: firebase
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
});