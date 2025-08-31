require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { notFound, errorHandler } = require('./mw/errors');
const { Pool } = require('pg'); // Import Pool for managing database connections

const app = express();
const PORT = process.env.PORT || 5000;

// Global pool for database operations
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Basic Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: {
    message: 'Too many requests from this IP, please try again after 15 minutes',
    code: 'RATE_LIMIT_EXCEEDED'
  }
});
app.use('/api/', limiter);

// Static file serving
app.use(express.static('public'));

// Router connection
try {
  const posRoutes = require('./routes/pos');
  const kdsRoutes = require('./routes/kds'); // KDS routes
  const krpRoutes = require('./routes/krp');

  app.use('/api/pos', posRoutes);
  app.use('/api/kds', kdsRoutes); // Mount KDS routes
  app.use('/api/payments', krpRoutes);

  console.log('✅ 라우터 로드 완료');
} catch (error) {
  console.error('❌ 라우터 로드 실패:', error);
  process.exit(1);
}

// Health Check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// Error Handling
app.use(notFound);
app.use(errorHandler);

// PostgreSQL LISTEN setting (KDS Real-time Notifications)
const sse = require('./services/sse');

async function setupKDSListener() {
  const client = new Pool({ // Use Pool for client management
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  try {
    await client.connect();
    await client.query('LISTEN kds_line_events');

    client.on('notification', async (msg) => {
      try {
        const payload = JSON.parse(msg.payload);
        console.log('📡 KDS 이벤트 수신:', payload);

        // Get store_id from order_id
        if (payload.order_id) {
          const storeResult = await pool.query(`
            SELECT c.store_id, c.table_number, c.customer_name
            FROM orders o
            JOIN checks c ON o.check_id = c.id
            WHERE o.id = $1
          `, [payload.order_id]);

          if (storeResult.rows.length > 0) {
            const { store_id, table_number, customer_name } = storeResult.rows[0];
            const topic = `store:${store_id}`;

            // Broadcast to subscribers of the specific storeId
            sse.broadcast(topic, {
              type: 'line_update',
              data: {
                ...payload,
                store_id,
                table_number,
                customer_name
              },
              timestamp: new Date().toISOString()
            });
          }
        }
      } catch (error) {
        console.error('❌ KDS 이벤트 처리 실패:', error);
      }
    });

    console.log('👂 PostgreSQL LISTEN kds_line_events 준비완료');
  } catch (error) {
    console.error('❌ PostgreSQL LISTEN 설정 실패:', error);
  } finally {
    // In a real application, you might want to handle client disconnection and reconnection more robustly.
    // For this example, we'll rely on the Pool to manage connections.
  }
}

// Start Server
app.listen(PORT, '0.0.0.0', async () => {
  console.log(`🚀 TableLink POS 서버가 포트 ${PORT}에서 실행 중입니다.`);
  console.log(`📱 http://localhost:${PORT} 에서 접속 가능합니다.`);
  console.log('🏗️ POS/KDS/TLL/KRP 통합 시스템');

  // Setup KDS LISTEN
  await setupKDSListener();
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 서버 종료 중...');
  pool.end().then(() => {
    console.log('👋 PostgreSQL 풀 종료됨.');
    process.exit(0);
  }).catch(err => {
    console.error('❌ PostgreSQL 풀 종료 오류:', err);
    process.exit(1);
  });
});

process.on('SIGINT', () => {
  console.log('👋 서버 종료 중...');
  pool.end().then(() => {
    console.log('👋 PostgreSQL 풀 종료됨.');
    process.exit(0);
  }).catch(err => {
    console.error('❌ PostgreSQL 풀 종료 오류:', err);
    process.exit(1);
  });
});