import React from 'react';
import '../user/Dashboard.css';

const AssignedTests = () => {
  return (
    <div className="dashboard-page">
        <div className="content-wrapper">
            <div className="dashboard-header">
                <h1>Assigned Tests</h1>
            </div>
            <div className="dashboard-column" style={{width: '100%'}}>
                <div className="column-content">
                    {/* Map through pending tests here */}
                    <div className="dashboard-item">
                        <div className="item-header">
                            <span className="status-badge status-pending">Pending</span>
                        </div>
                        <div className="item-body">
                            <h3>Blood Test (CBC) - Patient: John Doe</h3>
                            <button className="view-presc-btn">Upload Report</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};
export default AssignedTests;