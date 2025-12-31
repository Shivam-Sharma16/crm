// client/src/pages/pharmacy/PharmacyOrders.jsx
import React from 'react';
import './PharmacyInventory.css'; // Reusing the same CSS for consistency

const PharmacyOrders = () => {
  // Mock Data
  const orders = [
    { id: 'ORD-001', patient: 'John Doe', items: 3, total: 450, status: 'Pending', date: '2024-03-20' },
    { id: 'ORD-002', patient: 'Sarah Smith', items: 1, total: 120, status: 'Processing', date: '2024-03-19' },
    { id: 'ORD-003', patient: 'Mike Ross', items: 5, total: 1250, status: 'Completed', date: '2024-03-18' },
  ];

  return (
    <div className="pharmacy-management-container">
      <div className="pharmacy-header">
        <h1>Order Management</h1>
        <p>View and process incoming medication orders.</p>
      </div>

      <div className="inventory-table-wrapper">
        <table className="inventory-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Patient Name</th>
              <th>Items</th>
              <th>Total Amount</th>
              <th>Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td style={{fontWeight: 'bold', color: '#0A2647'}}>{order.id}</td>
                <td>{order.patient}</td>
                <td>{order.items} items</td>
                <td>₹{order.total}</td>
                <td>{order.date}</td>
                <td>
                  <span className={`status-badge ${
                    order.status === 'Completed' ? 'status-active' : 
                    order.status === 'Pending' ? 'status-low' : 'status-processing'
                  }`} style={order.status === 'Processing' ? {background: '#fef3c7', color: '#b45309'} : {}}>
                    {order.status}
                  </span>
                </td>
                <td>
                  <button className="btn-add" style={{padding: '4px 12px', fontSize: '0.8rem'}}>View</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PharmacyOrders;