import "@testing-library/jest-dom";

jest.mock("firebase/app", () => ({
  initializeApp: jest.fn(() => ({
    name: "mockedApp",
  })),
}));

jest.mock("firebase/auth", () => {
  return {
    GoogleAuthProvider: jest.fn().mockImplementation(() => ({
      setCustomParameters: jest.fn(),
    })),
    signInWithPopup: jest.fn(),
    signInWithRedirect: jest.fn(),
    getAuth: jest.fn(() => ({
      currentUser: { uid: "mockedUserId" },
    })),
  };
});

jest.mock("firebase/messaging", () => ({
  getMessaging: jest.fn(() => ({
    onMessage: jest.fn(),
  })),
  getToken: jest.fn(() => Promise.resolve("mocked_token")),
  onMessage: jest.fn((messagingInstance, callback) =>
    callback({ notification: { title: "Mock Notification" } })
  ),
}));

jest.mock("firebase/firestore", () => ({
  doc: jest.fn(),
  setDoc: jest.fn(() => Promise.resolve()),
  getFirestore: jest.fn(() => ({})),
  onSnapshot: jest.fn((docRef, callback) =>
    callback({ exists: true, data: () => ({ chats: [] }) })
  ),
}));

jest.mock("firebase/storage", () => ({
  getStorage: jest.fn(() => ({})),
}));
