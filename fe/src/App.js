import "./App.css";
import FacialBiometricProgress from "./FacialBiometricProgress/FacialBiometricProgress";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import MenuIcon from "@mui/icons-material/Menu";

function App() {
  return (
    <>
      <Box sx={{ flexGrow: 1 }}>
        <AppBar
          position="static"
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Toolbar variant="dense">
            <Box
              component="img"
              src={`${process.env.PUBLIC_URL}/images/UOB_logo.png`}
              alt="Logo"
              sx={{ height: 40, marginRight: 2 }} // Adjust height and spacing
            />
            <Typography variant="h3" color="inherit" component="div">
              Smart ATM
            </Typography>
          </Toolbar>
        </AppBar>
      </Box>
      <FacialBiometricProgress />
    </>
  );
}

export default App;
