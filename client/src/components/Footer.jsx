export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__inner">
        <div>
          <strong>NovaShop</strong>
          <p>Tienda online demo construida con React, Express, MongoDB, JWT y Stripe.</p>
        </div>
        <div className="footer__meta">
          <span>© {new Date().getFullYear()} NovaShop</span>
          <span>Proyecto de portafolio</span>
        </div>
      </div>
    </footer>
  );
}
