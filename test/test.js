/* global describe, it, before */
const path = require('path');
const should = require('should');
const session = require('express-session');
const FirebaseStore = require(path.normalize(`${__dirname}/../lib/connect-session-firebase.js`))(session);

const options = {
  database: {
    serviceAccount: process.env.FIREBASE_SERVICE_ACCOUNT,
    databaseURL: process.env.FIREBASE_DATABASE_URL
  }
};

describe('FirebaseStore', () => {
  describe('Instantiation', () => {
    it('should be able to be created', () => {
      const store = new FirebaseStore(options);

      store.should.be.an.instanceOf(FirebaseStore);
    });
  });

  describe('Setting', () => {
    it('should store data correctly', done => {
      const store = new FirebaseStore(options);

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
      const store = new FirebaseStore(options);

      store.set('1234', {
        name: 'tj',
        cookie: {
          maxAge: 2000
        }
      }, () => {});
    });

    it('should get data correctly', done => {
      const store = new FirebaseStore(options);

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
      const store = new FirebaseStore(options);

      store.set('12345', {
        name: 'tj',
        cookie: {
          maxAge: 2000
        }
      }, () => {});
    });

    it('should destroy data correctly', done => {
      const store = new FirebaseStore(options);

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
      const store = new FirebaseStore(options);

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
      const store = new FirebaseStore(options);

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
      const store = new FirebaseStore(options);

      store.set('abcd', {
        name: 'tj',
        cookie: {
          maxAge: -2000
        }
      }, done);
    });

    it('should reap data correctly', done => {
      const store = new FirebaseStore(options);

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
      const store = new FirebaseStore(options);

      store.set('abcd', {
        name: 'tj',
        cookie: {
          maxAge: 2000
        }
      }, done);
    });

    it('should touch data correctly', done => {
      const store = new FirebaseStore(options);

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
