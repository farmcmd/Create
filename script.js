/* style.css */

body {
    font-family: 'Noto Sans TC', sans-serif; /* Use Noto Sans TC */
    background-color: #e8f5e9; /* Light green background */
    color: #333; /* Dark grey text */
}

header {
    background-color: #2e7d32; /* Deeper green */
    color: #e8f5e9; /* Light green text */
}

h1, h2, h3 {
    color: #1b5e20; /* Even deeper green for headings */
    font-weight: 700; /* Bold headings */
}

/* Make H1 title more prominent and bright yellow */
h1 {
    font-size: 2.5rem; /* Increased font size */
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3); /* Subtle text shadow */
    color: #ffff00; /* Bright yellow text color */
}


.page-section {
    background-color: #ffffff; /* White background for sections */
    border-radius: 12px; /* More rounded corners */
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); /* Subtle shadow */
}

/* Custom styles for map container */
#map {
    height: 500px; /* Adjust height as needed */
    min-height: 300px; /* Ensure a minimum height on smaller screens */
    width: 100%;
    border-radius: 0.75rem; /* More rounded corners */
    z-index: 1; /* Ensure map is below modals */
    border: 2px solid #a5d6a7; /* Light green border */
}

/* Style for modals */
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(46, 125, 50, 0.7); /* Semi-transparent green overlay */
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000; /* High z-index to be on top */
}

.modal-content {
    background-color: #e8f5e9; /* Light green modal background */
    padding: 2rem;
    border-radius: 0.75rem;
    max-width: 90%;
    max-height: 90%;
    overflow-y: auto;
    position: relative;
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2); /* More prominent shadow */
}

.close-button {
    position: absolute;
    top: 1rem;
    right: 1rem;
    font-size: 1.8rem; /* Larger close button */
    cursor: pointer;
    color: #1b5e20; /* Dark green close button */
}

/* Simple animation for tips */
@keyframes pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.02); } /* Subtle pulse */
    100% { transform: scale(1); }
}

.animate-pulse-subtle {
    animation: pulse 2s infinite ease-in-out;
}

/* Hide sections initially */
.page-section {
    display: none;
}

/* Ensure images within modal fit */
.modal-content img {
    max-width: 100%;
    height: auto;
    margin-top: 1.5rem; /* Increased margin */
    border-radius: 0.5rem;
    border: 1px solid #a5d6a7; /* Light green border for images */
}

 /* Custom marker style if needed (requires advanced techniques for emojis) */
 /* For now, using default markers or simple text overlays */

 /* Style for clickable list items */
 .clickable-list-item {
     cursor: pointer;
     padding: 0.75rem; /* Increased padding */
     border-radius: 0.5rem;
     transition: background-color 0.3s ease-in-out; /* Slower transition */
     display: flex; /* Use flexbox to align name, icons, and navigation link */
     align-items: center;
     justify-content: space-between; /* Space out content */
     border-bottom: 1px solid #c8e6c9; /* Light green separator */
 }

 .clickable-list-item:hover {
     background-color: #dcedc8; /* Lighter green on hover */
 }

 .selected-activity-item {
     background-color: #a5d6a7; /* Medium green */
     font-weight: bold;
     border-left: 4px solid #388e3c; /* Darker green highlight */
     padding-left: calc(0.75rem - 4px); /* Adjust padding */
 }

 /* Add visual indicators for selected POI list items */
 .poi-list-item-start {
     border-left: 4px solid #fbc02d; /* Yellow for start */
     padding-left: calc(0.75rem - 4px); /* Adjust padding to keep alignment */
 }

 .poi-list-item-end {
     border-left: 4px solid #66bb6a; /* Green for end */
      padding-left: calc(0.75rem - 4px); /* Adjust padding to keep alignment */
 }

 /* Style for social media icons and navigation icon in list */
 .icon-group {
     display: flex;
     align-items: center;
 }

 .social-icon, .navigation-icon, .log-trip-icon {
     margin-left: 0.75rem; /* Increased margin */
     color: #4caf50; /* Green icons */
     font-size: 1.1em; /* Slightly larger icon */
     transition: color 0.2s ease-in-out;
 }
  .social-icon:hover, .navigation-icon:hover, .log-trip-icon:hover {
      color: #1b5e20; /* Darker green on hover */
  }
 .navigation-icon {
     color: #3949ab; /* Indigo for navigation */
 }
 .log-trip-icon {
     color: #ef6c00; /* Orange for log trip */
     cursor: pointer;
 }


 /* Style for selectable action items */
 .selectable-action-item {
     cursor: pointer;
     padding: 0.75rem; /* Increased padding */
     border-radius: 0.5rem;
     transition: background-color 0.2s ease-in-out, border-color 0.2s ease-in-out;
     border: 1px solid #a5d6a7; /* Light green border */
     margin-bottom: 0.5rem; /* Increased margin between items */
 }

 .selectable-action-item:hover {
     background-color: #dcedc8; /* Lighter green on hover */
 }

 .selectable-action-item.selected {
     background-color: #81c784; /* Medium green */
     border-color: #388e3c; /* Dark green border */
     font-weight: bold;
     color: #1b5e20; /* Dark green text */
 }

/* Style for action log list items */
 .action-log-item {
     background-color: #c8e6c9; /* Even lighter green */
     padding: 0.75rem; /* Increased padding */
     border-radius: 0.5rem;
     margin-bottom: 0.75rem;
     border-left: 5px solid #4caf50; /* Green border */
 }
 .action-log-item p {
     margin: 0;
 }
  .action-log-item .timestamp {
     font-size: 0.85rem; /* Slightly larger timestamp */
     color: #555; /* Dark grey */
     margin-top: 0.4rem;
 }
 .action-log-item .log-type {
     font-size: 1rem; /* text-base */
     font-weight: bold;
     color: #1b5e20; /* Dark green */
     margin-bottom: 0.4rem;
 }

 /* Style for POI modal content */
 .poi-modal-content-body h4 {
     font-weight: bold;
     margin-top: 1.5rem; /* Increased margin */
     margin-bottom: 0.75rem;
     color: #1b5e20; /* Dark green */
 }
 .poi-modal-content-body p {
     margin-bottom: 0.75rem;
 }

 /* Style for activity modal image */
 #activity-modal-image {
     display: block; /* Ensure image is on its own line */
     margin: 1.5rem auto; /* Center image and add vertical margin */
     max-width: 100%; /* Ensure image fits within modal */
     height: auto;
     border-radius: 0.5rem;
     border: 1px solid #a5d6a7; /* Light green border */
 }

 /* Style for log trip modal transport options */
 #log-trip-transport-options button {
     padding: 0.6rem 1.2rem; /* Increased padding */
     border: 1px solid #a5d6a7; /* Light green border */
     border-radius: 0.5rem;
     margin-right: 0.6rem;
     margin-bottom: 0.6rem;
     cursor: pointer;
     transition: background-color 0.2s ease-in-out, border-color 0.2s ease-in-out;
     background-color: #ffffff; /* White background */
     color: #333;
 }
  #log-trip-transport-options button:hover {
      background-color: #dcedc8; /* Lighter green on hover */
      border-color: #81c784; /* Medium green border on hover */
  }
  #log-trip-transport-options button.selected {
      background-color: #81c784; /* Medium green */
      border-color: #388e3c; /* Dark green border */
      font-weight: bold;
      color: #1b5e20; /* Dark green text */
  }

/* Styling for checkboxes in downloaded HTML */
.download-checkbox-group {
    margin-top: 20px;
    padding: 15px;
    border: 1px solid #ccc;
    border-radius: 5px;
    background-color: #fff;
}
.download-checkbox-group label {
    display: block; /* Each label on a new line */
    margin-bottom: 10px;
    cursor: pointer; /* Keep cursor pointer for visual indication */
    color: #333;
}
 .download-checkbox-group input[type="checkbox"] {
     margin-right: 8px;
     cursor: pointer; /* Keep cursor pointer */
     transform: scale(1.2); /* Slightly larger checkbox */
     vertical-align: middle; /* Align checkbox vertically with text */
 }
 /* Style for disabled checkboxes */
.download-checkbox-group input[type="checkbox"]:disabled {
    cursor: not-allowed; /* Indicate non-interactiveness */
    opacity: 0.7; /* Visually indicate disabled state */
}

/* Tailwind adjustments for better fit with theme */
.bg-green-700 { background-color: #2e7d32; } /* Deeper green header */
.text-green-700 { color: #2e7d32; } /* Deeper green text */
.bg-green-50 { background-color: #e8f5e9; } /* Light green background */
.text-green-800 { color: #1b5e20; } /* Even deeper green text */
.bg-green-100 { background-color: #dcedc8; } /* Lighter green for transport buttons */
.hover:bg-green-200:hover { background-color: #c5e1a5; } /* Hover state for transport buttons */
.text-green-600 { color: #43a047; } /* Green for stats/status */
.bg-blue-500 { background-color: #1976d2; } /* Keep blue for links/buttons */
.hover:bg-blue-600:hover { background-color: #1565c0; }
.bg-purple-600 { background-color: #6a1b9a; } /* Keep purple for download */
.hover:bg-purple-700:hover { background-color: #4a148c; }
 .bg-yellow-50 { background-color: #fff9c4; } /* Light yellow for tips */
 .border-yellow-500 { border-color: #fbc02d; } /* Yellow border for tips */
 .text-yellow-800 { color: #f5f717; } /* Darker yellow text for tips */ /* Corrected yellow text color */
 .text-yellow-900 { color: #e65100; } /* Even darker yellow text for tips */
.bg-blue-50 { background-color: #e3f2fd; } /* Light blue for THSR info */
.border-blue-500 { border-color: #2196f3; } /* Blue border for THSR info */
.text-blue-800 { color: #0d47a1; } /* Dark blue text for THSR info */
.bg-gray-100 { background-color: #f5f5f5; } /* Light grey for contrast */
.bg-gray-50 { background-color: #fafafa; } /* Even lighter grey */
.border-gray-200 { border-color: #eeeeee; }
.bg-gray-200 { background-color: #e0e0e0; } /* Grey for map container header */
 .bg-gray-300 { background-color: #bdbdbd; } /* Darker grey for map header/footer */
 .text-gray-700 { color: #616161; } /* Grey text */
 .text-gray-600 { color: #757575; } /* Lighter grey text */
 .text-blue-600 { color: #1e88e5; } /* Blue links */
 .hover:underline:hover { text-decoration: underline; }
 .text-red-600 { color: #e53935; } /* Red for errors */
 .bg-yellow-500 { background-color: #fbc02d; } /* Yellow for start button */
 .hover:bg-yellow-600:hover { background-color: #f9a825; }
 .bg-emerald-500 { background-color: #66bb6a; } /* Green for end button */
 .hover:bg-emerald-600:hover { background-color: #558b2f; }
 .bg-green-600 { background-color: #43a047; } /* Green for calculate button */
 .hover:bg-green-700:hover { background-color: #388e3c; }
 .bg-orange-600 { background-color: #ef6c00; } /* Orange for log trip button */
 .hover:bg-orange-700:hover { background-color: #e65100; }
 .text-orange-700 { color: #ef6c00; } /* Orange text */

/* Adjusted max-height for POI list */
.max-h-\[600px\] {
    max-height: 70vh; /* Use viewport height for better responsiveness */
}
