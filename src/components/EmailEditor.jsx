import { useRef } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const modules = {
  toolbar: [
    [{ 'header': [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    ['blockquote', 'code-block'],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    [{ 'align': [] }],
    ['link'],
    ['clean'],
  ],
};

const formats = [
  'header',
  'bold', 'italic', 'underline', 'strike',
  'blockquote', 'code-block',
  'list', 'bullet',
  'align',
  'link',
];

export function EmailEditor({ value, onChange, placeholder = '' }) {
  const containerRef = useRef(null);

  const handleChange = (content) => {
    onChange(content);
    // Scroll to bottom of container after state update
    requestAnimationFrame(() => {
      const container = containerRef.current?.querySelector('.ql-container');
      if (container) {
        // Scroll to the bottom to show the newly pasted content
        container.scrollTop = container.scrollHeight;
      }
    });
  };

  return (
    <div style={{ marginBottom: '16px' }} ref={containerRef}>
      <style>{`
        .email-editor .ql-container {
          border: 1px solid rgba(0, 0, 0, 0.12);
          border-radius: 0 0 10px 10px;
          font-size: 14px;
          max-height: 106px;
          overflow: auto;
        }
        .email-editor .ql-editor {
          min-height: 105px;
          padding: 12px 16px;
          font-family: inherit;
        }
        .email-editor .ql-toolbar {
          border: 1px solid rgba(0, 0, 0, 0.12);
          border-radius: 10px 10px 0 0;
          background: #f9fafb;
        }
        .email-editor .ql-toolbar.ql-snow .ql-formats {
          margin-right: 15px;
        }
        .email-editor .ql-toolbar.ql-snow .ql-stroke {
          stroke: #64748b;
        }
        .email-editor .ql-toolbar.ql-snow .ql-fill {
          fill: #64748b;
        }
        .email-editor .ql-toolbar.ql-snow button:hover .ql-stroke,
        .email-editor .ql-toolbar.ql-snow button.ql-active .ql-stroke {
          stroke: #6366f1;
        }
        .email-editor .ql-toolbar.ql-snow button:hover .ql-fill,
        .email-editor .ql-toolbar.ql-snow button.ql-active .ql-fill {
          fill: #6366f1;
        }
      `}</style>
      <div className="email-editor">
        <ReactQuill
          value={value || ''}
          onChange={handleChange}
          modules={modules}
          formats={formats}
          placeholder={placeholder}
        />
      </div>
    </div>
  );
}
