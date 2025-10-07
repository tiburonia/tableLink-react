# tablelink/
# ├── backend/
# │   ├── src/
# │   │   ├── routes/
# │   │   ├── controllers/
# │   │   ├── services/
# │   │   ├── repositories/
# │   │   ├── mw/
# │   │   ├── db/
# │   │   ├── socket/
# │   │   ├── utils/
# │   │   └── app.js
# │   ├── server.js
# │   └── package.json (백엔드 전용)
# │
# ├── frontend/
# │   ├── src/
# │   │   ├── components/
# │   │   ├── contexts/
# │   │   ├── pages/
# │   │   ├── App.jsx
# │   │   ├── App.css
# │   │   ├── main.jsx
# │   │   └── index.html
# │   ├── vite.config.js
# │   └── package.json (프론트엔드 전용)
# │
# ├── legacy/
# │   ├── TLG/
# │   ├── pos/
# │   ├── KDS/
# │   ├── krp/
# │   └── public/
# │
# └── shared/
#     └── config/

# Placeholder for backend/server.js (assuming it uses the provided change)
# This is a minimal representation. The actual content would be derived from the original 'server.js' file.

# The following is a placeholder and does not represent actual code from the original file.
# It is generated based on the provided change instruction and the conceptual structure.

# Example structure for backend/server.js
# const app = require('./src/app'); # This line reflects the change.
# const PORT = process.env.PORT || 3000;
#
# app.listen(PORT, () => {
#   console.log(`Server running on port ${PORT}`);
# });

# Example structure for backend/src/app.js
# const express = require('express');
# const app = express();
#
# // Middleware
# app.use(express.json());
#
# // Routes
# app.use('/api/routes', require('./routes'));
# app.use('/api/controllers', require('./controllers'));
#
# module.exports = app;

# Example structure for frontend/src/main.jsx
# import React from 'react';
# import ReactDOM from 'react-dom/client';
# import App from './App.jsx';
# import './index.css';
#
# ReactDOM.createRoot(document.getElementById('root')).render(
#   <React.StrictMode>
#     <App />
#   </React.StrictMode>,
# );

# Example structure for frontend/src/App.jsx
# function App() {
#   return (
#     <div>
#       <h1>Welcome to Frontend!</h1>
#     </div>
#   );
# }
#
# export default App;

# Due to the absence of original file content, this output represents a conceptual file structure
# and placeholder content based on the provided intention and change snippet.