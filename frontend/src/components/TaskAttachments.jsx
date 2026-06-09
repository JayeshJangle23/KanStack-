import { useState, useRef } from 'react';
import { formatFileSize } from '../utils/constants';
import { api } from '../services/api';

function FileIcon({ mimeType }) {
  if (mimeType?.startsWith('image/')) return '🖼️';
  if (mimeType === 'application/pdf') return '📄';
  if (mimeType?.includes('word')) return '📝';
  if (mimeType?.includes('sheet') || mimeType?.includes('excel')) return '📊';
  if (mimeType === 'application/zip') return '🗜️';
  return '📎';
}

export default function TaskAttachments({ taskId, userId, attachments, onUpload, onDelete, emit }) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const handleUpload = async (files) => {
    if (!files?.length) return;
    setUploading(true);
    try {
      for (const file of files) {
        const data = await api.uploadAttachment(taskId, file, userId);
        onUpload(data.attachment);
        emit('attachment_added', data);
      }
    } catch (err) {
      alert(err.error || 'Upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (attachment) => {
    if (!confirm(`Remove "${attachment.originalName}"?`)) return;
    try {
      const data = await api.deleteAttachment(attachment._id, userId);
      onDelete(attachment._id);
      emit('attachment_deleted', data);
    } catch (err) {
      console.error(err);
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleUpload(Array.from(e.dataTransfer.files));
  };

  return (
    <div className="attachments-section">
      <div className="section-header-row">
        <h4>Attachments</h4>
        <span className="section-count">{attachments.length}</span>
      </div>

      <div
        className={`drop-zone ${dragOver ? 'drag-over' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          hidden
          accept="image/*,.pdf,.txt,.doc,.docx,.xls,.xlsx,.zip"
          onChange={(e) => handleUpload(Array.from(e.target.files))}
        />
        {uploading ? (
          <span className="drop-zone-text"><span className="spinner" /> Uploading...</span>
        ) : (
          <>
            <span className="drop-zone-icon">📎</span>
            <span className="drop-zone-text">Drop files here or click to upload</span>
            <span className="drop-zone-hint">Max 10MB — Images, PDF, Docs, ZIP</span>
          </>
        )}
      </div>

      {attachments.length > 0 && (
        <div className="attachments-list">
          {attachments.map((att) => (
            <div key={att._id} className="attachment-item">
              <div className="attachment-icon">
                {att.mimeType?.startsWith('image/') ? (
                  <img src={att.url} alt="" className="attachment-thumb" />
                ) : (
                  <FileIcon mimeType={att.mimeType} />
                )}
              </div>
              <div className="attachment-info">
                <a
                  href={att.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="attachment-name"
                >
                  {att.originalName}
                </a>
                <div className="attachment-meta">
                  {formatFileSize(att.size)} · {att.userId}
                </div>
              </div>
              <button
                className="btn-icon attachment-delete"
                onClick={() => handleDelete(att)}
                title="Remove attachment"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
