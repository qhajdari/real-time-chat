import React, { useState } from "react";
import { Button, TextField, Alert } from "icons";

import { Link, useNavigate } from "react-router-dom";
import { message as messageAntd } from "antd";
import { resetPassword } from "utils/firebase";

function ResetPassword() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [message, setMessage] = useState(null);

  const resetPasswordHandler = () => {
    resetPassword(email)
      .then((res) => {
        setEmail("");
        messageAntd.success("Password Reset Link Sent");
        navigate("/login");
      })
      .catch((error) => setMessage(error.message));
  };

  return (
    <div className="login__container">
      <img
        src={`${process.env.PUBLIC_URL}/apple-touch-icon.png`}
        alt="ChatIcon"
      />
      <div className="login__text">
        <h1>Reset Password</h1>
      </div>
      <div className="login__fields">
        {message !== null ? <Alert severity="error">{message}</Alert> : ""}
        <TextField
          value={email}
          id="standard-basic"
          label="Email"
          variant="standard"
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && resetPasswordHandler()}
        />
        <Button
          disabled={email.trim() === ""}
          className="greenButton"
          onClick={resetPasswordHandler}
        >
          Send Reset Link
        </Button>
        <span>or</span>
        <span>
          <Link to={"/login"}>Login</Link>
        </span>
      </div>
    </div>
  );
}

export default ResetPassword;
