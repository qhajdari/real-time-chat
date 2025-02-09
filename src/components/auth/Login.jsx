import React, { useEffect, useRef, useState } from "react";
import "./Login.scss";
import { Link, useNavigate } from "react-router-dom";
import {
  auth,
  sigInWithEmailAndPw,
  signInWithGooglePopup,
  updateUserDocument,
} from "utils/firebase";
import { message as messageAntd } from "antd";
import {
  Button,
  IconButton,
  TextField,
  Alert,
  InputAdornment,
  GoogleIcon,
  PhoneIcon,
  Visibility,
  VisibilityOff,
} from "icons";
import { useMediaQuery } from "react-responsive";
import { signInWithGoogleRedirect } from "utils/firebase/firebaseUsers";
import { getRedirectResult } from "firebase/auth";

function Login() {
  const navigate = useNavigate();
  const passwordRef = useRef(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState({ value: "", showPassword: false });
  const [message, setMessage] = useState(null);
  const [disabledSignIn, setDisabledSignIn] = useState(false);

  //display error message only for 5 seconds
  useEffect(() => {
    if (message !== null) {
      setTimeout(() => setMessage(null), 5000);
    }
  }, [message]);

  const signInWithEmailPw = async () => {
    if (email === "") {
      setMessage("Email is empty");
      return;
    }
    if (password.value === "") {
      setMessage("Password is empty");
      return;
    }
    setDisabledSignIn(true);

    sigInWithEmailAndPw(email, password.value)
      .then(({ user }) => {
        updateUserDocument(user, {
          status: "online",
        }).then((res) => {
          localStorage.setItem("userId", user.uid);
          messageAntd.success("Logged in Successfully");
          navigate("/");
        });
      })
      .catch((error) => {
        setDisabledSignIn(false);
        setMessage(error.message);
      });
  };

  // Google Auth for web we use google popup, for Standalone we use google redirect
  const googleSignIn = () => {
    if (!isStandalone) {
      setDisabledSignIn(true);
      signInWithGooglePopup()
        .then((response) => {
          messageAntd.info("Logging in...");
          const { user } = response;
          updateUserDocument(user, {
            status: "online",
          }).then((res) => {
            setDisabledSignIn(false);
            localStorage.setItem("userId", user.uid);
            messageAntd.success("Logged in Successfully");
            navigate("/");
          });
        })
        .catch((error) => {
          setDisabledSignIn(false);
          setMessage(error.message);
        });
    } else {
      setDisabledSignIn(true);
      signInWithGoogleRedirect()
        //remove
        .then((response) => {
          updateUserDocument(
            { uid: "errors" },
            {
              signInWithGoogleRedirectResponse: response,
            }
          );
          setDisabledSignIn(false);
          navigate("/");
        })
        .catch((error) => {
          setDisabledSignIn(false);
          updateUserDocument(
            { uid: "errors" },
            {
              signInWithGoogleRedirect: error,
            }
          );
          setMessage(error.message);
        });
    }
  };

  useEffect(() => {
    getRedirectResult(auth)
      .then((response) => {
        if (response) {
          messageAntd.info("Logging in...");
          const { user } = response;
          updateUserDocument(user, {
            status: "online",
          }).then((res) => {
            setDisabledSignIn(false);
            localStorage.setItem("userId", user.uid);
            messageAntd.success("Logged in Successfully");
            navigate("/");
          });
        }
      })
      //remove
      .catch((error) => {
        updateUserDocument(
          { uid: "errors" },
          {
            getRedirectResult: error,
          }
        );
      });
  }, []);

  const isStandalone = useMediaQuery({ query: "(display-mode: standalone)" }); //this checks if app is saved in homescreen mobile app

  return (
    <div className="login__container">
      <img
        src={`${process.env.PUBLIC_URL}/apple-touch-icon.png`}
        alt="ChatIcon"
      />
      <div className="login__text">
        <h1>Sign in to Chat</h1>
      </div>
      <div className="login__fields">
        {message !== null ? <Alert severity="error">{message}</Alert> : ""}
        <TextField
          value={email}
          id="standard-basic"
          label="Email"
          variant="standard"
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && passwordRef.current.focus()}
        />
        <TextField
          inputRef={passwordRef}
          value={password.value}
          name="password"
          type={!password.showPassword ? "password" : "text"}
          label="Password"
          onChange={(e) => setPassword({ value: e.target.value })}
          variant="standard"
          onKeyDown={(e) => e.key === "Enter" && signInWithEmailPw()}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-label="toggle password visibility"
                  onClick={() => {
                    setPassword({
                      ...password,
                      showPassword: !password.showPassword,
                    });
                  }}
                >
                  {password.showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
        <Button
          disabled={disabledSignIn}
          className="greenButton"
          onClick={signInWithEmailPw}
        >
          Sign In
        </Button>

        <span>or</span>

        <div style={{ display: "flex", gap: "5px" }}>
          {!isStandalone && (
            <Button
              disabled={disabledSignIn}
              variant="outlined"
              onClick={googleSignIn}
              startIcon={<GoogleIcon />}
              className="orButton"
            >
              Google
            </Button>
          )}
          <Button
            variant="outlined"
            disabled={disabledSignIn}
            startIcon={<PhoneIcon />}
            onClick={() => navigate("/phone-login")}
            className="orButton"
          >
            Phone
          </Button>
        </div>

        <span>
          Don't have an account! <Link to={"/register"}>Register</Link>
        </span>
        <span>
          <Link to={"/reset-password"}>Forgot password?</Link>
        </span>
      </div>
    </div>
  );
}

export default Login;
