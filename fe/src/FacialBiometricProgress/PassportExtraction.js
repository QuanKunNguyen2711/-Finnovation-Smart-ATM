import React, { useEffect, useState } from "react";
import { axiosInstance } from "../axios/AxiosClient";
import CircularProgress from "@mui/material/CircularProgress";
import Box from "@mui/material/Box";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import CardMedia from "@mui/material/CardMedia";
import Button from "@mui/material/Button";
import { Card } from "@mui/material";

function PassportExtraction({
  previewPassport,
  selectedFile,
  handleComplete,
  croppedFace,
  setCroppedFace,
}) {
  const [passportDetail, setPassportDetail] = useState({});
  const [targetSize, setTargetSize] = useState({ width: 160, height: 160 });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (selectedFile) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Image = reader.result;
        setIsLoading(true);
        await axiosInstance
          .post("/extract-passport", {
            image: base64Image,
            target_size: [targetSize.width, targetSize.height],
          })
          .then((response) => {
            if (
              response.data?.cropped_passport_face &&
              response.data?.passport_detail
            ) {
              setCroppedFace(response.data.cropped_passport_face);
              setPassportDetail(response.data.passport_detail);
              setIsLoading(false);
            }
          })
          .catch((error) => {
            console.error("Error:", error);
          });
      };
      reader.readAsDataURL(selectedFile);
    }
  }, [selectedFile]);
  return (
    <div>
      <div>
        <img
          src={previewPassport}
          alt="Selected"
          style={{ marginTop: "10px", width: "400px", height: "auto" }}
        />
      </div>
      {isLoading && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <CircularProgress />
        </Box>
      )}
      {croppedFace && !isLoading && (
        <>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            <Card
              sx={{
                display: "flex",
                justifyContent: "center",
                boxShadow: 1,
              }}
            >
              <CardMedia
                component="img"
                sx={{ width: 160, height: 160, objectFit: "cover", margin: 2 }}
                src={croppedFace}
                alt="Passport Photo"
              />
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                }}
              >
                <CardContent>
                  <Typography variant="h6" component="div">
                    {`${passportDetail.surname} ${passportDetail.names}`}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Passport Number:</strong> {passportDetail.number}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Sex:</strong> {passportDetail.sex}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Country:</strong> {passportDetail.country}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Date of Birth:</strong>{" "}
                    {passportDetail.date_of_birth}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Expiration Date:</strong>{" "}
                    {passportDetail.expiration_date}
                  </Typography>
                </CardContent>
              </Box>
            </Card>
          </Box>
          <Box sx={{ display: "flex", flexDirection: "row", pt: 2 }}>
            <Box sx={{ flex: "1 1 auto" }} />
            <Button onClick={handleComplete} sx={{ mr: 1 }}>
              Next
            </Button>
          </Box>
        </>
      )}
    </div>
  );
}

export default PassportExtraction;
