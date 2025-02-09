import React, { useState } from "react";
import "./Login.scss";
import {
  Button,
  TextField,
  Visibility,
  VisibilityOff,
  Alert,
  IconButton,
  InputAdornment,
} from "icons";
import { Link, useNavigate } from "react-router-dom";
import { createUserWithEmailAndPw, updateUserDocument } from "utils/firebase";
import { message as messageAntd } from "antd";

function Register() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState({ value: "", showPassword: false });
  const [confirmPassword, setConfirmPassword] = useState({
    value: "",
    showPassword: false,
  });
  const [message, setMessage] = useState(null);
  const navigate = useNavigate();

  const signUp = async () => {
    if (fullName === "") {
      setMessage("Full Name is empty");
      return;
    }
    if (email === "") {
      setMessage("Email is empty");
      return;
    }
    if (password.value !== confirmPassword.value) {
      setMessage("Password is not the same");
      return;
    }
    if (password.value.length < 6) {
      setMessage("Password is to weak");
      return;
    }

    createUserWithEmailAndPw(email, password.value)
      .then((response) => {
        //returned user has empty displayName field
        const user = { ...response.user, displayName: fullName };
        updateUserDocument(user);
        messageAntd.success("Register successfully done");
        navigate("/login");
      })
      .catch((error) => setMessage(error.message));
  };

  const handleClickShowPassword = (pw, setPw) => {
    setPw({
      ...pw,
      showPassword: !pw.showPassword,
    });
  };

  return (
    <div className="login__container">
      <img src={`${process.env.PUBLIC_URL}/apple-touch-icon.png`} alt="" />
      <div className="login__text">
        <h1>Sign Up to Chat</h1>
      </div>
      <div className="login__fields">
        {message !== null ? <Alert severity="error">{message}</Alert> : ""}
        <TextField
          value={fullName}
          id="standard-basic"
          label="Full Name"
          variant="standard"
          onChange={(e) => setFullName(e.target.value)}
        />
        <TextField
          value={email}
          id="standard-basic"
          label="Email"
          variant="standard"
          onChange={(e) => setEmail(e.target.value)}
        />
        <TextField
          value={password.value}
          name="password"
          type={!password.showPassword ? "password" : "text"}
          label="Password"
          onChange={(e) => setPassword({ value: e.target.value })}
          variant="standard"
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-label="toggle password visibility"
                  onClick={() => handleClickShowPassword(password, setPassword)}
                >
                  {password.showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
        <TextField
          value={confirmPassword.value}
          name="confirmPassword"
          type={!confirmPassword.showPassword ? "password" : "text"}
          label="Confirm Password"
          onChange={(e) => setConfirmPassword({ value: e.target.value })}
          variant="standard"
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-label="toggle password visibility"
                  onClick={() =>
                    handleClickShowPassword(confirmPassword, setConfirmPassword)
                  }
                >
                  {confirmPassword.showPassword ? (
                    <VisibilityOff />
                  ) : (
                    <Visibility />
                  )}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
        <Button className="greenButton" onClick={signUp}>
          Sign Up
        </Button>
        <span>
          Already have an account! <Link to={"/login"}>Login</Link>
        </span>
      </div>
    </div>
  );
}

export default Register;
