// client/src/pages/pharmacy/PharmacyInventory.jsx
import React, { useState } from 'react';
import './PharmacyInventory.css';

const PharmacyInventory = () => {
  const [medicines, setMedicines] = useState([
    { id: 1, name: 'Paracetamol 500mg', category: 'Pain Relief', stock: 150, price: 50, expiry: '2025-12-01' },
    { id: 2, name: 'Amoxicillin 250mg', category: 'Antibiotics', stock: 45, price: 120, expiry: '2024-10-15' },
    { id: 3, name: 'Vitamin D3', category: 'Supplements', stock: 200, price: 300, expiry: '2026-01-20' },
    { id: 4, name: 'Metformin 500mg', category: 'Diabetes', stock: 80, price: 85, expiry: '2024-08-30' },
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMedicine, setNewMedicine] = useState({ name: '', category: '', stock: '', price: '', expiry: '' });

  const handleAddMedicine = (e) => {
    e.preventDefault();
    const id = medicines.length + 1;
    setMedicines([...medicines, { ...newMedicine, id, stock: Number(newMedicine.stock), price: Number(newMedicine.price) }]);
    setShowAddModal(false);
    setNewMedicine({ name: '', category: '', stock: '', price: '', expiry: '' });
  };

  const filteredMedicines = medicines.filter(med => 
    med.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    med.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="pharmacy-management-container">
      <div className="pharmacy-header">
        <h1>Medicine Inventory</h1>
        <p>Manage stock levels, prices, and expiration dates.</p>
      </div>

      <div className="inventory-controls">
        <div className="search-bar">
          <span className="search-icon">🔍</span>
          <input 
            type="text" 
            placeholder="Search medicines..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="btn-add" onClick={() => setShowAddModal(true)}>
          + Add Medicine
        </button>
      </div>

      <div className="inventory-table-wrapper">
        <table className="inventory-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Medicine Name</th>
              <th>Category</th>
              <th>Stock</th>
              <th>Price (₹)</th>
              <th>Expiry Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredMedicines.map((med) => (
              <tr key={med.id}>
                <td>#{med.id}</td>
                <td className="med-name">{med.name}</td>
                <td><span className="category-tag">{med.category}</span></td>
                <td className={med.stock < 50 ? 'low-stock' : 'good-stock'}>
                  {med.stock} units
                </td>
                <td>₹{med.price}</td>
                <td>{med.expiry}</td>
                <td>
                  <span className={`status-badge ${med.stock < 50 ? 'status-low' : 'status-active'}`}>
                    {med.stock < 50 ? 'Low Stock' : 'In Stock'}
                  </span>
                </td>
                <td>
                  <button className="action-btn edit">✎</button>
                  <button className="action-btn delete">🗑</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Medicine Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Add New Medicine</h2>
              <button className="close-btn" onClick={() => setShowAddModal(false)}>×</button>
            </div>
            <form onSubmit={handleAddMedicine}>
              <div className="form-group">
                <label>Medicine Name</label>
                <input required type="text" value={newMedicine.name} onChange={(e) => setNewMedicine({...newMedicine, name: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Category</label>
                <input required type="text" value={newMedicine.category} onChange={(e) => setNewMedicine({...newMedicine, category: e.target.value})} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Stock Quantity</label>
                  <input required type="number" value={newMedicine.stock} onChange={(e) => setNewMedicine({...newMedicine, stock: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Price (₹)</label>
                  <input required type="number" value={newMedicine.price} onChange={(e) => setNewMedicine({...newMedicine, price: e.target.value})} />
                </div>
              </div>
              <div className="form-group">
                <label>Expiry Date</label>
                <input required type="date" value={newMedicine.expiry} onChange={(e) => setNewMedicine({...newMedicine, expiry: e.target.value})} />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="btn-save">Save Medicine</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PharmacyInventory;