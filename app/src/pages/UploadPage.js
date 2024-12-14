import React, { useState, useCallback } from "react";
import axios from "axios";
import { BrowserRouter as Router, Route, Routes, useNavigate } from "react-router-dom";
import { Container, Row, Col, Form, Button, Spinner, Alert } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";

// function HomePage() {
//   const navigate = useNavigate();
//   const dataList = ['React', 'JavaScript', 'Web Development'];

//   const handleButtonClick = () => {
//     navigate('/topics', { state: { list: dataList } });
//   };

//   return (
//     <div style={{ textAlign: 'center', marginTop: '50px' }}>
//       <h1>Welcome to Home Page</h1>
//       <button onClick={handleButtonClick}>Go to Second Page</button>
//     </div>
//   );
// }

function UploadPage() {
    const [files, setFiles] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [outputFileUrl, setOutputFileUrl] = useState(null);
    const [error, setError] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const navigate = useNavigate();


    const handleFileChange = (event) => {
      const newFiles = Array.from(event.target.files);
      setFiles(prevFiles => [...prevFiles, ...newFiles]);
      setError(null);
    };
  
    const handleDragEnter = (event) => {
      event.preventDefault();
      event.stopPropagation();
      setIsDragging(true);
    };
  
    const handleDragLeave = (event) => {
      event.preventDefault();
      event.stopPropagation();
      setIsDragging(false);
    };
  
    const handleDragOver = (event) => {
      event.preventDefault();
      event.stopPropagation();
    };
  
    const handleDrop = useCallback((event) => {
      event.preventDefault();
      event.stopPropagation();
      setIsDragging(false);
  
      const droppedFiles = Array.from(event.dataTransfer.files).filter(
        file => file.type === 'application/pdf'
      );
  
      if (droppedFiles.length > 0) {
        setFiles(prevFiles => [...prevFiles, ...droppedFiles]);
        setError(null);
      }
    }, []);
  
    const removeFile = (indexToRemove) => {
      setFiles(prevFiles => prevFiles.filter((_, index) => index !== indexToRemove));
    };
  
    const handleSubmit = async (event) => {
      event.preventDefault();
      if (files.length === 0) {
        setError("Please upload at least one PDF file.");
        return;
      }
  
      const formData = new FormData();
      files.forEach(file => {
        formData.append("files", file);
      });
  
      setIsLoading(true);
      setOutputFileUrl(null);
      setError(null);
  
      try {
        console.log("Hello");
        const response = await axios.post("http://127.0.0.1:5000/topics", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        console.log(response.data[0]);
        // const blob = new Blob([response.data], { type: "application/pdf" });
        // const url = window.URL.createObjectURL(blob);
        // setOutputFileUrl(url);
        navigate('/topics', { state: { list: response.data } });
      } catch (err) {
        console.error("Error uploading files:", err);
        setError("An error occurred while processing your request. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };
  
    return (
      <Container className="py-5">
        <Row className="justify-content-center">
          <Col md={8}>
            <div className="text-center mb-4">
              <h1 className="text-primary">Cheat Sheet Generator</h1>
              <p className="text-muted">
                Upload your lecture slides as PDFs and receive a cheat sheet.
              </p>
            </div>
  
            {error && <Alert variant="danger">{error}</Alert>}
  
            <Form onSubmit={handleSubmit}>
              <div
                className={`drop-zone p-5 mb-3 text-center border rounded ${
                  isDragging ? 'border-primary' : 'border-dashed'
                }`}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                style={{
                  backgroundColor: isDragging ? '#e8f4ff' : '#ffffff',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer'
                }}
              >
                <p className="mb-0">
                  Drag & drop PDF files here or
                  <Form.Control
                    type="file"
                    accept=".pdf"
                    multiple
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                    id="fileInput"
                  />
                  <label htmlFor="fileInput" className="text-primary ms-1" style={{ cursor: 'pointer' }}>
                    browse
                  </label>
                </p>
              </div>
  
              {files.length > 0 && (
                <div className="mb-3">
                  <h5>Selected Files:</h5>
                  <ul className="list-group">
                    {files.map((file, index) => (
                      <li key={index} className="list-group-item d-flex justify-content-between align-items-center">
                        {file.name}
                        <Button 
                          variant="outline-danger" 
                          size="sm" 
                          onClick={() => removeFile(index)}
                        >
                          Remove
                        </Button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
  
              <Button 
                type="submit" 
                variant="primary" 
                size="lg" 
                className="w-100" 
                disabled={isLoading || files.length === 0}
              >
                {isLoading ? (
                  <>
                    <Spinner
                      animation="border"
                      size="sm"
                      className="me-2"
                      role="status"
                      aria-hidden="true"
                    />
                    Processing...
                  </>
                ) : (
                  "Generate Cheat Sheet"
                )}
              </Button>
            </Form>
  
            {outputFileUrl && (
              <Alert variant="success" className="mt-4">
                <div className="text-center">
                  <p>Success! Your cheat sheet is ready.</p>
                  <a
                    href={outputFileUrl}
                    download="summarized_notes.pdf"
                    className="btn btn-success"
                  >
                    Download Cheat Sheet
                  </a>
                </div>
              </Alert>
            )}
          </Col>
        </Row>
      </Container>
    );
  }

export default UploadPage;
