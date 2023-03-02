const firebase = require('firebase-admin')
const session = require('express-session')
const FirebaseStore = require('../lib/connect-session-firebase')(session)

require('dotenv').config({
  silent: true,
})

describe('FirebaseStore', () => {
  beforeAll(() => {
    this.firebase = firebase.initializeApp({
      credential: firebase.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY,
      }),
      databaseURL: process.env.FIREBASE_DATABASE_URL,
    })
    this.store = new FirebaseStore({
      database: this.firebase.database(),
    })
  })

  afterAll(async () => {
    await this.firebase.delete()
  })

  it('should return an instance of FirebaseStore when passed a Firebase app', () => {
    const store = new FirebaseStore({
      database: this.firebase,
    })

    expect(store).toBeInstanceOf(FirebaseStore)
  })

  it('should return an instance of FirebaseStore when passed a Firebase database', () => {
    const store = new FirebaseStore({
      database: this.firebase.database(),
    })

    expect(store).toBeInstanceOf(FirebaseStore)
  })

  it('should set a reap interval', () => {
    const validInterval = new FirebaseStore({
      database: this.firebase.database(),
      reapInterval: 86400,
    })
    const invalidInterval = new FirebaseStore({
      database: this.firebase.database(),
      reapInterval: 'never',
    })

    expect(validInterval).toEqual(
      expect.objectContaining({
        reapInterval: 86400,
      }),
    )
    expect(invalidInterval).toEqual(
      expect.objectContaining({
        reapInterval: 21600000,
      }),
    )
  })

  it('should set a reap callback', () => {
    const reapCallback = jest.fn()
    const validCallback = new FirebaseStore({
      database: this.firebase.database(),
      reapCallback,
    })
    const invalidCallback = new FirebaseStore({
      database: this.firebase.database(),
      reapCallback: null,
    })

    expect(validCallback).toEqual(
      expect.objectContaining({
        reapCallback,
      }),
    )
    expect(invalidCallback).toEqual(
      expect.objectContaining({
        reapCallback: expect.any(Function),
      }),
    )
  })

  it('should throw an error when passed invalid arguments', () => {
    expect(() => new FirebaseStore()).toThrow('Invalid FirebaseStore argument')
    expect(() => new FirebaseStore({})).toThrow('Invalid FirebaseStore argument')
    expect(() => new FirebaseStore({ database: [] })).toThrow('Invalid Firebase reference')
    expect(() => new FirebaseStore({ database: {} })).toThrow('Invalid Firebase reference')
  })

  describe('.set()', () => {
    it('should save a session', async () => {
      const fn = jest.fn()
      const sessions = Promise.resolve(
        this.store.set(
          'set',
          {
            name: 'tj',
            maxAge: 10000,
          },
          fn,
        ),
      )

      expect(await sessions).toBeUndefined()
    })
  })

  describe('.get()', () => {
    beforeAll(() =>
      Promise.all([
        this.store.set(
          'get-1',
          {
            name: 'tj',
            cookie: { maxAge: 10000 },
          },
          (err, first) => first,
        ),
        this.store.set(
          'get-2',
          {
            name: 'tj',
            cookie: { maxAge: -20000 },
          },
          (err, second) => second,
        ),
      ]),
    )

    it('should return an active session', async () => {
      const sessions = Promise.resolve(this.store.get('get-1', (err, first) => first))

      expect(await sessions).toEqual({
        name: 'tj',
        cookie: {
          maxAge: 10000,
        },
      })
    })

    it('should remove an expired session', async () => {
      const sessions = Promise.resolve(this.store.get('get-2', (err, second) => second))

      expect(await sessions).toBeUndefined()
    })
  })

  describe('.destroy()', () => {
    beforeAll(() =>
      Promise.all([
        this.store.set('destroy', {
          name: 'tj',
          cookie: { maxAge: 10000 },
        }),
      ]),
    )

    it('should remove a session', () => {
      const fn = jest.fn()

      this.store.destroy('destroy').then(() =>
        Promise.resolve(this.store.get('destroy', fn)).then((sessions) => {
          expect(sessions).toBeUndefined()
          expect(fn).toHaveBeenCalled()
        }),
      )
    })
  })

  describe('.reap()', () => {
    beforeAll(() =>
      Promise.all([
        this.store.set('reap-1', {
          name: 'tj',
          cookie: { maxAge: -10000 },
        }),
        this.store.set('reap-2', {
          name: 'tj',
          cookie: { maxAge: 20000 },
        }),
        this.store.set('reap-3', {
          name: 'tj',
          cookie: { maxAge: -30000 },
        }),
      ]),
    )

    it('should remove all expired sessions', () =>
      this.store.reap().then(() =>
        Promise.all([
          this.store.get('reap-1', (err, first) => first),
          this.store.get('reap-2', (err, second) => second),
          this.store.get('reap-3', (err, third) => third),
        ]).then((sessions) => {
          const [first, second, third] = sessions

          expect(first).toBeUndefined()
          expect(second).toEqual({
            name: 'tj',
            cookie: {
              maxAge: 20000,
            },
          })
          expect(third).toBeUndefined()
        }),
      ))
  })

  describe('.touch()', () => {
    beforeAll(() =>
      Promise.all([
        this.store.set('touch-1', {
          name: 'tj',
          cookie: { maxAge: 10000 },
        }),
        this.store.set('touch-2', {
          name: 'tj',
          cookie: { maxAge: 20000 },
        }),
      ]),
    )

    it('should update a session', () => {
      const fn = jest.fn()

      return Promise.all([
        this.store.touch('touch-1', {
          name: 'bn',
          cookie: { maxAge: 30000 },
        }),
        this.store.touch(
          'touch-3',
          {
            name: 'bn',
            cookie: { maxAge: 30000 },
          },
          fn,
        ),
      ]).then(() => {
        Promise.all([
          this.store.get('touch-1', (err, first) => first),
          this.store.get('touch-2', (err, second) => second),
        ]).then((sessions) => {
          const [first, second] = sessions

          expect(first).toEqual({
            name: 'tj',
            cookie: { maxAge: 30000 },
          })
          expect(second).toEqual({
            name: 'tj',
            cookie: { maxAge: 20000 },
          })
          expect(fn).toHaveBeenCalled()
        })
      })
    })
  })

  describe('.clear()', () => {
    beforeAll(() =>
      Promise.all([
        this.store.set('clear-1', {
          name: 'tj',
          cookie: { maxAge: 10000 },
        }),
        this.store.set('clear-2', {
          name: 'tj',
          cookie: { maxAge: 20000 },
        }),
      ]),
    )

    it('should remove all sessions', () => {
      const fn = jest.fn()

      this.store.clear().then(() =>
        Promise.all([this.store.get('clear-1', fn), this.store.get('clear-2', fn)]).then((sessions) => {
          const [first, second] = sessions

          expect(first).toBeUndefined()
          expect(second).toBeUndefined()
        }),
      )
    })
  })
})
