/* global describe, it, before */
'use strict';

const fs = require('fs');
const path = require('path');
const should = require('should');
const session = require('express-session');
const FirebaseStore = require(path.normalize(`${__dirname}/../lib/connect-session-firebase.js`))(session);

require('dotenv').config({ silent: true });

const store = new FirebaseStore({
  database: {
    serviceAccount: process.env.FIREBASE_SERVICE_ACCOUNT,
    databaseURL: process.env.FIREBASE_DATABASE_URL
  }
});

describe('FirebaseStore', function () {
  this.timeout(10000);

  after(() => {
    store.clear();
  });

  describe('Instantiation', () => {
    it('should be able to be created', () => {
      store.should.be.an.instanceOf(FirebaseStore);
    });
  });

  describe('Setting', () => {
    it('should set data correctly', done => {
      store.set('1234_#$[]', {
        name: 'tj',
        cookie: {
          maxAge: 2000
        }
      }, (err, res) => {
        if (err) throw err;

        done();
      });
    });
  });

  describe('Getting', () => {
    before(() => {
      store.set('1234', {
        name: 'tj',
        cookie: {
          maxAge: 2000
        }
      }, () => {});
    });

    it('should get data correctly', done => {
      store.get('1234', (err, res) => {
        if (err) throw err;

        res.name.should.eql('tj');
        res.cookie.should.eql({
          maxAge: 2000
        });

        done();
      });
    });
  });

  describe('Destroying', () => {
    before(() => {
      store.set('12345', {
        name: 'tj',
        cookie: {
          maxAge: 2000
        }
      }, () => {});
    });

    it('should destroy data correctly', done => {
      store.destroy('12345', (err, res) => {
        if (err) throw err;

        store.get('12345', (err, res) => {
          if (err) throw err;

          should.not.exist(res);

          done();
        });
      });
    });
  });

  describe('Clearing', () => {
    before(() => {
      store.set('abcd', {
        name: 'tj',
        cookie: {
          maxAge: 2000
        }
      }, () => {});

      store.set('abcdef', {
        name: 'tj',
        cookie: {
          maxAge: 2000
        }
      }, () => {});
    });

    it('should clear sessions correctly', done => {
      store.clear((err, res) => {
        if (err) throw err;

        store.get('abcd', (err, res) => {
          if (err) throw err;

          should.not.exist(res);

          store.get('abcdef', (err, res) => {
            if (err) throw err;

            should.not.exist(res);

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
        cookie: {
          maxAge: -2000
        }
      }, done);
    });

    it('should reap data correctly', done => {
      store.reap((err, res) => {
        if (err) throw err;

        store.get('abcd', (err, res) => {
          if (err) throw err;

          should.not.exist(res);

          done();
        });
      });
    });
  });

  describe('Touching', () => {
    before(done => {
      store.set('abcd', {
        name: 'tj',
        cookie: {
          maxAge: 2000
        }
      }, done);
    });

    it('should touch data correctly', done => {
      store.touch('abcd', {
        name: 'bn',
        cookie: {
          maxAge: 3000
        }
      }, function (err) {
        if (err) throw err;

        store.get('abcd', (err, res) => {
          if (err) throw err;

          res.name.should.eql('tj');
          res.cookie.should.eql({
            maxAge: 3000
          });

          done();
        });
      });
    });
  });
});
