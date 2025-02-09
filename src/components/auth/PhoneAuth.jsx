import React, { useState } from "react";
import {
  getUserByUid,
  setUpRecaptchaAndPhoneSignIn,
  updateUserDocument,
} from "utils/firebase";
import { Button, TextField, Alert } from "icons";
import InputMask from "react-input-mask";
import { Steps } from "antd";
import {
  SmileOutlined,
  SolutionOutlined,
  PhoneOutlined,
} from "@ant-design/icons";
import { Link, useNavigate } from "react-router-dom";
import { message as messageAntd } from "antd";

function PhoneAuth() {
  const navigate = useNavigate();

  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState(null);
  const [fullName, setFullName] = useState("");
  const [createdUser, setCreatedUser] = useState();

  const [verificationObj, setVerificationObj] = useState(); // verification obj after STEP 1
  const [verificationSent, setVerificationSent] = useState(false); //after STEP 1
  const [showValidityError, setShowValidityError] = useState(false); //validity for phone number and otp code
  const [proccessDone, setProccessDone] = useState(false); //after STEP 3
  const [disabledButton, setDisabledButton] = useState(false);

  //STEP 1
  const handleVerification = async () => {
    if (phoneNumber === "") return;
    setDisabledButton(true);

    setUpRecaptchaAndPhoneSignIn(`+${phoneNumber}`)
      .then((res) => {
        setVerificationObj(res);
        setVerificationSent(true);
        setShowValidityError(false);
      })
      .catch((error) => {
        setMessage(error.message);
        setDisabledButton(false);
      });
  };

  // STEP 2
  const verifyOtp = async () => {
    if (otp === "" || otp === null) return;
    try {
      const { user } = await verificationObj.confirm(otp);
      if (user?.phoneNumber) {
        setShowValidityError(false);
        setCreatedUser(user);

        //if user exists step 3 not needed to provide a name
        getUserByUid(user.uid)
          .then((currUser) => {
            if (!!currUser) {
              updateUserDocument(user, {
                status: "online",
              }).then((res) => {
                console.log({ res });
                messageAntd.success("Logged in Successfully");
                localStorage.setItem("userId", user.uid);
                navigate("/");
              });
            } else {
              setProccessDone(true);
            }
          })
          .catch((err) => console.log({ err }));
      }
    } catch (error) {
      switch (error.code) {
        case "auth/code-expired":
          setMessage(
            "Verification code has expired. Please request a new one."
          );
          break;
        case "auth/invalid-verification-code":
          setMessage("Verification code is not correct!");
          break;
        default:
          console.log({ error });
          break;
      }
    }
  };

  //STEP 3
  const goToChating = () => {
    if (fullName.trim() === "") return;
    const user = {
      uid: createdUser.uid,
      displayName: fullName,
      email: createdUser.phoneNumber,
    };

    updateUserDocument(user, {
      status: "online",
    }).then((res) => {
      localStorage.setItem("userId", user.uid);
      messageAntd.success("Logged in Successfully");
      navigate("/");
    });
  };

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
        <Steps
          items={[
            {
              title: "Phone",
              status: "finish",
              icon: <PhoneOutlined />,
            },
            {
              title: "Verify",
              status: verificationSent && "finish",
              icon: <SolutionOutlined />,
            },
            {
              title: "Done",
              status: proccessDone && "finish",
              icon: <SmileOutlined />,
            },
          ]}
        />
        {
          // STEP 3
          proccessDone ? (
            <TextField
              id="standard-basic"
              label="Enter Your Name"
              variant="standard"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              onBlur={() => setShowValidityError(true)}
              onKeyDown={(e) => e.key === "Enter" && goToChating()}
              error={showValidityError && fullName.length < 3}
              helperText={
                showValidityError && fullName.length < 3
                  ? "Please enter a name with at least 3 characters!"
                  : ""
              }
            />
          ) : verificationSent ? ( // STEP 2
            <TextField
              id="otp-input"
              label="Verify OTP"
              variant="outlined"
              InputProps={{
                inputComponent: OtpInputMask,
                value: otp,
                onChange: (e) => setOtp(e.target.value.replace(/\D/g, "")),
                // placeholder: "456-789",
              }}
              onBlur={() => setShowValidityError(true)}
              onKeyDown={(e) => e.key === "Enter" && verifyOtp()}
              error={showValidityError && otp.length !== 6}
              helperText={
                showValidityError && otp.length !== 6
                  ? "Please enter a valid 6-digit OTP code"
                  : ""
              }
            />
          ) : (
            // STEP 1
            <TextField
              id="phone-input"
              label="Phone Number"
              variant="outlined"
              fullWidt
              InputProps={{
                inputComponent: PhoneInputMask,
                value: phoneNumber,
                onChange: (e) =>
                  setPhoneNumber(e.target.value.replace(/\D/g, "")),
              }}
              onBlur={() => setShowValidityError(true)}
              onKeyDown={(e) =>
                e.key === "Enter" && !disabledButton && handleVerification()
              }
              error={showValidityError && phoneNumber.length !== 11}
              helperText={
                showValidityError && phoneNumber.length !== 11
                  ? "Please enter a valid phone number"
                  : ""
              }
            />
          )
        }
        {
          // STEP 3
          proccessDone ? (
            <Button className="greenButton" onClick={goToChating}>
              Go To Chat
            </Button>
          ) : // STEP 2
          verificationSent ? (
            <Button className="greenButton" onClick={verifyOtp}>
              Verify code
            </Button>
          ) : (
            // STEP 1
            <Button
              disabled={disabledButton}
              className="greenButton"
              onClick={handleVerification}
            >
              Send verification code
            </Button>
          )
        }
        {!verificationSent && <div id="recaptcha-container"></div>}
        <span>
          If you want you can <Link to={"/login"}>Login</Link>
        </span>
      </div>
    </div>
  );
}

const PhoneInputMask = (props) => {
  return <InputMask mask="(999) 99-999-999" {...props} />;
};
const OtpInputMask = (props) => {
  return <InputMask mask="9 9 9 9 9 9" {...props} />;
};

export default PhoneAuth;
