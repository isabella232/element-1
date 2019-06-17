const ElementFirestoreAdapter = require("./ElementFirestoreAdapter");

let db;
const dbName = "element-pouchdb.ElementFirestoreAdapter";

beforeAll(async () => {
  db = new ElementFirestoreAdapter({
    name: dbName,
    firebaseAppConfig: {
      apiKey: "AIzaSyB9W9Z5lk0CJKLKuZ5s6gcJ7i1IWZK5wrg",
      authDomain: "element-did.firebaseapp.com",
      databaseURL: "https://element-did.firebaseio.com",
      projectId: "element-did",
      storageBucket: "element-did.appspot.com",
      messagingSenderId: "652808307972",
      appId: "1:652808307972:web:0851286d6827d05c"
    }
  });
  await db.signInAnonymously();
  await db.deleteDB();
});

afterAll(async () => {
  await db.close();
});

describe("ElementFirestoreAdapter", () => {
  const id = "test:123";

  it("constructor takes a db name", () => {
    expect(db.dbName).toBe(dbName);
  });

  describe("write", () => {
    it("write succeeds first time", async () => {
      const record = await db.write(id, {
        foo: 123,
        type: "test:example"
      });
      expect(record.id).toBeDefined;
    });

    // avoid document update conflict.
    it("write succeeds second time", async () => {
      const record = await db.write(id, {
        bar: 456,
        type: "test:example"
      });
      expect(record.id).toBeDefined();
    });
  });

  describe("read", () => {
    it("can read by id", async () => {
      const record = await db.read(id);
      expect(record.bar).toBe(456);
    });
  });

  describe("readCollection", () => {
    it("can read by type", async () => {
      const record = await db.readCollection("test:example");
      expect(record.length).toBe(1);
      expect(record[0].bar).toBe(456);
    });
  });
});