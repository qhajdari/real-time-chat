import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  sendPasswordResetEmail,
  signInWithRedirect,
} from "firebase/auth";

import {
  doc,
  getDoc,
  setDoc,
  getDocs,
  collection,
  updateDoc,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";

import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytes,
} from "firebase/storage";
import { auth, db, storage } from "utils/firebase";

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

//function to login with google
export const signInWithGooglePopup = () =>
  signInWithPopup(auth, googleProvider).catch((error) => {
    switch (error.code) {
      case "auth/popup-closed-by-user":
        throw new Error("Login Popup Closed by User!");
      case "auth/popup-blocked":
        throw new Error("Login Popup Blocked!");
      default:
        console.log(error);
        throw error;
    }
  });

//function to login with google
export const signInWithGoogleRedirect = () =>
  signInWithRedirect(auth, googleProvider).catch((error) => {
    throw error;
    // switch (error.code) {
    //   case "123":
    //     throw new Error("");
    //   default:
    //     console.log(error);
    //     throw error;
    // }
  });

//function to login with phone number
export const setUpRecaptchaAndPhoneSignIn = async (number) => {
  const recaptchaVerifier = new RecaptchaVerifier(
    "recaptcha-container",
    {},
    auth
  );
  recaptchaVerifier.render();

  return signInWithPhoneNumber(auth, number, recaptchaVerifier).catch(
    (error) => {
      switch (error.code) {
        case "auth/invalid-phone-number":
          throw new Error("This phone number is invalid!");
        case "auth/too-many-requests":
          throw new Error("Too many Requests!");
        case "auth/argument-error":
          throw new Error("Argument error! Try again after refreshing page!");
        default:
          console.log(error);
          throw error;
      }
    }
  );
};

//function to login with email and password
export const createUserWithEmailAndPw = async (email, password) => {
  if (!email || !password) return;
  return createUserWithEmailAndPassword(auth, email, password).catch(
    (error) => {
      switch (error.code) {
        case "auth/email-already-in-use":
          throw new Error("This email is already in use");
        case "auth/invalid-email":
          throw new Error("Provided email is invalid");
        case "auth/network-request-failed":
          throw new Error("Network error");
        default:
          console.log(error);
          throw error;
      }
    }
  );
};
export const sigInWithEmailAndPw = async (email, password) => {
  if (!email || !password) return;

  return signInWithEmailAndPassword(auth, email, password).catch((error) => {
    switch (error.code) {
      case "auth/wrong-password":
        throw new Error("Password is incorrect!");
      case "auth/user-not-found":
        throw new Error("This user does not exist!");
      case "auth/invalid-email":
        throw new Error("Email is invalid!");
      case "auth/too-many-requests":
        throw new Error(
          "Access to this account has been temporarily disabled due to many failed login attempts. You can immediately restore it by resetting your password or you can try again later."
        );
      default:
        console.log({ error });
        throw error;
    }
  });
};

//
export const getUserByUid = async (userId) => {
  const userDocRef = doc(db, "users", userId);
  const userSnapshot = await getDoc(userDocRef);
  return userSnapshot.data();
};

export const getUserByEmail = async (email) => {
  const userQuery = query(collection(db, "users"), where("email", "==", email));
  const querySnapshot = await getDocs(userQuery);

  if (querySnapshot.empty) {
    throw new Error("User not found");
  } else {
    let result = [];
    querySnapshot.forEach((doc) => {
      result.push(doc.data());
    });
    return result[0];
  }
};

export const getAllUsers = async () => {
  const usersDoc = await getDocs(collection(db, "users"));
  const documents = [];
  usersDoc.forEach((doc) => documents.push(doc.data()));
  return documents;
};

//function to save logged in user data in db
export const updateUserDocument = async (
  userAuth,
  additionalInformation = {}
) => {
  if (!userAuth) return;

  const userDocRef = doc(db, "users", userAuth.uid);
  // const userDocRef = doc(db, "users", userAuth.email);
  const userSnapshot = await getDoc(userDocRef);

  if (userSnapshot.exists()) {
    try {
      await updateDoc(userDocRef, {
        ...additionalInformation,
      });
    } catch (error) {
      console.error("Error while saving user", error);
    }
  } else {
    const { displayName, email } = userAuth;
    try {
      await setDoc(userDocRef, {
        displayName,
        email,
        contacts: [],
        createdAt: Date.now(),
        ...additionalInformation,
      });
    } catch (error) {
      console.error("Error while saving user", error);
    }
  }
};

export const changeUserPassword = async (currPw, newPw) => {
  const user = auth.currentUser;
  const credential = EmailAuthProvider.credential(user.email, currPw);
  try {
    await reauthenticateWithCredential(user, credential);
    updatePassword(user, newPw);
  } catch (error) {
    switch (error.code) {
      case "auth/wrong-password":
        throw new Error("Incorrect password entered!");
      default:
        console.log(error);
        throw error;
    }
  }
};

export const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    switch (error.code) {
      case "auth/invalid-email":
        throw new Error("Provided email is invalid");
      case "auth/user-not-found":
        throw new Error("This email does not exists");
      default:
        console.log(error);
        throw error;
    }
  }
};

export const uploadImage = (email, file, fileName) => {
  // Create a reference to the file in Firebase storage
  const imageRef = ref(storage, `profileImages/${email}/${fileName}`);

  const imgURL = uploadBytes(imageRef, file).then(async (snapshot) => {
    return await getDownloadURL(snapshot.ref);
  });
  return imgURL;
};

export const deleteImage = (imageSrc) => {
  const imageRef = ref(storage, imageSrc);
  // Delete the image file
  return deleteObject(imageRef);
};

//listen changes for all users
export const usersDataChanges = (callback) => {
  return onSnapshot(collection(db, "users"), (snapshot) => {
    console.log("users updated");
    getAllUsers().then((res) => {
      callback(res);
    });
  });
};

//listen changes for only given users
export const myUsersDataChanges = (emails, callback) => {
  const myQuery = query(collection(db, "users"), where("email", "in", emails));
  return onSnapshot(myQuery, async (snapshot) => {
    console.log("MY Users updated");
    const usersArr = snapshot.docs.map((doc) => doc.data());
    callback(usersArr);
  });
};
