/* global describe, context, it, before, after */
'use strict';

const path = require('path');
const lint = require('mocha-eslint');
const expect = require('chai').expect;
const session = require('express-session');
const firebase = require('firebase');
const FirebaseStore = require(path.normalize(`${__dirname}/../lib/connect-session-firebase.js`))(session);

require('dotenv').config({ silent: true });

describe('Code Standards', function () {
  this.slow(1000);

  lint(['index.js', 'lib/connect-session-firebase.js', 'test/test.js']);
});

describe('FirebaseStore', function () {
  this.timeout(10000);
  this.slow(5000);

  before('set up', function (done) {
    const config = {
      serviceAccount: process.env.FIREBASE_SERVICE_ACCOUNT,
      databaseURL: process.env.FIREBASE_DATABASE_URL
    };

    this.firebase = firebase.initializeApp(config);

    this.store = new FirebaseStore({
      database: this.firebase.database()
    });

    done();
  });

  after('tear down', function (done) {
    this.store.clear();
    this.firebase.delete();
    done();
  });

  context('when passed a valid firebase app', function () {
    it('should be an instance of FirebaseStore', function (done) {
      const store = new FirebaseStore({ database: this.firebase });

      expect(store).to.be.instanceof(FirebaseStore);
      done();
    });
  });

  context('when passed a valid firebase database', function () {
    it('should be an instance of FirebaseStore', function (done) {
      const store = new FirebaseStore({ database: this.firebase.database() });

      expect(store).to.be.instanceof(FirebaseStore);
      done();
    });
  });

  context('when passed valid arguments', function () {
    it('should be an instance of FirebaseStore', function (done) {
      expect(this.store).to.be.instanceof(FirebaseStore);
      done();
    });
  });

  context('when passed an invalid database', function () {
    const tests = [
      { key: 'object', args: { database: {} } },
      { key: 'array', args: { database: [] } },
      { key: 'string', args: { database: '' } }
    ];

    tests.forEach(function (test) {
      it(`${JSON.stringify(test.key)} should throw an error`, function (done) {
        expect(() => new FirebaseStore(test.args)).to.throw(Error);
        done();
      });
    });
  });

  context('when passed invalid arguments', function () {
    const tests = [
      { key: 'object', args: {} },
      { key: 'array', args: [] },
      { key: 'string', args: '' }
    ];

    tests.forEach(function (test) {
      it(`${JSON.stringify(test.key)} should throw an error`, function (done) {
        expect(() => new FirebaseStore(test.args)).to.throw(Error);
        done();
      });
    });
  });

  describe('.set()', function () {
    it('should save a session', function (done) {
      this.store.set('1234', {
        name: 'tj',
        cookie: { maxAge: 2000 }
      }, done);
    });
  });

  describe('.get()', function () {
    before('save a session', function (done) {
      this.store.set('1234', {
        name: 'tj',
        cookie: { maxAge: 2000 }
      }, done);
    });

    it('should fetch a session', function (done) {
      this.store.get('1234', (err, res) => {
        expect(res).to.have.property('name').and.to.eql('tj');
        expect(res).to.have.property('cookie').and.to.have.property('maxAge').and.to.eql(2000);
        done();
      });
    });
  });

  describe('.destroy()', function () {
    before('save a session', function (done) {
      this.store.set('12345', {
        name: 'tj',
        cookie: { maxAge: 2000 }
      }, done);
    });

    it('should remove a session', function (done) {
      this.store.destroy('12345', (err, res) => {
        this.store.get('12345', (err, res) => {
          expect(res).to.not.exist;
          done();
        });
      });
    });
  });

  describe('.clear()', function () {
    before('save first session', function (done) {
      this.store.set('abcd', {
        name: 'tj',
        cookie: { maxAge: 2000 }
      }, done);
    });

    before('save second session', function (done) {
      this.store.set('abcdef', {
        name: 'tj',
        cookie: { maxAge: 2000 }
      }, done);
    });

    it('should remove all sessions', function (done) {
      this.store.clear((err, res) => {
        this.store.get('abcd', (err, res) => {
          expect(res).to.not.exist;

          this.store.get('abcdef', (err, res) => {
            expect(res).to.not.exist;
            done();
          });
        });
      });
    });
  });

  describe('.reap()', function () {
    before('save a session', function (done) {
      this.store.set('abcd', {
        name: 'tj',
        cookie: { maxAge: -2000 }
      }, done);
    });

    it('should remove expired sessions', function (done) {
      this.store.reap((err, res) => {
        this.store.get('abcd', (err, res) => {
          expect(res).to.not.exist;
          done();
        });
      });
    });
  });

  describe('.touch()', function () {
    before('save a session', function (done) {
      this.store.set('abcd', {
        name: 'tj',
        cookie: { maxAge: 2000 }
      }, done);
    });

    it('should update a session', function (done) {
      this.store.touch('abcd', {
        name: 'bn',
        cookie: { maxAge: 3000 }
      }, (err) => {
        this.store.get('abcd', (err, res) => {
          expect(res).to.have.property('name').and.to.eql('tj');
          expect(res).to.have.property('cookie').and.to.have.property('maxAge').and.to.eql(3000);
          done();
        });
      });
    });
  });
});
