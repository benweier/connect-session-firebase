/* global describe, context, it, before, after, afterEach */
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

  afterEach('clear', function (done) {
    this.store.clear()
      .then(done);
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
        this.store.set('1', { name: 'tj', cookie: { maxAge: 1000 } }),
        this.store.set('2', { name: 'tj', cookie: { maxAge: 2000 } })
      ])
      .then(() => {
        done();
      });

    });
  });

  describe('.get()', function () {
    before('save a session', function (done) {

      Promise.all([
        this.store.set('1', { name: 'tj', cookie: { maxAge: 1000 } }, (err, first) => first),
        this.store.set('2', { name: 'tj', cookie: { maxAge: 2000 } }, (err, second) => second)
      ])
      .then(() => {
        done();
      });

    });

    it('should fetch a session', function (done) {

      Promise.all([
        this.store.get('1', (err, first) => first)
      ])
      .then(sessions => {
        const first = sessions[0];
        const second = sessions[1];

        expect(first).to.exist.and.to.have.property('cookie').and.to.have.property('maxAge').and.to.eql(1000);
        expect(second).to.not.exist;

        done();
      });

    });
  });

  describe('.destroy()', function () {
    before('save sessions', function (done) {

      Promise.all([
        this.store.set('1', { name: 'tj', cookie: { maxAge: 1000 } }),
        this.store.set('2', { name: 'tj', cookie: { maxAge: 2000 } })
      ])
      .then(sessions => {
        done();
      });

    });

    it('should remove a session', function (done) {
      this.store.destroy('1')
        .then((err, sessions) => {

          Promise.all([
            this.store.get('1', (err, first) => first),
            this.store.get('2', (err, second) => second)
          ])
          .then(sessions => {
            const first = sessions[0];
            const second = sessions[1];

            expect(first).to.not.exist;
            expect(second).to.exist.and.to.have.property('cookie').and.to.have.property('maxAge').and.to.eql(2000);

            done();
          });

        });
    });
  });

  describe('.clear()', function () {
    before('save sessions', function (done) {

      Promise.all([
        this.store.set('1', { name: 'tj', cookie: { maxAge: 1000 } }),
        this.store.set('2', { name: 'tj', cookie: { maxAge: 2000 } })
      ])
      .then(() => done());

    });

    it('should remove all sessions', function (done) {
      this.store.clear()
        .then(() => {

          Promise.all([
            this.store.get('1', (err, first) => first),
            this.store.get('2', (err, second) => second)
          ])
          .then(sessions => {
            const first = sessions[0];
            const second = sessions[1];

            expect(first).to.not.exist;
            expect(second).to.not.exist;

            done();
          });

        });
    });
  });

  describe('.reap()', function () {
    before('save sessions', function (done) {

      Promise.all([
        this.store.set('1', { name: 'tj', cookie: { maxAge: -1000 } }),
        this.store.set('2', { name: 'tj', cookie: { maxAge: 2000 } }),
        this.store.set('3', { name: 'tj', cookie: { maxAge: -3000 } })
      ])
      .then(() => done());

    });

    it('should remove expired sessions', function (done) {
      this.store.reap()
        .then(() => {

          Promise.all([
            this.store.get('1', (err, first) => first),
            this.store.get('2', (err, second) => second),
            this.store.get('3', (err, third) => third)
          ])
          .then(sessions => {
            const first = sessions[0];
            const second = sessions[1];
            const third = sessions[2];

            expect(first).to.not.exist;
            expect(second).to.exist.and.to.have.property('cookie').and.to.have.property('maxAge').and.to.eql(2000);
            expect(third).to.not.exist;

            done();
          });

      });
    });
  });

  describe('.touch()', function () {
    before('save sessions', function (done) {

      Promise.all([
        this.store.set('1', { name: 'tj', cookie: { maxAge: 1000 } }),
        this.store.set('2', { name: 'tj', cookie: { maxAge: 2000 } })
      ])
      .then(() => done());

    });

    it('should update a session', function (done) {

      this.store.touch('1', { name: 'bn', cookie: { maxAge: 3000 } })
        .then(() => {

          Promise.all([
            this.store.get('1', (err, first) => first),
            this.store.get('2', (err, second) => second)
          ])
          .then(sessions => {
            const first = sessions[0];
            const second = sessions[1];

            expect(first).to.exist.and.to.have.property('name').and.to.eql('tj');
            expect(first).to.exist.and.to.have.property('cookie').and.to.have.property('maxAge').and.to.eql(3000);

            expect(second).to.exist.and.to.have.property('name').and.to.eql('tj');
            expect(second).to.exist.and.to.have.property('cookie').and.to.have.property('maxAge').and.to.eql(2000);

            done();
          });

        });

    });
  });
});
