/**
 * 비회원 TLL API 라우터
 * - QR 주문, 메뉴 조회, 주문 생성, 결제 처리
 */

const { Router } = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');

const router = Router();

/**
 * GET /api/guest/stores/:storeId/tables/:tableNumber
 * 테이블 정보 조회
 */
router.get('/stores/:storeId/tables/:tableNumber', async (req, res) => {
    try {
        const { storeId, tableNumber } = req.params;

        // 매장 정보 조회
        const storeResult = await db.query(
            'SELECT id, name, address FROM stores WHERE id = $1',
            [storeId]
        );

        if (storeResult.rows.length === 0) {
            return res.json({
                success: false,
                message: '매장을 찾을 수 없습니다'
            });
        }

        // 테이블 정보 조회
        const tableResult = await db.query(
            'SELECT id, table_number FROM tables WHERE store_id = $1 AND table_number = $2',
            [storeId, tableNumber]
        );

        if (tableResult.rows.length === 0) {
            return res.json({
                success: false,
                message: '테이블을 찾을 수 없습니다'
            });
        }

        res.json({
            success: true,
            store: {
                id: storeResult.rows[0].id,
                name: storeResult.rows[0].name,
                address: storeResult.rows[0].address
            },
            table: {
                id: tableResult.rows[0].id,
                tableNumber: parseInt(tableResult.rows[0].table_number)
            }
        });

    } catch (error) {
        console.error('❌ 테이블 정보 조회 실패:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다'
        });
    }
});

/**
 * POST /api/guest/sessions
 * 비회원 세션 생성
 */
router.post('/sessions', async (req, res) => {
    try {
        const { storeId, tableNumber } = req.body;

        if (!storeId || !tableNumber) {
            return res.json({
                success: false,
                message: '필수 정보가 누락되었습니다'
            });
        }

        // 세션 ID 생성
        const sessionId = uuidv4();

        // 세션 정보를 DB에 저장 (guest_sessions 테이블)
        await db.query(
            `INSERT INTO guest_sessions (session_id, store_id, table_number, created_at, expires_at)
             VALUES ($1, $2, $3, NOW(), NOW() + INTERVAL '4 hours')`,
            [sessionId, storeId, tableNumber]
        );

        res.json({
            success: true,
            sessionId
        });

    } catch (error) {
        console.error('❌ 세션 생성 실패:', error);
        res.status(500).json({
            success: false,
            message: '세션 생성에 실패했습니다'
        });
    }
});

/**
 * GET /api/guest/stores/:storeId
 * 매장 정보 조회
 */
router.get('/stores/:storeId', async (req, res) => {
    try {
        const { storeId } = req.params;

        const result = await db.query(
            'SELECT id, name, address, phone FROM stores WHERE id = $1',
            [storeId]
        );

        if (result.rows.length === 0) {
            return res.json({
                success: false,
                message: '매장을 찾을 수 없습니다'
            });
        }

        res.json({
            success: true,
            store: {
                id: result.rows[0].id,
                name: result.rows[0].name,
                address: result.rows[0].address,
                phone: result.rows[0].phone
            }
        });

    } catch (error) {
        console.error('❌ 매장 정보 조회 실패:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다'
        });
    }
});

/**
 * GET /api/guest/stores/:storeId/menus
 * 메뉴 목록 조회
 */
router.get('/stores/:storeId/menus', async (req, res) => {
    try {
        const { storeId } = req.params;

        const result = await db.query(
            `SELECT id, name, category, price, description, image_url
             FROM menus
             WHERE store_id = $1 AND is_available = true
             ORDER BY category, name`,
            [storeId]
        );

        const menus = result.rows.map(row => ({
            id: row.id,
            name: row.name,
            category: row.category || '전체',
            price: parseInt(row.price),
            description: row.description,
            image: row.image_url
        }));

        res.json({
            success: true,
            menus
        });

    } catch (error) {
        console.error('❌ 메뉴 조회 실패:', error);
        res.status(500).json({
            success: false,
            message: '메뉴를 불러올 수 없습니다'
        });
    }
});

/**
 * POST /api/guest/orders
 * 비회원 주문 생성
 */
router.post('/orders', async (req, res) => {
    const client = await db.pool.connect();

    try {
        const { sessionId, storeId, tableNumber, items } = req.body;

        if (!sessionId || !storeId || !tableNumber || !items || items.length === 0) {
            return res.json({
                success: false,
                message: '필수 정보가 누락되었습니다'
            });
        }

        // 세션 확인
        const sessionResult = await client.query(
            'SELECT * FROM guest_sessions WHERE session_id = $1 AND expires_at > NOW()',
            [sessionId]
        );

        if (sessionResult.rows.length === 0) {
            return res.json({
                success: false,
                message: '세션이 만료되었습니다'
            });
        }

        await client.query('BEGIN');

        // 총 금액 계산
        const totalAmount = items.reduce((sum, item) => 
            sum + (item.unitPrice * item.quantity), 0
        );

        // 주문 생성
        const orderResult = await client.query(
            `INSERT INTO orders (store_id, table_number, total_amount, order_type, status, created_at)
             VALUES ($1, $2, $3, 'TLL_GUEST', 'PENDING', NOW())
             RETURNING id`,
            [storeId, tableNumber, totalAmount]
        );

        const orderId = orderResult.rows[0].id;

        // 주문 아이템 저장
        for (const item of items) {
            await client.query(
                `INSERT INTO order_items (order_id, menu_id, menu_name, quantity, unit_price, total_price)
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [
                    orderId,
                    item.menuId,
                    item.menuName,
                    item.quantity,
                    item.unitPrice,
                    item.unitPrice * item.quantity
                ]
            );
        }

        await client.query('COMMIT');

        res.json({
            success: true,
            orderId,
            totalAmount
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ 주문 생성 실패:', error);
        res.status(500).json({
            success: false,
            message: '주문 생성에 실패했습니다'
        });
    } finally {
        client.release();
    }
});

/**
 * POST /api/guest/payments
 * 결제 처리
 */
router.post('/payments', async (req, res) => {
    const client = await db.pool.connect();

    try {
        const { orderId, amount, paymentMethod } = req.body;

        if (!orderId || !amount) {
            return res.json({
                success: false,
                message: '필수 정보가 누락되었습니다'
            });
        }

        await client.query('BEGIN');

        // 결제 기록 생성
        const paymentResult = await client.query(
            `INSERT INTO payments (order_id, amount, payment_method, status, paid_at)
             VALUES ($1, $2, $3, 'COMPLETED', NOW())
             RETURNING id`,
            [orderId, amount, paymentMethod || 'CARD']
        );

        const paymentId = paymentResult.rows[0].id;

        // 주문 상태 업데이트
        await client.query(
            `UPDATE orders SET status = 'PAID', updated_at = NOW() WHERE id = $1`,
            [orderId]
        );

        await client.query('COMMIT');

        res.json({
            success: true,
            paymentId
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ 결제 처리 실패:', error);
        res.status(500).json({
            success: false,
            message: '결제 처리에 실패했습니다'
        });
    } finally {
        client.release();
    }
});

module.exports = router;
