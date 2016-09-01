/* global describe, it, before, after */
'use strict';

const path = require('path');
const lint = require('mocha-eslint');
const expect = require('chai').expect;
const session = require('express-session');
const firebase = require('firebase');
const FirebaseStore = require(path.normalize(`${__dirname}/../index.js`))(session);

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

  after(() => {
    store.clear();
  });

  describe('Instantiation', () => {
    it('expect valid config to be successful', () => {
      expect(store).to.be.instanceof(FirebaseStore);
    });

    it('expect invalid config to throw an error', () => {
      expect(FirebaseStore).to.throw(Error);
    });
  });

  describe('Setting', () => {
    it('expect session to be saved', done => {
      store.set('1234_#$[]', {
        name: 'tj',
        cookie: { maxAge: 2000 }
      }, (err, res) => {
        done();
      });
    });
  });

  describe('Getting', () => {
    before(() => {
      store.set('1234', {
        name: 'tj',
        cookie: { maxAge: 2000 }
      }, () => {});
    });

    it('expect session to be fetched', done => {
      store.get('1234', (err, res) => {
        expect(res.name).to.eql('tj');
        expect(res.cookie).to.have.property('maxAge').and.to.eql(2000);

        done();
      });
    });
  });

  describe('Destroying', () => {
    before(() => {
      store.set('12345', {
        name: 'tj',
        cookie: { maxAge: 2000 }
      }, () => {});
    });

    it('expect a session to be removed', done => {
      store.destroy('12345', (err, res) => {
        store.get('12345', (err, res) => {
          expect(res).to.not.exist;
          done();
        });
      });
    });
  });

  describe('Clearing', () => {
    before(() => {
      store.set('abcd', {
        name: 'tj',
        cookie: { maxAge: 2000 }
      }, () => {});

      store.set('abcdef', {
        name: 'tj',
        cookie: { maxAge: 2000 }
      }, () => {});
    });

    it('expect all sessions to be removed', done => {
      store.clear((err, res) => {
        store.get('abcd', (err, res) => {
          expect(res).to.not.exist;
          store.get('abcdef', (err, res) => {
            expect(res).to.not.exist;
            done();
          });
        });
      });
    });
  });

  describe('Reaping', () => {
    before(done => {
      store.set('abcd', {
        name: 'tj',
        cookie: { maxAge: -2000 }
      }, done);
    });

    it('expect old sessions to be removed', done => {
      store.reap((err, res) => {
        store.get('abcd', (err, res) => {
          expect(res).to.not.exist;
          done();
        });
      });
    });
  });

  describe('Touching', () => {
    before(done => {
      store.set('abcd', {
        name: 'tj',
        cookie: { maxAge: 2000 }
      }, done);
    });

    it('expect sessions to be updated', done => {
      store.touch('abcd', {
        name: 'bn',
        cookie: { maxAge: 3000 }
      }, err => {
        store.get('abcd', (err, res) => {
          expect(res.name).to.eql('tj');
          expect(res.cookie).to.have.property('maxAge').and.to.eql(3000);

          done();
        });
      });
    });
  });
});
