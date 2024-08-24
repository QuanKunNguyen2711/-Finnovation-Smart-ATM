import React, { useRef, useEffect, useState } from "react";
import Webcam from "react-webcam";
import { axiosInstance } from "../axios/AxiosClient";
import { CardMedia, Typography } from "@mui/material";
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";

function LivenessDetection({ croppedFace }) {
  const webcamRef = useRef(null);
  const [box, setBox] = useState(null);
  const [myInterval, setMyInterval] = useState(null);
  const [isRunning, setIsRunning] = useState(true);
  const [croppedLiveFace, setCroppedLiveFace] = useState(null);
  const [targetSize, setTargetSize] = useState({ width: 160, height: 160 });
  const [similarity, setSimilarity] = useState(null);

  const sendFrame = async (imageSrc) => {
    await axiosInstance
      .post("/detect-live-face", {
        image: imageSrc,
        target_size: [targetSize.width, targetSize.height],
      })
      .then((response) => {
        if (response.data.x) {
          setBox(response.data);
          if (response.data?.cropped_live_face && response.data?.similarity) {
            setCroppedLiveFace(response.data.cropped_live_face);
            setSimilarity(response.data.similarity);
            setIsRunning(false);
            setBox(null);
          }
        } else {
          setBox(null);
        }
      })
      .catch((error) => {
        console.log(error);
        clearInterval(myInterval);
      });
  };
  useEffect(() => {
    const interval = setInterval(() => {
      if (webcamRef.current && isRunning) {
        const imageSrc = webcamRef.current.getScreenshot();
        if (imageSrc) {
          sendFrame(imageSrc);
        }
      }
    }, 100);

    setMyInterval(interval);

    return () => clearInterval(interval);
  }, [isRunning]);
  return (
    <div style={{ display: "flex", justifyContent: "center" }}>
      <div style={{ position: "relative", width: "320px" }}>
        {isRunning && (
          <div>
            <Webcam
              audio={false}
              ref={webcamRef}
              mirrored={true}
              screenshotQuality={1}
              screenshotFormat="image/jpeg"
              width={320}
            />
            <h2>
              Please stand in front of the camera for collecting facial
              biometrics.
            </h2>
          </div>
        )}

        {box && isRunning && (
          <div
            style={{
              position: "absolute",
              border: "2px solid red",
              left: `${box.x}px`,
              top: `${box.y}px`,
              width: `${box.width}px`,
              height: `${box.height}px`,
              boxSizing: "border-box",
            }}
          />
        )}

        {croppedLiveFace && croppedFace && !isRunning && (
          <>
            <div style={{ display: "flex" }}>
              <CardMedia
                component="img"
                sx={{ width: 160, height: 160, objectFit: "cover" }}
                src={croppedLiveFace}
                alt="Passport Photo"
              />
              <CardMedia
                component="img"
                sx={{ width: 160, height: 160, objectFit: "cover" }}
                src={croppedFace}
                alt="Passport Photo"
              />
              {/* <img src={croppedLiveFace} alt="Cropped Live Face" /> */}
              {/* <img src={croppedFace} alt="Cropped Face" /> */}
            </div>
            <Typography variant="body2" color="text.secondary" style={{ marginTop: 10 }}>
              <strong>Similarity Score:</strong> {similarity}
            </Typography>
            {similarity > 0.5 ? (
              <>
                <Alert severity="success" style={{ marginTop: 20 }}>
                  <AlertTitle>Success</AlertTitle>
                  Your identity has been successfully verified.
                </Alert>
              </>
            ) : (
              <>
                <Alert severity="error" style={{ marginTop: 20 }}>
                  <AlertTitle>Error</AlertTitle>
                  Your identity cannot be verified.
                </Alert>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default LivenessDetection;
