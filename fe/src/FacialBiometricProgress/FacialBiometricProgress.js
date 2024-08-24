import * as React from "react";
import { styled } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Stepper from "@mui/material/Stepper";
import Step from "@mui/material/Step";
import StepButton from "@mui/material/StepButton";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import Grid from "@mui/material/Unstable_Grid2";
import PassportInstruction from "./PassportInstruction";
import PassportExtraction from "./PassportExtraction";
import LivenessDetection from "./LivenessDetection";

const steps = ["Passport Insertion", "Passport Review", "Facial Biometrics Collection"];

const Item = styled(Paper)(({ theme }) => ({
  backgroundColor: theme.palette.mode === "dark" ? "#1A2027" : "#fff",
  ...theme.typography.body2,
  padding: theme.spacing(1),
  textAlign: "center",
  color: theme.palette.text.secondary,
}));

export default function FacialBiometricProgress() {
  const [activeStep, setActiveStep] = React.useState(0);
  const [completed, setCompleted] = React.useState({});
  const [previewPassport, setPreviewPassport] = React.useState();
  const [selectedFile, setSelectedFile] = React.useState();
  const [croppedFace, setCroppedFace] = React.useState(null);

  const totalSteps = () => {
    return steps.length;
  };

  const completedSteps = () => {
    return Object.keys(completed).length;
  };

  const isLastStep = () => {
    return activeStep === totalSteps() - 1;
  };

  const allStepsCompleted = () => {
    return completedSteps() === totalSteps();
  };

  const handleNext = () => {
    const newActiveStep =
      isLastStep() && !allStepsCompleted()
        ? steps.findIndex((step, i) => !(i in completed))
        : activeStep + 1;
    setActiveStep(newActiveStep);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleStep = (step) => () => {
    setActiveStep(step);
  };

  const handleComplete = () => {
    const newCompleted = completed;
    newCompleted[activeStep] = true;
    setCompleted(newCompleted);
    handleNext();
  };

  const handleLastComplete = () => {
    const newCompleted = completed;
    newCompleted[activeStep] = true;
    setCompleted(newCompleted);
  };

  const handleReset = () => {
    setActiveStep(0);
    setCompleted({});
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 1:
        return (
          <PassportInstruction
            setPreviewPassport={setPreviewPassport}
            handleComplete={handleComplete}
            setSelectedFile={setSelectedFile}
          />
        );
      case 2:
        return (
          <PassportExtraction
            previewPassport={previewPassport}
            selectedFile={selectedFile}
            handleComplete={handleComplete}
            croppedFace={croppedFace}
            setCroppedFace={setCroppedFace}
          />
        );
      case 3:
        return <LivenessDetection croppedFace={croppedFace}/>;
    }
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Grid container spacing={3}>
        <Grid xs>{/* <Item>xs</Item> */}</Grid>
        <Grid xs={8}>
          <Item>
            <Stepper nonLinear activeStep={activeStep}>
              {steps.map((label, index) => (
                <Step key={label} completed={completed[index]}>
                  <StepButton color="inherit" onClick={handleStep(index)}>
                    <h2>{label}</h2>
                  </StepButton>
                </Step>
              ))}
            </Stepper>
            <div>
              {allStepsCompleted() ? (
                <React.Fragment>
                  <Typography sx={{ mt: 2, mb: 1 }}>
                    All steps completed - you&apos;re finished
                  </Typography>
                  <Box sx={{ display: "flex", flexDirection: "row", pt: 2 }}>
                    <Box sx={{ flex: "1 1 auto" }} />
                    <Button onClick={handleReset}>Reset</Button>
                  </Box>
                </React.Fragment>
              ) : (
                <React.Fragment>
                  <Typography sx={{ mt: 2, mb: 1, py: 1, height: "550px" }}>
                    {renderStepContent(activeStep + 1)}
                  </Typography>
                </React.Fragment>
              )}
            </div>
          </Item>
        </Grid>
        <Grid xs>{/* <Item>xs</Item> */}</Grid>
      </Grid>
    </Box>
  );
}
