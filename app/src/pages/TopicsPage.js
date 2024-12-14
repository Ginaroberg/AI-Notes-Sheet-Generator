import React, {useState} from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import {Alert} from "react-bootstrap"
import Dropdown from "../components/Dropdown.js"

function TopicsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { list } = location.state || { list: [] };
  console.log(list)

  const [outputFileUrl, setOutputFileUrl] = useState(null);


  // Build dropdownData from the components of the input list
  const dropdownData = [];
  for (const slides in list) {
    dropdownData.push({ id: slides, items: list[slides]});
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
  }

  // Function to handle the submission and send the POST request
  const handleSubmit = async () => {
    // Make selectedItems into a 2d array
    var submit = []
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
                  className="btn btn-success btn-lg px-4"
                >
                  Download Cheat Sheet
                </a>
              </div>
            </Alert>
          )}
        </div>
      </div>
    </div>
  );
};


export default TopicsPage;
