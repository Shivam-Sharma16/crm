import React, { useState } from 'react';
import { FaSearch, FaFilePdf, FaCheckCircle, FaUserInjured, FaUserMd, FaCalendarCheck, FaDownload, FaEye, FaVial, FaFilter } from 'react-icons/fa';
import './CompletedReports.css';

// --- DUMMY DATA ---
const COMPLETED_DATA = [
  {
    _id: 'RPT-1001',
    patientId: 'P-2024-001',
    patientName: 'Sarah Jenkins',
    doctorName: 'Dr. Emily Carter',
    tests: ['Complete Blood Count (CBC)', 'Thyroid Profile'],
    completedDate: '2024-03-14T14:30:00',
    status: 'Completed',
    fileSize: '2.4 MB',
    fileName: 'sarah_cbc_thyroid.pdf'
  },
  {
    _id: 'RPT-1002',
    patientId: 'P-2024-045',
    patientName: 'Michael Ross',
    doctorName: 'Dr. James Wilson',
    tests: ['Lipid Profile'],
    completedDate: '2024-03-13T09:15:00',
    status: 'Completed',
    fileSize: '1.1 MB',
    fileName: 'michael_lipid.pdf'
  },
  {
    _id: 'RPT-1003',
    patientId: 'P-2024-089',
    patientName: 'Emma Thompson',
    doctorName: 'Dr. Emily Carter',
    tests: ['Urine Culture', 'Sensitivity Test'],
    completedDate: '2024-03-12T16:45:00',
    status: 'Completed',
    fileSize: '3.5 MB',
    fileName: 'emma_culture_final.pdf'
  },
  {
    _id: 'RPT-1004',
    patientId: 'P-2024-112',
    patientName: 'David Chen',
    doctorName: 'Dr. Alan Grant',
    tests: ['Vitamin D Total'],
    completedDate: '2024-03-10T11:20:00',
    status: 'Completed',
    fileSize: '0.8 MB',
    fileName: 'david_vitd.pdf'
  },
  {
    _id: 'RPT-1005',
    patientId: 'P-2024-156',
    patientName: 'Olivia Martinez',
    doctorName: 'Dr. Sarah Lee',
    tests: ['Liver Function Test (LFT)', 'Kidney Function Test (KFT)'],
    completedDate: '2024-03-09T10:00:00',
    status: 'Completed',
    fileSize: '4.2 MB',
    fileName: 'olivia_organ_panel.pdf'
  }
];

const CompletedReports = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState('');

  // --- Filter Logic ---
  const filteredReports = COMPLETED_DATA.filter(report => {
    const matchesSearch = 
      report.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.patientId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.tests.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesDate = filterDate ? report.completedDate.startsWith(filterDate) : true;

    return matchesSearch && matchesDate;
  });

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="report-page-container">
      {/* --- Header --- */}
      <header className="report-header">
        <div className="header-title">
          <h1><FaCheckCircle className="header-icon"/> Completed Reports</h1>
          <p>Archive of finalized diagnostic reports and patient results.</p>
        </div>
        
        <div className="header-controls">
          <div className="search-group">
            <FaSearch className="search-icon"/>
            <input 
              type="text" 
              placeholder="Search by patient, ID, or test..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="date-filter">
            <input 
              type="date" 
              value={filterDate} 
              onChange={(e) => setFilterDate(e.target.value)}
              className={filterDate ? 'active' : ''}
            />
          </div>
        </div>
      </header>

      {/* --- Stats Row (Optional) --- */}
      <div className="stats-row">
        <div className="stat-card">
          <span className="stat-label">Total Reports</span>
          <span className="stat-value">{COMPLETED_DATA.length}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">This Month</span>
          <span className="stat-value">24</span>
        </div>
      </div>

      {/* --- Reports Grid --- */}
      <div className="reports-grid">
        {filteredReports.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"><FaFilter/></div>
            <h3>No reports found</h3>
            <p>Try adjusting your search filters or date range.</p>
            {(searchTerm || filterDate) && (
              <button className="btn-clear" onClick={() => { setSearchTerm(''); setFilterDate(''); }}>
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          filteredReports.map((report) => (
            <div key={report._id} className="report-card">
              <div className="card-top">
                <div className="patient-meta">
                  <span className="id-badge">{report.patientId}</span>
                  <span className="date-meta"><FaCalendarCheck/> {formatDate(report.completedDate)}</span>
                </div>
                <div className="status-pill success">
                   Done
                </div>
              </div>

              <div className="card-main">
                <div className="info-block">
                  <label><FaUserInjured/> Patient</label>
                  <h3>{report.patientName}</h3>
                </div>
                <div className="info-block">
                  <label><FaUserMd/> Doctor</label>
                  <p>{report.doctorName}</p>
                </div>
                
                <div className="tests-block">
                  <label><FaVial/> Tests Conducted</label>
                  <div className="test-tags">
                    {report.tests.map((test, i) => (
                      <span key={i}>{test}</span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="file-preview">
                <div className="file-icon"><FaFilePdf/></div>
                <div className="file-info">
                  <span className="filename">{report.fileName}</span>
                  <span className="filesize">{report.fileSize}</span>
                </div>
              </div>

              <div className="card-actions">
                <button className="btn-action secondary">
                  <FaEye/> View
                </button>
                <button className="btn-action primary">
                  <FaDownload/> Download
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CompletedReports;