import React, { useState } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import { Alert, Form, Button, Spinner } from "react-bootstrap";
import Dropdown from "../components/Dropdown.js";

// I used chatgpt and perplexity ai to help with the formatting and the initial formation of the page. 

function TopicsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { list } = location.state || { list: [] };
  console.log(list);

  const [outputFileUrl, setOutputFileUrl] = useState(null);

  // Build dropdownData from the components of the input list
  const dropdownData = [];
  for (const slides in list) {
    dropdownData.push({ id: slides, items: list[slides] });
  }

  // State to store selected items for each dropdown
  const [selectedItems, setSelectedItems] = useState(
    dropdownData.reduce((acc, dropdown) => {
      acc[dropdown.id] = []; // Initialize each dropdown with an empty array
      return acc;
    }, {})
  );

  // Function to handle selected items from a dropdown
  const handleSelect = (checkedItems, dropdownId) => {
    const selected = Object.keys(checkedItems).filter((item) => checkedItems[item]);

    // Update the selected items for the specific dropdown
    setSelectedItems((prevSelectedItems) => ({
      ...prevSelectedItems,
      [dropdownId]: selected,
    }));
  };

  const handleBack = () => {
    navigate('/');
  };

  // Function to handle the submission and send the POST request
  const handleSubmit = async () => {
    // Make selectedItems into a 2d array
    var submit = [];
    for (const slide in selectedItems) {
      submit.push(selectedItems[slide]);
    }
    // TODO: Make a post request and receive the pdf back
    const response = await axios.post("http://127.0.0.1:5000/download", selectedItems, {
      headers: { "Content-Type": "application/json" },
    });
    console.log(response.data[0]);
    const blob = new Blob([response.data], { type: "application/pdf" });
    const url = window.URL.createObjectURL(blob);
    setOutputFileUrl(url);
    console.log(submit);
  };

  const backButtonStyle = {
    position: 'absolute',
    top: '20px',
    left: '20px',
    padding: '10px 20px',
    fontSize: '16px',
    color: '#007bff',
    backgroundColor: '#fff',
    border: '2px solid #007bff',
    borderRadius: '5px',
    cursor: 'pointer',
    transition: 'all 0.3s ease'
  };

  // New state for issue reporting and loading
  const [issueText, setIssueText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Updated function to handle issue submission
  const handleIssueSubmit = async () => {
    if (issueText.trim()) {
      setIsSubmitting(true);
      try {
        // Replace with your actual API endpoint for submitting issues
        const response = await axios.post("http://127.0.0.1:5000/issue", { issue: issueText });
        setIssueText(''); // Clear the textbox after submission
        console.log(response.data[0]);
        const blob = new Blob([response.data], { type: "application/pdf" });
        const url = window.URL.createObjectURL(blob);
        setOutputFileUrl(url);
        setIssueText(''); // Clear the textbox after submission
      } catch (error) {
        console.error("Error submitting issue:", error);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="container-fluid py-5 position-relative">
      <button 
        onClick={handleBack}
        style={backButtonStyle}
        onMouseOver={(e) => {
          e.target.style.backgroundColor = '#007bff';
          e.target.style.color = '#fff';
        }}
        onMouseOut={(e) => {
          e.target.style.backgroundColor = '#fff';
          e.target.style.color = '#007bff';
        }}
      >
        ← Back
      </button>

      <div className="row justify-content-center">
        <div className="col-md-8">
          <h1 className="text-center mb-5 fw-bold">Select Topics to Include</h1>

          {dropdownData.map((dropdown) => (
            <div key={dropdown.id} className="mb-4">
              <Dropdown
                items={dropdown.items}
                dropdownId={dropdown.id}
                onSelect={handleSelect}
              />
            </div>
          ))}

          <div className="text-center mt-5">
            <button
              onClick={handleSubmit}
              className="btn btn-primary btn-lg px-5 py-3 fw-bold"
            >
              Generate Cheat Sheet
            </button>
          </div>

          {outputFileUrl && (
            <Alert variant="success" className="mt-5">
              <div className="text-center">
                <h4 className="alert-heading mb-3">Success!</h4>
                <p className="mb-3">Your cheat sheet is ready for download.</p>
                <a
                  href={outputFileUrl}
                  download="summarized_notes.pdf"
                  className="btn btn-success btn-lg px-4 mb-4"
                >
                  Download Cheat Sheet
                </a>

                {/* Updated section for reporting issues */}
                <hr />
                <h5 className="mt-4 mb-3">Any issues? Tell ChatGPT</h5>
                <Form>
                  <Form.Group className="mb-3" controlId="issueForm">
                    <Form.Control
                      as="textarea"
                      rows={3}
                      value={issueText}
                      onChange={(e) => setIssueText(e.target.value)}
                      placeholder="Describe your issue here..."
                    />
                  </Form.Group>
                  <Button 
                    variant="secondary" 
                    onClick={handleIssueSubmit}
                    disabled={!issueText.trim() || isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Spinner
                          as="span"
                          animation="border"
                          size="sm"
                          role="status"
                          aria-hidden="true"
                        />
                        <span className="ms-2">Submitting...</span>
                      </>
                    ) : (
                      'Submit Issue'
                    )}
                  </Button>
                </Form>
              </div>
            </Alert>
          )}
        </div>
      </div>
    </div>
  );
}

export default TopicsPage;
