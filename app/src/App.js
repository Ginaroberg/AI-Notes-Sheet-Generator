import React, { useState, useCallback } from "react";
import axios from "axios";
import { BrowserRouter as Router, Route, Routes, useNavigate } from "react-router-dom";
import { Container, Row, Col, Form, Button, Spinner, Alert } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";

import UploadPage from "./pages/UploadPage";
import TopicsPage from "./pages/TopicsPage";



// function TopicsPage() {
  
// }

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<UploadPage />} />
        <Route path="/topics" element={<TopicsPage />} />
      </Routes>
    </Router>
  );
}

export default App;