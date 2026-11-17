import './CheckoutHeader.css';
import { Link } from 'react-router-dom';

export function CheckoutHeader({ cart = [] }) {
  let totalQuantity = 0;

  cart.forEach((cartItem) => {
    totalQuantity += Number(cartItem.quantity) || 0;
  });

  return (
    <div className="checkout-header">
      <div className="header-content">
        <div className="checkout-header-left-section">
          <Link to="/">
            <img className="logo" src="/images/logo.png" alt="Logo" />
            <img className="mobile-logo" src="/images/mobile-logo.png" alt="Mobile Logo" />
          </Link>
        </div>

        <div className="checkout-header-middle-section">
          Checkout (
          <Link className="return-to-home-link" to="/">
            {totalQuantity} {totalQuantity === 1 ? 'item' : 'items'}
          </Link>
          )
        </div>

        <div className="checkout-header-right-section">
          <img src="/images/icons/checkout-lock-icon.png" alt="Lock" />
        </div>
      </div>
    </div>
  );
}