/* global describe, context, it, before, after */
'use strict';

const path = require('path');
const lint = require('mocha-eslint');
const expect = require('chai').expect;
const session = require('express-session');
const firebase = require('firebase');
const FirebaseStore = require(path.normalize(`${__dirname}/../lib/connect-session-firebase.js`))(session);

require('dotenv').config({ silent: true });

const ref = firebase.initializeApp({
  serviceAccount: process.env.FIREBASE_SERVICE_ACCOUNT,
  databaseURL: process.env.FIREBASE_DATABASE_URL
});

const store = new FirebaseStore({
  database: ref.database()
});

describe('Code Standards', function () {
  this.slow(1000);

  lint(['**/*.js', '!node_modules/**']);
});

describe('FirebaseStore', function () {
  this.timeout(10000);
  this.slow(5000);

  after('clean up data', function (done) {
    store.clear(done);
  });

  after('close connection', function (done) {
    ref.delete();
    done();
  });

  context('when passed a valid config', function () {
    it('should be an instance of FirebaseStore', function (done) {
      expect(store).to.be.instanceof(FirebaseStore);
      done();
    });
  });

  context('when passed an invalid config', function () {
    const tests = [
      { args: { database: {} } },
      { args: { database: '' } },
      { args: {} },
      { args: [] },
      { args: '' },
      { args: null }
    ];

    tests.forEach(function (test) {
      it(`${JSON.stringify(test.args)} should throw an error`, function (done) {
        expect(() => new FirebaseStore(test.args)).to.throw(Error);
        done();
      });
    });
  });

  describe('.set()', function () {
    it('should save a session', function (done) {
      store.set('1234_#$[]', {
        name: 'tj',
        cookie: { maxAge: 2000 }
      }, done);
    });
  });

  describe('.get()', function () {
    before('save a session', function (done) {
      store.set('1234', {
        name: 'tj',
        cookie: { maxAge: 2000 }
      }, done);
    });

    it('should fetch a session', function (done) {
      store.get('1234', function (err, res) {
        expect(res).to.have.property('name').and.to.eql('tj');
        expect(res).to.have.property('cookie').and.to.have.property('maxAge').and.to.eql(2000);
        done();
      });
    });
  });

  describe('.destroy()', function () {
    before('save a session', function (done) {
      store.set('12345', {
        name: 'tj',
        cookie: { maxAge: 2000 }
      }, done);
    });

    it('should remove a session', function (done) {
      store.destroy('12345', function (err, res) {
        store.get('12345', function (err, res) {
          expect(res).to.not.exist;
          done();
        });
      });
    });
  });

  describe('.clear()', function () {
    before('save first session', function (done) {
      store.set('abcd', {
        name: 'tj',
        cookie: { maxAge: 2000 }
      }, done);
    });

    before('save second session', function (done) {
      store.set('abcdef', {
        name: 'tj',
        cookie: { maxAge: 2000 }
      }, done);
    });

    it('should remove all sessions', function (done) {
      store.clear(function (err, res) {
        store.get('abcd', function (err, res) {
          expect(res).to.not.exist;
          store.get('abcdef', function (err, res) {
            expect(res).to.not.exist;
            done();
          });
        });
      });
    });
  });

  describe('.reap()', function () {
    before('save a session', function (done) {
      store.set('abcd', {
        name: 'tj',
        cookie: { maxAge: -2000 }
      }, done);
    });

    it('should remove expired sessions', function (done) {
      store.reap(function (err, res) {
        store.get('abcd', function (err, res) {
          expect(res).to.not.exist;
          done();
        });
      });
    });
  });

  describe('.touch()', function () {
    before('save a session', function (done) {
      store.set('abcd', {
        name: 'tj',
        cookie: { maxAge: 2000 }
      }, done);
    });

    it('should update a session', function (done) {
      store.touch('abcd', {
        name: 'bn',
        cookie: { maxAge: 3000 }
      }, function (err) {
        store.get('abcd', function (err, res) {
          expect(res).to.have.property('name').and.to.eql('tj');
          expect(res).to.have.property('cookie').and.to.have.property('maxAge').and.to.eql(3000);
          done();
        });
      });
    });
  });
});
