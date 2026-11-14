import axios from 'axios';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router';
import { Header } from '../components/Header';
import './tracking.css';

export function TrackingPage({ cart }) {
  const { orderId, productId } = useParams();
  const [order, setOrder] = useState(null);

  useEffect(() => {
    const fetchTrackingData = async () => {
      try {
        const response = await axios.get(`/api/orders/${orderId}?expand=products`);
        setOrder(response.data);
      } catch {
        try {
          const allOrdersRes = await axios.get('/api/orders?expand=products');
          const matchedOrder = (allOrdersRes.data || []).find(
            (o) => String(o.id || o._id) === String(orderId)
          );
          setOrder(matchedOrder || null);
        } catch (error) {
          console.error('Error fetching tracking details:', error);
        }
      }
    };

    fetchTrackingData();
  }, [orderId]);

  if (!order) {
    return null;
  }

  const orderProduct = (order.products || []).find(
    (item) => String(item.product?.id || item.productId) === String(productId)
  );

  const product = orderProduct?.product || orderProduct;

  // Calculate delivery progress percentage
  const totalDeliveryTimeMs =
    (orderProduct?.estimatedDeliveryTimeMs || 0) - (order.orderTimeMs || 0);
  const timePassedMs = dayjs().valueOf() - (order.orderTimeMs || 0);

  let deliveryPercent =
    totalDeliveryTimeMs > 0 ? (timePassedMs / totalDeliveryTimeMs) * 100 : 100;

  if (deliveryPercent > 100) {
    deliveryPercent = 100;
  } else if (deliveryPercent < 0) {
    deliveryPercent = 0;
  }

  // 7n: Status checks
  const isPreparing = deliveryPercent < 33;
  const isShipped = deliveryPercent >= 33 && deliveryPercent < 100;
  const isDelivered = deliveryPercent === 100;

  return (
    <>
      <title>Tracking</title>
      <Header cart={cart} />

      <div className="tracking-page">
        <div className="order-tracking">
          <Link className="back-to-orders-link link-primary" to="/orders">
            View all orders
          </Link>

          {/* 7m: Display "Delivered on" if percent >= 100, else "Arriving on" */}
          <div className="delivery-date">
            {deliveryPercent >= 100 ? 'Delivered on' : 'Arriving on'}{' '}
            {dayjs(orderProduct?.estimatedDeliveryTimeMs).format('dddd, MMMM D')}
          </div>

          <div className="product-info">
            {product?.name}
          </div>

          <div className="product-info">
            Quantity: {orderProduct?.quantity}
          </div>

          {product?.image && (
            <img
              className="product-image"
              src={product.image.startsWith('/') ? product.image : `/${product.image}`}
              alt={product?.name}
            />
          )}

          {/* 7n: Highlight active status label in green */}
          <div className="progress-labels-container">
            <div className={`progress-label ${isPreparing && 'current-status'}`}>
              Preparing
            </div>
            <div className={`progress-label ${isShipped && 'current-status'}`}>
              Shipped
            </div>
            <div className={`progress-label ${isDelivered && 'current-status'}`}>
              Delivered
            </div>
          </div>

          <div className="progress-bar-container">
            <div
              className="progress-bar"
              style={{ width: `${deliveryPercent}%` }}
            ></div>
          </div>
        </div>
      </div>
    </>
  );
}