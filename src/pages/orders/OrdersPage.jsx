import axios from 'axios';
import dayjs from 'dayjs';
import { useState, useEffect, Fragment } from 'react';
import { Header } from '../../components/Header';
import './OrdersPage.css';
import { Link } from 'react-router';
import { formatMoney } from '../../utils/money';

export function OrdersPage({ cart }) {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const fetchOrdersData = async () => {
      try {
        const response = await axios.get('/api/orders?expand=products');
        setOrders(response.data || []);
      } catch (error) {
        console.error('Error fetching orders:', error);
      }
    };

    fetchOrdersData();
  }, []);

  const safeFormatMoney = (cents) => {
    const safeCents = typeof cents === 'number' && !Number.isNaN(cents) ? cents : 0;
    try {
      const formatted = formatMoney(safeCents);
      if (formatted !== undefined && formatted !== null && formatted !== '') {
        return formatted;
      }
    } catch {
      // Fallback formatting
    }
    return `$${(safeCents / 100).toFixed(2)}`;
  };

  const safeFormatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = dayjs(timestamp);
    return date.isValid() ? date.format('MMMM D') : 'N/A';
  };

  return (
    <>
      <Header cart={cart} />

      <div className="orders-page">
        <div className="page-title">Your Orders</div>

        <div className="orders-grid">
          {orders.map((order, orderIndex) => {
            const orderKey = order?.id || order?._id || `order-${orderIndex}`;

            return (
              <div key={orderKey} className="order-container">
                <div className="order-header">
                  <div className="order-header-left-section">
                    <div className="order-date">
                      <div className="order-header-label">Order Placed:</div>
                      <div>{safeFormatDate(order?.orderTimeMs)}</div>
                    </div>
                    <div className="order-total">
                      <div className="order-header-label">Total:</div>
                      <div>{safeFormatMoney(order?.totalCostCents)}</div>
                    </div>
                  </div>

                  <div className="order-header-right-section">
                    <div className="order-header-label">Order ID:</div>
                    <div>{order?.id || order?._id || 'N/A'}</div>
                  </div>
                </div>

                <div className="order-details-grid">
                  {(order?.products || []).map((orderProduct, productIndex) => {
                    const product = orderProduct?.product || orderProduct || {};

                    const productId =
                      product?.id ||
                      orderProduct?.productId ||
                      `prod-${orderKey}-${productIndex}`;

                    return (
                      <Fragment key={productId}>
                        <div className="product-image-container">
                          <img
                            src={product?.image || 'images/products/athletic-cotton-socks-6-pairs.jpg'}
                            alt={product?.name || 'Product'}
                          />
                        </div>

                        <div className="product-details">
                          <div className="product-name">
                            {product?.name || 'Product Name Unavailable'}
                          </div>
                          <div className="product-delivery-date">
                            Arriving on: {safeFormatDate(orderProduct?.estimatedDeliveryTimeMs)}
                          </div>
                          <div className="product-quantity">
                            Quantity: {orderProduct?.quantity || 1}
                          </div>
                          <button className="buy-again-button button-primary">
                            <img
                              className="buy-again-icon"
                              src="images/icons/buy-again.png"
                              alt="Buy again"
                            />
                            <span className="buy-again-message">Add to Cart</span>
                          </button>
                        </div>

                        <div className="product-actions">
                          <Link to={`/tracking/${orderKey}/${productId}`}>
                            <button className="track-package-button button-secondary">
                              Track package
                            </button>
                          </Link>
                        </div>
                      </Fragment>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}