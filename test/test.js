const firebase = require('firebase-admin')
const session = require('express-session')
const FirebaseStore = require('../lib/connect-session-firebase.js')(session)

require('dotenv').config({
  silent: true,
})

describe('FirebaseStore', () => {
  beforeAll(() => {
    this.firebase = firebase.initializeApp({
      credential: firebase.credential.cert(process.env.FIREBASE_SERVICE_ACCOUNT),
      databaseURL: process.env.FIREBASE_DATABASE_URL,
    })
    this.store = new FirebaseStore({
      database: this.firebase.database(),
    })
  })

  afterAll(() => {
    this.firebase.delete()
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
      const sessions = await Promise.all([
        this.store.set('set-1', {
          name: 'tj',
          maxAge: 10000,
        }),
        this.store.set('set-2', {
          name: 'tj',
          maxAge: 20000,
        }),
      ])
        .then(() => true)
        .catch(() => false)

      expect(sessions).toBe(true)
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
      ]))

    it('should return an active session', async () => {
      const sessions = await Promise.resolve(this.store.get('get-1', (err, first) => first))

      expect(sessions).toEqual({
        name: 'tj',
        cookie: {
          maxAge: 10000,
        },
      })
    })

    it('should remove an expired session', async () => {
      const sessions = await Promise.resolve(this.store.get('get-2', (err, second) => second))

      expect(sessions).toBeUndefined()
    })
  })

  describe('.destroy()', () => {
    beforeAll(async () => {
      await Promise.all([
        this.store.set('destroy-1', {
          name: 'tj',
          cookie: { maxAge: 10000 },
        }),
        this.store.set('destroy-2', {
          name: 'tj',
          cookie: { maxAge: 20000 },
        }),
      ])
    })

    it('should remove a session', async () => {
      await this.store.destroy('destroy-1')

      const sessions = await Promise.all([
        this.store.get('destroy-1', (err, first) => first),
        this.store.get('destroy-2', (err, second) => second),
      ])

      const [first, second] = sessions

      expect(first).toBeUndefined()
      expect(second).toEqual({
        name: 'tj',
        cookie: {
          maxAge: 20000,
        },
      })
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
      ]))

    it('should remove all expired sessions', async () => {
      await this.store.reap()

      const sessions = await Promise.all([
        this.store.get('reap-1', (err, first) => first),
        this.store.get('reap-2', (err, second) => second),
        this.store.get('reap-3', (err, third) => third),
      ])

      const [first, second, third] = sessions

      expect(first).toBeUndefined()
      expect(second).toEqual({
        name: 'tj',
        cookie: {
          maxAge: 20000,
        },
      })
      expect(third).toBeUndefined()
    })
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
      ]))

    it('should update a session', async () => {
      await Promise.resolve(
        this.store.touch('touch-1', {
          name: 'bn',
          cookie: { maxAge: 30000 },
        }),
      )

      const sessions = await Promise.all([
        this.store.get('touch-1', (err, first) => first),
        this.store.get('touch-2', (err, second) => second),
      ])

      const [first, second] = sessions

      expect(first).toEqual({
        name: 'tj',
        cookie: { maxAge: 30000 },
      })
      expect(second).toEqual({
        name: 'tj',
        cookie: { maxAge: 20000 },
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
      ]))

    it('should remove all sessions', async () => {
      await this.store.clear()

      const sessions = await Promise.all([
        this.store.get('clear-1', (err, first) => first),
        this.store.get('clear-2', (err, second) => second),
      ])

      const [first, second] = sessions

      expect(first).toBeUndefined()
      expect(second).toBeUndefined()
    })
  })
})
