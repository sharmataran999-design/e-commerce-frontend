import axios from 'axios';
import dayjs from 'dayjs';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { CheckoutHeader } from './CheckoutHeader';
import './CheckoutPage.css';
import { formatMoney } from '../../utils/money';

function CartItemDetails({
  cartItem,
  product,
  productId,
  itemPriceCents,
  safeFormatMoney,
  handleDeleteCartItem,
  loadCart,
}) {
  const [isUpdatingQuantity, setIsUpdatingQuantity] = useState(false);
  const [quantity, setQuantity] = useState(Number(cartItem.quantity) || 1);

  const saveQuantity = async () => {
    const parsedQuantity = Number(quantity);

    if (Number.isNaN(parsedQuantity) || parsedQuantity < 1) {
      setQuantity(Number(cartItem.quantity) || 1);
      setIsUpdatingQuantity(false);
      return;
    }

    try {
      await axios.put(`/api/cart-items/${productId}`, {
        quantity: parsedQuantity,
      });
      if (loadCart) {
        await loadCart();
      }
      setIsUpdatingQuantity(false);
    } catch (error) {
      console.error('Error updating quantity:', error);
    }
  };

  const handleUpdateClick = async () => {
    if (isUpdatingQuantity) {
      await saveQuantity();
    } else {
      setQuantity(Number(cartItem.quantity) || 1);
      setIsUpdatingQuantity(true);
    }
  };

  const handleKeyDown = async (event) => {
    if (event.key === 'Enter') {
      await saveQuantity();
    } else if (event.key === 'Escape') {
      setQuantity(Number(cartItem.quantity) || 1);
      setIsUpdatingQuantity(false);
    }
  };

  return (
    <div className="cart-item-details">
      <div className="product-name">{product.name || 'Product'}</div>
      <div className="product-price">{safeFormatMoney(itemPriceCents)}</div>
      <div className="product-quantity">
        <span>
          Quantity:{' '}
          {isUpdatingQuantity ? (
            <input
              type="text"
              className="quantity-textbox"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
            />
          ) : (
            <span className="quantity-label">{Number(cartItem.quantity) || 1}</span>
          )}
        </span>
        <span
          className="update-quantity-link link-primary"
          onClick={handleUpdateClick}
        >
          Update
        </span>
        <span
          className="delete-quantity-link link-primary"
          onClick={() => handleDeleteCartItem(productId)}
        >
          Delete
        </span>
      </div>
    </div>
  );
}

export function CheckoutPage({ cartItems, cart, loadCart }) {
  const items = Array.isArray(cartItems) ? cartItems : Array.isArray(cart) ? cart : [];
  const navigate = useNavigate();

  const [deliveryOptions, setDeliveryOptions] = useState([]);
  const [selectedOptions, setSelectedOptions] = useState({});

  useEffect(() => {
    const fetchCheckoutData = async () => {
      try {
        const response = await axios.get(
          '/api/delivery-options?expand=estimatedDeliveryTime'
        );
        setDeliveryOptions(response.data || []);
      } catch (error) {
        console.error('Error fetching delivery options:', error);
      }
    };

    fetchCheckoutData();
  }, []);

  const handleDeliveryChange = async (productId, optionId) => {
    setSelectedOptions((prev) => ({
      ...prev,
      [productId]: optionId,
    }));

    try {
      await axios.put(`/api/cart-items/${productId}`, {
        deliveryOptionId: optionId,
      });
      if (loadCart) {
        await loadCart();
      }
    } catch (error) {
      console.error('Error updating delivery option:', error);
    }
  };

  const handleDeleteCartItem = async (productId) => {
    try {
      await axios.delete(`/api/cart-items/${productId}`);
      if (loadCart) {
        await loadCart();
      }
    } catch (error) {
      console.error('Error deleting cart item:', error);
    }
  };

  const createOrder = async () => {
    try {
      await axios.post('/api/orders');
      if (loadCart) {
        await loadCart();
      }
      navigate('/orders');
    } catch (error) {
      console.error('Error creating order:', error);
    }
  };

  const formatDeliveryDate = (option) => {
    if (!option) return 'Standard Delivery';
    if (option.estimatedDeliveryTimeMs) {
      return dayjs(option.estimatedDeliveryTimeMs).format('dddd, MMMM D');
    }
    if (option.deliveryDays !== undefined) {
      return dayjs().add(option.deliveryDays, 'day').format('dddd, MMMM D');
    }
    return 'Standard Delivery';
  };

  const getSelectedOption = (productId, fallbackOptionId) => {
    const selectedId = selectedOptions[productId] || fallbackOptionId;
    if (selectedId) {
      return deliveryOptions.find((opt) => (opt.id || opt._id) === selectedId) || deliveryOptions[0];
    }
    return deliveryOptions[0];
  };

  const getProductPriceCents = (product) => {
    if (!product) return 0;
    const rawPrice = product.priceCents ?? product.price ?? 0;
    const parsed = Number(rawPrice);
    return Number.isNaN(parsed) ? 0 : parsed;
  };

  const safeFormatMoney = (cents) => {
    const numericCents = Number(cents);
    const safeCents = !Number.isNaN(numericCents) ? numericCents : 0;
    try {
      const formatted = formatMoney(safeCents);
      if (formatted && !String(formatted).includes('NaN')) {
        return formatted;
      }
    } catch {
      // Fallback if utility throws an error
    }
    return `$${(safeCents / 100).toFixed(2)}`;
  };

  const totalItemsCount = items.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);

  const productCostCents = items.reduce((sum, item) => {
    const product = item.product || item;
    const priceCents = getProductPriceCents(product);
    const qty = Number(item.quantity) || 1;
    return sum + priceCents * qty;
  }, 0);

  const shippingCostCents = items.reduce((sum, item) => {
    const product = item.product || item;
    const productId = product.id || product._id || item.productId;
    const selectedOpt = getSelectedOption(productId, item.deliveryOptionId);
    const shippingCents = Number(selectedOpt?.priceCents) || 0;
    return sum + shippingCents;
  }, 0);

  const totalBeforeTaxCents = productCostCents + shippingCostCents;
  const estimatedTaxCents = Math.round(totalBeforeTaxCents * 0.1);
  const orderTotalCents = totalBeforeTaxCents + estimatedTaxCents;

  return (
    <>
      <CheckoutHeader cart={items} />

      <div className="checkout-page">
        <div className="page-title">Review your order</div>

        <div className="checkout-grid">
          <div className="order-summary">
            {items.length === 0 ? (
              <div className="empty-cart-message">Your cart is empty.</div>
            ) : (
              items.map((cartItem, itemIndex) => {
                const product = cartItem.product || cartItem;
                const productId =
                  product.id || product._id || cartItem.productId || `item-${itemIndex}`;
                const selectedOption = getSelectedOption(productId, cartItem.deliveryOptionId);
                const itemPriceCents = getProductPriceCents(product);

                return (
                  <div className="cart-item-container" key={productId}>
                    <div className="delivery-date">
                      Delivery date: {formatDeliveryDate(selectedOption)}
                    </div>

                    <div className="cart-item-details-grid">
                      <img
                        className="product-image"
                        src={product.image || 'images/products/athletic-cotton-socks-6-pairs.jpg'}
                        alt={product.name || 'Product'}
                      />

                      <CartItemDetails
                        cartItem={cartItem}
                        product={product}
                        productId={productId}
                        itemPriceCents={itemPriceCents}
                        safeFormatMoney={safeFormatMoney}
                        handleDeleteCartItem={handleDeleteCartItem}
                        loadCart={loadCart}
                      />

                      <div className="delivery-options">
                        <div className="delivery-options-title">Choose a delivery option:</div>

                        {deliveryOptions.length > 0 ? (
                          deliveryOptions.map((deliveryOption, index) => {
                            const optionId =
                              deliveryOption.id || deliveryOption._id || `opt-${index}`;
                            const optionPrice = Number(deliveryOption.priceCents) || 0;
                            const priceString =
                              optionPrice > 0
                                ? `${safeFormatMoney(optionPrice)} - Shipping`
                                : 'FREE Shipping';

                            const activeOptionId =
                              selectedOptions[productId] || cartItem.deliveryOptionId;
                            const isChecked = activeOptionId
                              ? activeOptionId === optionId
                              : index === 0;

                            return (
                              <div
                                className="delivery-option"
                                key={optionId}
                                onClick={() => handleDeliveryChange(productId, optionId)}
                                style={{ cursor: 'pointer' }}
                              >
                                <input
                                  type="radio"
                                  checked={isChecked}
                                  onChange={() => {}}
                                  className="delivery-option-input"
                                  name={`delivery-option-${productId}`}
                                />

                                <div>
                                  <div className="delivery-option-date">
                                    {formatDeliveryDate(deliveryOption)}
                                  </div>
                                  <div className="delivery-option-price">{priceString}</div>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="loading-delivery">Loading options...</div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="payment-summary">
            <div className="payment-summary-title">Payment Summary</div>

            <div
              className="payment-summary-row"
              style={{ display: 'flex', justifyContent: 'space-between' }}
            >
              <div>Items ({totalItemsCount}):</div>
              <div className="payment-summary-money">{safeFormatMoney(productCostCents)}</div>
            </div>

            <div
              className="payment-summary-row"
              style={{ display: 'flex', justifyContent: 'space-between' }}
            >
              <div>Shipping &amp; handling:</div>
              <div className="payment-summary-money">{safeFormatMoney(shippingCostCents)}</div>
            </div>

            <div
              className="payment-summary-row subtotal-row"
              style={{ display: 'flex', justifyContent: 'space-between' }}
            >
              <div>Total before tax:</div>
              <div className="payment-summary-money">{safeFormatMoney(totalBeforeTaxCents)}</div>
            </div>

            <div
              className="payment-summary-row"
              style={{ display: 'flex', justifyContent: 'space-between' }}
            >
              <div>Estimated tax (10%):</div>
              <div className="payment-summary-money">{safeFormatMoney(estimatedTaxCents)}</div>
            </div>

            <div
              className="payment-summary-row total-row"
              style={{ display: 'flex', justifyContent: 'space-between' }}
            >
              <div>Order total:</div>
              <div className="payment-summary-money">{safeFormatMoney(orderTotalCents)}</div>
            </div>

            <button
              className="place-order-button button-primary"
              onClick={createOrder}
            >
              Place your order
            </button>
          </div>
        </div>
      </div>
    </>
  );
}