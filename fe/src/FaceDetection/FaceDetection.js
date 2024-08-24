import React, { useRef, useEffect, useState } from "react";
import Webcam from "react-webcam";
import { axiosInstance } from "../axios/AxiosClient";

const FaceDetection = () => {
  const webcamRef = useRef(null);
  const [box, setBox] = useState(null);
  const [myInterval, setMyInterval] = useState(null);
  const [isRunning, setIsRunning] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);
  const [croppedFace, setCroppedFace] = useState(null);
  const [croppedLiveFace, setCroppedLiveFace] = useState(null);
  const [status, setStatus] = useState("");
  const [targetSize, setTargetSize] = useState({ width: 160, height: 160 });
  const [similarity, setSimilarity] = useState(null);
  const [passportDetail, setPassportDetail] = useState({});

  const sendFrame = async (imageSrc) => {
    await axiosInstance
      .post("/detect-live-face", {
        image: imageSrc,
        target_size: [targetSize.width, targetSize.height],
      })
      .then((response) => {
        if (response.data.x) {
          setBox(response.data);
          if (response.data.cropped_live_face) {
            console.log(response.data.embedding);
            setCroppedLiveFace(response.data.cropped_live_face);
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

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };


  const handleCalculateSimilarity = async () => {
    await axiosInstance
      .get("/calculate-similarity")
      .then((response) => {
        if (response.data.similarity) {
          setSimilarity(response.data.similarity);
        } else {
          setSimilarity(null);
        }
      })
      .catch((error) => {
        console.log(error);
      });
  };

  const handleExtractPassport = async () => {
    if (selectedFile) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Image = reader.result;
        await axiosInstance
          .post("/extract-passport", {
            image: base64Image,
            target_size: [targetSize.width, targetSize.height],
          })
          .then((response) => {
            if (response.data?.cropped_passport_face && response.data?.passport_detail) {
              setCroppedFace(response.data.cropped_passport_face);
              setPassportDetail(response.data.passport_detail);
              console.log(response.data.passport_detail);
              setStatus("Face detected, cropped, and embedding extracted.");
            } else {
              setStatus("No face detected.");
            }
            if (response.data) {
              console.log(response.data);
              // setCroppedFace(response.data.cropped_passport_face);
              // setStatus("Face detected, cropped, and embedding extracted.");
            } else {
              // setStatus("No face detected.");
            }
          })
          .catch((error) => {
            setStatus("Error processing the image.");
            console.error("Error:", error);
          });
      };
      reader.readAsDataURL(selectedFile);
    }
  }

  //   useEffect(() => {
  //     const token = window.localStorage.getItem("access_token");
  //     const ws = new WebSocket(`ws://localhost:8000/ws?token=${token}`);
  //     ws.onopen = () => {
  //       console.log("Connected to WebSocket server");
  //     };

  //     ws.onmessage = (event) => {
  //       const msg = JSON.parse(event.data);
  //       if (msg.event === 'training_epoch') {
  //         toast.success(
  //             `Epoch: ${msg.epoch}, Train_loss: ${msg.train_loss}, Val_loss: ${msg.val_loss}`,
  //             {
  //               position: "top-right",
  //               autoClose: 3000,
  //               hideProgressBar: false,
  //               closeOnClick: true,
  //               pauseOnHover: false,
  //               draggable: true,
  //               progress: undefined,
  //               theme: "light",
  //             }
  //           );
  //           setEpochs((prev) => [...prev, msg]);
  //       }
  //       else if (msg.event === 'evaluation_metric') {
  //         toast.success(
  //             `Evaluation Metrics - Precision: ${msg.precision}, Recall: ${msg.recall}, F1-Score: ${msg.f1_score}, Accuracy: ${msg.accuracy}.`,
  //             {
  //               position: "top-right",
  //               autoClose: 3000,
  //               hideProgressBar: false,
  //               closeOnClick: true,
  //               pauseOnHover: false,
  //               draggable: true,
  //               progress: undefined,
  //               theme: "light",
  //             }
  //           );
  //           setEvaluationMetric({precision: msg.precision, recall: msg.recall, f1_score: msg.f1_score, accuracy: msg.accuracy});
  //           setConfusionMatrix(msg.confusion_matrix)
  //       }
  //       else if (msg.event === 'early_stopping') {
  //         toast.success(
  //         `Event ${msg.event}: ${msg.early_stopping}`,
  //             {
  //               position: "top-right",
  //               autoClose: 3000,
  //               hideProgressBar: false,
  //               closeOnClick: true,
  //               pauseOnHover: false,
  //               draggable: true,
  //               progress: undefined,
  //               theme: "light",
  //             }
  //           );
  //       }

  //     };

  //     // Clean up WebSocket connection on component unmount
  //     return () => {
  //       ws.close();
  //     };
  //   }, []);

  return (
    <div>
      <div>
        <input type="file" onChange={handleFileChange} accept="image/*" />
        <button onClick={handleExtractPassport}>Extract Passport Data</button>
        {croppedFace && (
          <div>
            <h3>{status}</h3>
            <img
              src={croppedFace}
              alt="Cropped Face"
            />
          </div>
        )}
        {!croppedFace && status && <h3>{status}</h3>}
      </div>
      {isRunning && croppedFace && (
        <Webcam
          audio={false}
          ref={webcamRef}
          mirrored={true}
          screenshotQuality={1}
          screenshotFormat="image/jpeg"
          width={320}
        />
      )}

      {box && croppedFace && isRunning && (
        <div
          style={{
            // position: "absolute",
            border: "2px solid red",
            left: `${box.x}px`,
            top: `${box.y}px`,  
            width: `${box.width}px`,
            height: `${box.height}px`,
          }}
        />
      )}

      {croppedLiveFace && croppedFace && !isRunning && (
        <div>
          <img src={croppedLiveFace} alt="Cropped Live Face" />
        </div>
      )}

    <button onClick={handleCalculateSimilarity}>Calculate similarity</button>
    {similarity && (
      <h4>{similarity}</h4>
    )}
    </div>

  );
};

export default FaceDetection;
