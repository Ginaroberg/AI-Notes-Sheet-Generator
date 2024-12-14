import React, { useState } from "react";

const DropdownChecklist = ({ items, onSelect, dropdownId }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [checkedItems, setCheckedItems] = useState({});

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleCheckboxChange = (item) => {
    setCheckedItems((prevCheckedItems) => {
      const newCheckedItems = { ...prevCheckedItems, [item]: !prevCheckedItems[item] };
      // Send the updated checked items to the parent via onSelect
      onSelect(newCheckedItems, dropdownId);
      return newCheckedItems;
    });
  };

  return (
    <div style={{ width: "100%", display: "flex", justifyContent: "center", marginTop: "20px" }}>
      <div style={{ width: "80%" }}>
        {/* Dropdown Bar */}
        <div
          onClick={toggleDropdown}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "15px 20px",
            backgroundColor: "#007BFF",
            color: "#FFF",
            cursor: "pointer",
            borderRadius: "5px",
            boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
            fontSize: "18px",
          }}
        >
          <span>{dropdownId}</span>
          <span style={{ fontSize: "18px" }}>
            {isDropdownOpen ? "▲" : "▼"}
          </span>
        </div>

        {/* Checklist */}
        {isDropdownOpen && (
          <div
            style={{
              marginTop: "5px",
              padding: "10px",
              border: "1px solid #ccc",
              borderRadius: "5px",
              backgroundColor: "#f9f9f9",
              boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
            }}
          >
            {items.map((item) => (
              <div key={item} style={{ marginBottom: "8px" }}>
                <label style={{ display: "flex", alignItems: "center" }}>
                  <input
                    type="checkbox"
                    checked={checkedItems[item] || false}
                    onChange={() => handleCheckboxChange(item)}
                    style={{ marginRight: "10px" }}
                  />
                  {item}
                </label>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DropdownChecklist;
