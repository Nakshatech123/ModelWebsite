'use client';

import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../AuthProvider';
import styles from './models.module.css';

// SVG Icons
const ModelIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7v10c0 5.55 3.84 9.95 9 11 5.16-1.05 9-5.45 9-11V7l-10-5z"></path></svg>;
const AddIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>;
const EditIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>;
const DeleteIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>;
const UploadIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>;
const CheckIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>;

export default function ModelsPage() {
  const { user } = useContext(AuthContext);
  const [models, setModels] = useState([]);
  const [isAddingModel, setIsAddingModel] = useState(false);
  const [editingModel, setEditingModel] = useState(null);
  const [newModel, setNewModel] = useState({
    name: '',
    description: '',
    category: '',
    detectionClasses: ''
  });

  useEffect(() => {
    fetchModels();
  }, []);

  const fetchModels = async () => {
    try {
      const token = document.cookie.replace(/(?:(?:^|.*;\s*)auth_token\s*\=\s*([^;]*).*$)|^.*$/, "$1");
      const response = await fetch('http://localhost:8000/api/models', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setModels(data);
      }
    } catch (error) {
      console.error('Error fetching models:', error);
    }
  };

  const handleAddModel = async () => {
    try {
      const token = document.cookie.replace(/(?:(?:^|.*;\s*)auth_token\s*\=\s*([^;]*).*$)|^.*$/, "$1");
      const response = await fetch('http://localhost:8000/api/models', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newModel)
      });
      
      if (response.ok) {
        setIsAddingModel(false);
        setNewModel({ name: '', description: '', category: '', detectionClasses: '' });
        fetchModels();
      }
    } catch (error) {
      console.error('Error adding model:', error);
    }
  };

  const handleDeleteModel = async (modelId) => {
    if (window.confirm('Are you sure you want to delete this model?')) {
      try {
        const token = document.cookie.replace(/(?:(?:^|.*;\s*)auth_token\s*\=\s*([^;]*).*$)|^.*$/, "$1");
        const response = await fetch(`http://localhost:8000/api/models/${modelId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          fetchModels();
        }
      } catch (error) {
        console.error('Error deleting model:', error);
      }
    }
  };

  const handleFileUpload = async (event, modelId) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('model_file', file);

    try {
      const token = document.cookie.replace(/(?:(?:^|.*;\s*)auth_token\s*\=\s*([^;]*).*$)|^.*$/, "$1");
      const response = await fetch(`http://localhost:8000/api/models/${modelId}/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      if (response.ok) {
        fetchModels();
        alert('Model file uploaded successfully!');
      }
    } catch (error) {
      console.error('Error uploading model file:', error);
      alert('Error uploading model file');
    }
  };

  return (
    <div className={styles.modelsContainer}>
      <div className={styles.modelsHeader}>
        <div>
          <h1>AI Models Management</h1>
          <p>Manage your detection models for video processing</p>
        </div>
        <button 
          className={styles.addButton}
          onClick={() => setIsAddingModel(true)}
        >
          <AddIcon />
          Add New Model
        </button>
      </div>

      {/* Add New Model Form */}
      {isAddingModel && (
        <div className={styles.addModelForm}>
          <h3>Add New Model</h3>
          <div className={styles.formGrid}>
            <div className={styles.fieldGroup}>
              <label>Model Name</label>
              <input
                type="text"
                value={newModel.name}
                onChange={(e) => setNewModel({...newModel, name: e.target.value})}
                placeholder="e.g., River Detection Model"
              />
            </div>
            <div className={styles.fieldGroup}>
              <label>Category</label>
              <select
                value={newModel.category}
                onChange={(e) => setNewModel({...newModel, category: e.target.value})}
              >
                <option value="">Select Category</option>
                <option value="environmental">Environmental Detection</option>
                <option value="infrastructure">Infrastructure Detection</option>
                <option value="vehicle">Vehicle Detection</option>
                <option value="wildlife">Wildlife Detection</option>
                <option value="general">General Object Detection</option>
                <option value="custom">Custom Detection</option>
              </select>
            </div>
            <div className={styles.fieldGroup}>
              <label>Detection Classes</label>
              <input
                type="text"
                value={newModel.detectionClasses}
                onChange={(e) => setNewModel({...newModel, detectionClasses: e.target.value})}
                placeholder="e.g., river, bridge, pollution, debris"
              />
              <small>Separate multiple classes with commas</small>
            </div>
            <div className={styles.fieldGroup}>
              <label>Description</label>
              <textarea
                value={newModel.description}
                onChange={(e) => setNewModel({...newModel, description: e.target.value})}
                placeholder="Describe what this model detects and its use cases"
                rows="3"
              />
            </div>
          </div>
          <div className={styles.formActions}>
            <button 
              className={styles.saveButton}
              onClick={handleAddModel}
            >
              <CheckIcon />
              Save Model
            </button>
            <button 
              className={styles.cancelButton}
              onClick={() => setIsAddingModel(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Models Grid */}
      <div className={styles.modelsGrid}>
        {models.length === 0 ? (
          <div className={styles.emptyState}>
            <ModelIcon />
            <h3>No Models Added</h3>
            <p>Add your first AI model to start detecting objects in videos</p>
            <button 
              className={styles.addButton}
              onClick={() => setIsAddingModel(true)}
            >
              <AddIcon />
              Add Your First Model
            </button>
          </div>
        ) : (
          models.map((model) => (
            <div key={model.id} className={styles.modelCard}>
              <div className={styles.modelHeader}>
                <div className={styles.modelIcon}>
                  <ModelIcon />
                </div>
                <div className={styles.modelInfo}>
                  <h3>{model.name}</h3>
                  <span className={styles.modelCategory}>{model.category}</span>
                </div>
                <div className={styles.modelActions}>
                  <button
                    className={styles.actionButton}
                    onClick={() => setEditingModel(model.id)}
                    title="Edit Model"
                  >
                    <EditIcon />
                  </button>
                  <button
                    className={styles.actionButton}
                    onClick={() => handleDeleteModel(model.id)}
                    title="Delete Model"
                  >
                    <DeleteIcon />
                  </button>
                </div>
              </div>

              <p className={styles.modelDescription}>{model.description}</p>

              <div className={styles.detectionClasses}>
                <h4>Detection Classes:</h4>
                <div className={styles.classesList}>
                  {model.detection_classes && model.detection_classes.split(',').map((cls, index) => (
                    <span key={index} className={styles.classTag}>
                      {cls.trim()}
                    </span>
                  ))}
                </div>
              </div>

              <div className={styles.modelStatus}>
                <div className={styles.statusInfo}>
                  <span className={`${styles.statusDot} ${model.model_file ? styles.active : styles.inactive}`}></span>
                  <span>{model.model_file ? 'Model Uploaded' : 'No Model File'}</span>
                </div>
                {model.model_file && (
                  <span className={styles.fileName}>{model.model_file}</span>
                )}
              </div>

              <div className={styles.uploadSection}>
                <label className={styles.uploadButton}>
                  <UploadIcon />
                  {model.model_file ? 'Replace Model File' : 'Upload Model File (.pt)'}
                  <input
                    type="file"
                    accept=".pt"
                    onChange={(e) => handleFileUpload(e, model.id)}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
