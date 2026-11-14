import axios from 'axios';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import { Header } from '../../components/Header';
import { ProductsGrid } from './ProductsGrid';
import './Homepage.css';

export function HomePage({ cart, loadCart }) {
  const [products, setProducts] = useState([]);
  const [searchParams] = useSearchParams();
  const search = searchParams.get('search') || '';

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const url = search
          ? `/api/products?search=${encodeURIComponent(search)}`
          : '/api/products';
        const response = await axios.get(url);
        const allProducts = response.data || [];

        if (search.trim()) {
          const query = search.trim().toLowerCase();
          const filtered = allProducts.filter((product) => {
            const nameMatch = (product.name || '').toLowerCase().includes(query);
            const keywordMatch = Array.isArray(product.keywords)
              ? product.keywords.some((kw) => kw.toLowerCase().includes(query))
              : false;
            return nameMatch || keywordMatch;
          });
          setProducts(filtered);
        } else {
          setProducts(allProducts);
        }
      } catch (error) {
        console.error('Error fetching products:', error);
      }
    };

    fetchProducts();
  }, [search]);

  return (
    <>
      <Header cart={cart} />

      <div className="home-page">
        <ProductsGrid products={products} loadCart={loadCart} />
      </div>
    </>
  );
}