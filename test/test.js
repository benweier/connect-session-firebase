/* global describe, it, before */
const host = 'xxx.firebaseio.com';
const authToken = 'xxxxx';

const should = require('should');
const session = require('express-session');
const FirebaseStore = require(__dirname + '/../lib/connect-firebase.js')(session);

describe('FirebaseStore', () => {
  this.timeout(0);

  describe('Instantiation', () => {
    it('should be able to be created', () => {
      const store = new FirebaseStore({
        host: host,
        token: authToken
      });

      store.should.be.an.instanceOf(FirebaseStore);
    });
  });

  describe('Setting', () => {
    it('should store data correctly', done => {
      const store = new FirebaseStore({
        host: host
      });

      store.set('1234_#$[]', {
        cookie: {
          maxAge: 2000
        },
        name: 'tj'
      }, (err, res) => {
        if (err) throw err;

        done();
      });
    });
  });

  describe('Getting', () => {
    before(() => {
      const store = new FirebaseStore({
        host: host
      });

      store.set('1234', {
        cookie: {
          maxAge: 2000
        },
        name: 'tj'
      }, () => {});
    });

    it('should get data correctly', done => {
      const store = new FirebaseStore({
        host: host
      });

      store.get('1234', (err, res) => {
        if (err) throw err;

        res.cookie.should.eql({
          maxAge: 2000
        });
        res.name.should.eql('tj');

        done();
      });
    });
  });

  describe('Destroying', () => {
    before(() => {
      const store = new FirebaseStore({
        host: host
      });

      store.set('12345', {
        cookie: {
          maxAge: 2000
        },
        name: 'tj'
      }, () => {});
    });

    it('should destroy data correctly', done => {
      const store = new FirebaseStore({
        host: host
      });

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
      const store = new FirebaseStore({
        host: host
      });

      store.set('abcd', {
        cookie: {
          maxAge: 2000
        },
        name: 'tj'
      }, () => {});

      store.set('abcdef', {
        cookie: {
          maxAge: 2000
        },
        name: 'tj'
      }, () => {});
    });

    it('should clear sessions correctly', done => {
      const store = new FirebaseStore({
        host: host
      });

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
      const store = new FirebaseStore({
        host: host
      });

      store.set('abcd', {
        cookie: {
          maxAge: -2000
        },
        name: 'tj'
      }, done);
    });

    it('should reap data correctly', done => {
      const store = new FirebaseStore({
        host: host
      });

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
      const store = new FirebaseStore({
        host: host
      });

      store.set('abcd', {
        cookie: {
          maxAge: 2000
        },
        name: 'tj'
      }, done);
    });

    it('should touch data correctly', done => {
      const store = new FirebaseStore({
        host: host
      });

      store.touch('abcd', {
        cookie: {
          maxAge: 3000
        },
        name: 'bn'
      }, function (err) {
        if (err) throw err;

        store.get('abcd', (err, res) => {
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
