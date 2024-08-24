import React, { useState } from "react";
import { styled } from "@mui/material/styles";
import Button from "@mui/material/Button";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";

const VisuallyHiddenInput = styled("input")({
  clip: "rect(0 0 0 0)",
  clipPath: "inset(50%)",
  height: 1,
  overflow: "hidden",
  position: "absolute",
  bottom: 0,
  left: 0,
  whiteSpace: "nowrap",
  width: 1,
});

function PassportInstruction({
    setPreviewPassport,
    handleComplete,
    setSelectedFile
}) {

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
        setSelectedFile(file);
        setPreviewPassport(URL.createObjectURL(file)); // Create a preview URL
        handleComplete();
    }
    // setSelectedFile(event.target.files[0]);
  };
  return (
    <div>
      <img
        src={`${process.env.PUBLIC_URL}/images/atm_pp_reader.png`}
        style={{ width: "230px", height: "400px" }}
        alt="Example"
      />
      <h2>Please insert your passport into the Passport Reader.</h2>
      <Button
        component="label"
        role={undefined}
        variant="contained"
        tabIndex={-1}
        startIcon={<CloudUploadIcon />}
      >
        Upload file
        <VisuallyHiddenInput onChange={handleFileChange} accept="image/*" type="file" />
      </Button>
    </div>
  );
}

export default PassportInstruction;
