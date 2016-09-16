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

      Promise.all([
        this.store.set('set-1', { name: 'tj', maxAge: 10000 }),
        this.store.set('set-2', { name: 'tj', maxAge: 20000 })
      ])
      .then(() => done());

    });
  });

  describe('.get()', function () {
    before('save sessions', function (done) {

      Promise.all([
        this.store.set('get-1', { name: 'tj', cookie: { maxAge: 10000 } }, (err, first) => first),
        this.store.set('get-2', { name: 'tj', cookie: { maxAge: -20000 } }, (err, second) => second)
      ])
      .then(() => done());

    });

    it('should fetch a session', function (done) {

      Promise.all([
        this.store.get('get-1', (err, first) => first)
      ])
      .then(sessions => {
        const first = sessions[0];

        expect(first).to.exist.and.to.have.property('cookie').and.to.have.property('maxAge').and.to.eql(10000);

      })
      .then(() => done());

    });

    it('should remove an expired session', function (done) {

      Promise.all([
        this.store.get('get-2', (err, second) => second)
      ])
      .then(sessions => {
        const second = sessions[0];

        expect(second).to.not.exist;
      })
      .then(() => done());

    });
  });

  describe('.destroy()', function () {
    before('save sessions', function (done) {

      Promise.all([
        this.store.set('destroy-1', { name: 'tj', cookie: { maxAge: 10000 } }),
        this.store.set('destroy-2', { name: 'tj', cookie: { maxAge: 20000 } })
      ])
      .then(() => done());

    });

    it('should remove a session', function (done) {
      this.store.destroy('destroy-1')
        .then(() => {

          Promise.all([
            this.store.get('destroy-1', (err, first) => first),
            this.store.get('destroy-2', (err, second) => second)
          ])
          .then(sessions => {
            const first = sessions[0];
            const second = sessions[1];

            expect(first).to.not.exist;
            expect(second).to.exist.and.to.have.property('cookie').and.to.have.property('maxAge').and.to.eql(20000);
          })
          .then(() => done());

        });
    });
  });

  describe('.reap()', function () {
    before('save sessions', function (done) {

      Promise.all([
        this.store.set('reap-1', { name: 'tj', cookie: { maxAge: -10000 } }),
        this.store.set('reap-2', { name: 'tj', cookie: { maxAge: 20000 } }),
        this.store.set('reap-3', { name: 'tj', cookie: { maxAge: -30000 } })
      ])
      .then(() => done());

    });

    it('should remove expired sessions', function (done) {
      this.store.reap()
        .then(() => {

          Promise.all([
            this.store.get('reap-1', (err, first) => first),
            this.store.get('reap-2', (err, second) => second),
            this.store.get('reap-3', (err, third) => third)
          ])
          .then(sessions => {
            const first = sessions[0];
            const second = sessions[1];
            const third = sessions[2];

            expect(first).to.not.exist;
            expect(second).to.exist.and.to.have.property('cookie').and.to.have.property('maxAge').and.to.eql(20000);
            expect(third).to.not.exist;
          })
          .then(() => done());

      });
    });
  });

  describe('.touch()', function () {
    before('save sessions', function (done) {

      Promise.all([
        this.store.set('touch-1', { name: 'tj', cookie: { maxAge: 10000 } }),
        this.store.set('touch-2', { name: 'tj', cookie: { maxAge: 20000 } })
      ])
      .then(() => done());

    });

    it('should update a session', function (done) {

      this.store.touch('touch-1', { name: 'bn', cookie: { maxAge: 30000 } })
        .then(() => {

          Promise.all([
            this.store.get('touch-1', (err, first) => first),
            this.store.get('touch-2', (err, second) => second)
          ])
          .then(sessions => {
            const first = sessions[0];
            const second = sessions[1];

            expect(first).to.exist.and.to.have.property('name').and.to.eql('tj');
            expect(first).to.exist.and.to.have.property('cookie').and.to.have.property('maxAge').and.to.eql(30000);

            expect(second).to.exist.and.to.have.property('name').and.to.eql('tj');
            expect(second).to.exist.and.to.have.property('cookie').and.to.have.property('maxAge').and.to.eql(20000);
          })
          .then(() => done());

        });

    });
  });

  describe('.clear()', function () {
    before('save sessions', function (done) {

      Promise.all([
        this.store.set('clear-1', { name: 'tj', cookie: { maxAge: 10000 } }),
        this.store.set('clear-2', { name: 'tj', cookie: { maxAge: 20000 } })
      ])
      .then(() => done());

    });

    it('should remove all sessions', function (done) {
      this.store.clear()
        .then(() => {

          Promise.all([
            this.store.get('clear-1', (err, first) => first),
            this.store.get('clear-2', (err, second) => second)
          ])
          .then(sessions => {
            const first = sessions[0];
            const second = sessions[1];

            expect(first).to.not.exist;
            expect(second).to.not.exist;
          })
          .then(() => done());

        });
    });
  });
});
